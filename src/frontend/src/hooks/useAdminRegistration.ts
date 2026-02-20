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
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] === useAdminRegistration: Starting registration ===`);
      console.log(`[${timestamp}] Principal to register: ${principalString}`);
      console.log(`[${timestamp}] Actor available: ${!!actor}`);
      console.log(`[${timestamp}] Actor fetching: ${actorFetching}`);

      // Pre-mutation validation: Ensure actor is available before attempting registration
      if (!actor) {
        console.error(`[${timestamp}] ERROR: Actor not available`);
        throw new Error('Backend connection not established. Please wait for the connection to be ready.');
      }

      if (actorFetching) {
        console.warn(`[${timestamp}] WARNING: Actor still fetching`);
        throw new Error('Backend is still initializing. Please wait a moment and try again.');
      }

      // Validate principal format
      let principal: Principal;
      try {
        principal = Principal.fromText(principalString);
        console.log(`[${timestamp}] Principal validation successful`);
      } catch (error) {
        console.error(`[${timestamp}] ERROR: Invalid principal format`, error);
        throw new Error('Invalid principal format. Please enter a valid Internet Identity principal.');
      }

      // Retry logic with exponential backoff
      let lastError: Error | null = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const attemptTimestamp = new Date().toISOString();
        console.log(`[${attemptTimestamp}] Attempt ${attempt + 1} of ${maxRetries + 1}`);
        
        try {
          // Double-check actor availability before each attempt
          if (!actor) {
            console.error(`[${attemptTimestamp}] ERROR: Actor connection lost`);
            throw new Error('Actor connection lost. Please refresh the page and try again.');
          }

          console.log(`[${attemptTimestamp}] Calling actor.registerAdmin...`);
          
          // Call backend registerAdmin endpoint
          const result: RegistrationResult = await actor.registerAdmin(principal);
          
          console.log(`[${attemptTimestamp}] Registration result:`, result);
          console.log(`[${attemptTimestamp}] Result kind: ${result.__kind__}`);
          
          if (result.__kind__ === 'success') {
            console.log(`[${attemptTimestamp}] SUCCESS: Admin registered successfully`);
            console.log(`[${attemptTimestamp}] Registered principal: ${result.success.registeredPrincipal.toString()}`);
            console.log(`[${attemptTimestamp}] Timestamp: ${result.success.timestamp}`);
          } else if (result.__kind__ === 'unauthorized') {
            console.error(`[${attemptTimestamp}] ERROR: Unauthorized - caller is not an admin`);
          } else if (result.__kind__ === 'alreadyRegistered') {
            console.warn(`[${attemptTimestamp}] WARNING: Principal already registered as admin`);
          } else if (result.__kind__ === 'internalError') {
            console.error(`[${attemptTimestamp}] ERROR: Internal error during registration`);
          }
          
          return { result, principal };
        } catch (error: any) {
          lastError = error;
          const errorTimestamp = new Date().toISOString();
          
          console.error(`[${errorTimestamp}] ERROR during registration attempt ${attempt + 1}:`, error);
          console.error(`[${errorTimestamp}] Error message: ${error.message}`);
          console.error(`[${errorTimestamp}] Error name: ${error.name}`);
          console.error(`[${errorTimestamp}] Error stack:`, error.stack);

          // Check if error is due to actor unavailability
          const isActorError =
            error.message?.includes('Actor') ||
            error.message?.includes('not available') ||
            error.message?.includes('not yet initialized') ||
            error.message?.includes('connection');

          // If it's an actor error and we have retries left, retry with backoff
          if (isActorError && attempt < maxRetries) {
            const delayMs = 1000 * (attempt + 1); // 1s, 2s
            console.log(`[${errorTimestamp}] Retrying after ${delayMs}ms...`);
            toast.info(`Retrying connection... (attempt ${attempt + 1} of ${maxRetries})`, {
              duration: delayMs,
            });
            await delay(delayMs);
            continue;
          }

          // If it's not an actor error or we're out of retries, throw
          console.error(`[${errorTimestamp}] Throwing error (no more retries or non-actor error)`);
          throw error;
        }
      }

      // If we exhausted all retries, throw the last error
      const finalTimestamp = new Date().toISOString();
      console.error(`[${finalTimestamp}] FATAL: Exhausted all retries`);
      throw lastError || new Error('Failed to register admin after multiple attempts');
    },
    onSuccess: ({ result, principal }) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] === onSuccess callback ===`);
      console.log(`[${timestamp}] Result kind: ${result.__kind__}`);
      
      if (result.__kind__ === 'success') {
        console.log(`[${timestamp}] Showing success toast`);
        toast.success('Admin Registered Successfully', {
          description: `Principal ${principal.toString()} has been registered as an admin.`,
        });
        console.log(`[${timestamp}] Invalidating user role queries...`);
        // Invalidate user role queries to refresh admin status
        queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
        queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
        console.log(`[${timestamp}] Queries invalidated`);
      } else if (result.__kind__ === 'alreadyRegistered') {
        console.log(`[${timestamp}] Showing already registered toast`);
        toast.info('Already Registered', {
          description: 'This principal is already registered as an admin.',
        });
      } else if (result.__kind__ === 'internalError') {
        console.error(`[${timestamp}] Showing internal error toast`);
        toast.error('Internal Error', {
          description: 'An internal error occurred during registration. Please try again.',
        });
      }
      // Note: 'unauthorized' case is now handled in the component with modal dialog
    },
    onError: (error: Error) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] === onError callback ===`);
      console.error(`[${timestamp}] Error:`, error);
      
      // Enhanced error handling with specific messages
      const errorMessage = error.message || 'Unknown error occurred';
      console.error(`[${timestamp}] Error message: ${errorMessage}`);

      // Check for specific error patterns
      if (errorMessage.includes('Actor') || errorMessage.includes('not available') || errorMessage.includes('connection')) {
        console.error(`[${timestamp}] Connection error detected`);
        toast.error('Connection Error', {
          description: 'Cannot connect to backend. Please ensure you are logged in and the backend is running.',
          duration: 5000,
        });
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('Only admins')) {
        console.log(`[${timestamp}] Authorization error - handled by component modal`);
        // Don't show toast for authorization errors - handled by component modal
        return;
      } else if (error.name === 'NetworkError') {
        console.error(`[${timestamp}] Network error detected`);
        toast.error('Network Error', {
          description: 'Network error occurred. Please check your connection and try again.',
          duration: 5000,
        });
      } else if (!errorMessage.includes('Unauthorized')) {
        console.error(`[${timestamp}] Generic error - showing toast`);
        toast.error('Registration Failed', {
          description: errorMessage,
          duration: 5000,
        });
      }
    },
  });
}
