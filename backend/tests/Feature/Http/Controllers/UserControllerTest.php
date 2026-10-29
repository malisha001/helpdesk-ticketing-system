<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_deactivating_a_user_revokes_their_tokens(): void
    {
        $admin = $this->createAdmin();
        $user = User::factory()->create(['is_active' => true]);
        $token = $user->createToken('helpdesk-api');

        $response = $this->actingAs($admin)->patchJson("/api/users/{$user->id}/status", ['is_active' => false]);

        $response->assertOk()->assertJsonPath('data.is_active', false);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'is_active' => false]);
        $this->assertModelMissing($token->accessToken);
    }

    public function test_self_deactivation_returns_409_and_preserves_the_account(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('helpdesk-api');

        $response = $this->actingAs($admin)->patchJson("/api/users/{$admin->id}/status", ['is_active' => false]);

        $response->assertConflict()->assertJsonPath('message', 'You cannot deactivate your own account.');
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'is_active' => true]);
        $this->assertModelExists($token->accessToken);
    }

    public function test_updating_status_without_admin_role_returns_403(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($user)->patchJson("/api/users/{$user->id}/status", ['is_active' => false]);

        $response->assertForbidden();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'is_active' => true]);
    }

    private function createAdmin(): User
    {
        $role = Role::create(['name' => 'administrator', 'guard_name' => 'web']);
        $role->givePermissionTo(Permission::create(['name' => 'manage-users', 'guard_name' => 'web']));
        $admin = User::factory()->create(['is_active' => true]);
        $admin->assignRole($role);

        return $admin;
    }
}
