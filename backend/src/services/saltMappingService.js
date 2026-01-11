const prisma = require('../db/prisma');
const logger = require('../config/logger'); // Assuming logger exists

/**
 * Service to handle automated salt mapping for drugs
 */
class SaltMappingService {
    /**
     * Automatically map salts for a given drug ID based on its generic name
     * @param {string} drugId 
     * @returns {Promise<{mapped: number, warnings: string[]}>}
     */
    async autoMapDrug(drugId) {
        try {
            const drug = await prisma.drug.findUnique({
                where: { id: drugId },
                include: { saltLinks: true }
            });

            if (!drug || !drug.genericName) {
                return { mapped: 0, warnings: ['Drug not found or no generic name'] };
            }

            // Skip if already mapped (unless forced? For now, skip)
            if (drug.saltLinks.length > 0) {
                return { mapped: 0, warnings: ['Drug already has salt links'] };
            }

            // 1. Get All Salts for matching (Cache this in production ideally)
            const allSalts = await prisma.salt.findMany({
                select: { id: true, name: true }
            });

            // Normalize salt names for matching
            const saltMap = new Map();
            allSalts.forEach(s => saltMap.set(s.name.toLowerCase().trim(), s.id));

            // 2. Parse Generic Name
            const composition = drug.genericName;
            const parts = composition.split('+').map(p => p.trim());

            const linksToCreate = [];
            const warnings = [];

            // Regex to extract Name, Value, Unit
            // Matches: "Amoxycillin (500mg)" -> "Amoxycillin", "500", "mg"
            // Also handles "Amoxycillin 500 MG" loosely if needed, current regex focuses on parenthesis format
            // Updating regex to be more flexible based on script findings
            const regex = /^(.+?)\s*(?:\(\s*([\d\.]+)\s*([a-zA-Z\/%]+)\s*\)|(\d+)\s*([a-zA-Z]+))?$/;

            parts.forEach((part, index) => {
                const match = part.match(regex);
                if (!match) {
                    warnings.push(`Could not parse part: "${part}"`);
                    return;
                }

                let name = match[1].trim();
                let strengthVal = match[2] || match[4]; // Group 2 (parens) or Group 4 (no parens)
                let strengthUnit = match[3] || match[5];

                // Clean name
                name = name.replace(/\s+/g, ' ');

                // Try to find salt ID
                let saltId = saltMap.get(name.toLowerCase());

                // Simple alias handling/fuzzy fallback could go here
                if (!saltId) {
                    // Try common aliases if needed
                    if (name.toLowerCase() === 'amoxicillin') saltId = saltMap.get('amoxycillin');
                    // Add more as discovered
                }

                if (saltId && strengthVal && strengthUnit) {
                    linksToCreate.push({
                        saltId,
                        strengthValue: parseFloat(strengthVal),
                        strengthUnit: strengthUnit.toLowerCase(), // Normalize unit
                        role: index === 0 ? 'PRIMARY' : 'SECONDARY',
                        order: index + 1
                    });
                } else if (!saltId) {
                    warnings.push(`Salt not found: "${name}"`);
                } else {
                    warnings.push(`Missing strength/unit for: "${name}"`);
                }
            });

            // 3. Create Links
            if (linksToCreate.length > 0) {
                await prisma.drugSaltLink.createMany({
                    data: linksToCreate.map(link => ({
                        drugId: drug.id,
                        ...link
                    }))
                });

                logger.info(`Auto-mapped ${linksToCreate.length} salts for drug ${drug.name} (${drugId})`);
            }

            return {
                mapped: linksToCreate.length,
                warnings
            };

        } catch (error) {
            logger.error('Error in autoMapDrug:', error);
            throw error;
        }
    }
}

module.exports = new SaltMappingService();
