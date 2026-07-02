<?php

namespace App\Broadcasting;

/**
 * Anonymous placeholder returned when no user is authenticated but the
 * framework still needs an object whose broadcast-auth methods exist.
 * PusherBroadcaster only inspects objects for these specific methods, so
 * we don't need to implement any contract — just enough surface for the
 * `method_exists` checks at PusherBroadcaster::validAuthenticationResponse.
 */
class GuestBroadcaster
{
    public function getAuthIdentifier(): int|string
    {
        return 'guest';
    }

    public function getAuthIdentifierForBroadcasting(): int|string
    {
        return 'guest';
    }

    public function getAuthPassword(): string
    {
        return '';
    }

    public function getAuthPasswordForBroadcasting(): string
    {
        return '';
    }
}
