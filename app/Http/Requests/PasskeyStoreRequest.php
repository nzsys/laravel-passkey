<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PasskeyStoreRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string',
            'data' => 'required|json',
        ];
    }

    public function make(
        int $userId
    ): array {
        $input = $this->validated();
        $passkeyData = json_decode($input['data'], false, 2048, JSON_THROW_ON_ERROR);
        return [
            'user_id' => $userId,
            'name' => $input['name'],
            'credential_id' => $passkeyData->id,
            'data' => $passkeyData->response,
        ];
    }
}
