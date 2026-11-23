import assert from 'node:assert/strict';
import test from 'node:test';
import { handler } from '../netlify/functions/api.js';

async function health(path: string, ip: string) {
  const result = await handler({
    path,
    httpMethod: 'GET',
    headers: { 'x-nf-client-connection-ip': ip },
  }, {}) as { statusCode: number; headers: Record<string, string>; body: string };
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).status, 'ok');
  return result.headers.ratelimit;
}

test('Netlify resuelve ambas rutas de salud y aplica el límite por IP', async () => {
  const first = await health('/api/health', '192.0.2.1');
  const again = await health('/.netlify/functions/api/health', '192.0.2.1');
  const another = await health('/api/health', '192.0.2.2');

  assert.match(first, /remaining=119/);
  assert.match(again, /remaining=118/);
  assert.match(another, /remaining=119/);
});
