<?php

namespace App\Http\Requests;

use App\Enums\TicketPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create-ticket') ?? false;
    }

    public function rules(): array
    {
        return [
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['required', Rule::enum(TicketPriority::class)],
            'attachments' => ['sometimes', 'array', 'max:'.config('ticket_attachments.max_files')],
            'attachments.*' => [
                'required', 'file',
                'mimes:'.implode(',', config('ticket_attachments.allowed_extensions')),
                'extensions:'.implode(',', config('ticket_attachments.allowed_extensions')),
                'max:'.config('ticket_attachments.max_size_kb'),
            ],
        ];
    }
}
