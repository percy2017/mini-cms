import { Link } from '@inertiajs/react';
import { Save, Upload, User as UserIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import MediaPickerDialog from '@/components/media-picker-dialog';
import PhoneInput from '@/components/phone-input';
import type {PhoneInputHandle} from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';

export type UserFormValues = {
    name: string;
    email: string;
    phone: string;
    password: string;
    roles: string[];
    /** Set by admin to bypass email verification manually. */
    email_verified: boolean;
};

export type UserFormUser = {
    id?: number;
    name?: string;
    email?: string;
    phone?: string | null;
    avatar_url?: string | null;
    roles?: string[];
    email_verified_at?: string | null;
};

type Props = {
    allRoles: string[];
    /** Initial values; pass `null` for "new user" mode. */
    user: UserFormUser | null;
    /** Submit handler. Returns a promise so the page can show the spinner. */
    onSubmit: (
        values: UserFormValues,
        pickedAvatar: { url: string; name: string; mime: string | null; size: number | null } | null,
    ) => Promise<void> | void;
    submitLabel: string;
    /** When editing, password becomes optional. When creating, required. */
    requirePassword: boolean;
};

export function UserForm({ allRoles, user, onSubmit, submitLabel, requirePassword }: Props) {
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [password, setPassword] = useState('');
    const [roles, setRoles] = useState<string[]>(user?.roles ?? []);
    const [emailVerified, setEmailVerified] = useState<boolean>(!!user?.email_verified_at);
    const [pickedAvatar, setPickedAvatar] = useState<{
        url: string;
        name: string;
        mime: string | null;
        size: number | null;
    } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const phoneRef = useRef<PhoneInputHandle>(null);

    // The currently displayed avatar preview. Falls back to the URL the user
    // picked from the Media library, or to the original avatar_url when
    // editing an existing user and nothing has been picked yet.
    const avatarPreview = pickedAvatar?.url ?? user?.avatar_url ?? null;

    const toggleRole = (role: string) => {
        setRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
        );
    };

    const handleAvatarPick = (refs: { url: string; name: string; mime: string | null; size: number | null }[]) => {
        const first = refs[0] ?? null;
        setPickedAvatar(first);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submitting) {
return;
}

        setSubmitting(true);

        try {
            // intl-tel-input keeps the visible field value separate from the
            // E.164 number; reading via the ref guarantees we send the
            // full international number with leading dial code, regardless
            // of whether the user touched the field after the page loaded.
            const phoneE164 = phoneRef.current?.getNumber() ?? phone;
            await onSubmit(
                { name, email, phone: phoneE164, password, roles, email_verified: emailVerified },
                pickedAvatar,
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                {/* Left card: avatar. */}
                <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6">
                    <button
                        type="button"
                        onClick={() => setMediaPickerOpen(true)}
                        className="relative grid h-40 w-40 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/30 transition hover:border-indigo-400"
                    >
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Avatar del usuario"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <UserIcon className="h-16 w-16 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition hover:opacity-100">
                            <Upload className="h-6 w-6 text-white" />
                        </div>
                    </button>
                    <div className="text-center">
                        <p className="text-sm font-medium">Avatar</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Haz clic para elegir desde
                            <br />
                            la biblioteca de Medios
                        </p>
                    </div>
                    {pickedAvatar && (
                        <button
                            type="button"
                            onClick={() => setPickedAvatar(null)}
                            className="text-xs text-muted-foreground underline hover:text-destructive"
                        >
                            Quitar selección
                        </button>
                    )}
                </div>

                {/* Right card: all fields + roles. */}
                <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 md:col-span-2">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Teléfono</Label>
                            <PhoneInput
                                ref={phoneRef}
                                id="phone"
                                value={phone}
                                onChange={setPhone}
                                placeholder="70000000"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password">
                                Contraseña {user?.id ? '(dejar vacío para no cambiar)' : ''}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required={requirePassword}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Roles</Label>
                            <Link
                                href="/admin/roles"
                                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                            >
                                Gestionar roles →
                            </Link>
                        </div>
                        {allRoles.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {allRoles.map((r) => {
                                    const active = roles.includes(r);

                                    return (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => toggleRole(r)}
                                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                                active
                                                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-700 dark:text-indigo-200'
                                                    : 'border-border bg-background text-muted-foreground hover:border-indigo-400/40'
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                                Aún no hay roles definidos. Creá el primero en{' '}
                                <Link
                                    href="/admin/roles"
                                    className="font-medium text-foreground underline underline-offset-2"
                                >
                                    /admin/roles
                                </Link>
                                .
                            </div>
                        )}
                    </div>

                    {/* Email verification toggle — admin can mark a user as
                        verified manually instead of waiting for the email
                        link to be clicked. */}
                    {user?.id && (
                        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
                            <div>
                                <p className="text-sm font-medium">Correo verificado</p>
                                <p className="text-xs text-muted-foreground">
                                    {emailVerified
                                        ? 'El usuario puede iniciar sesión.'
                                        : 'Aún no confirmó su correo.'}
                                </p>
                            </div>
                            <Switch
                                checked={emailVerified}
                                onCheckedChange={setEmailVerified}
                                aria-label="Marcar correo como verificado"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end pt-2">
                <Button type="submit" disabled={submitting}>
                    {submitting ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    {submitLabel}
                </Button>
            </div>

            <MediaPickerDialog
                open={mediaPickerOpen}
                onOpenChange={setMediaPickerOpen}
                onPick={handleAvatarPick}
            />
        </form>
    );
}
