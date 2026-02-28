import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api/proxy');

app.get('/', async (c) => {
  const url = c.req.query('url');
  
  if (!url || typeof url !== 'string') {
    c.header('Access-Control-Allow-Origin', '*');
    return c.json({ error: 'URL parameter required' }, 400);
  }
  
  try {
    const decodedUrl = decodeURIComponent(url);
    
    const response = await fetch(decodedUrl, {
      headers: {
        'Referer': 'https://hianime.to/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      }
    });
    
    if (!response.ok) {
      c.header('Access-Control-Allow-Origin', '*');
      return c.json({ error: `Upstream: ${response.status}` }, 502);
    }
    
    const body = await response.text();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Content-Type', contentType);
    
    return c.body(body);
  } catch (error) {
    c.header('Access-Control-Allow-Origin', '*');
    return c.json({ error: 'Fetch failed' }, 500);
  }
});

app.options('/', (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  return c.body(null, 204);
});

export const GET = handle(app);
export const OPTIONS = handle(app);
