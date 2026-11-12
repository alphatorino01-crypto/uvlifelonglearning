<p>Hello {{ $studentName }},</p>

<p>Your University of the Visayas Lifelong Learning account is ready.</p>

<p>
    <strong>Email:</strong> {{ $email }}<br>
    <strong>Temporary password:</strong> {{ $temporaryPassword }}
</p>

<p>Sign in at <a href="{{ $loginUrl }}">{{ $loginUrl }}</a>. You will be asked to create a new password the first time you sign in.</p>

<p>For your security, do not share this email or your password.</p>

<p>Regards,<br>{{ config('mail.from.name') }}</p>
