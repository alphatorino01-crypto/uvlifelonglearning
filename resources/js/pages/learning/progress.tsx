import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpenCheck,
    CheckCircle2,
    CircleDashed,
    Compass,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Course } from '@/types/lms';

type Props = {
    courses: Course[];
};

export default function LearningProgress({ courses }: Props) {
    const trackableCourses = courses.filter(
        (course) => course.settings?.track_progress && course.lesson_count > 0,
    );
    const completedLessons = trackableCourses.reduce(
        (total, course) => total + course.completed_count,
        0,
    );
    const activeCourses = trackableCourses.filter(
        (course) => course.progress > 0 && course.progress < 100,
    ).length;
    const completedCourses = trackableCourses.filter(
        (course) => course.progress === 100,
    ).length;
    const sortedCourses = [...courses].sort(
        (first, second) =>
            Number(first.progress === 100) - Number(second.progress === 100) ||
            second.progress - first.progress,
    );

    return (
        <>
            <Head title="My progress" />
            <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-[1440px] px-4 py-8 sm:px-7 lg:px-10">
                <header className="mb-8">
                    <p className="text-sm font-medium text-emerald-800">
                        Your learning journey
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                        My progress
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        See what you have completed and pick up where you left
                        off in your enrolled courses.
                    </p>
                </header>

                <section
                    aria-label="Progress summary"
                    className="grid gap-4 sm:grid-cols-3"
                >
                    <SummaryCard
                        icon={BookOpenCheck}
                        label="Lessons completed"
                        value={completedLessons}
                    />
                    <SummaryCard
                        icon={CircleDashed}
                        label="Courses in progress"
                        value={activeCourses}
                    />
                    <SummaryCard
                        icon={CheckCircle2}
                        label="Courses completed"
                        value={completedCourses}
                    />
                </section>

                <section className="mt-10">
                    <div className="mb-5">
                        <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                            Keep your momentum
                        </p>
                        <h2 className="mt-1.5 text-xl font-semibold text-slate-900">
                            Your enrolled courses
                        </h2>
                    </div>

                    {sortedCourses.length > 0 ? (
                        <div className="space-y-3">
                            {sortedCourses.map((course) => {
                                const isTrackable =
                                    course.settings?.track_progress &&
                                    course.lesson_count > 0;

                                return (
                                    <article
                                        key={course.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                                    >
                                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-slate-500">
                                                    {course.module?.title ??
                                                        'Learning course'}
                                                </p>
                                                <h3 className="mt-1 text-base font-semibold text-slate-900">
                                                    {course.title}
                                                </h3>
                                                {isTrackable ? (
                                                    <div className="mt-4 max-w-xl">
                                                        <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
                                                            <span>
                                                                {
                                                                    course.completed_count
                                                                }{' '}
                                                                of{' '}
                                                                {
                                                                    course.lesson_count
                                                                }{' '}
                                                                lessons
                                                            </span>
                                                            <span>
                                                                {
                                                                    course.progress
                                                                }
                                                                %
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="h-2 overflow-hidden rounded-full bg-slate-100"
                                                            role="progressbar"
                                                            aria-label={`${course.title} progress`}
                                                            aria-valuemin={0}
                                                            aria-valuemax={100}
                                                            aria-valuenow={
                                                                course.progress
                                                            }
                                                        >
                                                            <div
                                                                className="h-full rounded-full bg-emerald-700 transition-[width]"
                                                                style={{
                                                                    width: `${course.progress}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="mt-3 text-sm text-slate-500">
                                                        {course.lesson_count ===
                                                        0
                                                            ? 'Lessons are not available yet.'
                                                            : 'Progress tracking is not enabled for this course.'}
                                                    </p>
                                                )}
                                            </div>
                                            <Link
                                                href={`/courses/${course.slug}`}
                                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
                                            >
                                                Open course
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                            <BookOpenCheck className="mx-auto size-8 text-slate-400" />
                            <h3 className="mt-3 font-semibold text-slate-900">
                                Your progress starts with a course
                            </h3>
                            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                                Enroll in a course to see completed lessons and
                                track your learning here.
                            </p>
                            <Link
                                href="/courses"
                                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900"
                            >
                                <Compass className="size-4" />
                                Explore courses
                            </Link>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <Icon className="size-5" />
            </span>
            <div>
                <p className="text-2xl font-semibold tracking-tight text-slate-900">
                    {value}
                </p>
                <p className="text-sm text-slate-500">{label}</p>
            </div>
        </div>
    );
}
