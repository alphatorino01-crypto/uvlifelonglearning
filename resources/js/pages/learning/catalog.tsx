import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, Clock3, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CourseCard } from '@/components/learning/course-card';
import type { Course, LearningModule } from '@/types/lms';

type Props = {
    mode: 'modules' | 'courses';
    modules: LearningModule[];
    courses: Course[];
};

const colors: Record<string, string> = {
    blue: 'bg-emerald-100 text-emerald-800',
    orange: 'bg-emerald-100 text-emerald-800',
    green: 'bg-emerald-100 text-emerald-700',
    indigo: 'bg-emerald-100 text-emerald-800',
};

export default function Catalog({ mode, modules, courses }: Props) {
    const [search, setSearch] = useState('');
    const filteredModules = useMemo(() => {
        const query = search.trim().toLowerCase();
        return query
            ? modules.filter((module) =>
                  `${module.title} ${module.description}`
                      .toLowerCase()
                      .includes(query),
              )
            : modules;
    }, [modules, search]);
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
            <Head
                title={
                    mode === 'modules' ? 'Learning modules' : 'Explore courses'
                }
            />
            <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-[1440px] px-4 py-8 sm:px-7 lg:px-10">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-emerald-800">
                            Your learning library
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                            {mode === 'modules'
                                ? 'Learning modules'
                                : 'Explore courses'}
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                            {mode === 'modules'
                                ? 'Choose a learning path and discover practical courses to help you grow.'
                                : 'Find a short, practical course that fits your interests and your schedule.'}
                        </p>
                    </div>
                    <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 shadow-sm sm:w-72">
                        <Search className="size-4 shrink-0" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={`Search ${mode}`}
                            className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                        />
                    </label>
                </div>

                {mode === 'modules' ? (
                    filteredModules.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredModules.map((module, index) => (
                                <Link
                                    key={module.id}
                                    href={`/modules/${module.slug}`}
                                    className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
                                >
                                    <div className="flex items-start justify-between">
                                        <span
                                            className={`flex size-11 items-center justify-center rounded-xl text-sm font-semibold ${colors[module.color] ?? colors.indigo}`}
                                        >
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-800" />
                                    </div>
                                    <h2 className="mt-6 text-lg font-semibold text-slate-900 group-hover:text-emerald-800">
                                        {module.title}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {module.description}
                                    </p>
                                    <div className="mt-5 flex items-center gap-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <BookOpen className="size-3.5 text-emerald-800" />
                                            {module.course_count} courses
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock3 className="size-3.5" />
                                            {module.lesson_count} lessons
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                            No modules matched your search.
                        </p>
                    )
                ) : filteredCourses.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredCourses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                        No courses matched your search.
                    </p>
                )}
            </div>
        </>
    );
}
