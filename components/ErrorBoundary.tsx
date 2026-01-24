import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-void flex items-center justify-center p-4">
                    <div className="bg-surface rounded-2xl p-8 max-w-md text-center border border-red-500/30">
                        <div className="text-red-400 text-6xl mb-4">⚠️</div>
                        <h1 className="text-xl font-bold text-white mb-2">
                            Něco se pokazilo
                        </h1>
                        <p className="text-text-secondary mb-4">
                            {this.state.error?.message || 'Neočekávaná chyba'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent transition-colors"
                        >
                            Obnovit stránku
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;


