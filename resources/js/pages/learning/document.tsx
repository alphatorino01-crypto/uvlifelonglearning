import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText, Video } from 'lucide-react';

type DocumentBlock =
    | { type: 'content'; content: string }
    | { type: 'divider' }
    | { type: 'image'; url: string }
    | { type: 'file'; title: string; url: string | null; is_video: boolean };

type Props = {
    course: { title: string; slug: string };
    document: {
        title: string;
        hidden_from_students: boolean;
        blocks: DocumentBlock[];
    };
};

export default function CourseDocumentPage({ course, document }: Props) {
    return (
        <>
            <Head title={`${document.title} · ${course.title}`} />
            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-7">
                <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft className="size-4" />
                    {course.title}
                </Link>
                <article className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-10">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        {document.title}
                    </h1>
                    <div className="mt-8 space-y-7">
                        {document.blocks.map((block, index) => {
                            if (block.type === 'divider') {
                                return (
                                    <hr
                                        key={`divider-${index}`}
                                        className="border-slate-200"
                                    />
                                );
                            }
                            if (block.type === 'image') {
                                return (
                                    <img
                                        key={`image-${index}`}
                                        src={block.url}
                                        alt=""
                                        className="max-h-[640px] w-full rounded-lg object-contain"
                                    />
                                );
                            }
                            if (block.type === 'file') {
                                return block.url ? (
                                    <a
                                        key={`file-${index}`}
                                        href={block.url}
                                        target={
                                            block.is_video
                                                ? '_blank'
                                                : undefined
                                        }
                                        rel={
                                            block.is_video
                                                ? 'noreferrer'
                                                : undefined
                                        }
                                        className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                                    >
                                        {block.is_video ? (
                                            <Video className="size-5 text-emerald-800" />
                                        ) : (
                                            <FileText className="size-5 text-emerald-800" />
                                        )}
                                        {block.title}
                                    </a>
                                ) : (
                                    <p
                                        key={`file-${index}`}
                                        className="text-sm text-slate-500"
                                    >
                                        {block.title} is no longer available.
                                    </p>
                                );
                            }
                            return (
                                <div
                                    key={`content-${index}`}
                                    className="text-[15px] leading-7 text-slate-700 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_ul]:list-disc"
                                    dangerouslySetInnerHTML={{
                                        __html: block.content,
                                    }}
                                />
                            );
                        })}
                    </div>
                </article>
            </main>
        </>
    );
}
