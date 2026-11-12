<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class CreateLmsDemoUsersCommand extends Command
{
    protected $signature = 'lms:demo-users';

    protected $description = 'Create local demo accounts for each LMS role and print their credentials';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Demo accounts can only be created in local or testing environments.');

            return self::FAILURE;
        }

        $accounts = [
            ['name' => 'LMS Administrator', 'email' => 'admin@uvlifelonglearning.test', 'role' => 'admin'],
            ['name' => 'LMS Teacher', 'email' => 'teacher@uvlifelonglearning.test', 'role' => 'teacher'],
            ['name' => 'LMS Student', 'email' => 'student@uvlifelonglearning.test', 'role' => 'student'],
        ];
        $credentials = [];

        foreach ($accounts as $account) {
            $password = Str::password(24, symbols: false);
            $user = User::query()->firstOrNew(['email' => $account['email']]);
            $user->forceFill([
                'name' => $account['name'],
                'role' => $account['role'],
                'email_verified_at' => now(),
                'password' => $password,
            ])->save();
            $credentials[] = [$account['role'], $account['email'], $password];
        }

        $this->table(['Role', 'Email', 'One-time password'], $credentials);
        $this->warn('Save these passwords now; running this command again resets them.');

        return self::SUCCESS;
    }
}
