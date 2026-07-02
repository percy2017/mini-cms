<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ChatMessage extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_id',
        'body',
        'attachments',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'attachments' => 'array',
    ];

    /**
     * Public URL + metadata for each stored attachment. Attachments are stored
     * under `chat-attachments/{conversation_id}/{message_id}-{basename}` and
     * persisted to the database as `{path, name, mime, size}` so we don't need
     * a separate table for one-to-many lists.
     *
     * Media-library refs come in as `{path: '', name, mime, size, url}` — the
     * file lives elsewhere on the `public` disk and we just reference it. In
     * that case the explicit `url` field is what the bubble renders.
     */
    protected function attachmentUrls(): Attribute
    {
        return Attribute::get(function () {
            $rows = $this->attachments ?? [];

            return array_map(static function (array $a): array {
                $path = $a['path'] ?? null;
                $storedUrl = $a['url'] ?? null;

                $url = $path
                    ? Storage::disk('public')->url($path)
                    : (is_string($storedUrl) && $storedUrl !== '' ? $storedUrl : null);

                return [
                    'path' => $path,
                    'name' => $a['name'] ?? basename((string) ($path ?: $storedUrl ?? '')),
                    'mime' => $a['mime'] ?? null,
                    'size' => $a['size'] ?? null,
                    'url' => $url,
                ];
            }, $rows);
        });
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
