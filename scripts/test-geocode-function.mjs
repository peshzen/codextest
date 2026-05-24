#!/usr/bin/env node

const endpoint = process.env.GEOCODE_ENDPOINT || 'http://localhost:8888/.netlify/functions/geocode-address';
const address = '1600 Amphitheatre Parkway, Mountain View, CA';

async function run() {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  const data = await res.json();
  console.log('status', res.status);
  console.log(JSON.stringify(data, null, 2));
}

run().catch((err) => {
  console.error('Test request failed:', err.message);
  process.exit(1);
});
