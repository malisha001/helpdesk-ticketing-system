<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class TicketAttachmentService
{
    /**
     * @param  array<UploadedFile>  $files
     * @param  array<array{disk: string, path: string}>  $storedFiles
     */
    public function storeForTicket(Ticket $ticket, User $uploader, array $files, array &$storedFiles): void
    {
        $disk = config('ticket_attachments.disk');

        foreach ($files as $file) {
            $directory = 'ticket-attachments/'.$ticket->id;
            $filename = $file->hashName();
            $path = $directory.'/'.$filename;
            // Track before writing so a partial write is also cleaned up.
            $storedFiles[] = ['disk' => $disk, 'path' => $path];

            if ($file->storeAs($directory, $filename, ['disk' => $disk, 'visibility' => 'private']) === false) {
                throw new RuntimeException('Unable to store ticket attachment.');
            }

            $ticket->attachments()->create([
                'uploaded_by' => $uploader->id,
                'disk' => $disk,
                'path' => $path,
                'original_name' => mb_substr(preg_replace('/[\x00-\x1F\x7F]/u', '', basename(str_replace('\\', '/', $file->getClientOriginalName()))), 0, 255),
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                'size' => $file->getSize(),
            ]);
        }
    }

    /** @param array<array{disk: string, path: string}> $storedFiles */
    public function removeNewFiles(array $storedFiles): void
    {
        foreach ($storedFiles as $file) {
            try {
                if (! Storage::disk($file['disk'])->delete($file['path'])) {
                    report(new RuntimeException('Unable to clean up a failed ticket attachment upload.'));
                }
            } catch (Throwable $exception) {
                report($exception);
            }
        }
    }

    public function download(Ticket $ticket, int $attachmentId): StreamedResponse
    {
        $attachment = $ticket->attachments()->whereKey($attachmentId)->firstOrFail();
        $disk = Storage::disk($attachment->disk);
        abort_unless($disk->exists($attachment->path), 404);

        return $disk->download($attachment->path, $attachment->original_name, [
            'Content-Type' => $attachment->mime_type,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
