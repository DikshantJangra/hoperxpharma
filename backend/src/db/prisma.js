const { PrismaClient } = require("@prisma/client");

let prisma = null;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient({
            log: ['error', 'warn']
        });
    }
    return prisma;
}

// Export a Proxy that lazily initializes Prisma on first property access
module.exports = new Proxy({}, {
    get(target, prop) {
        const client = getPrismaClient();
        return client[prop];
    }
});