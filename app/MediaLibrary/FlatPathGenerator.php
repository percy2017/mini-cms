<?php

namespace App\MediaLibrary;

use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGenerator;

/**
 * Stores every uploaded file at the absolute disk root. No subfolders, no
 * collections, no media-id directories.
 *
 * The challenge: Spatie always populates $media->file_name with the
 * original upload name (e.g. "logo.png"). Two uploads sharing that name
 * would clobber each other on disk.
 *
 * Solution: registerMediaCollections hooks MediaHasBeenAddedEvent to rename
 * the file on disk to "{media_id}-{original_name}" right after Spatie
 * saves it. That keeps every file unique while living directly under the
 * disk root.
 *
 *   storage/app/public/12-logo.png
 *   storage/app/public/13-photo.jpg
 *   ...
 */
class FlatPathGenerator implements PathGenerator
{
    public function getPath(Media $media): string
    {
        // Spatie concatenates getPath() + file_name to compute the absolute
        // disk path. Returning "" places the file at the disk root, where
        // file_name (renamed post-save to "{id}-{name}") becomes the full
        // filename.
        return '';
    }

    public function getPathForConversions(Media $media): string
    {
        return '';
    }

    public function getPathForResponsiveImages(Media $media): string
    {
        return '';
    }
}
