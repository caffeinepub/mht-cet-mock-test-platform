// Placeholder types for missing backend types
type TestAttempt = {
  attemptId: bigint;
  testId: bigint;
  userId: string;
  section1Score: bigint;
  section2Score: bigint;
  totalScore: bigint;
  section1Answers: Array<{ questionId: bigint; selectedOptionIndex: bigint }>;
  section2Answers: Array<{ questionId: bigint; selectedOptionIndex: bigint }>;
};

import type { FullSyllabusTest, ChapterWiseTestDetails, UserProfile, Question } from '../backend';

/**
 * PDF Export Utility - Currently Disabled
 * 
 * This utility is disabled because the backend test attempt functionality
 * is not yet implemented. Once the backend supports test attempts, this
 * utility can be re-enabled to generate PDF reports of test results.
 */

export async function generateResultPDF(
  attempt: TestAttempt,
  test: FullSyllabusTest | null,
  chapterTest: ChapterWiseTestDetails | null,
  userProfile: UserProfile | null,
  allQuestions: Question[]
): Promise<void> {
  console.warn('PDF export is not yet available - backend test attempt functionality is under development');
  alert('PDF export feature is coming soon! The backend is still being developed.');
}
