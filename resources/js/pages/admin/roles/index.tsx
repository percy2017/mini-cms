import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Plus,
    Search,
    Trash2,
    Pencil,
    CheckCircle2,
    AlertCircle,
    Shield,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { store, update, destroy } from '@/actions/App/Http/Controllers/Admin/RoleController';

type Role = {
    id: number;
    name: string;
    guard_name: string;
    permissions_count: number;
    users_count: number;
    created_at: string;
};

type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    roles: {
        data: Role[];
        links: PageLink[];
        total: number;
    };
    filters: { q: string };
    allPermissions: string[];
};

export default function RolesIndex({ roles, filters, allPermissions }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [form, setForm] = useState({ name: '', permissions: [] as string[] });
    const [search, setSearch] = useState(filters.q);
    const [submitting, setSubmitting] = useState(false);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', permissions: [] });
        setOpen(true);
    };

    const openEdit = async (role: Role) => {
        setEditing(role);
        setForm({ name: role.name, permissions: [] });
        setOpen(true);
        try {
            const res = await fetch(`/admin/roles/${role.id}/permissions`, {
                headers: { Accept: 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                setForm((f) => ({ ...f, permissions: data.permissions ?? [] }));
            }
        } catch {
            /* ignore */
        }
    };

    const togglePerm = (perm: string) => {
        setForm((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter((p) => p !== perm)
                : [...prev.permissions, perm],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const onFinish = () => setSubmitting(false);

        if (editing) {
            router.put(update.url({ role: editing.id }), form, {
                onSuccess: () => {
                    setOpen(false);
                    onFinish();
                },
                onError: onFinish,
            });
        } else {
            router.post(store.url(), form, {
                onSuccess: () => {
                    setOpen(false);
                    onFinish();
                },
                onError: onFinish,
            });
        }
    };

    const handleDelete = (id: number) => {
        if (!confirm('¿Eliminar este rol?')) return;
        router.delete(destroy.url({ role: id }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/roles', { q: search }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Roles" />

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

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Roles</h1>
                        <p className="text-sm text-muted-foreground">
                            {roles.total} {roles.total === 1 ? 'rol' : 'roles'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                type="search"
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-48"
                            />
                            <Button type="submit" variant="outline" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo rol
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                <th className="px-4 py-3 text-left font-medium">Permisos</th>
                                <th className="px-4 py-3 text-left font-medium">Usuarios</th>
                                <th className="px-4 py-3 text-left font-medium">Creado</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                        <Shield className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                        No hay roles
                                    </td>
                                </tr>
                            )}
                            {roles.data.map((r) => (
                                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-indigo-400" />
                                            <span className="font-medium">{r.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300">
                                            {r.permissions_count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-300">
                                            {r.users_count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.created_at}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(r)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(r.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {roles.links.length > 3 && (
                    <nav className="flex flex-wrap items-center justify-center gap-1">
                        {roles.links.map((l, i) => (
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

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Editar rol' : 'Nuevo rol'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                        {allPermissions.length > 0 && (
                            <div>
                                <Label>Permisos</Label>
                                <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded border border-white/10 bg-white/[0.02] p-3">
                                    {allPermissions.map((p) => {
                                        const active = form.permissions.includes(p);
                                        return (
                                            <label
                                                key={p}
                                                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-white/5"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={active}
                                                    onChange={() => togglePerm(p)}
                                                    className="h-3.5 w-3.5 rounded border-input accent-indigo-500"
                                                />
                                                <span className="font-mono text-xs text-slate-300">{p}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={submitting}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Spinner className="mr-2" /> : null}
                                {editing ? 'Actualizar' : 'Crear'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [
        { title: 'Roles', href: '/admin/roles' },
    ],
};
