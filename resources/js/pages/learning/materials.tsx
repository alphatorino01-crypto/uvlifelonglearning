import { Head, Link } from '@inertiajs/react';
import { ArrowDownToLine, BookOpen, FileText, Video } from 'lucide-react';
import type { CourseMaterial } from '@/types/lms';

type Props = {
    materials: CourseMaterial[];
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LearningMaterials({ materials }: Props) {
    return (
        <>
            <Head title="Study materials" />
            <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-[1440px] px-4 py-8 sm:px-7 lg:px-10">
                <header className="mb-8">
                    <p className="text-sm font-medium text-emerald-800">
                        Your course resources
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                        Study materials
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        Find and download files shared with your courses, all in
                        one place.
                    </p>
                </header>

                {materials.length > 0 ? (
                    <section
                        aria-label="Available study materials"
                        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    >
                        {materials.map((material) => (
                            <article
                                key={material.id}
                                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                                        {material.is_video ? (
                                            <Video className="size-5" />
                                        ) : (
                                            <FileText className="size-5" />
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="truncate font-semibold text-slate-900">
                                            {material.title}
                                        </h2>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {material.mime_type}
                                            <span aria-hidden="true"> · </span>
                                            {formatFileSize(material.size)}
                                        </p>
                                    </div>
                                </div>

                                {material.course && (
                                    <Link
                                        href={`/courses/${material.course.slug}`}
                                        className="mt-5 inline-flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-medium text-slate-600 transition hover:text-emerald-800"
                                    >
                                        <BookOpen className="size-4 shrink-0" />
                                        <span className="truncate">
                                            {material.course.title}
                                        </span>
                                    </Link>
                                )}

                                <a
                                    href={material.download_url}
                                    download
                                    className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900"
                                >
                                    <ArrowDownToLine className="size-4" />
                                    {material.is_video
                                        ? 'Open video'
                                        : 'Download'}
                                </a>
                            </article>
                        ))}
                    </section>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                        <FileText className="mx-auto size-8 text-slate-400" />
                        <h2 className="mt-3 font-semibold text-slate-900">
                            No study materials yet
                        </h2>
                        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                            Materials shared by your instructors will appear
                            here. Browse your courses to get started.
                        </p>
                        <Link
                            href="/courses"
                            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900"
                        >
                            <BookOpen className="size-4" />
                            Explore courses
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
