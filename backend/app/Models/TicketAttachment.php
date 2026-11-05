<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketAttachment extends Model
{
    protected $fillable = ['uploaded_by', 'disk', 'path', 'original_name', 'mime_type', 'size'];

    protected $visible = ['id', 'original_name', 'mime_type', 'size', 'download_url'];

    protected $appends = ['download_url'];

    protected function casts(): array
    {
        return ['size' => 'integer'];
    }

    protected function downloadUrl(): Attribute
    {
        return Attribute::make(get: fn (): string => route('tickets.attachments.download', [
            'id' => $this->ticket_id,
            'attachment' => $this->id,
        ], false));
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
