import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, BookOpen, Clock3 } from 'lucide-react';
import { CourseCard } from '@/components/learning/course-card';
import type { Course } from '@/types/lms';

type Props = {
    module: {
        title: string;
        slug: string;
        description: string;
        color: string;
    };
    courses: Course[];
};

const accents: Record<string, string> = {
    blue: 'from-emerald-50 to-green-100',
    orange: 'from-emerald-50 to-green-100',
    green: 'from-emerald-50 to-teal-100',
    indigo: 'from-emerald-50 to-green-100',
};

export default function LearningModulePage({ module, courses }: Props) {
    const lessonCount = courses.reduce(
        (total, course) => total + course.lesson_count,
        0,
    );

    return (
        <>
            <Head title={module.title} />
            <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-7 lg:px-10">
                <Link
                    href="/modules"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                >
                    <ArrowLeft className="size-4" /> All modules
                </Link>
                <section
                    className={`relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br ${accents[module.color] ?? accents.indigo} p-7 sm:p-10`}
                >
                    <div
                        aria-hidden="true"
                        className="absolute -top-20 -right-5 size-64 rounded-full border-[40px] border-white/50"
                    />
                    <div className="relative max-w-2xl">
                        <p className="text-sm font-semibold text-slate-600">
                            Learning module
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            {module.title}
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                            {module.description}
                        </p>
                        <div className="mt-6 flex items-center gap-5 text-sm font-medium text-slate-600">
                            <span className="flex items-center gap-2">
                                <BookOpen className="size-4" />
                                {courses.length} courses
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock3 className="size-4" />
                                {lessonCount} lessons
                            </span>
                        </div>
                    </div>
                </section>
                <section className="mt-9">
                    <div className="mb-5">
                        <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                            Choose your next step
                        </p>
                        <h2 className="mt-1.5 text-xl font-semibold text-slate-900">
                            Courses in this module
                        </h2>
                    </div>
                    {courses.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {courses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                            Courses for this module are coming soon.
                        </p>
                    )}
                </section>
                <Link
                    href="/courses"
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900"
                >
                    Browse all courses <ArrowRight className="size-4" />
                </Link>
            </div>
        </>
    );
}
