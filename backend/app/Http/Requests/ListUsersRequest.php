<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only administrators can list users
        return $this->user()?->hasRole('administrator') === true;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:255'],

            'role' => [
                'sometimes',
                'in:customer,support_agent,administrator',
            ],

            'is_active' => ['sometimes', 'boolean'],

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
