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
    }
}
