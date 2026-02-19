# Specification

## Summary
**Goal:** Implement a comprehensive result page that displays test scores, performance statistics, and a detailed question-by-question review with explanations.

**Planned changes:**
- Update ResultPage to fetch test attempt data using attemptId from URL parameters
- Display overall score summary with total score, individual section scores, time taken, and performance indicator
- Show detailed statistics for each section (total questions, attempted, correct, incorrect, unanswered)
- Implement question review section displaying all questions with options, user's answer highlighted, correct answer indicated, and visual feedback (green checkmark/red cross)
- Display explanation text below each question's options
- Add "Back to Dashboard" button to navigate to StudentDashboard
- Add "View Leaderboard" button to navigate to Leaderboard page with testId parameter

**User-visible outcome:** Students can view their complete test results including scores, performance metrics, and review all questions with their answers, correct answers, and explanations. They can navigate back to the dashboard or view the leaderboard.
