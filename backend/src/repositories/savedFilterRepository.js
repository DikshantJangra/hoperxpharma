const prisma = require('../db/prisma');

class SavedFilterRepository {
    async create(data) {
        return await prisma.savedFilter.create({
            data,
        });
    }

    async findAll(userId) {
        return await prisma.savedFilter.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id) {
        return await prisma.savedFilter.findUnique({
            where: { id },
        });
    }

    async delete(id) {
        return await prisma.savedFilter.delete({
            where: { id },
        });
    }
}

module.exports = new SavedFilterRepository();
