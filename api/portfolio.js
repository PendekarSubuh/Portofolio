function parseJson(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value.replace(/\/$/, '');
}

async function getRows(table, query = 'select=*') {
  const base = env('SUPABASE_URL');
  const key = process.env.SUPABASE_ANON_KEY;
  const response = await fetch(`${base}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${table} ${response.status}: ${detail}`);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    const [profileRows, experiences, projects, skills, stats] = await Promise.all([
      getRows('profile', 'select=*&id=eq.1&limit=1'),
      getRows('experiences', 'select=*&order=id.asc'),
      getRows('projects', 'select=*&order=featured.desc,id.asc'),
      getRows('skills', 'select=*&order=level.desc,id.asc'),
      getRows('stats', 'select=*&order=id.asc')
    ]);

    const profile = profileRows[0] || {};

    return res.status(200).json({
      profile: {
        ...profile,
        resume_path: '/assets/CV_Muhamad_Deja_Alwi.pdf',
        portfolio_path: '/assets/portfolio.pdf'
      },
      experiences: experiences.map(item => ({
        ...item,
        achievements: parseJson(item.achievements, []),
        tags: item.tags || ''
      })),
      projects: projects.map(item => ({
        ...item,
        details: parseJson(item.details ?? item.highlights, []),
        stats: parseJson(item.stats, []),
        featured: Boolean(item.featured),
        tools: item.tools || item.technologies || '',
        slug: item.slug || '',
        category: item.category || '',
        subtitle: item.subtitle || '',
        portfolio_page: Number(item.portfolio_page || 0)
      })),
      skills: skills.map(item => ({
        ...item,
        level: Number(item.level) || 0,
        group_name: item.group_name || item.category || ''
      })),
      stats,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: 'Unable to load portfolio data.'
    });
  }
};
