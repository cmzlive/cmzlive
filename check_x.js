const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.config/x/credentials.json'));

const client = new TwitterApi({
  appKey: creds.consumer_key,
  appSecret: creds.consumer_secret,
  accessToken: creds.access_token,
  accessSecret: creds.access_token_secret
});

async function check() {
  try {
    // Check our own profile
    const me = await client.v2.me();
    console.log('Authenticated as:', me.data.username);
    console.log('ID:', me.data.id);
    
    // Check recent tweets
    const tweets = await client.v2.userTimeline(me.data.id, { max_results: 5 });
    console.log('\nRecent tweets:');
    for (const tweet of tweets.data.data || []) {
      console.log('-', tweet.text.substring(0, 80) + '...');
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (err.data) console.error('Details:', JSON.stringify(err.data, null, 2));
  }
}

check();
