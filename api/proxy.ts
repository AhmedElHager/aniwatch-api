import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api/proxy');

app.get('/', async (c) => {
  const url = c.req.query('url');
  
  if (!url) {
    return c.json({ error: 'URL parameter required' }, 400);
  }
  
  try {
    const decodedUrl = decodeURIComponent(url);
    
    const response = await fetch(decodedUrl, {
      headers: {
        'Referer': 'https://hianime.to/',
        'Origin': 'https://hianime.to',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    if (!response.ok) {
      return c.json({ error: `Upstream error: ${response.status}` }, response.status);
    }
    
    const body = await response.text();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    return c.body(body, 200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

export const GET = handle(app);
export const OPTIONS = handle(app);
