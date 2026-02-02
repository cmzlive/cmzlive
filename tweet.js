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
    const result = await client.v2.tweet(tweet);
    console.log('Tweet posted:', result.data.id);
    console.log('URL: https://x.com/CmzLive82039/status/' + result.data.id);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.data) console.error('Details:', JSON.stringify(err.data, null, 2));
  }
}

post();
