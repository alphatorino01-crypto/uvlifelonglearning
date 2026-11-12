export type LearningModule = {
    id: number;
    title: string;
    slug: string;
    description: string;
    color: string;
    course_count: number;
    lesson_count: number;
};

export type Course = {
    id: number;
    title: string;
    slug: string;
    summary: string;
    instructor: string;
    level: string;
    duration_minutes: number;
    lesson_count: number;
    completed_count: number;
    progress: number;
    materials: CourseMaterial[];
    banner_url?: string | null;
    teacher?: string | null;
    sections?: CourseSection[];
    can_access_content?: boolean;
    can_participate?: boolean;
    access_message?: string;
    effective_status?: 'open' | 'closed' | 'complete';
    settings?: CourseSettings;
    module: {
        title: string;
        slug: string;
        color: string;
    } | null;
};

export type CourseSettings = {
    access_status: 'open' | 'closed';
    duration_mode: 'ongoing' | 'fixed';
    starts_at: string | null;
    ends_at: string | null;
    completed: boolean;
    track_progress: boolean;
    participatory_auto_complete: boolean;
    show_class_roster: boolean;
    allow_messages: boolean;
    students_can_message_course_members: boolean;
    allow_virtual_classroom: boolean;
    hide_inactive_students: boolean;
    mastery_instructors_visible: boolean;
    mastery_students_visible: boolean;
};

export type Lesson = {
    id: number;
    title: string;
    slug: string;
    summary: string;
    duration_minutes: number;
    completed: boolean;
    requires_completion: boolean;
    locked: boolean;
    course_section_id?: number | null;
};

export type CourseSection = {
    id: number;
    title: string;
    description: string | null;
    banner_url: string | null;
    lesson_count: number;
};

export type CourseMaterial = {
    id: number;
    title: string;
    mime_type: string;
    size: number;
    is_video: boolean;
    download_url: string;
};
