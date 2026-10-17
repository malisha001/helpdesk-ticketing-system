<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && $user->hasRole('administrator')
            && $user->can('manage-users');
    }

    public function rules(): array
    {
        return [
            'search' => [
                'sometimes',
                'string',
                'max:100',
            ],

            'role' => [
                'sometimes',
                'string',
                Rule::in([
                    'customer',
                    'support_agent',
                    'administrator',
                ]),
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            'page' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:50',
            ],
        ];
    }
}
