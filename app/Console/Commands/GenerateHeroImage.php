<?php

namespace App\Console\Commands;

use App\Exceptions\MiniMaxApiException;
use App\Models\MediaItem;
use App\Services\MiniMaxImageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GenerateHeroImage extends Command
{
    protected $signature = 'ai:generate-hero
        {--prompt= : Prompt for image generation}
        {--aspect=16:9 : Aspect ratio}
        {--n=4 : Number of images}
        {--optimize : Use prompt optimizer}';

    protected $description = 'Generate hero image candidates via MiniMax';

    public function handle(): int
    {
        $prompt = $this->option('prompt') ?: 'Abstract technology background, geometric grid pattern with glowing nodes, blue and cyan accent lights on dark navy background, data flow visualization, modern flat design with depth, soft bokeh, minimalist tech aesthetic, 4k wallpaper style, no text, no logos';
        $aspect = $this->option('aspect') ?: '16:9';
        $n = (int) ($this->option('n') ?: 4);
        $optimize = (bool) $this->option('optimize');

        $this->info("Generando {$n} imagen(es)...");
        $this->line("Prompt: {$prompt}");
        $this->line("Aspecto: {$aspect}");
        $this->newLine();

        try {
            $service = MiniMaxImageService::fromConfig();
            $response = $service->textToImage($prompt, [
                'aspect_ratio' => $aspect,
                'n' => $n,
                'prompt_optimizer' => $optimize,
            ]);
        } catch (MiniMaxApiException $e) {
            $this->error('Error MiniMax: '.$e->getMessage());

            return self::FAILURE;
        }

        $imageBase64 = $response['image_base64'] ?? [];
        if (empty($imageBase64)) {
            $this->error('No se devolvieron imágenes.');

            return self::FAILURE;
        }

        $this->info('Se generaron '.count($imageBase64).' imagen(es). Guardando...');

        $created = [];
        foreach ($imageBase64 as $i => $b64) {
            $binary = base64_decode($b64, true);

            if ($binary === false) {
                $this->warn('  ✗ Imagen '.($i + 1).': base64 inválido, saltando.');

                continue;
            }

            $tmpDir = 'tmp/ai-images';
            Storage::disk('public')->makeDirectory($tmpDir);
            $filename = uniqid('hero_', true).'_'.($i + 1).'.jpg';
            $tmpPath = $tmpDir.'/'.$filename;
            Storage::disk('public')->put($tmpPath, $binary);
            $tmpAbsPath = Storage::disk('public')->path($tmpPath);

            try {
                $item = MediaItem::create([
                    'name' => 'Hero cand #'.($i + 1),
                    'user_id' => null,
                ]);

                $media = $item
                    ->addMedia($tmpAbsPath)
                    ->usingFileName('hero_'.Str::random(8).'_'.($i + 1).'.jpg')
                    ->toMediaCollection('uploads', 'public');

                $service->cleanupTemp($tmpAbsPath);
                $created[] = $media;
                $this->line('  ✓ Imagen '.($i + 1).": {$media->getUrl()}");
            } catch (\Throwable $e) {
                $this->warn('  ✗ Fallo en imagen '.($i + 1).': '.$e->getMessage());
            }
        }

        $this->newLine();
        $this->info('Listo. Revisa /admin/media y dime cuál te gusta.');

        return self::SUCCESS;
    }
}
