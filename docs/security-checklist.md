# Security & Compliance Checklist

## DPDPA 2023 Compliance

- [x] **Consent Management**: Explicit consent required for data processing and messaging.
- [x] **Right to Withdraw**: Patients can withdraw consent at any time via the UI.
- [x] **Data Minimization**: Only necessary fields are mandatory.
- [x] **Audit Trail**: All access and modifications to patient records are logged.
- [x] **Right to be Forgotten**: Soft delete implementation allows "deleting" records while maintaining audit history (hard delete policy to be defined).

## Access Control (RBAC)

- [ ] **Role Verification**: Ensure only Pharmacists can merge patients.
- [ ] **View Restrictions**: Ensure only authorized staff can view full patient history.
- [ ] **API Security**: Verify all API endpoints check for valid JWT tokens.

## Data Security

- [ ] **Encryption**: Ensure database is encrypted at rest.
- [ ] **Transport**: Ensure all API traffic is over HTTPS.
- [ ] **Backups**: Verify automated daily backups are running.

## Vulnerability Scanning

- [ ] Run `npm audit` to check for vulnerable dependencies.
- [ ] Check for hardcoded secrets in code (API keys, tokens).
- [ ] Verify input validation on all forms (Zod schemas).

## Incident Response

- [ ] Define process for reporting data breaches.
- [ ] Set up alerts for suspicious activity (e.g. bulk exports).
