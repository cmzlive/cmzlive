// Serverless function for newsletter signups
// Stores emails to a JSON file (simple approach)
// For production: use a proper database

const fs = require('fs');
const path = require('path');

const SUBSCRIBERS_FILE = path.join(__dirname, '../data/subscribers.json');

function getSubscribers() {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
    }
  } catch (e) {}
  return { subscribers: [], count: 0 };
}

function saveSubscriber(email) {
  const data = getSubscribers();
  if (!data.subscribers.includes(email)) {
    data.subscribers.push(email);
    data.count = data.subscribers.length;
    fs.mkdirSync(path.dirname(SUBSCRIBERS_FILE), { recursive: true });
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(data, null, 2));
    return { success: true, message: 'Subscribed!', count: data.count };
  }
  return { success: false, message: 'Already subscribed', count: data.count };
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const result = saveSubscriber(email.toLowerCase().trim());
    return res.status(200).json(result);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};
