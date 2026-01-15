# Self-Hosted Typesense Setup on Render

## Step 1: Deploy Typesense Private Service

1. Go to Render Dashboard → New → Blueprint
2. Connect your GitHub repository
3. Select `render-typesense.yaml` as the blueprint file
4. Click "Apply" to create the Typesense service

Render will:
- Create a Private Service (not publicly accessible)
- Deploy Typesense using Docker
- Generate a secure API key automatically
- Attach 10GB persistent disk for data storage
- Provide an internal URL like: `typesense:8108`

## Step 2: Get Typesense Connection Details

After deployment completes:

1. Go to your Typesense service in Render Dashboard
2. Copy the **Internal URL** (e.g., `typesense:8108`)
3. Go to Environment tab
4. Copy the auto-generated `TYPESENSE_API_KEY` value

## Step 3: Update Backend Environment Variables

Add these to your backend Web Service on Render:

```
TYPESENSE_HOST=typesense
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=<paste-the-generated-key>
TYPESENSE_COLLECTION_NAME=medicines
```

**Important**: Use `typesense` as the host (Render's internal DNS), not `localhost` or external URL.

## Step 4: Initialize Search Collection

After backend redeploys with new env vars:

```bash
# SSH into your backend service or run via Render Shell
npm run medicine:init-search
npm run medicine:rebuild-index
```

## Step 5: Verify Setup

Test the search endpoint:
```bash
curl "https://your-backend.onrender.com/api/v1/medicines/search?q=paracetamol"
```

## Cost Estimate

- Typesense Private Service (Starter): $7/month
- 10GB Persistent Disk: $0.25/GB/month = $2.50/month
- **Total: ~$10/month** (vs Typesense Cloud at $29+/month)

## Troubleshooting

**Connection refused**: Make sure both services are in the same Render region and use internal hostname `typesense`.

**API key mismatch**: Verify the API key matches between Typesense service and backend env vars.

**Collection not found**: Run `npm run medicine:init-search` to create the collection.
