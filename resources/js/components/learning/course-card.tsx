import { Link } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, Clock3 } from 'lucide-react';
import type { Course } from '@/types/lms';

const palettes: Record<
    string,
    { surface: string; icon: string; accent: string }
> = {
    blue: {
        surface: 'from-emerald-50 to-green-100/70',
        icon: 'bg-emerald-100 text-emerald-800',
        accent: 'bg-emerald-800',
    },
    orange: {
        surface: 'from-emerald-50 to-green-100/70',
        icon: 'bg-emerald-100 text-emerald-800',
        accent: 'bg-emerald-800',
    },
    green: {
        surface: 'from-emerald-50 to-teal-100/70',
        icon: 'bg-emerald-100 text-emerald-700',
        accent: 'bg-emerald-800',
    },
    indigo: {
        surface: 'from-emerald-50 to-green-100/70',
        icon: 'bg-emerald-100 text-emerald-800',
        accent: 'bg-emerald-800',
    },
};

export function CourseCard({
    course,
    layout = 'grid',
}: {
    course: Course;
    layout?: 'grid' | 'list';
}) {
    const palette =
        palettes[course.module?.color ?? 'indigo'] ?? palettes.indigo;
    const isList = layout === 'list';

    return (
        <Link
            href={`/courses/${course.slug}`}
            className={`group flex overflow-hidden border border-slate-200 bg-white transition duration-200 hover:border-emerald-300 hover:shadow-md hover:shadow-slate-900/[0.04] ${
                isList ? 'min-h-28 flex-row items-stretch' : 'h-full flex-col'
            }`}
        >
            <div
                className={`relative flex shrink-0 items-end overflow-hidden bg-gradient-to-br ${palette.surface} ${
                    isList ? 'w-24 sm:w-40' : 'h-36 w-full p-5'
                }`}
            >
                {course.banner_url ? (
                    <img
                        src={course.banner_url}
                        alt=""
                        className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <>
                        <div
                            className={`relative z-10 flex size-11 items-center justify-center rounded-xl ${palette.icon}`}
                        >
                            <BookOpen className="size-5" />
                        </div>
                        <div
                            aria-hidden="true"
                            className="absolute -top-10 -right-7 size-36 rounded-full border-[22px] border-white/40"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute -right-0.5 -bottom-16 size-32 rounded-full bg-white/40"
                        />
                    </>
                )}
                {course.banner_url && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                )}
                <span className="absolute top-3 right-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
                    {course.level}
                </span>
            </div>
            <div
                className={`flex min-w-0 flex-1 flex-col ${
                    isList ? 'justify-center p-4 sm:p-5' : 'p-5'
                }`}
            >
                <p className="text-xs font-semibold tracking-wide text-slate-500">
                    {course.module?.title ?? 'Learning path'}
                </p>
                <h3 className="mt-1.5 text-base leading-snug font-semibold text-slate-900 group-hover:text-emerald-800">
                    {course.title}
                </h3>
                <p
                    className={`mt-2 text-sm leading-5 text-slate-500 ${
                        isList ? 'line-clamp-1 sm:line-clamp-2' : 'line-clamp-2'
                    }`}
                >
                    {course.summary}
                </p>
                <div
                    className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 ${
                        isList
                            ? 'sm:mt-4'
                            : 'justify-between border-t border-slate-100 pt-4'
                    }`}
                >
                    <span className="flex items-center gap-1.5">
                        <BookOpen className="size-3.5" />
                        {course.lesson_count} lessons
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock3 className="size-3.5" />
                        {course.duration_minutes} min
                    </span>
                </div>
                {course.progress > 0 ? (
                    <div className="mt-4">
                        <div className="mb-1.5 flex justify-between text-[11px] font-medium text-slate-500">
                            <span>
                                {course.completed_count} of{' '}
                                {course.lesson_count} lessons
                            </span>
                            <span>{course.progress}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={`h-full rounded-full ${palette.accent}`}
                                style={{ width: `${course.progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-800">
                        Open course
                        <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                )}
            </div>
        </Link>
    );
}
