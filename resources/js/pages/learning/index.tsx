import { Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    BookOpenCheck,
    LayoutGrid,
    List,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CourseCard } from '@/components/learning/course-card';
import type { Course, LearningModule } from '@/types/lms';

type Props = {
    modules: LearningModule[];
    courses: Course[];
    auth: { user: { name: string } | null };
};

export default function LearningHome({ modules, courses, auth }: Props) {
    const [search, setSearch] = useState('');
    const [layout, setLayout] = useState<'list' | 'grid'>('list');
    const query = search.trim().toLowerCase();
    const filteredCourses = useMemo(
        () =>
            courses.filter((course) =>
                `${course.title} ${course.summary} ${course.module?.title ?? ''} ${course.teacher ?? course.instructor}`
                    .toLowerCase()
                    .includes(query),
            ),
        [courses, query],
    );
    const groups = [
        ...modules
            .map((module) => ({
                key: module.slug,
                title: module.title,
                courses: filteredCourses.filter(
                    (course) => course.module?.slug === module.slug,
                ),
            }))
            .filter((group) => group.courses.length > 0),
        {
            key: 'other',
            title: 'Other courses',
            courses: filteredCourses.filter((course) => !course.module),
        },
    ].filter((group) => group.courses.length > 0);
    const inProgress = courses.filter(
        (course) => course.progress > 0 && course.progress < 100,
    );
    const completed = courses.filter(
        (course) => course.progress === 100,
    ).length;
    const firstName = auth.user?.name.split(' ')[0];

    return (
        <>
            <Head title="Courses" />
            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-5">
                    <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                        {firstName
                            ? `Welcome back, ${firstName}`
                            : 'University of the Visayas · Lifelong Learning'}
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                        Courses
                    </h1>
                </header>

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
                    <section className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
                            <div
                                role="group"
                                aria-label="Course layout"
                                className="flex rounded-md border border-slate-300 bg-white p-0.5"
                            >
                                <button
                                    type="button"
                                    aria-label="List view"
                                    aria-pressed={layout === 'list'}
                                    onClick={() => setLayout('list')}
                                    className={`flex size-8 items-center justify-center rounded ${layout === 'list' ? 'bg-[#183a2a] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <List className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Grid view"
                                    aria-pressed={layout === 'grid'}
                                    onClick={() => setLayout('grid')}
                                    className={`flex size-8 items-center justify-center rounded ${layout === 'grid' ? 'bg-[#183a2a] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <LayoutGrid className="size-4" />
                                </button>
                            </div>
                            <label className="flex h-10 min-w-52 flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-slate-500 sm:max-w-sm">
                                <Search className="size-4 shrink-0" />
                                <span className="sr-only">Search courses</span>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search your courses"
                                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:ring-0"
                                />
                            </label>
                            <span className="text-xs text-slate-600">
                                {filteredCourses.length}{' '}
                                {filteredCourses.length === 1
                                    ? 'result'
                                    : 'results'}
                            </span>
                        </div>

                        {groups.length > 0 ? (
                            groups.map((group) => (
                                <section key={group.key} className="mt-4">
                                    <h2 className="mb-2 text-sm font-semibold text-slate-800">
                                        {group.title}
                                    </h2>
                                    <div
                                        className={
                                            layout === 'list'
                                                ? 'space-y-3'
                                                : 'grid gap-4 sm:grid-cols-2 2xl:grid-cols-3'
                                        }
                                    >
                                        {group.courses.map((course) => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                                layout={layout}
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))
                        ) : (
                            <div className="mt-4 border border-dashed border-slate-300 bg-white p-10 text-center">
                                <Search className="mx-auto size-7 text-slate-400" />
                                <h2 className="mt-3 font-semibold text-slate-900">
                                    No courses found
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Try another search or explore the course
                                    catalog.
                                </p>
                                <Link
                                    href="/courses"
                                    className="mt-4 inline-flex text-sm font-semibold text-emerald-800 hover:text-emerald-950"
                                >
                                    Browse all courses
                                </Link>
                            </div>
                        )}
                    </section>

                    <aside className="space-y-4">
                        <section className="border border-slate-200 bg-white">
                            <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
                                {auth.user
                                    ? 'Learning overview'
                                    : 'Get started'}
                            </h2>
                            {auth.user ? (
                                <div className="space-y-4 p-4">
                                    <OverviewRow
                                        icon={BookOpen}
                                        label="Course library"
                                        value={courses.length}
                                    />
                                    <OverviewRow
                                        icon={BookOpenCheck}
                                        label="In progress"
                                        value={inProgress.length}
                                    />
                                    <OverviewRow
                                        icon={BookOpenCheck}
                                        label="Completed"
                                        value={completed}
                                    />
                                    <Link
                                        href="/progress"
                                        className="block border-t border-slate-100 pt-3 text-sm font-medium text-emerald-800 hover:text-emerald-950"
                                    >
                                        View my progress
                                    </Link>
                                </div>
                            ) : (
                                <div className="p-4">
                                    <p className="text-sm leading-6 text-slate-600">
                                        Sign in to open your courses and save
                                        learning progress.
                                    </p>
                                    <Link
                                        href="/login"
                                        className="mt-3 inline-flex h-9 items-center rounded-md bg-[#183a2a] px-3 text-sm font-semibold text-white hover:bg-[#102b20]"
                                    >
                                        Sign in
                                    </Link>
                                </div>
                            )}
                        </section>

                        <section className="border border-slate-200 bg-white">
                            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Learning modules
                                </h2>
                                <Link
                                    href="/modules"
                                    className="text-xs font-medium text-emerald-800 hover:text-emerald-950"
                                >
                                    All
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {modules.map((module) => (
                                    <Link
                                        key={module.id}
                                        href={`/modules/${module.slug}`}
                                        className="block px-4 py-3 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900"
                                    >
                                        <span className="block font-medium">
                                            {module.title}
                                        </span>
                                        <span className="mt-1 block text-xs text-slate-500">
                                            {module.course_count} courses
                                        </span>
                                    </Link>
                                ))}
                                {!modules.length && (
                                    <p className="px-4 py-3 text-sm text-slate-500">
                                        Modules will appear here.
                                    </p>
                                )}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </>
    );
}

function OverviewRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof BookOpen;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center bg-emerald-50 text-emerald-800">
                <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm text-slate-600">
                {label}
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
                {value}
            </span>
        </div>
    );
}
