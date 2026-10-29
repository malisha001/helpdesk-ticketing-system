<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    public function login(array $data): array
    {
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            abort(401, 'Invalid email or password.');
        }

        if (! $user->is_active) {
            abort(403, 'Your account is inactive.');
        }

        $token = $user->createToken('helpdesk-api')->plainTextToken;

        return [
            'user' => $user,
            'roles' => $user->getRoleNames(),
            'token' => $token,
        ];
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if (! $token instanceof PersonalAccessToken) {
            abort(400, 'Bearer token required for logout.');
        }

        $token->delete();
    }
}
