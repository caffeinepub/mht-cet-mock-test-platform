import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
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
        throw new Error('Actor not available. Please ensure you are logged in.');
      }

      console.log('=== CREATE QUESTION MUTATION ===');
      console.log('Actor available:', !!actor);
      
      try {
        // Verify admin status before attempting to create question
        const isAdmin = await actor.isCallerAdmin();
        console.log('Pre-flight admin check - isCallerAdmin():', isAdmin);
        
        const userRole = await actor.getCallerUserRole();
        console.log('Pre-flight admin check - getCallerUserRole():', userRole);
        
        if (!isAdmin) {
          console.error('Admin check failed - user is not an admin');
          throw new Error('You do not have admin permissions to create questions. Please log out and log back in, or contact support if the issue persists.');
        }

        console.log('Calling actor.createQuestion...');
        const questionId = await actor.createQuestion(
          input.questionText,
          input.questionImage,
          input.options,
          input.correctAnswerIndex,
          input.explanation,
          input.subject,
          input.classLevel
        );

        console.log('Question created successfully with ID:', questionId.toString());
        return questionId;
      } catch (error: any) {
        console.error('=== CREATE QUESTION ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        // Parse backend trap messages
        if (error.message && error.message.includes('Unauthorized: Only admins can create questions')) {
          console.error('Authorization failed on backend');
          throw new Error('Authorization failed: You do not have admin permissions to create questions. Please try logging out and logging back in. If the issue persists, contact support.');
        }
        
        // Re-throw with more context
        throw new Error(error.message || 'Failed to create question. Please try again.');
      }
    },
    onSuccess: (questionId) => {
      // Invalidate question-related queries
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['totalQuestions'] });
      
      toast.success('Question created successfully!', {
        description: `Question ID: ${questionId.toString()}`
      });
    },
    onError: (error: Error) => {
      console.error('Mutation onError:', error);
      toast.error('Failed to create question', {
        description: error.message
      });
    }
  });
}
