<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'create-ticket',
            'view-own-ticket',
            'view-unassigned-ticket',
            'view-assigned-ticket',
            'view-all-ticket',
            'claim-ticket',
            'assign-ticket',
            'reply-to-ticket',
            'change-ticket-status',
            'resolve-ticket',
            'manage-users',
            'manage-roles',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $customer = Role::findOrCreate(UserRole::Customer->value, 'web');

        $agent = Role::findOrCreate(UserRole::SupportAgent->value, 'web');

        $administrator = Role::findOrCreate(UserRole::Administrator->value, 'web');

        $customer->syncPermissions([
            'create-ticket',
            'view-own-ticket',
            'reply-to-ticket',
        ]);

        $agent->syncPermissions([
            'view-unassigned-ticket',
            'view-assigned-ticket',
            'claim-ticket',
            'reply-to-ticket',
            'change-ticket-status',
            'resolve-ticket',
        ]);

        $administrator->syncPermissions([
            'view-all-ticket',
            'assign-ticket',
            'reply-to-ticket',
            'change-ticket-status',
            'resolve-ticket',
            'manage-users',
            'manage-roles',
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
