import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary] Erreur non catchée:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen flex-col items-center justify-center gap-4 text-center px-4">
                    <p className="text-lg font-medium text-red-500">Une erreur est survenue.</p>
                    <p className="text-sm text-gray-400">{this.state.error?.message}</p>
                    <button
                        className="rounded bg-pink-600 px-4 py-2 text-sm text-white hover:bg-pink-700"
                        onClick={() => window.location.reload()}
                    >
                        Recharger la page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
