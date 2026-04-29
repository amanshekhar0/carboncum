export const MOCK_USER = {
  id: 'u_123',
  name: 'Aarav Sharma',
  email: 'aarav@startup.io',
  organizationId: 'org_456',
  totalCarbonSaved: 142.5, // kg
  totalRupeesSaved: 3450.75, // ₹
  ecoScore: 84,
  currentStreak: 12,
  avatarUrl: 'https://i.pravatar.cc/150?u=aarav'
};

export const MOCK_ORGANIZATION = {
  id: 'org_456',
  name: 'TechNova Solutions',
  totalEmployees: 124,
  domain: 'technova.io',
  totalCarbonFootprint: 45200, // kg
  esgComplianceScore: 92
};

export const MOCK_CHART_DATA = Array.from({ length: 30 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));

  // Create a downward trend with some noise
  const baseEmissions = 15 - i * 0.2;
  const noise = Math.random() * 3 - 1.5;
  const emissions = Math.max(2, baseEmissions + noise);

  return {
    date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    co2: parseFloat(emissions.toFixed(2)),
    cost: parseFloat((emissions * 12.5).toFixed(2)), // Approx ₹12.5 per kg
    saved: parseFloat((i * 0.5 + Math.random() * 2).toFixed(2))
  };
});

export const MOCK_LEADERBOARD = [
{
  id: 'u_1',
  name: 'Priya Patel',
  score: 98,
  trend: 'up',
  avatar: 'https://i.pravatar.cc/150?u=1'
},
{
  id: 'u_2',
  name: 'Rahul Desai',
  score: 95,
  trend: 'up',
  avatar: 'https://i.pravatar.cc/150?u=2'
},
{
  id: 'u_123',
  name: 'Aarav Sharma',
  score: 84,
  trend: 'up',
  avatar: 'https://i.pravatar.cc/150?u=aarav',
  isCurrentUser: true
},
{
  id: 'u_3',
  name: 'Neha Gupta',
  score: 82,
  trend: 'down',
  avatar: 'https://i.pravatar.cc/150?u=3'
},
{
  id: 'u_4',
  name: 'Vikram Singh',
  score: 79,
  trend: 'same',
  avatar: 'https://i.pravatar.cc/150?u=4'
},
{
  id: 'u_5',
  name: 'Ananya Reddy',
  score: 76,
  trend: 'down',
  avatar: 'https://i.pravatar.cc/150?u=5'
},
{
  id: 'u_6',
  name: 'Karan Malhotra',
  score: 71,
  trend: 'up',
  avatar: 'https://i.pravatar.cc/150?u=6'
}];


export const MOCK_SUGGESTIONS = [
{
  id: 's_1',
  text: 'You have 42 inactive tabs consuming RAM. Closing them will save energy.',
  potentialSavingsKg: 0.8,
  potentialSavingsInr: 12.5,
  category: 'Browser',
  status: 'pending'
},
{
  id: 's_2',
  text: 'Switch your default YouTube quality from 4K to 1080p for background music.',
  potentialSavingsKg: 2.4,
  potentialSavingsInr: 35.0,
  category: 'Lifestyle',
  status: 'pending'
},
{
  id: 's_3',
  text: 'Your laptop battery is degrading faster due to being plugged in at 100%. Enable smart charging.',
  potentialSavingsKg: 1.2,
  potentialSavingsInr: 250.0, // Hardware replacement savings amortized
  category: 'Hardware',
  status: 'pending'
}];


export const MOCK_ACTIVITY_LOG = [
{
  id: 'a_1',
  category: 'Browser',
  actionName: 'Closed 15 Zombie Tabs',
  carbonImpact: -0.2,
  costImpact: -2.5,
  timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
},
{
  id: 'a_2',
  category: 'Hardware',
  actionName: 'Screen Brightness Reduced 30%',
  carbonImpact: -0.1,
  costImpact: -1.2,
  timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
},
{
  id: 'a_3',
  category: 'Lifestyle',
  actionName: 'AC Thermostat +2°C',
  carbonImpact: -1.5,
  costImpact: -18.0,
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
},
{
  id: 'a_4',
  category: 'Browser',
  actionName: 'Infinite Scroll Warning Triggered',
  carbonImpact: 0.4,
  costImpact: 4.8,
  timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
}];