<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use PHPUnit\Framework\Attributes\TestWith;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_creating_an_agent_returns_201_with_an_inactive_support_account_and_preserves_admin_session(): void
    {
        $admin = $this->createAdmin();
        Role::findOrCreate('support_agent', 'web');
        $token = $admin->createToken('admin-session');

        $response = $this->withToken($token->plainTextToken)->postJson('/api/users/agents', [
            'name' => 'New Agent',
            'email' => 'New.Agent@Example.test',
        ]);

        $agent = User::where('email', 'new.agent@example.test')->firstOrFail();
        $response->assertCreated()->assertExactJson([
            'success' => true,
            'message' => 'Support agent account created. Password setup is pending.',
            'data' => [
                'id' => $agent->id,
                'name' => 'New Agent',
                'email' => 'new.agent@example.test',
                'is_active' => false,
                'role' => 'support_agent',
            ],
        ]);
        $this->assertSame(['support_agent'], $agent->getRoleNames()->all());
        $this->assertNotNull(password_get_info($agent->password)['algo']);
        $this->assertDatabaseHas('users', ['id' => $agent->id, 'is_active' => false]);
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->assertModelExists($token->accessToken);
    }

    public function test_creating_an_agent_with_an_existing_email_returns_422(): void
    {
        $admin = $this->createAdmin();
        User::factory()->create(['email' => 'existing@example.test']);

        $response = $this->actingAs($admin)->postJson('/api/users/agents', [
            'name' => 'New Agent',
            'email' => 'EXISTING@example.test',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors([
            'email' => 'This email is already registered.',
        ]);
        $this->assertDatabaseCount('users', 2);
    }

    #[TestWith(['name', ''])]
    #[TestWith(['email', ''])]
    #[TestWith(['email', 'not-an-email'])]
    #[TestWith(['role', 'administrator'])]
    #[TestWith(['password', 'client-supplied-value'])]
    #[TestWith(['is_active', true])]
    public function test_invalid_agent_fields_return_422_without_creating_an_account(string $field, mixed $value): void
    {
        $admin = $this->createAdmin();
        $payload = ['name' => 'New Agent', 'email' => 'agent@example.test'];
        $payload[$field] = $value;

        $response = $this->actingAs($admin)->postJson('/api/users/agents', $payload);

        $response->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_unvalidated_permissions_and_roles_cannot_elevate_a_created_agent(): void
    {
        $admin = $this->createAdmin();
        Role::findOrCreate('support_agent', 'web');

        $response = $this->actingAs($admin)->postJson('/api/users/agents', [
            'name' => 'New Agent',
            'email' => 'agent@example.test',
            'roles' => ['administrator'],
            'permissions' => ['manage-users'],
        ]);

        $response->assertCreated()->assertJsonPath('data.role', 'support_agent');
        $agent = User::where('email', 'agent@example.test')->firstOrFail();
        $this->assertFalse($agent->hasRole('administrator'));
        $this->assertFalse($agent->can('manage-users'));
    }

    public function test_agent_creation_rolls_back_if_the_support_role_is_missing(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->postJson('/api/users/agents', [
            'name' => 'New Agent',
            'email' => 'agent@example.test',
        ]);

        $response->assertInternalServerError();
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseMissing('users', ['email' => 'agent@example.test']);
    }

    public function test_creating_an_agent_without_authentication_returns_401(): void
    {
        $response = $this->postJson('/api/users/agents', ['name' => 'New Agent', 'email' => 'agent@example.test']);

        $response->assertUnauthorized();
        $this->assertDatabaseCount('users', 0);
    }

    #[TestWith(['customer'])]
    #[TestWith(['support_agent'])]
    public function test_creating_an_agent_without_admin_role_returns_403(string $roleName): void
    {
        $role = Role::findOrCreate($roleName, 'web');
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);

        $response = $this->actingAs($user)->postJson('/api/users/agents', ['name' => 'New Agent', 'email' => 'agent@example.test']);

        $response->assertForbidden();
        $this->assertDatabaseCount('users', 1);
    }

    public function test_creating_an_agent_as_an_inactive_admin_returns_403(): void
    {
        $admin = $this->createAdmin();
        $admin->update(['is_active' => false]);

        $response = $this->actingAs($admin)->postJson('/api/users/agents', ['name' => 'New Agent', 'email' => 'agent@example.test']);

        $response->assertForbidden();
        $this->assertDatabaseCount('users', 1);
    }

    #[TestWith(['customer', '0'])]
    #[TestWith(['customer', '1'])]
    #[TestWith(['support_agent', '0'])]
    #[TestWith(['support_agent', '1'])]
    #[TestWith(['administrator', '0'])]
    #[TestWith(['administrator', '1'])]
    public function test_combined_filters_apply_before_pagination(string $roleName, string $status): void
    {
        $admin = $this->createAdmin();
        $role = Role::findOrCreate($roleName, 'web');
        $otherRole = Role::findOrCreate($roleName === 'customer' ? 'support_agent' : 'customer', 'web');
        $matches = User::factory()->count(3)->sequence(
            ['name' => 'Needle Alpha', 'email' => 'alpha@example.test'],
            ['name' => 'Person Beta', 'email' => 'needle@example.test'],
            ['name' => 'Person Gamma', 'email' => 'needle-gamma@example.test'],
        )->create(['is_active' => (bool) $status]);
        foreach ($matches as $user) {
            $user->assignRole($role);
        }
        User::factory()->create(['name' => 'Needle Wrong Role', 'is_active' => (bool) $status])->assignRole($otherRole);
        User::factory()->create(['name' => 'Needle Wrong Status', 'is_active' => ! (bool) $status])->assignRole($role);
        User::factory()->create(['name' => 'Unrelated', 'email' => 'unrelated@example.test', 'is_active' => (bool) $status])->assignRole($role);

        $response = $this->actingAs($admin)->getJson('/api/users?'.http_build_query([
            'search' => 'needle',
            'role' => $roleName,
            'is_active' => $status,
            'page' => 2,
            'per_page' => 1,
        ]));

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matches[1]->id)
            ->assertJsonPath('data.0.roles', [$roleName])
            ->assertJsonPath('data.0.is_active', (bool) $status)
            ->assertJsonPath('meta', ['current_page' => 2, 'last_page' => 3, 'per_page' => 1, 'total' => 3]);
    }

    #[TestWith([''])]
    #[TestWith(['?search=&role=&is_active='])]
    public function test_empty_or_omitted_filters_return_all_users(string $query): void
    {
        $admin = $this->createAdmin();
        User::factory()->create(['is_active' => false]);

        $response = $this->actingAs($admin)->getJson('/api/users'.$query);

        $response->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('meta.total', 2);
    }

    public function test_zero_is_a_valid_search_term(): void
    {
        $admin = $this->createAdmin();
        $admin->update(['name' => 'Admin', 'email' => 'admin@example.test']);
        $match = User::factory()->create(['name' => 'Customer', 'email' => 'customer0@example.test']);

        $response = $this->actingAs($admin)->getJson('/api/users?search=0');

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $match->id);
    }

    #[TestWith(['role=unknown', 'role'])]
    #[TestWith(['is_active=2', 'is_active'])]
    #[TestWith(['is_active=false', 'is_active'])]
    #[TestWith(['page=0', 'page'])]
    #[TestWith(['search[]=invalid', 'search'])]
    public function test_invalid_filters_return_422(string $query, string $field): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->getJson('/api/users?'.$query);

        $response->assertUnprocessable()->assertJsonValidationErrors($field);
    }

    public function test_listing_users_without_authentication_returns_401(): void
    {
        $this->getJson('/api/users?is_active=0')->assertUnauthorized();
    }

    #[TestWith(['customer'])]
    #[TestWith(['support_agent'])]
    public function test_listing_users_without_admin_role_returns_403(string $roleName): void
    {
        $role = Role::findOrCreate($roleName, 'web');
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);

        $response = $this->actingAs($user)->getJson('/api/users?role=support_agent&is_active=1');

        $response->assertForbidden();
    }

    public function test_listing_users_as_an_inactive_admin_returns_403(): void
    {
        $admin = $this->createAdmin();
        $admin->update(['is_active' => false]);

        $response = $this->actingAs($admin)->getJson('/api/users');

        $response->assertForbidden()->assertJsonPath('message', 'Your account is inactive. Please contact support.');
    }

    public function test_deactivated_users_disappear_from_the_active_filter(): void
    {
        $admin = $this->createAdmin();
        $role = Role::findOrCreate('customer', 'web');
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);
        $this->actingAs($admin)->patchJson("/api/users/{$user->id}/status", ['is_active' => false])->assertOk();

        $response = $this->getJson('/api/users?role=customer&is_active=1');

        $response->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('meta.total', 0);
    }

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
