<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class FirstLoginPasswordController extends Controller
{
    public function edit(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->must_change_password) {
            return redirect()->route('home');
        }

        return Inertia::render('auth/first-login-password', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:12', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->password = $validated['password'];
        $request->user()->must_change_password = false;
        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your password has been changed.']);

        return redirect()->route('home');
    }
}
