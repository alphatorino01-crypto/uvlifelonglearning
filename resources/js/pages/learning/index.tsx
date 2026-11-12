import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Clock3,
    Compass,
    GraduationCap,
    Search,
    Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CourseCard } from '@/components/learning/course-card';
import { login } from '@/routes';
import type { Course, LearningModule } from '@/types/lms';

type Props = {
    modules: LearningModule[];
    courses: Course[];
    auth: { user: { name: string } | null };
};

const colors: Record<string, { badge: string; number: string }> = {
    blue: {
        badge: 'bg-emerald-100 text-emerald-800',
        number: 'text-emerald-800',
    },
    orange: {
        badge: 'bg-emerald-100 text-emerald-800',
        number: 'text-emerald-800',
    },
    green: {
        badge: 'bg-emerald-100 text-emerald-700',
        number: 'text-emerald-700',
    },
    indigo: {
        badge: 'bg-emerald-100 text-emerald-800',
        number: 'text-emerald-800',
    },
};

export default function LearningHome({ modules, courses }: Props) {
    const { auth } = usePage<Props>().props;
    const [search, setSearch] = useState('');
    const featuredCourse =
        courses.find((course) => course.progress > 0) ?? courses[0];
    const completedLessons = courses.reduce(
        (sum, course) => sum + course.completed_count,
        0,
    );
    const filteredCourses = useMemo(() => {
        const query = search.trim().toLowerCase();
        return query
            ? courses.filter((course) =>
                  `${course.title} ${course.summary} ${course.module?.title ?? ''}`
                      .toLowerCase()
                      .includes(query),
              )
            : courses;
    }, [courses, search]);

    return (
        <>
            <Head title="My learning" />
            <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-7 lg:px-10">
                <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            {auth.user
                                ? `Welcome back, ${auth.user.name.split(' ')[0]}`
                                : 'A little time for yourself'}
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                            Keep your momentum.
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                            Small steps lead to big things. Pick up where you
                            left off or find something new to learn.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {!auth.user && (
                            <Link
                                href={login()}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174b33] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123c2b]"
                            >
                                Sign in
                            </Link>
                        )}
                        <Link
                            href="/courses"
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                            <Compass className="size-4" />
                            Explore courses
                        </Link>
                    </div>
                </div>

                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123c2b] via-[#165536] to-[#207448] px-6 py-7 text-white sm:px-9 sm:py-9">
                    <div
                        aria-hidden="true"
                        className="absolute -top-32 -right-10 size-80 rounded-full border-[52px] border-white/[0.045]"
                    />
                    <div
                        aria-hidden="true"
                        className="absolute right-36 -bottom-36 size-72 rounded-full bg-emerald-300/[0.09]"
                    />
                    <div className="relative max-w-xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
                            <Sparkles className="size-3.5" />
                            Your learning space
                        </div>
                        <h2 className="mt-5 max-w-lg text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
                            {featuredCourse
                                ? completedLessons > 0
                                    ? 'You’re doing great. Ready for the next lesson?'
                                    : 'Make room for something new.'
                                : 'There’s always something new to learn.'}
                        </h2>
                        <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                            {featuredCourse
                                ? completedLessons > 0
                                    ? `Continue ${featuredCourse.title} and keep building on what you know.`
                                    : 'Start with one of our short, practical courses and learn at your own pace.'
                                : 'Explore friendly, practical courses designed to help you build skills at your own pace.'}
                        </p>
                        {featuredCourse && (
                            <Link
                                href={`/courses/${featuredCourse.slug}`}
                                className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#174b33] transition hover:bg-emerald-50"
                            >
                                {featuredCourse.progress > 0
                                    ? 'Continue learning'
                                    : 'Find your first course'}
                                <ArrowRight className="size-4" />
                            </Link>
                        )}
                    </div>
                    <div className="relative mt-7 flex max-w-lg gap-7 border-t border-white/15 pt-5 sm:gap-10">
                        <div>
                            <p className="text-xl font-semibold">
                                {modules.length}
                            </p>
                            <p className="mt-1 text-xs text-slate-300">
                                learning modules
                            </p>
                        </div>
                        <div>
                            <p className="text-xl font-semibold">
                                {courses.length}
                            </p>
                            <p className="mt-1 text-xs text-slate-300">
                                self-paced courses
                            </p>
                        </div>
                        <div>
                            <p className="text-xl font-semibold">
                                {completedLessons}
                            </p>
                            <p className="mt-1 text-xs text-slate-300">
                                lessons completed
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-10">
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                                A path for every curiosity
                            </p>
                            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
                                Explore learning modules
                            </h2>
                        </div>
                        <Link
                            href="/modules"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-900"
                        >
                            All modules <ArrowRight className="size-4" />
                        </Link>
                    </div>
                    {modules.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-3">
                            {modules.map((module, index) => {
                                const color =
                                    colors[module.color] ?? colors.indigo;
                                return (
                                    <Link
                                        key={module.id}
                                        href={`/modules/${module.slug}`}
                                        className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`flex size-10 items-center justify-center rounded-xl text-sm font-semibold ${color.badge}`}
                                            >
                                                0{index + 1}
                                            </span>
                                            <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-800" />
                                        </div>
                                        <h3 className="mt-5 font-semibold text-slate-900 group-hover:text-emerald-800">
                                            {module.title}
                                        </h3>
                                        <p className="mt-1.5 min-h-10 text-sm leading-5 text-slate-500">
                                            {module.description}
                                        </p>
                                        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <BookOpen
                                                    className={`size-3.5 ${color.number}`}
                                                />
                                                {module.course_count} courses
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock3 className="size-3.5" />
                                                {module.lesson_count} lessons
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                            <GraduationCap className="mx-auto size-8 text-slate-400" />
                            <h3 className="mt-3 font-semibold text-slate-900">
                                Your learning library is getting ready
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Check back soon for new learning modules and
                                courses.
                            </p>
                        </div>
                    )}
                </section>

                <section className="mt-10 pb-8">
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                                Learn something useful
                            </p>
                            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
                                {search
                                    ? 'Course results'
                                    : 'Courses picked for you'}
                            </h2>
                        </div>
                        <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 shadow-sm sm:w-64">
                            <Search className="size-4 shrink-0" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search courses"
                                className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                            />
                        </label>
                    </div>
                    {filteredCourses.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredCourses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                            <Search className="mx-auto size-7 text-slate-400" />
                            <h3 className="mt-3 font-semibold text-slate-900">
                                No courses found
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Try another search to find what you’re looking
                                for.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
