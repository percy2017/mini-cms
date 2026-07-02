<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class GenerateImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'prompt' => ['required', 'string', 'max:1500'],
            'mode' => ['required', 'in:text-to-image,image-to-image'],
            'aspect_ratio' => ['nullable', 'in:1:1,16:9,4:3,3:2,2:3,3:4,9:16,21:9'],
            'n' => ['nullable', 'integer', 'min:1', 'max:4'],
            'seed' => ['nullable', 'integer'],
            'prompt_optimizer' => ['nullable', 'boolean'],
            'model' => ['nullable', 'in:image-01,image-01-live'],
            'reference_image_id' => ['nullable', 'integer', 'exists:media,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'prompt.required' => 'El prompt es obligatorio.',
            'prompt.max' => 'El prompt no puede superar los 1500 caracteres.',
            'reference_image_id.exists' => 'La imagen de referencia no existe.',
        ];
    }
}
