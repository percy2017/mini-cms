import { Form, Head, usePage } from '@inertiajs/react';
import { ImageIcon, Save, CheckCircle2, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import SiteController from '@/actions/App/Http/Controllers/Settings/SiteController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { edit } from '@/routes/site';

type Props = {
    settings: {
        title: string;
        description: string | null;
        icon_url: string;
        logo_url: string;
    };
};

type FlashProps = {
    flash?: { success?: string; error?: string };
};

export default function Site({ settings }: Props) {
    const { props } = usePage<FlashProps>();
    const flash = props.flash;

    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const iconInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setIconPreview(URL.createObjectURL(file));
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const displayedIcon = iconPreview ?? settings.icon_url;
    const displayedLogo = logoPreview ?? settings.logo_url;

    return (
        <>
            <Head title="Configuración del sitio" />

            <h1 className="sr-only">Configuración del sitio</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Sitio"
                    description="Configura el título, descripción, icono y logo que se muestran en el dashboard y la página pública"
                />

                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-4 w-4" />
                        {flash.success}
                    </div>
                )}

                <Form
                    {...SiteController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="title">Título</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    defaultValue={settings.title}
                                    required
                                    maxLength={120}
                                    placeholder="HostBol"
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    defaultValue={settings.description ?? ''}
                                    maxLength={500}
                                    rows={3}
                                    placeholder="Una breve descripción de tu sitio"
                                    className="border-input bg-transparent ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                />
                                <InputError message={errors.description} />
                            </div>

                            {/* ICON FIELD */}
                            <div className="grid gap-2">
                                <Label>Icono (favicon)</Label>
                                <div className="flex items-start gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                                        {displayedIcon ? (
                                            <img
                                                src={displayedIcon}
                                                alt="Icono"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                iconInputRef.current?.click()
                                            }
                                            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                                        >
                                            <Upload className="h-4 w-4" />
                                            {displayedIcon
                                                ? 'Cambiar icono'
                                                : 'Subir icono'}
                                        </button>
                                        <p className="text-xs text-muted-foreground">
                                            PNG, JPG, SVG, ICO o WebP. Máx. 1 MB.
                                        </p>
                                        <input
                                            ref={iconInputRef}
                                            id="icon"
                                            name="icon"
                                            type="file"
                                            accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/webp"
                                            onChange={handleIconChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                                <InputError message={errors.icon} />
                            </div>

                            {/* LOGO FIELD */}
                            <div className="grid gap-2">
                                <Label>Logo</Label>
                                <div className="flex items-start gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
                                    <div className="flex h-20 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                                        {displayedLogo ? (
                                            <img
                                                src={displayedLogo}
                                                alt="Logo"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                logoInputRef.current?.click()
                                            }
                                            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                                        >
                                            <Upload className="h-4 w-4" />
                                            {displayedLogo
                                                ? 'Cambiar logo'
                                                : 'Subir logo'}
                                        </button>
                                        <p className="text-xs text-muted-foreground">
                                            PNG, JPG, SVG o WebP. Máx. 2 MB.
                                        </p>
                                        <input
                                            ref={logoInputRef}
                                            id="logo"
                                            name="logo"
                                            type="file"
                                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                            onChange={handleLogoChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                                <InputError message={errors.logo} />
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <Button
                                    disabled={processing}
                                    data-test="update-site-settings-button"
                                >
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Guardar cambios
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Site.layout = {
    breadcrumbs: [
        {
            title: 'Configuración del sitio',
            href: edit(),
        },
    ],
};