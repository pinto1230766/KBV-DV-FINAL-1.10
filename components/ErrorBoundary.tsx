import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';
import { analytics } from '../utils/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log l'erreur
    logger.error('Erreur React capturée par ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    // Envoyer à analytics
    analytics.track('react_error', {
      error_message: error.message,
      error_name: error.name,
      component_stack: errorInfo.componentStack?.split('\n')[1] || 'unknown'
    });

    // Callback personnalisé
    this.props.onError?.(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-light dark:bg-dark flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Une erreur s'est produite
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                L'application a rencontré une erreur inattendue. Vous pouvez essayer de recharger la page ou réessayer.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Détails de l'erreur (développement)
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                      Stack trace
                    </summary>
                    <pre className="text-xs text-red-700 dark:text-red-300 mt-1 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
              >
                Réessayer
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Recharger la page
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Si le problème persiste, contactez le support technique.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook pour capturer les erreurs dans les composants fonctionnels
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    logger.error('Erreur capturée par useErrorHandler', error, errorInfo);
    analytics.track('manual_error', {
      error_message: error.message,
      error_name: error.name
    });
  };
}

// Composant d'erreur spécialisé pour les opérations de données
export function DataErrorBoundary({ children, onError }: { children: ReactNode; onError?: (error: Error) => void }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        onError?.(error);
      }}
      fallback={
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Erreur de données
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Une erreur s'est produite lors du traitement des données. Veuillez réessayer.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}