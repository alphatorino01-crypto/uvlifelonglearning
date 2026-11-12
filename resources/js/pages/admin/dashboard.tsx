import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    ClipboardList,
    FilePlus2,
    GraduationCap,
    Plus,
    UsersRound,
} from 'lucide-react';

type Props = {
    stats: {
        users: number;
        students: number;
        teachers: number;
        courses: number;
        modules: number;
        lessons: number;
        enrollments: number;
    };
    recentEnrollments: {
        id: number;
        student: string;
        email: string;
        course: string;
        course_url: string;
        enrolled_at: string;
    }[];
};

const overviewCards = [
    {
        key: 'users',
        label: 'Total users',
        icon: UsersRound,
        href: '/admin/users',
        tint: 'bg-emerald-50 text-emerald-800',
    },
    {
        key: 'courses',
        label: 'Courses',
        icon: BookOpen,
        href: '/admin/catalog',
        tint: 'bg-blue-50 text-blue-700',
    },
    {
        key: 'lessons',
        label: 'Lessons',
        icon: FilePlus2,
        href: '/admin/catalog',
        tint: 'bg-violet-50 text-violet-700',
    },
    {
        key: 'enrollments',
        label: 'Enrollments',
        icon: ClipboardList,
        href: '/admin/enrollments',
        tint: 'bg-amber-50 text-amber-700',
    },
] as const;

export default function AdminDashboard({ stats, recentEnrollments }: Props) {
    return (
        <>
            <Head title="Admin dashboard" />
            <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123c2b] via-[#165536] to-[#207448] px-6 py-6 text-white sm:px-8 sm:py-7">
                    <div
                        aria-hidden="true"
                        className="absolute -top-36 -right-8 size-72 rounded-full border-[42px] border-white/[0.05]"
                    />
                    <div className="relative flex flex-wrap items-end justify-between gap-6">
                        <div>
                            <p className="text-sm font-medium text-emerald-100">
                                Administration
                            </p>
                            <h1 className="mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Dashboard
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
                                Your overview of courses, people, and learner
                                activity.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/admin/catalog"
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#174b33] shadow-sm transition hover:bg-emerald-50"
                            >
                                <Plus className="size-4" /> Create course
                            </Link>
                            <Link
                                href="/admin/enrollments"
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/30 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                                Manage enrollments
                            </Link>
                        </div>
                    </div>
                </section>

                <section
                    aria-label="LMS summary"
                    className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {overviewCards.map(
                        ({ key, label, icon: Icon, href, tint }) => (
                            <Link
                                key={key}
                                href={href}
                                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                            >
                                <span
                                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tint}`}
                                >
                                    <Icon className="size-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-2xl font-semibold tracking-tight text-slate-900">
                                        {stats[key]}
                                    </span>
                                    <span className="mt-0.5 block text-sm text-slate-500">
                                        {label}
                                    </span>
                                </span>
                                <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                            </Link>
                        ),
                    )}
                </section>

                <section className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Recent enrollments
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Latest student course assignments
                                </p>
                            </div>
                            <Link
                                href="/admin/enrollments"
                                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
                            >
                                View all <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                        {recentEnrollments.length ? (
                            <div className="divide-y divide-slate-100">
                                {recentEnrollments.map((enrollment) => (
                                    <div
                                        key={enrollment.id}
                                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50/70"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800">
                                                {enrollment.student
                                                    .split(/\s+/)
                                                    .map((part) => part[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase()}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {enrollment.student}
                                                </p>
                                                <p className="truncate text-xs text-slate-500">
                                                    {enrollment.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="min-w-0 text-right">
                                            <Link
                                                href={enrollment.course_url}
                                                className="block truncate text-sm font-medium text-emerald-800 hover:underline"
                                            >
                                                {enrollment.course}
                                            </Link>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {enrollment.enrolled_at}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-5 py-10 text-center">
                                <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                    <ClipboardList className="size-5" />
                                </span>
                                <p className="mt-3 text-sm font-medium text-slate-700">
                                    No enrollments yet
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Enroll a learner to see activity here.
                                </p>
                                <Link
                                    href="/admin/enrollments"
                                    className="mt-4 inline-flex text-sm font-semibold text-emerald-800 hover:underline"
                                >
                                    Go to enrollments
                                </Link>
                            </div>
                        )}
                    </div>

                    <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <h2 className="font-semibold text-slate-900">
                                Quick access
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Common administration tasks
                            </p>
                        </div>
                        <div className="p-3">
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50"
                            >
                                <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                                    <UsersRound className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-slate-800">
                                        Manage users
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-500">
                                        {stats.students} students ·{' '}
                                        {stats.teachers} teachers
                                    </span>
                                </span>
                                <ArrowRight className="size-4 text-slate-300" />
                            </Link>
                            <Link
                                href="/admin/catalog"
                                className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50"
                            >
                                <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                    <BookOpen className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-slate-800">
                                        Learning catalog
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-500">
                                        {stats.modules} course modules ·{' '}
                                        {stats.courses} courses
                                    </span>
                                </span>
                                <ArrowRight className="size-4 text-slate-300" />
                            </Link>
                            <Link
                                href="/admin/enrollments"
                                className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50"
                            >
                                <span className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                                    <GraduationCap className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-slate-800">
                                        Assign learners
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-500">
                                        Manage course enrollments
                                    </span>
                                </span>
                                <ArrowRight className="size-4 text-slate-300" />
                            </Link>
                        </div>
                        <div className="mx-5 mb-5 flex items-center justify-between rounded-xl bg-emerald-50/80 px-4 py-3">
                            <span>
                                <span className="block text-xs font-medium text-emerald-900">
                                    Learning content
                                </span>
                                <span className="mt-0.5 block text-xs text-emerald-800/70">
                                    {stats.lessons} lessons across{' '}
                                    {stats.courses} courses
                                </span>
                            </span>
                            <Link
                                href="/admin/catalog"
                                aria-label="Manage learning content"
                                className="flex size-8 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-sm transition hover:bg-emerald-100"
                            >
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </aside>
                </section>
            </div>
        </>
    );
}
