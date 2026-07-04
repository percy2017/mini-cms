import { Head, router, usePage } from '@inertiajs/react';
import { Sparkles, ImageIcon, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { generate } from '@/actions/App/Http/Controllers/Admin/AiImageController';
import { ConfirmActionDialog } from '@/components/confirm-action-dialog';
import MediaPickerDialog, {
    type PickedAttachment,
} from '@/components/media-picker-dialog';
import { Button } from '@/components/ui/button';
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

export default function MediaAi() {
    const [mode, setMode] = useState<Mode>('text-to-image');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [n, setN] = useState(1);
    const [seed, setSeed] = useState('');
    const [optimizer, setOptimizer] = useState(false);
    const [referencePreview, setReferencePreview] = useState<string | null>(null);
    const [referenceMediaId, setReferenceMediaId] = useState<number | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { props } = usePage<{
        flash?: { success?: string; error?: string };
        results?: Array<{ id: number; name: string; url: string }>;
    }>();
    const flash = props.flash;
    const results = props.results ?? [];

    const charCount = prompt.length;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === 'image-to-image' && !referenceMediaId) {
            setError('Elige una imagen de referencia para este modo.');

            return;
        }

        setConfirmOpen(true);
    };

    const submitGeneration = async (done: () => void) => {
        setGenerating(true);
        done();

        try {
            await router.post(
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
                        setPrompt('');
                        setAspectRatio('1:1');
                        setN(1);
                        setSeed('');
                        setOptimizer(false);
                        clearReference();
                        setMode('text-to-image');
                        router.visit('/admin/media');
                    },
                    onError: (errors) => {
                        setError(
                            Object.values(errors)[0]?.toString() ??
                                'Error al generar la imagen.',
                        );
                        setGenerating(false);
                    },
                },
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido.');
            setGenerating(false);
        }
    };

    const clearReference = () => {
        setReferencePreview(null);
        setReferenceMediaId(null);
    };

    return (
        <>
            <Head title="Generar" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
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

                {results.length > 0 && !generating && (
                    <div className="rounded-xl border-2 border-green-500/40 bg-green-500/5 p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                                    ✓
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        Listo — {results.length} imagen{results.length > 1 ? 'es' : ''} guardada{results.length > 1 ? 's' : ''}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        En tu biblioteca, lista para usar
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => router.reload({ only: ['results'] })}
                            >
                                Generar otra
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {results.map((r) => (
                                <a
                                    key={r.id}
                                    href={`/admin/media/${r.id}`}
                                    className="block overflow-hidden rounded-lg border-2 border-border transition hover:border-primary"
                                >
                                    <img
                                        src={r.url}
                                        alt={r.name}
                                        className="aspect-video w-full object-cover"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {generating && (
                    <div className="space-y-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full w-1/3 animate-pulse rounded-full bg-primary"
                            />
                        </div>
                        <p className="text-center text-xs text-muted-foreground">
                            Puede tardar entre 10 y 60 segundos.
                        </p>
                    </div>
                )}

                <form
                    onSubmit={handleGenerate}
                    className="grid gap-6 lg:grid-cols-[1fr_320px]"
                >
                    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
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
                                {referencePreview ? (
                                    <div className="mt-2 flex items-start gap-3">
                                        <img
                                            src={referencePreview}
                                            alt="Referencia"
                                            className="h-24 w-24 rounded object-cover"
                                        />
                                        <div className="flex-1 space-y-2">
                                            <p className="truncate text-sm text-muted-foreground">
                                                Imagen de la biblioteca
                                            </p>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => clearReference()}
                                            >
                                                <X className="mr-2 h-3 w-3" />
                                                Quitar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="mt-2 w-full"
                                        onClick={() => setPickerOpen(true)}
                                    >
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Elegir de la biblioteca
                                    </Button>
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
                                className="mt-1 flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                <span
                                    className={charCount > 1400 ? 'text-destructive' : ''}
                                >
                                    {charCount}/1500
                                </span>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-4 lg:self-start">
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
                            <p className="mt-1 text-xs text-muted-foreground">
                                Hasta 4 imágenes por generación.
                            </p>
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

                        <Button
                            type="submit"
                            className="w-full"
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

                        {generating && (
                            <p className="text-center text-xs text-muted-foreground">
                                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                                Puede tardar entre 10 y 60 segundos.
                            </p>
                        )}
                    </aside>
                </form>
            </div>

            <MediaPickerDialog
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onPick={(refs: PickedAttachment[]) => {
                    const first = refs[0];

                    if (!first) {
                        return;
                    }

                    if (first.id == null) {
                        return;
                    }

                    setReferencePreview(first.url);
                    setReferenceMediaId(first.id);
                    setPickerOpen(false);
                }}
            />

            <ConfirmActionDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="¿Generar imagen con IA?"
                description={
                    <>
                        Vas a gastar créditos de MiniMax. La generación
                        tarda entre 10 y 60 segundos.
                    </>
                }
                confirmLabel="Sí, generar"
                confirmVariant="default"
                onConfirm={submitGeneration}
            />
        </>
    );
}

MediaAi.layout = {
    breadcrumbs: [
        { title: 'Biblioteca', href: '/admin/media' },
        { title: 'AI', href: '/admin/media/ai' },
    ],
};