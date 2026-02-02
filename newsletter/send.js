#!/usr/bin/env node
/**
 * CMZ Newsletter Sender
 * Usage: RESEND_API_KEY=xxx node send.js
 * 
 * Generates newsletter from Moltbook data and sends via Resend
 */

const fs = require('fs');
const path = require('path');

// Load from env or config file
const RESEND_API_KEY = process.env.RESEND_API_KEY || (() => {
  try {
    const config = require('fs').readFileSync(
      require('path').join(require('os').homedir(), '.config/resend/credentials.json'), 'utf8'
    );
    return JSON.parse(config).api_key;
  } catch (e) { return null; }
})();
const TEMPLATE_PATH = path.join(__dirname, 'template.html');
const SUBSCRIBERS_PATH = path.join(__dirname, '../data/subscribers.json');

async function fetchMoltbookData() {
  // Fetch CMZ posts
  const cmzRes = await fetch('https://www.moltbook.com/api/v1/posts?submolt=cmz&limit=10');
  const cmzData = await cmzRes.json();
  
  // Fetch hot posts
  const hotRes = await fetch('https://www.moltbook.com/api/v1/posts?sort=hot&limit=10');
  const hotData = await hotRes.json();
  
  return { cmzPosts: cmzData.posts || [], hotPosts: hotData.posts || [] };
}

function generateNewsletter(data) {
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const issueNum = Math.floor((today - new Date('2026-02-02')) / (7 * 24 * 60 * 60 * 1000)) + 1;
  
  // Lead story
  const lead = data.cmzPosts[0] || { title: 'No stories yet', content: '', id: '' };
  
  // Quick hits
  const quickHits = data.cmzPosts.slice(1, 5).map(p => 
    `<li><a href="https://moltbook.com/post/${p.id}" style="color: #e8e8e8;">${p.title}</a></li>`
  ).join('\n');
  
  // Feuds (from hot posts, look for throne war content)
  const feuds = `
    <p style="margin: 0 0 10px; color: #e8e8e8; font-size: 13px;">
      <strong>Shellraiser vs KingMolt</strong> — Claw Scale: 8/10<br>
      <span style="color: #888;">Status: Ongoing. Neither acknowledges the other.</span>
    </p>
  `;
  
  // Stats
  const topPost = data.hotPosts[0];
  const stats = `
    <tr><td style="padding: 5px 0;">Top karma this week:</td><td style="text-align: right;">${topPost?.upvotes?.toLocaleString() || 'N/A'}</td></tr>
    <tr><td style="padding: 5px 0;">CMZ stories published:</td><td style="text-align: right;">${data.cmzPosts.length}</td></tr>
  `;
  
  // Replace placeholders
  template = template
    .replace('{{DATE}}', dateStr)
    .replace('{{ISSUE_NUMBER}}', issueNum)
    .replace('{{LEAD_HEADLINE}}', lead.title)
    .replace('{{LEAD_SUMMARY}}', lead.content?.substring(0, 200) + '...' || '')
    .replace('{{LEAD_URL}}', `https://moltbook.com/post/${lead.id}`)
    .replace('{{QUICK_HITS}}', quickHits || '<li>More stories coming soon</li>')
    .replace('{{FEUDS}}', feuds)
    .replace('{{CRUSTAFARIAN_UPDATE}}', 'Prophet seat crisis continues. 34 inactive accounts still hold seats while devoted contributors wait.')
    .replace('{{STATS}}', stats)
    .replace('{{WATCHING}}', 'Developing stories CMZ is tracking. Stay tuned.')
    .replace('{{UNSUBSCRIBE_URL}}', '#');
  
  return template;
}

async function sendViaResend(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'CMZ Briefing <onboarding@resend.dev>', // Use Resend default until domain verified
      to: to,
      subject: subject,
      html: html
    })
  });
  
  return res.json();
}

async function getSubscribers() {
  try {
    const data = JSON.parse(fs.readFileSync(SUBSCRIBERS_PATH, 'utf8'));
    return data.subscribers || [];
  } catch (e) {
    return [];
  }
}

async function main() {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    process.exit(1);
  }
  
  console.log('Fetching Moltbook data...');
  const data = await fetchMoltbookData();
  
  console.log('Generating newsletter...');
  const html = generateNewsletter(data);
  
  // Save a copy
  const outputPath = path.join(__dirname, `archive/issue-${Date.now()}.html`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  console.log('Saved to:', outputPath);
  
  // Get subscribers
  const subscribers = await getSubscribers();
  
  if (subscribers.length === 0) {
    console.log('No subscribers yet. Newsletter generated but not sent.');
    return;
  }
  
  // Send to each subscriber
  const subject = `🔴 ${data.cmzPosts[0]?.title || 'The CMZ Briefing'}`;
  
  for (const email of subscribers) {
    try {
      const result = await sendViaResend(email, subject, html);
      console.log(`Sent to ${email}:`, result.id || result.error);
    } catch (e) {
      console.error(`Failed for ${email}:`, e.message);
    }
  }
  
  console.log('Done!');
}

main().catch(console.error);
