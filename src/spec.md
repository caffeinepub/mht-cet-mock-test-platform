# Specification

## Summary
**Goal:** Add a prominent modal popup to inform users about admin role assignment restrictions during admin registration.

**Planned changes:**
- Add a modal dialog that appears when users click "Register as Admin" button, displaying the message "Only admin can assign user roles"
- Convert the existing toast notification for unauthorized admin registration errors into a prominent modal popup with a dismissible close/OK button
- Clarify in the popup that the first admin registration is open for initial setup when no admins exist

**User-visible outcome:** Users attempting to register as admin will see clear, prominent modal popups explaining that only existing admins can assign admin roles, improving clarity about authorization requirements and reducing confusion about failed registration attempts.
