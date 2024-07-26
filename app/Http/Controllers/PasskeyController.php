<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\PasskeyLoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\Passkey;
use App\Http\Requests\PasskeyStoreRequest;

class PasskeyController extends Controller
{
    public function index(): JsonResponse
    {
        $passkeys = Passkey::where('user_id', auth()->id())->get();
        return response()->json($passkeys);
    }

    public function challenge(): JsonResponse
    {
        $challenge = Str::random(32);
        session(['webauthn.challenge' => $challenge]);

        return response()->json(['challenge' => $challenge]);
    }

    public function store(
        PasskeyStoreRequest $request
    ): RedirectResponse {
        Passkey::create(
            $request->make(auth()->id())
        );

        return Redirect::route('profile.edit');
    }

    public function verify(
        PasskeyLoginRequest $request
    ): RedirectResponse {
        $passkeyData = $request->make();
        $passkey = Passkey::credentialId($passkeyData['credential_id'])->first();

        if (!$passkey) {
            throw ValidationException::withMessages(['error', 'Passkey not found']);
        }

        Auth::login($passkey->user);
        return Redirect::route('dashboard');
    }

    public function destroy(
        int $id
    ): RedirectResponse {
        $passkey = Passkey::findOrFail($id);
        if ($passkey->user_id === auth()->id()) {
            $passkey->delete();
        }
        return Redirect::route('profile.edit');
    }
}
