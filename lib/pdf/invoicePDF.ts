import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ConsolidatedInvoice } from '@/lib/api/consolidatedInvoices';

export async function generateInvoicePDF(invoice: ConsolidatedInvoice) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, yPos);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, 20, yPos + 7);

    // Date (right aligned)
    doc.setFontSize(10);
    doc.text('Date:', pageWidth - 60, yPos);
    doc.text(new Date(invoice.invoiceDate).toLocaleDateString(), pageWidth - 20, yPos, { align: 'right' });

    if (invoice.periodStart && invoice.periodEnd) {
        doc.setFontSize(8);
        doc.text(
            `Period: ${new Date(invoice.periodStart).toLocaleDateString()} - ${new Date(invoice.periodEnd).toLocaleDateString()}`,
            pageWidth - 20,
            yPos + 6,
            { align: 'right' }
        );
    }

    yPos += 20;

    // From and To sections
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FROM:', 20, yPos);
    doc.text('TO:', pageWidth / 2 + 10, yPos);

    doc.setFont('helvetica', 'normal');
    yPos += 6;

    // From (Store)
    const storeLines = [
        invoice.store?.displayName || invoice.store?.name || '',
        invoice.store?.addressLine1 || '',
        invoice.store?.addressLine2 || '',
        `${invoice.store?.city || ''}, ${invoice.store?.state || ''} ${invoice.store?.pinCode || ''}`,
        invoice.store?.gstin ? `GSTIN: ${invoice.store.gstin}` : '',
        invoice.store?.dlNumber ? `DL: ${invoice.store.dlNumber}` : '',
    ].filter(Boolean);

    storeLines.forEach((line) => {
        doc.text(line, 20, yPos);
        yPos += 5;
    });

    // To (Supplier)
    yPos = 46; // Reset to same level as store
    const supplierLines = invoice.supplier
        ? [
            invoice.supplier.name,
            invoice.supplier.contactName || '',
            invoice.supplier.phoneNumber || '',
            invoice.supplier.gstin ? `GSTIN: ${invoice.supplier.gstin}` : '',
        ].filter(Boolean)
        : ['Multiple Suppliers'];

    supplierLines.forEach((line) => {
        doc.text(line, pageWidth / 2 + 10, yPos);
        yPos += 5;
    });

    yPos = Math.max(yPos, 76); // Ensure enough space

    // GRN References
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('GRN REFERENCES:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 5;

    const grnText = invoice.grns
        .map((g) => `${g.grn.grnNumber} (${new Date(g.grn.receivedDate).toLocaleDateString()})`)
        .join(', ');

    const grnLines = doc.splitTextToSize(grnText, pageWidth - 40);
    doc.text(grnLines, 20, yPos);
    yPos += grnLines.length * 5 + 5;

    // Items Table
    const tableData = invoice.items.map((item, index) => [
        (index + 1).toString(),
        item.drugName + (item.batchNumber ? ` (${item.batchNumber})` : ''),
        `${item.totalQuantity} ${item.unit}`,
        `₹${Number(item.unitPrice).toFixed(2)}`,
        `${Number(item.gstPercent).toFixed(0)}%`,
        `₹${Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Item', 'Qty', 'Rate', 'GST%', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [243, 244, 246],
            textColor: [75, 85, 99],
            fontStyle: 'bold',
            fontSize: 9,
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [31, 41, 55],
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 25, halign: 'right' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 20, halign: 'right' },
            5: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: 20, right: 20 },
    });

    // Get final Y position after table
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Totals (right aligned)
    const totalsX = pageWidth - 70;
    doc.setFontSize(10);

    doc.text('Subtotal:', totalsX, yPos);
    doc.text(`₹${Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 20, yPos, {
        align: 'right',
    });
    yPos += 6;

    doc.text('Tax:', totalsX, yPos);
    doc.text(`₹${Number(invoice.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 20, yPos, {
        align: 'right',
    });
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', totalsX, yPos);
    doc.text(`₹${Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 20, yPos, {
        align: 'right',
    });

    // Notes
    if (invoice.notes) {
        yPos += 15;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('NOTES:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 5;
        const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 40);
        doc.text(notesLines, 20, yPos);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('This is a computer-generated invoice', pageWidth / 2, footerY, { align: 'center' });
    doc.text(
        `Created by ${invoice.createdByUser?.firstName || ''} ${invoice.createdByUser?.lastName || ''} on ${new Date(
            invoice.createdAt
        ).toLocaleString()}`,
        pageWidth / 2,
        footerY + 4,
        { align: 'center' }
    );

    // Save PDF
    doc.save(`${invoice.invoiceNumber}.pdf`);
}
