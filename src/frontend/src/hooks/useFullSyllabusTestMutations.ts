import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

interface CreateFullSyllabusTestInput {
  testName: string;
}

interface AssignQuestionsToTestInput {
  testId: bigint;
  section1QuestionIds: bigint[];
  section2QuestionIds: bigint[];
}

export function useFullSyllabusTestMutations() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const createFullSyllabusTest = useMutation({
    mutationFn: async (input: CreateFullSyllabusTestInput) => {
      if (!actor) {
        throw new Error('Actor not available');
      }

      const testId = await actor.createFullSyllabusTest(input.testName);
      return testId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fullSyllabusTests'] });
    },
  });

  const assignQuestionsToTest = useMutation({
    mutationFn: async (input: AssignQuestionsToTestInput) => {
      if (!actor) {
        throw new Error('Actor not available');
      }

      await actor.assignQuestionsToTest(
        input.testId,
        input.section1QuestionIds,
        input.section2QuestionIds
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fullSyllabusTests'] });
    },
  });

  return {
    createFullSyllabusTest,
    assignQuestionsToTest,
  };
}
