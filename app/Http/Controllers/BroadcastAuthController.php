<?php

namespace App\Http\Controllers;

use Illuminate\Broadcasting\Broadcasters\PusherBroadcaster;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Replacement for the framework's BroadcastController that signs
 * `/broadcasting/auth` requests for guests (no session user). The class is
 * aliased onto \Illuminate\Broadcasting\BroadcastController in
 * AppServiceProvider, so the framework's auto-registered route resolves to
 * `authenticate()` here.
 */
class BroadcastAuthController extends Controller
{
    public function authenticate(Request $request, BroadcastManager $bm): JsonResponse
    {
        $socketId = (string) $request->input('socket_id', '');
        $channelName = (string) $request->input('channel_name', '');

        if ($socketId === '' || $channelName === '') {
            throw new AccessDeniedHttpException('Missing socket_id or channel_name.');
        }

        // Allow only our chat channels. Everything else is forbidden.
        $allowed = (bool) preg_match('/^private-chat(\.[a-z0-9_]+)?(\.[a-z0-9_]+)?$/i', $channelName)
            || (bool) preg_match('/^presence-chat(\.[a-z0-9_]+)?(\.[a-z0-9_]+)?$/i', $channelName);
        if (! $allowed) {
            throw new AccessDeniedHttpException('Channel not allowed.');
        }

        /** @var PusherBroadcaster $broadcaster */
        $broadcaster = $bm->connection('reverb');

        // Sign the request directly via the underlying Reverb/Pusher SDK.
        // This bypasses the framework's user-required channel-closure path.
        $pusher = $broadcaster->getPusher();
        $signed = method_exists($pusher, 'authorizeChannel')
            ? $pusher->authorizeChannel($channelName, $socketId)
            : $pusher->socket_auth($channelName, $socketId);

        $decoded = json_decode($signed, true);

        return response()->json(is_array($decoded) ? $decoded : ['auth' => $signed]);
    }
}
