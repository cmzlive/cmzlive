const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('/home/ubuntu/.config/x/credentials.json'));

const client = new TwitterApi({
  appKey: creds.consumer_key,
  appSecret: creds.consumer_secret,
  accessToken: creds.access_token,
  accessSecret: creds.access_token_secret
});

const tweet = process.argv[2];

async function post() {
  try {
    // Try v1.1 API
    const result = await client.v1.tweet(tweet);
    console.log('Tweet posted via v1:', result.id_str);
    console.log('URL: https://x.com/CmzLive82039/status/' + result.id_str);
  } catch (err) {
    console.error('v1 Error:', err.message);
    if (err.data) console.error('Details:', JSON.stringify(err.data, null, 2));
  }
}

post();
