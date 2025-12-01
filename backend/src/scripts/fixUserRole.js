const prisma = require('../config/database').getClient();

/**
 * Update user role to ADMIN
 * Run this to fix your account
 */
async function fixUserRole(userId) {
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role: 'ADMIN' },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
            }
        });

        console.log('✅ User role updated:', user);
        return { success: true, user };
    } catch (error) {
        console.error('❌ Failed to update user role:', error);
        return { success: false, error: error.message };
    }
}

// If run directly
if (require.main === module) {
    const userId = process.argv[2];
    if (!userId) {
        console.error('Usage: node fixUserRole.js <userId>');
        console.error('Example: node fixUserRole.js cmihtr55v000014iwy5882sy6');
        process.exit(1);
    }

    fixUserRole(userId)
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = { fixUserRole };
