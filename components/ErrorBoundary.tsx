import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center p-4">
          <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-center text-text-main dark:text-text-main-dark mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-center text-text-muted dark:text-text-muted-dark mb-6">
              L'application a rencontré un problème inattendu.
            </p>
            <div className="bg-gray-100 dark:bg-primary-light/10 rounded-lg p-4 mb-6">
              <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
                {this.state.error?.message}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
