<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $site = SiteSetting::current();

        return [
            ...parent::share($request),
            'name' => $site->title ?: config('app.name'),
            'site' => [
                'title' => $site->title,
                'description' => $site->description,
                // Brand assets always live under /public/resources/. Uploads
                // from /settings/site overwrite those files in place, so the
                // URL never has to change.
                'icon_url' => asset('resources/icon.png'),
                'logo_url' => asset('resources/logo.png'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatarUrl(),
                ] : null,
            ],
            // Default to expanded so first-time visitors see the full menu.
            // The SidebarProvider writes a `sidebar_state` cookie on every
            // toggle so this picks up the user's last choice on reload.
            'sidebarOpen' => $request->cookie('sidebar_state', 'true') === 'true',
        ];
    }
}
