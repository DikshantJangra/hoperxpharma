/**
 * Template Repository
 * Handles database operations for WhatsApp templates
 */

const { PrismaClient } = require('@prisma/client');

const prisma = require('../db/prisma');

/**
 * Create template
 * @param {Object} data - Template data
 * @returns {Promise<Object>} Created template
 */
async function create(data) {
    return await prisma.whatsAppTemplate.create({
        data,
    });
}

/**
 * Find templates by store
 * @param {string} storeId - Store ID
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} Templates
 */
async function findByStore(storeId, status = null) {
    const where = { storeId };

    if (status) {
        where.status = status;
    }

    return await prisma.whatsAppTemplate.findMany({
        where,
        orderBy: [
            { status: 'desc' }, // APPROVED first
            { createdAt: 'desc' },
        ],
    });
}

/**
 * Find template by name and language
 * @param {string} storeId - Store ID
 * @param {string} name - Template name
 * @param {string} language - Language code
 * @returns {Promise<Object|null>} Template
 */
async function findByNameAndLanguage(storeId, name, language = 'en') {
    return await prisma.whatsAppTemplate.findUnique({
        where: {
            storeId_name_language: {
                storeId,
                name,
                language,
            },
        },
    });
}

/**
 * Update template status (after Meta approval/rejection)
 * @param {string} id - Template ID
 * @param {string} status - Status value
 * @param {Object} additionalData - Optional additional fields
 * @returns {Promise<Object>} Updated template
 */
async function updateStatus(id, status, additionalData = {}) {
    return await prisma.whatsAppTemplate.update({
        where: { id },
        data: {
            status,
            ...additionalData,
        },
    });
}

/**
 * Increment usage count
 * @param {string} id - Template ID
 * @returns {Promise<Object>} Updated template
 */
async function incrementUsage(id) {
    return await prisma.whatsAppTemplate.update({
        where: { id },
        data: {
            usageCount: {
                increment: 1,
            },
            lastUsedAt: new Date(),
        },
    });
}

/**
 * Delete template
 * @param {string} id - Template ID
 * @returns {Promise<Object>} Deleted template
 */
async function deleteTemplate(id) {
    return await prisma.whatsAppTemplate.delete({
        where: { id },
    });
}

module.exports = {
    create,
    findByStore,
    findByNameAndLanguage,
    updateStatus,
    incrementUsage,
    deleteTemplate,
};
