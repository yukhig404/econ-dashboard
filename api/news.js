// Vercel serverless function — fetches RSS server-side to avoid CORS
function parseRSS(xml, source, sourceColor) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null && items.length < 10) {
    const s = m[1];
    const get = t => {
      const r = s.match(new RegExp('<' + t + '[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</' + t + '>'));
      return r ? r[1].trim() : '';
    };
    const linkMatch = s.match(/<link>\s*(https?[^<\s]+)\s*<\/link>|<link[^>]+href="([^"]+)"/i);
    const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : get('link');
    const title = get('title').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
    if (!title) continue;
    const pubDate = get('pubDate') || get('dc:date') || get('published') || '';
    const rawDesc = get('description') || get('summary') || '';
    const desc = rawDesc.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim().slice(0,120);
    items.push({ title, link, pubDate, desc, source, sourceColor });
  }
  return items;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const sources = [
    {
      label: 'NHK経済',
      color: '#0070C0',
      url: 'https://www3.nhk.or.jp/rss/news/cat5.xml',
    },
    {
      label: '東洋経済',
      color: '#E60012',
      url: 'https://toyokeizai.net/list/feed/rss',
    },
    {
      label: 'ダイヤモンド',
      color: '#0099CC',
      url: 'https://diamond.jp/list/feed/rss/dol',
    },
    {
      label: 'Yahoo!経済',
      color: '#FF0033',
      url: 'https://news.yahoo.co.jp/rss/topics/business.xml',
    },
    {
      label: 'ITmedia',
      color: '#00AADD',
      url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',
    },
    {
      label: 'EE Times',
      color: '#00AADD',
      url: 'https://rss.itmedia.co.jp/rss/2.0/eetimes.xml',
    },
    {
      label: 'AI+',
      color: '#00AADD',
      url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml',
    },
  ];

  try {
    const results = await Promise.allSettled(
      sources.map(async ({ label, color, url }) => {
        const r = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EconDashboard/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
          signal: AbortSignal.timeout(9000),
        });
        if (!r.ok) throw new Error(`${label}: HTTP ${r.status}`);
        const xml = await r.text();
        return parseRSS(xml, label, color);
      })
    );

    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => r.reason?.message || 'unknown error');

    const items = results
      .flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .filter(i => i.title)
      .sort((a, b) => {
        const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return db - da;
      });

    res.json({ items, errors: errors.length ? errors : undefined });
  } catch (e) {
    res.status(500).json({ items: [], error: e.message });
  }
}
