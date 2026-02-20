# Specification

## Summary
**Goal:** Fix the first admin registration authorization logic to allow bootstrapping the application with an initial administrator without requiring pre-existing admin permissions.

**Planned changes:**
- Fix the `registerAdmin` endpoint authorization in backend/main.mo to allow first admin registration when the admin principals list is empty
- Add comprehensive diagnostic logging to track admin list state, caller principals, authorization checks, and registration outcomes
- Review and fix admin principals list initialization to properly handle empty state during first deployment
- Update AdminRegistration.tsx to automatically refetch user role after successful registration, display success message, and navigate to Admin Dashboard
- Add visual indicator in AdminRegistration.tsx to check and display if the principal is already registered as admin before submission

**User-visible outcome:** The first user can successfully register as admin without encountering "Unauthorized" errors, see confirmation of their admin status, and automatically access the Admin Dashboard. Subsequent admin registrations will correctly require existing admin authorization.
