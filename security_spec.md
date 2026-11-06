# Security Specification (`security_spec.md`)

## 1. Data Invariants
- **Global Default Deny**: Any path not explicitly matched is denied for both `read` and `write`.
- **Verified Identity**: All mutations require `request.auth != null` and `request.auth.token.email_verified == true`.
- **Admin Verification**: Administrator privileges require either a document in `/admins/$(request.auth.uid)` or the verified bootstrapped admin email `calixdsth@gmail.com` (`request.auth.token.email_verified == true`).
- **Ownership & Immutability**: Every `/orders/{orderId}` and `/sync_logs/{logId}` document must have `ownerId == request.auth.uid` on creation, and `ownerId` + `createdAt` are strictly immutable on update.
- **Terminal State Locking**: Once an order reaches `status == 'delivered'` or `status == 'cancelled'`, non-admin users cannot mutate it further.
- **Temporal Integrity**: `createdAt` must equal `request.time` on creation, and `updatedAt` must equal `request.time` on update.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: Creating `/orders/ord_1` with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Creating `/orders/ord_1` with `email == 'calixdsth@gmail.com'` but `email_verified == false` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection**: Creating `/orders/ord_1` with an extra undeclared property `isAdmin: true` -> `PERMISSION_DENIED`.
4. **Identity Spoofing on Create**: Creating `/orders/ord_1` with `ownerId: 'other_user'` -> `PERMISSION_DENIED`.
5. **ID Poisoning Attack**: Creating `/orders/` with a 200-character or special-character document ID -> `PERMISSION_DENIED`.
6. **Negative / Huge Total**: Creating `/orders/ord_1` with `total: -500` or `total: 99999999` -> `PERMISSION_DENIED`.
7. **Client Timestamp Forgery**: Creating `/orders/ord_1` with a past or future timestamp `createdAt != request.time` -> `PERMISSION_DENIED`.
8. **Immutable Field Mutation**: Updating `/orders/ord_1` to change `ownerId` or `createdAt` -> `PERMISSION_DENIED`.
9. **Terminal State Bypass**: Updating an order whose existing `status == 'delivered'` as a non-admin -> `PERMISSION_DENIED`.
10. **Value Poisoning on Update**: Updating `status` to an invalid string `'hacked_state'` not in the enum -> `PERMISSION_DENIED`.
11. **Unauthorized Cross-User Read**: Reading `/orders/ord_1` belonging to `user_A` while authenticated as `user_B` -> `PERMISSION_DENIED`.
12. **Sync Log Mutation**: Attempting to update or delete an immutable `/sync_logs/{logId}` audit entry as a non-admin -> `PERMISSION_DENIED`.
