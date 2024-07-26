import React, { useEffect, useState } from 'react'
import {Transition} from '@headlessui/react'
import {PageProps} from '@/types'
import {useForm} from '@inertiajs/react'
import InputLabel from '@/Components/InputLabel'
import TextInput from '@/Components/TextInput'
import InputError from '@/Components/InputError'
import PrimaryButton from '@/Components/PrimaryButton'
import DangerButton from '@/Components/DangerButton'
import axios from 'axios'

interface Passkey {
    id: number;
    name: string;
}

export default function PasskeyForm({auth}: PageProps) {
    const { data, setData, post, delete: destroy, processing, recentlySuccessful, errors } = useForm({
        name: '',
        data: '',
    })

    const [passkeys, setPasskeys] = useState([]);

    useEffect(() => {
        fetchPasskeys();
    }, [passkeys]);

    const fetchPasskeys = async () => {
        const response = await axios.get('/passkeys');
        setPasskeys(response.data);
    };

    const handleRegisterPasskey = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const { data: { challenge } } = await axios.get('/passkeys/challenge');

        const publicKey: PublicKeyCredentialCreationOptions = {
            challenge: new Uint8Array(challenge.split('').map((char: string) => char.charCodeAt(0))),
            rp: {
                name: 'Sample Laravel Passkey',
            },
            user: {
                id: new Uint8Array(16),
                name: auth.user.email,
                displayName: auth.user.name,
            },
            pubKeyCredParams: [
                {
                    type: 'public-key',
                    alg: -7,
                },
            ],
        }

        try {
            const credential = await navigator.credentials.create({ publicKey })

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
                post('/passkeys', {
                    onSuccess: () => {
                        setData('name', '')
                        fetchPasskeys()
                    },
                })
            }
        } catch (error) {
            //console.error('Error during passkey registration', error)
        }
    }

    const handleDeletePasskey = async (id: number) => {
        destroy(`/passkeys/${id}`)
    }

    return (
        <div>
            <form onSubmit={handleRegisterPasskey} className="mt-6 space-y-6">
                <InputLabel htmlFor="passkey-name" value="Passkey name" />

                <TextInput
                    id="passkey-name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="mt-1 block w-full"
                />
                <PrimaryButton disabled={processing}>Register パスキー</PrimaryButton>
                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                >
                    <p className="text-sm text-gray-600">Saved.</p>
                </Transition>
                <InputError message={errors.name} className="mt-2"/>
            </form>

            <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-800">Registered Passkeys</h2>
                <ul>
                    {passkeys.map((passkey: Passkey) => (
                        <li key={passkey.id} className="mt-2 flex justify-between items-center">
                            <span>{passkey.name}</span>
                            <DangerButton
                                onClick={() => handleDeletePasskey(passkey.id)}
                                className="text-red-600 hover:text-red-900"
                            >
                                Delete
                            </DangerButton>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
