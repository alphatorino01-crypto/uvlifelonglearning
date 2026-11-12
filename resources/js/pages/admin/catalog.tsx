import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookOpen,
    BookPlus,
    CheckCircle2,
    Clock3,
    Plus,
} from 'lucide-react';

type CourseOption = {
    id: number;
    title: string;
    slug: string;
    module: string | null;
    lesson_count: number;
    teacher_id: number | null;
    teacher: string | null;
    enrollment_count: number;
    url: string;
    status: string;
};
type TeacherOption = { id: number; name: string };
type Props = { courses: CourseOption[]; teachers: TeacherOption[] };

const fieldClass =
    'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10';
const textAreaClass =
    'mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10';

function FieldError({ message }: { message?: string }) {
    return message ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p>
    ) : null;
}

export default function CatalogManagement({ courses, teachers }: Props) {
    const form = useForm({
        teacher_id: '',
        title: '',
        summary: '',
        instructor: '',
        level: 'Beginner',
        lesson_title: '',
        lesson_summary: '',
        lesson_content: '',
        lesson_duration_minutes: '10',
        banner: null as File | null,
    });

    function createCourse(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/admin/courses', {
            onSuccess: () =>
                form.reset(
                    'teacher_id',
                    'title',
                    'summary',
                    'instructor',
                    'lesson_title',
                    'lesson_summary',
                    'lesson_content',
                    'banner',
                ),
        });
    }

    return (
        <>
            <Head title="Manage courses" />
            <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-7 lg:px-10">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123c2b] via-[#165536] to-[#207448] px-6 py-7 text-white sm:px-9 sm:py-9">
                    <div
                        aria-hidden="true"
                        className="absolute -top-32 -right-4 size-80 rounded-full border-[48px] border-white/[0.045]"
                    />
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
                            <CheckCircle2 className="size-3.5" />
                            Administrator workspace
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Course management
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80">
                            Create courses first, then organize modules,
                            lessons, banners, and settings inside each course.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-5 text-sm text-emerald-50">
                            <span className="flex items-center gap-2">
                                <BookOpen className="size-4" />
                                {courses.length} courses
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock3 className="size-4" />
                                {courses.reduce(
                                    (total, course) =>
                                        total + course.lesson_count,
                                    0,
                                )}{' '}
                                lessons
                            </span>
                        </div>
                    </div>
                </section>

                <section
                    id="create-course"
                    className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-7"
                >
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                            <BookPlus className="size-5" />
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Create a course
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Start with the course details and first lesson.
                                Add course modules and materials after creation.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={createCourse}
                        className="mt-6 grid gap-4 lg:grid-cols-2"
                    >
                        <label className="block text-sm font-medium text-slate-700">
                            Course name
                            <input
                                required
                                maxLength={150}
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                placeholder="e.g. Machine learning professional certification"
                                className={fieldClass}
                            />
                            <FieldError message={form.errors.title} />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                            Assign teacher
                            <select
                                value={form.data.teacher_id}
                                onChange={(event) =>
                                    form.setData(
                                        'teacher_id',
                                        event.target.value,
                                    )
                                }
                                className={fieldClass}
                            >
                                <option value="">Unassigned</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                            <FieldError message={form.errors.teacher_id} />
                        </label>
                        <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
                            Course description
                            <textarea
                                required
                                maxLength={2000}
                                value={form.data.summary}
                                onChange={(event) =>
                                    form.setData('summary', event.target.value)
                                }
                                placeholder="What will learners learn in this course?"
                                className={textAreaClass}
                            />
                            <FieldError message={form.errors.summary} />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                            Course banner (optional)
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    form.setData(
                                        'banner',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                className={`${fieldClass} py-2`}
                            />
                            <FieldError message={form.errors.banner} />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Instructor display name
                                <input
                                    maxLength={150}
                                    value={form.data.instructor}
                                    onChange={(event) =>
                                        form.setData(
                                            'instructor',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Uses assigned teacher if blank"
                                    className={fieldClass}
                                />
                                <FieldError message={form.errors.instructor} />
                            </label>
                            <label className="block text-sm font-medium text-slate-700">
                                Level
                                <select
                                    value={form.data.level}
                                    onChange={(event) =>
                                        form.setData(
                                            'level',
                                            event.target.value,
                                        )
                                    }
                                    className={fieldClass}
                                >
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                    <option>All levels</option>
                                </select>
                            </label>
                        </div>

                        <div className="border-t border-slate-100 pt-4 lg:col-span-2">
                            <h3 className="font-semibold text-slate-900">
                                First lesson
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Course modules can be added inside the course
                                once it is created.
                            </p>
                        </div>
                        <label className="block text-sm font-medium text-slate-700">
                            Lesson title
                            <input
                                required
                                maxLength={150}
                                value={form.data.lesson_title}
                                onChange={(event) =>
                                    form.setData(
                                        'lesson_title',
                                        event.target.value,
                                    )
                                }
                                className={fieldClass}
                            />
                            <FieldError message={form.errors.lesson_title} />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                            Lesson duration (minutes)
                            <input
                                required
                                type="number"
                                min="1"
                                max="600"
                                value={form.data.lesson_duration_minutes}
                                onChange={(event) =>
                                    form.setData(
                                        'lesson_duration_minutes',
                                        event.target.value,
                                    )
                                }
                                className={fieldClass}
                            />
                            <FieldError
                                message={form.errors.lesson_duration_minutes}
                            />
                        </label>
                        <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
                            Lesson introduction
                            <textarea
                                required
                                maxLength={1000}
                                value={form.data.lesson_summary}
                                onChange={(event) =>
                                    form.setData(
                                        'lesson_summary',
                                        event.target.value,
                                    )
                                }
                                className={textAreaClass}
                            />
                            <FieldError message={form.errors.lesson_summary} />
                        </label>
                        <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
                            Lesson content
                            <textarea
                                required
                                maxLength={50000}
                                value={form.data.lesson_content}
                                onChange={(event) =>
                                    form.setData(
                                        'lesson_content',
                                        event.target.value,
                                    )
                                }
                                className={`${textAreaClass} min-h-40`}
                            />
                            <FieldError message={form.errors.lesson_content} />
                        </label>
                        <div className="lg:col-span-2">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#174b33] px-5 text-sm font-semibold text-white transition hover:bg-[#103b28] disabled:opacity-60"
                            >
                                <Plus className="size-4" />
                                {form.processing
                                    ? 'Creating course…'
                                    : 'Create course'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                                Learning catalog
                            </p>
                            <h2 className="mt-1 text-lg font-semibold text-slate-900">
                                Courses
                            </h2>
                        </div>
                        <a
                            href="#create-course"
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
                        >
                            <Plus className="size-4" /> New course
                        </a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-5 py-3">Course</th>
                                    <th className="px-5 py-3">Lessons</th>
                                    <th className="px-5 py-3">Teacher</th>
                                    <th className="px-5 py-3">Students</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {courses.map((course) => (
                                    <tr key={course.id}>
                                        <td className="px-5 py-4">
                                            <Link
                                                href={course.url}
                                                className="font-semibold text-slate-900 hover:text-emerald-800"
                                            >
                                                {course.title}
                                            </Link>
                                            {course.module && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Legacy learning path:{' '}
                                                    {course.module}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {course.lesson_count}
                                        </td>
                                        <td className="px-5 py-4">
                                            <select
                                                aria-label={`Assign teacher to ${course.title}`}
                                                value={
                                                    course.teacher_id?.toString() ??
                                                    ''
                                                }
                                                onChange={(event) =>
                                                    router.patch(
                                                        `/admin/courses/${course.id}/teacher`,
                                                        {
                                                            teacher_id:
                                                                event.target
                                                                    .value ||
                                                                null,
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                                className="h-10 min-w-36 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
                                            >
                                                <option value="">
                                                    Unassigned
                                                </option>
                                                {teachers.map((teacher) => (
                                                    <option
                                                        key={teacher.id}
                                                        value={teacher.id}
                                                    >
                                                        {teacher.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {course.enrollment_count}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${course.status === 'open' ? 'bg-emerald-50 text-emerald-800' : course.status === 'complete' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-800'}`}
                                            >
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Link
                                                href={course.url}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                                            >
                                                Course settings & modules{' '}
                                                <ArrowUpRight className="size-3.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {!courses.length && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-10 text-center text-sm text-slate-500"
                                        >
                                            No courses yet. Create your first
                                            course above.
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
