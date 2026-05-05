// Simple script to create a user, log in, and then delete the account
const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-test-bypass': 'true',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  const email = `delete_me_${Date.now()}@test.com`;
  const password = 'Delete123!';
  const name = 'Delete Me';
  console.log('Creating user:', email);
  let res = await request('/api/auth/signup', 'POST', { name, email, password });
  console.log('Signup:', res.statusCode, res.data?.message || res.data?.error);
  if (res.statusCode !== 201) return;

  res = await request('/api/auth/login', 'POST', { email, password });
  console.log('Login:', res.statusCode, res.data?.message || res.data?.error);
  if (res.statusCode !== 200 || !res.data.token) return;
  const token = res.data.token;

  res = await request('/api/auth/me', 'DELETE', null, { Authorization: `Bearer ${token}` });
  console.log('Delete:', res.statusCode, res.data?.message || res.data?.error);

  // Verify profile no longer exists
  res = await request(`/api/auth/profile?email=${encodeURIComponent(email)}`, 'GET');
  console.log('Profile after delete:', res.statusCode, res.data?.error || JSON.stringify(res.data));
})();
