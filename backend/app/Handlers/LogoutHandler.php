<?php

namespace App\Handlers;

use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

class LogoutHandler
{
    public function handle(User $user): void
    {
        $token = $user->currentAccessToken();

        if (!$token instanceof PersonalAccessToken) {
            abort(400, 'Bearer token required for logout.');
        }

        $token->delete();
    }
}
