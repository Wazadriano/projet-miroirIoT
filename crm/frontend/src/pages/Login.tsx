import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Moon, Sun } from 'lucide-react';

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleDark } = useDarkMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);
    try {
      const res = await api<{ message: string }>('forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotMessage(res.message);
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email); // pre-fill with login email
    setForgotMessage('');
    setForgotError('');
    setShowForgot(true);
  };

  // Redirect if already logged in
  if (user && !authLoading) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-offwhite px-4">
      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        className="fixed top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-primary dark:hover:text-primary-light hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={isDark ? 'Mode clair' : 'Mode sombre'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/logo-kbeauty.svg"
          alt="K Beauty Cosmetics"
          className="w-[280px] max-w-full h-auto"
        />
      </div>

      {/* Login card */}
      <div className="w-full max-w-lg rounded-2xl border border-primary-light bg-white px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="Email"
              required
              autoFocus
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Mot de passe"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base rounded-lg"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          <div>
            <button
              type="button"
              onClick={openForgotModal}
              className="text-sm text-gray-600 dark:text-gray-400 underline hover:text-primary dark:hover:text-primary-light"
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>
      </div>

      {/* Forgot password modal */}
      <Modal open={showForgot} onClose={() => setShowForgot(false)} title="Mot de passe oublié">
        {forgotMessage ? (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3">
              {forgotMessage}
            </div>
            <p className="text-sm text-gray-600">
              Si un compte existe avec cette adresse, vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
            </p>
            <button
              onClick={() => setShowForgot(false)}
              className="btn-primary w-full py-2"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-gray-600">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
            {forgotError && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{forgotError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="input"
                placeholder="votre@email.com"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={forgotLoading}
              className="btn-primary w-full py-2"
            >
              {forgotLoading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
