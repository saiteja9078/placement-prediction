const http = require('http');

function check(label, url) {
  return new Promise((resolve) => {
    http.get(url, r => {
      let b = '';
      r.on('data', c => b += c);
      r.on('end', () => { console.log(label + ':', r.statusCode, b); resolve(true); });
    }).on('error', e => { console.log(label + ' ERR:', e.message); resolve(false); });
  });
}

async function main() {
  await check('Flask ML', 'http://localhost:5001/health');
  await check('Backend', 'http://localhost:5000/api/health');
  console.log('Both checked.');
}
main();
