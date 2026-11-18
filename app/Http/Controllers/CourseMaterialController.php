<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseMaterialController extends Controller
{
    public function store(Request $request, Course $course): RedirectResponse
    {
        abort_if($course->isComplete() && $request->user()->role !== 'admin', 403, 'Completed courses cannot be changed by instructors.');

        $validated = $request->validate([
            'file' => [
                'required',
                File::types(['mp4', 'webm', 'mov', 'avi', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'])
                    ->max('200mb'),
            ],
            'course_section_id' => [
                'nullable',
                'integer',
                Rule::exists('course_sections', 'id')->where('course_id', $course->id),
            ],
        ]);
        $file = $validated['file'];
        $disk = config('filesystems.media_private_disk');
        $path = $file->store("course-materials/{$course->id}", $disk);

        if ($path === false) {
            throw new \RuntimeException('The course material could not be stored.');
        }

        $originalName = basename(str_replace('\\', '/', $file->getClientOriginalName()));

        $course->materials()->create([
            'course_section_id' => $validated['course_section_id'] ?? null,
            'uploaded_by' => $request->user()->id,
            'title' => Str::limit(preg_replace('/[\x00-\x1F\x7F]/u', '', $originalName) ?: 'Course material', 250, ''),
            'path' => $path,
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize(),
        ]);

        return back()->with('success', 'Course material uploaded.');
    }

    public function destroy(Request $request, CourseMaterial $material): RedirectResponse
    {
        abort_if($material->course->isComplete() && $request->user()->role !== 'admin', 403, 'Completed courses cannot be changed by instructors.');

        if (! Storage::disk(config('filesystems.media_private_disk'))->delete($material->path)) {
            throw new \RuntimeException('The course material file could not be removed.');
        }

        $material->delete();

        return back()->with('success', 'Course material removed.');
    }

    public function download(Request $request, CourseMaterial $material): RedirectResponse|StreamedResponse
    {
        $user = $request->user();
        if ($user->role === 'student') {
            abort_unless($material->course->studentHasAccess($user), 403, 'Enroll in this open course to access its materials.');
        }

        $disk = Storage::disk(config('filesystems.media_private_disk'));
        abort_unless($disk->exists($material->path), 404);

        if (config('filesystems.media_private_disk') === 'r2_private') {
            return redirect()->away($disk->temporaryUrl($material->path, now()->addMinutes(10), [
                'ResponseContentType' => $material->mime_type,
                'ResponseContentDisposition' => (str_starts_with($material->mime_type, 'video/') ? 'inline' : 'attachment').'; filename="'.addcslashes(basename(str_replace('\\', '/', $material->title)), '"\\').'"',
            ]));
        }

        $inline = str_starts_with($material->mime_type, 'video/');

        $response = $disk->response(
            $material->path,
            basename(str_replace('\\', '/', $material->title)),
            [
                'Content-Type' => $material->mime_type,
                'X-Content-Type-Options' => 'nosniff',
            ],
        );
        $response->headers->set(
            'Content-Disposition',
            $response->headers->makeDisposition(
                $inline ? 'inline' : 'attachment',
                basename(str_replace('\\', '/', $material->title)),
            ),
        );

        return $response;
    }
}
