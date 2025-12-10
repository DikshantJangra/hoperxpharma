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

    const patients = [
        {
            firstName: 'Rahul',
            lastName: 'Sharma',
            phoneNumber: '9812345678',
            gender: 'Male',
            dateOfBirth: new Date('1985-05-15'),
            addressLine1: '123, MG Road, Sector 14',
            city: 'Gurgaon',
            state: 'Haryana',
            pinCode: '122001',
            email: 'rahul.sharma@example.com',
            bloodGroup: 'B+',
        },
        {
            firstName: 'Priya',
            lastName: 'Verma',
            phoneNumber: '9988776655',
            gender: 'Female',
            dateOfBirth: new Date('1990-10-20'),
            addressLine1: 'Flat 4B, Green Park Apartments, Lajpat Nagar',
            city: 'New Delhi',
            state: 'Delhi',
            pinCode: '110024',
            email: 'priya.verma@example.com',
            bloodGroup: 'O+',
        }
    ];

    for (const p of patients) {
        try {
            // Check if exists
            const existing = await prisma.patient.findFirst({
                where: {
                    storeId,
                    phoneNumber: p.phoneNumber
                }
            });

            if (existing) {
                console.log(`Patient ${p.firstName} ${p.lastName} already exists. Skipping.`);
                continue;
            }

            const newPatient = await prisma.patient.create({
                data: {
                    storeId,
                    ...p
                }
            });
            console.log(`Created patient: ${newPatient.firstName} ${newPatient.lastName}`);
        } catch (error) {
            console.error(`Error creating patient ${p.firstName} ${p.lastName}:`, error);
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
