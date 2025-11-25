---
title: "Processing a New Prescription"
slug: "/operations/prescription-workflow"
category: "Prescriptions"
tags: ["ocr","dispensing","verification","pharmacist"]
summary: "How to scan a paper prescription using OCR and verify it for dispensing."
difficulty: "Intermediate"
last_updated: "2025-11-24"
estimated_time: "3 min"
---

# Processing a New Prescription

Quick Steps
1. Operations → Prescriptions → New.
2. Upload/scan the prescription image.
3. Review OCR-extracted medicines and send for verification.
4. Pharmacist verifies, checks interactions, approves for dispense.

---

## Step 1: Intake & OCR
- Technician uploads image; AI extracts fields (patient, doctor, medicines, dosage).
- Correct any OCR mistakes: handwriting can be imperfect — always verify.

## Step 2: Pharmacist verification
- Pharmacist reviews patient history, checks drug interactions and allergy alerts.
- If substitution required: record substitution reason and get patient consent (traceable in audit log).
- Approve and print labels.

## Safety & audit
- All actions (who verified, what changed) are logged immutably.
- The system highlights controlled drugs and will require manager/owner approval if policy enforces it.

Related: `/docs/inventory/batches`, `/docs/compliance/audit-logs`
