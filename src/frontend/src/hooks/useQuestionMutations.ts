import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Subject, ClassLevel } from '../backend';

// Import the Option type from backend - it's the question option type
import type { backendInterface } from '../backend';

// Extract the Option type from the createQuestion method signature
type QuestionOption = {
  optionText?: string;
  optionImage?: string;
};

interface CreateQuestionInput {
  questionText: string | null;
  questionImage: string | null;
  options: QuestionOption[];
  correctAnswerIndex: bigint;
  explanation: string | null;
  subject: Subject;
  classLevel: ClassLevel;
}

export function useCreateQuestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateQuestionInput) => {
      if (!actor) {
        throw new Error('Actor not available');
      }

      const questionId = await actor.createQuestion(
        input.questionText,
        input.questionImage,
        input.options,
        input.correctAnswerIndex,
        input.explanation,
        input.subject,
        input.classLevel
      );

      return questionId;
    },
    onSuccess: () => {
      // Invalidate question-related queries
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['totalQuestions'] });
    },
  });
}
