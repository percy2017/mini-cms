<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('q')->toString();

        $query = Role::query()->withCount('permissions', 'users')->latest();

        if ($search !== '') {
            $query->where('name', 'like', "%{$search}%");
        }

        $roles = $query->paginate(15)->through(fn (Role $r) => [
            'id' => $r->id,
            'name' => $r->name,
            'guard_name' => $r->guard_name,
            'permissions_count' => $r->permissions_count,
            'users_count' => $r->users_count,
            'created_at' => $r->created_at?->toDateTimeString(),
        ]);

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'filters' => ['q' => $search],
            'allPermissions' => Permission::query()->orderBy('name')->pluck('name'),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $permissions = $data['permissions'] ?? [];
        unset($data['permissions']);

        $role = Role::create($data + ['guard_name' => 'web']);

        if ($permissions) {
            $role->syncPermissions($permissions);
        }

        return back()->with('success', "Rol {$role->name} creado.");
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $data = $request->validated();
        $permissions = $data['permissions'] ?? null;
        unset($data['permissions']);

        $role->update($data);

        if ($permissions !== null) {
            $role->syncPermissions($permissions);
        }

        return back()->with('success', "Rol {$role->name} actualizado.");
    }

    public function destroy(Role $role): RedirectResponse
    {
        $name = $role->name;
        $role->delete();

        return back()->with('success', "Rol {$name} eliminado.");
    }

    public function permissions(Role $role)
    {
        return response()->json([
            'permissions' => $role->permissions->pluck('name'),
        ]);
    }
}
