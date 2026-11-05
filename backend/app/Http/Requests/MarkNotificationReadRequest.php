<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkNotificationReadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'notification_id' => $this->route('id'),
        ]);
    }

    public function rules(): array
    {
        return [
            'notification_id' => [
                'required',
                'uuid',
            ],
        ];
    }
}
