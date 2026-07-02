<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChatSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'chat_enabled' => ['required', 'boolean'],
            'position' => ['required', 'in:bottom-right,bottom-left,top-right,top-left'],
            'welcome_message' => ['required', 'string', 'max:500'],
            'offline_message' => ['required', 'string', 'max:500'],
            'business_start' => ['required', 'date_format:H:i'],
            'business_end' => ['required', 'date_format:H:i'],
            'business_days' => ['required', 'array', 'min:1'],
            'business_days.*' => ['integer', 'between:1,7'],
        ];
    }
}
