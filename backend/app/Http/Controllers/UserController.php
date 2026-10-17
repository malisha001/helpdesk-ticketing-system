<?php

namespace App\Http\Controllers;

use App\Handlers\ListUsersHandler;
use App\Http\Requests\ListUsersRequest;
use Illuminate\Http\JsonResponse;
use App\Handlers\UpdateUserStatusHandler;
use App\Http\Requests\UpdateUserStatusRequest;
use App\Handlers\ShowUserHandler;
use App\Http\Requests\ShowUserRequest;
use App\Handlers\CreateAgentHandler;
use App\Http\Requests\StoreAgentRequest;

class UserController extends Controller
{
    public function index(
        ListUsersRequest $request,
        ListUsersHandler $handler
    ): JsonResponse {

        // 1. Get validated search and filter parameters
        $filters = $request->validated();

        // 2. Call handler
        $users = $handler->handle($filters);

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
        UpdateUserStatusHandler $handler,
        int $id
    ): JsonResponse {

        // 1. Request validation is handled by Form Request
        $isActive = $request->boolean('is_active');

        // 2. Call Handler
        $user = $handler->handle(
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
        ShowUserHandler $handler,
        int $id
    ): JsonResponse {

        // 1. Get user details through Handler
        $user = $handler->handle($id);

        // 2. Return JSON response
        return response()->json([
            'success' => true,
            'data' => $user,
        ], 200);
    }

    public function storeAgent(
        StoreAgentRequest $request,
        CreateAgentHandler $handler
    ): JsonResponse {

        // 1. Get validated user information
        $validated = $request->validated();

        // 2. Create the support agent through the Handler
        $agent = $handler->handle($validated);

        // 3. Return the created account details
        return response()->json([
            'success' => true,
            'message' => 'Support agent account created. Password setup is pending.',
            'data' => [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'is_active' => (bool) $agent->is_active,
                'role' => 'support_agent',
            ],
        ], 201);
    }

}
