<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin', [
            'storageLinked' => StorageController::isLinked(),
            'socketStats' => $this->fetchSocketStats(),
        ]);
    }

    public function socketStats(): JsonResponse
    {
        return response()->json($this->fetchSocketStats());
    }

    protected function fetchSocketStats(): array
    {
        $connections = $this->reverbRequest('GET', '/apps/'.env('REVERB_APP_ID').'/connections');
        $channels = $this->reverbRequest('GET', '/apps/'.env('REVERB_APP_ID').'/channels', ['info' => 'user_count']);

        return [
            'connections' => $connections['connections'] ?? null,
            'channels' => $channels ? $this->formatChannels($channels) : null,
        ];
    }

    protected function reverbRequest(string $method, string $path, array $extraParams = []): ?array
    {
        $timestamp = now()->timestamp;
        $appKey = env('REVERB_APP_KEY');
        $appSecret = env('REVERB_APP_SECRET');

        $params = array_merge([
            'auth_key' => $appKey,
            'auth_timestamp' => $timestamp,
            'auth_version' => '1.0',
        ], $extraParams);

        ksort($params);

        $signature = implode("\n", [$method, $path, http_build_query($params)]);
        $params['auth_signature'] = hash_hmac('sha256', $signature, $appSecret);

        try {
            $baseUrl = sprintf(
                '%s://%s:%s',
                env('REVERB_BROADCASTER_SCHEME', 'http'),
                env('REVERB_BROADCASTER_HOST', '127.0.0.1'),
                env('REVERB_BROADCASTER_PORT', '3015'),
            );
            $response = Http::timeout(3)->get($baseUrl.$path, $params);

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function formatChannels(array $data): array
    {
        $channels = $data['channels'] ?? [];
        $result = [];
        foreach ($channels as $name => $info) {
            $result[] = [
                'name' => $name,
                'user_count' => $info['user_count'] ?? 0,
                'occupied' => $info['occupied'] ?? false,
            ];
        }
        usort($result, fn ($a, $b) => $b['user_count'] - $a['user_count']);

        return $result;
    }
}
