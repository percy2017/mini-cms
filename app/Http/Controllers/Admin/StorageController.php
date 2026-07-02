<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;

class StorageController extends Controller
{
    /**
     * Create the public/storage symlink. Exposed as a one-click fix for
     * fresh installs where php artisan storage:link hasn't been run.
     */
    public function link(): JsonResponse
    {
        $publicStorage = public_path('storage');
        $target = storage_path('app/public');

        // If a real directory exists at public/storage (instead of a symlink),
        // refuse to clobber it. The admin has to clean up first.
        if (file_exists($publicStorage) && ! is_link($publicStorage)) {
            return response()->json([
                'ok' => false,
                'message' => 'public/storage existe como directorio real. Borrá ese directorio manualmente antes de crear el symlink.',
            ], 409);
        }

        try {
            Artisan::call('storage:link');
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'message' => 'storage:link falló: '.$e->getMessage(),
            ], 500);
        }

        return response()->json([
            'ok' => true,
            'message' => 'Symlink public/storage creado correctamente.',
        ]);
    }

    /**
     * True when public/storage is a symlink that points to a populated
     * storage/app/public directory. Used by the /admin banner.
     */
    public static function isLinked(): bool
    {
        $publicStorage = public_path('storage');
        if (! is_link($publicStorage)) {
            return false;
        }

        $target = readlink($publicStorage);
        if (! $target) {
            return false;
        }

        $resolved = $target;
        if (! str_starts_with($resolved, '/')) {
            $resolved = dirname($publicStorage).'/'.$resolved;
        }

        return is_dir($resolved);
    }
}
