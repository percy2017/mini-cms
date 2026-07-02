<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('title')->default('HostBol');
            $table->string('description')->nullable();
            $table->string('icon_path')->nullable();
            $table->string('logo_path')->nullable();
            $table->timestamps();
        });

        DB::table('site_settings')->insert([
            'title' => 'HostBol',
            'description' => 'Soluciones digitales para tu negocio',
            'icon_path' => 'resources/icon.png',
            'logo_path' => 'resources/logo.png',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
