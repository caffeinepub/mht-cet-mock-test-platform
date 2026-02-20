import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

// Placeholder type for Answer since it's not in backend yet
type Answer = {
  questionId: bigint;
  selectedOptionIndex: bigint;
};

export function useTestSectionMutations() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const startSection = useMutation({
    mutationFn: async ({ attemptId, sectionNumber }: { attemptId: bigint; sectionNumber: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend method not implemented yet
      throw new Error('Test attempt functionality is not yet implemented in the backend');
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
      // Backend method not implemented yet
      throw new Error('Test attempt functionality is not yet implemented in the backend');
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
