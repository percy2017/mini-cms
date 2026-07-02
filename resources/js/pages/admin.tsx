import { Head, router, usePage } from '@inertiajs/react';
import { useConnectionStatus, useSocketId } from '@laravel/echo-react';
import { AlertCircle, Loader2, RefreshCw, Wifi, WifiOff, Radio, Activity, Users, Hash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { admin } from '@/routes';

type Channel = {
    name: string;
    user_count: number;
    occupied: boolean;
};

type SocketStats = {
    connections: number | null;
    channels: Channel[] | null;
};

type Props = {
    storageLinked: boolean;
    socketStats: SocketStats;
};

function statusColor(status: string): string {
    switch (status) {
        case 'connected':
            return 'bg-emerald-500';
        case 'connecting':
        case 'reconnecting':
            return 'bg-amber-500';
        default:
            return 'bg-red-500';
    }
}

function statusLabel(status: string): string {
    switch (status) {
        case 'connected':
            return 'Conectado';
        case 'connecting':
            return 'Conectando…';
        case 'reconnecting':
            return 'Reconectando…';
        case 'disconnected':
            return 'Desconectado';
        case 'failed':
            return 'Falló';
        default:
            return status;
    }
}

function channelLabel(name: string): string {
    if (name.startsWith('private-')) {
return name.slice(8);
}

    if (name.startsWith('presence-')) {
return name.slice(9);
}

    return name;
}

export default function Admin({ storageLinked, socketStats: initial }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const status = useConnectionStatus();
    const socketId = useSocketId();

    const [serverStats, setServerStats] = useState<SocketStats>(initial);
    const [refreshing, setRefreshing] = useState(false);

    const refreshStats = async () => {
        setRefreshing(true);

        try {
            const res = await fetch('/admin/socket-stats', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });

            if (res.ok) {
                setServerStats(await res.json());
            }
        } catch {
            // ignore
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(refreshStats, 10_000);

        return () => clearInterval(interval);
    }, []);

    const handleCreateLink = async () => {
        setCreating(true);
        setError(null);

        try {
            const res = await fetch('/admin/storage/link', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data?.ok) {
                setError(data?.message ?? `Error ${res.status}`);

                return;
            }

            router.reload({ only: [] });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error desconocido.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <Head title="Admin" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        {flash.error}
                    </div>
                )}

                {!storageLinked && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                Falta el symlink <code className="rounded bg-amber-500/20 px-1 py-0.5 text-xs">public/storage</code>
                            </p>
                            <p className="mt-1 text-xs">
                                Los archivos subidos no se van a servir hasta que crees el symlink.
                            </p>
                            {error && (
                                <p className="mt-2 rounded border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                                    {error}
                                </p>
                            )}
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateLink}
                            disabled={creating}
                            className="shrink-0"
                        >
                            {creating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {creating ? 'Creando…' : 'Crear storage link'}
                        </Button>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Monitor de Sockets</h2>
                    <button
                        type="button"
                        onClick={refreshStats}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refrescar
                    </button>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Radio className="h-3.5 w-3.5" />
                            Echo
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Estado</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${statusColor(status)}`} />
                                    <span>{statusLabel(status)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Socket ID</span>
                                <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">
                                    {socketId ? socketId.slice(0, 16) + '…' : '—'}
                                </code>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Activity className="h-3.5 w-3.5" />
                            Servidor Reverb
                        </div>
                        {serverStats.connections !== null ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Conexiones</p>
                                    <p className="text-2xl font-bold tabular-nums">{serverStats.connections}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Canales</p>
                                    <p className="text-2xl font-bold tabular-nums">{serverStats.channels?.length ?? 0}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <WifiOff className="h-4 w-4 shrink-0" />
                                <span>No disponible</span>
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Hash className="h-3.5 w-3.5" />
                            Canales activos
                        </div>
                        {serverStats.channels && serverStats.channels.length > 0 ? (
                            <div className="space-y-1.5">
                                {serverStats.channels.slice(0, 5).map((ch) => (
                                    <div key={ch.name} className="flex items-center justify-between text-xs">
                                        <code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono">
                                            {channelLabel(ch.name)}
                                        </code>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Users className="h-3 w-3" />
                                            <span className="tabular-nums">{ch.user_count}</span>
                                        </div>
                                    </div>
                                ))}
                                {serverStats.channels.length > 5 && (
                                    <p className="pt-1 text-[10px] text-muted-foreground">
                                        +{serverStats.channels.length - 5} más
                                    </p>
                                )}
                            </div>
                        ) : serverStats.connections === null ? (
                            <p className="text-xs text-muted-foreground">Servidor no responde.</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">Sin canales activos.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Admin.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: admin(),
        },
    ],
};
