<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatSetting extends Model
{
    protected $table = 'chat_settings';

    protected $fillable = [
        'chat_enabled',
        'position',
        'primary_color',
        'welcome_message',
        'offline_message',
        'business_start',
        'business_end',
        'business_days',
    ];

    protected $casts = [
        'chat_enabled' => 'boolean',
        'business_days' => 'array',
        'business_start' => 'string',
        'business_end' => 'string',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate(
            [],
            [
                'chat_enabled' => true,
                'position' => 'bottom-right',
                'primary_color' => '',
                'welcome_message' => '',
                'offline_message' => '',
                'business_start' => '09:00:00',
                'business_end' => '18:00:00',
                'business_days' => [1, 2, 3, 4, 5],
            ],
        );
    }

    public function isOnline(): bool
    {
        if (! $this->chat_enabled) {
            return false;
        }

        $now = now();
        $dayOfWeek = (int) $now->dayOfWeekIso;
        $time = $now->format('H:i:s');

        $days = $this->business_days ?? [1, 2, 3, 4, 5];
        if (! in_array($dayOfWeek, $days, true)) {
            return false;
        }

        return $time >= $this->business_start && $time <= $this->business_end;
    }
}
