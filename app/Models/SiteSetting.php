<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $table = 'site_settings';

    protected $fillable = [
        'title',
        'description',
        'icon_path',
        'logo_path',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate(
            [],
            [
                'title' => 'HostBol',
                'description' => 'Soluciones digitales para tu negocio',
            ],
        );
    }

    public function getIconUrlAttribute(): ?string
    {
        if (! $this->icon_path) {
            return null;
        }

        if (str_starts_with($this->icon_path, 'resources/')) {
            return asset($this->icon_path);
        }

        return asset('storage/'.$this->icon_path);
    }

    public function getLogoUrlAttribute(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }

        if (str_starts_with($this->logo_path, 'resources/')) {
            return asset($this->logo_path);
        }

        return asset('storage/'.$this->logo_path);
    }
}
