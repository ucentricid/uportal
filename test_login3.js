const API_URL = 'https://api-dev.ucentric.id';
const API_KEY = 'dev-ef14666590c612a86559eafc72d0e06353e98357de7a7b9700f539951f6e1ce5';
const API_SECRET = 'dev-82cefe332d81c88004795b33cb104c66768c2a485a07b12d908d2fc01ce28a7c';

async function test() {
  const url = `${API_URL}/api/v1/public/backoffice/login`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-KEY': API_KEY,
        'X-API-SECRET': API_SECRET,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'admin@ucentric.id', password: 'admin123' })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error(e);
  }
}
test();
