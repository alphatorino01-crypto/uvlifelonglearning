import { Head, router, useForm } from '@inertiajs/react';
import { ClipboardList, Trash2, UserPlus } from 'lucide-react';

type Person = { id: number; name: string; email: string };
type CourseOption = { id: number; title: string; slug: string };
type Enrollment = {
    id: number;
    student_id: number;
    student: string;
    email: string;
    course_id: number;
    course: string;
    enrolled_at: string;
};
type Props = {
    students: Person[];
    courses: CourseOption[];
    enrollments: Enrollment[];
};

const fieldClass =
    'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10';

export default function EnrollmentsPage({
    students,
    courses,
    enrollments,
}: Props) {
    const form = useForm({
        user_id: students[0]?.id.toString() ?? '',
        course_id: courses[0]?.id.toString() ?? '',
    });

    function enroll(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/admin/enrollments', { onSuccess: () => form.reset() });
    }

    function remove(enrollment: Enrollment) {
        if (
            window.confirm(
                `Remove ${enrollment.student} from ${enrollment.course}?`,
            )
        ) {
            router.delete(`/admin/enrollments/${enrollment.id}`, {
                preserveScroll: true,
            });
        }
    }

    return (
        <>
            <Head title="Manage enrollments" />
            <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-7 lg:px-10">
                <div className="flex items-start gap-4">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                        <ClipboardList className="size-6" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-emerald-800">
                            Administration
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                            Enrollments
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Assign students to courses and review existing
                            enrollment records.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={enroll}
                    className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                >
                    <label className="text-sm font-medium text-slate-700">
                        Student
                        <select
                            required
                            disabled={!students.length}
                            value={form.data.user_id}
                            onChange={(event) =>
                                form.setData('user_id', event.target.value)
                            }
                            className={fieldClass}
                        >
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.name} · {student.email}
                                </option>
                            ))}
                        </select>
                        {form.errors.user_id && (
                            <span className="mt-1 block text-xs text-red-600">
                                {form.errors.user_id}
                            </span>
                        )}
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                        Course
                        <select
                            required
                            disabled={!courses.length}
                            value={form.data.course_id}
                            onChange={(event) =>
                                form.setData('course_id', event.target.value)
                            }
                            className={fieldClass}
                        >
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                        {form.errors.course_id && (
                            <span className="mt-1 block text-xs text-red-600">
                                {form.errors.course_id}
                            </span>
                        )}
                    </label>
                    <button
                        disabled={
                            form.processing ||
                            !students.length ||
                            !courses.length
                        }
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#174b33] px-5 text-sm font-semibold text-white hover:bg-[#103b28] disabled:opacity-50"
                    >
                        <UserPlus className="size-4" /> Enroll student
                    </button>
                </form>

                <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="font-semibold text-slate-900">
                            Enrolled students{' '}
                            <span className="ml-1 text-sm font-normal text-slate-500">
                                ({enrollments.length})
                            </span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-5 py-3">Student</th>
                                    <th className="px-5 py-3">Course</th>
                                    <th className="px-5 py-3">Enrolled</th>
                                    <th className="px-5 py-3 text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {enrollments.map((enrollment) => (
                                    <tr key={enrollment.id}>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-900">
                                                {enrollment.student}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {enrollment.email}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 text-slate-700">
                                            {enrollment.course}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">
                                            {enrollment.enrolled_at}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    remove(enrollment)
                                                }
                                                aria-label={`Remove ${enrollment.student} enrollment`}
                                                className="inline-flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!enrollments.length && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center text-slate-500"
                                        >
                                            No enrollments to show.
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
