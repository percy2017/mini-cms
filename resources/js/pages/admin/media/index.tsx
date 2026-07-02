import { Head, Link, router, usePage } from '@inertiajs/react';
import { Trash2, Download, ExternalLink, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { destroy, update } from '@/actions/App/Http/Controllers/Admin/MediaController';
import { ImageGeneratorDialog } from '@/components/media/image-generator-dialog';
import { MediaFilters, MediaSearch, MediaUploader } from '@/components/media/media-grid';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type MediaItem = {
    id: number;
    name: string;
    file_name: string;
    mime_type: string;
    size: number;
    human_size: string;
    url: string;
    thumb: string | null;
    is_image: boolean;
    created_at: string;
};

type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    media: {
        data: MediaItem[];
        links: PageLink[];
        total: number;
    };
    filters: { type: string; q: string };
};

export default function MediaIndex({ media, filters }: Props) {
    const [selected, setSelected] = useState<number[]>([]);
    const [deleting, setDeleting] = useState(false);
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const toggle = (id: number) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const handleDelete = (id: number) => {
        if (!confirm('¿Eliminar este archivo?')) {
return;
}

        router.delete(destroy.url({ media: id }), {
            preserveScroll: true,
        });
    };

    const handleBulkDelete = async () => {
        if (!confirm(`¿Eliminar ${selected.length} archivo(s)?`)) {
return;
}

        setDeleting(true);

        for (const id of selected) {
            await new Promise<void>((resolve) => {
                router.delete(destroy.url({ media: id }), {
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => resolve(),
                });
            });
        }

        setSelected([]);
        setDeleting(false);
    };

    return (
        <>
            <Head title="Biblioteca de medios" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
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

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Biblioteca de medios</h1>
                        <p className="text-sm text-muted-foreground">
                            {media.total} {media.total === 1 ? 'archivo' : 'archivos'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <MediaSearch defaultValue={filters.q} />
                        <ImageGeneratorDialog />
                        <MediaUploader />
                    </div>
                </div>

                <MediaFilters type={filters.type} q={filters.q} />

                {selected.length > 0 && (
                    <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/5 p-3">
                        <span className="text-sm font-medium">
                            {selected.length} seleccionado{selected.length > 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleBulkDelete}
                                disabled={deleting}
                            >
                                {deleting ? <Spinner className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Eliminar
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelected([])}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                {media.data.length === 0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                        <p className="text-lg font-medium text-muted-foreground">
                            No hay archivos todavía
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Sube tu primer archivo usando el botón "Añadir nuevo"
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {media.data.map((item) => (
                            <div key={item.id} className="group relative">
                                <Link
                                    href={`/admin/media/${item.id}`}
                                    className="block"
                                    preserveScroll
                                >
                                    <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary">
                                        {item.thumb ? (
                                            <img
                                                src={item.thumb}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                                <span className="text-xs uppercase">
                                                    {item.mime_type.split('/')[1]?.slice(0, 4) ?? 'file'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-medium" title={item.name}>
                                        {item.name}
                                    </p>
                                    <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] uppercase text-muted-foreground">
                                    {item.mime_type} · {item.human_size}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {media.links.length > 3 && (
                    <nav className="flex flex-wrap items-center justify-center gap-1 pt-4">
                        {media.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveScroll
                                className={`rounded-md px-3 py-1.5 text-sm ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : link.url
                                            ? 'hover:bg-muted'
                                            : 'cursor-not-allowed text-muted-foreground'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </nav>
                )}
            </div>
        </>
    );
}

MediaIndex.layout = {
    breadcrumbs: [
        { title: 'Biblioteca', href: '/admin/media' },
    ],
};
