import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { RegistrationResult } from '../backend';
import { Principal } from '@dfinity/principal';

export function useAdminRegistration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalString: string) => {
      if (!actor) {
        throw new Error('Actor not available');
      }

      // Validate principal format
      let principal: Principal;
      try {
        principal = Principal.fromText(principalString);
      } catch (error) {
        throw new Error('Invalid principal format. Please enter a valid Internet Identity principal.');
      }

      // Call backend registerAdmin endpoint
      const result: RegistrationResult = await actor.registerAdmin(principal);

      return { result, principal };
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
      // Only show toast for non-authorization errors
      if (!error.message.includes('Unauthorized')) {
        toast.error('Registration Failed', {
          description: error.message || 'Failed to register admin. Please try again.',
        });
      }
    },
  });
}
