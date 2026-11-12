import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    BookOpenCheck,
    ChevronLeft,
    ChevronRight,
    Clock3,
    LayoutGrid,
    List,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CourseCard } from '@/components/learning/course-card';
import type { Course, LearningModule } from '@/types/lms';

type Props = {
    mode: 'modules' | 'courses';
    modules: LearningModule[];
    courses: Course[];
};
type CourseFilter = 'all' | 'open' | 'in-progress' | 'completed';

const colors: Record<string, string> = {
    blue: 'bg-emerald-100 text-emerald-800',
    orange: 'bg-emerald-100 text-emerald-800',
    green: 'bg-emerald-100 text-emerald-700',
    indigo: 'bg-emerald-100 text-emerald-800',
};

const selectClass =
    'h-10 min-w-36 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10';

export default function Catalog({ mode, modules, courses }: Props) {
    const { auth } = usePage<Props>().props;
    const [search, setSearch] = useState('');
    const [moduleFilter, setModuleFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
    const [layout, setLayout] = useState<'list' | 'grid'>('list');
    const [pageSize, setPageSize] = useState('25');
    const [page, setPage] = useState(1);
    const query = search.trim().toLowerCase();

    const filteredModules = useMemo(
        () =>
            modules.filter((module) =>
                `${module.title} ${module.description}`
                    .toLowerCase()
                    .includes(query),
            ),
        [modules, query],
    );
    const filteredCourses = useMemo(
        () =>
            courses.filter((course) => {
                const matchesQuery =
                    `${course.title} ${course.summary} ${course.module?.title ?? ''} ${course.teacher ?? course.instructor}`
                        .toLowerCase()
                        .includes(query);
                const matchesModule =
                    moduleFilter === 'all' ||
                    course.module?.slug === moduleFilter;
                const matchesStatus =
                    courseFilter === 'all' ||
                    (courseFilter === 'open' &&
                        course.effective_status !== 'closed') ||
                    (courseFilter === 'in-progress' &&
                        course.progress > 0 &&
                        course.progress < 100) ||
                    (courseFilter === 'completed' && course.progress === 100);

                return matchesQuery && matchesModule && matchesStatus;
            }),
        [courses, courseFilter, moduleFilter, query],
    );
    const pageLimit = Number(pageSize);
    const pageCount =
        pageLimit > 0
            ? Math.max(1, Math.ceil(filteredCourses.length / pageLimit))
            : 1;
    const firstItem = pageLimit > 0 ? (page - 1) * pageLimit : 0;
    const visibleCourses =
        pageLimit > 0
            ? filteredCourses.slice(firstItem, firstItem + pageLimit)
            : filteredCourses;
    const activeCourses = courses.filter(
        (course) => course.progress > 0 && course.progress < 100,
    ).length;
    const completedCourses = courses.filter(
        (course) => course.progress === 100,
    ).length;

    return (
        <>
            <Head title={mode === 'modules' ? 'Learning modules' : 'Courses'} />
            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-5">
                    <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                        University of the Visayas · Lifelong Learning
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                        {mode === 'modules' ? 'Learning modules' : 'Courses'}
                    </h1>
                </header>

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
                    <section className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
                            {mode === 'courses' && (
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
                            )}
                            <label className="flex h-10 min-w-52 flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-slate-500 sm:max-w-sm">
                                <Search className="size-4 shrink-0" />
                                <span className="sr-only">Search {mode}</span>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                        setPage(1);
                                    }}
                                    placeholder={`Search ${mode}`}
                                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:ring-0"
                                />
                            </label>
                            {mode === 'courses' && (
                                <>
                                    <label
                                        className="sr-only"
                                        htmlFor="module-filter"
                                    >
                                        Filter by module
                                    </label>
                                    <select
                                        id="module-filter"
                                        value={moduleFilter}
                                        onChange={(event) => {
                                            setModuleFilter(event.target.value);
                                            setPage(1);
                                        }}
                                        className={selectClass}
                                    >
                                        <option value="all">All modules</option>
                                        {modules.map((module) => (
                                            <option
                                                key={module.id}
                                                value={module.slug}
                                            >
                                                {module.title}
                                            </option>
                                        ))}
                                    </select>
                                    <label
                                        className="sr-only"
                                        htmlFor="course-filter"
                                    >
                                        Filter courses
                                    </label>
                                    <select
                                        id="course-filter"
                                        value={courseFilter}
                                        onChange={(event) => {
                                            setCourseFilter(
                                                event.target
                                                    .value as CourseFilter,
                                            );
                                            setPage(1);
                                        }}
                                        className={selectClass}
                                    >
                                        <option value="all">All courses</option>
                                        <option value="open">
                                            Open courses
                                        </option>
                                        <option value="in-progress">
                                            In progress
                                        </option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                    </select>
                                    <label
                                        className="sr-only"
                                        htmlFor="page-size"
                                    >
                                        Results per page
                                    </label>
                                    <select
                                        id="page-size"
                                        value={pageSize}
                                        onChange={(event) => {
                                            setPageSize(event.target.value);
                                            setPage(1);
                                        }}
                                        className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700"
                                    >
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="0">All</option>
                                    </select>
                                    <span className="text-xs text-slate-500">
                                        per page
                                    </span>
                                </>
                            )}
                        </div>

                        <p className="py-3 text-xs text-slate-600">
                            {mode === 'courses'
                                ? `${filteredCourses.length} ${filteredCourses.length === 1 ? 'result' : 'results'}`
                                : `${filteredModules.length} ${filteredModules.length === 1 ? 'module' : 'modules'}`}
                        </p>

                        {mode === 'modules' ? (
                            filteredModules.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredModules.map((module, index) => (
                                        <Link
                                            key={module.id}
                                            href={`/modules/${module.slug}`}
                                            className="group flex items-center gap-4 border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm sm:p-5"
                                        >
                                            <span
                                                className={`flex size-11 shrink-0 items-center justify-center text-sm font-semibold ${colors[module.color] ?? colors.indigo}`}
                                            >
                                                {String(index + 1).padStart(
                                                    2,
                                                    '0',
                                                )}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-semibold text-slate-900 group-hover:text-emerald-800">
                                                    {module.title}
                                                </span>
                                                <span className="mt-1 line-clamp-2 block text-sm text-slate-500">
                                                    {module.description}
                                                </span>
                                            </span>
                                            <span className="hidden items-center gap-4 text-xs text-slate-500 sm:flex">
                                                <span>
                                                    {module.course_count}{' '}
                                                    courses
                                                </span>
                                                <span>
                                                    {module.lesson_count}{' '}
                                                    lessons
                                                </span>
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState text="No modules matched your search." />
                            )
                        ) : visibleCourses.length > 0 ? (
                            <div
                                className={
                                    layout === 'list'
                                        ? 'space-y-3'
                                        : 'grid gap-4 sm:grid-cols-2 2xl:grid-cols-3'
                                }
                            >
                                {visibleCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        layout={layout}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState text="No courses matched your filters." />
                        )}
                        {mode === 'courses' &&
                            pageLimit > 0 &&
                            filteredCourses.length > pageLimit && (
                                <nav
                                    aria-label="Course results pages"
                                    className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4"
                                >
                                    <p className="text-xs text-slate-600">
                                        Showing {firstItem + 1}–
                                        {Math.min(
                                            firstItem + pageLimit,
                                            filteredCourses.length,
                                        )}{' '}
                                        of {filteredCourses.length}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={page === 1}
                                            onClick={() =>
                                                setPage((current) =>
                                                    Math.max(1, current - 1),
                                                )
                                            }
                                            className="inline-flex h-9 items-center gap-1 border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <ChevronLeft className="size-4" />
                                            Previous
                                        </button>
                                        <span className="text-xs text-slate-600">
                                            Page {page} of {pageCount}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={page >= pageCount}
                                            onClick={() =>
                                                setPage((current) =>
                                                    Math.min(
                                                        pageCount,
                                                        current + 1,
                                                    ),
                                                )
                                            }
                                            className="inline-flex h-9 items-center gap-1 border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Next
                                            <ChevronRight className="size-4" />
                                        </button>
                                    </div>
                                </nav>
                            )}
                    </section>

                    <aside className="space-y-4">
                        <section className="border border-slate-200 bg-white">
                            <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
                                Learning overview
                            </h2>
                            <div className="space-y-4 p-4">
                                <OverviewItem
                                    icon={BookOpen}
                                    label="Available courses"
                                    value={courses.length}
                                />
                                <OverviewItem
                                    icon={BookOpenCheck}
                                    label="In progress"
                                    value={activeCourses}
                                />
                                <OverviewItem
                                    icon={Clock3}
                                    label="Completed"
                                    value={completedCourses}
                                />
                                {auth.user && (
                                    <Link
                                        href="/progress"
                                        className="block border-t border-slate-100 pt-3 text-sm font-medium text-emerald-800 hover:text-emerald-950"
                                    >
                                        View my progress
                                    </Link>
                                )}
                            </div>
                        </section>
                        <section className="border border-slate-200 bg-white">
                            <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
                                Learning modules
                            </h2>
                            <div className="divide-y divide-slate-100">
                                {modules.map((module) => (
                                    <Link
                                        key={module.id}
                                        href={`/modules/${module.slug}`}
                                        className="block px-4 py-3 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900"
                                    >
                                        {module.title}
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

function OverviewItem({
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

function EmptyState({ text }: { text: string }) {
    return (
        <p className="border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {text}
        </p>
    );
}
