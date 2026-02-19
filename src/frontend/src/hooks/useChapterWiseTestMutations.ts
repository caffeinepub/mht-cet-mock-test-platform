import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

export function useCreateChapterWiseTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testName,
      marksPerQuestion,
      durationMinutes,
    }: {
      testName: string;
      marksPerQuestion: number;
      durationMinutes: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createChapterWiseTest(
        testName,
        BigInt(marksPerQuestion),
        BigInt(durationMinutes)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapterWiseTests'] });
      queryClient.invalidateQueries({ queryKey: ['fullSyllabusTests'] });
    },
    onError: (error) => {
      console.error('Error creating chapter-wise test:', error);
    },
  });
}

export function useAssignQuestionsToChapterWiseTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      questionIds,
    }: {
      testId: bigint;
      questionIds: bigint[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignQuestionsToChapterWiseTest(testId, questionIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapterWiseTests'] });
      queryClient.invalidateQueries({ queryKey: ['fullSyllabusTests'] });
    },
    onError: (error) => {
      console.error('Error assigning questions to chapter-wise test:', error);
    },
  });
}
