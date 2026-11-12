# Microsoft Graph mail setup

The admin user-management page sends credential email through a delegated Microsoft Graph connection. The app does not use SMTP for student imports.

## Entra application

1. Register a **single-tenant web application** in Microsoft Entra.
2. Add these **delegated** Microsoft Graph permissions: `Mail.Send` and `User.Read`. The app requests `offline_access` so it can refresh access tokens.
3. Configure the tenant to allow user consent, or have an Entra administrator grant the consent required by your tenant policy.
4. Register this project's callback as a **Web** redirect URI in Entra, then set `MSGRAPH_REDIRECT_URI` to the exact URL for the environment. The callback path is `/admin/users/mail/callback` (for example, production is `https://uvlifelonglearning.uvbeams.com/admin/users/mail/callback`). It is a Laravel route in this project, not an `index.php` callback from another application.

5. Create a client secret in Entra and store it only in the server's environment configuration.

## Environment

Copy `.env.example` to `.env` for local development and set:

```dotenv
MSGRAPH_TENANT_ID=
MSGRAPH_CLIENT_ID=
MSGRAPH_CLIENT_SECRET=
MAIL_FROM_EMAIL=
MAIL_FROM_NAME="UV Lifelong Learning Portal"
MSGRAPH_REDIRECT_URI=
```

`MSGRAPH_REDIRECT_URI` must exactly match the full callback URL registered as a Web redirect URI in Entra for this project and environment. `MAIL_FROM_EMAIL` must be the same mailbox that the admin connects to. Never commit `.env` or paste a client secret into source code, issues, or chat. Keep production credentials in protected server configuration and ensure the web server denies direct access to `.env`.

## Connect and verify

Apply the pending application migrations with `php artisan migrate --force` before opening the mailbox settings.

Sign in as an admin, open **User management**, select **Connect organization mailbox**, and sign in to Entra as the configured sender mailbox. The app verifies the mailbox identity before storing encrypted access and refresh tokens. Use **Send test email to my mailbox** to verify Graph sending before importing a roster. The test message is sent only to the connected mailbox.

If the sender address changes, reconnect the matching mailbox. If tenant consent or the client secret changes, update the server environment and reconnect if required.
