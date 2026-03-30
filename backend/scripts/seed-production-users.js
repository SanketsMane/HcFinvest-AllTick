import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models using dynamic import since they use ES modules
async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const User = (await import('../models/User.js')).default;
        const Admin = (await import('../models/Admin.js')).default;

        // 1. Create Admin
        const adminEmail = 'rathodnilesh166@gmail.com';
        const adminPass = 'Heddge@2025';
        
        let admin = await Admin.findOne({ email: adminEmail });
        if (admin) {
            console.log('Admin already exists. Updating password...');
            admin.password = await bcrypt.hash(adminPass, 12);
            await admin.save();
        } else {
            console.log('Creating Admin...');
            admin = await Admin.create({
                firstName: 'Nilesh',
                lastName: 'Rathod',
                email: adminEmail,
                password: await bcrypt.hash(adminPass, 12),
                role: 'SUPER_ADMIN',
                urlSlug: 'main',
                status: 'ACTIVE',
                permissions: {
                    canManageUsers: true,
                    canCreateUsers: true,
                    canDeleteUsers: true,
                    canViewUsers: true,
                    canManageTrades: true,
                    canCloseTrades: true,
                    canModifyTrades: true,
                    canManageAccounts: true,
                    canCreateAccounts: true,
                    canDeleteAccounts: true,
                    canModifyLeverage: true,
                    canManageDeposits: true,
                    canApproveDeposits: true,
                    canManageWithdrawals: true,
                    canApproveWithdrawals: true,
                    canManageKYC: true,
                    canApproveKYC: true,
                    canManageIB: true,
                    canApproveIB: true,
                    canManageCopyTrading: true,
                    canApproveMasters: true,
                    canManageSymbols: true,
                    canManageGroups: true,
                    canManageSettings: true,
                    canManageTheme: true,
                    canViewReports: true,
                    canExportReports: true,
                    canManageAdmins: true,
                    canFundAdmins: true
                }
            });
            console.log('Admin created.');
        }

        // 2. Create User
        const userEmail = 'contactsanket1@gmail.com';
        const userPass = 'Sanket@3030';

        let user = await User.findOne({ email: userEmail });
        if (user) {
            console.log('User already exists. Updating password...');
            user.password = userPass; // Model has pre-save hook
            await user.save();
        } else {
            console.log('Creating User...');
            user = await User.create({
                firstName: 'Sanket',
                email: userEmail,
                password: userPass,
                emailVerified: true,
                emailVerifiedAt: new Date(),
                assignedAdmin: admin._id,
                adminUrlSlug: admin.urlSlug
            });
            console.log('User created.');
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
