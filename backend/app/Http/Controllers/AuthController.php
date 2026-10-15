<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Handlers\LoginHandler;
use App\Http\Requests\LoginRequest;
use App\Handlers\LogoutHandler;
use App\Handlers\RegisterHandler;
use App\Http\Requests\RegisterRequest;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    //manage login requests
    public function login(
        LoginRequest $request,
        LoginHandler $handler
    ): JsonResponse {
        
        $result = $handler->handle(
            $request->validated()
        );

        $user = $result['user'];

        // Return the token in a JSON response
        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'roles' => $result['roles'],

                'token' => $result['token'],
            ],
        ]);
    }
    //manage user profile requests
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'roles' => $user->getRoleNames(),
            ],
        ], 200);
    }
    //manage logout requests
    public function logout(Request $request, LogoutHandler $handler): JsonResponse
    {
        $handler->handle($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }
    public function register(
        RegisterRequest $request, 
        RegisterHandler $handler
    ): JsonResponse
    {
        $user = $handler->handle($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'customer',
            ],
        ], 201);
    }
}
