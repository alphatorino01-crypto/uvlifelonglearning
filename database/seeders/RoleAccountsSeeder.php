<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class RoleAccountsSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Role demo accounts can only be seeded in local or testing environments.');
        }

        $accounts = [
            ['name' => 'LMS Administrator', 'email' => 'admin@uvlifelonglearning.test', 'role' => 'admin'],
            ['name' => 'LMS Teacher', 'email' => 'teacher@uvlifelonglearning.test', 'role' => 'teacher'],
            ['name' => 'LMS Student', 'email' => 'student@uvlifelonglearning.test', 'role' => 'student'],
        ];

        foreach ($accounts as $account) {
            $user = User::query()->firstOrNew(['email' => $account['email']]);
            $user->forceFill([
                ...$account,
                'email_verified_at' => now(),
                'password' => 'password',
            ])->save();
        }
    }
}
