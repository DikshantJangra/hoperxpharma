const { PrismaClient } = require('@prisma/client');

console.log('--- PRISMA DEBUG INFO ---');
try {
    const path = require.resolve('@prisma/client');
    console.log('Resolved path:', path);
} catch (e) {
    console.log('Could not resolve @prisma/client');
}

try {
    const prisma = new PrismaClient();
    // Try to access the internal DMMF if available to see defined fields
    // Note: accessing private properties is not reliable but good for debugging
    // Prisma 5+ structure might differ
    
    // Attempt to verify if 'paymentStatus' is known by creating a dummy findMany call (will fail but might throw specific validation error)
    // Actually, just inspecting the dmmf is safer if accessible.
    
    // In newer prisma, we can use Prisma.dmmf
    const { Prisma } = require('@prisma/client');
    if (Prisma.dmmf && Prisma.dmmf.datamodel) {
         const sale = Prisma.dmmf.datamodel.models.find(m => m.name === 'Sale');
         if (sale) {
             console.log('Sale model fields:', sale.fields.map(f => f.name).join(', '));
             console.log('Has paymentStatus:', sale.fields.some(f => f.name === 'paymentStatus'));
         } else {
             console.log('Sale model not found in dmmf');
         }
    } else {
        console.log('Prisma.dmmf not available');
    }
    
} catch (e) {
    console.error('Error during debug:', e);
}
console.log('--- END DEBUG INFO ---');
