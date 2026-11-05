<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Handlers\CreateAgentHandler;
use App\Handlers\ListUsersHandler;
use App\Handlers\ShowUserHandler;
use App\Handlers\UpdateUserStatusHandler;
use App\Http\Requests\ListUsersRequest;
use App\Http\Requests\ShowUserRequest;
use App\Http\Requests\StoreAgentRequest;
use App\Http\Requests\UpdateUserStatusRequest;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function index(
        ListUsersRequest $request,
        ListUsersHandler $listUsersHandler
    ): JsonResponse {

        // 1. Get validated search and filter parameters
        $filters = $request->validated();

        // 2. Call handler
        $users = $listUsersHandler->handle($filters);

        // 3. Return JSON response
        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ], 200);
    }

    public function updateStatus(
        UpdateUserStatusRequest $request,
        UpdateUserStatusHandler $updateUserStatusHandler,
        int $id
    ): JsonResponse {

        // 1. Request validation is handled by Form Request
        $isActive = $request->boolean('is_active');

        // 2. Call Handler
        $user = $updateUserStatusHandler->handle(
            $request->user(),
            $id,
            $isActive
        );

        // 3. Return response
        return response()->json([
            'success' => true,
            'message' => $isActive
                ? 'User activated successfully.'
                : 'User deactivated successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => (bool) $user->is_active,
            ],
        ], 200);
    }

    public function show(
        ShowUserRequest $request,
        ShowUserHandler $showUserHandler,
        int $id
    ): JsonResponse {

        // 1. Get user details through Handler
        $user = $showUserHandler->handle($id);

        // 2. Return JSON response
        return response()->json([
            'success' => true,
            'data' => $user,
        ], 200);
    }

    public function storeAgent(
        StoreAgentRequest $request,
        CreateAgentHandler $createAgentHandler
    ): JsonResponse {

        // 1. Get validated user information
        $validated = $request->validated();

        // 2. Create the support agent through the Handler
        $agent = $createAgentHandler->handle($validated);

        // 3. Return the created account details
        return response()->json([
            'success' => true,
            'message' => 'Support agent account created. Password setup is pending.',
            'data' => [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'is_active' => (bool) $agent->is_active,
                'role' => UserRole::SupportAgent->value,
            ],
        ], 201);
    }
}
