# Security Specification: NewDay Core Workspace Firestore Rules

## 1. Data Invariants
- A profile in `/users/{userId}` can only be created with an ID matching the authenticated user's UID (`request.auth.uid`). No identity spoofing.
- Users can modify their own profile data but cannot set administrative configurations or self-grant XP/streaks without compliance updates.
- Tasks are shared components. A user can write tasks or update task statuses if they are signed in.
- Chat messages can only be posted if the sender ID matches the authenticated user's UID.
- Groups and goals can be created and queried by authenticated team members.

## 2. The "Dirty Dozen" Payloads (Identity, Integrity & State Attacks)
1. **Malicious Signup (Spoofing)**: Attacker attempts to write a document under `/users/attacker_id` with `request.auth.uid = random_stranger`. Should be rejected by matching `{userId} == request.auth.uid`.
2. **Ghost XP Injection**: Attacker attempts to update their own XP by `+1000000` points.
3. **Alien Group Infiltration**: Attacker attempts to modify the `memberIds` array of a group they do not belong to.
4. **Task Hijacking**: Attacker attempts to edit a task title they don't own or have access to.
5. **Chat Sender Spoofing**: Attacker writes message content specifying `senderId: 'someone_else'`. Rejected via `incoming().senderId == request.auth.uid`.
6. **Task ID Poisoning**: Trying to create a task with an ID larger than 128 characters or containing illegal formatting characters.
7. **Negative Progress Goal**: Attacker tries to update goal progress to a negative value.
8. **Malicious Milestone Bypass**: Non-assignee attempting to force complete an active milestone.
9. **Null Content Message**: Creating a message with empty content string.
10. **Immigrant Task Link**: Attacker attempts to link a task belonging to an unrelated group into a goal.
11. **Future Created Stamp**: Specifying a client-side created timestamp 2 years in the future to keep a task permanently pinned.
12. **Blanket User Discovery**: Scraping entire private profile databases of users.

## 3. Test Runner Design
A test suite would run tests against each collection using standard Firebase Emulators to ensure that all these vectors result in `PERMISSION_DENIED`.
