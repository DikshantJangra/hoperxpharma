const database = require('../config/database');

const prisma = database.getClient();

/**
 * User Repository - Data access layer for User operations
 */
class UserRepository {
    /**
     * Find user by email
     */
    async findByEmail(email) {
        return await prisma.user.findUnique({
            where: { email },
            include: {
                storeUsers: {
                    include: {
                        store: true,
                    },
                },
            },
        });
    }

    /**
     * Find user by phone number
     */
    async findByPhoneNumber(phoneNumber) {
        return await prisma.user.findUnique({
            where: { phoneNumber },
        });
    }

    /**
     * Find user by ID
     */
    async findById(id) {
        return await prisma.user.findUnique({
            where: { id, deletedAt: null },
            include: {
                storeUsers: {
                    include: {
                        store: true,
                    },
                },
            },
        });
    }

    /**
     * Create new user
     */
    async create(userData) {
        return await prisma.user.create({
            data: userData,
            select: {
                id: true,
                email: true,
                phoneNumber: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
            },
        });
    }

    /**
     * Update user
     */
    async update(id, userData) {
        return await prisma.user.update({
            where: { id },
            data: userData,
            select: {
                id: true,
                email: true,
                phoneNumber: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                updatedAt: true,
            },
        });
    }

    /**
     * Soft delete user
     */
    async softDelete(id) {
        return await prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    /**
     * Check if user exists by email or phone
     */
    async existsByEmailOrPhone(email, phoneNumber) {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phoneNumber }],
                deletedAt: null,
            },
        });
        return !!user;
    }

    /**
     * Get user with stores
     */
    async getUserWithStores(userId) {
        return await prisma.user.findUnique({
            where: { id: userId },
            include: {
                storeUsers: {
                    include: {
                        store: {
                            include: {
                                licenses: true,
                                subscription: {
                                    include: {
                                        plan: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
}

module.exports = new UserRepository();
