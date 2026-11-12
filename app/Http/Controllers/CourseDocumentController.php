<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;

class CourseDocumentController extends Controller
{
    public function store(Request $request, Course $course): RedirectResponse
    {
        abort_if($course->isComplete() && $request->user()->role !== 'admin', 403, 'Completed courses cannot be changed by instructors.');

        $blocks = $request->input('blocks', []);
        $rules = [
            'course_section_id' => [
                'required',
                'integer',
                Rule::exists('course_sections', 'id')->where('course_id', $course->id),
            ],
            'title' => ['required', 'string', 'max:150'],
            'hidden_from_students' => ['required', 'boolean'],
            'blocks' => ['required', 'array', 'min:1', 'max:30'],
            'blocks.*.type' => ['required', Rule::in(['content', 'divider', 'image', 'file'])],
            'blocks.*.content' => ['nullable', 'string', 'max:50000'],
        ];

        foreach (is_array($blocks) ? $blocks : [] as $index => $block) {
            if (! is_array($block)) {
                continue;
            }

            if (($block['type'] ?? null) === 'content') {
                $rules["blocks.{$index}.content"] = ['required', 'string', 'max:50000'];
            } elseif (($block['type'] ?? null) === 'image') {
                $rules["blocks.{$index}.file"] = ['required', 'image', 'max:5120'];
            } elseif (($block['type'] ?? null) === 'file') {
                $rules["blocks.{$index}.file"] = [
                    'required',
                    File::types(['mp4', 'webm', 'mov', 'avi', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'])
                        ->max('200mb'),
                ];
            }
        }

        $validated = $request->validate($rules);
        ksort($validated['blocks']);
        $sectionId = (int) $validated['course_section_id'];
        $storedImages = [];
        $storedFiles = [];

        try {
            $document = DB::transaction(function () use ($validated, $request, $course, $sectionId, &$storedImages, &$storedFiles): CourseDocument {
                $documentBlocks = [];

                foreach ($validated['blocks'] as $index => $block) {
                    if ($block['type'] === 'content') {
                        $documentBlocks[] = [
                            'type' => 'content',
                            'content' => $this->sanitizeRichContent($block['content']),
                        ];

                        continue;
                    }

                    if ($block['type'] === 'divider') {
                        $documentBlocks[] = ['type' => 'divider'];

                        continue;
                    }

                    $file = $block['file'];
                    if ($block['type'] === 'image') {
                        $path = $file->store("course-documents/{$course->id}", 'public');
                        if ($path === false) {
                            throw new \RuntimeException('The document image could not be stored.');
                        }
                        $storedImages[] = $path;
                        $documentBlocks[] = ['type' => 'image', 'path' => $path];

                        continue;
                    }

                    $path = $file->store("course-documents/{$course->id}", 'local');
                    if ($path === false) {
                        throw new \RuntimeException('The document attachment could not be stored.');
                    }
                    $storedFiles[] = $path;
                    $originalName = basename(str_replace('\\', '/', $file->getClientOriginalName()));
                    $title = Str::limit(preg_replace('/[\x00-\x1F\x7F]/u', '', $originalName) ?: 'Document attachment', 250, '');
                    $documentBlocks[] = [
                        'type' => 'file',
                        'path' => $path,
                        'title' => $title,
                        'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                    ];
                }

                return CourseDocument::query()->create([
                    'course_id' => $course->id,
                    'course_section_id' => $sectionId,
                    'title' => $validated['title'],
                    'hidden_from_students' => $validated['hidden_from_students'],
                    'blocks' => $documentBlocks,
                ]);
            });
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($storedImages);
            Storage::disk('local')->delete($storedFiles);

            throw $exception;
        }

        return to_route('documents.show', [$course, $document])
            ->with('success', 'Course document created.');
    }

    public function show(Request $request, Course $course, CourseDocument $document): Response|RedirectResponse
    {
        abort_unless($document->course_id === $course->id, 404);
        $user = $request->user();
        if (! $user) {
            return to_route('login');
        }

        if ($user->role === 'student') {
            abort_unless($course->studentHasAccess($user), 403, 'Enroll in this course to access its documents.');
            abort_if($document->hidden_from_students, 404);
        }

        $blocks = collect($document->blocks)->map(function (array $block, int $index) use ($course, $document): array {
            if ($block['type'] === 'content') {
                return [
                    'type' => 'content',
                    'content' => $this->sanitizeRichContent($block['content']),
                ];
            }

            if ($block['type'] === 'image') {
                return [
                    'type' => 'image',
                    'url' => Storage::disk('public')->url($block['path']),
                ];
            }

            if ($block['type'] === 'file') {
                return [
                    'type' => 'file',
                    'title' => $block['title'],
                    'url' => route('documents.files.download', [$course, $document, $index]),
                    'is_video' => str_starts_with($block['mime_type'], 'video/'),
                ];
            }

            return $block;
        })->all();

        return Inertia::render('learning/document', [
            'course' => [
                'title' => $course->title,
                'slug' => $course->slug,
            ],
            'document' => [
                'title' => $document->title,
                'hidden_from_students' => $document->hidden_from_students,
                'blocks' => $blocks,
            ],
        ]);
    }

    private function sanitizeRichContent(string $content): string
    {
        $allowedTags = [
            'a', 'b', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'font',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'li', 'ol', 'p',
            'pre', 's', 'span', 'strike', 'strong', 'sub', 'sup', 'table',
            'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
        ];
        $removedTags = ['audio', 'embed', 'iframe', 'object', 'script', 'style', 'svg', 'video'];
        $previousErrorSetting = libxml_use_internal_errors(true);
        $document = new \DOMDocument('1.0', 'UTF-8');

        try {
            $document->loadHTML(
                '<?xml encoding="UTF-8"><!doctype html><html><body><div id="rich-content">'.$content.'</div></body></html>',
                LIBXML_NONET | LIBXML_HTML_NODEFDTD,
            );
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previousErrorSetting);
        }

        $container = (new \DOMXPath($document))->query('//*[@id="rich-content"]')->item(0);
        if (! $container) {
            return '';
        }

        $sanitizeChildren = function (\DOMNode $parent) use (&$sanitizeChildren, $allowedTags, $removedTags): void {
            foreach (iterator_to_array($parent->childNodes) as $child) {
                if (! $child instanceof \DOMElement) {
                    continue;
                }

                $tag = strtolower($child->tagName);
                if (in_array($tag, $removedTags, true)) {
                    $parent->removeChild($child);

                    continue;
                }

                $sanitizeChildren($child);
                if (! in_array($tag, $allowedTags, true)) {
                    while ($child->firstChild) {
                        $parent->insertBefore($child->firstChild, $child);
                    }
                    $parent->removeChild($child);

                    continue;
                }

                foreach (iterator_to_array($child->attributes) as $attribute) {
                    $name = strtolower($attribute->name);
                    $value = trim($attribute->value);
                    $keep = false;

                    if ($name === 'href' && $tag === 'a') {
                        $scheme = parse_url($value, PHP_URL_SCHEME);
                        $keep = $value !== ''
                            && ! str_starts_with($value, '//')
                            && ($scheme === null || (is_string($scheme) && in_array(strtolower($scheme), ['http', 'https', 'mailto'], true)));
                    } elseif ($name === 'title') {
                        $keep = true;
                    } elseif ($name === 'face' && $tag === 'font') {
                        $keep = preg_match('/^[a-z0-9 ,_-]{1,100}$/i', $value) === 1;
                    } elseif ($name === 'size' && $tag === 'font') {
                        $keep = preg_match('/^[1-7]$/', $value) === 1;
                    } elseif (in_array($name, ['colspan', 'rowspan'], true) && in_array($tag, ['td', 'th'], true)) {
                        $keep = preg_match('/^[1-9][0-9]{0,2}$/', $value) === 1;
                    } elseif ($name === 'style') {
                        $safeStyles = [];
                        foreach (explode(';', $value) as $declaration) {
                            if (! str_contains($declaration, ':')) {
                                continue;
                            }

                            [$property, $styleValue] = array_map('trim', explode(':', $declaration, 2));
                            $property = strtolower($property);
                            $styleValue = strtolower($styleValue);
                            if ($property === 'text-align' && in_array($styleValue, ['left', 'center', 'right', 'justify'], true)) {
                                $safeStyles[] = "{$property}: {$styleValue}";
                            } elseif (in_array($property, ['color', 'background-color'], true)
                                && preg_match('/^(#[0-9a-f]{3,8}|[a-z]{3,20}|rgba?\([0-9\s.,%]+\))$/i', $styleValue) === 1) {
                                $safeStyles[] = "{$property}: {$styleValue}";
                            } elseif ($property === 'font-size'
                                && preg_match('/^[0-9.]{1,6}(px|pt|em|rem|%)$/', $styleValue) === 1) {
                                $safeStyles[] = "{$property}: {$styleValue}";
                            } elseif ($property === 'font-family'
                                && preg_match('/^[a-z0-9 ,_"\'-]{1,100}$/i', $styleValue) === 1) {
                                $safeStyles[] = "{$property}: {$styleValue}";
                            }
                        }
                        if ($safeStyles !== []) {
                            $child->setAttribute('style', implode('; ', $safeStyles));
                            continue;
                        }
                    }

                    if (! $keep) {
                        $child->removeAttributeNode($attribute);
                    }
                }
            }
        };

        $sanitizeChildren($container);

        $result = '';
        foreach ($container->childNodes as $child) {
            $result .= $document->saveHTML($child);
        }

        return $result;
    }

    public function download(Request $request, Course $course, CourseDocument $document, int $index): StreamedResponse
    {
        abort_unless($document->course_id === $course->id, 404);
        $user = $request->user();
        if ($user->role === 'student') {
            abort_unless($course->studentHasAccess($user), 403, 'Enroll in this course to access its documents.');
            abort_if($document->hidden_from_students, 404);
        }

        $block = $document->blocks[$index] ?? null;
        abort_unless(is_array($block) && ($block['type'] ?? null) === 'file', 404);
        abort_unless(Storage::disk('local')->exists($block['path']), 404);

        $inline = str_starts_with($block['mime_type'], 'video/');
        $response = Storage::disk('local')->response(
            $block['path'],
            basename(str_replace('\\', '/', $block['title'])),
            [
                'Content-Type' => $block['mime_type'],
                'X-Content-Type-Options' => 'nosniff',
            ],
        );
        $response->headers->set(
            'Content-Disposition',
            $response->headers->makeDisposition(
                $inline ? 'inline' : 'attachment',
                basename(str_replace('\\', '/', $block['title'])),
            ),
        );

        return $response;
    }
}
