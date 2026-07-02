<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SendChatMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string', 'max:2000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => [
                'file',
                'mimes:jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,txt,csv,zip,rar',
                'max:5120', // 5 MB
            ],
            // JSON-encoded array of { url, name, mime, size } for media-library refs.
            'attachment_refs' => ['nullable', 'string', 'max:20000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $body = trim((string) $this->input('body', ''));

            $files = array_filter((array) $this->file('attachments', []));
            $refsJson = (string) $this->input('attachment_refs', '');
            $refs = [];
            if ($refsJson !== '') {
                $decoded = json_decode($refsJson, true);
                if (is_array($decoded)) {
                    $refs = $decoded;
                }
            }

            if ($body === '' && count($files) === 0 && count($refs) === 0) {
                $v->errors()->add('body', 'Escribe un mensaje o adjunta un archivo.');
            }

            // Cap total attachments across both sources.
            if (count($files) + count($refs) > 5) {
                $v->errors()->add('attachments', 'Máximo 5 adjuntos por mensaje (entre archivos y referencias).');
            }

            // Validate each ref entry's shape and url.
            foreach ($refs as $i => $r) {
                if (! is_array($r) || empty($r['url'])) {
                    $v->errors()->add("attachment_refs.{$i}.url", 'URL requerida.');

                    continue;
                }
                if (! is_string($r['url']) || ! preg_match('/^https?:\/\//i', $r['url'])) {
                    $v->errors()->add("attachment_refs.{$i}.url", 'URL inválida.');
                }
            }
        });
    }
}
