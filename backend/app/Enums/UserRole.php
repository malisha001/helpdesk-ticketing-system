<?php

namespace App\Enums;

enum UserRole: string
{
    case Customer = 'customer';
    case SupportAgent = 'support_agent';
    case Administrator = 'administrator';
}
