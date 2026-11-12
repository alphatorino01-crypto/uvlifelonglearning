import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    Clock3,
    LockKeyhole,
    Timer,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lesson } from '@/types/lms';

type TimerState = 'resume' | 'heartbeat' | 'pause';
type TimerResponse = {
    remaining_seconds: number;
    completed: boolean;
};

type LessonDetail = Lesson & {
    content: string;
    video_url: string | null;
    started_at: string | null;
    remaining_seconds: number | null;
};

type Props = {
    auth: { user: { name: string } | null };
    course: {
        title: string;
        slug: string;
        effective_status: string;
        can_participate: boolean;
    };
    lesson: LessonDetail;
    previousLesson: Lesson | null;
    nextLesson: Lesson | null;
    lessons: Lesson[];
};

export default function LessonPage({
    course,
    lesson,
    previousLesson,
    nextLesson,
    lessons,
}: Props) {
    const { auth } = usePage<Props>().props;
    const [remainingSeconds, setRemainingSeconds] = useState(
        lesson.remaining_seconds,
    );
    const [pageFocused, setPageFocused] = useState(false);
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerError, setTimerError] = useState<string | null>(null);
    const autoSubmitted = useRef(false);
    const timerRequestQueue = useRef<Promise<void>>(Promise.resolve());
    const timerActive = useRef(false);
    const paragraphs = lesson.content.split(/\n{2,}/).filter(Boolean);
    const completeHref = `/lessons/${lesson.id}/complete`;
    const canTrack = Boolean(auth.user) && course.can_participate;

    const sendTimerState = useCallback(
        (state: TimerState, keepalive = false): Promise<void> => {
            const request = timerRequestQueue.current.then(async () => {
                const csrfToken = document.querySelector<HTMLMetaElement>(
                    'meta[name="csrf-token"]',
                )?.content;
                if (!csrfToken) {
                    throw new Error(
                        'The security token is missing. Refresh the page and try again.',
                    );
                }

                const response = await fetch(`/lessons/${lesson.id}/timer`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    keepalive,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({ state }),
                });
                if (!response.ok) {
                    throw new Error(
                        'Could not save focused lesson time. Refresh the page and try again.',
                    );
                }

                const result = (await response.json()) as TimerResponse;
                setRemainingSeconds(result.remaining_seconds);
                if (result.completed) setTimerRunning(false);
            });
            timerRequestQueue.current = request.catch(() => undefined);

            return request;
        },
        [lesson.id],
    );

    useEffect(() => {
        const updateFocus = () => {
            setPageFocused(
                document.visibilityState === 'visible' && document.hasFocus(),
            );
        };
        updateFocus();
        window.addEventListener('focus', updateFocus);
        window.addEventListener('blur', updateFocus);
        document.addEventListener('visibilitychange', updateFocus);

        return () => {
            window.removeEventListener('focus', updateFocus);
            window.removeEventListener('blur', updateFocus);
            document.removeEventListener('visibilitychange', updateFocus);
        };
    }, []);

    useEffect(() => {
        if (!canTrack || lesson.completed) {
            setTimerRunning(false);

            return;
        }

        if (!pageFocused) {
            setTimerRunning(false);
            if (timerActive.current) {
                timerActive.current = false;
                void sendTimerState('pause', true).catch((error: unknown) =>
                    setTimerError(
                        error instanceof Error
                            ? error.message
                            : 'Could not pause the lesson timer.',
                    ),
                );
            }

            return;
        }

        let disposed = false;
        let heartbeat: number | undefined;
        void sendTimerState('resume')
            .then(() => {
                if (disposed) {
                    return sendTimerState('pause', true);
                }
                timerActive.current = true;
                setTimerError(null);
                setTimerRunning(true);
                heartbeat = window.setInterval(() => {
                    void sendTimerState('heartbeat')
                        .then(() => {
                            setTimerError(null);
                            setTimerRunning(true);
                        })
                        .catch((error: unknown) => {
                            setTimerRunning(false);
                            setTimerError(
                                error instanceof Error
                                    ? error.message
                                    : 'Could not save focused lesson time.',
                            );
                        });
                }, 5000);
            })
            .catch((error: unknown) => {
                setTimerRunning(false);
                setTimerError(
                    error instanceof Error
                        ? error.message
                        : 'Could not resume the lesson timer.',
                );
            });

        return () => {
            disposed = true;
            if (heartbeat !== undefined) window.clearInterval(heartbeat);
            setTimerRunning(false);
            if (timerActive.current) {
                timerActive.current = false;
                void sendTimerState('pause', true).catch((error: unknown) =>
                    setTimerError(
                        error instanceof Error
                            ? error.message
                            : 'Could not pause the lesson timer.',
                    ),
                );
            }
        };
    }, [canTrack, lesson.completed, pageFocused, sendTimerState]);

    useEffect(() => {
        if (!timerRunning) return;

        const timer = window.setInterval(() => {
            setRemainingSeconds((seconds) =>
                seconds === null ? null : Math.max(0, seconds - 1),
            );
        }, 1000);

        return () => window.clearInterval(timer);
    }, [timerRunning]);

    useEffect(() => {
        if (
            !canTrack ||
            lesson.completed ||
            !timerRunning ||
            remainingSeconds !== 0 ||
            autoSubmitted.current
        )
            return;

        autoSubmitted.current = true;
        router.post(
            completeHref,
            { continue: false },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setTimerError(
                        errors.lesson ??
                            'Could not save your lesson progress. Please try again.',
                    );
                    setRemainingSeconds(1);
                    autoSubmitted.current = false;
                },
            },
        );
    }, [
        canTrack,
        completeHref,
        lesson.completed,
        remainingSeconds,
        timerRunning,
    ]);

    const formattedTime =
        remainingSeconds === null
            ? null
            : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

    return (
        <>
            <Head title={`${lesson.title} · ${course.title}`} />
            <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 lg:px-10">
                <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                >
                    <ArrowLeft className="size-4" /> {course.title}
                </Link>
                <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
                    <main className="min-w-0">
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                            <div className="relative flex aspect-[16/7] min-h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-[#123c2b] via-[#165536] to-[#207448]">
                                <div
                                    aria-hidden="true"
                                    className="absolute -top-24 -left-10 size-72 rounded-full border-[50px] border-white/[0.06]"
                                />
                                <div
                                    aria-hidden="true"
                                    className="absolute -right-12 -bottom-32 size-80 rounded-full border-[55px] border-emerald-100/[0.09]"
                                />
                                <div className="relative flex size-16 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-white backdrop-blur">
                                    <BookOpen className="size-8" />
                                </div>
                                <span className="absolute bottom-5 left-6 flex items-center gap-2 text-xs font-medium text-slate-300">
                                    <Clock3 className="size-3.5" />{' '}
                                    {lesson.duration_minutes} minute lesson
                                </span>
                            </div>
                            <article className="px-6 py-7 sm:px-9 sm:py-9">
                                <p className="text-sm font-semibold text-emerald-800">
                                    {course.title}
                                </p>
                                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                    {lesson.title}
                                </h1>
                                <p className="mt-3 text-base leading-7 text-slate-500">
                                    {lesson.summary}
                                </p>
                                <div className="my-7 h-px bg-slate-100" />
                                <div className="max-w-3xl space-y-5">
                                    {paragraphs.map((paragraph, index) => (
                                        <p
                                            key={index}
                                            className="text-[15px] leading-7 text-slate-700"
                                        >
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>

                                <div className="mt-9 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 sm:px-5">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`flex size-9 items-center justify-center rounded-xl ${lesson.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-400'}`}
                                        >
                                            <Check className="size-4" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {lesson.completed
                                                    ? 'Lesson completed'
                                                    : 'Lesson timer'}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {lesson.completed
                                                    ? 'Your progress has been saved.'
                                                    : canTrack
                                                      ? 'Your progress is saved automatically when the timer ends.'
                                                      : auth.user
                                                        ? 'This course is read-only. You can review lesson content.'
                                                        : 'Sign in to track lesson time and save your progress.'}
                                            </p>
                                        </div>
                                    </div>
                                    {lesson.completed ? (
                                        <span className="rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-800">
                                            Completed
                                        </span>
                                    ) : canTrack ? (
                                        <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-mono text-lg font-semibold text-slate-800 ring-1 ring-slate-200">
                                            <Timer className="size-4 text-emerald-800" />
                                            {formattedTime ?? '—:—'}
                                        </span>
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                                        >
                                            <LockKeyhole className="size-4" />{' '}
                                            Sign in to save progress
                                        </Link>
                                    )}
                                </div>
                                {timerError && (
                                    <p
                                        role="alert"
                                        className="mt-3 text-sm text-red-600"
                                    >
                                        {timerError}
                                    </p>
                                )}
                                <div className="mt-7 flex items-center justify-between gap-4">
                                    {previousLesson ? (
                                        <Link
                                            href={`/courses/${course.slug}/lessons/${previousLesson.slug}`}
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
                                        >
                                            <ArrowLeft className="size-4" />{' '}
                                            Previous
                                        </Link>
                                    ) : (
                                        <span />
                                    )}
                                    {nextLesson && !nextLesson.locked ? (
                                        <Link
                                            href={`/courses/${course.slug}/lessons/${nextLesson.slug}`}
                                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174b33] px-4 text-sm font-semibold text-white transition hover:bg-[#103b28]"
                                        >
                                            Next lesson{' '}
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    ) : nextLesson?.locked ? (
                                        <span className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-400">
                                            <LockKeyhole className="size-4" />
                                            Complete this lesson to unlock the
                                            next
                                        </span>
                                    ) : (
                                        <Link
                                            href={`/courses/${course.slug}`}
                                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174b33] px-4 text-sm font-semibold text-white transition hover:bg-[#103b28]"
                                        >
                                            Finish course{' '}
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    )}
                                </div>
                            </article>
                        </div>
                    </main>
                    <aside className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
                            Course content
                        </p>
                        <h2 className="mt-2 leading-6 font-semibold text-slate-900">
                            {course.title}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {lessons.filter((item) => item.completed).length} of{' '}
                            {lessons.length} lessons complete
                        </p>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-emerald-800"
                                style={{
                                    width: `${lessons.length ? Math.round((lessons.filter((item) => item.completed).length / lessons.length) * 100) : 0}%`,
                                }}
                            />
                        </div>
                        <div className="mt-4 divide-y divide-slate-100">
                            {lessons.map((item, index) => {
                                const active = item.id === lesson.id;
                                return (
                                    <Link
                                        key={item.id}
                                        href={`/courses/${course.slug}/lessons/${item.slug}`}
                                        className={`flex items-start gap-3 py-3.5 ${active ? 'text-emerald-800' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        <span
                                            className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${item.completed ? 'bg-emerald-100 text-emerald-800' : active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}
                                        >
                                            {item.completed ? (
                                                <Check className="size-3.5" />
                                            ) : (
                                                String(index + 1)
                                            )}
                                        </span>
                                        <span className="min-w-0">
                                            <span
                                                className={`block text-sm leading-5 ${active ? 'font-semibold' : 'font-medium'}`}
                                            >
                                                {item.title}
                                            </span>
                                            {item.locked && (
                                                <LockKeyhole className="mt-1 size-3.5 shrink-0 text-amber-600" />
                                            )}
                                            <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                                <Clock3 className="size-3" />
                                                {item.duration_minutes} min
                                            </span>
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}
