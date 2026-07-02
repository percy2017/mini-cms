<?php

namespace App\Http\Controllers\Admin;

use App\Events\ChatMessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SendChatMessageRequest;
use App\Models\ChatMessage;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        $activeId = $request->integer('conversation');

        // Simple inbox: list every conversation, no status filters.
        $conversations = Conversation::query()
            ->withCount('messages')
            ->withCount([
                'messages as unread_count' => function ($q) {
                    $q->where('sender_type', 'visitor')->whereNull('read_at');
                },
            ])
            ->with(['latestMessage', 'user'])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->paginate(20)
            ->through(fn (Conversation $c) => [
                'id' => $c->id,
                'uuid' => $c->uuid,
                'visitor_name' => $c->visitor_name ?: 'Visitante #'.substr($c->uuid, 0, 6),
                'visitor_avatar_url' => $c->user?->avatarUrl(),
                'status' => $c->status,
                'messages_count' => $c->messages_count,
                'unread_count' => (int) $c->unread_count,
                'last_message' => $c->latestMessage?->body ?: null,
                // Used as a preview when the last message has no body (image-only
                // messages, attachment-only sends). Falls back to body text when
                // attachments are missing.
                'last_attachment' => $c->latestMessage?->attachments[0]['name'] ?? null,
                'last_message_at' => $c->last_message_at?->toDateTimeString() ?? $c->created_at?->toDateTimeString(),
            ]);

        $active = null;
        if ($activeId) {
            $conversation = Conversation::find($activeId);
            if ($conversation) {
                $active = [
                    'id' => $conversation->id,
                    'uuid' => $conversation->uuid,
                    'visitor_name' => $conversation->visitor_name ?: 'Visitante #'.substr($conversation->uuid, 0, 6),
                    'visitor_avatar_url' => $conversation->user?->avatarUrl(),
                    'status' => $conversation->status,
                ];
            }
        }

        return Inertia::render('admin/chat/inbox', [
            'conversations' => $conversations,
            'active' => $active,
        ]);
    }

    public function messages(Conversation $conversation): JsonResponse
    {
        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('id')
            ->get()
            ->map(fn (ChatMessage $m) => [
                'id' => $m->id,
                'sender_type' => $m->sender_type,
                'sender_name' => $m->sender?->name,
                'avatar_url' => $m->sender?->avatarUrl(),
                'body' => $m->body,
                'attachments' => $m->attachment_urls,
                'created_at' => $m->created_at?->toISOString(),
            ]);

        $conversation->messages()
            ->where('sender_type', 'visitor')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'uuid' => $conversation->uuid,
                'visitor_name' => $conversation->visitor_name ?: 'Visitante #'.substr($conversation->uuid, 0, 6),
                'visitor_avatar_url' => $conversation->user?->avatarUrl(),
                'status' => $conversation->status,
            ],
            'messages' => $messages,
        ]);
    }

    public function show(Conversation $conversation): RedirectResponse
    {
        return redirect()->route('admin.chat.index', ['conversation' => $conversation->id]);
    }

    public function send(SendChatMessageRequest $request, Conversation $conversation): RedirectResponse
    {
        $message = new ChatMessage([
            'conversation_id' => $conversation->id,
            'sender_type' => 'admin',
            'sender_id' => $request->user()?->id,
            'body' => (string) $request->input('body', ''),
            'attachments' => [],
        ]);
        $message->save();

        $stored = $this->storeAttachments(
            $request,
            $conversation->id,
            $message->id,
        );
        $stored = array_merge($stored, $this->resolveAttachmentRefs($request));
        $message->attachments = $stored;
        $message->save();

        $conversation->update(['last_message_at' => now()]);

        broadcast(new ChatMessageSent($message->fresh()))->toOthers();

        return back();
    }

    /**
     * Persist uploaded files under chat-attachments/{conversation}/{message}-{name}
     * and return the metadata array for storage in `attachments`.
     *
     * @return array<int, array{path: string, name: string, mime: string|null, size: int}>
     */
    private function storeAttachments(Request $request, int $conversationId, int $messageId): array
    {
        $stored = [];
        foreach ((array) $request->file('attachments', []) as $file) {
            if (! $file) {
                continue;
            }
            $name = $file->getClientOriginalName();
            $stored[] = [
                'path' => $file->storeAs(
                    "chat-attachments/{$conversationId}",
                    "{$messageId}-{$name}",
                    'public',
                ),
                'name' => $name,
                'mime' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ];
        }

        return $stored;
    }

    /**
     * Pick up `attachment_refs` from the request — these are pointers to
     * files already in the Media library. We don't copy; we store the URL
     * directly so the bubble renders the same public asset.
     *
     * @return array<int, array{path: string, name: string, mime: string|null, size: int}>
     */
    private function resolveAttachmentRefs(Request $request): array
    {
        $raw = (string) $request->input('attachment_refs', '');
        if ($raw === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return [];
        }

        $refs = [];
        foreach ($decoded as $item) {
            if (! is_array($item) || empty($item['url'])) {
                continue;
            }
            $url = (string) $item['url'];
            if (! preg_match('/^https?:\/\//i', $url)) {
                continue; // refuse anything that isn't a fully qualified URL
            }
            $refs[] = [
                'path' => '',
                'name' => (string) ($item['name'] ?? basename(parse_url($url, PHP_URL_PATH) ?? 'adjunto')),
                'mime' => isset($item['mime']) ? (string) $item['mime'] : null,
                'size' => isset($item['size']) ? (int) $item['size'] : null,
                'url' => $url,
            ];
        }

        return $refs;
    }

    public function destroy(Conversation $conversation): RedirectResponse
    {
        $conversation->delete();

        return redirect()
            ->route('admin.chat.index')
            ->with('success', 'Conversación, mensajes y archivos eliminados.');
    }

    public function pollMessages(Request $request, Conversation $conversation): JsonResponse
    {
        $after = $request->integer('after', 0);

        $messages = $conversation->messages()
            ->where('id', '>', $after)
            ->with('sender')
            ->orderBy('id')
            ->get()
            ->map(fn (ChatMessage $m) => [
                'id' => $m->id,
                'sender_type' => $m->sender_type,
                'sender_name' => $m->sender?->name,
                'avatar_url' => $m->sender?->avatarUrl(),
                'body' => $m->body,
                'attachments' => $m->attachment_urls,
                'created_at' => $m->created_at?->toISOString(),
            ]);

        return response()->json([
            'messages' => $messages,
            'last_id' => $messages->last()['id'] ?? $after,
        ]);
    }
}
