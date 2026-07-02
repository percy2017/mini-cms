import { useForm, router } from '@inertiajs/react';
import { ImageIcon, FileText, Music, Video, File, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/Admin/MediaController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

type FileIconType = 'image' | 'document' | 'video' | 'audio' | 'file';

function getFileIcon(mime: string | null): FileIconType {
    if (!mime) {
return 'file';
}

    if (mime.startsWith('image/')) {
return 'image';
}

    if (mime.startsWith('video/')) {
return 'video';
}

    if (mime.startsWith('audio/')) {
return 'audio';
}

    if (mime.includes('pdf') || mime.includes('text') || mime.includes('document')) {
return 'document';
}

    return 'file';
}

function FileIcon({ type, className }: { type: FileIconType; className?: string }) {
    const cls = className ?? 'h-8 w-8';

    switch (type) {
        case 'image':
            return <ImageIcon className={cls} />;
        case 'video':
            return <Video className={cls} />;
        case 'audio':
            return <Music className={cls} />;
        case 'document':
            return <FileText className={cls} />;
        default:
            return <File className={cls} />;
    }
}

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

export function MediaCard({
    item,
    onSelect,
    selected,
}: {
    item: MediaItem;
    onSelect: (id: number) => void;
    selected: boolean;
}) {
    const iconType = getFileIcon(item.mime_type);

    return (
        <div
            className={`group relative cursor-pointer overflow-hidden rounded-lg border bg-card transition hover:border-primary ${
                selected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
            }`}
            onClick={() => onSelect(item.id)}
        >
            <div className="relative aspect-square bg-muted">
                {item.thumb ? (
                    <img
                        src={item.thumb}
                        alt={item.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <FileIcon type={iconType} className="h-12 w-12" />
                    </div>
                )}

                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />

                <div className="absolute right-2 top-2">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                            e.stopPropagation();
                            onSelect(item.id);
                        }}
                        className="h-4 w-4 cursor-pointer rounded border-white accent-primary"
                    />
                </div>
            </div>

            <div className="p-3">
                <p className="truncate text-xs font-medium" title={item.name}>
                    {item.name}
                </p>
                <p className="mt-0.5 truncate text-[10px] uppercase text-muted-foreground">
                    {item.mime_type} · {item.human_size}
                </p>
            </div>
        </div>
    );
}

export function MediaFilters({
    type,
    q,
}: {
    type: string;
    q: string;
}) {
    const handleTypeChange = (newType: string) => {
        router.get(
            '/admin/media',
            { type: newType, q },
            { preserveState: true, replace: true },
        );
    };

    return (
        <div className="flex flex-wrap gap-2">
            {[
                { v: 'all', l: 'Todos' },
                { v: 'image', l: 'Imágenes' },
                { v: 'application/pdf', l: 'PDFs' },
                { v: 'video', l: 'Videos' },
                { v: 'audio', l: 'Audio' },
            ].map((opt) => (
                <Button
                    key={opt.v}
                    type="button"
                    size="sm"
                    variant={type === opt.v || (opt.v === 'all' && type === 'all') ? 'default' : 'outline'}
                    onClick={() => handleTypeChange(opt.v)}
                >
                    {opt.l}
                </Button>
            ))}
        </div>
    );
}

export function MediaSearch({ defaultValue = '' }: { defaultValue?: string }) {
    const [value, setValue] = useState(defaultValue);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(window.location.search);

        if (value) {
params.set('q', value);
} else {
params.delete('q');
}

        router.get(`/admin/media?${params.toString()}`, {}, { preserveState: true, replace: true });
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                type="search"
                placeholder="Buscar archivos..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-64"
            />
            <Button type="submit" variant="secondary">
                Buscar
            </Button>
        </form>
    );
}

export function MediaUploader() {
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const { data, setData, post, processing, progress, reset } = useForm<{
        files: File[];
    }>({ files: [] });

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) {
return;
}

        const arr = Array.from(newFiles);
        setFiles(arr);
        setData('files', arr);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url(), {
            forceFormData: true,
            onSuccess: () => {
                setFiles([]);
                reset();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Añadir nuevo
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Subir archivos</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragging(false);
                            handleFiles(e.dataTransfer.files);
                        }}
                        className={`rounded-lg border-2 border-dashed p-10 text-center transition ${
                            dragging
                                ? 'border-primary bg-primary/5'
                                : 'border-border bg-muted/30'
                        }`}
                    >
                        <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
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
                                onChange={(e) => handleFiles(e.target.files)}
                            />
                        </label>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Máximo 20 MB por archivo
                        </p>
                    </div>

                    {files.length > 0 && (
                        <ul className="max-h-40 space-y-1 overflow-y-auto rounded border p-2 text-sm">
                            {files.map((f, i) => (
                                <li
                                    key={i}
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

                    {processing && progress && (
                        <div className="space-y-1">
                            <div className="h-2 overflow-hidden rounded bg-muted">
                                <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Subiendo... {progress.percentage}%
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setOpen(false);
                                setFiles([]);
                            }}
                            disabled={processing}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing || files.length === 0}>
                            {processing ? <Spinner className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
                            Subir {files.length > 0 && `(${files.length})`}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
