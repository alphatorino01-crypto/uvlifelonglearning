<?php

namespace App\Services\Admin;

class TemporaryPasswordGenerator
{
    public function generate(): string
    {
        $sets = [
            'ABCDEFGHJKLMNPQRSTUVWXYZ',
            'abcdefghijkmnopqrstuvwxyz',
            '23456789',
            '!@#$%&*?',
        ];
        $characters = array_map(
            static fn (string $set): string => $set[random_int(0, strlen($set) - 1)],
            $sets,
        );
        $allCharacters = implode('', $sets);
        for ($index = count($characters); $index < 8; $index++) {
            $characters[] = $allCharacters[random_int(0, strlen($allCharacters) - 1)];
        }

        for ($index = count($characters) - 1; $index > 0; $index--) {
            $swapIndex = random_int(0, $index);
            [$characters[$index], $characters[$swapIndex]] = [$characters[$swapIndex], $characters[$index]];
        }

        return implode('', $characters);
    }
}
