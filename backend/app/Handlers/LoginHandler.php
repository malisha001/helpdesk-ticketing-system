<?php

namespace App\Handlers;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class LoginHandler
{
    public function handle(array $validated): array
    {
        // Find user by email
        $user = User::where('email', $validated['email'])->first();

        // Verify email and password
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            abort(401, 'Invalid email or password.');
        }

        // Check whether the account is active
        if (!$user->is_active) {
            abort(403, 'Your account is inactive.');
        }

        // Generate Sanctum token
        $token = $user->createToken('helpdesk-api')->plainTextToken;

        return [
            'user' => $user,
            'roles' => $user->getRoleNames(),
            'token' => $token,
        ];
    }
}
