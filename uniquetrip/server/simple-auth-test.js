// Simple manual test for login and signup
// Run this after waiting a few minutes if rate limited

const http = require('http');

function testAPI(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function test() {
    console.log('\n🧪 Manual Authentication Test\n');
    
    const email = `manual${Date.now()}@test.com`;
    const password = 'password123';
    
    // Test 1: Signup
    console.log('1️⃣  Testing Signup...');
    try {
        const signup = await testAPI('POST', '/api/auth/signup', {
            name: 'Manual Test User',
            email: email,
            password: password
        });
        console.log(`   Status: ${signup.status}`);
        console.log(`   Response:`, signup.data);
        
        if (signup.status === 201 && signup.data.success) {
            console.log('   ✅ Signup works!\n');
        } else if (signup.status === 429) {
            console.log('   ⏰ Rate limited - wait 15 minutes and try again\n');
            return;
        } else {
            console.log('   ❌ Signup failed\n');
        }
    } catch (err) {
        console.log('   ❌ Error:', err.message, '\n');
        return;
    }
    
    // Test 2: Login
    console.log('2️⃣  Testing Login...');
    try {
        const login = await testAPI('POST', '/api/auth/login', {
            email: email,
            password: password
        });
        console.log(`   Status: ${login.status}`);
        console.log(`   Response:`, login.data);
        
        if (login.status === 200 && login.data.success && login.data.token) {
            console.log('   ✅ Login works!\n');
            console.log('   Token:', login.data.token.substring(0, 30) + '...');
            console.log('   User:', login.data.user);
        } else if (login.status === 429) {
            console.log('   ⏰ Rate limited - wait 15 minutes and try again\n');
        } else {
            console.log('   ❌ Login failed\n');
        }
    } catch (err) {
        console.log('   ❌ Error:', err.message, '\n');
    }
    
    console.log('\n✅ Manual test complete!\n');
}

test().catch(console.error);
