<?php

namespace App\Http\Controllers\Public;

use App\Events\ChatMessageSent;
use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ChatWidgetController extends Controller
{
    public function init(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json([
                'error' => 'unauthenticated',
                'message' => 'Debes iniciar sesión para chatear.',
            ], 401);
        }

        $conversation = Conversation::where('user_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        if (! $conversation) {
            $conversation = Conversation::create([
                'user_id' => $user->id,
                'visitor_name' => $user->name,
                'visitor_email' => $user->email,
                'status' => 'open',
            ]);
        }

        return response()->json([
            'uuid' => $conversation->uuid,
            'conversation_id' => $conversation->id,
            'messages' => $conversation->messages()->orderBy('id')->limit(50)->get()->map(fn ($m) => [
                'id' => $m->id,
                'body' => $m->body,
                'sender_type' => $m->sender_type,
                'sender_name' => $m->sender?->name,
                'attachments' => $m->attachment_urls,
                'created_at' => $m->created_at?->toISOString(),
            ])->values(),
        ]);
    }

    public function send(Request $request, string $uuid): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }

        Validator::make($request->all(), [
            'body' => ['nullable', 'string', 'max:2000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => [
                'file',
                'mimes:jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,txt,csv,zip,rar',
                'max:5120',
            ],
        ])->after(function ($v) use ($request) {
            $body = trim((string) $request->input('body', ''));
            $files = (array) $request->file('attachments', []);
            if ($body === '' && count(array_filter($files)) === 0) {
                $v->errors()->add('body', 'Escribe un mensaje o adjunta un archivo.');
            }
        })->validate();

        $conversation = Conversation::where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->where('status', 'open')
            ->firstOrFail();

        $message = new ChatMessage([
            'conversation_id' => $conversation->id,
            'sender_type' => 'visitor',
            'sender_id' => $user->id,
            'body' => (string) $request->input('body', ''),
            'attachments' => [],
        ]);
        $message->save();

        $stored = [];
        foreach ((array) $request->file('attachments', []) as $file) {
            if (! $file) {
                continue;
            }
            $name = $file->getClientOriginalName();
            $stored[] = [
                'path' => $file->storeAs(
                    "chat-attachments/{$conversation->id}",
                    "{$message->id}-{$name}",
                    'public',
                ),
                'name' => $name,
                'mime' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ];
        }
        if ($stored) {
            $message->attachments = $stored;
            $message->save();
        }

        $conversation->update(['last_message_at' => now()]);

        broadcast(new ChatMessageSent($message->fresh()))->toOthers();

        return response()->json(['ok' => true, 'message_id' => $message->id]);
    }

    public function poll(Request $request, string $uuid): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }

        $conversation = Conversation::where('uuid', $uuid)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $after = $request->integer('after', 0);

        $messages = $conversation->messages()
            ->where('id', '>', $after)
            ->with('sender')
            ->orderBy('id')
            ->get()
            ->map(fn (ChatMessage $m) => [
                'id' => $m->id,
                'body' => $m->body,
                'sender_type' => $m->sender_type,
                'sender_name' => $m->sender?->name,
                'attachments' => $m->attachment_urls,
                'created_at' => $m->created_at?->toISOString(),
            ]);

        return response()->json([
            'messages' => $messages,
            'last_id' => $messages->last()['id'] ?? $after,
        ]);
    }
}
