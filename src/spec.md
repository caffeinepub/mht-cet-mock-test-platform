# Specification

## Summary
**Goal:** Fix the Admin panel link visibility in the navigation bar for authenticated admin users.

**Planned changes:**
- Debug and fix the useGetCallerUserRole hook to correctly fetch and return user roles from the backend
- Verify the backend getUserRole endpoint correctly identifies admin users and returns the appropriate role
- Fix the conditional rendering logic in Navbar.tsx to properly display the Admin link for admin users
- Add console logging to diagnose the authentication state, user role value, and conditional rendering decisions

**User-visible outcome:** Authenticated admin users will see the "Admin" navigation link in the menu bar (both desktop and mobile), while non-admin users continue to see only their appropriate navigation options.
