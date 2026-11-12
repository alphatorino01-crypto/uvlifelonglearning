<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RoleAccountsSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_login_accounts_for_each_role(): void
    {
        $this->seed(DatabaseSeeder::class);

        $accounts = [
            'admin@uvlifelonglearning.test' => 'admin',
            'teacher@uvlifelonglearning.test' => 'teacher',
            'student@uvlifelonglearning.test' => 'student',
        ];

        foreach ($accounts as $email => $role) {
            $user = User::query()->where('email', $email)->firstOrFail();

            $this->assertSame($role, $user->role);
            $this->assertTrue(Hash::check('password', $user->password));
        }
    }
}
