import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { FullSyllabusTest, Question, UserProfile, TestAttempt } from '../backend';

// Full Syllabus Test Hooks
export function useFullSyllabusTests() {
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

export function useFullSyllabusTestById(testId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<FullSyllabusTest | null>({
    queryKey: ['fullSyllabusTest', testId?.toString()],
    queryFn: async () => {
      if (!actor || testId === null) return null;
      const tests = await actor.getFullSyllabusTests();
      return tests.find(test => test.testId === testId) || null;
    },
    enabled: !!actor && !isFetching && testId !== null,
  });
}

// Question Hooks
export function useAllQuestions() {
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

// User Profile Hooks
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

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

// Test Attempt Hooks
export function useTestAttemptById(attemptId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<TestAttempt | null>({
    queryKey: ['testAttempt', attemptId?.toString()],
    queryFn: async () => {
      if (!actor || attemptId === null) return null;
      return actor.getTestAttempt(attemptId);
    },
    enabled: !!actor && !isFetching && attemptId !== null,
    retry: false,
  });
}
