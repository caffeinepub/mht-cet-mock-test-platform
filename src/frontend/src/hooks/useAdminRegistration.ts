import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { RegistrationResult } from '../backend';
import { Principal } from '@dfinity/principal';

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useAdminRegistration() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalString: string) => {
      // Pre-mutation validation: Ensure actor is available before attempting registration
      if (!actor) {
        throw new Error('Backend connection not established. Please wait for the connection to be ready.');
      }

      if (actorFetching) {
        throw new Error('Backend is still initializing. Please wait a moment and try again.');
      }

      // Validate principal format
      let principal: Principal;
      try {
        principal = Principal.fromText(principalString);
      } catch (error) {
        throw new Error('Invalid principal format. Please enter a valid Internet Identity principal.');
      }

      // Retry logic with exponential backoff
      let lastError: Error | null = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Double-check actor availability before each attempt
          if (!actor) {
            throw new Error('Actor connection lost. Please refresh the page and try again.');
          }

          // Call backend registerAdmin endpoint
          const result: RegistrationResult = await actor.registerAdmin(principal);
          return { result, principal };
        } catch (error: any) {
          lastError = error;

          // Check if error is due to actor unavailability
          const isActorError =
            error.message?.includes('Actor') ||
            error.message?.includes('not available') ||
            error.message?.includes('not yet initialized') ||
            error.message?.includes('connection');

          // If it's an actor error and we have retries left, retry with backoff
          if (isActorError && attempt < maxRetries) {
            const delayMs = 1000 * (attempt + 1); // 1s, 2s
            toast.info(`Retrying connection... (attempt ${attempt + 1} of ${maxRetries})`, {
              duration: delayMs,
            });
            await delay(delayMs);
            continue;
          }

          // If it's not an actor error or we're out of retries, throw
          throw error;
        }
      }

      // If we exhausted all retries, throw the last error
      throw lastError || new Error('Failed to register admin after multiple attempts');
    },
    onSuccess: ({ result, principal }) => {
      if (result.__kind__ === 'success') {
        toast.success('Admin Registered Successfully', {
          description: `Principal ${principal.toString()} has been registered as an admin.`,
        });
        // Invalidate user role queries to refresh admin status
        queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
        queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      } else if (result.__kind__ === 'alreadyRegistered') {
        toast.info('Already Registered', {
          description: 'This principal is already registered as an admin.',
        });
      } else if (result.__kind__ === 'internalError') {
        toast.error('Internal Error', {
          description: 'An internal error occurred during registration. Please try again.',
        });
      }
      // Note: 'unauthorized' case is now handled in the component with modal dialog
    },
    onError: (error: Error) => {
      // Enhanced error handling with specific messages
      const errorMessage = error.message || 'Unknown error occurred';

      // Check for specific error patterns
      if (errorMessage.includes('Actor') || errorMessage.includes('not available') || errorMessage.includes('connection')) {
        toast.error('Connection Error', {
          description: 'Cannot connect to backend. Please ensure you are logged in and the backend is running.',
          duration: 5000,
        });
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('Only admins')) {
        // Don't show toast for authorization errors - handled by component modal
        return;
      } else if (error.name === 'NetworkError') {
        toast.error('Network Error', {
          description: 'Network error occurred. Please check your connection and try again.',
          duration: 5000,
        });
      } else if (!errorMessage.includes('Unauthorized')) {
        toast.error('Registration Failed', {
          description: errorMessage,
          duration: 5000,
        });
      }
    },
  });
}
