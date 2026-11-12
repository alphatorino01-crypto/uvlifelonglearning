import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Pencil,
    ShieldCheck,
    Trash2,
    UserPlus,
    UsersRound,
    X,
} from 'lucide-react';
import { useState } from 'react';

type UserRole = 'admin' | 'teacher' | 'student';
type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    enrollment_count: number;
    course_count: number;
    created_at: string | null;
};
type Props = { auth: { user: { id: number } | null }; users: AdminUser[] };

const fieldClass =
    'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10';

export default function UsersPage({ users }: Props) {
    const { auth } = usePage<Props>().props;
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const form = useForm({
        name: '',
        email: '',
        role: 'student' as UserRole,
        password: '',
        password_confirmation: '',
    });

    function startEditing(user: AdminUser) {
        setEditingUserId(user.id);
        form.clearErrors();
        form.setData({
            name: user.name,
            email: user.email,
            role: user.role,
            password: '',
            password_confirmation: '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEditing() {
        setEditingUserId(null);
        form.reset();
        form.clearErrors();
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
                onSuccess: () => form.reset(),
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

                <form
                    onSubmit={saveUser}
                    className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                >
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                {editingUserId ? 'Edit user' : 'Add a user'}
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {editingUserId
                                    ? 'Leave the password blank to keep it unchanged.'
                                    : 'New users are verified and can sign in immediately.'}
                            </p>
                        </div>
                        {editingUserId && (
                            <button
                                type="button"
                                onClick={cancelEditing}
                                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
                            >
                                <X className="size-4" /> Cancel
                            </button>
                        )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <label className="text-sm font-medium text-slate-700">
                            Name
                            <input
                                required
                                maxLength={255}
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
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
                                    form.setData('email', event.target.value)
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
                                        event.target.value as UserRole,
                                    )
                                }
                                className={fieldClass}
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                            Password
                            {!editingUserId && (
                                <span className="text-xs text-slate-400">
                                    {' '}
                                    (12+ characters)
                                </span>
                            )}
                            <input
                                type="password"
                                autoComplete="new-password"
                                minLength={editingUserId ? undefined : 12}
                                required={!editingUserId}
                                value={form.data.password}
                                onChange={(event) =>
                                    form.setData('password', event.target.value)
                                }
                                className={fieldClass}
                            />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                            Confirm password
                            <input
                                type="password"
                                autoComplete="new-password"
                                required={
                                    !editingUserId &&
                                    Boolean(form.data.password)
                                }
                                value={form.data.password_confirmation}
                                onChange={(event) =>
                                    form.setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                className={fieldClass}
                            />
                        </label>
                    </div>
                    {Object.keys(form.errors).length > 0 && (
                        <div role="alert" className="mt-3 text-sm text-red-600">
                            {Object.values(form.errors).join(' ')}
                        </div>
                    )}
                    <button
                        disabled={form.processing}
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#174b33] px-4 text-sm font-semibold text-white hover:bg-[#103b28] disabled:opacity-60"
                    >
                        <UserPlus className="size-4" />
                        {form.processing
                            ? 'Saving…'
                            : editingUserId
                              ? 'Save changes'
                              : 'Create user'}
                    </button>
                </form>

                <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                        <UsersRound className="size-4 text-slate-500" />
                        <h2 className="font-semibold text-slate-900">
                            All users{' '}
                            <span className="ml-1 text-sm font-normal text-slate-500">
                                ({users.length})
                            </span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-5 py-3">User</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Enrolled</th>
                                    <th className="px-5 py-3">
                                        Courses taught
                                    </th>
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
                                                    {user.name}
                                                    {isSelf ? ' (you)' : ''}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {user.email}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 capitalize">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {user.enrollment_count}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {user.course_count}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">
                                                {user.created_at ?? '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1">
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
