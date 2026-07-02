<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Conversation extends Model
{
    protected $fillable = [
        'uuid',
        'user_id',
        'visitor_name',
        'visitor_email',
        'status',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Conversation $c) {
            if (empty($c->uuid)) {
                $c->uuid = (string) Str::uuid();
            }
        });

        // Cascade: when a conversation is deleted, also remove its
        // attachment files from storage. Messages FK is cascadeOnDelete.
        static::deleting(function (Conversation $c) {
            Storage::disk('public')->deleteDirectory("chat-attachments/{$c->id}");
        });
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class)->orderBy('created_at');
    }

    public function latestMessage()
    {
        return $this->hasOne(ChatMessage::class)->latestOfMany();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
