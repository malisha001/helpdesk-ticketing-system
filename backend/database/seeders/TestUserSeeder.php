<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Hash;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (! app()->environment('local')) {
            return;
        }

        $users = [
            [
                'name' => 'Test Customer',
                'email' => 'customer@test.com',
                'roles' => UserRole::Customer->value,
            ],
            [
                'name' => 'Test Agent',
                'email' => 'agent@test.com',
                'roles' => UserRole::SupportAgent->value,
            ],
            [
                'name' => 'Test Admin',
                'email' => 'admin@test.com',
                'roles' => UserRole::Administrator->value,
            ],
        ];

        foreach ($users as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make('Test@1234'),
                    'is_active' => true,
                ]
            );

            $user->assignRole($userData['roles']);
        }
    }
}
