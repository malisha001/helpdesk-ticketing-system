<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UserService
{
    public function createCustomer(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_active' => true,
        ]);

        $user->assignRole('customer');

        return $user;
    }

    public function listUsers(array $filters = []): LengthAwarePaginator
    {
        // 1. Start the user query
        $query = User::query()
            ->select(['id', 'name', 'email', 'is_active']);

        // 2. Search users by name or email
        if (! empty($filters['search'])) {

            $search = $filters['search'];

            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // 3. Filter users by role
        if (! empty($filters['role'])) {

            $role = $filters['role'];

            $query->whereHas('roles', function (Builder $q) use ($role) {
                $q->where('name', $role);
            });
        }

        // 4. Filter active or inactive users
        if (array_key_exists('is_active', $filters)) {
            $query->where(
                'is_active',
                (bool) $filters['is_active']
            );
        }

        // 5. Load roles and apply pagination
        $users = $query
            ->with('roles:id,name')
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 10);

        // 6. Return only the required fields
        $users->getCollection()->transform(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => (bool) $user->is_active,
                'roles' => $user->roles->pluck('name')->values()->all(),
            ];
        });

        return $users;
    }

    public function updateActiveStatus(
        User $admin,
        int $userId,
        bool $isActive
    ): User {

        // 1. Serialize status updates to protect the last administrator
        Role::where('name', 'administrator')
            ->where('guard_name', 'web')
            ->lockForUpdate()
            ->firstOrFail();

        // 2. Find and lock the target user
        $user = User::where('id', $userId)
            ->lockForUpdate()
            ->firstOrFail();

        // 3. Prevent administrator from deactivating themselves
        if (! $isActive && $user->id === $admin->id) {
            abort(409, 'You cannot deactivate your own account.');
        }

        // 4. Prevent deactivating the last active administrator
        if (
            ! $isActive &&
            (bool) $user->is_active &&
            $user->hasRole('administrator')
        ) {
            $activeAdminCount = User::role('administrator')
                ->where('is_active', true)
                ->count();

            if ($activeAdminCount <= 1) {
                abort(409, 'Cannot deactivate the last active administrator.');
            }
        }

        // 5. Update the user status
        $user->is_active = $isActive;
        $user->save();

        // 6. Revoke tokens when deactivating
        if (! $isActive) {
            $user->tokens()->delete();
        }

        // 7. Return the updated user
        return $user;
    }

    public function findById(int $userId): array
    {
        // 1. Find the user and load their roles
        $user = User::query()
            ->select([
                'id',
                'name',
                'email',
                'is_active',
                'created_at',
            ])
            ->with('roles:id,name')
            ->findOrFail($userId);

        // 2. Return only the necessary information
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_active' => (bool) $user->is_active,
            'roles' => $user->roles->pluck('name')->values()->all(),
            'created_at' => $user->created_at,
        ];
    }

    public function createSupportAgent(array $data): User
    {
        // 1. Normalize the email
        $email = strtolower(trim($data['email']));

        // 2. Check whether email already exists
        if (User::where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => 'This email is already registered.',
            ]);
        }

        // 3. Create the user
        try {
            $user = User::create([
                'name' => $data['name'],
                'email' => $email,
                'password' => Hash::make(Str::random(64)),
                'is_active' => false,
            ]);
        } catch (QueryException $e) {

            // Handle a duplicate email inserted concurrently
            if (($e->errorInfo[1] ?? null) == 1062) {
                throw ValidationException::withMessages([
                    'email' => 'This email is already registered.',
                ]);
            }

            throw $e;
        }

        // Assign support agent role
        $user->assignRole('support_agent');

        // Return the created user
        return $user;
    }

    public function updateProfile(User $user, array $data): User
    {
        // Update the authenticated user's name
        $user->name = $data['name'];

        // Save the changes to the database
        $user->save();

        // Return the updated user
        return $user;
    }
}
