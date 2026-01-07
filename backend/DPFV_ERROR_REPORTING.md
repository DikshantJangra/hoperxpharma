# DPFV Error Reporting Improvements

## Changes Made

### 1. Database Connection Failure Detection
**File**: `verifier/cleanup.ts`

Added detection for database connection failures during cleanup:
- Checks for connection error codes (P1001, P1002, ECONNREFUSED)
- Displays clear error message with masked connection string
- Exits immediately with code 1 to prevent running tests without DB
- Other cleanup errors log warnings but allow continuation

### 2. Enhanced Error Serialization
**File**: `verifier/runner/Runner.ts`

Added `serializeError()` function that captures:
- `name` - Error type (e.g., PrismaClientKnownRequestError)
- `message` - Full error message with all details
- `stack` - Complete stack trace for debugging
- `code` - Prisma error codes (e.g., P2002 for unique constraint)
- `meta` - Additional metadata from Prisma errors
- `clientVersion` - Prisma client version for compatibility checks

### 3. Improved JSON Report
**File**: `dpfv-report.json`

Errors now stored with complete information:
```json
{
  "error": {
    "name": "PrismaClientKnownRequestError",
    "message": "Invalid `prisma.saleDraft.create()` invocation...",
    "stack": "PrismaClientKnownRequestError: ...\n    at ...",
    "code": "P2002",
    "meta": {
      "target": ["draftNumber"]
    },
    "clientVersion": "6.19.1"
  }
}
```

### 4. Cleaner Console Output
**File**: `verifier/runner/Runner.ts`

Console now shows only first line of error for readability:
```
✗ Failed: Unique constraint failed on the fields: (`draftNumber`)
```

Full details remain in JSON report for debugging.

## Benefits

1. **Quick Reference**: Full error details in JSON for fast debugging
2. **Stack Traces**: Complete call stacks help identify exact failure points
3. **Prisma Details**: Error codes and metadata for database issues
4. **Clean Console**: Readable output during test runs
5. **Early Exit**: Stops immediately if database is unreachable

## Example Error in JSON Report

```json
{
  "id": "pos.draft",
  "status": "FAILED",
  "failedAtStep": "draft.create",
  "steps": [
    {
      "success": false,
      "error": {
        "name": "PrismaClientKnownRequestError",
        "message": "Invalid `prisma.saleDraft.create()` invocation in\n/Users/.../saleDraftService.js:25:46\n\nUnique constraint failed on the fields: (`draftNumber`)",
        "stack": "PrismaClientKnownRequestError: ...\n    at ei.handleRequestError (...)\n    at ei.request (...)\n    at async ...",
        "code": "P2002",
        "meta": {
          "target": ["draftNumber"]
        }
      },
      "duration": 234
    }
  ]
}
```

## Usage

Run tests and check the JSON report:
```bash
npm run dpfv
cat dpfv-report.json | jq '.scenarios[] | select(.status == "FAILED") | .error'
```

This will show all error details for failed scenarios.
