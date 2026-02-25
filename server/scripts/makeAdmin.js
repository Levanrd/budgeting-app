/**
 * Promote a user to admin by email.
 * Run: node scripts/makeAdmin.js your@email.com
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/makeAdmin.js <email>');
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { isAdmin: true } },
    { new: true }
  );
  if (!user) {
    console.error('User not found:', email);
    process.exit(1);
  }
  console.log('Admin granted to:', user.email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
