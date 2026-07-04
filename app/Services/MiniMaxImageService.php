<?php

namespace App\Services;

use App\Exceptions\MiniMaxApiException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MiniMaxImageService
{
    public function __construct(
        protected string $apiKey,
        protected string $baseUrl,
        protected string $defaultModel,
        protected int $timeout = 120,
    ) {}

    public static function fromConfig(): self
    {
        return new self(
            apiKey: (string) config('minimax.api_key'),
            baseUrl: (string) config('minimax.base_url'),
            defaultModel: (string) config('minimax.default_model'),
            timeout: (int) config('minimax.timeout', 120),
        );
    }

    public function textToImage(string $prompt, array $options = []): array
    {
        return $this->generate([
            'model' => $options['model'] ?? $this->defaultModel,
            'prompt' => $prompt,
            'aspect_ratio' => $options['aspect_ratio'] ?? '1:1',
            'n' => $options['n'] ?? 1,
            'response_format' => 'base64',
            'seed' => $options['seed'] ?? null,
            'prompt_optimizer' => $options['prompt_optimizer'] ?? false,
        ]);
    }

    public function imageToImage(string $prompt, string $referenceImageUrl, array $options = []): array
    {
        return $this->generate([
            'model' => $options['model'] ?? 'image-01',
            'prompt' => $prompt,
            'aspect_ratio' => $options['aspect_ratio'] ?? '1:1',
            'n' => $options['n'] ?? 1,
            'response_format' => 'base64',
            'seed' => $options['seed'] ?? null,
            'prompt_optimizer' => $options['prompt_optimizer'] ?? false,
            'subject_reference' => [
                [
                    'type' => 'character',
                    'image_file' => $referenceImageUrl,
                ],
            ],
        ]);
    }

    public function downloadImage(string $url): string
    {
        $response = Http::timeout($this->timeout)->get($url);

        if (! $response->successful()) {
            throw new \RuntimeException("Failed to download image from {$url}");
        }

        $tmpDir = 'tmp/ai-images';
        Storage::disk('public')->makeDirectory($tmpDir);

        $filename = uniqid('ai_', true).'.jpg';
        $path = $tmpDir.'/'.$filename;

        Storage::disk('public')->put($path, $response->body());

        return Storage::disk('public')->path($path);
    }

    public function cleanupTemp(string $absolutePath): void
    {
        if (file_exists($absolutePath)) {
            @unlink($absolutePath);
        }
    }

    protected function generate(array $payload): array
    {
        $payload = array_filter($payload, fn ($v) => $v !== null);

        Log::info('MiniMax image generation request', [
            'model' => $payload['model'] ?? null,
            'prompt_length' => strlen((string) $payload['prompt']),
            'n' => $payload['n'] ?? 1,
        ]);

        $response = Http::withToken($this->apiKey)
            ->timeout($this->timeout)
            ->acceptJson()
            ->asJson()
            ->post(rtrim($this->baseUrl, '/').'/v1/image_generation', $payload);

        if (! $response->successful()) {
            throw new MiniMaxApiException(
                message: 'MiniMax API HTTP error: '.$response->status(),
                statusCode: 1002,
                httpStatus: $response->status(),
            );
        }

        $json = $response->json();
        $baseResp = $json['base_resp'] ?? [];
        $statusCode = (int) ($baseResp['status_code'] ?? -1);

        if ($statusCode !== 0) {
            throw new MiniMaxApiException(
                message: $this->humanError($statusCode, (string) ($baseResp['status_msg'] ?? '')),
                statusCode: $statusCode,
                httpStatus: 200,
            );
        }

        return [
            'image_base64' => $json['data']['image_base64'] ?? [],
            'metadata' => $json['metadata'] ?? [],
            'id' => $json['id'] ?? null,
        ];
    }

    protected function humanError(int $code, string $default): string
    {
        return match ($code) {
            1002 => 'Demasiadas solicitudes, espera un momento.',
            1004, 2049 => 'API key de MiniMax inválida. Contacta al administrador.',
            1008 => 'Saldo insuficiente en la cuenta de MiniMax.',
            1026 => 'El prompt contiene contenido sensible. Reformúlalo.',
            2013 => 'Parámetros inválidos enviados a MiniMax.',
            default => $default !== '' ? $default : "Error de MiniMax (código {$code}).",
        };
    }
}
