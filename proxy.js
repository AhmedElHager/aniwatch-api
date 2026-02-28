export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });
  
  try {
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://hianime.to/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      }
    });
    
    const body = await response.text();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/vnd.apple.mpegurl');
    res.status(200).send(body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
