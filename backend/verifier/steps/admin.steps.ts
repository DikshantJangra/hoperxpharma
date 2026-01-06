/**
 * Admin Step Implementations
 * Steps for admin, roles, pin, and feature toggle scenarios
 */

import { StepResult, ScenarioContext } from '../types';

const roleService = require('../../src/services/roleService');
const userRoleService = require('../../src/services/userRoleService');
const adminPinService = require('../../src/services/adminPinService');
const featureToggleService = require('../../src/services/featureToggleService');

export const adminSteps = {
    // --- ROLES & PERMISSIONS ---

    /**
     * Create a custom role
     */
    async createRole(
        ctx: ScenarioContext,
        params: { name: string; description?: string; category?: string; permissionIds?: string[] }
    ): Promise<StepResult> {
        try {
            const currentUser = ctx.get<any>('currentUser');
            const timestamp = Date.now();
            const roleName = params.name || `DPFV Role ${timestamp}`;

            const roleData = {
                name: roleName,
                description: params.description || 'Created by DPFV',
                category: params.category || 'CUSTOM',
                permissionIds: params.permissionIds || []
            };

            const role = await roleService.createRole(roleData, currentUser.id);
            ctx.set('role', role);
            ctx.set('roleId', role.id);

            return {
                success: true,
                data: role,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Assign role to user
     */
    async assignRole(ctx: ScenarioContext, userId?: string, roleId?: string): Promise<StepResult> {
        try {
            const uId = userId || ctx.get<any>('storeUser').userId;
            const rId = roleId || ctx.get<string>('roleId');
            const storeId = ctx.storeId;
            const currentUser = ctx.get<any>('currentUser');

            const assignment = await userRoleService.assignRole(uId, rId, storeId, currentUser.id);
            ctx.set('roleAssignment', assignment);

            return {
                success: true,
                data: assignment,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Delete custom role
     */
    async deleteRole(ctx: ScenarioContext, roleId?: string): Promise<StepResult> {
        try {
            const rId = roleId || ctx.get<string>('roleId');
            const currentUser = ctx.get<any>('currentUser');

            await roleService.deleteRole(rId, currentUser.id);

            return {
                success: true,
                data: { deletedId: rId },
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    // --- ADMIN PIN ---

    /**
     * Setup Admin PIN
     */
    async setupPin(ctx: ScenarioContext, pin: string): Promise<StepResult> {
        try {
            const userId = ctx.get<any>('currentUser').id;
            const result = await adminPinService.setupPin(userId, pin);

            ctx.set('adminPin', pin); // Store plain pin for verification steps

            return {
                success: true,
                data: result,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Verify Admin PIN
     */
    async verifyPin(ctx: ScenarioContext, pinToVerify?: string): Promise<StepResult> {
        try {
            const userId = ctx.get<any>('currentUser').id;
            const pin = pinToVerify || ctx.get<string>('adminPin');

            const isValid = await adminPinService.verifyPin(userId, pin);

            return {
                success: true, // If verifyPin doesn't throw, it's valid
                data: { valid: isValid },
                duration: 0
            };
        } catch (error: any) {
            // 403 or 401 are expected for invalid pins, but service throws them
            // We return error so assertion can check it
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    // --- FEATURE TOGGLES ---

    /**
     * Get store features
     */
    async getStoreFeatures(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const storeId = ctx.storeId;
            const features = await featureToggleService.getFeaturesForStore(storeId);

            ctx.set('storeFeatures', features);

            return {
                success: true,
                data: features,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Update feature overrides
     */
    async updateStoreFeatures(ctx: ScenarioContext, overrides: any): Promise<StepResult> {
        try {
            const storeId = ctx.storeId;
            const updated = await featureToggleService.updateStoreFeatures(storeId, overrides);

            ctx.set('storeFeatures', updated); // Update context

            return {
                success: true,
                data: updated,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    }
};
