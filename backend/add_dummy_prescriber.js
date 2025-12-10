const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'dikshantjangra1@gmail.com';
    console.log(`Finding user with email: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            storeUsers: {
                where: { isPrimary: true },
                include: { store: true }
            }
        }
    });

    if (!user) {
        console.error('User not found');
        return;
    }

    const primaryStoreUser = user.storeUsers[0];
    if (!primaryStoreUser || !primaryStoreUser.store) {
        console.error('Primary store not found for user');
        return;
    }

    const storeId = primaryStoreUser.store.id;
    console.log(`Found primary store: ${primaryStoreUser.store.name} (${storeId})`);

    // Create dummy prescriber
    try {
        const prescriber = await prisma.prescriber.create({
            data: {
                storeId,
                name: 'Dr. Dummy Prescriber',
                licenseNumber: 'DUMMY-12345',
                clinic: 'Dummy Clinic',
                phoneNumber: '9876543210',
                email: 'dummy@example.com',
                specialty: 'General Practice'
            }
        });
        console.log('Successfully created dummy prescriber:');
        console.log(JSON.stringify(prescriber, null, 2));
    } catch (error) {
        if (error.code === 'P2002') {
            console.log('Dummy prescriber already exists.');
        } else {
            console.error('Error creating prescriber:', error);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
