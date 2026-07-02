import {
    CheckCircle2,
    ImageIcon,
    Loader2,
    Search,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { index as mediaIndex, store as mediaStore } from '@/actions/App/Http/Controllers/Admin/MediaController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
};

export type PickedAttachment = {
    url: string;
    name: string;
    mime: string | null;
    size: number | null;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Called with the picked media-library refs on confirm. */
    onPick: (refs: PickedAttachment[]) => void;
};

type Tab = 'gallery' | 'upload';

const TYPE_FILTERS = [
    { v: 'all', l: 'Todos' },
    { v: 'image', l: 'Imágenes' },
    { v: 'application/pdf', l: 'PDFs' },
    { v: 'video', l: 'Videos' },
    { v: 'audio', l: 'Audio' },
];

function csrf(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

/**
 * Modal that lets the admin browse the Media Library and select files
 * already uploaded there, without re-uploading. Two tabs:
 *
 *  - Galería: lists existing media with multi-select checkboxes (uses the
 *    MediaCard layout from media-grid.tsx but kept inline so we can keep
 *    selection state inside the dialog).
 *  - Subir: drag-drop new file(s) that POST to MediaController::store. After
 *    upload completes the new item is auto-selected and switched to gallery.
 *
 * On confirm, emits a `PickedAttachment[]` so the chat composer can carry
 * the URLs as `attachment_refs` without copying the file.
 */
export function MediaPickerDialog({ open, onOpenChange, onPick }: Props) {
    const [tab, setTab] = useState<Tab>('gallery');
    const [type, setType] = useState('all');
    const [q, setQ] = useState('');
    const [qDraft, setQDraft] = useState('');
    const [items, setItems] = useState<MediaItem[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [loadingGallery, setLoadingGallery] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const fetchGallery = async (nextType: string, nextQ: string) => {
        setLoadingGallery(true);

        try {
            const url = mediaIndex.url({ query: { type: nextType, q: nextQ, json: 1 } });
            const res = await fetch(url, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                setItems([]);

                return;
            }

            const data = await res.json();
            setItems(data?.media?.data ?? []);
        } catch {
            setItems([]);
        } finally {
            setLoadingGallery(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchGallery(type, q);
        } else {
            // Reset for next open.
            setSelected(new Set());
            setUploadFiles([]);
            setUploadError(null);
            setTab('gallery');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (open) {
fetchGallery(type, q);
}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setQ(qDraft);
    };

    const toggle = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
next.delete(id);
} else {
next.add(id);
}

            return next;
        });
    };

    const handleUploadFiles = (newFiles: FileList | null) => {
        if (!newFiles) {
return;
}

        setUploadFiles(Array.from(newFiles));
        setUploadError(null);
    };

    const handleUpload = async () => {
        if (uploadFiles.length === 0) {
return;
}

        setUploading(true);
        setUploadError(null);

        try {
            const form = new FormData();
            uploadFiles.forEach((f) => form.append('files[]', f));
            const res = await fetch(mediaStore.url(), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: form,
            });

            if (!res.ok) {
                const text = await res.text();

                throw new Error(text || `Error ${res.status}`);
            }

            setUploadFiles([]);
            // Refresh the gallery so the newly uploaded items appear, then
            // switch to the gallery tab so the user can pick them.
            await fetchGallery(type, q);
            setTab('gallery');
        } catch (e) {
            setUploadError(e instanceof Error ? e.message : 'Error al subir.');
        } finally {
            setUploading(false);
        }
    };

    const handleConfirm = () => {
        const picked: PickedAttachment[] = [];

        for (const id of selected) {
            const item = items.find((m) => m.id === id);

            if (!item) {
continue;
}

            picked.push({
                url: item.url,
                name: item.name || item.file_name,
                mime: item.mime_type,
                size: item.size,
            });
        }

        onPick(picked);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
                <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        Adjuntar desde la biblioteca
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona archivos ya subidos en Medios. No se duplican, se referencian.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex shrink-0 items-center gap-1 border-b border-border bg-muted/30 px-6">
                    <TabButton active={tab === 'gallery'} onClick={() => setTab('gallery')}>
                        Galería
                    </TabButton>
                    <TabButton active={tab === 'upload'} onClick={() => setTab('upload')}>
                        Subir nuevo
                    </TabButton>
                </div>

                {tab === 'gallery' ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 py-4">
                        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1.5">
                                {TYPE_FILTERS.map((f) => (
                                    <Button
                                        key={f.v}
                                        type="button"
                                        size="sm"
                                        variant={type === f.v ? 'default' : 'outline'}
                                        onClick={() => setType(f.v)}
                                    >
                                        {f.l}
                                    </Button>
                                ))}
                            </div>
                            <form onSubmit={handleSearchSubmit} className="flex gap-2">
                                <Input
                                    type="search"
                                    placeholder="Buscar…"
                                    value={qDraft}
                                    onChange={(e) => setQDraft(e.target.value)}
                                    className="h-9 w-48"
                                />
                                <Button type="submit" size="sm" variant="secondary">
                                    <Search className="h-3.5 w-3.5" />
                                </Button>
                            </form>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                            {loadingGallery ? (
                                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cargando…
                                </div>
                            ) : items.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                                    <ImageIcon className="h-8 w-8 opacity-30" />
                                    <p>No hay archivos en esta categoría.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
                                    {items.map((item) => {
                                        const isSel = selected.has(item.id);

                                        return (
                                            <div
                                                key={item.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggle(item.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ' || e.key === 'Enter') {
                                                        e.preventDefault();
                                                        toggle(item.id);
                                                    }
                                                }}
                                                className={`group relative cursor-pointer overflow-hidden rounded-lg border bg-card transition ${
                                                    isSel
                                                        ? 'border-primary ring-2 ring-primary/30'
                                                        : 'border-border hover:border-primary/60'
                                                }`}
                                            >
                                                <div className="relative aspect-square bg-muted">
                                                    {item.thumb ? (
                                                        <img
                                                            src={item.thumb}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-muted-foreground">
                                                            {item.mime_type.split('/')[1]?.slice(0, 5) ?? 'file'}
                                                        </div>
                                                    )}
                                                    {isSel && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                                                            <CheckCircle2 className="h-8 w-8 text-white drop-shadow" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2">
                                                    <p
                                                        className="truncate text-xs font-medium"
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </p>
                                                    <p className="truncate text-[10px] uppercase text-muted-foreground">
                                                        {item.human_size}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {selected.size > 0
                                ? `${selected.size} archivo${selected.size > 1 ? 's' : ''} seleccionado${selected.size > 1 ? 's' : ''}.`
                                : 'Toca para seleccionar varios.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragging(false);
                                handleUploadFiles(e.dataTransfer.files);
                            }}
                            className={`rounded-lg border-2 border-dashed p-8 text-center transition ${
                                dragging
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-muted/30'
                            }`}
                        >
                            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Arrastra archivos aquí o
                            </p>
                            <label className="mt-2 inline-block cursor-pointer">
                                <span className="text-sm font-medium text-primary hover:underline">
                                    selecciónalos desde tu dispositivo
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => handleUploadFiles(e.target.files)}
                                />
                            </label>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Máximo 20 MB por archivo.
                            </p>
                        </div>

                        {uploadFiles.length > 0 && (
                            <ul className="max-h-32 space-y-1 overflow-y-auto rounded border p-2 text-sm">
                                {uploadFiles.map((f, i) => (
                                    <li
                                        key={`${f.name}-${i}`}
                                        className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted"
                                    >
                                        <span className="truncate">{f.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {(f.size / 1024).toFixed(1)} KB
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {uploadError && (
                            <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                                {uploadError}
                            </p>
                        )}

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                onClick={handleUpload}
                                disabled={uploading || uploadFiles.length === 0}
                            >
                                {uploading ? (
                                    <>
                                        <Spinner className="mr-2" />
                                        Subiendo…
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Subir y elegir después
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter className="shrink-0 border-t border-border bg-muted/30 px-6 py-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={selected.size === 0}
                    >
                        Adjuntar ({selected.size})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
            {children}
        </button>
    );
}

export default MediaPickerDialog;
