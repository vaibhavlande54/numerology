// Delete a user by logging in (preferred) or falling back to direct SQL delete
// Usage: node delete-user-cli.js <email> <password>

require('dotenv').config();
const http = require('http');
const mysql = require('mysql2/promise');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'user123',
  database: process.env.DB_NAME || 'makemytrip',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
};

function req(path, method='GET', data=null, headers={}){
  return new Promise((resolve,reject)=>{
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const r = http.request(options, res=>{
      let body='';
      res.on('data',c=>body+=c);
      res.on('end',()=>{
        try{ resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch{ resolve({ status: res.statusCode, data: body }); }
      });
    });
    r.on('error',reject);
    if(data) r.write(JSON.stringify(data));
    r.end();
  });
}

async function deleteDirectByEmail(email){
  const pool = await mysql.createPool(DB_CONFIG);
  try{
    const [before] = await pool.query('SELECT id, email FROM users WHERE LOWER(email)=LOWER(?)', [email]);
    if(before.length === 0){
      console.log('No matching user found for direct deletion.');
      await pool.end();
      return { deleted: false, reason: 'not-found' };
    }
    const id = before[0].id;
    const [result] = await pool.query('DELETE FROM users WHERE id=?', [id]);
    const [after] = await pool.query('SELECT id FROM users WHERE id=?', [id]);
    await pool.end();
    return { deleted: result.affectedRows > 0 && after.length === 0, id };
  } catch(err){
    await pool.end();
    throw err;
  }
}

(async ()=>{
  const [,, email, password] = process.argv;
  if(!email){
    console.error('Usage: node delete-user-cli.js <email> <password>');
    process.exit(2);
  }
  console.log('Attempting API delete for:', email);
  try{
    const login = await req('/api/auth/login', 'POST', { email, password });
    if(login.status === 200 && login.data && login.data.token){
      console.log('Login successful via API. Deleting account...');
      const del = await req('/api/auth/me', 'DELETE', null, { Authorization: `Bearer ${login.data.token}` });
      console.log('Delete via API:', del.status, del.data?.message || del.data?.error || del.data);
      const profile = await req(`/api/auth/profile?email=${encodeURIComponent(email)}`,'GET');
      console.log('Profile check after delete:', profile.status, typeof profile.data==='object'? (profile.data.error||JSON.stringify(profile.data)) : profile.data);
      process.exit(0);
    }
    console.warn('Login failed or token missing, will try direct DB delete. Status:', login.status);
  } catch(err){
    console.warn('API path failed, will try direct DB delete. Reason:', err.message);
  }

  // Fallback: direct SQL delete by email
  try{
    const result = await deleteDirectByEmail(email);
    if(result.deleted){
      console.log(`Direct SQL delete successful. User id ${result.id} removed.`);
      process.exit(0);
    } else if(result.reason === 'not-found'){
      console.log('User not found in DB. Nothing to delete.');
      process.exit(0);
    } else {
      console.error('Direct SQL delete reported no deletion.');
      process.exit(1);
    }
  } catch(err){
    console.error('Direct SQL delete error:', err.message);
    process.exit(1);
  }
})();
