<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\MiniMaxApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateImageRequest;
use App\Models\MediaItem;
use App\Services\MiniMaxImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AiImageController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('admin/media/ai');
    }

    public function generate(GenerateImageRequest $request): \Symfony\Component\HttpFoundation\Response
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
                        'model' => $validated['model'] ?? 'image-01',
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

            $imageBase64 = $response['image_base64'] ?? [];
            if (empty($imageBase64)) {
                return redirect()->route('admin.media.ai')->with('error', 'MiniMax no devolvió imágenes.');
            }

            $count = 0;
            $results = [];
            foreach ($imageBase64 as $index => $b64) {
                $binary = base64_decode($b64, true);

                if ($binary === false) {
                    continue;
                }

                $tmpDir = 'tmp/ai-images';
                Storage::disk('public')->makeDirectory($tmpDir);
                $filename = uniqid('ai_', true).'_'.$index.'.jpg';
                $tmpPath = $tmpDir.'/'.$filename;
                Storage::disk('public')->put($tmpPath, $binary);
                $tmpAbsPath = Storage::disk('public')->path($tmpPath);

                $item = MediaItem::create([
                    'name' => 'AI: '.Str::limit($validated['prompt'], 30).($index > 0 ? " ({$index})" : ''),
                    'user_id' => $request->user()?->id,
                ]);

                $media = $item->addMedia($tmpAbsPath)
                    ->usingFileName('ai_'.Str::random(10).'.jpg')
                    ->toMediaCollection('uploads', 'public');

                $service->cleanupTemp($tmpAbsPath);

                $results[] = [
                    'id' => $item->id,
                    'name' => $item->name,
                    'url' => $media->getUrl(),
                ];
                $count++;
            }

            return redirect()->route('admin.media.index')->with('success', "✓ {$count} imagen(es) generada(s) y guardada(s) en la biblioteca.");
        } catch (MiniMaxApiException $e) {
            Log::warning('MiniMax API error', [
                'status_code' => $e->statusCode,
                'http_status' => $e->httpStatus,
                'message' => $e->getMessage(),
                'user_id' => $request->user()?->id,
            ]);

            return redirect()->route('admin.media.ai')->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            Log::error('AI image generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()?->id,
            ]);

            return redirect()->route('admin.media.ai')->with('error', 'Error al generar la imagen: '.$e->getMessage());
        }
    }
}
