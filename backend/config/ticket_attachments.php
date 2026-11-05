<?php

return [
    'disk' => env('TICKET_ATTACHMENTS_DISK', 'local'),
    'max_files' => 5,
    'max_size_kb' => 5120,
    'allowed_extensions' => ['pdf', 'png', 'jpg', 'jpeg', 'txt', 'doc', 'docx'],
];
