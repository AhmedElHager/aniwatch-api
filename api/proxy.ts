import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api/proxy');

function rewriteM3U8Content(content: string, originalBaseUrl: string, proxyBaseUrl: string): string {
  const lines = content.split('\n');
  const rewrittenLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      rewrittenLines.push(line);
      continue;
    }
    
    let segmentUrl = trimmedLine;
    
    if (!segmentUrl.startsWith('http://') && !segmentUrl.startsWith('https://')) {
      const baseUrl = originalBaseUrl.substring(0, originalBaseUrl.lastIndexOf('/') + 1);
      segmentUrl = baseUrl + segmentUrl;
    }
    
    const encodedSegmentUrl = encodeURIComponent(segmentUrl);
    const proxiedUrl = `${proxyBaseUrl}?url=${encodedSegmentUrl}`;
    rewrittenLines.push(proxiedUrl);
  }
  
  return rewrittenLines.join('\n');
}

// CORS middleware - applies to ALL responses
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Range');
  await next();
});

// Handle OPTIONS preflight
app.options('/', (c) => {
  return c.body(null, 204);
});

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
      return c.json({ error: `Upstream error: ${response.status}` }, 500);
    }
    
    const contentType = response.headers.get('content-type') || '';
    const body = await response.text();
    
    // Check if M3U8 playlist
    if (contentType.includes('mpegurl') || decodedUrl.endsWith('.m3u8') || body.trim().startsWith('#EXTM3U')) {
      const proxyBaseUrl = 'https://aniwatch-api-umber.vercel.app/api/proxy';
      const rewrittenBody = rewriteM3U8Content(body, decodedUrl, proxyBaseUrl);
      
      return c.body(rewrittenBody, 200, {
        'Content-Type': 'application/vnd.apple.mpegurl',
      });
    }
    
    // For TS segments, etc.
    return c.body(body, 200, {
      'Content-Type': contentType || 'application/octet-stream',
    });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
});

export const GET = handle(app);
export const OPTIONS = handle(app);
