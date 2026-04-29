const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const ActivityLog = require('./src/models/ActivityLog');
const Organization = require('./src/models/Organization');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Keep only users named Zack or ahi (case insensitive)
    const usersToKeep = await User.find({
      $or: [
        { name: /Zack/i },
        { name: /ahi/i },
        { email: /zack/i },
        { email: /ahi/i }
      ]
    });

    const keepIds = usersToKeep.map(u => u._id);
    console.log(`Keeping ${usersToKeep.length} users: ${usersToKeep.map(u => u.name).join(', ')}`);

    // Delete others
    const userRes = await User.deleteMany({ _id: { $nin: keepIds } });
    console.log(`Deleted ${userRes.deletedCount} dummy users`);

    // Delete logs of deleted users
    const logRes = await ActivityLog.deleteMany({ userId: { $nin: keepIds } });
    console.log(`Deleted ${logRes.deletedCount} dummy activity logs`);

    // Clear organizations
    await Organization.deleteMany({});
    console.log('Cleared organizations');

    console.log('Cleanup complete');
  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

cleanup();
