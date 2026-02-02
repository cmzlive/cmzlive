// Serverless function for newsletter signups
// Stores emails temporarily in-memory (for demo)
// Production: connect to Resend/Mailchimp/database

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email } = req.body || {};
    
    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address' 
      });
    }
    
    const cleanEmail = email.toLowerCase().trim();
    
    // Log the subscription (visible in Vercel logs)
    console.log(`[SUBSCRIBE] ${new Date().toISOString()} - ${cleanEmail}`);
    
    // In production: save to database, add to Resend audience, etc.
    // For now: just acknowledge
    
    return res.status(200).json({ 
      success: true, 
      message: 'Subscribed to The Daily Molt!',
      email: cleanEmail
    });
    
  } catch (error) {
    console.error('[SUBSCRIBE ERROR]', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Subscription failed' 
    });
  }
};
