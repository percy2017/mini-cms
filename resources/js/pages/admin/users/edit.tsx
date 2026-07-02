import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { UserForm } from '@/components/users/user-form';
import { ConfirmActionDialog } from '@/components/confirm-action-dialog';
import { update } from '@/actions/App/Http/Controllers/Admin/UserController';

type Props = {
    user: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        avatar_url: string | null;
        roles: string[];
        email_verified_at: string | null;
    };
    allRoles: string[];
};

export default function EditUser({ user, allRoles }: Props) {
    const [pending, setPending] = useState<FormData | null>(null);

    const handleSubmit = (
        values: {
            name: string;
            email: string;
            phone: string;
            password: string;
            roles: string[];
            email_verified: boolean;
        },
        pickedAvatar: { url: string } | null,
    ) => {
        const payload = new FormData();
        payload.append('name', values.name);
        payload.append('email', values.email);
        payload.append('phone', values.phone);
        if (values.password) payload.append('password', values.password);
        if (pickedAvatar) payload.append('avatar_url', pickedAvatar.url);
        values.roles.forEach((r) => payload.append('roles[]', r));
        payload.append('email_verified', values.email_verified ? '1' : '0');
        payload.append('_method', 'PUT');

        setPending(payload);
    };

    const confirmUpdate = (close: () => void) => {
        if (!pending) return;
        router.post(update.url({ user: user.id }), pending, {
            forceFormData: true,
            onSuccess: () => {
                close();
                setPending(null);
            },
            onError: () => {
                close();
                setPending(null);
            },
        });
    };

    return (
        <>
            <Head title={`Editar ${user.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <UserForm
                    user={user}
                    allRoles={allRoles}
                    onSubmit={handleSubmit}
                    submitLabel="Guardar cambios"
                    requirePassword={false}
                />
            </div>

            <ConfirmActionDialog
                open={pending !== null}
                onOpenChange={(open) => {
                    if (!open) setPending(null);
                }}
                title={`¿Guardar los cambios de ${user.name}?`}
                description="Se actualizarán los datos del usuario. Podés revertirlo editándolo otra vez."
                confirmLabel="Sí, guardar"
                cancelLabel="Cancelar"
                confirmVariant="default"
                onConfirm={confirmUpdate}
            />
        </>
    );
}

EditUser.layout = {
    breadcrumbs: [
        { title: 'Usuarios', href: '/admin/users' },
        { title: 'Editar', href: '' },
    ],
};
