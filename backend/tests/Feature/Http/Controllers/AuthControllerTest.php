<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use PHPUnit\Framework\Attributes\TestWith;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_registration_rejects_duplicate_emails_with_422(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Another Customer',
            'email' => 'existing@example.com',
            'password' => 'secret-password',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    #[TestWith(['name', ''])]
    #[TestWith(['email', 'not-an-email'])]
    #[TestWith(['password', ''])]
    public function test_invalid_registration_fields_return_422(string $field, string $value): void
    {
        $payload = ['name' => 'Customer', 'email' => 'customer@example.com', 'password' => 'secret-password'];
        $payload[$field] = $value;

        $response = $this->postJson('/api/register', $payload);

        $response->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_cannot_assign_submitted_permissions_or_expose_credentials(): void
    {
        Role::create(['name' => 'customer', 'guard_name' => 'web']);
        Role::create(['name' => 'administrator', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);

        $response = $this->postJson('/api/register', [
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'password' => 'secret-password',
            'roles' => ['administrator'],
            'permissions' => ['manage-users'],
        ]);

        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $response->assertCreated()->assertExactJson([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'id' => $user->id,
                'name' => 'Customer',
                'email' => 'customer@example.com',
                'role' => 'customer',
            ],
        ]);
        $this->assertSame(['customer'], $user->getRoleNames()->all());
        $this->assertFalse($user->can('manage-users'));
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_registration_creates_an_active_customer_with_a_hashed_password(): void
    {
        Role::create(['name' => 'customer', 'guard_name' => 'web']);

        $response = $this->postJson('/api/register', [
            'name' => 'New Customer',
            'email' => 'customer@example.com',
            'password' => 'secret-password',
            'role' => 'administrator',
            'is_active' => false,
        ]);

        $response->assertCreated()->assertJsonPath('data.role', 'customer');
        $user = User::findOrFail($response->json('data.id'));
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'customer@example.com',
            'is_active' => true,
        ]);
        $this->assertSame(['customer'], $user->getRoleNames()->all());
        $this->assertTrue(Hash::check('secret-password', $user->password));
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_registration_rolls_back_the_user_if_role_assignment_fails(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New Customer',
            'email' => 'customer@example.com',
            'password' => 'secret-password',
        ]);

        $response->assertInternalServerError();
        $this->assertDatabaseMissing('users', ['email' => 'customer@example.com']);
        $this->assertDatabaseCount('model_has_roles', 0);
    }

    public function test_login_returns_user_roles_and_a_persisted_token(): void
    {
        Role::create(['name' => 'customer', 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('customer');

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.roles', ['customer']);
        $token = PersonalAccessToken::findToken($response->json('data.token'));
        $this->assertNotNull($token);
        $this->assertSame($user->id, $token->tokenable_id);
        $this->assertSame('helpdesk-api', $token->name);
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    #[TestWith(['wrong-password', true, 401, 'Invalid email or password.'])]
    #[TestWith(['password', false, 403, 'Your account is inactive.'])]
    public function test_login_returns_401_for_invalid_password_or_403_for_inactive_account(
        string $password,
        bool $isActive,
        int $status,
        string $message
    ): void {
        $user = User::factory()->create(['is_active' => $isActive]);

        $response = $this->postJson('/api/login', ['email' => $user->email, 'password' => $password]);

        $response->assertStatus($status)->assertJsonPath('message', $message);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_returns_401_for_an_unknown_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'missing@example.com',
            'password' => 'password',
        ]);

        $response->assertUnauthorized()->assertJsonPath('message', 'Invalid email or password.');
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_logout_revokes_only_the_current_bearer_token(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $currentToken = $user->createToken('current');
        $otherToken = $user->createToken('other');

        $response = $this->withToken($currentToken->plainTextToken)->postJson('/api/logout');

        $response->assertOk()->assertJsonPath('message', 'Logout successful');
        $this->assertModelMissing($currentToken->accessToken);
        $this->assertModelExists($otherToken->accessToken);
    }

    public function test_session_logout_returns_400_and_preserves_api_tokens(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $token = $user->createToken('other');

        $response = $this->actingAs($user, 'web')->postJson('/api/logout');

        $response->assertBadRequest()->assertJsonPath('message', 'Bearer token required for logout.');
        $this->assertModelExists($token->accessToken);
    }

    public function test_logout_returns_401_without_authentication(): void
    {
        $this->postJson('/api/logout')->assertUnauthorized();
    }
}
