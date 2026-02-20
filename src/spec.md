# Specification

## Summary
**Goal:** Fix the admin registration bootstrapping logic to allow the first admin to register successfully without authorization errors.

**Planned changes:**
- Update registerAdmin endpoint to check if admin list is empty BEFORE running authorization checks, allowing first admin registration to proceed without "User is not registered" error
- Add comprehensive diagnostic logging to registerAdmin showing admin list size, first-time setup status, caller principal, authorization decision path, and registration outcome with timestamps
- Update AdminRegistration.tsx to automatically refetch user role query after successful registration, display success message, and redirect to Admin Dashboard after 2 seconds

**User-visible outcome:** The first user can successfully register as an admin without encountering "User is not registered" errors, and will be automatically redirected to the Admin Dashboard with their admin status properly recognized.
