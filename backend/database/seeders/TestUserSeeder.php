<?php

namespace Database\Seeders;

use Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if(!app()->environment('local')){
            return;
        }

        $users = [
            [
                'name' => 'Test Customer',
                'email' => 'customer@test.com',
                'roles' => 'customer',
            ],
            [
                'name' => 'Test Agent',
                'email' => 'agent@test.com',
                'roles' => 'support_agent',
            ],
            [
                'name' => 'Test Admin',
                'email' => 'admin@test.com',
                'roles' => 'administrator',
            ],
        ];

        foreach ($users as $userData) {
            $user = \App\Models\User::firstOrCreate(
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
