<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Events\MediaHasBeenAddedEvent;

class MediaItem extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'name',
        'description',
        'user_id',
    ];

    protected static function booted(): void
    {
        // After Spatie stores a file under the disk root, rename it to
        // "{media_id}-{original_name}" so two uploads sharing a filename
        // don't clobber each other. Files stay at the disk root, no
        // subfolders involved.
        Event::listen(MediaHasBeenAddedEvent::class, function (MediaHasBeenAddedEvent $event) {
            $media = $event->media;
            if ($media->model_type !== self::class) {
                return;
            }

            $disk = Storage::disk($media->disk);
            $currentName = $media->file_name;
            if (! str_starts_with($currentName, (string) $media->getKey().'-')) {
                $newName = $media->getKey().'-'.$currentName;
                if ($disk->exists($currentName)) {
                    $disk->move($currentName, $newName);
                }
                $media->file_name = $newName;
                $media->saveQuietly();
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('uploads')
            ->useDisk('public');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getLatestMediaAttribute()
    {
        return $this->media->first();
    }
}
