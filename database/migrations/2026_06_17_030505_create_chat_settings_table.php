<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('chat_enabled')->default(true);
            $table->string('position')->default('bottom-right');
            $table->string('primary_color')->default('#6366f1');
            $table->string('welcome_message')->default('Hola 👋 ¿en qué podemos ayudarte?');
            $table->string('offline_message')->default('Estamos fuera de horario, te responderemos pronto.');
            $table->time('business_start')->default('09:00:00');
            $table->time('business_end')->default('18:00:00');
            $table->json('business_days')->nullable();
            $table->timestamps();
        });

        DB::table('chat_settings')->insert([
            'chat_enabled' => true,
            'position' => 'bottom-right',
            'primary_color' => '#6366f1',
            'welcome_message' => 'Hola 👋 ¿en qué podemos ayudarte?',
            'offline_message' => 'Estamos fuera de horario, te responderemos pronto.',
            'business_start' => '09:00:00',
            'business_end' => '18:00:00',
            'business_days' => json_encode([1, 2, 3, 4, 5]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_settings');
    }
};
