<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class DashboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        if ($user->hasRole(UserRole::Customer->value)) {
            return $user->can('view-own-ticket');
        }

        if ($user->hasRole(UserRole::SupportAgent->value)) {
            return $user->can('view-assigned-ticket')
                && $user->can('view-unassigned-ticket');
        }

        if ($user->hasRole(UserRole::Administrator->value)) {
            return $user->can('view-all-ticket');
        }

        return false;
    }

    public function rules(): array
    {
        return [];
    }
}
