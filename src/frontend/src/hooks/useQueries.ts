import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Question, FullSyllabusTest, UserProfile, UserRole, UserRole__1 } from '../backend';

export function useGetAllQuestions() {
  const { actor, isFetching } = useActor();

  return useQuery<Question[]>({
    queryKey: ['questions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllQuestions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFullSyllabusTests() {
  const { actor, isFetching } = useActor();

  return useQuery<FullSyllabusTest[]>({
    queryKey: ['fullSyllabusTests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFullSyllabusTests();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useFullSyllabusTests = useGetFullSyllabusTests;

// Chapter-wise tests hook - returns empty array for now as backend structure differs
export function useChapterWiseTests() {
  const { actor, isFetching } = useActor();

  return useQuery<FullSyllabusTest[]>({
    queryKey: ['chapterWiseTests'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't have a separate getChapterWiseTests endpoint
      // Return empty array for now
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

// Hook to get chapter-wise test by ID
export function useChapterWiseTestById(testId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['chapterWiseTest', testId?.toString()],
    queryFn: async () => {
      if (!actor || !testId) return null;
      const result = await actor.getChapterWiseTestById(testId);
      if (result.__kind__ === 'ok') {
        return result.ok;
      }
      return null;
    },
    enabled: !!actor && !isFetching && testId !== null,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  // Return custom state that properly reflects actor dependency
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] === useGetCallerUserRole: Fetching user role ===`);
      
      if (!actor) {
        console.error(`[${timestamp}] ERROR: Actor not available`);
        throw new Error('Actor not available');
      }
      
      console.log(`[${timestamp}] Calling actor.getUserRole()...`);
      const role = await actor.getUserRole();
      console.log(`[${timestamp}] User role received: ${role}`);
      
      return role;
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Comprehensive diagnostic logging
  const timestamp = new Date().toISOString();
  if (query.data !== undefined) {
    console.log(`[${timestamp}] useGetCallerUserRole - Current role: ${query.data}`);
  }
  if (query.error) {
    console.error(`[${timestamp}] useGetCallerUserRole - Error:`, query.error);
  }

  return query;
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] === useIsCallerAdmin: Checking admin status ===`);
      
      if (!actor) {
        console.error(`[${timestamp}] ERROR: Actor not available`);
        throw new Error('Actor not available');
      }
      
      console.log(`[${timestamp}] Calling actor.isCallerAdmin()...`);
      const isAdmin = await actor.isCallerAdmin();
      console.log(`[${timestamp}] Is admin: ${isAdmin}`);
      
      return isAdmin;
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Comprehensive diagnostic logging
  const timestamp = new Date().toISOString();
  if (query.data !== undefined) {
    console.log(`[${timestamp}] useIsCallerAdmin - Current status: ${query.data}`);
  }
  if (query.error) {
    console.error(`[${timestamp}] useIsCallerAdmin - Error:`, query.error);
  }

  return query;
}
