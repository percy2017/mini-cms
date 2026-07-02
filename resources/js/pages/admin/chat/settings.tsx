import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/actions/App/Http/Controllers/Admin/ChatSettingsController';

type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

type Settings = {
    chat_enabled: boolean;
    position: Position;
    welcome_message: string;
    offline_message: string;
    business_start: string;
    business_end: string;
    business_days: number[];
};

type Props = { settings: Settings };

const POSITIONS: { value: Position; label: string; icon: string }[] = [
    { value: 'bottom-right', label: 'Inferior derecha', icon: '↘' },
    { value: 'bottom-left', label: 'Inferior izquierda', icon: '↙' },
    { value: 'top-right', label: 'Superior derecha', icon: '↗' },
    { value: 'top-left', label: 'Superior izquierda', icon: '↖' },
];

function FloatingButtonPreview({ position }: { position: Position }) {
    const cornerClass: Record<Position, string> = {
        'bottom-right': 'bottom-3 right-3',
        'bottom-left': 'bottom-3 left-3',
        'top-right': 'top-3 right-3',
        'top-left': 'top-3 left-3',
    };

    return (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            <div className="absolute inset-x-0 top-0 flex h-6 items-center gap-1.5 border-b border-border bg-background/80 px-3">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400/70" />
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400/70" />
                <span className="h-1.5 w-1.5 rounded-full bg-green-400/70" />
                <div className="mx-auto h-2 w-32 rounded bg-muted-foreground/20" />
            </div>
            <div className="absolute inset-x-3 top-9 space-y-1.5">
                <div className="h-2 w-2/3 rounded bg-muted-foreground/25" />
                <div className="h-2 w-1/2 rounded bg-muted-foreground/20" />
                <div className="h-2 w-3/4 rounded bg-muted-foreground/15" />
                <div className="h-2 w-1/3 rounded bg-muted-foreground/20" />
                <div className="h-2 w-1/2 rounded bg-muted-foreground/15" />
            </div>
            <div
                className={`absolute grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-white/30 ${cornerClass[position]}`}
                aria-hidden="true"
            >
                <MessageCircle className="h-4 w-4" />
            </div>
        </div>
    );
}

export default function ChatSettingsPage({ settings }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const [form, setForm] = useState<Settings>(settings);
    const [saving, setSaving] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        router.patch(update.url(), form, {
            onSuccess: () => setSaving(false),
            onError: () => setSaving(false),
        });
    };

    return (
        <>
            <Head title="Configuración del Chat" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-4 w-4" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {flash.error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                            <h3 className="font-semibold">General</h3>

                            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-background p-3">
                                <div>
                                    <div className="text-sm font-medium">Chat habilitado</div>
                                    <p className="text-xs text-muted-foreground">
                                        Mostrar el botón flotante a los visitantes
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={form.chat_enabled}
                                    onChange={(e) =>
                                        setForm({ ...form, chat_enabled: e.target.checked })
                                    }
                                    className="h-5 w-5 rounded accent-indigo-500"
                                />
                            </label>

                            <div>
                                <Label className="text-sm">Posición del botón</Label>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {POSITIONS.map((p) => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, position: p.value })}
                                            className={`rounded-lg border-2 p-3 text-sm transition ${
                                                form.position === p.value
                                                    ? 'border-indigo-400 bg-indigo-500/10'
                                                    : 'border-border hover:border-indigo-400/40'
                                            }`}
                                        >
                                            <span className="mr-1 text-base">{p.icon}</span>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                            <div>
                                <h3 className="font-semibold">Vista previa</h3>
                                <p className="text-xs text-muted-foreground">
                                    Así se ve el botón flotante sobre la landing.
                                </p>
                            </div>
                            <FloatingButtonPreview position={form.position} />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar configuración
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ChatSettingsPage.layout = {
    breadcrumbs: [
        { title: 'Chat en Vivo', href: '/admin/chat' },
        { title: 'Configuración', href: '/admin/chat/settings' },
    ],
};