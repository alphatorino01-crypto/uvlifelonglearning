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

export function CourseCard({ course }: { course: Course }) {
    const palette =
        palettes[course.module?.color ?? 'indigo'] ?? palettes.indigo;

    return (
        <Link
            href={`/courses/${course.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60"
        >
            <div
                className={`relative flex h-36 items-end overflow-hidden bg-gradient-to-br ${palette.surface} p-5`}
            >
                <div
                    className={`flex size-11 items-center justify-center rounded-xl ${palette.icon}`}
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
                <span className="absolute top-4 right-4 rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    {course.level}
                </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-semibold tracking-wide text-slate-500">
                    {course.module?.title ?? 'Learning path'}
                </p>
                <h3 className="mt-2 text-base leading-snug font-semibold text-slate-900 group-hover:text-emerald-800">
                    {course.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {course.summary}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
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
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs font-medium text-slate-600">
                            Explore course
                        </span>
                        <ArrowUpRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-800" />
                    </div>
                )}
            </div>
        </Link>
    );
}
