<?php

namespace Database\Seeders;

use App\Models\ChatSetting;
use App\Models\MediaItem;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with a sensible baseline:
     *
     *  - 3 permissions + 3 roles (admin / manager / user)
     *  - 3 users (one per role) with password "password"
     *  - 1 MediaItem with a generated SVG attached
     *  - 2 conversations: one open with messages, one closed
     *  - Chat settings
     */
    public function run(): void
    {
        // Roles & permissions --------------------------------------------------
        $permissions = ['manage users', 'manage roles', 'manage media'];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $user = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        $admin->syncPermissions(Permission::all());
        $user->syncPermissions([]);

        // Users ---------------------------------------------------------------
        // Default admin account. Password is the standard one for fresh
        // installs — change it on first login in production.
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('Admin2026$'),
                'email_verified_at' => now(),
            ],
        );
        // Point the admin at the generic avatar shipped in /public/resources.
        // Copy the asset into public/storage/ so asset('storage/...') can
        // serve it after a fresh install. User::avatarUrl() returns null
        // when no path is set, in which case the UI shows the initial-letter
        // fallback.
        $source = public_path('resources/admin-default.png');
        $target = public_path('storage/admin-default.png');
        if (file_exists($source)) {
            @mkdir(dirname($target), 0755, true);
            if (! file_exists($target)) {
                copy($source, $target);
            }
        }
        $adminUser->update(['avatar_path' => 'admin-default.png']);
        $adminUser->assignRole($admin);

        // Media library -------------------------------------------------------
        // Intentionally empty on fresh installs — the admin seeds it through
        // the /admin/media page so the library reflects what's actually
        // relevant to the project.

        // Conversations -------------------------------------------------------
        // Intentionally empty on fresh installs. Threads are created the
        // first time a visitor opens the chat widget on the landing page.

        // Chat settings -------------------------------------------------------
        ChatSetting::current()->update([
            'chat_enabled' => true,
            'position' => 'bottom-right',
            'primary_color' => '',
            'welcome_message' => '',
            'offline_message' => '',
            'business_start' => '09:00',
            'business_end' => '18:00',
            'business_days' => [1, 2, 3, 4, 5],
        ]);
    }
}
