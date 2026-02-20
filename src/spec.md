# Specification

## Summary
**Goal:** Make the explanation field optional when creating questions in the admin interface.

**Planned changes:**
- Update the Question data type to make explanation field optional (?Text)
- Remove validation requiring explanation in the question creation form
- Update the createQuestion backend endpoint to accept null explanations
- Handle null explanations gracefully in result display and PDF export

**User-visible outcome:** Admins can create questions without providing an explanation. The explanation field is now marked as optional in the form, and questions without explanations display properly in results and PDF exports.
