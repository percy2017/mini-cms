import { useEffect, useRef, useState } from 'react';
import { echo, useEcho } from '@laravel/echo-react';
import PhoneInput, { type PhoneInputHandle } from '@/components/phone-input';
import { useChatNotification } from '@/hooks/use-chat-notification';
import {
    MessageCircle,
    X,
    Send,
    Loader2,
    LogIn,
    UserPlus,
    LogOut,
    CheckCircle2,
    AlertCircle,
    Paperclip,
    FileText,
    Download,
} from 'lucide-react';

type Settings = {
    chat_enabled: boolean;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    welcome_message: string;
    offline_message: string;
    online: boolean;
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
    body: string;
    sender_type: 'visitor' | 'admin';
    sender_name?: string | null;
    attachments?: Attachment[];
    created_at: string;
};

type AuthUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    phone_country_code: string | null;
    avatar_url: string | null;
};

const DEFAULT_SETTINGS: Settings = {
    chat_enabled: true,
    position: 'bottom-right',
    welcome_message: '',
    offline_message: '',
    online: true,
};

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function csrf(): string {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''
    );
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-TOKEN': csrf(),
    };
    const sid = echo().socketId();
    if (sid) headers['X-Socket-ID'] = sid;
    const res = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = (data && (data.message || (data.errors && Object.values(data.errors)[0]?.[0]))) || 'Error';
        throw new Error(typeof msg === 'string' ? msg : 'Error');
    }
    return data as T;
}

export default function ChatWidget({ settings = DEFAULT_SETTINGS }: { settings?: Settings }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uuid, setUuid] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<PhoneInputHandle>(null);

    // auth state
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
    const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [authError, setAuthError] = useState<string | null>(null);
    const [authSuccess, setAuthSuccess] = useState<string | null>(null);
    const [authSubmitting, setAuthSubmitting] = useState(false);

    const lastIdRef = useRef(0);
    const pollRef = useRef<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const playNotification = useChatNotification();

    useEcho(
        conversationId ? `chat.${conversationId}` : 'chat.none',
        'message.sent',
        (payload: { message?: Message }) => {
            const m = payload.message;
            if (!m) return;
            setMessages((prev) => {
                if (prev.some((x) => x.id === m.id)) return prev;
                lastIdRef.current = m.id;
                return [...prev, { ...m, sender_name: m.sender_name ?? null }];
            });
            // Only ding for inbound messages from the agent; the visitor's own
            // sends already play the standard send feedback in the UI.
            if (m.sender_type === 'admin') {
                playNotification();
            }
        },
        [conversationId],
        'private'
    );

    if (!settings.chat_enabled) return null;

    const isLeft = settings.position === 'bottom-left' || settings.position === 'top-left';
    const isTop = settings.position === 'top-right' || settings.position === 'top-left';
    const positionClass = [
        isLeft ? 'left-4 md:left-6' : 'right-4 md:right-6',
        isTop ? 'top-16 md:top-20' : 'bottom-4 md:bottom-6',
    ].join(' ');
    const panelPositionClass = [
        isLeft ? 'md:left-6' : 'md:right-6',
        isTop ? 'md:top-20' : 'md:bottom-6',
    ].join(' ');

    const ensureConversation = async (): Promise<string | null> => {
        setLoading(true);
        try {
            const data = await postJson<{ uuid: string; conversation_id: number; messages?: Message[] }>('/api/chat/init', {});
            setUuid(data.uuid);
            setConversationId(data.conversation_id);
            const initial: Message[] = (data.messages ?? []).map((m) => ({
                id: m.id,
                body: m.body,
                sender_type: m.sender_type as 'visitor' | 'admin',
                sender_name: m.sender_name ?? null,
                attachments: m.attachments ?? [],
                created_at: m.created_at,
            }));
            setMessages(initial);
            lastIdRef.current = initial.length > 0 ? initial[initial.length - 1].id : 0;
            return data.uuid;
        } catch (e) {
            console.error('chat init error', e);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const poll = async (currentUuid: string) => {
        try {
            const res = await fetch(`/api/chat/${currentUuid}/poll?after=${lastIdRef.current}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            const data = await res.json();
            const newMsgs: Message[] = (data.messages ?? []).map((m) => ({
                id: m.id,
                body: m.body,
                sender_type: m.sender_type as 'visitor' | 'admin',
                sender_name: m.sender_name ?? null,
                attachments: m.attachments ?? [],
                created_at: m.created_at,
            }));
            if (newMsgs.length > 0) {
                setMessages((prev) => [...prev, ...newMsgs]);
                lastIdRef.current = data.last_id ?? lastIdRef.current;
            }
        } catch (e) {
            console.error('chat poll error', e);
        }
    };

    const handleOpen = async () => {
        setOpen(true);
        try {
            const me = await fetch('/api/auth/me', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            const meData = await me.json();
            if (meData.authenticated) {
                setAuthUser(meData.user);
                // Reload conversation + messages on every open so the
                // visitor sees history accumulated since last visit.
                await ensureConversation();
            }
        } catch {}
    };

    const handleClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        if (open && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, open, authUser]);

    useEffect(() => {
        const loadMe = async () => {
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                const data = await res.json();
                setAuthUser(data.authenticated ? data.user : null);
            } catch {}
        };
        loadMe();
        const onFocus = () => loadMe();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setAuthSuccess(null);

        // Always read the E.164 number straight from the plugin so we
        // send the full international number, never just the national
        // digits the user typed.
        const phoneE164 = authTab === 'register' ? (phoneRef.current?.getNumber() ?? '') : '';

        if (authTab === 'register' && !phoneE164.trim()) {
            setAuthError('Ingresa tu teléfono.');
            return;
        }

        setAuthSubmitting(true);
        try {
            const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
            const payload =
                authTab === 'login'
                    ? { email: authForm.email, password: authForm.password }
                    : {
                          name: authForm.name,
                          email: authForm.email,
                          phone: phoneE164,
                          password: authForm.password,
                      };
            const data = await postJson<{ ok: boolean; requires_verification?: boolean; user: AuthUser }>(endpoint, payload);

            // Registration now requires email verification — the backend
            // sends the link and refuses to log us in until the user
            // clicks it. Surface that to the form so the visitor knows
            // to check their inbox instead of seeing an empty chat.
            if (authTab === 'register' && data.requires_verification) {
                setAuthError(null);
                setAuthSuccess('Te enviamos un correo de verificación. Revisa tu bandeja de entrada.');
                setAuthForm({ name: '', email: '', phone: '', password: '' });
                return;
            }

            setAuthUser(data.user);
            setAuthSuccess(authTab === 'login' ? 'Sesión iniciada.' : 'Cuenta creada.');
            setAuthForm({ name: '', email: '', phone: '', password: '' });
            await ensureConversation();
        } catch (e) {
            setAuthError(e instanceof Error ? e.message : 'Error');
        } finally {
            setAuthSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await postJson('/api/auth/logout', {});
            setAuthUser(null);
            setMessages([]);
            setUuid(null);
            setConversationId(null);
            lastIdRef.current = 0;
        } catch (e) {
            console.error('logout', e);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sending) return;
        const body = input.trim();
        if (!body && pendingFiles.length === 0) return;
        setSending(true);
        setInput('');

        try {
            const u = uuid ?? (await ensureConversation());
            if (!u) return;
            const form = new FormData();
            if (body) form.append('body', body);
            pendingFiles.forEach((f) => form.append('attachments[]', f));
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrf(),
                'X-Requested-With': 'XMLHttpRequest',
            };
            const sid = echo().socketId();
            if (sid) headers['X-Socket-ID'] = sid;
            const res = await fetch(`/api/chat/${u}/send`, {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: form,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message ?? 'Error al enviar');
            const newId = data.message_id;
            if (newId) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: newId,
                        body,
                        sender_type: 'visitor',
                        sender_name: 'Tú',
                        attachments: pendingFiles.map((f) => ({
                            path: '',
                            name: f.name,
                            mime: f.type || null,
                            size: f.size,
                            url: URL.createObjectURL(f),
                        })),
                        created_at: new Date().toISOString(),
                    },
                ]);
                lastIdRef.current = newId;
            }
            setPendingFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (e) {
            console.error('chat send error', e);
            setInput(body);
        } finally {
            setSending(false);
        }
    };

    const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = Array.from(e.target.files ?? []);
        if (!list.length) return;
        setPendingFiles((prev) => [...prev, ...list].slice(0, 5));
        e.target.value = '';
    };

    const removePendingFile = (idx: number) =>
        setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

    const isImage = (mime: string | null | undefined): boolean =>
        !!mime && mime.startsWith('image/');

    return (
        <>
            {!open && (
                <button
                    type="button"
                    onClick={handleOpen}
                    className={`fixed bottom-4 z-50 grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-2xl shadow-black/30 ring-2 ring-white/20 transition hover:scale-105 md:bottom-6 md:h-16 md:w-16 ${positionClass}`}
                    aria-label={authUser ? `Abrir chat (${authUser.name})` : 'Abrir chat'}
                    title={authUser ? `Hola, ${authUser.name}` : 'Abrir chat'}
                >
                    {authUser?.avatar_url ? (
                        <img
                            src={authUser.avatar_url}
                            alt={authUser.name}
                            className="h-full w-full object-cover"
                        />
                    ) : authUser ? (
                        <span className="grid h-full w-full place-items-center bg-white/20 text-base font-bold md:text-lg">
                            {authUser.name.charAt(0).toUpperCase()}
                        </span>
                    ) : (
                        <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
                    )}
                </button>
            )}

            {open && (
                <div
                    className={`fixed inset-0 z-50 flex h-full w-full flex-col overflow-hidden bg-card text-card-foreground md:inset-auto md:bottom-6 md:h-[560px] md:max-h-[85vh] md:w-[calc(100vw-2rem)] md:max-w-sm md:rounded-2xl md:border md:border-border md:shadow-2xl md:shadow-black/40 ${panelPositionClass}`}
                >
                    <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
                        <div className="flex items-center gap-2">
                            {authUser?.avatar_url ? (
                                <img
                                    src={authUser.avatar_url}
                                    alt={authUser.name}
                                    className="h-7 w-7 rounded-full object-cover"
                                />
                            ) : authUser ? (
                                <div className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-xs font-bold">
                                    {authUser.name.charAt(0).toUpperCase()}
                                </div>
                            ) : (
                                <MessageCircle className="h-5 w-5" />
                            )}
                            {authUser ? (
                                <div className="leading-tight">
                                    <p className="text-sm font-semibold">{authUser.name}</p>
                                    {authUser.phone ? (
                                        <div className="flex items-center gap-1 font-mono text-[11px] opacity-90">
                                            {authUser.phone_country_code && (
                                                <span
                                                    className={`iti__flag iti__${authUser.phone_country_code} h-3 w-4 shrink-0 rounded-sm shadow-sm`}
                                                />
                                            )}
                                            <span>
                                                {authUser.phone_country_code?.toUpperCase() ?? ''}
                                                {authUser.phone_country_code && ' · '}
                                                {authUser.phone}
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-[11px] opacity-70">Sin teléfono</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm font-semibold">Chat con HostBol</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {authUser && (
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="grid h-8 w-8 place-items-center rounded-full hover:bg-primary-foreground/20"
                                    aria-label="Cerrar sesión"
                                    title="Cerrar sesión"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleClose}
                                className="grid h-8 w-8 place-items-center rounded-full hover:bg-primary-foreground/20"
                                aria-label="Cerrar chat"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {!authUser ? (
                        <div className="flex flex-1 flex-col bg-background p-4">
                            <p className="mb-3 text-center text-xs text-muted-foreground">
                                Inicia sesión o regístrate para chatear con nosotros.
                            </p>

                            <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted p-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthTab('login');
                                        setAuthError(null);
                                        setAuthSuccess(null);
                                    }}
                                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition ${
                                        authTab === 'login'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent'
                                    }`}
                                >
                                    <LogIn className="h-3.5 w-3.5" />
                                    Iniciar sesión
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthTab('register');
                                        setAuthError(null);
                                        setAuthSuccess(null);
                                    }}
                                    className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition ${
                                        authTab === 'register'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent'
                                    }`}
                                >
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Registrarse
                                </button>
                            </div>

                            {authError && (
                                <div className="mb-2 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{authError}</span>
                                </div>
                            )}
                            {authSuccess && (
                                <div className="mb-2 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{authSuccess}</span>
                                </div>
                            )}

                            <form onSubmit={handleAuthSubmit} className="flex flex-1 flex-col gap-2 overflow-y-auto">
                                {authTab === 'register' && (
                                    <>
                                        <div>
                                            <label className="mb-1 block text-xs text-foreground">Nombre</label>
                                            <input
                                                type="text"
                                                required
                                                value={authForm.name}
                                                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                                                placeholder="Tu nombre"
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs text-foreground">Teléfono</label>
                                            <div className="intl-tel-input-dark">
                                                <PhoneInput
                                                    ref={phoneRef}
                                                    value={authForm.phone}
                                                    onChange={(v) => setAuthForm({ ...authForm, phone: v })}
                                                    placeholder="70000000"
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="mb-1 block text-xs text-foreground">Correo electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        value={authForm.email}
                                        onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                        placeholder="tu@email.com"
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-foreground">Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={authForm.password}
                                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                        placeholder="••••••"
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={authSubmitting}
                                    className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                                >
                                    {authSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : authTab === 'login' ? (
                                        <LogIn className="h-4 w-4" />
                                    ) : (
                                        <UserPlus className="h-4 w-4" />
                                    )}
                                    {authTab === 'login' ? 'Entrar' : 'Crear cuenta'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-background p-3">
                                {messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`flex ${m.sender_type === 'visitor' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                                m.sender_type === 'visitor'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-foreground'
                                            }`}
                                        >
                                            {m.attachments && m.attachments.length > 0 && (
                                                <div className="mb-1.5 flex flex-wrap gap-1.5">
                                                    {m.attachments.map((a, i) =>
                                                        isImage(a.mime) ? (
                                                            <a
                                                                key={i}
                                                                href={a.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <img
                                                                    src={a.url}
                                                                    alt={a.name}
                                                                    className="max-h-40 max-w-full rounded-lg object-cover"
                                                                />
                                                            </a>
                                                        ) : a.mime?.startsWith('video/') ? (
                                                            <video
                                                                key={i}
                                                                controls
                                                                className="max-h-40 max-w-full rounded-lg"
                                                                preload="metadata"
                                                            >
                                                                <source src={a.url} type={a.mime} />
                                                            </video>
                                                        ) : (
                                                            <a
                                                                key={i}
                                                                href={a.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1 text-xs hover:bg-background/70"
                                                            >
                                                                <FileText className="h-3.5 w-3.5" />
                                                                <span className="max-w-[140px] truncate">
                                                                    {a.name}
                                                                </span>
                                                                <Download className="h-3 w-3" />
                                                            </a>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                            {m.body && (
                                                <p className="break-words whitespace-pre-wrap">{m.body}</p>
                                            )}
                                            <p
                                                className={`mt-1 text-[10px] ${
                                                    m.sender_type === 'visitor' ? 'opacity-80' : 'text-muted-foreground'
                                                }`}
                                            >
                                                {new Date(m.created_at).toLocaleTimeString('es', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {loading && messages.length === 0 && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Conectando...
                                    </div>
                                )}
                            </div>

                            <form
                                onSubmit={handleSend}
                                className="flex flex-col gap-1.5 border-t border-border bg-muted/40 px-3 py-2"
                            >
                                {pendingFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {pendingFiles.map((f, i) => (
                                            <div
                                                key={`${f.name}-${i}`}
                                                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground"
                                            >
                                                {f.type.startsWith('image/') ? (
                                                    <img
                                                        src={URL.createObjectURL(f)}
                                                        alt={f.name}
                                                        className="h-7 w-7 rounded object-cover"
                                                    />
                                                ) : (
                                                    <Paperclip className="h-3 w-3" />
                                                )}
                                                <span className="max-w-[120px] truncate">{f.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removePendingFile(i)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                    aria-label="Quitar archivo"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
                                        onChange={handleFilesPicked}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={sending || pendingFiles.length >= 5}
                                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent disabled:opacity-50"
                                        aria-label="Adjuntar archivo"
                                        title="Adjuntar archivo"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </button>
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || (!input.trim() && pendingFiles.length === 0)}
                                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                                        aria-label="Enviar"
                                    >
                                        {sending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    );
}