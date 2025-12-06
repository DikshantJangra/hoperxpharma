const savedFilterRepository = require('../../repositories/savedFilterRepository');
const ApiError = require('../../utils/ApiError');

class SavedFilterService {
    async createSavedFilter(userId, data) {
        return await savedFilterRepository.create({
            ...data,
            userId,
        });
    }

    async getSavedFilters(userId) {
        return await savedFilterRepository.findAll(userId);
    }

    async deleteSavedFilter(userId, id) {
        const filter = await savedFilterRepository.findById(id);
        if (!filter) {
            throw new ApiError(404, 'Saved filter not found');
        }
        if (filter.userId !== userId) {
            throw new ApiError(403, 'Unauthorized access to this filter');
        }
        return await savedFilterRepository.delete(id);
    }
}

module.exports = new SavedFilterService();
