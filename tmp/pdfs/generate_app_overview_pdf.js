const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputDir = path.join('/Users/dikshantjangra/Desktop/hoperxpharma/output/pdf');
const outputFile = path.join(outputDir, 'hoperxpharma-app-overview.pdf');

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 54, bottom: 54, left: 54, right: 54 },
  autoFirstPage: true,
  bufferPages: true,
});

doc.info.Title = 'HopeRxPharma App Overview';

doc.pipe(fs.createWriteStream(outputFile));

const pageWidth = doc.page.width;
const pageHeight = doc.page.height;
const margins = doc.page.margins;
const contentWidth = pageWidth - margins.left - margins.right;

const colors = {
  text: '#111827',
  muted: '#4B5563',
  light: '#6B7280',
  accent: '#0F766E',
  line: '#E5E7EB',
};

function setFont(size, bold = false, color = colors.text) {
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
  doc.fontSize(size);
  doc.fillColor(color);
}

function ensureSpace(height) {
  if (doc.y + height > pageHeight - margins.bottom) {
    doc.addPage();
    drawHeader();
  }
}

function drawHeader() {
  setFont(10, true, colors.muted);
  doc.text('HopeRxPharma - App Overview', margins.left, 30, { width: contentWidth, align: 'left' });
  doc.moveTo(margins.left, 44).lineTo(pageWidth - margins.right, 44).lineWidth(0.5).stroke(colors.line);
  doc.y = 60;
}

function sectionTitle(text) {
  ensureSpace(24);
  setFont(16, true, colors.accent);
  doc.text(text, { width: contentWidth, align: 'left' });
  doc.moveDown(0.4);
}

function subTitle(text) {
  ensureSpace(18);
  setFont(12, true, colors.text);
  doc.text(text, { width: contentWidth, align: 'left' });
  doc.moveDown(0.2);
}

function paragraph(text) {
  setFont(10.5, false, colors.text);
  doc.text(text, { width: contentWidth, align: 'left', lineGap: 2 });
  doc.moveDown(0.6);
}

function muted(text) {
  setFont(9, false, colors.light);
  doc.text(text, { width: contentWidth, align: 'left', lineGap: 2 });
  doc.moveDown(0.4);
}

function bulletList(items) {
  const bulletIndent = 12;
  const textIndent = 20;
  items.forEach((item) => {
    ensureSpace(14);
    setFont(10.5, false, colors.text);
    const x = margins.left + bulletIndent;
    const y = doc.y + 2;
    doc.text('-', x, doc.y, { width: 10, align: 'left' });
    doc.text(item, margins.left + textIndent, doc.y, { width: contentWidth - textIndent, align: 'left', lineGap: 2 });
    doc.moveDown(0.4);
  });
  doc.moveDown(0.2);
}

function evidenceList(items) {
  setFont(9, true, colors.muted);
  doc.text('Evidence:', { width: contentWidth, align: 'left' });
  setFont(9, false, colors.light);
  items.forEach((item) => {
    ensureSpace(12);
    doc.text(`- ${item}`, { width: contentWidth, align: 'left' });
  });
  doc.moveDown(0.6);
}

function pageTitle() {
  setFont(26, true, colors.accent);
  doc.text('HopeRxPharma', { width: contentWidth, align: 'left' });
  setFont(14, false, colors.muted);
  doc.text('Comprehensive App Overview (Repository Evidence)', { width: contentWidth, align: 'left' });
  setFont(9, false, colors.light);
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Generated: ${dateString}`, { width: contentWidth, align: 'left' });
  doc.moveDown(1.2);
}

// Page 1 - Executive Overview
pageTitle();
sectionTitle('Executive Overview');
paragraph('HopeRxPharma is a pharmacy management web application. The repository contains a Next.js frontend and a Node.js/Express backend with Prisma-managed PostgreSQL models. The backend exposes /api/v1 routes for inventory, sales, prescriptions, patients, suppliers, reports, alerts, and a patient portal.');
paragraph('The app exists to digitize and streamline pharmacy operations. The README and user guide describe a platform that centralizes inventory tracking, billing, prescription handling, supplier workflows, and patient engagement, with compliance and auditability called out as key concerns.');
evidenceList([
  '/Users/dikshantjangra/Desktop/hoperxpharma/README.md',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/routes/v1/index.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/app.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/prisma/schema.prisma',
  '/Users/dikshantjangra/Desktop/hoperxpharma/docs/user-guide.md',
  '/Users/dikshantjangra/Desktop/hoperxpharma/app/portal/page.tsx'
]);

// Page 2 - Target Users

doc.addPage();
drawHeader();
sectionTitle('Target Users');
subTitle('Primary Users');
bulletList([
  'Pharmacists and pharmacy staff running day-to-day dispensing and sales workflows.',
  'Pharmacy owners and managers overseeing inventory, purchasing, and business performance.'
]);
subTitle('Secondary or Edge Users');
bulletList([
  'Patients using the portal to view prescriptions and request refills.',
  'Prescribers and suppliers represented in system records and workflows.',
  'Compliance or audit reviewers using audit logs and consent history.',
  'System admins managing roles, permissions, and subscriptions.'
]);
subTitle('Use Cases and Scenarios');
bulletList([
  'Receive inventory via purchase orders and GRNs, including batch tracking and barcode enrollment.',
  'Manage stock levels, adjustments, expiries, and FEFO batch recommendations.',
  'Run point-of-sale transactions with barcode or QR scanning, split payments, and invoices.',
  'Capture or upload prescriptions, manage refills, and track patient consent status.',
  'Provide patients with a portal to access prescriptions and submit refill requests.',
  'Ingest medicines with OCR and salt composition mapping, then search via a medicine master.',
  'Review sales and operational reports with KPIs and export options.',
  'Engage patients through WhatsApp or other messaging flows tied to consent.'
]);
evidenceList([
  '/Users/dikshantjangra/Desktop/hoperxpharma/README.md',
  '/Users/dikshantjangra/Desktop/hoperxpharma/app/portal/dashboard/page.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/routes/v1/index.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/components/pos/BarcodeScannerModal.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/components/grn/ReceivingTable.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/docs/user-guide.md',
  '/Users/dikshantjangra/Desktop/hoperxpharma/lib/api/scan.ts',
  '/Users/dikshantjangra/Desktop/hoperxpharma/lib/api/whatsapp.ts'
]);

// Page 3 - Features and Capabilities

doc.addPage();
drawHeader();
sectionTitle('Features and Capabilities');
subTitle('Inventory and Procurement');
bulletList([
  'Inventory stock tables, filters, and adjustment workflows.',
  'Batch management, expiry tracking, and FEFO recommendations.',
  'Purchase orders, GRNs, supplier invoices, and supplier profiles.',
  'Barcode enrollment and QR code generation for batches.'
]);
subTitle('Sales and POS');
bulletList([
  'Point-of-sale basket, payment panel, and split payment flows.',
  'Barcode and QR scanning to add items to a sale.',
  'Sales, consolidated invoices, and margin related endpoints.'
]);
subTitle('Prescriptions and Patients');
bulletList([
  'Prescription creation, filtering, and detail views.',
  'Patient profiles, consent management, merges, and history timelines.',
  'Prescription upload with OCR and refill workflows.',
  'Patient portal authentication, prescription access, and refill requests.'
]);
subTitle('Medicine Intelligence and Search');
bulletList([
  'Medicine master ingestion routes and salt intelligence dashboards.',
  'Substitute discovery and salt mapping audit trails.',
  'Typesense-backed medicine search with client-side caching for fast lookup.'
]);
subTitle('Reporting, Alerts, and Governance');
bulletList([
  'Sales reports with KPIs, charts, and export options.',
  'Alert system with event rules and dashboard widgets.',
  'Audit logs, access logs, and role-based access control management.'
]);
subTitle('Integrations and Messaging');
bulletList([
  'Razorpay payment flows with webhook verification.',
  'OCR extraction endpoint using Google Vision service integration.',
  'WhatsApp Business messaging APIs for conversations and templates.'
]);
subTitle('Limitations and Gaps Implied by the Repo');
bulletList([
  'Multi-subscription capability is documented as a future, documentation-only architecture.',
  'The README lists a FastAPI backend and a React Native mobile app, but the repo contains an Express backend and no mobile app source.',
  'Security checklist items such as encryption at rest, backups, and vulnerability scans are listed as not yet verified.',
  'Some marketing claims in the landing FAQ are not corroborated by implementation details in the codebase.'
]);
evidenceList([
  '/Users/dikshantjangra/Desktop/hoperxpharma/components/inventory/StockTable.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/components/grn/ReceivingTable.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/components/pos/PaymentPanel.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/components/prescriptions/PrescriptionDetail.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/components/patients/PatientConsentsTab.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/routes/v1/index.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/routes/v1/fefo.routes.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/routes/v1/ocr.routes.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/lib/cache/medicineCacheService.ts',
  '/Users/dikshantjangra/Desktop/hoperxpharma/components/Reports/Sales/SalesReportPage.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/ALERT_SYSTEM_README.md',
  '/Users/dikshantjangra/Desktop/hoperxpharma/components/rbac/RoleEditor.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/routes/v1/payment.routes.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/lib/api/whatsapp.ts',
  '/Users/dikshantjangra/Desktop/hoperxpharma/docs/architecture/multi-subscription-backend.md',
  '/Users/dikshantjangra/Desktop/hoperxpharma/docs/security-checklist.md',
  '/Users/dikshantjangra/Desktop/hoperxpharma/components/landing/FAQ.tsx',
  '/Users/dikshantjangra/Desktop/hoperxpharma/README.md',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/package.json'
]);

// Page 4 - How It Works

doc.addPage();
drawHeader();
sectionTitle('How It Works');
subTitle('Runtime Flow (High Level)');
bulletList([
  'The Next.js frontend renders UI modules and calls a shared API client for server data.',
  'Authentication uses access tokens stored in memory and refresh tokens in httpOnly cookies. The client refreshes tokens via /auth/refresh when needed.',
  'Requests are sent to the Express backend, which applies security middleware, logging, rate limits, SQL injection detection, and a session timeout.',
  'Domain routes under /api/v1 handle inventory, prescriptions, sales, patients, suppliers, payments, and portal operations.',
  'Prisma models map these domains to PostgreSQL tables and relations.',
  'Background services initialize alert event processing, scheduled jobs, payment jobs, and a daily behavioral scoring job, with optional Typesense keep-alive pings in production.',
  'Offline mutations are queued in IndexedDB when the network is down and replayed when connectivity returns.',
  'Medicine search and ingestion use Typesense schemas and client-side caching for fast lookup and offline support.',
  'The patient portal uses a dedicated JWT type to fetch prescriptions and submit refill requests.'
]);
subTitle('Request and Response Lifecycle');
bulletList([
  'Client requests are wrapped by baseFetch, which handles timeouts, parses responses, and normalizes errors.',
  'On 401 responses, the client clears tokens and redirects to login unless a logout is in progress.',
  'Network errors during write operations are queued for later sync to prevent data loss.',
  'Backend responses are served through documented routes and include health and Swagger endpoints for monitoring and documentation.'
]);
subTitle('Background Jobs and Integrations');
bulletList([
  'Alert event listener and rule engine for operational alerts.',
  'Payment jobs plus Razorpay order creation, verification, and webhook processing.',
  'WhatsApp retry worker and messaging endpoints for patient communications.',
  'OCR extraction endpoint using Google Vision API services.',
  'Typesense health checks and keep-alive pings for search availability.'
]);
evidenceList([
  '/Users/dikshantjangra/Desktop/hoperxpharma/lib/api/client.ts',
  '/Users/dikshantjangra/Desktop/hoperxpharma/lib/offline/sync-manager.ts',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/app.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/server.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/routes/v1/index.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/prisma/schema.prisma',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/routes/v1/payment.routes.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/routes/v1/ocr.routes.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/routes/portal.routes.js',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/src/lib/typesense/schema.ts',
  '/Users/dikshantjangra/Desktop/hoperxpharma/backend/ALERT_SYSTEM_README.md',
  '/Users/dikshantjangra/Desktop/hoperxpharma/lib/api/whatsapp.ts'
]);

// Footer page numbers
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  const pageNumber = i + 1;
  const footerText = `Page ${pageNumber} of ${range.count}`;
  setFont(9, false, colors.light);
  doc.text(footerText, margins.left, pageHeight - margins.bottom + 18, { width: contentWidth, align: 'right' });
}

// Finalize

doc.end();

console.log(`PDF written to ${outputFile}`);
