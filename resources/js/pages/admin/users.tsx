import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    FileSpreadsheet,
    KeyRound,
    Mail,
    Pencil,
    ShieldCheck,
    SlidersHorizontal,
    Trash2,
    Upload,
    UserPlus,
    UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

type UserRole = 'admin' | 'teacher' | 'student';
type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    student_no: string | null;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    date_enrolled: string | null;
    status: string | null;
    modality: string | null;
    class_id: string | null;
    subject: string | null;
    section: string | null;
    schedule: string | null;
    display_name: string | null;
    created_at: string | null;
};
type RosterFieldKey =
    | 'student_no'
    | 'last_name'
    | 'first_name'
    | 'middle_name'
    | 'date_enrolled'
    | 'status'
    | 'modality'
    | 'class_id'
    | 'subject'
    | 'section'
    | 'schedule'
    | 'email'
    | 'display_name';
type PrimaryFieldKey = 'display_name' | 'email' | 'student_no';
const rosterFields: { label: string; key: RosterFieldKey }[] = [
    { label: 'STUDENT NO.', key: 'student_no' },
    { label: 'LAST NAME', key: 'last_name' },
    { label: 'FIRST NAME', key: 'first_name' },
    { label: 'MIDDLE NAME', key: 'middle_name' },
    { label: 'DATE ENROLLED', key: 'date_enrolled' },
    { label: 'STATUS', key: 'status' },
    { label: 'MODALITY', key: 'modality' },
    { label: 'CLASS ID', key: 'class_id' },
    { label: 'SUBJECT', key: 'subject' },
    { label: 'SECTION', key: 'section' },
    { label: 'SCHEDULE', key: 'schedule' },
    { label: 'EMAIL', key: 'email' },
    { label: 'DISPLAY NAME', key: 'display_name' },
];
const primaryFields: { label: string; key: PrimaryFieldKey }[] = [
    { label: 'Display name', key: 'display_name' },
    { label: 'Email', key: 'email' },
    { label: 'Student no.', key: 'student_no' },
];
function normalizePrimaryFieldKey(value: string): PrimaryFieldKey | null {
    const key = value === 'o365_email' ? 'email' : value;
    const field = primaryFields.find((item) => item.key === key);

    return field?.key ?? null;
}
function normalizeRosterFieldKey(value: string): RosterFieldKey | null {
    const key = value === 'o365_email' ? 'email' : value;
    const field = rosterFields.find((item) => item.key === key);

    return field?.key ?? null;
}
const defaultPrimaryField: PrimaryFieldKey = 'display_name';
const defaultVisibleFields: RosterFieldKey[] = ['email', 'student_no'];
const columnPreferencesKey = 'admin-users-table-columns';
type MailboxStatus = {
    configured: boolean;
    connected: boolean;
    email: string | null;
    connected_at: string | null;
    callback_url: string;
    sender_email: string;
};
type Props = {
    auth: { user: { id: number } | null };
    users: AdminUser[];
    mailbox: MailboxStatus;
    errors?: { mailbox?: string };
};
type ImportReport = {
    imported: number;
    emailed: number;
    duplicates: number;
    invalid: number;
    email_failures: number;
    issues: string[];
};
type CreatedCredentials = {
    action: 'created' | 'reset';
    name: string;
    email: string;
    password: string;
};

const fieldClass =
    'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10';

export default function UsersPage({ users, mailbox, errors }: Props) {
    const { auth } = usePage<Props>().props;
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [createdCredentials, setCreatedCredentials] =
        useState<CreatedCredentials | null>(null);
    const [importReport, setImportReport] = useState<ImportReport | null>(null);
    const [primaryField, setPrimaryField] =
        useState<PrimaryFieldKey>(defaultPrimaryField);
    const [visibleFields, setVisibleFields] =
        useState<RosterFieldKey[]>(defaultVisibleFields);
    const [columnPreferencesLoaded, setColumnPreferencesLoaded] =
        useState(false);
    const importForm = useForm<{ file: File | null }>({ file: null });
    const testMailForm = useForm({});
    const form = useForm({
        name: '',
        email: '',
        role: 'student' as UserRole,
    });

    useEffect(() => {
        const saved = localStorage.getItem(columnPreferencesKey);
        if (saved) {
            const [savedPrimary, savedFields = ''] = saved.split('|');
            const savedPrimaryField = normalizePrimaryFieldKey(savedPrimary);
            if (savedPrimaryField) {
                setPrimaryField(savedPrimaryField);
            }
            setVisibleFields(
                savedFields
                    .split(',')
                    .map(normalizeRosterFieldKey)
                    .filter((key): key is RosterFieldKey => key !== null),
            );
        }
        setColumnPreferencesLoaded(true);
    }, []);

    useEffect(() => {
        if (columnPreferencesLoaded) {
            localStorage.setItem(
                columnPreferencesKey,
                `${primaryField}|${visibleFields.join(',')}`,
            );
        }
    }, [columnPreferencesLoaded, primaryField, visibleFields]);

    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (
                event as CustomEvent<{
                    flash?: {
                        bulkImport?: ImportReport;
                        createdUserCredentials?: CreatedCredentials;
                    };
                }>
            ).detail?.flash;
            if (flash?.bulkImport) {
                setImportReport(flash.bulkImport);
            }
            if (flash?.createdUserCredentials) {
                setCreatedCredentials(flash.createdUserCredentials);
                setEditingUserId(null);
                form.reset();
                setSheetOpen(true);
            }
        });
    }, []);

    function importRoster(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        importForm.post('/admin/users/import', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => importForm.reset(),
        });
    }

    function startEditing(user: AdminUser) {
        setEditingUserId(user.id);
        setCreatedCredentials(null);
        setSheetOpen(true);
        form.clearErrors();
        form.setData({
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }

    function cancelEditing() {
        setSheetOpen(false);
        setEditingUserId(null);
        setCreatedCredentials(null);
        form.reset();
        form.clearErrors();
    }

    function startCreating() {
        setEditingUserId(null);
        setCreatedCredentials(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    }

    function resetPassword(user: AdminUser) {
        if (
            !window.confirm(
                `Generate a new temporary password for ${user.name}? Their current password will stop working immediately.`,
            )
        ) {
            return;
        }

        router.post(
            `/admin/users/${user.id}/reset-password`,
            {},
            {
                preserveScroll: true,
                onStart: () => setCreatedCredentials(null),
            },
        );
    }

    function saveUser(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (editingUserId) {
            form.put(`/admin/users/${editingUserId}`, {
                preserveScroll: true,
                onSuccess: cancelEditing,
            });
        } else {
            form.post('/admin/users', {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setEditingUserId(null);
                },
            });
        }
    }

    function deleteUser(user: AdminUser) {
        if (
            window.confirm(
                `Permanently delete ${user.name}? Their enrollments and lesson progress will also be removed.`,
            )
        ) {
            router.delete(`/admin/users/${user.id}`, { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Manage users" />
            <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-7 lg:px-10">
                <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="size-6" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-emerald-800">
                            Administration
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                            User management
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Create accounts, assign roles, update details, and
                            remove users from the LMS.
                        </p>
                    </div>
                </div>

                <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
                            <Mail className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h2 className="font-semibold text-slate-900">
                                Organization email
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                {mailbox.connected
                                    ? `Connected as ${mailbox.email}. Student credentials are sent from this mailbox through Microsoft Graph.`
                                    : `Connect the organization mailbox for ${mailbox.sender_email} to send student credentials.`}
                            </p>
                            {mailbox.connected_at && (
                                <p className="mt-1 text-xs text-slate-400">
                                    Connected {mailbox.connected_at}
                                </p>
                            )}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                            <a
                                href="/admin/users/mail/connect"
                                aria-disabled={!mailbox.configured}
                                className={`inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold ${
                                    mailbox.configured
                                        ? 'bg-[#174b33] text-white hover:bg-[#103b28]'
                                        : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                }`}
                                onClick={(event) => {
                                    if (!mailbox.configured) {
                                        event.preventDefault();
                                    }
                                }}
                            >
                                {mailbox.connected
                                    ? 'Reconnect mailbox'
                                    : 'Connect organization mailbox'}
                            </a>
                            {mailbox.connected && (
                                <button
                                    type="button"
                                    disabled={testMailForm.processing}
                                    onClick={() =>
                                        testMailForm.post(
                                            '/admin/users/mail/test',
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    {testMailForm.processing
                                        ? 'Sending test email…'
                                        : 'Send test email to my mailbox'}
                                </button>
                            )}
                        </div>
                    </div>
                    {!mailbox.configured && (
                        <p className="mt-3 text-sm text-amber-700">
                            Configure MSGRAPH_TENANT_ID, MSGRAPH_CLIENT_ID,
                            MSGRAPH_CLIENT_SECRET, MSGRAPH_REDIRECT_URI, and
                            MAIL_FROM_EMAIL in the server environment first.
                        </p>
                    )}
                    {errors?.mailbox && (
                        <p role="alert" className="mt-3 text-sm text-red-600">
                            {errors.mailbox}
                        </p>
                    )}
                    <p className="mt-3 text-xs leading-5 break-all text-slate-500">
                        This is the exact callback URI configured for this
                        environment. Register this exact value as a Web redirect
                        URI in Entra:{' '}
                        <code className="text-slate-700">
                            {mailbox.callback_url}
                        </code>
                        . Grant delegated Mail.Send, User.Read, and
                        offline_access consent.
                    </p>
                </section>

                <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                            <FileSpreadsheet className="size-5" />
                        </span>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Import student roster
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Upload the University roster as an .xlsx file.
                                Student accounts use EMAIL to sign in; each
                                receives a unique temporary password and must
                                change it at first login.
                            </p>
                        </div>
                    </div>
                    <form
                        onSubmit={importRoster}
                        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
                        <label className="flex-1 text-sm font-medium text-slate-700">
                            Excel workbook (.xlsx)
                            <input
                                type="file"
                                accept=".xlsx"
                                required
                                onChange={(event) =>
                                    importForm.setData(
                                        'file',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                className={`${fieldClass} h-auto py-2`}
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={
                                importForm.processing || !mailbox.connected
                            }
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#174b33] px-4 text-sm font-semibold text-white hover:bg-[#103b28] disabled:opacity-60"
                        >
                            <Upload className="size-4" />
                            {importForm.processing
                                ? 'Importing…'
                                : 'Import students'}
                        </button>
                    </form>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                        Required headers: STUDENT NO., LAST NAME, FIRST NAME,
                        MIDDLE NAME, DATE ENROLLED, STATUS, MODALITY, CLASS ID,
                        SUBJECT, SECTION, SCHEDULE, EMAIL, DISPLAY NAME. Only
                        the connected organization mailbox is used to send
                        credentials.
                    </p>
                    {importForm.errors.file && (
                        <p role="alert" className="mt-2 text-sm text-red-600">
                            {importForm.errors.file}
                        </p>
                    )}
                    {importReport && (
                        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold">
                                Imported {importReport.imported}; emailed{' '}
                                {importReport.emailed}; skipped{' '}
                                {importReport.duplicates} duplicate(s); invalid{' '}
                                {importReport.invalid}; email failures{' '}
                                {importReport.email_failures}.
                            </p>
                            {importReport.issues.length > 0 && (
                                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600">
                                    {importReport.issues.map((issue, index) => (
                                        <li key={`${index}-${issue}`}>
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </section>

                <Sheet
                    open={sheetOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            cancelEditing();
                        } else {
                            setSheetOpen(true);
                        }
                    }}
                >
                    <SheetContent
                        side="right"
                        className="w-full gap-0 overflow-y-auto border-l border-slate-200 bg-white p-0 sm:max-w-[50vw]"
                    >
                        <SheetHeader className="border-b border-slate-100 px-7 py-6">
                            <SheetTitle className="text-xl text-slate-900">
                                {createdCredentials
                                    ? createdCredentials.action === 'reset'
                                        ? 'Password reset'
                                        : 'Account created'
                                    : editingUserId
                                      ? 'Edit user'
                                      : 'Create a user'}
                            </SheetTitle>
                            <SheetDescription className="leading-6">
                                {createdCredentials
                                    ? 'Copy the temporary password and share it with the user securely. They must choose a new password at their next login.'
                                    : editingUserId
                                      ? 'Update this account’s name, email, or role. Use Reset password from the user list to generate a temporary password.'
                                      : 'Add an account manually. A secure temporary password will be generated and required to change at first login.'}
                            </SheetDescription>
                        </SheetHeader>
                        <form
                            onSubmit={saveUser}
                            className="space-y-6 px-7 py-6"
                        >
                            {createdCredentials ? (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="flex items-center gap-2 font-semibold text-emerald-950">
                                        <KeyRound className="size-4" />
                                        {createdCredentials.action === 'reset'
                                            ? 'New temporary password'
                                            : 'Account created — save the temporary password'}
                                    </div>
                                    <p className="mt-2 text-sm text-emerald-900">
                                        {createdCredentials.name} (
                                        {createdCredentials.email}) must change
                                        this password at first login.
                                    </p>
                                    <code className="mt-3 block rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-base font-semibold tracking-wider text-slate-900 select-all">
                                        {createdCredentials.password}
                                    </code>
                                </div>
                            ) : (
                                <div className="grid gap-5 md:grid-cols-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Name
                                        <input
                                            required
                                            maxLength={255}
                                            value={form.data.name}
                                            onChange={(event) =>
                                                form.setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            className={fieldClass}
                                        />
                                    </label>
                                    <label className="text-sm font-medium text-slate-700">
                                        Email
                                        <input
                                            required
                                            type="email"
                                            maxLength={255}
                                            value={form.data.email}
                                            onChange={(event) =>
                                                form.setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                            className={fieldClass}
                                        />
                                    </label>
                                    <label className="text-sm font-medium text-slate-700">
                                        Role
                                        <select
                                            value={form.data.role}
                                            onChange={(event) =>
                                                form.setData(
                                                    'role',
                                                    event.target
                                                        .value as UserRole,
                                                )
                                            }
                                            className={fieldClass}
                                        >
                                            <option value="student">
                                                Student
                                            </option>
                                            <option value="teacher">
                                                Teacher
                                            </option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </label>
                                    {!editingUserId && (
                                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2">
                                            <KeyRound className="size-5 shrink-0 text-emerald-800" />
                                            The system generates an 8-character
                                            password with uppercase and
                                            lowercase letters, a number, and a
                                            symbol.
                                        </div>
                                    )}
                                </div>
                            )}
                            {Object.keys(form.errors).length > 0 && (
                                <div
                                    role="alert"
                                    className="text-sm text-red-600"
                                >
                                    {Object.values(form.errors).join(' ')}
                                </div>
                            )}
                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    {createdCredentials ? 'Done' : 'Cancel'}
                                </button>
                                {!createdCredentials && (
                                    <button
                                        disabled={form.processing}
                                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#174b33] px-4 text-sm font-semibold text-white hover:bg-[#103b28] disabled:opacity-60"
                                    >
                                        <UserPlus className="size-4" />
                                        {form.processing
                                            ? 'Saving…'
                                            : editingUserId
                                              ? 'Save changes'
                                              : 'Create user'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </SheetContent>
                </Sheet>

                <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center gap-2">
                            <UsersRound className="size-4 text-slate-500" />
                            <h2 className="font-semibold text-slate-900">
                                All users{' '}
                                <span className="ml-1 text-sm font-normal text-slate-500">
                                    ({users.length})
                                </span>
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={startCreating}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174b33] px-3 text-sm font-semibold text-white hover:bg-[#103b28]"
                            >
                                <UserPlus className="size-4" />
                                Add user
                            </button>
                            <details className="relative">
                                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    <SlidersHorizontal className="size-4" />
                                    Customize columns
                                </summary>
                                <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                                    <label className="block text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                        First column
                                        <select
                                            value={primaryField}
                                            onChange={(event) => {
                                                const field =
                                                    normalizePrimaryFieldKey(
                                                        event.target.value,
                                                    );
                                                if (field) {
                                                    setPrimaryField(field);
                                                }
                                            }}
                                            className={fieldClass}
                                        >
                                            {primaryFields.map((field) => (
                                                <option
                                                    key={field.key}
                                                    value={field.key}
                                                >
                                                    {field.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <fieldset className="mt-4">
                                        <legend className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                            Show columns
                                        </legend>
                                        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                                            {rosterFields.map((field) => (
                                                <label
                                                    key={field.key}
                                                    className="flex items-center gap-2 text-sm text-slate-700"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            field.key ===
                                                                primaryField ||
                                                            visibleFields.includes(
                                                                field.key,
                                                            )
                                                        }
                                                        disabled={
                                                            field.key ===
                                                            primaryField
                                                        }
                                                        onChange={(event) =>
                                                            setVisibleFields(
                                                                event.target
                                                                    .checked
                                                                    ? [
                                                                          ...visibleFields,
                                                                          field.key,
                                                                      ]
                                                                    : visibleFields.filter(
                                                                          (
                                                                              key,
                                                                          ) =>
                                                                              key !==
                                                                              field.key,
                                                                      ),
                                                            )
                                                        }
                                                        className="size-4 rounded border-slate-300 accent-emerald-800"
                                                    />
                                                    {field.label}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                    <p className="mt-3 text-xs text-slate-500">
                                        Role and Created are always shown. Your
                                        column choices are saved in this
                                        browser.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPrimaryField(
                                                defaultPrimaryField,
                                            );
                                            setVisibleFields(
                                                defaultVisibleFields,
                                            );
                                        }}
                                        className="mt-3 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
                                    >
                                        Reset columns
                                    </button>
                                </div>
                            </details>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-5 py-3">
                                        {
                                            primaryFields.find(
                                                (field) =>
                                                    field.key === primaryField,
                                            )?.label
                                        }
                                    </th>
                                    {visibleFields
                                        .filter((key) => key !== primaryField)
                                        .map((key) => (
                                            <th key={key} className="px-5 py-3">
                                                {
                                                    rosterFields.find(
                                                        (field) =>
                                                            field.key === key,
                                                    )?.label
                                                }
                                            </th>
                                        ))}
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Created</th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => {
                                    const isSelf = user.id === auth.user?.id;
                                    return (
                                        <tr key={user.id}>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">
                                                    {user[primaryField] ||
                                                        user.name ||
                                                        '—'}
                                                    {isSelf ? ' (you)' : ''}
                                                </p>
                                            </td>
                                            {visibleFields
                                                .filter(
                                                    (key) =>
                                                        key !== primaryField,
                                                )
                                                .map((key) => (
                                                    <td
                                                        key={key}
                                                        className="px-5 py-4 text-slate-600"
                                                    >
                                                        {user[key] || '—'}
                                                    </td>
                                                ))}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                                        user.role === 'admin'
                                                            ? 'bg-violet-50 text-violet-800'
                                                            : user.role ===
                                                                'teacher'
                                                              ? 'bg-sky-50 text-sky-800'
                                                              : 'bg-emerald-50 text-emerald-800'
                                                    }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">
                                                {user.created_at ?? '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={isSelf}
                                                        onClick={() =>
                                                            resetPassword(user)
                                                        }
                                                        aria-label={`Reset password for ${user.name}`}
                                                        title="Reset password"
                                                        className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-30"
                                                    >
                                                        <KeyRound className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            startEditing(user)
                                                        }
                                                        aria-label={`Edit ${user.name}`}
                                                        className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isSelf}
                                                        onClick={() =>
                                                            deleteUser(user)
                                                        }
                                                        aria-label={`Delete ${user.name}`}
                                                        className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!users.length && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-slate-500"
                                        >
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}
