const Joi = require('joi');

const emailProviders = ['GMAIL', 'ZOHO', 'OUTLOOK', 'OTHER'];

// Configure email account
const configureEmailAccount = {
    body: Joi.object({
        email: Joi.string().email().required(),
        provider: Joi.string().valid(...emailProviders).required(),
        smtpHost: Joi.string().required(),
        smtpPort: Joi.number().integer().min(1).max(65535).required(),
        smtpUser: Joi.string().required(),
        smtpPassword: Joi.string().required(),
        useTLS: Joi.boolean().default(true),
    }),
};

// Update email account
const updateEmailAccount = {
    body: Joi.object({
        email: Joi.string().email(),
        provider: Joi.string().valid(...emailProviders),
        smtpHost: Joi.string(),
        smtpPort: Joi.number().integer().min(1).max(65535),
        smtpUser: Joi.string(),
        smtpPassword: Joi.string(),
        useTLS: Joi.boolean(),
        isActive: Joi.boolean(),
    }).min(1),
};

// Send email
const sendEmail = {
    body: Joi.object({
        to: Joi.alternatives().try(
            Joi.string().email(),
            Joi.array().items(Joi.string().email())
        ).required(),
        cc: Joi.alternatives().try(
            Joi.string().email(),
            Joi.array().items(Joi.string().email())
        ),
        bcc: Joi.alternatives().try(
            Joi.string().email(),
            Joi.array().items(Joi.string().email())
        ),
        subject: Joi.string().required().max(500),
        bodyHtml: Joi.string().required(),
        attachments: Joi.array().items(
            Joi.object({
                filename: Joi.string().required(),
                path: Joi.string(),
                content: Joi.string(),
                contentType: Joi.string(),
            })
        ),
        context: Joi.object({
            type: Joi.string().valid('PO', 'INVOICE', 'VENDOR', 'PATIENT'),
            id: Joi.string(),
        }),
    }),
};

// Create template
const createTemplate = {
    body: Joi.object({
        name: Joi.string().required().max(200),
        subject: Joi.string().required().max(500),
        bodyHtml: Joi.string().required(),
        variables: Joi.array().items(Joi.string()).default([]),
    }),
};

// Update template
const updateTemplate = {
    body: Joi.object({
        name: Joi.string().max(200),
        subject: Joi.string().max(500),
        bodyHtml: Joi.string(),
        variables: Joi.array().items(Joi.string()),
    }).min(1),
};

// Render template
const renderTemplate = {
    body: Joi.object({
        variables: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
    }),
};

// Get email logs (query params)
const getEmailLogs = {
    query: Joi.object({
        status: Joi.string().valid('SENT', 'FAILED', 'PENDING'),
        limit: Joi.number().integer().min(1).max(100).default(50),
        skip: Joi.number().integer().min(0).default(0),
    }),
};

module.exports = {
    configureEmailAccount,
    updateEmailAccount,
    sendEmail,
    createTemplate,
    updateTemplate,
    renderTemplate,
    getEmailLogs,
};
