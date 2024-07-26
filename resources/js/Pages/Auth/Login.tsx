import React, {FormEventHandler, useState} from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import {Transition} from "@headlessui/react";
import axios from "axios";

export default function Login({ status, canResetPassword }: { status?: string, canResetPassword: boolean }) {
    const [passkeyErrorMessage, setPassKeyErrorMessage] = useState('')
    const { data, setData, post, processing, recentlySuccessful,  errors, reset } = useForm({
        data: '',
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const handleLoginWithPasskey = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const { data: { challenge } } = await axios.get('/passkeys/challenge');

        const publicKey = {
            challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
            timeout: 60000,
        }

        try {
            const credential = await navigator.credentials.get({ publicKey })

            if (credential) {
                const publicKeyCredential = credential as PublicKeyCredential
                const authResponse = publicKeyCredential.response as AuthenticatorAttestationResponse

                const response = {
                    id: publicKeyCredential.id,
                    rawId: Array.from(new Uint8Array(publicKeyCredential.rawId)),
                    type: publicKeyCredential.type,
                    response: {
                        clientDataJSON: Array.from(new Uint8Array(authResponse.clientDataJSON)),
                        attestationObject: Array.from(new Uint8Array(authResponse.attestationObject)),
                    },
                }
                data['data'] = JSON.stringify(response)
                post('/login/passkeys', {
                    onSuccess: () => {
                        window.location.href = '/dashboard'
                    },
                    onError: (e: {[key: number]: string}) => setPassKeyErrorMessage(e[1])
                })
            }
        } catch (error) {
            console.error('Error during passkey registration', error)
        }
    }

    return (
        <GuestLayout>
            <Head title="Log in"/>

            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email"/>

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2"/>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password"/>

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2"/>
                </div>

                <div className="block mt-4">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="ms-2 text-sm text-gray-600">Remember me</span>
                    </label>
                </div>

                <div className="flex items-center justify-end mt-4">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Log in
                    </PrimaryButton>
                </div>
            </form>
            <form onSubmit={handleLoginWithPasskey} className="mt-6 space-y-6">
                <PrimaryButton disabled={processing}>Login with Passkey</PrimaryButton>
                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                >
                    <p className="text-sm text-gray-600">Logged in.</p>
                </Transition>
                <InputError message={passkeyErrorMessage} className="mt-2"/>
            </form>
        </GuestLayout>
    );
}
