/**
 * MockDB.js
 * In-memory storage for resilient mode.
 * Keeps user data and activity logs alive even if MongoDB is down.
 */

const users = new Map();
const logs = new Map();

const MockDB = {
  saveUser: (user) => {
    users.set(user.id || user._id.toString(), user);
    console.log(`[MockDB] User saved: ${user.name}`);
  },
  
  getUser: (userId) => {
    return users.get(userId);
  },
  
  saveLog: (userId, log) => {
    if (!logs.has(userId)) logs.set(userId, []);
    logs.get(userId).push({ ...log, id: Date.now().toString(), timestamp: new Date() });
  },
  
  getLogs: (userId) => {
    return logs.get(userId) || [];
  },
  
  getAllUsers: () => {
    return Array.from(users.values());
  }
};

module.exports = MockDB;
