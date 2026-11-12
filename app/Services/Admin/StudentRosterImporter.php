<?php

namespace App\Services\Admin;

use App\Exceptions\GraphMailException;
use App\Mail\StudentCredentialsMail;
use App\Models\User;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon as IlluminateCarbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use OpenSpout\Common\Exception\IOException;
use OpenSpout\Reader\Exception\ReaderException;
use OpenSpout\Reader\XLSX\Reader;

class StudentRosterImporter
{
    public function __construct(private readonly TemporaryPasswordGenerator $passwordGenerator) {}

    /**
     * The workbook's required column titles and their user-record fields.
     *
     * @var array<string, string>
     */
    private const HEADERS = [
        'STUDENT NO.' => 'student_no',
        'LAST NAME' => 'last_name',
        'FIRST NAME' => 'first_name',
        'MIDDLE NAME' => 'middle_name',
        'DATE ENROLLED' => 'date_enrolled',
        'STATUS' => 'status',
        'MODALITY' => 'modality',
        'CLASS ID' => 'class_id',
        'SUBJECT' => 'subject',
        'SECTION' => 'section',
        'SCHEDULE' => 'schedule',
        'O365 EMAIL' => 'o365_email',
        'DISPLAY NAME' => 'display_name',
    ];

    /**
     * @return array{imported: int, emailed: int, duplicates: int, invalid: int, email_failures: int, issues: list<string>}
     */
    public function import(UploadedFile $file, GraphMailService $graphMail): array
    {
        $graphMail->assertReady();

        $reader = new Reader;
        $report = [
            'imported' => 0,
            'emailed' => 0,
            'duplicates' => 0,
            'invalid' => 0,
            'email_failures' => 0,
            'issues' => [],
        ];
        $seenEmails = [];
        $seenStudentNumbers = [];

        try {
            $reader->open($file->getRealPath());
            $sheets = $reader->getSheetIterator();
            $sheets->rewind();

            if (! $sheets->valid()) {
                throw ValidationException::withMessages(['file' => 'The workbook does not contain a worksheet.']);
            }

            $rows = $sheets->current()->getRowIterator();
            $columnIndexes = null;
            $rowNumber = 0;

            foreach ($rows as $row) {
                $rowNumber++;
                $values = $row->toArray();

                if ($columnIndexes === null) {
                    $columnIndexes = $this->headerIndexes($values);

                    continue;
                }

                $record = $this->recordFromRow($values, $columnIndexes);

                if ($this->isBlankRow($record)) {
                    continue;
                }

                $record['o365_email'] = strtolower(trim((string) $record['o365_email']));
                $validation = Validator::make($record, [
                    'first_name' => ['required', 'string', 'max:255'],
                    'last_name' => ['required', 'string', 'max:255'],
                    'middle_name' => ['nullable', 'string', 'max:255'],
                    'date_enrolled' => ['nullable', 'date'],
                    'status' => ['nullable', 'string', 'max:255'],
                    'modality' => ['nullable', 'string', 'max:255'],
                    'class_id' => ['nullable', 'string', 'max:255'],
                    'subject' => ['nullable', 'string', 'max:255'],
                    'section' => ['nullable', 'string', 'max:255'],
                    'schedule' => ['nullable', 'string', 'max:255'],
                    'o365_email' => ['required', 'email', 'max:255'],
                    'display_name' => ['nullable', 'string', 'max:255'],
                    'student_no' => ['nullable', 'string', 'max:255'],
                ]);

                if ($validation->fails()) {
                    $report['invalid']++;
                    $this->addIssue($report, "Row {$rowNumber}: ".implode(' ', $validation->errors()->all()));

                    continue;
                }

                $studentNo = trim((string) ($record['student_no'] ?? ''));
                $duplicateEmail = isset($seenEmails[$record['o365_email']])
                    || User::query()->whereRaw('LOWER(email) = ?', [$record['o365_email']])->exists();
                $duplicateStudentNo = $studentNo !== ''
                    && (isset($seenStudentNumbers[$studentNo])
                        || User::query()->where('student_no', $studentNo)->exists());

                if ($duplicateEmail || $duplicateStudentNo) {
                    $report['duplicates']++;
                    $duplicateField = $duplicateEmail ? $record['o365_email'] : "student number {$studentNo}";
                    $this->addIssue($report, "Row {$rowNumber}: {$duplicateField} already has an account or appears more than once.");
                    $seenEmails[$record['o365_email']] = true;
                    if ($studentNo !== '') {
                        $seenStudentNumbers[$studentNo] = true;
                    }

                    continue;
                }

                $seenEmails[$record['o365_email']] = true;
                if ($studentNo !== '') {
                    $seenStudentNumbers[$studentNo] = true;
                }
                $temporaryPassword = $this->passwordGenerator->generate();
                $name = implode(' ', array_filter([
                    trim((string) $record['first_name']),
                    trim((string) ($record['middle_name'] ?? '')),
                    trim((string) $record['last_name']),
                ]));

                $user = new User;
                foreach ($record as $field => $value) {
                    $user->setAttribute($field, $value);
                }
                $user->name = $name;
                $user->email = $record['o365_email'];
                $user->role = 'student';
                $user->password = $temporaryPassword;
                $user->email_verified_at = IlluminateCarbon::now();
                $user->must_change_password = true;
                $user->save();
                $report['imported']++;

                try {
                    $email = new StudentCredentialsMail(
                        $user->name,
                        $user->email,
                        $temporaryPassword,
                        url('/'),
                    );
                    $graphMail->send(
                        $user->email,
                        'Your University of the Visayas learning account',
                        $email->render(),
                    );
                    $report['emailed']++;
                } catch (GraphMailException $exception) {
                    Log::warning('Unable to email imported student credentials.', [
                        'user_id' => $user->id,
                        'exception' => $exception->getMessage(),
                    ]);
                    $report['email_failures']++;
                    $this->addIssue($report, "Row {$rowNumber}: account created, but credentials could not be emailed to {$user->email}.");
                }
            }

            if ($columnIndexes === null) {
                throw ValidationException::withMessages(['file' => 'The workbook is empty.']);
            }
        } catch (IOException|ReaderException $exception) {
            Log::warning('Unable to read student roster workbook.', ['exception' => $exception->getMessage()]);

            throw ValidationException::withMessages(['file' => 'The uploaded file could not be read as a valid Excel workbook.']);
        } finally {
            $reader->close();
        }

        return $report;
    }

    /**
     * @param  array<array-key, mixed>  $values
     * @return array<string, int>
     */
    private function headerIndexes(array $values): array
    {
        $normalizedHeaders = [];
        foreach ($values as $index => $value) {
            $normalizedHeaders[$this->normalizeHeader($this->cellString($value))] = (int) $index;
        }

        $indexes = [];
        $missing = [];
        foreach (self::HEADERS as $header => $field) {
            $normalized = $this->normalizeHeader($header);
            if (! array_key_exists($normalized, $normalizedHeaders)) {
                $missing[] = $header;

                continue;
            }
            $indexes[$field] = $normalizedHeaders[$normalized];
        }

        if ($missing !== []) {
            throw ValidationException::withMessages([
                'file' => 'Missing required spreadsheet columns: '.implode(', ', $missing).'.',
            ]);
        }

        return $indexes;
    }

    /**
     * @param  array<array-key, mixed>  $values
     * @param  array<string, int>  $columnIndexes
     * @return array<string, string|null>
     */
    private function recordFromRow(array $values, array $columnIndexes): array
    {
        $record = [];
        foreach ($columnIndexes as $field => $index) {
            $value = $values[$index] ?? null;
            if ($field === 'date_enrolled') {
                $record[$field] = $this->dateValue($value);

                continue;
            }
            $string = trim($this->cellString($value));
            $record[$field] = $string === '' ? null : $string;
        }

        return $record;
    }

    private function dateValue(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        if (is_numeric($value) && (float) $value >= 1 && (float) $value <= 2958465) {
            return Carbon::create(1899, 12, 30)->addDays((int) $value)->format('Y-m-d');
        }

        try {
            return Carbon::parse((string) $value)->format('Y-m-d');
        } catch (\Exception) {
            return (string) $value;
        }
    }

    private function cellString(mixed $value): string
    {
        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d');
        }
        if (is_scalar($value)) {
            return (string) $value;
        }

        return '';
    }

    private function normalizeHeader(string $header): string
    {
        return preg_replace('/[^A-Z0-9]/', '', strtoupper(trim($header))) ?? '';
    }

    /**
     * @param  array<string, string|null>  $record
     */
    private function isBlankRow(array $record): bool
    {
        foreach ($record as $value) {
            if ($value !== null && $value !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array{imported: int, emailed: int, duplicates: int, invalid: int, email_failures: int, issues: list<string>}  $report
     */
    private function addIssue(array &$report, string $issue): void
    {
        if (count($report['issues']) < 100) {
            $report['issues'][] = $issue;

            return;
        }

        if (count($report['issues']) === 100) {
            $report['issues'][] = 'Additional row issues are not shown in this report.';
        }
    }
}
