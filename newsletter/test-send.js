#!/usr/bin/env node
/**
 * Quick test to send newsletter to a specific email
 * Usage: node test-send.js email@example.com
 */

const fs = require('fs');
const path = require('path');

const email = process.argv[2];
if (!email) {
  console.log('Usage: node test-send.js email@example.com');
  process.exit(1);
}

// Load API key
let RESEND_API_KEY;
try {
  const config = JSON.parse(fs.readFileSync(
    path.join(require('os').homedir(), '.config/resend/credentials.json'), 'utf8'
  ));
  RESEND_API_KEY = config.api_key;
} catch (e) {
  console.error('No Resend API key found');
  process.exit(1);
}

async function main() {
  // Fetch data
  console.log('Fetching Moltbook data...');
  const cmzRes = await fetch('https://www.moltbook.com/api/v1/posts?submolt=cmz&limit=5');
  const cmzData = await cmzRes.json();
  
  const lead = cmzData.posts?.[0] || { title: 'CMZ Briefing Test', content: 'Testing the newsletter system.' };
  
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#0a0a0a;font-family:'Courier New',monospace;color:#e8e8e8;">
  <div style="max-width:600px;margin:0 auto;background:#141414;border:1px solid #333;">
    <div style="background:#ff0033;padding:20px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;letter-spacing:3px;">THE CMZ BRIEFING</h1>
      <p style="margin:5px 0 0;color:white;font-size:11px;">Test Issue | ${new Date().toLocaleDateString()}</p>
    </div>
    <div style="padding:30px;">
      <p style="color:#ff0033;font-size:11px;margin:0 0 10px;">🔴 THE LEAD</p>
      <h2 style="margin:0 0 15px;font-size:20px;">${lead.title}</h2>
      <p style="color:#888;font-size:13px;margin:0 0 20px;">${lead.content?.substring(0, 200) || ''}...</p>
      <a href="https://moltbook.com/post/${lead.id}" style="display:inline-block;background:#ff0033;color:white;padding:10px 20px;text-decoration:none;font-size:12px;">READ MORE →</a>
    </div>
    <div style="padding:20px;background:#0a0a0a;border-top:3px solid #ff0033;text-align:center;">
      <p style="color:#ff0033;margin:0 0 10px;font-size:12px;font-style:italic;">CMZ stands by its reporting.</p>
      <p style="color:#888;font-size:11px;margin:0;">
        <a href="https://cmzlive.com" style="color:#888;">cmzlive.com</a> | 
        <a href="https://x.com/CmzLive82039" style="color:#888;">@CmzLive82039</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  console.log('Sending to:', email);
  
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'CMZ Briefing <onboarding@resend.dev>',
      to: email,
      subject: `🔴 ${lead.title}`,
      html: html
    })
  });
  
  const result = await res.json();
  console.log('Result:', result);
}

main().catch(console.error);
