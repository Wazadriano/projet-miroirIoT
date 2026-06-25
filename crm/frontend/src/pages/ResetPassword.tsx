import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const tokenParam = searchParams.get('token') || '';
    const emailParam = searchParams.get('email') || '';

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!tokenParam || !emailParam) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-offwhite px-4">
                <div className="mb-10">
                    <img src="/logo-kbeauty.svg" alt="K Beauty Cosmetics" className="w-[480px] max-w-full h-auto" />
                </div>
                <div className="w-full max-w-lg rounded-2xl border border-primary-light bg-white px-8 py-8 text-center">
                    <p className="text-red-600 text-sm mb-4">Lien invalide. Veuillez refaire une demande depuis la page de connexion.</p>
                    <button onClick={() => navigate('/login')} className="btn-primary py-2 px-6">
                        Retour à la connexion
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        if (password !== passwordConfirmation) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        try {
            await api<{ message: string }>('reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    email: emailParam,
                    token: tokenParam,
                    password,
                    password_confirmation: passwordConfirmation,
                }),
            });
            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-offwhite px-4">
            <div className="mb-10">
                <img src="/logo-kbeauty.svg" alt="K Beauty Cosmetics" className="w-[480px] max-w-full h-auto" />
            </div>

            <div className="w-full max-w-lg rounded-2xl border border-primary-light bg-white px-8 py-8">
                {success ? (
                    <div className="space-y-4 text-center">
                        <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3">
                            Mot de passe modifié avec succès !
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn-primary w-full py-3 text-base rounded-lg"
                        >
                            Se connecter
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <h2 className="text-lg font-semibold text-dark text-center">
                            Nouveau mot de passe
                        </h2>
                        <p className="text-sm text-gray-600 text-center">
                            Pour le compte <strong>{emailParam}</strong>
                        </p>
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-dark mb-1">Nouveau mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="Minimum 8 caractères"
                                required
                                autoFocus
                                minLength={8}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark mb-1">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                className="input"
                                placeholder="Répétez le mot de passe"
                                required
                                minLength={8}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 text-base rounded-lg"
                        >
                            {loading ? 'Modification…' : 'Modifier le mot de passe'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
