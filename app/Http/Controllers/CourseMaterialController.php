<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseMaterial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
        ]);
        $file = $validated['file'];
        $path = $file->store("course-materials/{$course->id}", 'local');

        if ($path === false) {
            throw new \RuntimeException('The course material could not be stored.');
        }

        $originalName = basename(str_replace('\\', '/', $file->getClientOriginalName()));

        $course->materials()->create([
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

        if (! Storage::disk('local')->delete($material->path)) {
            throw new \RuntimeException('The course material file could not be removed.');
        }

        $material->delete();

        return back()->with('success', 'Course material removed.');
    }

    public function download(Request $request, CourseMaterial $material): StreamedResponse
    {
        $user = $request->user();
        if ($user->role === 'student') {
            abort_unless($material->course->studentHasAccess($user), 403, 'Enroll in this open course to access its materials.');
        }

        abort_unless(Storage::disk('local')->exists($material->path), 404);

        $inline = str_starts_with($material->mime_type, 'video/');

        $response = Storage::disk('local')->response(
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
