import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = { passwordRules: string };

export default function FirstLoginPassword({ passwordRules }: Props) {
    return (
        <>
            <Head title="Set your password" />
            <Form
                action="/first-login-password"
                method="put"
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="password">New password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                minLength={12}
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password} />
                            <p
                                className="text-xs text-muted-foreground"
                                title={passwordRules}
                            >
                                Choose a new password with at least 12
                                characters.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirm new password
                            </Label>
                            <Input
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                required
                                minLength={12}
                                autoComplete="new-password"
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            Set new password
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

FirstLoginPassword.layout = {
    title: 'Choose a new password',
    description:
        'For your security, create a personal password before continuing to your learning account.',
};
