<?php

use App\Models\MediaItem;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

beforeEach(function () {
    Storage::fake('public');
});

test('guests cannot access media library', function () {
    $this->get(route('admin.media.index'))->assertRedirect(route('login'));
});

test('authenticated user can view media library', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get(route('admin.media.index'))->assertOk();
});

test('user can upload a file', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $file = UploadedFile::fake()->image('test.jpg', 100, 100);

    $this->post(route('admin.media.store'), [
        'files' => [$file],
    ])->assertRedirect();

    $media = Media::first();
    expect($media)->not->toBeNull();
    expect($media->file_name)->toBe('test.jpg');
    expect($media->mime_type)->toBe('image/jpeg');
    Storage::disk('public')->assertExists($media->getPathRelativeToRoot());
});

test('user can upload multiple files', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $files = [
        UploadedFile::fake()->image('a.png'),
        UploadedFile::fake()->image('b.png'),
    ];

    $this->post(route('admin.media.store'), [
        'files' => $files,
    ])->assertRedirect();

    expect(Media::count())->toBe(2);
});

test('user can update media name', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $item = MediaItem::create(['name' => 'Old', 'user_id' => $user->id]);
    $item->addMedia(UploadedFile::fake()->image('a.png'))
        ->toMediaCollection('uploads', 'public');

    $media = Media::first();

    $this->patch(route('admin.media.update', $media), [
        'name' => 'New name',
    ])->assertRedirect();

    expect($media->fresh()->name)->toBe('New name');
});

test('user can delete media', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $item = MediaItem::create(['name' => 'X', 'user_id' => $user->id]);
    $media = $item->addMedia(UploadedFile::fake()->image('a.png'))
        ->toMediaCollection('uploads', 'public');

    $this->delete(route('admin.media.destroy', $media))->assertRedirect();

    expect(Media::find($media->id))->toBeNull();
});

test('store requires at least one file', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->from(route('admin.media.index'))
        ->post(route('admin.media.store'), [
            'files' => [],
        ])
        ->assertRedirect(route('admin.media.index'))
        ->assertSessionHasErrors('files');
});

test('index filters by type', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $item = MediaItem::create(['name' => 'X', 'user_id' => $user->id]);
    $item->addMedia(UploadedFile::fake()->image('photo.png'))
        ->toMediaCollection('uploads', 'public');

    $this->get(route('admin.media.index', ['type' => 'image']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/media/index'));
});

test('index searches by query', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $item = MediaItem::create(['name' => 'vacation photo', 'user_id' => $user->id]);
    $item->addMedia(UploadedFile::fake()->image('beach.jpg'))
        ->toMediaCollection('uploads', 'public');

    $this->get(route('admin.media.index', ['q' => 'vacation']))
        ->assertOk();
});

test('show returns media detail', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $item = MediaItem::create(['name' => 'X', 'user_id' => $user->id]);
    $media = $item->addMedia(UploadedFile::fake()->image('a.png'))
        ->toMediaCollection('uploads', 'public');

    $this->get(route('admin.media.show', $media))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/media/show'));
});
