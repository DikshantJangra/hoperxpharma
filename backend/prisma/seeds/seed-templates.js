const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Built-in Email Templates for Pharmacy Use Cases
 * Run with: node backend/prisma/seeds/seed-templates.js
 */

const templates = [
    // ========== WELCOME & ONBOARDING ==========
    {
        name: 'Welcome New Patient',
        category: 'welcome',
        tags: ['onboarding', 'welcome'],
        subject: 'Welcome to {{storeName}}!',
        bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Welcome, {{firstName}}! 👋</h2>
        <p>We're thrilled to have you as a patient at <strong>{{storeName}}</strong>.</p>
        <p>Your health and wellness are our top priorities. Our team is here to provide you with personalized care and support.</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #065f46;">How We Can Help You:</h3>
          <ul style="color: #064e3b;">
            <li>Expert medication counseling</li>
            <li>Prescription refill reminders</li>
            <li>Home delivery options</li>
            <li>24/7 online prescription tracking</li>
          </ul>
        </div>
        
        <p>If you have any questions, feel free to reach out to us at <strong>{{storePhone}}</strong>.</p>
        <p>Best regards,<br>The {{storeName}} Team</p>
      </div>
    `,
        variables: ['firstName', 'storeName', 'storePhone']
    },

    // ========== NOTIFICATIONS ==========
    {
        name: 'Prescription Ready for Pickup',
        category: 'notification',
        tags: ['prescription', 'pickup', 'ready'],
        subject: 'Your prescription is ready for pickup',
        bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Prescription Ready! ✅</h2>
        <p>Hi {{firstName}},</p>
        <p>Great news! Your prescription for <strong>{{medicationName}}</strong> is ready for pickup.</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Prescription #:</strong> {{prescriptionNumber}}</p>
          <p style="margin: 5px 0;"><strong>Medication:</strong> {{medicationName}}</p>
          <p style="margin: 5px 0;"><strong>Pickup Location:</strong> {{storeName}}</p>
        </div>
        
        <p><strong>Store Hours:</strong> Monday - Saturday, 9 AM - 8 PM</p>
        <p>Please bring a valid ID when picking up your medication.</p>
        
        <p>Questions? Call us at {{storePhone}}.</p>
        <p>Thank you,<br>{{storeName}}</p>
      </div>
    `,
        variables: ['firstName', 'medicationName', 'prescriptionNumber', 'storeName', 'storePhone']
    },

    {
        name: 'Medication Refill Reminder',
        category: 'notification',
        tags: ['prescription', 'refill', 'reminder'],
        subject: 'Time to refill your prescription',
        bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">Refill Reminder ⏰</h2>
        <p>Hello {{firstName}},</p>
        <p>This is a friendly reminder that your prescription for <strong>{{medicationName}}</strong> is due for a refill soon.</p>
        
        <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 5px 0;"><strong>Medication:</strong> {{medicationName}}</p>
          <p style="margin: 5px 0;"><strong>Prescription #:</strong> {{prescriptionNumber}}</p>
          <p style="margin: 5px 0;"><strong>Estimated Refill Date:</strong> {{refillDate}}</p>
        </div>
        
        <p>To refill your prescription:</p>
        <ol>
          <li>Reply to this email with your prescription number</li>
          <li>Call us at {{storePhone}}</li>
          <li>Visit our store at {{storeAddress}}</li>
        </ol>
        
        <p>Stay healthy!<br>{{storeName}} Team</p>
      </div>
    `,
        variables: ['firstName', 'medicationName', 'prescriptionNumber', 'refillDate', 'storePhone', 'storeAddress', 'storeName']
    },

    {
        name: 'Delivery Notification',
        category: 'notification',
        tags: ['delivery', 'order', 'shipping'],
        subject: 'Your order is on the way!',
        bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Out for Delivery! 🚚</h2>
        <p>Hi {{firstName}},</p>
        <p>Your order <strong>#{{orderNumber}}</strong> is on its way to you!</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order Number:</strong> {{orderNumber}}</p>
          <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> {{deliveryDate}}</p>
          <p style="margin: 5px 0;"><strong>Delivery Address:</strong> {{deliveryAddress}}</p>
        </div>
        
        <p>Our delivery partner will contact you shortly to confirm the delivery time.</p>
        <p>Please ensure someone is available to receive the package and provide a valid ID.</p>
        
        <p>Thank you for choosing {{storeName}}!</p>
      </div>
    `,
        variables: ['firstName', 'orderNumber', 'deliveryDate', 'deliveryAddress', 'storeName']
    },

    // ========== CONFIRMATIONS ==========
    {
        name: 'Order Confirmation',
        category: 'confirmation',
        tags: ['order', 'receipt', 'confirmation'],
        subject: 'Order Confirmation #{{orderNumber}}',
        bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Order Confirmed! ✅</h2>
        <p>Thank you for your order, {{firstName}}!</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 2px solid #e2e8f0;">
          <h3 style="margin-top: 0;">Order Summary</h3>
          <p style="margin: 5px 0;"><strong>Order Number:</strong> {{orderNumber}}</p>
          <p style="margin: 5px 0;"><strong>Order Date:</strong> {{orderDate}}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹{{orderTotal}}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> {{paymentMethod}}</p>
        </div>
        
        <p>We're processing your order and will notify you once it's ready for pickup/delivery.</p>
        
        <p>Need help? Contact us at {{storePhone}} or {{storeEmail}}.</p>
        <p>Best regards,<br>{{storeName}}</p>
      </div>
    `,
        variables: ['firstName', 'orderNumber', 'orderDate', 'orderTotal', 'paymentMethod', 'storePhone', 'storeEmail', 'storeName']
    },

    {
        name: 'Payment Receipt',
        category: 'confirmation',
        tags: ['payment', 'receipt', 'invoice'],
        subject: 'Payment Receipt for Order #{{orderNumber}}',
        bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Payment Received 💳</h2>
        <p>Dear {{firstName}},</p>
        <p>We've received your payment. Thank you for your business!</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981;">
          <h3 style="margin-top: 0; color: #065f46;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;"><strong>Order Number:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5; text-align: right;">{{orderNumber}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;"><strong>Amount Paid:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5; text-align: right;">₹{{amountPaid}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;"><strong>Payment Method:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5; text-align: right;">{{paymentMethod}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Transaction ID:</strong></td>
              <td style="padding: 8px 0; text-align: right;">{{transactionId}}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 12px; color: #64748b;">This is an automated receipt. Please save it for your records.</p>
        <p>Thank you,<br>{{storeName}}</p>
      </div>
    `,
        variables: ['firstName', 'orderNumber', 'amountPaid', 'paymentMethod', 'transactionId', 'storeName']
    },

    // ========== MARKETING ==========
    {
        name: 'Seasonal Health Tips',
        category: 'marketing',
        tags: ['health', 'tips', 'seasonal'],
        subject: 'Stay Healthy This Season!',
        bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Your Health Matters 🌟</h2>
        <p>Hello {{firstName}},</p>
        <p>As the season changes, it's important to take care of your health. Here are some tips from our pharmacists:</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #065f46;">Health Tips for {{season}}</h3>
          <ul style="line-height: 1.8; color: #064e3b;">
            <li>Stay hydrated - drink at least 8 glasses of water daily</li>
            <li>Maintain a regular sleep schedule</li>
            <li>Take your medications as prescribed</li>
            <li>Keep your vaccinations up to date</li>
            <li>Exercise for at least 30 minutes daily</li>
          </ul>
        </div>
        
        <p>Have questions about your medications or health? Our pharmacists are here to help!</p>
        <p>Visit us at {{storeName}} or call {{storePhone}}.</p>
        
        <p>Stay healthy!<br>{{storeName}} Care Team</p>
      </div>
    `,
        variables: ['firstName', 'season', 'storeName', 'storePhone']
    },

    {
        name: 'New Product Announcement',
        category: 'marketing',
        tags: ['product', 'announcement', 'new'],
        subject: 'Introducing {{productName}} - Now Available!',
        bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">New Arrival! 🎉</h2>
        <p>Hi {{firstName}},</p>
        <p>We're excited to announce that <strong>{{productName}}</strong> is now available at {{storeName}}!</p>
        
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #065f46;">{{productName}}</h3>
          <p style="color: #064e3b; margin: 10px 0;">{{productDescription}}</p>
          <p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 15px 0;">₹{{productPrice}}</p>
        </div>
        
        <p>Visit our store or call us at {{storePhone}} to learn more or place an order.</p>
        
        <p>Best regards,<br>{{storeName}}</p>
      </div>
    `,
        variables: ['firstName', 'productName', 'productDescription', 'productPrice', 'storeName', 'storePhone']
    }
];

async function seedTemplates() {
    try {
        console.log('🌱 Starting template seeding...\n');

        // Get all email accounts to seed templates for each
        const emailAccounts = await prisma.emailAccount.findMany({
            where: { isActive: true }
        });

        if (emailAccounts.length === 0) {
            console.log('⚠️  No active email accounts found. Please set up an email account first.');
            return;
        }

        console.log(`Found ${emailAccounts.length} email account(s)\n`);

        let totalCreated = 0;

        for (const account of emailAccounts) {
            console.log(`Seeding templates for: ${account.email}`);

            for (const template of templates) {
                try {
                    await prisma.emailTemplate.create({
                        data: {
                            emailAccountId: account.id,
                            name: template.name,
                            category: template.category,
                            tags: template.tags,
                            subject: template.subject,
                            bodyHtml: template.bodyHtml.trim(),
                            variables: template.variables,
                            isBuiltIn: true
                        }
                    });
                    totalCreated++;
                    console.log(`  ✅ ${template.name}`);
                } catch (error) {
                    console.log(`  ❌ Failed to create ${template.name}:`, error.message);
                }
            }
            console.log('');
        }

        console.log(`\n✨ Successfully seeded ${totalCreated} templates!`);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed
seedTemplates();
