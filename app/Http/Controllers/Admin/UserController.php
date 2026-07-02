<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Resolve the avatar into a path on the public disk, no matter whether
     * the caller uploaded a fresh file or referenced an existing Media item
     * by URL.
     *
     * Returns the relative path (e.g. `avatars/abc123.jpg`) or `null` when
     * no avatar was supplied.
     */
    private function storeAvatar(Request $request): ?string
    {
        if ($request->hasFile('avatar')) {
            return $request->file('avatar')->store('avatars', 'public');
        }

        $url = $request->input('avatar_url');
        if (! is_string($url) || ! preg_match('#^https?://#i', $url)) {
            return null;
        }

        try {
            $response = Http::timeout(10)->get($url);
        } catch (ConnectionException) {
            return null;
        }
        if (! $response->successful()) {
            return null;
        }

        $contentType = $response->header('Content-Type') ?? '';
        if (! str_starts_with($contentType, 'image/')) {
            return null;
        }

        $ext = match (true) {
            str_contains($contentType, 'jpeg') => 'jpg',
            str_contains($contentType, 'png') => 'png',
            str_contains($contentType, 'webp') => 'webp',
            str_contains($contentType, 'gif') => 'gif',
            str_contains($contentType, 'svg') => 'svg',
            default => 'jpg',
        };

        $path = 'avatars/'.Str::random(20).'.'.$ext;
        Storage::disk('public')->put($path, $response->body());

        return $path;
    }

    public function index(Request $request): Response
    {
        $search = $request->string('q')->toString();
        $role = $request->string('role')->toString();

        $query = User::query()->with('roles')->latest();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($role !== '') {
            $query->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        $users = $query->paginate(15)->through(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'phone_country_code' => $u->phoneCountryCode(),
            'phone_national' => $u->phoneNational(),
            'email_verified_at' => $u->email_verified_at?->toDateTimeString(),
            'avatar_url' => $u->avatarUrl(),
            'roles' => $u->roles->pluck('name'),
            'created_at' => $u->created_at?->toDateTimeString(),
        ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => ['q' => $search, 'role' => $role],
            'allRoles' => Role::query()->orderBy('name')->pluck('name'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/users/create', [
            'allRoles' => Role::query()->orderBy('name')->pluck('name'),
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load('roles');

        return Inertia::render('admin/users/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatarUrl(),
                'roles' => $user->roles->pluck('name'),
                'email_verified_at' => $user->email_verified_at?->toDateTimeString(),
            ],
            'allRoles' => Role::query()->orderBy('name')->pluck('name'),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $roles = $data['roles'] ?? [];
        unset($data['roles'], $data['avatar']);

        $data['password'] = Hash::make($data['password']);

        $avatarPath = $this->storeAvatar($request);
        if ($avatarPath !== null) {
            $data['avatar_path'] = $avatarPath;
        }

        $user = User::create($data);

        if ($roles) {
            $user->syncRoles($roles);
        }

        return redirect()
            ->route('admin.users.index')
            ->with('success', "Usuario {$user->name} creado.");
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        $roles = $data['roles'] ?? null;
        $emailVerified = $request->boolean('email_verified');
        unset($data['roles'], $data['avatar'], $data['email_verified']);

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $avatarPath = $this->storeAvatar($request);
        if ($avatarPath !== null) {
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }
            $data['avatar_path'] = $avatarPath;
        }

        $user->update($data);

        // Sync the email_verified_at column with the admin's toggle.
        // We always write (even when unchanged) so an admin can revoke
        // verification too — not just grant it.
        $user->forceFill([
            'email_verified_at' => $emailVerified ? ($user->email_verified_at ?? now()) : null,
        ])->save();

        if ($roles !== null) {
            $user->syncRoles($roles);
        }

        return redirect()
            ->route('admin.users.index')
            ->with('success', "Usuario {$user->name} actualizado.");
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'No puedes eliminar tu propio usuario.');
        }

        $name = $user->name;

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->delete();

        return back()->with('success', "Usuario {$name} eliminado.");
    }
}
