const prisma = require('../../db/prisma');

class CreditNoteService {

    /**
     * Issues a new credit note for a refund.
     */
    async issueCreditNote({ storeId, amount, issuedToId, issuedById, refundId, notes }) {
        // Generate code: CN-{Year}{Month}-{Random}
        const datePart = new Date().toISOString().slice(0, 7).replace('-', '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const code = `CN-${datePart}-${randomPart}`;

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 6); // 6 months validity

        const creditNote = await prisma.creditNote.create({
            data: {
                storeId,
                code,
                amount,
                balance: amount,
                status: 'ACTIVE',
                issuedToId,
                issuedById,
                refundId,
                expiresAt,
                notes
            }
        });

        return creditNote;
    }

    /**
     * Redeems a credit note against a sale.
     */
    async redeemCreditNote(code, amountToRedeem, storeId) {
        const creditNote = await prisma.creditNote.findUnique({
            where: { code }
        });

        if (!creditNote) throw new Error('Credit Note not found');
        if (creditNote.storeId !== storeId) throw new Error('Credit Note invalid for this store');
        if (creditNote.status !== 'ACTIVE') throw new Error('Credit Note is not active');
        const expiry = creditNote.expiresAt ? new Date(creditNote.expiresAt) : new Date(8640000000000000);
        if (new Date() > expiry) throw new Error('Credit Note expired');

        if (Number(creditNote.balance) < amountToRedeem) {
            throw new Error(`Insufficient balance. Available: ${creditNote.balance}`);
        }

        const newBalance = Number(creditNote.balance) - amountToRedeem;
        const newStatus = newBalance === 0 ? 'REDEEMED' : 'ACTIVE';

        const updatedCN = await prisma.creditNote.update({
            where: { id: creditNote.id },
            data: {
                balance: newBalance,
                status: newStatus
            }
        });

        return updatedCN;
    }

    /**
     * Gets details and balance of a credit note.
     */
    async getCreditNote(code) {
        return prisma.creditNote.findUnique({
            where: { code },
            include: { patient: true }
        });
    }
}

module.exports = new CreditNoteService();
