import { router } from '@inertiajs/react';
import { Sparkles, ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { generate } from '@/actions/App/Http/Controllers/Admin/AiImageController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Mode = 'text-to-image' | 'image-to-image';

const ASPECT_RATIOS = [
    { v: '1:1', label: '1:1', desc: '1024×1024' },
    { v: '16:9', label: '16:9', desc: '1280×720' },
    { v: '4:3', label: '4:3', desc: '1152×864' },
    { v: '3:2', label: '3:2', desc: '1248×832' },
    { v: '2:3', label: '2:3', desc: '832×1248' },
    { v: '3:4', label: '3:4', desc: '864×1152' },
    { v: '9:16', label: '9:16', desc: '720×1280' },
    { v: '21:9', label: '21:9', desc: '1344×576' },
] as const;

export function ImageGeneratorDialog() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>('text-to-image');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [n, setN] = useState(1);
    const [seed, setSeed] = useState('');
    const [optimizer, setOptimizer] = useState(false);
    const [reference, setReference] = useState<File | null>(null);
    const [referencePreview, setReferencePreview] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const charCount = prompt.length;

    const handleReferenceChange = (file: File | null) => {
        setReference(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setReferencePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setReferencePreview(null);
        }
    };

    const reset = () => {
        setPrompt('');
        setAspectRatio('1:1');
        setN(1);
        setSeed('');
        setOptimizer(false);
        setReference(null);
        setReferencePreview(null);
        setError(null);
        setMode('text-to-image');
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === 'image-to-image' && !reference) {
            setError('Sube una imagen de referencia para este modo.');

            return;
        }

        setGenerating(true);

        try {
            let referenceMediaId: number | null = null;

            if (mode === 'image-to-image' && reference) {
                const formData = new FormData();
                formData.append('files[]', reference);

                const uploadRes = await fetch('/admin/media', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]',
                            )?.content ?? '',
                        'X-Inertia': 'true',
                        'X-Inertia-partial-component': 'true',
                    },
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error('Error al subir la imagen de referencia.');
                }

                const mediaListRes = await fetch('/admin/media?type=image', {
                    headers: { Accept: 'application/json' },
                });

                if (mediaListRes.ok) {
                    const data = await mediaListRes.json();
                    referenceMediaId = data?.media?.data?.[0]?.id ?? null;
                }

                if (!referenceMediaId) {
                    throw new Error('No se pudo obtener el ID de la imagen de referencia.');
                }
            }

            router.post(
                generate.url(),
                {
                    mode,
                    prompt,
                    aspect_ratio: aspectRatio,
                    n,
                    seed: seed === '' ? null : Number(seed),
                    prompt_optimizer: optimizer,
                    reference_image_id: referenceMediaId,
                },
                {
                    onSuccess: () => {
                        setOpen(false);
                        reset();
                    },
                    onError: (errors) => {
                        setError(
                            Object.values(errors)[0]?.toString() ??
                                'Error al generar la imagen.',
                        );
                    },
                },
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                setOpen(o);

                if (!o) {
reset();
}
            }}
        >
            <DialogTrigger asChild>
                <Button variant="secondary">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar con IA
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Generar imagen con IA
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleGenerate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setMode('text-to-image')}
                            className={`rounded-lg border-2 p-3 text-left transition ${
                                mode === 'text-to-image'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                            }`}
                        >
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Sparkles className="h-4 w-4" />
                                Texto → Imagen
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Genera desde una descripción
                            </p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('image-to-image')}
                            className={`rounded-lg border-2 p-3 text-left transition ${
                                mode === 'image-to-image'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                            }`}
                        >
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <ImageIcon className="h-4 w-4" />
                                Imagen → Imagen
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Usa una imagen de referencia
                            </p>
                        </button>
                    </div>

                    {mode === 'image-to-image' && (
                        <div className="rounded-lg border-2 border-dashed border-border p-4">
                            <Label className="text-sm">Imagen de referencia</Label>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                className="hidden"
                                onChange={(e) =>
                                    handleReferenceChange(e.target.files?.[0] ?? null)
                                }
                            />
                            {referencePreview ? (
                                <div className="mt-2 flex items-start gap-3">
                                    <img
                                        src={referencePreview}
                                        alt="Referencia"
                                        className="h-24 w-24 rounded object-cover"
                                    />
                                    <div className="flex-1 space-y-2">
                                        <p className="truncate text-sm">{reference?.name}</p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                handleReferenceChange(null);

                                                if (fileRef.current) {
fileRef.current.value = '';
}
                                            }}
                                        >
                                            <X className="mr-2 h-3 w-3" />
                                            Quitar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted/30"
                                >
                                    <Upload className="h-4 w-4" />
                                    Haz clic para subir imagen (JPG/PNG, máx 10MB)
                                </button>
                            )}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="prompt" className="text-sm">
                            Descripción *
                        </Label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe la imagen que quieres generar..."
                            className="mt-1 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            maxLength={1500}
                            required
                        />
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                            <label className="flex cursor-pointer items-center gap-1.5">
                                <input
                                    type="checkbox"
                                    checked={optimizer}
                                    onChange={(e) => setOptimizer(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-input"
                                />
                                Optimizar descripción automáticamente
                            </label>
                            <span className={charCount > 1400 ? 'text-destructive' : ''}>
                                {charCount}/1500
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-sm">Aspecto</Label>
                            <select
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                            >
                                {ASPECT_RATIOS.map((ar) => (
                                    <option key={ar.v} value={ar.v}>
                                        {ar.label} ({ar.desc})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className="text-sm">Cantidad</Label>
                            <div className="mt-1 flex h-9 items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setN(Math.max(1, n - 1))}
                                    disabled={n <= 1}
                                >
                                    −
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">
                                    {n}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setN(Math.min(4, n + 1))}
                                    disabled={n >= 4}
                                >
                                    +
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="seed" className="text-sm">
                            Seed (opcional)
                        </Label>
                        <Input
                            id="seed"
                            type="number"
                            value={seed}
                            onChange={(e) => setSeed(e.target.value)}
                            placeholder="Aleatorio"
                            className="mt-1"
                        />
                    </div>

                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={generating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={generating || !prompt.trim()}
                        >
                            {generating ? (
                                <>
                                    <Spinner className="mr-2" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generar
                                </>
                            )}
                        </Button>
                    </div>

                    {generating && (
                        <p className="text-center text-xs text-muted-foreground">
                            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                            Puede tardar entre 10 y 60 segundos.
                        </p>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
