import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    UserRoundPlus,
    Trash2,
    Pencil,
    CheckCircle2,
    AlertCircle,
    Users as UsersIcon,
    ShieldCheck,
    ShieldOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { destroy } from '@/actions/App/Http/Controllers/Admin/UserController';

type User = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    phone_country_code: string | null;
    phone_national: string | null;
    email_verified_at: string | null;
    avatar_url: string | null;
    roles: string[];
    created_at: string;
};

type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    users: {
        data: User[];
        links: PageLink[];
        total: number;
    };
    filters: { q: string; role: string };
    allRoles: string[];
};

export default function UsersIndex({ users, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const [search, setSearch] = useState(filters.q);
    const [role, setRole] = useState(filters.role);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Live-search: filter as the user types, with a small debounce so we
    // don't fire a request per keystroke. Skips the initial render and any
    // search value equal to the current URL filter to avoid a redundant hit.
    useEffect(() => {
        if (search === filters.q && role === filters.role) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.get('/admin/users', { q: search, role }, { preserveState: true, replace: true });
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search, role, filters.q, filters.role]);

    return (
        <>
            <Head title="Usuarios" />

            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-auto rounded-xl p-4">
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

                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        type="search"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs"
                    />
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                        <option value="">Todos los roles</option>
                        {props.allRoles.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                    <div className="ml-auto">
                        <Button asChild size="icon" aria-label="Nuevo usuario">
                            <Link href="/admin/users/create">
                                <UserRoundPlus className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                <th className="px-4 py-3 text-left font-medium">País · Teléfono</th>
                                <th className="px-4 py-3 text-left font-medium">Roles</th>
                                <th className="px-4 py-3 text-left font-medium">Verificado</th>
                                <th className="px-4 py-3 text-left font-medium">Registrado</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                        <UsersIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                        No hay usuarios
                                    </td>
                                </tr>
                            )}
                            {users.data.map((u) => (
                                <tr
                                    key={u.id}
                                    className="border-b border-border last:border-0 hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {u.avatar_url ? (
                                                <img
                                                    src={u.avatar_url}
                                                    alt={u.name}
                                                    className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border"
                                                />
                                            ) : (
                                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="font-medium">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {u.phone ? (
                                            <div className="flex items-center gap-2">
                                                {u.phone_country_code && (
                                                    <span
                                                        className={`iti__flag iti__${u.phone_country_code} h-3.5 w-5 shrink-0 rounded-sm shadow-sm`}
                                                    />
                                                )}
                                                <span className="font-mono text-xs">
                                                    {u.phone_country_code?.toUpperCase() ?? ''}
                                                    {u.phone_country_code && ' · '}
                                                    {u.phone_national ?? u.phone}
                                                </span>
                                            </div>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {u.roles.length === 0 && (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                            {u.roles.map((r) => (
                                                <span
                                                    key={r}
                                                    className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300"
                                                >
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.email_verified_at ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                                <ShieldCheck className="h-3 w-3" />
                                                Verificado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                                                <ShieldOff className="h-3 w-3" />
                                                Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {u.created_at}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/admin/users/${u.id}/edit`}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                            <ConfirmActionDialog
                                                actionUrl={destroy.url({ user: u.id })}
                                                title="¿Eliminar este usuario?"
                                                description={
                                                    <>
                                                        Vas a eliminar al usuario{' '}
                                                        <strong>{u.name}</strong>. Esta acción no
                                                        se puede deshacer.
                                                    </>
                                                }
                                            >
                                                {({ openDialog }) => (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={openDialog}
                                                        aria-label="Eliminar usuario"
                                                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </ConfirmActionDialog>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users.links.length > 3 && (
                    <nav className="flex flex-wrap items-center justify-center gap-1">
                        {users.links.map((l, i) => (
                            <Link
                                key={i}
                                href={l.url ?? '#'}
                                preserveScroll
                                className={`rounded-md px-3 py-1.5 text-sm ${
                                    l.active
                                        ? 'bg-primary text-primary-foreground'
                                        : l.url
                                            ? 'hover:bg-muted'
                                            : 'cursor-not-allowed text-muted-foreground'
                                }`}
                                dangerouslySetInnerHTML={{ __html: l.label }}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        { title: 'Usuarios', href: '/admin/users' },
    ],
};
