import { Head, router } from '@inertiajs/react';
import { store } from '@/actions/App/Http/Controllers/Admin/UserController';
import { UserForm } from '@/components/users/user-form';

type Props = {
    allRoles: string[];
};

export default function CreateUser({ allRoles }: Props) {
    const handleSubmit = async (
        values: {
            name: string;
            email: string;
            phone: string;
            password: string;
            roles: string[];
        },
        pickedAvatar: { url: string } | null,
    ) => {
        const payload = new FormData();
        payload.append('name', values.name);
        payload.append('email', values.email);
        payload.append('phone', values.phone);
        payload.append('password', values.password);

        if (pickedAvatar) {
payload.append('avatar_url', pickedAvatar.url);
}

        values.roles.forEach((r) => payload.append('roles[]', r));

        router.post(store.url(), payload, {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Nuevo usuario" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <UserForm
                    user={null}
                    allRoles={allRoles}
                    onSubmit={handleSubmit}
                    submitLabel="Crear usuario"
                    requirePassword
                />
            </div>
        </>
    );
}

CreateUser.layout = {
    breadcrumbs: [
        { title: 'Usuarios', href: '/admin/users' },
        { title: 'Nuevo', href: '/admin/users/create' },
    ],
};
