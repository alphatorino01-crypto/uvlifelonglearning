<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $mailbox_email
 * @property string $access_token
 * @property string $refresh_token
 * @property Carbon $expires_at
 * @property int|null $connected_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class OrganizationMailboxConnection extends Model
{
    protected $fillable = [
        'mailbox_email',
        'access_token',
        'refresh_token',
        'expires_at',
        'connected_by',
    ];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'expires_at' => 'datetime',
        ];
    }
}
