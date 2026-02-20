# Specification

## Summary
**Goal:** Fix the connection timeout error preventing admin registration by resolving the 22+ second backend connection delay.

**Planned changes:**
- Investigate and fix the actor initialization timeout in useActor.ts hook causing 22+ second delays
- Verify backend canister (7xdrr-pqaaa-aaaae-qgzda-cai) is running and responding to queries
- Reduce connection timeout threshold from 22+ seconds to 15 seconds maximum
- Add enhanced error logging to capture exact failure points during actor initialization
- Implement connection health check before displaying registration form (5 second timeout)
- Fix Internet Identity delegation validation to prevent re-authentication delays during actor initialization

**User-visible outcome:** Admin registration page connects to backend within 5 seconds and allows users to register administrators without connection timeout errors.
