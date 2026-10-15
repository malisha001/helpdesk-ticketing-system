<?php

namespace App\Handlers;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisterHandler
{
    public function handle(array $validated): User
    {
        return DB::transaction(function () use ($validated) {

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'is_active' => true,
            ]);

            // New users are always customers
            $user->assignRole('customer');

            return $user;
        });
    }
}
