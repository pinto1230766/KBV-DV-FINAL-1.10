import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook pour gérer les actions asynchrones avec loading et gestion d'erreurs
 */
export const useAsyncAction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const execute = useCallback(async <T>(
    action: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    try {
      const result = await action();
      if (options?.successMessage) {
        addToast(options.successMessage, 'success');
      }
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMsg = options?.errorMessage || 'Une erreur est survenue';
      addToast(errorMsg, 'error');
      options?.onError?.(error as Error);
      console.error('Async action error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  return { isLoading, execute };
};
