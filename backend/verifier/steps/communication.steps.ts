
import { ScenarioContext, StepResult } from '../types';
const emailService = require('../../src/services/email/emailService');
const emailRepository = require('../../src/repositories/emailRepository');

export const communicationSteps = {
    /**
     * Ensure an email account exists for the store (or create a mock one)
     */
    async ensureEmailAccount(ctx: ScenarioContext): Promise<StepResult> {
        const storeId = ctx.storeId;
        const userId = ctx.userId;

        try {
            // Check existing
            const existing = await emailRepository.getPrimaryEmailAccount(storeId);
            if (existing) {
                ctx.set('emailAccount', existing);
                return { success: true, data: existing, duration: 0 };
            }

            // Create mock account (OAUTH type to pass service check, but invalid token will fail sending)
            const account = await emailRepository.createEmailAccount({
                storeId,
                email: 'test@hoperx.com',
                provider: 'GMAIL',
                authMethod: 'OAUTH',
                isPrimary: true,
                isVerified: true,
                gmailAccessToken: 'mock_token',
                gmailRefreshToken: 'mock_refresh',
                gmailTokenExpiry: new Date(Date.now() + 3600000)
            });

            ctx.set('emailAccount', account);
            return { success: true, data: account, duration: 0 };
        } catch (error: any) {
            return { success: false, error, duration: 0 };
        }
    },

    /**
     * Send an email and verify log creation
     */
    async sendEmail(ctx: ScenarioContext, subject: string): Promise<StepResult> {
        const storeId = ctx.storeId;
        const userId = ctx.userId;
        const account = ctx.get<any>('emailAccount');

        try {
            // We expect this might fail due to invalid OAuth token, but we want to verify LOGGING
            try {
                await emailService.sendEmail(storeId, {
                    to: 'recipient@hoperx.com',
                    subject,
                    bodyHtml: '<p>Test Body</p>',
                    accountId: account.id
                }, userId);
            } catch (e) {
                // Ignore send error, we check log next
            }

            // Verify log exists
            const result = await emailRepository.getEmailLogs(storeId) as any;
            const latestLog = result.logs[0]; // Assuming descending order from repository

            ctx.set('latestEmailLog', latestLog);

            if (!latestLog || latestLog.subject !== subject) {
                return {
                    success: false,
                    duration: 0,
                    error: new Error('Email log not found or subject mismatch')
                };
            }

            return { success: true, data: latestLog, duration: 0 };
        } catch (error: any) {
            return { success: false, error, duration: 0 };
        }
    }
};
