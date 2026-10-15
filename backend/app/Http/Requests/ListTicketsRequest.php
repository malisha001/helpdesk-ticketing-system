<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListTicketsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (!$user) {
        return false;
        }
        if ($user->hasRole('customer')) {
            return $user->can('view-own-ticket');
        }
        if ($user->hasRole('support_agent')) {
            return $user->can('view-unassigned-ticket') || $user->can('view-assigned-ticket');
        }
        if ($user->hasRole('administrator')) {
            return $user->can('view-all-ticket');
        }

        return false;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],

            'status' => [
                'sometimes',
                'nullable',
                'in:open,in_progress,waiting_for_customer,resolved',
            ],

            'priority' => [
                'sometimes',
                'nullable',
                'in:low,medium,high',
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
