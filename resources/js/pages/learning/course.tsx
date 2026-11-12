import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    CirclePlay,
    Clock3,
    FileText,
    Play,
    Trash2,
    Upload,
    Video,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { Course, CourseSection, Lesson } from '@/types/lms';

type Props = {
    auth: { user: { name: string; role: string } | null };
    course: Course;
    lessons: Lesson[];
};

const colors: Record<
    string,
    { banner: string; icon: string; progress: string }
> = {
    blue: {
        banner: 'from-emerald-50 to-green-100',
        icon: 'bg-emerald-100 text-emerald-800',
        progress: 'bg-emerald-800',
    },
    orange: {
        banner: 'from-emerald-50 to-green-100',
        icon: 'bg-emerald-100 text-emerald-800',
        progress: 'bg-emerald-800',
    },
    green: {
        banner: 'from-emerald-50 to-teal-100',
        icon: 'bg-emerald-100 text-emerald-700',
        progress: 'bg-emerald-800',
    },
    indigo: {
        banner: 'from-emerald-50 to-green-100',
        icon: 'bg-emerald-100 text-emerald-800',
        progress: 'bg-emerald-800',
    },
};

export default function CoursePage({ course, lessons }: Props) {
    const { auth } = usePage<Props>().props;
    const isAdmin = auth.user?.role === 'admin';
    const canManage =
        (isAdmin || auth.user?.role === 'teacher') &&
        (!course.settings?.completed || isAdmin);
    const settingsForm = useForm(
        course.settings ?? {
            access_status: 'open' as const,
            duration_mode: 'ongoing' as const,
            starts_at: null,
            ends_at: null,
            completed: false,
            track_progress: true,
            participatory_auto_complete: true,
            show_class_roster: true,
            allow_messages: true,
            students_can_message_course_members: true,
            allow_virtual_classroom: true,
            hide_inactive_students: false,
            mastery_instructors_visible: true,
            mastery_students_visible: true,
        },
    );
    const palette = colors[course.module?.color ?? 'indigo'] ?? colors.indigo;
    const firstUnfinished =
        lessons.find((lesson) => !lesson.completed) ?? lessons[0];
    const nextHref = firstUnfinished
        ? `/courses/${course.slug}/lessons/${firstUnfinished.slug}`
        : '/courses';
    const fileInput = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonSummary, setLessonSummary] = useState('');
    const [lessonContent, setLessonContent] = useState('');
    const [lessonDuration, setLessonDuration] = useState('10');
    const [lessonError, setLessonError] = useState<string | null>(null);
    const [savingLesson, setSavingLesson] = useState(false);
    const [sectionTitle, setSectionTitle] = useState('');
    const [sectionDescription, setSectionDescription] = useState('');
    const [sectionBanner, setSectionBanner] = useState<File | null>(null);
    const [sectionError, setSectionError] = useState<string | null>(null);
    const [savingSection, setSavingSection] = useState(false);
    const [lessonSectionId, setLessonSectionId] = useState('');
    const sections = course.sections ?? [];

    function uploadMaterial(file: File | undefined) {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        setUploadError(null);
        router.post(`/courses/${course.slug}/materials`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) =>
                setUploadError(
                    errors.file ?? 'Upload failed. Please try again.',
                ),
            onFinish: () => {
                setUploading(false);
                if (fileInput.current) fileInput.current.value = '';
            },
        });
    }

    function updatePrerequisite(lesson: Lesson) {
        router.patch(
            `/lessons/${lesson.id}/prerequisite`,
            { requires_completion: !lesson.requires_completion },
            { preserveScroll: true },
        );
    }

    function removeMaterial(materialId: number) {
        if (window.confirm('Remove this course material?')) {
            router.delete(`/materials/${materialId}`, { preserveScroll: true });
        }
    }

    function addLesson(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSavingLesson(true);
        setLessonError(null);
        router.post(
            `/courses/${course.slug}/lessons`,
            {
                title: lessonTitle,
                summary: lessonSummary,
                content: lessonContent,
                duration_minutes: lessonDuration,
                course_section_id: lessonSectionId || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLessonTitle('');
                    setLessonSummary('');
                    setLessonContent('');
                    setLessonDuration('10');
                },
                onError: (errors) =>
                    setLessonError(
                        errors.title ??
                            errors.summary ??
                            errors.content ??
                            errors.duration_minutes ??
                            'Could not add the lesson. Please try again.',
                    ),
                onFinish: () => setSavingLesson(false),
            },
        );
    }

    function addSection(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData();
        formData.append('title', sectionTitle);
        formData.append('description', sectionDescription);
        if (sectionBanner) formData.append('banner', sectionBanner);
        setSavingSection(true);
        setSectionError(null);
        router.post(`/courses/${course.id}/sections`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSectionTitle('');
                setSectionDescription('');
                setSectionBanner(null);
            },
            onError: (errors) =>
                setSectionError(
                    errors.title ??
                        errors.banner ??
                        errors.description ??
                        'Could not create the course module.',
                ),
            onFinish: () => setSavingSection(false),
        });
    }

    function saveCourseSettings(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        settingsForm.patch(`/admin/courses/${course.id}/settings`, {
            preserveScroll: true,
        });
    }

    function settingToggle(
        key:
            | 'track_progress'
            | 'participatory_auto_complete'
            | 'show_class_roster'
            | 'allow_messages'
            | 'students_can_message_course_members'
            | 'allow_virtual_classroom'
            | 'hide_inactive_students'
            | 'mastery_instructors_visible'
            | 'mastery_students_visible',
        label: string,
        description?: string,
    ) {
        return (
            <label
                key={key}
                className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
            >
                <input
                    type="checkbox"
                    checked={settingsForm.data[key]}
                    onChange={(event) =>
                        settingsForm.setData(key, event.target.checked)
                    }
                    className="mt-0.5 size-4 rounded border-slate-300 accent-emerald-800"
                />
                <span>
                    <span className="block text-sm font-medium text-slate-800">
                        {label}
                    </span>
                    {description && (
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                            {description}
                        </span>
                    )}
                </span>
            </label>
        );
    }

    return (
        <>
            <Head title={course.title} />
            <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-7 lg:px-10">
                <Link
                    href={
                        course.module
                            ? `/modules/${course.module.slug}`
                            : '/courses'
                    }
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                >
                    <ArrowLeft className="size-4" />{' '}
                    {course.module?.title ?? 'All courses'}
                </Link>
                <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)]">
                    <section
                        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${palette.banner} p-7 sm:p-10`}
                    >
                        {course.banner_url && (
                            <img
                                src={course.banner_url}
                                alt=""
                                className="absolute inset-0 size-full object-cover opacity-20"
                            />
                        )}
                        <div
                            aria-hidden="true"
                            className="absolute -top-16 -right-8 size-64 rounded-full border-[40px] border-white/50"
                        />
                        <div className="relative max-w-2xl">
                            <span className="text-sm font-semibold text-slate-600">
                                {course.effective_status === 'complete'
                                    ? 'Course complete'
                                    : course.effective_status === 'closed'
                                      ? 'Course closed'
                                      : (course.module?.title ?? 'Course')}
                            </span>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                                {course.title}
                            </h1>
                            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                                {course.summary}
                            </p>
                            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                                <span className="font-medium text-slate-800">
                                    {course.teacher ?? course.instructor}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="size-4" />
                                    {course.lesson_count} lessons
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock3 className="size-4" />
                                    {course.duration_minutes} min
                                </span>
                                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
                                    {course.level}
                                </span>
                            </div>
                            {course.can_access_content ? (
                                course.can_participate ? (
                                    <Link
                                        href={nextHref}
                                        className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        <Play className="size-4 fill-current" />
                                        {course.progress > 0
                                            ? 'Continue course'
                                            : 'Start course'}
                                        <ArrowRight className="ml-1 size-4" />
                                    </Link>
                                ) : (
                                    <span className="mt-7 inline-flex h-11 items-center rounded-xl bg-slate-200 px-5 text-sm font-semibold text-slate-600">
                                        Review completed course
                                    </span>
                                )
                            ) : (
                                <span className="mt-7 inline-flex items-center rounded-xl bg-white/70 px-4 py-3 text-sm font-medium text-slate-700">
                                    {course.access_message}
                                </span>
                            )}
                        </div>
                    </section>
                    <aside className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
                        <div>
                            <p className="text-sm font-semibold text-slate-500">
                                {course.settings?.track_progress
                                    ? 'Your progress'
                                    : 'Progress tracking is off'}
                            </p>
                            {course.settings?.track_progress &&
                                course.can_access_content && (
                                    <>
                                        <div className="mt-4 flex items-end gap-2">
                                            <span className="text-4xl font-semibold tracking-tight text-slate-900">
                                                {course.progress}%
                                            </span>
                                            <span className="pb-1 text-sm text-slate-500">
                                                complete
                                            </span>
                                        </div>
                                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={`h-full rounded-full transition-all ${palette.progress}`}
                                                style={{
                                                    width: `${course.progress}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="mt-3 text-sm text-slate-500">
                                            {course.completed_count} of{' '}
                                            {course.lesson_count} lessons
                                            completed
                                        </p>
                                    </>
                                )}
                        </div>
                        <div className="mt-7 rounded-2xl bg-slate-50 p-4">
                            <div className="flex items-start gap-3">
                                <span
                                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${palette.icon}`}
                                >
                                    <CirclePlay className="size-4" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        Learn at your own pace
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {auth.user
                                            ? 'Your progress is saved as you complete each lesson.'
                                            : 'Sign in to save your progress as you complete each lesson.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                {isAdmin && (
                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-7">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                                    Administrator controls
                                </p>
                                <h2 className="mt-1.5 text-xl font-semibold text-slate-900">
                                    Course settings
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Control enrollment access, duration,
                                    participation, and course tools.
                                </p>
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${course.effective_status === 'open' ? 'bg-emerald-50 text-emerald-800' : course.effective_status === 'complete' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-800'}`}
                            >
                                Course status: {course.effective_status}
                            </span>
                        </div>

                        <form
                            onSubmit={saveCourseSettings}
                            className="mt-6 space-y-7"
                        >
                            <fieldset className="space-y-4">
                                <legend className="text-sm font-semibold text-slate-900">
                                    Course access
                                </legend>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Access override
                                        <select
                                            value={
                                                settingsForm.data.access_status
                                            }
                                            onChange={(event) =>
                                                settingsForm.setData(
                                                    'access_status',
                                                    event.target.value as
                                                        | 'open'
                                                        | 'closed',
                                                )
                                            }
                                            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                        >
                                            <option value="open">
                                                Open to enrolled students
                                            </option>
                                            <option value="closed">
                                                Closed — block student course
                                                content
                                            </option>
                                        </select>
                                    </label>
                                    <label className="text-sm font-medium text-slate-700">
                                        Course duration
                                        <select
                                            value={
                                                settingsForm.data.duration_mode
                                            }
                                            onChange={(event) =>
                                                settingsForm.setData(
                                                    'duration_mode',
                                                    event.target.value as
                                                        | 'ongoing'
                                                        | 'fixed',
                                                )
                                            }
                                            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                        >
                                            <option value="ongoing">
                                                Ongoing — no fixed end date
                                            </option>
                                            <option value="fixed">
                                                Fixed start and end dates
                                            </option>
                                        </select>
                                    </label>
                                    {settingsForm.data.duration_mode ===
                                        'fixed' && (
                                        <>
                                            <label className="text-sm font-medium text-slate-700">
                                                Starts at
                                                <input
                                                    required
                                                    type="datetime-local"
                                                    value={
                                                        settingsForm.data
                                                            .starts_at ?? ''
                                                    }
                                                    onChange={(event) =>
                                                        settingsForm.setData(
                                                            'starts_at',
                                                            event.target
                                                                .value || null,
                                                        )
                                                    }
                                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                                />
                                                {settingsForm.errors
                                                    .starts_at && (
                                                    <span className="mt-1 block text-xs text-red-600">
                                                        {
                                                            settingsForm.errors
                                                                .starts_at
                                                        }
                                                    </span>
                                                )}
                                            </label>
                                            <label className="text-sm font-medium text-slate-700">
                                                Ends at
                                                <input
                                                    required
                                                    type="datetime-local"
                                                    value={
                                                        settingsForm.data
                                                            .ends_at ?? ''
                                                    }
                                                    onChange={(event) =>
                                                        settingsForm.setData(
                                                            'ends_at',
                                                            event.target
                                                                .value || null,
                                                        )
                                                    }
                                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                                />
                                                {settingsForm.errors
                                                    .ends_at && (
                                                    <span className="mt-1 block text-xs text-red-600">
                                                        {
                                                            settingsForm.errors
                                                                .ends_at
                                                        }
                                                    </span>
                                                )}
                                            </label>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs leading-5 text-slate-500">
                                    Students must be enrolled by an
                                    administrator. Course status follows its
                                    duration unless you explicitly close it.
                                </p>
                            </fieldset>

                            <fieldset className="space-y-3">
                                <legend className="text-sm font-semibold text-slate-900">
                                    Progress tracking
                                </legend>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {settingToggle(
                                        'track_progress',
                                        'Track student progress',
                                        'Save and display lesson progress for enrolled students.',
                                    )}
                                    {settingToggle(
                                        'participatory_auto_complete',
                                        'Automatically complete participatory items',
                                        'Designed for submissions or discussion contributions when those tools are enabled.',
                                    )}
                                </div>
                            </fieldset>

                            <fieldset className="space-y-3">
                                <legend className="text-sm font-semibold text-slate-900">
                                    Course tools
                                </legend>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {settingToggle(
                                        'show_class_roster',
                                        'Show class roster',
                                        'Allow students to view the course roster.',
                                    )}
                                    {settingToggle(
                                        'allow_messages',
                                        'Allow course messages',
                                        'When disabled, course messages should be sent by email only. Messaging is not enabled in this LMS yet.',
                                    )}
                                    {settingsForm.data.allow_messages &&
                                        settingToggle(
                                            'students_can_message_course_members',
                                            'Students can message anyone in their course',
                                        )}
                                    {settingToggle(
                                        'allow_virtual_classroom',
                                        'Allow Class Collaborate',
                                        'Enable access for all course users. Virtual classroom integration is not configured yet.',
                                    )}
                                </div>
                            </fieldset>

                            <fieldset className="space-y-3">
                                <legend className="text-sm font-semibold text-slate-900">
                                    Students visibility
                                </legend>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {settingToggle(
                                        'hide_inactive_students',
                                        'Hide inactive students from the gradebook',
                                    )}
                                    {settingToggle(
                                        'mastery_instructors_visible',
                                        'Show mastery goal tab to instructors',
                                    )}
                                    {settingToggle(
                                        'mastery_students_visible',
                                        'Show mastery goal tab to students',
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">
                                    Gradebook and mastery tabs are not enabled
                                    in this LMS yet; these preferences are saved
                                    for the course.
                                </p>
                            </fieldset>

                            <fieldset className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={settingsForm.data.completed}
                                        onChange={(event) =>
                                            settingsForm.setData(
                                                'completed',
                                                event.target.checked,
                                            )
                                        }
                                        className="mt-0.5 size-4 rounded border-slate-300 accent-emerald-800"
                                    />
                                    <span>
                                        <span className="block text-sm font-semibold text-slate-900">
                                            Mark course complete
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-slate-600">
                                            Students cannot participate and
                                            instructors cannot change course
                                            content. Administrators can still
                                            manage this course.
                                        </span>
                                    </span>
                                </label>
                            </fieldset>

                            {Object.keys(settingsForm.errors).length > 0 && (
                                <p
                                    role="alert"
                                    className="text-sm text-red-600"
                                >
                                    {Object.values(settingsForm.errors).join(
                                        ' ',
                                    )}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={settingsForm.processing}
                                className="inline-flex h-10 items-center rounded-xl bg-[#174b33] px-5 text-sm font-semibold text-white hover:bg-[#103b28] disabled:opacity-60"
                            >
                                {settingsForm.processing
                                    ? 'Saving settings…'
                                    : 'Save course settings'}
                            </button>
                        </form>
                    </section>
                )}

                {!course.can_access_content && (
                    <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                        <h2 className="font-semibold text-amber-950">
                            {course.effective_status === 'closed'
                                ? 'Course is closed'
                                : 'Enrollment required'}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-amber-900/80">
                            {course.access_message}
                        </p>
                        {!auth.user && (
                            <Link
                                href="/login"
                                className="mt-3 inline-flex text-sm font-semibold text-emerald-900 underline"
                            >
                                Sign in
                            </Link>
                        )}
                    </section>
                )}

                <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                                Organize course content
                            </p>
                            <h2 className="mt-1.5 text-xl font-semibold text-slate-900">
                                Course modules
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Group lessons into modules and add a banner to
                                each module.
                            </p>
                        </div>
                        <span className="text-sm text-slate-500">
                            {sections.length} modules
                        </span>
                    </div>
                    {sections.length > 0 && (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {sections.map((section: CourseSection) => (
                                <article
                                    key={section.id}
                                    className="overflow-hidden rounded-xl border border-slate-200"
                                >
                                    {section.banner_url ? (
                                        <img
                                            src={section.banner_url}
                                            alt=""
                                            className="h-32 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-24 items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
                                            <BookOpen className="size-7 text-emerald-800" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-slate-900">
                                            {section.title}
                                        </h3>
                                        {section.description && (
                                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                                {section.description}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs font-medium text-emerald-800">
                                            {section.lesson_count} lessons
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    {canManage && (
                        <form
                            onSubmit={addSection}
                            className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2"
                        >
                            <label className="text-sm font-medium text-slate-700">
                                Module title
                                <input
                                    required
                                    maxLength={150}
                                    value={sectionTitle}
                                    onChange={(event) =>
                                        setSectionTitle(event.target.value)
                                    }
                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700"
                                    placeholder="e.g. Getting started"
                                />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                                Module banner (optional)
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setSectionBanner(
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                Module description
                                <textarea
                                    maxLength={2000}
                                    value={sectionDescription}
                                    onChange={(event) =>
                                        setSectionDescription(
                                            event.target.value,
                                        )
                                    }
                                    className="mt-1.5 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-700"
                                    placeholder="What will learners cover in this module?"
                                />
                            </label>
                            {sectionError && (
                                <p
                                    role="alert"
                                    className="text-sm text-red-600 sm:col-span-2"
                                >
                                    {sectionError}
                                </p>
                            )}
                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    disabled={savingSection}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174b33] px-4 text-sm font-semibold text-white hover:bg-[#103b28] disabled:opacity-60"
                                >
                                    <BookOpen className="size-4" />
                                    {savingSection
                                        ? 'Creating module…'
                                        : 'Create course module'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                <section className="mt-10 pb-8">
                    <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                                Your course, step by step
                            </p>
                            <h2 className="mt-1.5 text-xl font-semibold text-slate-900">
                                Course content
                            </h2>
                        </div>
                        <span className="text-sm text-slate-500">
                            {lessons.length} lessons · {course.duration_minutes}{' '}
                            min
                        </span>
                    </div>
                    {lessons.length > 0 ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            {lessons.map((lesson, index) => (
                                <div
                                    key={lesson.id}
                                    className="border-b border-slate-100 last:border-b-0"
                                >
                                    <Link
                                        href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                                        onClick={(event) => {
                                            if (lesson.locked)
                                                event.preventDefault();
                                        }}
                                        aria-disabled={lesson.locked}
                                        className={`group flex items-center gap-4 p-4 sm:p-5 ${lesson.locked ? 'cursor-not-allowed opacity-55' : ''}`}
                                    >
                                        <span
                                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${lesson.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
                                        >
                                            {lesson.completed ? (
                                                <Check className="size-4" />
                                            ) : (
                                                <span className="text-sm font-semibold">
                                                    {String(index + 1).padStart(
                                                        2,
                                                        '0',
                                                    )}
                                                </span>
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-semibold text-slate-900 transition group-hover:text-emerald-800">
                                                {lesson.title}
                                            </span>
                                            <span className="mt-1 block text-sm leading-5 text-slate-500">
                                                {lesson.summary}
                                            </span>
                                            {lesson.course_section_id && (
                                                <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                                    {
                                                        sections.find(
                                                            (section) =>
                                                                section.id ===
                                                                lesson.course_section_id,
                                                        )?.title
                                                    }
                                                </span>
                                            )}
                                        </span>
                                        <span className="hidden shrink-0 items-center gap-1.5 text-xs text-slate-500 sm:flex">
                                            <Clock3 className="size-3.5" />
                                            {lesson.duration_minutes} min
                                        </span>
                                        <ArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-800" />
                                    </Link>
                                    {canManage &&
                                        index < lessons.length - 1 && (
                                            <label className="flex items-center gap-2 px-5 pb-4 text-xs text-slate-500 sm:pl-[4.75rem]">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        lesson.requires_completion
                                                    }
                                                    onChange={() =>
                                                        updatePrerequisite(
                                                            lesson,
                                                        )
                                                    }
                                                    className="size-4 rounded border-slate-300 accent-emerald-800"
                                                />
                                                Require this lesson before
                                                unlocking the next
                                            </label>
                                        )}
                                    {lesson.locked && (
                                        <p className="px-5 pb-4 text-xs font-medium text-amber-700 sm:pl-[4.75rem]">
                                            Complete the previous required
                                            lesson to unlock this one.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                            Lessons for this course are coming soon.
                        </p>
                    )}
                </section>

                <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                                Keep everything in one place
                            </p>
                            <h2 className="mt-1.5 text-xl font-semibold text-slate-900">
                                Course materials
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Videos and documents shared with learners in
                                this course.
                            </p>
                        </div>
                        {canManage && (
                            <div>
                                <input
                                    ref={fileInput}
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                                    className="sr-only"
                                    onChange={(event) =>
                                        uploadMaterial(event.target.files?.[0])
                                    }
                                />
                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={() => fileInput.current?.click()}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                >
                                    <Upload className="size-4" />
                                    {uploading
                                        ? 'Uploading…'
                                        : 'Upload material'}
                                </button>
                            </div>
                        )}
                    </div>
                    {uploadError && (
                        <p role="alert" className="mt-4 text-sm text-red-600">
                            {uploadError}
                        </p>
                    )}
                    {course.materials.length > 0 ? (
                        <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100">
                            {course.materials.map((material) => (
                                <div
                                    key={material.id}
                                    className="flex items-center gap-3 p-4"
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                                        {material.is_video ? (
                                            <Video className="size-5" />
                                        ) : (
                                            <FileText className="size-5" />
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <a
                                            href={material.download_url}
                                            target={
                                                material.is_video
                                                    ? '_blank'
                                                    : undefined
                                            }
                                            rel={
                                                material.is_video
                                                    ? 'noreferrer'
                                                    : undefined
                                            }
                                            className="block truncate text-sm font-semibold text-slate-800 hover:text-emerald-800"
                                        >
                                            {material.title}
                                        </a>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {material.is_video
                                                ? 'Video'
                                                : 'Document'}{' '}
                                            ·{' '}
                                            {material.size < 1024 * 1024
                                                ? `${Math.max(1, Math.round(material.size / 1024))} KB`
                                                : `${(material.size / (1024 * 1024)).toFixed(1)} MB`}
                                        </p>
                                    </div>
                                    {canManage && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeMaterial(material.id)
                                            }
                                            aria-label={`Remove ${material.title}`}
                                            className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                            No materials have been added to this course yet.
                        </p>
                    )}
                    {canManage && (
                        <p className="mt-3 text-xs text-slate-400">
                            MP4, WebM, MOV, AVI, PDF, Word, PowerPoint, Excel,
                            and TXT files up to 200 MB.
                        </p>
                    )}
                </section>

                {canManage && (
                    <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                                Build this course
                            </p>
                            <h2 className="mt-1.5 text-xl font-semibold text-slate-900">
                                Add a lesson
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                New lessons are added to the end of the course
                                outline.
                            </p>
                        </div>
                        <form
                            onSubmit={addLesson}
                            className="mt-5 grid gap-4 md:grid-cols-2"
                        >
                            {sections.length > 0 && (
                                <label className="text-sm font-medium text-slate-700">
                                    Course module
                                    <select
                                        value={lessonSectionId}
                                        onChange={(event) =>
                                            setLessonSectionId(
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700"
                                    >
                                        <option value="">No module</option>
                                        {sections.map((section) => (
                                            <option
                                                key={section.id}
                                                value={section.id}
                                            >
                                                {section.title}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            <label className="text-sm font-medium text-slate-700">
                                Lesson title
                                <input
                                    required
                                    maxLength={150}
                                    value={lessonTitle}
                                    onChange={(event) =>
                                        setLessonTitle(event.target.value)
                                    }
                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                                />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                                Estimated duration (minutes)
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="600"
                                    value={lessonDuration}
                                    onChange={(event) =>
                                        setLessonDuration(event.target.value)
                                    }
                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                                />
                            </label>
                            <label className="text-sm font-medium text-slate-700 md:col-span-2">
                                Lesson introduction
                                <textarea
                                    required
                                    maxLength={1000}
                                    value={lessonSummary}
                                    onChange={(event) =>
                                        setLessonSummary(event.target.value)
                                    }
                                    className="mt-1.5 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                                />
                            </label>
                            <label className="text-sm font-medium text-slate-700 md:col-span-2">
                                Lesson content
                                <textarea
                                    required
                                    maxLength={50000}
                                    value={lessonContent}
                                    onChange={(event) =>
                                        setLessonContent(event.target.value)
                                    }
                                    className="mt-1.5 min-h-40 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                                />
                            </label>
                            {lessonError && (
                                <p
                                    role="alert"
                                    className="text-sm text-red-600 md:col-span-2"
                                >
                                    {lessonError}
                                </p>
                            )}
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={savingLesson}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174b33] px-4 text-sm font-semibold text-white transition hover:bg-[#103b28] disabled:opacity-60"
                                >
                                    <BookOpen className="size-4" />
                                    {savingLesson
                                        ? 'Adding lesson…'
                                        : 'Add lesson'}
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </div>
        </>
    );
}
