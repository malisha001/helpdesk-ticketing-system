<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only administrators can list users
        return $this->user()?->hasRole(UserRole::Administrator->value) === true;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],

            'role' => [
                'sometimes',
                'nullable',
                'string',
                Rule::enum(UserRole::class),
            ],

            'is_active' => ['sometimes', 'nullable', 'boolean'],

            'page' => ['sometimes', 'integer', 'min:1'],

            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }
}
