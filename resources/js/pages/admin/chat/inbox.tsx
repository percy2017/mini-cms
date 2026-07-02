import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { echo, useEcho } from '@laravel/echo-react';
import {
    Search,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    Send,
    Trash2,
    ArrowLeft,
    Loader2,
    Paperclip,
    FileText,
    Download,
    X,
    ArrowDown,
    Check,
    CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import MediaPickerDialog from '@/components/media-picker-dialog';
import { useChatNotification } from '@/hooks/use-chat-notification';
import { messages as messagesRoute, send, destroy as destroyConversation } from '@/actions/App/Http/Controllers/Admin/ChatController';

type Conversation = {
    id: number;
    uuid: string;
    visitor_name: string;
    visitor_avatar_url: string | null;
    status: 'open' | 'closed' | 'archived';
    messages_count: number;
    unread_count: number;
    last_message: string | null;
    last_attachment: string | null;
    last_message_at: string | null;
};

type Attachment = {
    path: string;
    name: string;
    mime: string | null;
    size: number | null;
    url: string;
};

type Message = {
    id: number;
    sender_type: 'visitor' | 'admin';
    sender_name: string | null;
    avatar_url: string | null;
    body: string;
    attachments?: Attachment[];
    read_at: string | null;
    created_at: string;
};

type ActiveConversation = {
    id: number;
    uuid: string;
    visitor_name: string;
    visitor_avatar_url: string | null;
    status: 'open' | 'closed' | 'archived';
};

type Props = {
    conversations: {
        data: Conversation[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    active: ActiveConversation | null;
};

function csrf(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

const STICK_TO_BOTTOM_PX = 80;

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function dayLabel(d: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(d, today)) return 'Hoy';
    if (isSameDay(d, yesterday)) return 'Ayer';
    return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
}

type BubbleGroup = {
    sender: 'visitor' | 'admin';
    items: Message[];
};

function groupBubbles(messages: Message[]): BubbleGroup[] {
    const groups: BubbleGroup[] = [];
    for (const m of messages) {
        const last = groups[groups.length - 1];
        if (
            last &&
            last.sender === m.sender_type &&
            last.items[last.items.length - 1].sender_type === m.sender_type
        ) {
            const prev = last.items[last.items.length - 1];
            const diff =
                (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime()) /
                1000;
            if (diff < 120) {
                last.items.push(m);
                continue;
            }
        }
        groups.push({ sender: m.sender_type, items: [m] });
    }
    return groups;
}

export default function ChatInbox({ conversations: initialConversations, active: initialActive }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [active, setActive] = useState<ActiveConversation | null>(initialActive);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [search, setSearch] = useState('');
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [showList, setShowList] = useState(!initialActive);
    const [pendingRefs, setPendingRefs] = useState<Attachment[]>([]);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [stickToBottom, setStickToBottom] = useState(true);
    const [conversationsData, setConversationsData] = useState<Conversation[]>(initialConversations.data);
    const lastIdRef = useRef(0);
    const lastLengthRef = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const composingRef = useRef(false);
    const playNotification = useChatNotification();

    const groups = useMemo(() => groupBubbles(messages), [messages]);

    const loadMessages = async (conversationId: number) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(messagesRoute.url({ conversation: conversationId }), {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            const data = await res.json();
            setMessages(data.messages ?? []);
            lastIdRef.current = data.messages?.length ? data.messages[data.messages.length - 1].id : 0;
            requestAnimationFrame(() => {
                const el = scrollRef.current;
                if (el) el.scrollTop = el.scrollHeight;
            });
        } catch (e) {
            console.error('load messages', e);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (active) {
            loadMessages(active.id);
            setConversationsData((prev) =>
                prev.map((c) => (c.id === active.id ? { ...c, unread_count: 0 } : c)),
            );
        } else {
            setMessages([]);
            lastIdRef.current = 0;
        }
    }, [active?.id]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const grew = messages.length > lastLengthRef.current;
        lastLengthRef.current = messages.length;
        if (grew && stickToBottom) {
            el.scrollTop = el.scrollHeight;
        }
    }, [messages, stickToBottom]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => {
            const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            setStickToBottom(distFromBottom <= STICK_TO_BOTTOM_PX);
        };
        onScroll();
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [active?.id]);

    useEcho(
        active ? `chat.${active.id}` : 'chat.none',
        'message.sent',
        (payload: { message?: Message }) => {
            const m = payload.message;
            if (!m) return;
            setMessages((prev) => {
                if (prev.some((x) => x.id === m.id)) return prev;
                lastIdRef.current = m.id;
                return [...prev, m];
            });
        },
        [active?.id],
        'private'
    );

    useEcho(
        'chat.admin',
        'message.sent',
        (payload: { message?: Message & { conversation_id: number } }) => {
            const m = payload.message;
            if (!m) return;
            const now = new Date().toISOString();
            setConversationsData((prev) => {
                const idx = prev.findIndex((c) => c.id === m.conversation_id);
                if (idx === -1) return prev;
                const c = prev[idx];
                const isActive = active?.id === c.id;
                const updated = {
                    ...c,
                    last_message: m.body || c.last_attachment || c.last_message,
                    last_attachment: m.body ? null : c.last_attachment,
                    last_message_at: now,
                    unread_count: m.sender_type === 'visitor' && !isActive ? c.unread_count + 1 : c.unread_count,
                };
                const next = [...prev];
                next.splice(idx, 1);
                next.unshift(updated);
                return next;
            });
            if (m.sender_type === 'visitor') {
                playNotification();
            }
        },
        []
    );

    const handleSelectConversation = (c: Conversation) => {
        setShowList(false);
        setActive({
            id: c.id,
            uuid: c.uuid,
            visitor_name: c.visitor_name,
            visitor_avatar_url: c.visitor_avatar_url,
            status: c.status,
        });
        if (c.unread_count > 0) {
            setConversationsData((prev) =>
                prev.map((x) => (x.id === c.id ? { ...x, unread_count: 0 } : x)),
            );
        }
    };

    const filtered = conversationsData.filter(
        (c) => !search || c.visitor_name.toLowerCase().includes(search.toLowerCase()),
    );

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sending || !active) return;
        const body = text.trim();
        if (!body && pendingRefs.length === 0) return;
        setSending(true);
        setText('');
        const form = new FormData();
        if (body) form.append('body', body);
        if (pendingRefs.length > 0) {
            form.append(
                'attachment_refs',
                JSON.stringify(
                    pendingRefs.map((r) => ({
                        url: r.url,
                        name: r.name,
                        mime: r.mime,
                        size: r.size,
                    })),
                ),
            );
        }
        try {
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrf(),
                'X-Requested-With': 'XMLHttpRequest',
            };
            const sid = echo().socketId();
            if (sid) headers['X-Socket-ID'] = sid;
            const res = await fetch(send.url({ conversation: active.id }), {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: form,
            });
            if (res.ok) {
                await loadMessages(active.id);
            }
        } catch (e) {
            console.error('send', e);
        } finally {
            setSending(false);
            setPendingRefs([]);
            requestAnimationFrame(() => {
                const el = scrollRef.current;
                if (el) el.scrollTop = el.scrollHeight;
            });
        }
    };

    const removePendingRef = (idx: number) =>
        setPendingRefs((prev) => prev.filter((_, i) => i !== idx));

    const handleMediaPickerPick = (refs: Attachment[]) => {
        setPendingRefs((prev) => [...prev, ...refs].slice(0, 5));
    };

    const isImage = (mime: string | null | undefined): boolean =>
        !!mime && mime.startsWith('image/');

    const handleDeleteSuccess = () => {
        setActive(null);
        setShowList(true);
    };

    const scrollToBottom = () => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    };

    const handleComposerKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (composingRef.current) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e as unknown as React.FormEvent);
        }
    };

    return (
        <>
            <Head title="Chats en vivo" />

            <div className="flex h-full flex-1 overflow-hidden">
                {flash?.success && (
                    <div className="absolute right-4 top-4 z-50 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 shadow-lg">
                        <CheckCircle2 className="h-4 w-4" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="absolute right-4 top-4 z-50 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive shadow-lg">
                        <AlertCircle className="h-4 w-4" />
                        {flash.error}
                    </div>
                )}

                <div
                    className={`flex w-full flex-col border-r border-border bg-card md:w-96 md:shrink-0 ${
                        active && !showList ? 'hidden md:flex' : 'flex'
                    }`}
                >
                    <div className="border-b border-border p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar chat..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                                <MessageCircle className="mb-2 h-12 w-12 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">No hay conversaciones</p>
                            </div>
                        ) : (
                            filtered.map((c) => {
                                const isActive = active?.id === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleSelectConversation(c)}
                                        className={`flex w-full items-center gap-3 border-b border-border/50 px-3 py-3 text-left transition ${
                                            isActive ? 'bg-muted' : 'hover:bg-muted/50'
                                        }`}
                                    >
                                        {c.visitor_avatar_url ? (
                                            <img
                                                src={c.visitor_avatar_url}
                                                alt={c.visitor_name}
                                                className="h-12 w-12 shrink-0 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white">
                                                {c.visitor_name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="truncate font-medium text-sm">{c.visitor_name}</span>
                                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                                    {c.last_message_at
                                                        ? new Date(c.last_message_at).toLocaleTimeString('es', {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : ''}
                                                </span>
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {c.last_message ||
                                                        (c.last_attachment ? (
                                                            <span className="inline-flex items-center gap-1">
                                                                📎 {c.last_attachment}
                                                            </span>
                                                        ) : (
                                                            <em>Sin mensajes</em>
                                                        ))}
                                                </p>
                                                {c.unread_count > 0 && (
                                                    <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                                                        {c.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div
                    className={`relative flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950 ${
                        !active ? 'hidden md:flex' : 'flex'
                    }`}
                >
                    {active ? (
                        <>
                            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowList(true)}
                                        className="md:hidden"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    {active.visitor_avatar_url ? (
                                        <img
                                            src={active.visitor_avatar_url}
                                            alt={active.visitor_name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white">
                                            {active.visitor_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="font-semibold">{active.visitor_name}</h2>
                                        <p className="text-xs text-muted-foreground">
                                            {active.status === 'open' ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    En línea
                                                </span>
                                            ) : (
                                                'Cerrada'
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {active.status === 'open' && (
                                    <ConfirmActionDialog
                                        actionUrl={destroyConversation.url({
                                            conversation: active.id,
                                        })}
                                        onSuccess={handleDeleteSuccess}
                                        title="¿Eliminar esta conversación?"
                                        description={
                                            <>
                                                Vas a eliminar la conversación con{' '}
                                                <strong>{active.visitor_name}</strong>.
                                                Se borrarán también todos los mensajes y
                                                archivos asociados. Esta acción no se
                                                puede deshacer.
                                            </>
                                        }
                                    >
                                        {({ openDialog }) => (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={openDialog}
                                                        aria-label="Eliminar conversación"
                                                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Eliminar conversación
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </ConfirmActionDialog>
                                )}
                            </div>

                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto px-4 py-2"
                                style={{
                                    backgroundImage:
                                        'radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.08) 1px, transparent 0)',
                                    backgroundSize: '24px 24px',
                                }}
                            >
                                {loadingMessages && messages.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Cargando mensajes...
                                    </div>
                                ) : messages.length === 0 ? (
                                    <p className="grid h-full place-items-center text-sm text-muted-foreground">
                                        Sin mensajes aún. Envía el primero.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-1.5 py-2">
                                        {groups.map((group, gi) => {
                                            const isAdmin = group.sender === 'admin';
                                            return (
                                                <div
                                                    key={`g-${group.items[0].id}`}
                                                    className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`flex max-w-[75%] flex-col gap-0.5 ${
                                                            isAdmin ? 'items-end' : 'items-start'
                                                        }`}
                                                    >
                                                        {group.items.map((m, idx) => {
                                                            const last =
                                                                idx === group.items.length - 1;
                                                            const first = idx === 0;
                                                            const prevDay =
                                                                gi > 0
                                                                    ? group.items[0].created_at
                                                                    : null;
                                                            const showDateSep =
                                                                first &&
                                                                (gi === 0 ||
                                                                    !isSameDay(
                                                                        new Date(prevDay!),
                                                                        new Date(m.created_at),
                                                                    ));
                                                            return (
                                                                <div key={`d-${m.id}`}>
                                                                    {showDateSep && (
                                                                        <div className="my-2 flex justify-center">
                                                                            <span className="rounded-full bg-background/80 px-3 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground shadow-sm">
                                                                                {dayLabel(
                                                                                    new Date(
                                                                                        m.created_at
                                                                                    )
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {!isAdmin && first && m.avatar_url && (
                                                                        <div className="mb-0.5 flex items-center gap-2">
                                                                            <img
                                                                                src={m.avatar_url}
                                                                                alt={m.sender_name ?? ''}
                                                                                className="h-6 w-6 rounded-full object-cover"
                                                                            />
                                                                            {m.sender_name && (
                                                                                <span className="text-[11px] text-muted-foreground">{m.sender_name}</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div
                                                                        className={`max-w-full rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                                                            isAdmin
                                                                                ? 'rounded-br-md bg-emerald-100 text-slate-900 dark:bg-emerald-900/40 dark:text-emerald-50'
                                                                                : 'rounded-bl-md bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                                                                        } ${
                                                                            first && group.items.length > 1
                                                                                ? 'rounded-tr-md'
                                                                                : ''
                                                                        } ${
                                                                            !first && !last
                                                                                ? 'rounded-r-md'
                                                                                : ''
                                                                        } ${
                                                                            !first && last && group.items.length > 1
                                                                                ? 'rounded-tr-md'
                                                                                : ''
                                                                        }`}
                                                                    >
                                                                                {m.attachments && m.attachments.length > 0 && (
                                                                                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                                                                                        {m.attachments.map((a, ai) =>
                                                                                            isImage(a.mime) ? (
                                                                                                <a
                                                                                                    key={ai}
                                                                                                    href={a.url}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                >
                                                                                                    <img
                                                                                                        src={a.url}
                                                                                                        alt={a.name}
                                                                                                        className="max-h-48 max-w-full rounded-lg object-cover"
                                                                                                    />
                                                                                                </a>
                                                                                            ) : a.mime?.startsWith('video/') ? (
                                                                                                <video
                                                                                                    key={ai}
                                                                                                    controls
                                                                                                    className="max-h-48 max-w-full rounded-lg"
                                                                                                    preload="metadata"
                                                                                                >
                                                                                                    <source src={a.url} type={a.mime} />
                                                                                                </video>
                                                                                            ) : (
                                                                                                <a
                                                                                                    key={ai}
                                                                                                    href={a.url}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-2 py-1 text-xs hover:bg-background"
                                                                                                >
                                                                                                    <FileText className="h-3.5 w-3.5" />
                                                                                                    <span className="max-w-[160px] truncate">
                                                                                                        {a.name}
                                                                                                    </span>
                                                                                                    <Download className="h-3 w-3" />
                                                                                                </a>
                                                                                            ),
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                        {m.body && (
                                                                            <p className="whitespace-pre-wrap break-words">
                                                                                {m.body}
                                                                            </p>
                                                                        )}
                                                                        {last && (
                                                                            <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                                                                                <span>
                                                                                    {new Date(
                                                                                        m.created_at
                                                                                    ).toLocaleTimeString('es', {
                                                                                        hour: '2-digit',
                                                                                        minute: '2-digit',
                                                                                    })}
                                                                                </span>
                                                                                {isAdmin && (
                                                                                    <ReadReceipt
                                                                                        readAt={m.read_at}
                                                                                        optimistic={m.id < 0}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {!stickToBottom && (
                                <Button
                                    type="button"
                                    size="icon"
                                    onClick={scrollToBottom}
                                    className="absolute bottom-24 left-1/2 z-20 h-9 w-9 -translate-x-1/2 rounded-full shadow-lg"
                                    aria-label="Ir al final"
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                            )}

                            {active.status === 'open' ? (
                                <form
                                    onSubmit={handleSend}
                                    className="flex shrink-0 flex-col gap-2 border-t border-border bg-card p-3"
                                >
                                    {pendingRefs.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {pendingRefs.map((r, i) => (
                                                <div
                                                    key={`${r.url}-${i}`}
                                                    className="group flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-2 py-1 text-xs"
                                                >
                                                    {isImage(r.mime) ? (
                                                        <img
                                                            src={r.url}
                                                            alt={r.name}
                                                            className="h-8 w-8 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <FileText className="h-3.5 w-3.5" />
                                                    )}
                                                    <span className="max-w-[140px] truncate">{r.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePendingRef(i)}
                                                        className="text-muted-foreground hover:text-destructive"
                                                        aria-label="Quitar adjunto"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setMediaPickerOpen(true)}
                                                    disabled={sending || pendingRefs.length >= 5}
                                                    aria-label="Adjuntar desde Medios"
                                                >
                                                    <Paperclip className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Adjuntar desde Medios</TooltipContent>
                                        </Tooltip>
                                        <Input
                                            placeholder="Escribe un mensaje..."
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            onKeyDown={handleComposerKey}
                                            onCompositionStart={() => {
                                                composingRef.current = true;
                                            }}
                                            onCompositionEnd={() => {
                                                composingRef.current = false;
                                            }}
                                            disabled={sending}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={
                                                sending ||
                                                (!text.trim() && pendingRefs.length === 0)
                                            }
                                            size="icon"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <MediaPickerDialog
                                        open={mediaPickerOpen}
                                        onOpenChange={setMediaPickerOpen}
                                        onPick={handleMediaPickerPick}
                                    />
                                </form>
                            ) : (
                                <div className="border-t border-border bg-card p-4 text-center text-sm text-muted-foreground">
                                    Esta conversación está cerrada.
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="grid h-full place-items-center text-center">
                            <div>
                                <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                                <p className="text-lg font-medium text-muted-foreground">Selecciona un chat</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Elige una conversación de la lista para empezar
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function ReadReceipt({
    readAt,
    optimistic,
}: {
    readAt: string | null;
    optimistic: boolean;
}) {
    if (optimistic) {
        return <Check className="h-3 w-3" />;
    }
    if (readAt) {
        return <CheckCheck className="h-3 w-3 text-sky-500" />;
    }
    return <Check className="h-3 w-3" />;
}

ChatInbox.layout = {
    breadcrumbs: [
        { title: 'Chat en Vivo', href: '/admin/chat' },
    ],
};
