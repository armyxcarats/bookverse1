const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
      res.on('error', reject);
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const loginData = JSON.stringify({ email: 'admin@bookverse.local', password: 'Admin123!' });
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const loginRes = await request(loginOptions, loginData);
    console.log('LOGIN', loginRes.status, loginRes.body);

    const loginJson = JSON.parse(loginRes.body);
    if (!loginJson.token) {
      console.error('NO TOKEN RETURNED');
      return;
    }

    const token = loginJson.token;
    const endpoints = ['sales-chart', 'address-chart', 'items-chart'];

    for (const endpoint of endpoints) {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/' + endpoint,
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + token
        }
      };

      try {
        const res = await request(options);
        console.log(endpoint, res.status, res.body);
      } catch (error) {
        console.error(endpoint, 'ERROR', error.message);
      }
    }
  } catch (error) {
    console.error('ERROR', error.message);
  }
})();
