<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\LoginRequest;
use App\Http\Requests\Public\RegisterRequest;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
        ]);

        // Visitors who self-register through the public chat widget get the
        // baseline 'user' role. Admins keep their role on the admin side.
        $defaultRole = Role::where('name', 'user')->first();
        if ($defaultRole) {
            $user->assignRole($defaultRole);
        }

        // MustVerifyEmail is in effect: do NOT log the user in until they
        // confirm their email. Send the verification notification instead.
        $user->sendEmailVerificationNotification();

        $this->linkConversationToUser($request, $user);

        $this->linkConversationToUser($request, $user);

        return response()->json([
            'ok' => true,
            'requires_verification' => true,
            'message' => 'Te enviamos un correo para verificar tu cuenta.',
            'user' => $this->serializeUser($user),
        ]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciales inválidas.'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
            throw ValidationException::withMessages([
                'email' => ['Verifica tu correo antes de iniciar sesión. Te reenviamos el enlace.'],
            ]);
        }

        Auth::login($user);

        $this->linkConversationToUser($request, $user);

        return response()->json([
            'ok' => true,
            'user' => $this->serializeUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'authenticated' => $user !== null,
            'user' => $user ? $this->serializeUser($user) : null,
        ]);
    }

    protected function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'phone_country_code' => $user->phoneCountryCode(),
            'avatar_url' => $user->avatarUrl(),
        ];
    }

    protected function linkConversationToUser(Request $request, User $user): void
    {
        $uuid = $request->cookie('chat_uuid');
        if (! $uuid) {
            return;
        }

        $conversation = Conversation::where('uuid', $uuid)->first();
        if (! $conversation) {
            return;
        }

        $conversation->update([
            'visitor_name' => $conversation->visitor_name ?: $user->name,
            'visitor_email' => $conversation->visitor_email ?: $user->email,
            'visitor_phone' => $conversation->visitor_phone ?: $user->phone,
        ]);
    }
}
