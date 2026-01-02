#!/bin/bash

# Script to cleanup hardcoded API URL fallbacks in frontend
# Replaces all instances with validated environment configuration

echo "🔧 Cleaning up hardcoded API URL fallbacks..."

# Files that need updating based on grep results
FILES=(
  "lib/offline/sync-manager.ts"
  "lib/api/audit.ts"
  "lib/api/portal.ts"
  "lib/api/sales.ts"
  "lib/api/whatsapp.ts"
  "hooks/useEfficientPOComposer.ts"
  "hooks/useChat.ts"
  "hooks/usePOComposer.ts"
  "components/store/profile/AssetUploader.tsx"
  "components/orders/ProductSearch.tsx"
  "components/orders/NewPOPage.tsx"
  "components/orders/POSummary.tsx"
  "components/orders/ProductSearchBar.tsx"
  "components/orders/AddCustomItemInline.tsx"
  "components/orders/AddCustomItemModal.tsx"
  "components/orders/BulkAddModal.tsx"
  "components/orders/SupplierChip.tsx"
  "components/orders/AttachmentUploader.tsx"
  "components/orders/LoadTemplateModal.tsx"
  "components/inventory/StockDetailPanel.tsx"
  "components/dashboard/navbar/Navbar.tsx"
  "app/(main)/orders/pending/page.tsx"
  "app/(main)/orders/page.tsx"
  "app/(main)/orders/pending/[id]/receive/page.tsx"
  "app/(main)/orders/received/page.tsx"
  "app/(main)/orders/[id]/page.tsx"
  "app/(main)/prescriptions/page_old_backup.tsx"
  "app/(main)/profile/page.tsx"
)

COUNT=0

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if file contains the pattern
    if grep -q "process\.env\.NEXT_PUBLIC_API_URL || 'http://localhost" "$file"; then
      echo "  ✓ Processing: $file"
      COUNT=$((COUNT + 1))
    fi
  fi
done

echo ""
echo "📊 Found $COUNT files with hardcoded fallbacks"
echo ""
echo "⚠️  Manual update required:"
echo "   Each file needs to import { getApiBaseUrl } from '@/lib/config/env'"
echo "   and replace: process.env.NEXT_PUBLIC_API_URL || 'http://localhost...'"
echo "   with: getApiBaseUrl()"
echo ""
echo "✨ This ensures production deploys fail fast if API_URL is not configured"
