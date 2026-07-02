import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Copy, Download, Trash2, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { destroy, update } from '@/actions/App/Http/Controllers/Admin/MediaController';

type Props = {
    media: {
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
        custom_properties: Record<string, unknown>;
    };
};

export default function MediaShow({ media }: Props) {
    const [name, setName] = useState(media.name);
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(media.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        setSaving(true);
        router.patch(
            update.url({ media: media.id }),
            { name },
            {
                preserveScroll: true,
                onSuccess: () => setSaving(false),
                onError: () => setSaving(false),
            },
        );
    };

    const handleDelete = () => {
        if (!confirm('¿Eliminar este archivo permanentemente?')) return;
        router.delete(destroy.url({ media: media.id }));
    };

    return (
        <>
            <Head title={media.name} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/admin/media">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a la biblioteca
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-lg border border-border bg-card">
                            {media.is_image ? (
                                <img
                                    src={media.url}
                                    alt={media.name}
                                    className="mx-auto max-h-[600px] w-full object-contain"
                                />
                            ) : media.mime_type.startsWith('video/') ? (
                                <video controls className="w-full">
                                    <source src={media.url} type={media.mime_type} />
                                </video>
                            ) : media.mime_type.startsWith('audio/') ? (
                                <div className="p-8">
                                    <audio controls className="w-full">
                                        <source src={media.url} type={media.mime_type} />
                                    </audio>
                                </div>
                            ) : (
                                <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 p-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No hay previsualización disponible
                                    </p>
                                    <Button asChild>
                                        <a href={media.url} download>
                                            <Download className="mr-2 h-4 w-4" />
                                            Descargar para ver
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-lg border border-border bg-card p-4">
                            <h2 className="mb-3 font-semibold">Detalles del archivo</h2>

                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="name">Nombre</Label>
                                    <div className="mt-1 flex gap-2">
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <Button
                                            size="icon"
                                            onClick={handleSave}
                                            disabled={saving || name === media.name}
                                            title="Guardar nombre"
                                        >
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Tipo</dt>
                                        <dd className="font-mono text-xs uppercase">
                                            {media.mime_type}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Tamaño</dt>
                                        <dd>{media.human_size}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">Subido</dt>
                                        <dd className="text-xs">{media.created_at}</dd>
                                    </div>
                                </dl>

                                <Separator />

                                <div>
                                    <Label>URL del archivo</Label>
                                    <div className="mt-1 flex gap-2">
                                        <Input
                                            readOnly
                                            value={media.url}
                                            className="font-mono text-xs"
                                            onClick={(e) => e.currentTarget.select()}
                                        />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={handleCopy}
                                            title="Copiar URL"
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button asChild variant="outline">
                                <a href={media.url} download={media.file_name}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar
                                </a>
                            </Button>
                            <Button asChild variant="outline">
                                <a href={media.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Abrir en pestaña nueva
                                </a>
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar permanentemente
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

MediaShow.layout = {
    breadcrumbs: [
        { title: 'Biblioteca', href: '/admin/media' },
        { title: 'Detalle', href: '' },
    ],
};
