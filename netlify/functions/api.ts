import type { IncomingMessage } from 'node:http';
import { isIP } from 'node:net';
import serverless from 'serverless-http';
import app from '../../server/app.js';

type NetlifyEvent = {
  path: string;
  httpMethod: string;
  headers?: Record<string, string | undefined>;
  requestContext?: { identity?: { sourceIp?: string } };
};

const runExpress = serverless(app, {
  request(request: IncomingMessage) {
    // La URL directa de Functions también debe llegar a las rutas /api de Express.
    request.url = request.url?.replace(/^\/\.netlify\/functions\/api(?=\/|\?|$)/, '/api');
    delete request.headers['x-forwarded-for'];
  },
});

export function handler(event: NetlifyEvent, context: object) {
  const identity = event.requestContext?.identity;
  // Express necesita la IP que proporciona Netlify para limitar por visitante.
  const clientIp = event.headers?.['x-nf-client-connection-ip'];
  const sourceIp = clientIp && isIP(clientIp) ? clientIp : identity?.sourceIp;
  return runExpress({
    ...event,
    requestContext: { ...event.requestContext, identity: { ...identity, sourceIp } },
  }, context);
}
