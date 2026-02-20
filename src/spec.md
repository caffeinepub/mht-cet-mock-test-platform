# Specification

## Summary
**Goal:** Implement an admin registration system with a one-time setup endpoint that allows the first user to register as admin without authorization, and subsequent admin registrations only by existing admins.

**Planned changes:**
- Add backend `registerAdmin` endpoint that accepts Internet Identity principal, validates authorization (open for first registration, requires admin for subsequent), and adds principal to admin list
- Implement one-time setup logic using stable variable to track initial setup completion
- Add comprehensive logging for registration operations including caller, registered principal, setup status, and outcomes
- Create `useAdminRegistration` React Query mutation hook to call backend registration endpoint
- Build admin registration page with principal input form, validation, instructions, and success/error displays
- Add `/admin/register` route accessible to all authenticated users
- Add navigation link in Navbar for non-admin authenticated users to discover admin setup
- Display current user's Internet Identity principal on registration page with copy functionality

**User-visible outcome:** Authenticated users can navigate to the admin registration page, see their Internet Identity principal, and register themselves as the first admin or (if already an admin) register additional admins by entering their principals.
