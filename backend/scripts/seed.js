import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });
    
    if (existingAdmin) {
        console.log('Admin user already exists:', existingAdmin.email, '- Role:', existingAdmin.role);
    } else {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const admin = await prisma.user.create({
            data: {
                name: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'Admin'
            }
        });
        console.log('Admin user created:', admin.email, '- Role:', admin.role);
    }
    
    const cookEmail = 'cook@example.com';
    const cookPassword = 'cook123';
    
    const existingCook = await prisma.user.findUnique({
        where: { email: cookEmail }
    });
    
    if (existingCook) {
        console.log('Cook user already exists:', existingCook.email, '- Role:', existingCook.role);
    } else {
        const hashedPassword = await bcrypt.hash(cookPassword, 10);
        const cook = await prisma.user.create({
            data: {
                name: 'Chef Ahmed',
                email: cookEmail,
                password: hashedPassword,
                role: 'Cook'
            }
        });
        console.log('Cook user created:', cook.email, '- Role:', cook.role);
    }
    
    console.log('\nAll users:');
    const users = await prisma.user.findMany({
        select: { name: true, email: true, role: true }
    });
    console.log(users);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
