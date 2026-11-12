import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowRight,
    BookOpen,
    Bold,
    Check,
    ChevronDown,
    ChevronUp,
    CirclePlay,
    Clock3,
    Eraser,
    Ellipsis,
    EyeOff,
    FileText,
    Image as ImageIcon,
    Italic,
    Link2,
    List,
    ListOrdered,
    GripVertical,
    Minus,
    Play,
    Plus,
    Redo2,
    Save,
    Search,
    Settings2,
    Table2,
    Trash2,
    Underline,
    Undo2,
    Upload,
    Video,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Course, CourseSection, Lesson } from '@/types/lms';

type DocumentBlock = {
    id: number;
    type: 'content' | 'divider' | 'image' | 'file';
    content?: string;
    file?: File;
    previewUrl?: string;
};

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onInsertImage: (file: File) => void;
    onInsertFile: (file: File) => void;
};

function RichTextEditor({
    value,
    onChange,
    onInsertImage,
    onInsertFile,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const selectionRef = useRef<Range | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    function saveSelection() {
        const editor = editorRef.current;
        const selection = window.getSelection();
        if (
            editor &&
            selection?.rangeCount &&
            editor.contains(selection.getRangeAt(0).commonAncestorContainer)
        ) {
            selectionRef.current = selection.getRangeAt(0).cloneRange();
        }
    }

    function restoreSelection() {
        const editor = editorRef.current;
        const selection = window.getSelection();
        if (editor && selectionRef.current) {
            editor.focus();
            selection?.removeAllRanges();
            selection?.addRange(selectionRef.current);
        }
    }

    function command(name: string, commandValue?: string) {
        restoreSelection();
        window.document.execCommand(name, false, commandValue);
        saveSelection();
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    }

    function insertLink() {
        const url = window.prompt('Enter a link URL');
        if (url) command('createLink', url);
    }

    function chooseFile(
        event: React.ChangeEvent<HTMLInputElement>,
        callback: (file: File) => void,
    ) {
        const file = event.target.files?.[0];
        if (file) callback(file);
        event.target.value = '';
    }

    const toolbarButton =
        'inline-flex size-8 shrink-0 items-center justify-center rounded text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-emerald-700';

    return (
        <div className="overflow-hidden rounded border border-slate-300">
            <div
                role="toolbar"
                aria-label="Text formatting"
                className="flex flex-wrap items-center gap-0.5 border-b border-slate-300 bg-slate-50 p-1"
            >
                <select
                    aria-label="Text style"
                    defaultValue="p"
                    onChange={(event) =>
                        command('formatBlock', event.target.value)
                    }
                    onFocus={saveSelection}
                    className="h-8 max-w-28 rounded border-0 bg-transparent px-1 text-xs text-slate-700 hover:bg-slate-200"
                >
                    <option value="p">Paragraph</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="blockquote">Quote</option>
                </select>
                <select
                    aria-label="Font"
                    defaultValue=""
                    onChange={(event) => {
                        if (event.target.value)
                            command('fontName', event.target.value);
                        event.target.value = '';
                    }}
                    onFocus={saveSelection}
                    className="h-8 max-w-24 rounded border-0 bg-transparent px-1 text-xs text-slate-700 hover:bg-slate-200"
                >
                    <option value="">Font</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Verdana">Verdana</option>
                </select>
                <select
                    aria-label="Font size"
                    defaultValue=""
                    onChange={(event) => {
                        if (event.target.value)
                            command('fontSize', event.target.value);
                        event.target.value = '';
                    }}
                    onFocus={saveSelection}
                    className="h-8 w-16 rounded border-0 bg-transparent px-1 text-xs text-slate-700 hover:bg-slate-200"
                >
                    <option value="">Size</option>
                    <option value="2">Small</option>
                    <option value="3">Normal</option>
                    <option value="4">Large</option>
                    <option value="5">Huge</option>
                </select>
                <span className="mx-1 h-6 border-l border-slate-300" />
                <button
                    type="button"
                    title="Bold"
                    aria-label="Bold"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('bold')}
                >
                    <Bold className="size-4" />
                </button>
                <button
                    type="button"
                    title="Italic"
                    aria-label="Italic"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('italic')}
                >
                    <Italic className="size-4" />
                </button>
                <button
                    type="button"
                    title="Underline"
                    aria-label="Underline"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('underline')}
                >
                    <Underline className="size-4" />
                </button>
                <span className="mx-1 h-6 border-l border-slate-300" />
                <button
                    type="button"
                    title="Insert table"
                    aria-label="Insert table"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                        command(
                            'insertHTML',
                            '<table><tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table><p><br></p>',
                        )
                    }
                >
                    <Table2 className="size-4" />
                </button>
                <button
                    type="button"
                    title="Align left"
                    aria-label="Align left"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('justifyLeft')}
                >
                    <AlignLeft className="size-4" />
                </button>
                <button
                    type="button"
                    title="Align center"
                    aria-label="Align center"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('justifyCenter')}
                >
                    <AlignCenter className="size-4" />
                </button>
                <button
                    type="button"
                    title="Align right"
                    aria-label="Align right"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('justifyRight')}
                >
                    <AlignRight className="size-4" />
                </button>
                <button
                    type="button"
                    title="Bulleted list"
                    aria-label="Bulleted list"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('insertUnorderedList')}
                >
                    <List className="size-4" />
                </button>
                <button
                    type="button"
                    title="Numbered list"
                    aria-label="Numbered list"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('insertOrderedList')}
                >
                    <ListOrdered className="size-4" />
                </button>
                <span className="mx-1 h-6 border-l border-slate-300" />
                <button
                    type="button"
                    title="Undo"
                    aria-label="Undo"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('undo')}
                >
                    <Undo2 className="size-4" />
                </button>
                <button
                    type="button"
                    title="Redo"
                    aria-label="Redo"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('redo')}
                >
                    <Redo2 className="size-4" />
                </button>
                <button
                    type="button"
                    title="Clear formatting"
                    aria-label="Clear formatting"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command('removeFormat')}
                >
                    <Eraser className="size-4" />
                </button>
                <button
                    type="button"
                    title="Insert link"
                    aria-label="Insert link"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={insertLink}
                >
                    <Link2 className="size-4" />
                </button>
                <button
                    type="button"
                    title="Attach file"
                    aria-label="Attach file"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="size-4" />
                </button>
                <button
                    type="button"
                    title="Add image"
                    aria-label="Add image"
                    className={toolbarButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => imageInputRef.current?.click()}
                >
                    <ImageIcon className="size-4" />
                </button>
            </div>
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => chooseFile(event, onInsertImage)}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.webm,.mov,.avi,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                className="hidden"
                onChange={(event) => chooseFile(event, onInsertFile)}
            />
            <div
                ref={editorRef}
                role="textbox"
                aria-label="Content"
                aria-multiline="true"
                contentEditable
                suppressContentEditableWarning
                onInput={(event) => {
                    onChange(event.currentTarget.innerHTML);
                    saveSelection();
                }}
                onKeyUp={saveSelection}
                onMouseUp={saveSelection}
                onBlur={saveSelection}
                className="min-h-36 px-3 py-2 text-[15px] leading-7 text-slate-800 outline-none empty:before:text-slate-400 empty:before:content-['Write_your_content_here…'] [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:mb-2 [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_ul]:list-disc"
            />
        </div>
    );
}

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
        banner: 'from-[#246344] via-[#174b33] to-[#102b20]',
        icon: 'bg-emerald-100 text-emerald-800',
        progress: 'bg-emerald-800',
    },
    orange: {
        banner: 'from-[#246344] via-[#174b33] to-[#102b20]',
        icon: 'bg-emerald-100 text-emerald-800',
        progress: 'bg-emerald-800',
    },
    green: {
        banner: 'from-[#246344] via-[#174b33] to-[#102b20]',
        icon: 'bg-emerald-100 text-emerald-700',
        progress: 'bg-emerald-800',
    },
    indigo: {
        banner: 'from-[#246344] via-[#174b33] to-[#102b20]',
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
    const courseBannerInput = useRef<HTMLInputElement>(null);
    const [updatingCourseBanner, setUpdatingCourseBanner] = useState(false);
    const [courseSettingsOpen, setCourseSettingsOpen] = useState(false);
    const [courseBannerError, setCourseBannerError] = useState<string | null>(
        null,
    );
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
    const [sectionHiddenFromStudents, setSectionHiddenFromStudents] =
        useState(false);
    const [sectionForcedSequence, setSectionForcedSequence] = useState(false);
    const [sectionError, setSectionError] = useState<string | null>(null);
    const [savingSection, setSavingSection] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<number | null>(
        null,
    );
    const [editSectionTitle, setEditSectionTitle] = useState('');
    const [editSectionDescription, setEditSectionDescription] = useState('');
    const [editSectionBanner, setEditSectionBanner] = useState<File | null>(
        null,
    );
    const [editSectionHiddenFromStudents, setEditSectionHiddenFromStudents] =
        useState(false);
    const [editSectionForcedSequence, setEditSectionForcedSequence] =
        useState(false);
    const [removeSectionBanner, setRemoveSectionBanner] = useState(false);
    const [sectionUpdateError, setSectionUpdateError] = useState<string | null>(
        null,
    );
    const [savingSectionUpdate, setSavingSectionUpdate] = useState(false);
    const [moduleEditorOpen, setModuleEditorOpen] = useState(false);
    const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(
        null,
    );
    const [lessonSectionId, setLessonSectionId] = useState('');
    const [createPanelOpen, setCreatePanelOpen] = useState(false);
    const [createContentSectionId, setCreateContentSectionId] = useState('');
    const [lessonEditorOpen, setLessonEditorOpen] = useState(false);
    const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
    const [uploadSectionId, setUploadSectionId] = useState('');
    const [documentEditorOpen, setDocumentEditorOpen] = useState(false);
    const [documentTitle, setDocumentTitle] = useState('');
    const [documentSectionId, setDocumentSectionId] = useState('');
    const [documentHidden, setDocumentHidden] = useState(true);
    const [documentBlocks, setDocumentBlocks] = useState<DocumentBlock[]>([]);
    const [documentError, setDocumentError] = useState<string | null>(null);
    const [savingDocument, setSavingDocument] = useState(false);
    const nextDocumentBlockId = useRef(0);
    const draggedDocumentBlockId = useRef<number | null>(null);
    const [dragOverDocumentBlockId, setDragOverDocumentBlockId] = useState<
        number | null
    >(null);
    const draggedSectionId = useRef<number | null>(null);
    const [dragOverSectionId, setDragOverSectionId] = useState<number | null>(
        null,
    );
    const [moduleSearchOpen, setModuleSearchOpen] = useState(false);
    const [moduleSearch, setModuleSearch] = useState('');
    const sections = course.sections ?? [];
    const visibleSections = sections.filter((section) => {
        const query = moduleSearch.trim().toLowerCase();
        if (!query) return true;
        return [
            section.title,
            section.description ?? '',
            ...lessons
                .filter((lesson) => lesson.course_section_id === section.id)
                .flatMap((lesson) => [lesson.title, lesson.summary]),
            ...section.materials.map((material) => material.title),
            ...section.documents.map((document) => document.title),
        ]
            .join(' ')
            .toLowerCase()
            .includes(query);
    });

    useEffect(() => {
        const banner =
            editingSectionId === null ? sectionBanner : editSectionBanner;
        if (!banner) {
            setBannerPreviewUrl(null);
            return;
        }

        const previewUrl = URL.createObjectURL(banner);
        setBannerPreviewUrl(previewUrl);
        return () => URL.revokeObjectURL(previewUrl);
    }, [editSectionBanner, editingSectionId, sectionBanner]);

    function uploadMaterial(file: File | undefined, sectionId?: number) {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (sectionId !== undefined) {
            formData.append('course_section_id', String(sectionId));
        }
        setUploading(true);
        setUploadError(null);
        router.post(`/courses/${course.slug}/materials`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setUploadPanelOpen(false),
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

    function startCreatingLesson(sectionId?: string) {
        setCreatePanelOpen(false);
        setLessonError(null);
        setLessonSectionId(
            sectionId ||
                createContentSectionId ||
                (sections[0] ? String(sections[0].id) : ''),
        );
        setLessonEditorOpen(true);
    }

    function startUploadingMaterial(sectionId?: string) {
        setCreatePanelOpen(false);
        setUploadError(null);
        setUploadSectionId(
            sectionId ||
                createContentSectionId ||
                (sections[0] ? String(sections[0].id) : ''),
        );
        setUploadPanelOpen(true);
    }

    function openCreateContent(sectionId = '') {
        setCreateContentSectionId(sectionId);
        setCreatePanelOpen(true);
    }

    function startCreatingDocument(sectionId?: string) {
        setCreatePanelOpen(false);
        if (sections.length === 0) {
            startCreatingSection();
            return;
        }
        setDocumentTitle(
            `New Document ${new Intl.DateTimeFormat('en-US').format(new Date())}`,
        );
        setDocumentSectionId(
            sectionId ||
                createContentSectionId ||
                (sections[0] ? String(sections[0].id) : ''),
        );
        setDocumentHidden(true);
        setDocumentBlocks([]);
        setDocumentError(null);
        setDocumentEditorOpen(true);
    }

    function addDocumentBlock(type: DocumentBlock['type']) {
        nextDocumentBlockId.current += 1;
        const id = nextDocumentBlockId.current;
        setDocumentBlocks((blocks) => [
            ...blocks,
            {
                id,
                type,
                ...(type === 'content' ? { content: '' } : {}),
            },
        ]);
        return id;
    }

    function setDocumentBlockFile(blockId: number, file?: File) {
        if (!file) return;
        setDocumentBlocks((blocks) =>
            blocks.map((block) => {
                if (block.id !== blockId) return block;
                if (block.previewUrl) URL.revokeObjectURL(block.previewUrl);
                return {
                    ...block,
                    file,
                    ...(block.type === 'image'
                        ? { previewUrl: URL.createObjectURL(file) }
                        : {}),
                };
            }),
        );
    }

    function removeDocumentBlock(blockId: number) {
        setDocumentBlocks((blocks) => {
            const block = blocks.find((item) => item.id === blockId);
            if (block?.previewUrl) URL.revokeObjectURL(block.previewUrl);
            return blocks.filter((item) => item.id !== blockId);
        });
    }

    function reorderSections(sourceId: number, destinationIndex: number) {
        const sourceIndex = sections.findIndex(
            (section) => section.id === sourceId,
        );
        if (sourceIndex < 0 || sections.length < 2) return;

        const reorderedSections = [...sections];
        const [section] = reorderedSections.splice(sourceIndex, 1);
        reorderedSections.splice(
            Math.max(0, Math.min(destinationIndex, reorderedSections.length)),
            0,
            section,
        );

        router.patch(
            `/courses/${course.id}/sections/order`,
            { sections: reorderedSections.map((item) => item.id) },
            { preserveScroll: true },
        );
    }

    function moveDocumentBlock(blockId: number, destinationIndex: number) {
        setDocumentBlocks((blocks) => {
            const sourceIndex = blocks.findIndex(
                (block) => block.id === blockId,
            );
            if (sourceIndex < 0) return blocks;

            const reordered = [...blocks];
            const [block] = reordered.splice(sourceIndex, 1);
            reordered.splice(
                Math.max(0, Math.min(destinationIndex, reordered.length)),
                0,
                block,
            );
            return reordered;
        });
    }

    function closeDocumentEditor() {
        documentBlocks.forEach((block) => {
            if (block.previewUrl) URL.revokeObjectURL(block.previewUrl);
        });
        setDocumentBlocks([]);
        setDocumentEditorOpen(false);
    }

    function saveDocument(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!documentSectionId) {
            setDocumentError('Create or select a course module first.');
            return;
        }
        const hasEmptyContent = documentBlocks.some((block) => {
            if (block.type !== 'content') return false;
            const content = window.document.createElement('div');
            content.innerHTML = block.content ?? '';
            return !content.textContent?.trim();
        });
        if (hasEmptyContent) {
            setDocumentError('Add text to each content block before saving.');
            return;
        }

        const formData = new FormData();
        formData.append('title', documentTitle);
        formData.append('course_section_id', documentSectionId);
        formData.append('hidden_from_students', documentHidden ? '1' : '0');
        documentBlocks.forEach((block, index) => {
            formData.append(`blocks[${index}][type]`, block.type);
            if (block.content !== undefined) {
                formData.append(`blocks[${index}][content]`, block.content);
            }
            if (block.file) {
                formData.append(`blocks[${index}][file]`, block.file);
            }
        });

        setSavingDocument(true);
        setDocumentError(null);
        router.post(`/courses/${course.slug}/documents`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: closeDocumentEditor,
            onError: (errors) =>
                setDocumentError(
                    Object.values(errors)[0] ??
                        'Could not save this document. Please try again.',
                ),
            onFinish: () => setSavingDocument(false),
        });
    }

    function updateCourseBanner(file?: File, remove = false) {
        if (!file && !remove) return;

        const formData = new FormData();
        formData.append('_method', 'PATCH');
        if (file) formData.append('banner', file);
        if (remove) formData.append('remove_banner', '1');

        setUpdatingCourseBanner(true);
        setCourseBannerError(null);
        router.post(`/courses/${course.id}/banner`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) =>
                setCourseBannerError(
                    errors.banner ?? 'Could not update the course banner.',
                ),
            onFinish: () => {
                setUpdatingCourseBanner(false);
                if (courseBannerInput.current) {
                    courseBannerInput.current.value = '';
                }
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

    function removeLesson(lesson: Lesson) {
        if (
            window.confirm(
                `Delete "${lesson.title}"? This will also remove its completion records.`,
            )
        ) {
            router.delete(`/courses/${course.slug}/lessons/${lesson.id}`, {
                preserveScroll: true,
            });
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
                    setLessonEditorOpen(false);
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
        formData.append(
            'hidden_from_students',
            String(sectionHiddenFromStudents),
        );
        formData.append('forced_sequence', String(sectionForcedSequence));
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
                setSectionHiddenFromStudents(false);
                setSectionForcedSequence(false);
                setModuleEditorOpen(false);
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

    function startEditingSection(section: CourseSection) {
        setEditingSectionId(section.id);
        setEditSectionTitle(section.title);
        setEditSectionDescription(section.description ?? '');
        setEditSectionBanner(null);
        setEditSectionHiddenFromStudents(section.hidden_from_students);
        setEditSectionForcedSequence(section.forced_sequence);
        setRemoveSectionBanner(false);
        setSectionUpdateError(null);
        setModuleEditorOpen(true);
    }

    function startCreatingSection() {
        setCreatePanelOpen(false);
        setUploadPanelOpen(false);
        setEditingSectionId(null);
        setSectionTitle('');
        setSectionDescription('');
        setSectionBanner(null);
        setSectionHiddenFromStudents(false);
        setSectionForcedSequence(false);
        setSectionError(null);
        setModuleEditorOpen(true);
    }

    function updateSection(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (editingSectionId === null) return;

        const formData = new FormData();
        formData.append('title', editSectionTitle);
        formData.append('description', editSectionDescription);
        formData.append(
            'hidden_from_students',
            String(editSectionHiddenFromStudents),
        );
        formData.append('forced_sequence', String(editSectionForcedSequence));
        formData.append('remove_banner', String(removeSectionBanner));
        formData.append('_method', 'PATCH');
        if (editSectionBanner) formData.append('banner', editSectionBanner);
        setSavingSectionUpdate(true);
        setSectionUpdateError(null);
        router.post(
            `/courses/${course.id}/sections/${editingSectionId}`,
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setEditingSectionId(null);
                    setEditSectionBanner(null);
                    setModuleEditorOpen(false);
                },
                onError: (errors) =>
                    setSectionUpdateError(
                        errors.title ??
                            errors.description ??
                            errors.banner ??
                            'Could not update this module.',
                    ),
                onFinish: () => setSavingSectionUpdate(false),
            },
        );
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
                <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)]">
                    <section
                        id="course-overview"
                        className={`relative min-h-64 overflow-hidden rounded-sm bg-gradient-to-br ${palette.banner} p-6 text-white sm:p-8`}
                    >
                        {course.banner_url && (
                            <img
                                src={course.banner_url}
                                alt=""
                                className="absolute inset-0 size-full object-cover opacity-25"
                            />
                        )}
                        {canManage && (
                            <div className="absolute top-4 right-4 z-20 flex flex-wrap justify-end gap-2">
                                <input
                                    ref={courseBannerInput}
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(event) =>
                                        updateCourseBanner(
                                            event.target.files?.[0],
                                        )
                                    }
                                />
                                <button
                                    type="button"
                                    disabled={updatingCourseBanner}
                                    onClick={() =>
                                        courseBannerInput.current?.click()
                                    }
                                    className="inline-flex h-9 items-center gap-2 rounded-md bg-white/95 px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-white disabled:opacity-60"
                                >
                                    <Upload className="size-3.5" />
                                    {updatingCourseBanner
                                        ? 'Updating…'
                                        : course.banner_url
                                          ? 'Change banner'
                                          : 'Add course banner'}
                                </button>
                                {course.banner_url && (
                                    <button
                                        type="button"
                                        disabled={updatingCourseBanner}
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    'Remove this course banner?',
                                                )
                                            ) {
                                                updateCourseBanner(
                                                    undefined,
                                                    true,
                                                );
                                            }
                                        }}
                                        className="inline-flex h-9 items-center gap-2 rounded-md bg-white/95 px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-white disabled:opacity-60"
                                    >
                                        <Trash2 className="size-3.5" />
                                        Remove
                                    </button>
                                )}
                            </div>
                        )}
                        {courseBannerError && (
                            <p
                                role="alert"
                                className="absolute right-4 bottom-4 z-20 rounded-md bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm"
                            >
                                {courseBannerError}
                            </p>
                        )}
                        <div
                            aria-hidden="true"
                            className="absolute -top-16 -right-8 size-64 rounded-full border-[40px] border-white/10"
                        />
                        <div className="relative max-w-3xl">
                            <span className="text-sm font-semibold text-emerald-50/90">
                                {course.effective_status === 'complete'
                                    ? 'Course complete'
                                    : course.effective_status === 'closed'
                                      ? 'Course closed'
                                      : (course.module?.title ?? 'Course')}
                            </span>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                {course.title}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                                {course.summary}
                            </p>
                            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
                                <span className="font-medium text-white">
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
                                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                                    {course.level}
                                </span>
                            </div>
                            {course.can_access_content ? (
                                course.can_participate ? (
                                    <Link
                                        href={nextHref}
                                        className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
                                    >
                                        <Play className="size-4 fill-current" />
                                        {course.progress > 0
                                            ? 'Continue course'
                                            : 'Start course'}
                                        <ArrowRight className="ml-1 size-4" />
                                    </Link>
                                ) : (
                                    <span className="mt-6 inline-flex h-10 items-center rounded-md bg-white/15 px-4 text-sm font-semibold text-white">
                                        Review completed course
                                    </span>
                                )
                            ) : (
                                <span className="mt-6 inline-flex items-center rounded-md bg-black/15 px-4 py-3 text-sm font-medium text-white">
                                    {course.access_message}
                                </span>
                            )}
                        </div>
                    </section>
                    <aside className="flex flex-col justify-between border border-slate-200 bg-white p-5 sm:p-6">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                Course faculty
                            </h2>
                            <div className="mt-3 flex items-center gap-3 border-b border-slate-100 pb-4">
                                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900">
                                    {(course.teacher ?? course.instructor)
                                        .split(' ')
                                        .map((part) => part[0])
                                        .join('')
                                        .slice(0, 2)}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900">
                                        {course.teacher ?? course.instructor}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Instructor
                                    </p>
                                </div>
                            </div>
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

                <nav
                    aria-label="Course content navigation"
                    className="mt-5 flex overflow-x-auto border-b border-slate-300 bg-white"
                >
                    {[
                        ['#course-overview', 'Content'],
                        ['#modules', 'Course Content'],
                    ].map(([href, label], index) => (
                        <a
                            key={label}
                            href={href}
                            aria-current={index === 0 ? 'page' : undefined}
                            className={`inline-flex h-11 shrink-0 items-center border-b-2 px-4 text-sm font-medium transition ${
                                index === 0
                                    ? 'border-emerald-700 text-emerald-900'
                                    : 'border-transparent text-slate-600 hover:border-emerald-300 hover:text-emerald-900'
                            }`}
                        >
                            {label}
                        </a>
                    ))}
                </nav>

                {isAdmin && (
                    <div className="mt-5 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setCourseSettingsOpen(true)}
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
                        >
                            <Settings2 className="size-4" />
                            Course Settings
                        </button>
                    </div>
                )}

                {isAdmin && (
                    <Sheet
                        open={courseSettingsOpen}
                        onOpenChange={setCourseSettingsOpen}
                    >
                        <SheetContent
                            side="right"
                            className="w-full gap-0 overflow-y-auto sm:max-w-2xl"
                        >
                            <SheetHeader className="border-b border-slate-200 px-6 py-5">
                                <p className="text-xs font-semibold tracking-[0.15em] text-emerald-800 uppercase">
                                    Administrator controls
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <SheetTitle className="text-xl">
                                        Course settings
                                    </SheetTitle>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${course.effective_status === 'open' ? 'bg-emerald-50 text-emerald-800' : course.effective_status === 'complete' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-800'}`}
                                    >
                                        {course.effective_status}
                                    </span>
                                </div>
                                <SheetDescription>
                                    Control enrollment access, duration,
                                    participation, and course tools.
                                </SheetDescription>
                            </SheetHeader>

                            <form
                                onSubmit={saveCourseSettings}
                                className="space-y-7 px-6 py-5"
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
                                                    settingsForm.data
                                                        .access_status
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
                                                    Closed — block student
                                                    course content
                                                </option>
                                            </select>
                                        </label>
                                        <label className="text-sm font-medium text-slate-700">
                                            Course duration
                                            <select
                                                value={
                                                    settingsForm.data
                                                        .duration_mode
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
                                                                    .value ||
                                                                    null,
                                                            )
                                                        }
                                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                                    />
                                                    {settingsForm.errors
                                                        .starts_at && (
                                                        <span className="mt-1 block text-xs text-red-600">
                                                            {
                                                                settingsForm
                                                                    .errors
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
                                                                    .value ||
                                                                    null,
                                                            )
                                                        }
                                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                                    />
                                                    {settingsForm.errors
                                                        .ends_at && (
                                                        <span className="mt-1 block text-xs text-red-600">
                                                            {
                                                                settingsForm
                                                                    .errors
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
                                        Gradebook and mastery tabs are not
                                        enabled in this LMS yet; these
                                        preferences are saved for the course.
                                    </p>
                                </fieldset>

                                <fieldset className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                                    <label className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={
                                                settingsForm.data.completed
                                            }
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
                                                content. Administrators can
                                                still manage this course.
                                            </span>
                                        </span>
                                    </label>
                                </fieldset>

                                {Object.keys(settingsForm.errors).length >
                                    0 && (
                                    <p
                                        role="alert"
                                        className="text-sm text-red-600"
                                    >
                                        {Object.values(
                                            settingsForm.errors,
                                        ).join(' ')}
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
                        </SheetContent>
                    </Sheet>
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

                <section id="modules" className="mt-6 pb-8">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Course Content
                        </h2>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() =>
                                    setModuleSearchOpen((open) => {
                                        if (open) setModuleSearch('');
                                        return !open;
                                    })
                                }
                                aria-label="Search course content"
                                className="flex size-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                            >
                                <Search className="size-5" />
                            </button>
                            {canManage && (
                                <button
                                    type="button"
                                    onClick={() => openCreateContent()}
                                    aria-label="Add course content"
                                    className="flex size-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                                >
                                    <Ellipsis className="size-5" />
                                </button>
                            )}
                        </div>
                    </div>
                    {moduleSearchOpen && (
                        <input
                            autoFocus
                            value={moduleSearch}
                            onChange={(event) =>
                                setModuleSearch(event.target.value)
                            }
                            placeholder="Search course content"
                            aria-label="Search course content"
                            className="mb-4 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700"
                        />
                    )}
                    {canManage && (
                        <div className="relative mb-3 h-3 border-t border-slate-300">
                            <button
                                type="button"
                                onClick={startCreatingSection}
                                aria-label="Create module"
                                title="Create module"
                                className="absolute -top-2.5 left-2 flex size-5 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                                <Plus className="size-3" />
                            </button>
                        </div>
                    )}
                    {visibleSections.length > 0 ? (
                        <div className="space-y-3">
                            {visibleSections.map(
                                (section: CourseSection, index) => (
                                    <details
                                        key={section.id}
                                        open={index === 0 && !moduleSearch}
                                        onDragOver={(event) =>
                                            event.preventDefault()
                                        }
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            const draggedId =
                                                draggedSectionId.current;
                                            if (
                                                canManage &&
                                                !moduleSearch &&
                                                draggedId !== null
                                            ) {
                                                const bounds =
                                                    event.currentTarget.getBoundingClientRect();
                                                const insertAfter =
                                                    event.clientY >
                                                    bounds.top +
                                                        bounds.height / 2;
                                                const sourceIndex =
                                                    sections.findIndex(
                                                        (item) =>
                                                            item.id ===
                                                            draggedId,
                                                    );
                                                reorderSections(
                                                    draggedId,
                                                    index +
                                                        (insertAfter ? 1 : 0) -
                                                        (sourceIndex < index
                                                            ? 1
                                                            : 0),
                                                );
                                            }
                                            draggedSectionId.current = null;
                                            setDragOverSectionId(null);
                                        }}
                                        onDragEnter={() =>
                                            setDragOverSectionId(section.id)
                                        }
                                        onDragLeave={(event) => {
                                            if (
                                                !event.currentTarget.contains(
                                                    event.relatedTarget as Node | null,
                                                )
                                            ) {
                                                setDragOverSectionId(null);
                                            }
                                        }}
                                        className={`group overflow-hidden rounded-md border bg-white shadow-sm transition hover:border-slate-300 ${
                                            dragOverSectionId === section.id
                                                ? 'border-emerald-500'
                                                : 'border-slate-200'
                                        }`}
                                    >
                                        <summary className="relative flex min-h-48 cursor-pointer list-none items-start gap-3 p-4 pr-12 sm:min-h-52 sm:p-6 sm:pr-14 [&::-webkit-details-marker]:hidden">
                                            {canManage && !moduleSearch ? (
                                                <button
                                                    type="button"
                                                    draggable
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                    }}
                                                    onDragStart={(event) => {
                                                        event.stopPropagation();
                                                        draggedSectionId.current =
                                                            section.id;
                                                        event.dataTransfer.effectAllowed =
                                                            'move';
                                                        event.dataTransfer.setData(
                                                            'text/plain',
                                                            String(section.id),
                                                        );
                                                    }}
                                                    onDragEnd={() => {
                                                        draggedSectionId.current =
                                                            null;
                                                        setDragOverSectionId(
                                                            null,
                                                        );
                                                    }}
                                                    aria-label={`Drag to move ${section.title}`}
                                                    title="Drag to reorder module"
                                                    className="mt-1 flex size-7 shrink-0 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
                                                >
                                                    <GripVertical className="size-4" />
                                                </button>
                                            ) : (
                                                <GripVertical className="mt-1 size-4 shrink-0 text-slate-400" />
                                            )}
                                            <span className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br from-emerald-50 to-green-100 sm:size-36">
                                                {section.banner_url ? (
                                                    <img
                                                        src={section.banner_url}
                                                        alt=""
                                                        className="size-full object-cover"
                                                    />
                                                ) : (
                                                    <BookOpen className="size-10 text-emerald-800" />
                                                )}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-medium text-slate-900">
                                                    {section.title}
                                                </span>
                                                {section.hidden_from_students &&
                                                    canManage && (
                                                        <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
                                                            <EyeOff className="size-4" />
                                                            Hidden from students
                                                            <ChevronDown className="size-3.5" />
                                                        </span>
                                                    )}
                                                {section.description && (
                                                    <span className="mt-2 block text-sm leading-5 text-slate-700">
                                                        {section.description}
                                                    </span>
                                                )}
                                                <span className="mt-2 block text-xs text-slate-500">
                                                    {section.lesson_count}{' '}
                                                    lessons
                                                    {section.documents.length >
                                                    0
                                                        ? ` · ${section.documents.length} documents`
                                                        : ''}
                                                    {section.materials.length >
                                                    0
                                                        ? ` · ${section.materials.length} files`
                                                        : ''}
                                                </span>
                                            </span>
                                            {canManage && (
                                                <div className="absolute top-3 right-3 flex items-center">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            index === 0 ||
                                                            Boolean(
                                                                moduleSearch,
                                                            )
                                                        }
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            reorderSections(
                                                                section.id,
                                                                index - 1,
                                                            );
                                                        }}
                                                        aria-label={`Move ${section.title} up`}
                                                        className="flex size-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                                    >
                                                        <ChevronUp className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            index ===
                                                                visibleSections.length -
                                                                    1 ||
                                                            Boolean(
                                                                moduleSearch,
                                                            )
                                                        }
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            reorderSections(
                                                                section.id,
                                                                index + 1,
                                                            );
                                                        }}
                                                        aria-label={`Move ${section.title} down`}
                                                        className="flex size-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                                    >
                                                        <ChevronDown className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            startEditingSection(
                                                                section,
                                                            );
                                                        }}
                                                        aria-label={`Edit ${section.title}`}
                                                        className="flex size-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
                                                    >
                                                        <Ellipsis className="size-5" />
                                                    </button>
                                                </div>
                                            )}
                                            <ChevronDown className="absolute right-4 bottom-4 size-5 text-slate-500 transition-transform group-open:rotate-180" />
                                        </summary>
                                        <div className="border-t border-slate-200 px-5 py-4 sm:px-16">
                                            {section.locked && (
                                                <p className="mb-3 text-xs font-medium text-amber-700">
                                                    Complete the previous
                                                    modules to unlock these
                                                    materials.
                                                </p>
                                            )}
                                            {lessons
                                                .filter(
                                                    (lesson) =>
                                                        lesson.course_section_id ===
                                                        section.id,
                                                )
                                                .map(
                                                    (
                                                        lesson,
                                                        lessonIndex,
                                                        list,
                                                    ) => (
                                                        <div
                                                            key={lesson.id}
                                                            className="border-b border-slate-200 py-3 last:border-0"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <FileText className="size-5 shrink-0 text-slate-600" />
                                                                <Link
                                                                    href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                                                                    onClick={(
                                                                        event,
                                                                    ) => {
                                                                        if (
                                                                            lesson.locked
                                                                        ) {
                                                                            event.preventDefault();
                                                                        }
                                                                    }}
                                                                    aria-disabled={
                                                                        lesson.locked
                                                                    }
                                                                    className={`min-w-0 flex-1 text-sm font-medium text-slate-700 hover:text-emerald-800 ${lesson.locked ? 'pointer-events-none opacity-55' : ''}`}
                                                                >
                                                                    {
                                                                        lesson.title
                                                                    }
                                                                </Link>
                                                                <span className="hidden text-xs text-slate-500 sm:block">
                                                                    {
                                                                        lesson.duration_minutes
                                                                    }{' '}
                                                                    min
                                                                </span>
                                                                {canManage && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeLesson(
                                                                                lesson,
                                                                            )
                                                                        }
                                                                        aria-label={`Delete ${lesson.title}`}
                                                                        title="Delete lesson"
                                                                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {lesson.summary && (
                                                                <p className="mt-1 ml-8 text-sm text-slate-500">
                                                                    {
                                                                        lesson.summary
                                                                    }
                                                                </p>
                                                            )}
                                                            {canManage &&
                                                                lessonIndex <
                                                                    list.length -
                                                                        1 && (
                                                                    <label className="mt-2 ml-8 flex items-center gap-2 text-xs text-slate-500">
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
                                                                            className="size-3.5 rounded border-slate-300 accent-emerald-800"
                                                                        />
                                                                        Require
                                                                        this
                                                                        lesson
                                                                        before
                                                                        unlocking
                                                                        the next
                                                                    </label>
                                                                )}
                                                        </div>
                                                    ),
                                                )}
                                            {section.documents.map(
                                                (document) => (
                                                    <div
                                                        key={`document-${document.id}`}
                                                        className="flex items-center gap-3 border-b border-slate-200 py-3 last:border-0"
                                                    >
                                                        <FileText className="size-5 shrink-0 text-slate-600" />
                                                        <Link
                                                            href={
                                                                document.show_url
                                                            }
                                                            className="min-w-0 flex-1 text-sm font-medium text-slate-700 hover:text-emerald-800"
                                                        >
                                                            {document.title}
                                                        </Link>
                                                        {document.hidden_from_students &&
                                                            canManage && (
                                                                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                                    <EyeOff className="size-3.5" />
                                                                    Hidden
                                                                </span>
                                                            )}
                                                    </div>
                                                ),
                                            )}
                                            <div className="mt-4 border-t border-slate-100 pt-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                                        Module materials
                                                    </h4>
                                                </div>
                                                {canManage && (
                                                    <div className="relative my-3 flex items-center">
                                                        <span className="absolute inset-x-0 top-1/2 border-t border-slate-300" />
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Add content to ${section.title}`}
                                                                    title="Add content"
                                                                    className="relative z-10 ml-2 flex size-6 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-700"
                                                                >
                                                                    <Plus className="size-3.5" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="start"
                                                                sideOffset={6}
                                                                className="w-56"
                                                            >
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        openCreateContent(
                                                                            String(
                                                                                section.id,
                                                                            ),
                                                                        )
                                                                    }
                                                                >
                                                                    <Plus className="size-4" />
                                                                    Create
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        startCreatingDocument(
                                                                            String(
                                                                                section.id,
                                                                            ),
                                                                        )
                                                                    }
                                                                >
                                                                    <BookOpen className="size-4" />
                                                                    Document
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={() =>
                                                                        startUploadingMaterial(
                                                                            String(
                                                                                section.id,
                                                                            ),
                                                                        )
                                                                    }
                                                                >
                                                                    <Upload className="size-4" />
                                                                    File or
                                                                    video
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                )}
                                                {section.materials.length >
                                                0 ? (
                                                    <div className="mt-2 space-y-2">
                                                        {section.materials.map(
                                                            (material) => (
                                                                <div
                                                                    key={
                                                                        material.id
                                                                    }
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    {material.is_video ? (
                                                                        <Video className="size-4 shrink-0 text-emerald-700" />
                                                                    ) : (
                                                                        <FileText className="size-4 shrink-0 text-emerald-700" />
                                                                    )}
                                                                    <a
                                                                        href={
                                                                            material.download_url
                                                                        }
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
                                                                        className="min-w-0 flex-1 truncate text-sm text-slate-700 hover:text-emerald-800"
                                                                    >
                                                                        {
                                                                            material.title
                                                                        }
                                                                    </a>
                                                                    {canManage && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeMaterial(
                                                                                    material.id,
                                                                                )
                                                                            }
                                                                            aria-label={`Remove ${material.title}`}
                                                                            className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                                        >
                                                                            <Trash2 className="size-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="mt-2 text-xs text-slate-400">
                                                        No files in this module
                                                        yet.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </details>
                                ),
                            )}
                        </div>
                    ) : (
                        <p className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                            {sections.length > 0
                                ? 'No course content matches your search.'
                                : canManage
                                  ? 'Create a module to organize course content.'
                                  : 'Course content will be available here.'}
                        </p>
                    )}
                </section>

                {lessons.some((lesson) => !lesson.course_section_id) && (
                    <section id="lessons" className="mt-4 pb-8">
                        <div className="mb-5 flex items-end justify-between gap-4">
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">
                                    Other course lessons
                                </h2>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                            {lessons
                                .filter((lesson) => !lesson.course_section_id)
                                .map((lesson, index, list) => (
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
                                                        {String(
                                                            index + 1,
                                                        ).padStart(2, '0')}
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
                                            index < list.length - 1 && (
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
                    </section>
                )}

                <Sheet open={createPanelOpen} onOpenChange={setCreatePanelOpen}>
                    <SheetContent
                        side="right"
                        className="w-full overflow-y-auto sm:max-w-md"
                    >
                        <SheetHeader>
                            <SheetTitle>Create item</SheetTitle>
                            <SheetDescription>
                                Add new learning content to {course.title}.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onClick={startCreatingSection}
                                className="flex w-full items-center gap-4 border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50"
                            >
                                <span className="flex size-11 shrink-0 items-center justify-center bg-emerald-50 text-emerald-800">
                                    <BookOpen className="size-5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-semibold text-slate-900">
                                        Learning module
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-500">
                                        Group lessons and materials together.
                                    </span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={startCreatingLesson}
                                className="flex w-full items-center gap-4 border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50"
                            >
                                <span className="flex size-11 shrink-0 items-center justify-center bg-emerald-50 text-emerald-800">
                                    <FileText className="size-5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-semibold text-slate-900">
                                        Lesson
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-500">
                                        Create a lesson with an introduction and
                                        timer.
                                    </span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={startCreatingDocument}
                                className="flex w-full items-center gap-4 border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50"
                            >
                                <span className="flex size-11 shrink-0 items-center justify-center bg-emerald-50 text-emerald-800">
                                    <FileText className="size-5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-semibold text-slate-900">
                                        Document
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-500">
                                        Create a page with text, images, and
                                        attachments.
                                    </span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={startUploadingMaterial}
                                className="flex w-full items-center gap-4 border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50"
                            >
                                <span className="flex size-11 shrink-0 items-center justify-center bg-emerald-50 text-emerald-800">
                                    <Upload className="size-5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-semibold text-slate-900">
                                        Upload file or video
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-500">
                                        Add a standalone resource to a module.
                                    </span>
                                </span>
                            </button>
                        </div>
                    </SheetContent>
                </Sheet>

                {documentEditorOpen && (
                    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
                        <form
                            onSubmit={saveDocument}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-7">
                                <input
                                    required
                                    maxLength={150}
                                    value={documentTitle}
                                    onChange={(event) =>
                                        setDocumentTitle(event.target.value)
                                    }
                                    aria-label="Document title"
                                    className="min-w-0 flex-1 border-0 bg-transparent text-xl font-medium text-slate-900 outline-none sm:text-2xl"
                                    placeholder="New Document"
                                />
                                <div className="flex items-center gap-2">
                                    <label
                                        className="sr-only"
                                        htmlFor="document-visibility"
                                    >
                                        Document visibility
                                    </label>
                                    <select
                                        id="document-visibility"
                                        value={
                                            documentHidden
                                                ? 'hidden'
                                                : 'visible'
                                        }
                                        onChange={(event) =>
                                            setDocumentHidden(
                                                event.target.value === 'hidden',
                                            )
                                        }
                                        className="h-9 max-w-48 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
                                    >
                                        <option value="hidden">
                                            Hidden from students
                                        </option>
                                        <option value="visible">
                                            Visible to students
                                        </option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={closeDocumentEditor}
                                        aria-label="Cancel document"
                                        className="flex size-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>
                            </header>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 sm:px-7">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            addDocumentBlock('content')
                                        }
                                        className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <Plus className="size-4" />
                                        Add block
                                    </button>
                                    <label className="flex items-center gap-2 text-xs text-slate-500">
                                        Add to module
                                        <select
                                            required
                                            value={documentSectionId}
                                            onChange={(event) =>
                                                setDocumentSectionId(
                                                    event.target.value,
                                                )
                                            }
                                            disabled={sections.length === 0}
                                            className="h-9 max-w-48 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 disabled:bg-slate-100"
                                        >
                                            <option value="" disabled>
                                                Select a module
                                            </option>
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
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={closeDocumentEditor}
                                        className="h-9 rounded-md px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            savingDocument ||
                                            sections.length === 0
                                        }
                                        className="h-9 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                                    >
                                        {savingDocument ? 'Saving…' : 'Save'}
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-6 sm:px-8 sm:py-8">
                                <div className="mx-auto max-w-5xl overflow-hidden rounded-md border border-slate-300 bg-white">
                                    <div className="border-b border-slate-200 p-4">
                                        <p className="text-sm font-medium text-slate-700">
                                            Select a type of content to add a
                                            block
                                        </p>
                                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addDocumentBlock('content')
                                                }
                                                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border border-slate-200 text-sm text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                                            >
                                                <FileText className="size-5" />
                                                Content
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addDocumentBlock('file')
                                                }
                                                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border border-slate-200 text-sm text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                                            >
                                                <Upload className="size-5" />
                                                File upload
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addDocumentBlock('image')
                                                }
                                                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border border-slate-200 text-sm text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                                            >
                                                <ImageIcon className="size-5" />
                                                Image
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addDocumentBlock('divider')
                                                }
                                                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border border-slate-200 text-sm text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                                            >
                                                <Minus className="size-5" />
                                                Divider
                                            </button>
                                        </div>
                                    </div>

                                    {documentBlocks.length > 0 && (
                                        <div className="space-y-4 p-4 sm:p-6">
                                            {documentBlocks.map(
                                                (block, index) => (
                                                    <section
                                                        key={block.id}
                                                        onDragOver={(event) =>
                                                            event.preventDefault()
                                                        }
                                                        onDrop={(event) => {
                                                            event.preventDefault();
                                                            const draggedId =
                                                                draggedDocumentBlockId.current;
                                                            if (
                                                                draggedId !==
                                                                null
                                                            ) {
                                                                const bounds =
                                                                    event.currentTarget.getBoundingClientRect();
                                                                const insertAfter =
                                                                    event.clientY >
                                                                    bounds.top +
                                                                        bounds.height /
                                                                            2;
                                                                const sourceIndex =
                                                                    documentBlocks.findIndex(
                                                                        (
                                                                            item,
                                                                        ) =>
                                                                            item.id ===
                                                                            draggedId,
                                                                    );
                                                                moveDocumentBlock(
                                                                    draggedId,
                                                                    index +
                                                                        (insertAfter
                                                                            ? 1
                                                                            : 0) -
                                                                        (sourceIndex <
                                                                        index
                                                                            ? 1
                                                                            : 0),
                                                                );
                                                            }
                                                            draggedDocumentBlockId.current =
                                                                null;
                                                            setDragOverDocumentBlockId(
                                                                null,
                                                            );
                                                        }}
                                                        onDragEnter={() =>
                                                            setDragOverDocumentBlockId(
                                                                block.id,
                                                            )
                                                        }
                                                        onDragLeave={(
                                                            event,
                                                        ) => {
                                                            if (
                                                                !event.currentTarget.contains(
                                                                    event.relatedTarget as Node | null,
                                                                )
                                                            ) {
                                                                setDragOverDocumentBlockId(
                                                                    null,
                                                                );
                                                            }
                                                        }}
                                                        className={`relative rounded-md border p-4 transition-colors ${
                                                            dragOverDocumentBlockId ===
                                                            block.id
                                                                ? 'border-emerald-500 bg-emerald-50/40'
                                                                : 'border-slate-200'
                                                        }`}
                                                    >
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    draggable
                                                                    onDragStart={(
                                                                        event,
                                                                    ) => {
                                                                        draggedDocumentBlockId.current =
                                                                            block.id;
                                                                        event.dataTransfer.effectAllowed =
                                                                            'move';
                                                                        event.dataTransfer.setData(
                                                                            'text/plain',
                                                                            String(
                                                                                block.id,
                                                                            ),
                                                                        );
                                                                    }}
                                                                    onDragEnd={() => {
                                                                        draggedDocumentBlockId.current =
                                                                            null;
                                                                        setDragOverDocumentBlockId(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    aria-label={`Drag to move ${block.type} block`}
                                                                    title="Drag to reorder"
                                                                    className="flex size-8 cursor-grab items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 active:cursor-grabbing"
                                                                >
                                                                    <GripVertical className="size-4" />
                                                                </button>
                                                                <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                                                    {block.type ===
                                                                    'content'
                                                                        ? 'Content'
                                                                        : block.type ===
                                                                            'image'
                                                                          ? 'Image'
                                                                          : block.type ===
                                                                              'file'
                                                                            ? 'File upload'
                                                                            : 'Divider'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        index ===
                                                                        0
                                                                    }
                                                                    onClick={() =>
                                                                        moveDocumentBlock(
                                                                            block.id,
                                                                            index -
                                                                                1,
                                                                        )
                                                                    }
                                                                    aria-label={`Move ${block.type} block up`}
                                                                    className="flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                                                >
                                                                    <ChevronUp className="size-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        index ===
                                                                        documentBlocks.length -
                                                                            1
                                                                    }
                                                                    onClick={() =>
                                                                        moveDocumentBlock(
                                                                            block.id,
                                                                            index +
                                                                                1,
                                                                        )
                                                                    }
                                                                    aria-label={`Move ${block.type} block down`}
                                                                    className="flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                                                >
                                                                    <ChevronDown className="size-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeDocumentBlock(
                                                                            block.id,
                                                                        )
                                                                    }
                                                                    aria-label={`Remove ${block.type} block`}
                                                                    className="flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {block.type ===
                                                            'content' && (
                                                            <RichTextEditor
                                                                value={
                                                                    block.content ??
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    content,
                                                                ) =>
                                                                    setDocumentBlocks(
                                                                        (
                                                                            current,
                                                                        ) =>
                                                                            current.map(
                                                                                (
                                                                                    item,
                                                                                ) =>
                                                                                    item.id ===
                                                                                    block.id
                                                                                        ? {
                                                                                              ...item,
                                                                                              content,
                                                                                          }
                                                                                        : item,
                                                                            ),
                                                                    )
                                                                }
                                                                onInsertImage={(
                                                                    file,
                                                                ) => {
                                                                    const id =
                                                                        addDocumentBlock(
                                                                            'image',
                                                                        );
                                                                    setDocumentBlockFile(
                                                                        id,
                                                                        file,
                                                                    );
                                                                }}
                                                                onInsertFile={(
                                                                    file,
                                                                ) => {
                                                                    const id =
                                                                        addDocumentBlock(
                                                                            'file',
                                                                        );
                                                                    setDocumentBlockFile(
                                                                        id,
                                                                        file,
                                                                    );
                                                                }}
                                                            />
                                                        )}
                                                        {block.type ===
                                                            'image' && (
                                                            <div>
                                                                <input
                                                                    required={
                                                                        !block.file
                                                                    }
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        setDocumentBlockFile(
                                                                            block.id,
                                                                            event
                                                                                .target
                                                                                .files?.[0],
                                                                        )
                                                                    }
                                                                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-900 hover:file:bg-emerald-100"
                                                                />
                                                                {block.previewUrl && (
                                                                    <img
                                                                        src={
                                                                            block.previewUrl
                                                                        }
                                                                        alt="Document image preview"
                                                                        className="mt-4 max-h-80 max-w-full rounded object-contain"
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                        {block.type ===
                                                            'file' && (
                                                            <input
                                                                required={
                                                                    !block.file
                                                                }
                                                                type="file"
                                                                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setDocumentBlockFile(
                                                                        block.id,
                                                                        event
                                                                            .target
                                                                            .files?.[0],
                                                                    )
                                                                }
                                                                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-900 hover:file:bg-emerald-100"
                                                            />
                                                        )}
                                                        {block.type ===
                                                            'divider' && (
                                                            <hr className="border-slate-300" />
                                                        )}
                                                    </section>
                                                ),
                                            )}
                                        </div>
                                    )}
                                    {sections.length === 0 && (
                                        <div className="border-t border-slate-200 p-6 text-center">
                                            <p className="text-sm text-slate-600">
                                                A course module is required for
                                                this document.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={startCreatingSection}
                                                className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-[#183a2a] px-3 text-sm font-semibold text-white"
                                            >
                                                <Plus className="size-4" />
                                                Create module
                                            </button>
                                        </div>
                                    )}
                                    {documentError && (
                                        <p
                                            role="alert"
                                            className="border-t border-red-100 bg-red-50 p-4 text-sm text-red-700"
                                        >
                                            {documentError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                <Sheet
                    open={lessonEditorOpen}
                    onOpenChange={setLessonEditorOpen}
                >
                    <SheetContent
                        side="right"
                        className="w-full overflow-y-auto sm:max-w-xl"
                    >
                        <SheetHeader>
                            <SheetTitle>Create lesson</SheetTitle>
                            <SheetDescription>
                                Add the lesson to a course module and include
                                its introduction and content.
                            </SheetDescription>
                        </SheetHeader>
                        <form
                            onSubmit={addLesson}
                            className="mt-6 space-y-4 px-1 pb-6"
                        >
                            {sections.length > 0 && (
                                <label className="block text-sm font-medium text-slate-700">
                                    Course module
                                    <select
                                        required
                                        value={lessonSectionId}
                                        onChange={(event) =>
                                            setLessonSectionId(
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-700"
                                    >
                                        <option value="" disabled>
                                            Select a module
                                        </option>
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
                            <label className="block text-sm font-medium text-slate-700">
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
                            <label className="block text-sm font-medium text-slate-700">
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
                            <label className="block text-sm font-medium text-slate-700">
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
                            <label className="block text-sm font-medium text-slate-700">
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
                                    className="text-sm text-red-600"
                                >
                                    {lessonError}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={savingLesson}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174b33] px-4 text-sm font-semibold text-white transition hover:bg-[#103b28] disabled:opacity-60"
                            >
                                <BookOpen className="size-4" />
                                {savingLesson
                                    ? 'Adding lesson…'
                                    : 'Create lesson'}
                            </button>
                        </form>
                    </SheetContent>
                </Sheet>

                <Sheet open={uploadPanelOpen} onOpenChange={setUploadPanelOpen}>
                    <SheetContent side="right" className="w-full sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle>Add a document or video</SheetTitle>
                            <SheetDescription>
                                Choose the module where learners will find this
                                file.
                            </SheetDescription>
                        </SheetHeader>
                        {sections.length > 0 ? (
                            <div className="mt-6 space-y-5 px-1">
                                <label className="block text-sm font-medium text-slate-700">
                                    Course module
                                    <select
                                        required
                                        value={uploadSectionId}
                                        onChange={(event) =>
                                            setUploadSectionId(
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-700"
                                    >
                                        <option value="" disabled>
                                            Select a module
                                        </option>
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
                                <input
                                    ref={fileInput}
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                                    disabled={uploading || !uploadSectionId}
                                    onChange={(event) =>
                                        uploadMaterial(
                                            event.target.files?.[0],
                                            Number(uploadSectionId),
                                        )
                                    }
                                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-emerald-900 hover:file:bg-emerald-100 disabled:opacity-60"
                                />
                                {uploadError && (
                                    <p
                                        role="alert"
                                        className="text-sm text-red-600"
                                    >
                                        {uploadError}
                                    </p>
                                )}
                                <p className="text-xs text-slate-500">
                                    MP4, WebM, MOV, AVI, PDF, Word, PowerPoint,
                                    Excel, and TXT files up to 200 MB.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-center">
                                <p className="text-sm text-slate-600">
                                    Create a course module before adding
                                    documents or videos.
                                </p>
                                <button
                                    type="button"
                                    onClick={startCreatingSection}
                                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#174b33] px-4 text-sm font-semibold text-white"
                                >
                                    <Plus className="size-4" />
                                    Create module
                                </button>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>

                <Sheet
                    open={moduleEditorOpen}
                    onOpenChange={setModuleEditorOpen}
                >
                    <SheetContent
                        side="right"
                        className="w-full gap-0 overflow-hidden p-0 sm:max-w-[460px]"
                    >
                        <SheetHeader className="border-b border-slate-200 px-6 py-5">
                            <p className="text-xs font-semibold tracking-[0.16em] text-emerald-800 uppercase">
                                Course module
                            </p>
                            <SheetTitle className="text-xl">
                                {editingSectionId === null
                                    ? 'Create module'
                                    : 'Edit module'}
                            </SheetTitle>
                            <SheetDescription>
                                Set the module details and control how learners
                                access it.
                            </SheetDescription>
                        </SheetHeader>
                        <form
                            onSubmit={
                                editingSectionId === null
                                    ? addSection
                                    : updateSection
                            }
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Module name
                                    <input
                                        required
                                        maxLength={150}
                                        value={
                                            editingSectionId === null
                                                ? sectionTitle
                                                : editSectionTitle
                                        }
                                        onChange={(event) =>
                                            editingSectionId === null
                                                ? setSectionTitle(
                                                      event.target.value,
                                                  )
                                                : setEditSectionTitle(
                                                      event.target.value,
                                                  )
                                        }
                                        className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                                        placeholder="e.g. Introduction"
                                    />
                                </label>

                                <label className="block text-sm font-semibold text-slate-700">
                                    Visibility
                                    <select
                                        value={
                                            (
                                                editingSectionId === null
                                                    ? sectionHiddenFromStudents
                                                    : editSectionHiddenFromStudents
                                            )
                                                ? 'hidden'
                                                : 'visible'
                                        }
                                        onChange={(event) => {
                                            const hidden =
                                                event.target.value === 'hidden';
                                            if (editingSectionId === null) {
                                                setSectionHiddenFromStudents(
                                                    hidden,
                                                );
                                            } else {
                                                setEditSectionHiddenFromStudents(
                                                    hidden,
                                                );
                                            }
                                        }}
                                        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-700"
                                    >
                                        <option value="visible">
                                            Visible to students
                                        </option>
                                        <option value="hidden">
                                            Hidden from students
                                        </option>
                                    </select>
                                    <span className="mt-1 block text-xs font-normal text-slate-500">
                                        Hidden modules are only visible to
                                        course staff.
                                    </span>
                                </label>

                                <label className="block text-sm font-semibold text-slate-700">
                                    Module description
                                    <textarea
                                        maxLength={750}
                                        value={
                                            editingSectionId === null
                                                ? sectionDescription
                                                : editSectionDescription
                                        }
                                        onChange={(event) =>
                                            editingSectionId === null
                                                ? setSectionDescription(
                                                      event.target.value,
                                                  )
                                                : setEditSectionDescription(
                                                      event.target.value,
                                                  )
                                        }
                                        className="mt-2 min-h-32 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                                        placeholder="Add an introduction or learning objectives for this module."
                                    />
                                    <span className="mt-1 block text-right text-xs font-normal text-slate-400">
                                        {
                                            (editingSectionId === null
                                                ? sectionDescription
                                                : editSectionDescription
                                            ).length
                                        }
                                        /750
                                    </span>
                                </label>

                                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
                                    <input
                                        type="checkbox"
                                        checked={
                                            editingSectionId === null
                                                ? sectionForcedSequence
                                                : editSectionForcedSequence
                                        }
                                        onChange={(event) =>
                                            editingSectionId === null
                                                ? setSectionForcedSequence(
                                                      event.target.checked,
                                                  )
                                                : setEditSectionForcedSequence(
                                                      event.target.checked,
                                                  )
                                        }
                                        className="mt-0.5 size-4 accent-emerald-800"
                                    />
                                    <span>
                                        <span className="block text-sm font-semibold text-slate-800">
                                            Force module sequence
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                                            Students must complete lessons in
                                            earlier visible modules first.
                                        </span>
                                    </span>
                                </label>

                                <div>
                                    <p className="text-sm font-semibold text-slate-700">
                                        Module image
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Choose an image to personalize the
                                        module banner.
                                    </p>
                                    {bannerPreviewUrl ||
                                    (editingSectionId !== null &&
                                        !removeSectionBanner &&
                                        sections.find(
                                            (section) =>
                                                section.id === editingSectionId,
                                        )?.banner_url) ? (
                                        <div className="relative mt-3 overflow-hidden rounded-lg border border-slate-200">
                                            <img
                                                src={
                                                    bannerPreviewUrl ??
                                                    sections.find(
                                                        (section) =>
                                                            section.id ===
                                                            editingSectionId,
                                                    )?.banner_url ??
                                                    ''
                                                }
                                                alt="Module banner preview"
                                                className="h-40 w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (
                                                        editingSectionId ===
                                                        null
                                                    ) {
                                                        setSectionBanner(null);
                                                    } else if (
                                                        editSectionBanner
                                                    ) {
                                                        setEditSectionBanner(
                                                            null,
                                                        );
                                                    } else {
                                                        setRemoveSectionBanner(
                                                            true,
                                                        );
                                                    }
                                                }}
                                                className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow hover:text-red-700"
                                            >
                                                <Trash2 className="size-3.5" />
                                                Remove image
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="mt-3 flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center hover:border-emerald-500 hover:bg-emerald-50/40">
                                            <Upload className="size-5 text-emerald-800" />
                                            <span className="mt-2 text-sm font-semibold text-slate-700">
                                                Add module image
                                            </span>
                                            <span className="mt-1 text-xs text-slate-500">
                                                PNG, JPG or WEBP up to 5 MB
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(event) => {
                                                    const file =
                                                        event.target
                                                            .files?.[0] ?? null;
                                                    if (
                                                        editingSectionId ===
                                                        null
                                                    ) {
                                                        setSectionBanner(file);
                                                    } else {
                                                        setEditSectionBanner(
                                                            file,
                                                        );
                                                        setRemoveSectionBanner(
                                                            false,
                                                        );
                                                    }
                                                    event.target.value = '';
                                                }}
                                            />
                                        </label>
                                    )}
                                    {removeSectionBanner &&
                                        editingSectionId !== null && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setRemoveSectionBanner(
                                                        false,
                                                    )
                                                }
                                                className="mt-2 text-xs font-semibold text-emerald-800 underline"
                                            >
                                                Keep current image
                                            </button>
                                        )}
                                </div>
                                {(editingSectionId === null
                                    ? sectionError
                                    : sectionUpdateError) && (
                                    <p
                                        role="alert"
                                        className="text-sm text-red-600"
                                    >
                                        {editingSectionId === null
                                            ? sectionError
                                            : sectionUpdateError}
                                    </p>
                                )}
                            </div>
                            <SheetFooter className="border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModuleEditorOpen(false)}
                                    className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        editingSectionId === null
                                            ? savingSection
                                            : savingSectionUpdate
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#174b33] px-4 text-sm font-semibold text-white hover:bg-[#103b28] disabled:opacity-60"
                                >
                                    <Save className="size-4" />
                                    {editingSectionId === null
                                        ? savingSection
                                            ? 'Creating…'
                                            : 'Create module'
                                        : savingSectionUpdate
                                          ? 'Saving…'
                                          : 'Save changes'}
                                </button>
                            </SheetFooter>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
