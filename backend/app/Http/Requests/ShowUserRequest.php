<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class ShowUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && $user->hasRole(UserRole::Administrator->value)
            && $user->can('manage-users');
    }

    public function rules(): array
    {
        return [];
    }
}
