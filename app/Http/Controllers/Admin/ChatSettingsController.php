<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateChatSettingsRequest;
use App\Models\ChatSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ChatSettingsController extends Controller
{
    public function index(): Response
    {
        $settings = ChatSetting::current();

        return Inertia::render('admin/chat/settings', [
            'settings' => [
                'chat_enabled' => $settings->chat_enabled,
                'position' => $settings->position,
                'welcome_message' => $settings->welcome_message,
                'offline_message' => $settings->offline_message,
                'business_start' => substr((string) $settings->business_start, 0, 5),
                'business_end' => substr((string) $settings->business_end, 0, 5),
                'business_days' => $settings->business_days ?? [1, 2, 3, 4, 5],
            ],
        ]);
    }

    public function update(UpdateChatSettingsRequest $request): RedirectResponse
    {
        $settings = ChatSetting::current();
        $data = $request->validated();

        $data['business_start'] = $data['business_start'].':00';
        $data['business_end'] = $data['business_end'].':00';

        $settings->update($data);

        return back()->with('success', 'Configuración guardada.');
    }
}
