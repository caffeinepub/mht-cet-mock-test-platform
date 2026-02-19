import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Answer } from '../backend';

export function useTestSectionMutations() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const startSection = useMutation({
    mutationFn: async ({ attemptId, sectionNumber }: { attemptId: bigint; sectionNumber: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startSection(attemptId, sectionNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testAttempt'] });
    },
    onError: (error) => {
      console.error('Error starting section:', error);
    },
  });

  const submitSection = useMutation({
    mutationFn: async ({
      attemptId,
      sectionNumber,
      answers,
    }: {
      attemptId: bigint;
      sectionNumber: bigint;
      answers: Answer[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitSection(attemptId, sectionNumber, answers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testAttempt'] });
    },
    onError: (error) => {
      console.error('Error submitting section:', error);
    },
  });

  return {
    startSection,
    submitSection,
  };
}
