/**
 * Seed admin and default test user with password "password".
 * Export seedUsers() for server startup; can also run standalone: node scripts/seedUsers.js
 * Idempotent: skips creation if users already exist.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const PASSWORD = 'password';

const users = [
  { email: 'admin@example.com', name: 'Admin User', isAdmin: true },
  { email: 'test@example.com', name: 'Test User', isAdmin: false },
];

export async function seedUsers() {
  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log('User already exists:', u.email);
      continue;
    }
    await User.create({ ...u, password: PASSWORD });
    console.log('Created:', u.email, u.isAdmin ? '(admin)' : '');
  }
  console.log('User seed complete.');
}

// Run standalone when executed directly
const isMain = process.argv[1]?.endsWith('seedUsers.js');
if (isMain) {
  mongoose.connect(process.env.MONGODB_URI).then(async () => {
    await seedUsers();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
