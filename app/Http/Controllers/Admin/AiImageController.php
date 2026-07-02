<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\MiniMaxApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateImageRequest;
use App\Models\MediaItem;
use App\Services\MiniMaxImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AiImageController extends Controller
{
    public function generate(GenerateImageRequest $request): RedirectResponse
    {
        $service = MiniMaxImageService::fromConfig();
        $validated = $request->validated();

        try {
            if ($validated['mode'] === 'image-to-image') {
                $reference = Media::findOrFail($validated['reference_image_id']);
                $referenceUrl = $reference->getUrl();

                $response = $service->imageToImage(
                    prompt: $validated['prompt'],
                    referenceImageUrl: $referenceUrl,
                    options: [
                        'aspect_ratio' => $validated['aspect_ratio'] ?? '1:1',
                        'n' => $validated['n'] ?? 1,
                        'seed' => $validated['seed'] ?? null,
                        'prompt_optimizer' => $validated['prompt_optimizer'] ?? false,
                        'model' => $validated['model'] ?? 'image-01-live',
                    ],
                );
            } else {
                $response = $service->textToImage(
                    prompt: $validated['prompt'],
                    options: [
                        'aspect_ratio' => $validated['aspect_ratio'] ?? '1:1',
                        'n' => $validated['n'] ?? 1,
                        'seed' => $validated['seed'] ?? null,
                        'prompt_optimizer' => $validated['prompt_optimizer'] ?? false,
                        'model' => $validated['model'] ?? null,
                    ],
                );
            }

            $imageUrls = $response['image_urls'] ?? [];
            if (empty($imageUrls)) {
                return back()->with('error', 'MiniMax no devolvió imágenes.');
            }

            $count = 0;
            foreach ($imageUrls as $index => $url) {
                $tmpPath = $service->downloadImage($url);

                $item = MediaItem::create([
                    'name' => 'AI: '.Str::limit($validated['prompt'], 30).($index > 0 ? " ({$index})" : ''),
                    'user_id' => $request->user()?->id,
                ]);

                $item->addMedia($tmpPath)
                    ->usingFileName('ai_'.Str::random(10).'_'.basename(parse_url($url, PHP_URL_PATH) ?: 'image.jpg'))
                    ->toMediaCollection('uploads', 'public');

                $service->cleanupTemp($tmpPath);
                $count++;
            }

            return back()->with('success', "{$count} imagen(es) generada(s) y guardada(s) en la biblioteca.");
        } catch (MiniMaxApiException $e) {
            Log::warning('MiniMax API error', [
                'status_code' => $e->statusCode,
                'http_status' => $e->httpStatus,
                'message' => $e->getMessage(),
                'user_id' => $request->user()?->id,
            ]);

            return back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            Log::error('AI image generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()?->id,
            ]);

            return back()->with('error', 'Error al generar la imagen: '.$e->getMessage());
        }
    }
}
