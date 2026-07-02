<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateSiteSettingsRequest;
use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SiteController extends Controller
{
    public function edit(): Response
    {
        $settings = SiteSetting::current();

        return Inertia::render('settings/site', [
            'settings' => [
                'title' => $settings->title,
                'description' => $settings->description,
                'icon_url' => $settings->icon_url,
                'logo_url' => $settings->logo_url,
            ],
        ]);
    }

    public function update(UpdateSiteSettingsRequest $request): RedirectResponse
    {
        $settings = SiteSetting::current();
        $data = $request->validated();

        // Brand assets are stored directly in /public/resources/ so every
        // consumer (admin sidebar, public navbar, auth layouts, favicons)
        // sees the latest version on the next render without a build step.
        // Uploads overwrite the canonical files; clearing the field resets
        // back to the bundled defaults.
        if ($request->hasFile('icon')) {
            $upload = $request->file('icon');
            $ext = strtolower($upload->getClientOriginalExtension() ?: 'png');
            $target = public_path('resources/icon.'.$ext);
            // Make sure /public/resources exists (it should, but be safe).
            @mkdir(dirname($target), 0755, true);
            $upload->move(dirname($target), basename($target));
            // Drop other icon.* variants so the URL never changes format.
            foreach (['png', 'jpg', 'jpeg', 'svg', 'webp', 'ico'] as $variant) {
                $stale = public_path('resources/icon.'.$variant);
                if ($variant !== $ext && file_exists($stale)) {
                    @unlink($stale);
                }
            }
            $data['icon_path'] = 'resources/icon.'.$ext;
        }

        if ($request->hasFile('logo')) {
            $upload = $request->file('logo');
            $ext = strtolower($upload->getClientOriginalExtension() ?: 'png');
            $target = public_path('resources/logo.'.$ext);
            @mkdir(dirname($target), 0755, true);
            $upload->move(dirname($target), basename($target));
            foreach (['png', 'jpg', 'jpeg', 'svg', 'webp'] as $variant) {
                $stale = public_path('resources/logo.'.$variant);
                if ($variant !== $ext && file_exists($stale)) {
                    @unlink($stale);
                }
            }
            $data['logo_path'] = 'resources/logo.'.$ext;
        }

        $settings->update($data);

        return back()->with('success', 'Configuración del sitio actualizada.');
    }
}
