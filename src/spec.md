# Specification

## Summary
**Goal:** Remove the Admin Setup navigation link from the menu bar while keeping the admin registration page accessible via direct URL.

**Planned changes:**
- Remove the 'Admin Setup' link from the Navbar component at the specified navigation section
- Ensure no 'Admin Setup' or 'Register Admin' link appears for any user role
- Verify the '/admin/register' route remains functional when accessed directly

**User-visible outcome:** The Admin Setup link no longer appears in the navigation menu, but administrators can still access the admin registration page by navigating directly to the URL when needed.
