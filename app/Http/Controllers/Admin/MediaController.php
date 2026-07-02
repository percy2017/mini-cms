<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMediaRequest;
use App\Http\Requests\Admin\UpdateMediaRequest;
use App\Models\MediaItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $type = $request->string('type')->toString();
        $search = $request->string('q')->toString();

        $query = Media::query()->latest();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('file_name', 'like', "%{$search}%");
            });
        }

        if ($type !== '' && $type !== 'all') {
            $query->where('mime_type', 'like', $type.'/%');
        }

        $media = $query->paginate(24)->through(fn (Media $m) => [
            'id' => $m->id,
            'name' => $m->name,
            'file_name' => $m->file_name,
            'mime_type' => $m->mime_type,
            'size' => $m->size,
            'human_size' => $m->human_readable_size,
            'url' => $m->getUrl(),
            'thumb' => str_starts_with((string) $m->mime_type, 'image/') ? $m->getUrl() : null,
            'is_image' => str_starts_with((string) $m->mime_type, 'image/'),
            'created_at' => $m->created_at?->toDateTimeString(),
        ]);

        // JSON response path: used by the chat MediaPickerDialog to populate
        // its gallery tab without forcing a full Inertia navigation.
        if ($request->wantsJson() || $request->boolean('json')) {
            return response()->json([
                'media' => [
                    'data' => $media->items(),
                    'links' => $media->linkCollection()->toArray(),
                    'total' => $media->total(),
                ],
                'filters' => [
                    'type' => $type ?: 'all',
                    'q' => $search,
                ],
            ]);
        }

        return Inertia::render('admin/media/index', [
            'media' => $media,
            'filters' => [
                'type' => $type ?: 'all',
                'q' => $search,
            ],
        ]);
    }

    public function show(Media $media): Response
    {
        return Inertia::render('admin/media/show', [
            'media' => [
                'id' => $media->id,
                'name' => $media->name,
                'file_name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
                'human_size' => $media->human_readable_size,
                'url' => $media->getUrl(),
                'thumb' => str_starts_with((string) $media->mime_type, 'image/') ? $media->getUrl() : null,
                'is_image' => str_starts_with((string) $media->mime_type, 'image/'),
                'created_at' => $media->created_at?->toDateTimeString(),
                'custom_properties' => $media->custom_properties,
            ],
        ]);
    }

    public function store(StoreMediaRequest $request): RedirectResponse
    {
        $item = MediaItem::create([
            'name' => $request->string('name')->toString() ?: 'Upload',
            'user_id' => $request->user()?->id,
        ]);

        if ($request->hasFile('files')) {
            foreach ((array) $request->file('files') as $file) {
                $item->addMedia($file)
                    ->toMediaCollection('uploads', 'public');
            }
        }

        return back();
    }

    public function update(UpdateMediaRequest $request, Media $media): RedirectResponse
    {
        $media->name = $request->string('name')->toString();
        $media->save();

        return back();
    }

    public function destroy(Media $media): RedirectResponse
    {
        $media->delete();

        return back();
    }
}
