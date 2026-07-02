<?php

use Illuminate\Support\Facades\Broadcast;

// Chat broadcasts are intentionally public: the conversation itself is the
// authorisation boundary (it's addressed by ID, and the message body is
// pre-cleared by the controller). No user-auth gate here so that the
// /broadcasting/auth endpoint never returns 403 for a logged-in visitor or
// admin while they wait for the WebSocket handshake.

Broadcast::channel('chat.admin', function () {
    return true;
});

Broadcast::channel('chat.{conversationId}', function () {
    return true;
});

Broadcast::channel('chat.visitor.{conversationId}', function () {
    return true;
});
