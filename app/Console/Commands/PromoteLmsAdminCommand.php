<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PromoteLmsAdminCommand extends Command
{
    protected $signature = 'lms:make-admin {email : Email address of an existing account}';

    protected $description = 'Grant LMS administrator access to an existing account';

    public function handle(): int
    {
        $user = User::query()->where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error('No account exists with that email address.');

            return self::FAILURE;
        }

        $user->forceFill(['role' => 'admin'])->save();

        $this->info("Administrator role granted to {$user->email}.");

        return self::SUCCESS;
    }
}
