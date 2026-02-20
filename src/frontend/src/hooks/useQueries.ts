import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { FullSyllabusTest, Question, UserProfile, TestAttempt, ChapterWiseTestDetails, LeaderboardEntry, UserRole__1 } from '../backend';

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

// Chapter-Wise Test Hooks
export interface ChapterWiseTest {
  testId: bigint;
  testName: string;
  createdAt: bigint;
  testType: { chapterWise: null } | { fullSyllabus: null };
  isActive: boolean;
  marksPerQuestion?: bigint;
  durationMinutes?: bigint;
  sectionCount?: bigint;
  questionIds: bigint[];
}

export function useChapterWiseTests() {
  const { actor, isFetching } = useActor();

  return useQuery<ChapterWiseTest[]>({
    queryKey: ['chapterWiseTests'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't have a separate getChapterWiseTests endpoint
      // We need to filter from a unified test list or use a workaround
      // For now, return empty array - backend needs to provide this endpoint
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useChapterWiseTestById(testId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ChapterWiseTestDetails | null>({
    queryKey: ['chapterWiseTestDetails', testId?.toString()],
    queryFn: async () => {
      if (!actor || testId === null) return null;
      const result = await actor.getChapterWiseTestById(testId);
      if (result.__kind__ === 'ok') {
        return result.ok;
      }
      return null;
    },
    enabled: !!actor && !isFetching && testId !== null,
    retry: false,
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

// User Role Hook - Fixed to use correct UserRole__1 type
export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserRole__1>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const role = await actor.getCallerUserRole();
      console.log('useGetCallerUserRole - Backend returned role:', role);
      return role;
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

// Leaderboard Hook
export function useLeaderboard(testId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', testId?.toString()],
    queryFn: async () => {
      if (!actor || testId === null) return [];
      return actor.getLeaderboard(testId);
    },
    enabled: !!actor && !isFetching && testId !== null,
    retry: false,
  });
}
