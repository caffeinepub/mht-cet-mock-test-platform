# Specification

## Summary
**Goal:** Implement Full Syllabus Mock Test structure with two-section format (Section 1: Physics+Chemistry, Section 2: Maths) including admin creation interface and student test listing.

**Planned changes:**
- Add Motoko data model for Full Syllabus Tests with two pre-configured sections (Section 1: 90min Physics+Chemistry at 1 mark each, Section 2: 90min Maths at 2 marks each)
- Implement stable storage for Full Syllabus Tests persisting across canister upgrades
- Create backend API endpoints: createFullSyllabusTest (admin-only), getFullSyllabusTests, assignQuestionsToTest (admin-only)
- Add React Query hooks for fetching tests and mutations for creating tests and assigning questions
- Create admin Full Syllabus Test creation page with test name input and two question selection sections filtered by subject
- Add route '/admin/tests/full-syllabus/create' with admin authentication guard
- Add 'Create Full Syllabus Test' navigation in AdminDashboard Test Management tab
- Update StudentDashboard to display available Full Syllabus Tests with section details and Start Test buttons

**User-visible outcome:** Admins can create Full Syllabus Mock Tests with pre-configured two-section format and assign Physics, Chemistry, and Maths questions to appropriate sections. Students can view available Full Syllabus Tests showing section configurations on their dashboard.
