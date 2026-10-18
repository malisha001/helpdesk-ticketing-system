<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DashboardRequest extends FormRequest
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
            return $user->can('view-assigned-ticket')
                && $user->can('view-unassigned-ticket');
        }

        if ($user->hasRole('administrator')) {
            return $user->can('view-all-ticket');
        }

        return false;
    }

    public function rules(): array
    {
        return [];
    }
}
