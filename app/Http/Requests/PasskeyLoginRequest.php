<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class PasskeyLoginRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'data' => 'required|json',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $challenge = session('webauthn.challenge');
            session('webauthn.challenge', null);

            $data = $this->make();
            $clientDataJSON = implode('', array_map('chr', $data['data']));
            $clientData = json_decode($clientDataJSON, false, 2048, JSON_THROW_ON_ERROR);

            if ($clientData->challenge !== $challenge) {
                $validator->errors()->add('data', 'Invalid challenge');
            }
        });
    }

    public function make(): array
    {
        $input = $this->validated();
        $passkeyData = json_decode($input['data'], false, 2048, JSON_THROW_ON_ERROR);
        return [
            'credential_id' => $passkeyData->id,
            'data' => $passkeyData->response->clientDataJSON,
        ];
    }
}
