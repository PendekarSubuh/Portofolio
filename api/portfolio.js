function parseJson(value, fallback = []) {
  if (Array.isArray(value)) return value;

  if (value == null || value === '') {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

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

function getEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value.replace(/\/$/, '');
}

async function getRows(table, query = 'select=*') {
  const baseUrl = getEnv('SUPABASE_URL');
  const apiKey = process.env.SUPABASE_ANON_KEY;

  const response = await fetch(
    `${baseUrl}/rest/v1/${table}?${query}`,
    {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json'
      }
    }
  );

  if (!response.ok) {
    const detail = await response.text();

    throw new Error(
      `Supabase ${table} ${response.status}: ${detail}`
    );
  }

  return response.json();
}

async function getExperienceRows() {
  try {
    // Tabel yang digunakan oleh database portfolio asli
    return await getRows(
      'experience',
      'select=*&order=id.asc'
    );
  } catch (error) {
    // Fallback kalau ternyata tabel plural digunakan
    return await getRows(
      'experiences',
      'select=*&order=id.asc'
    );
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      message: 'Method not allowed'
    });
  }

  try {
    const [
      profileRows,
      experienceRows,
      projectRows,
      skillRows,
      statsRows
    ] = await Promise.all([
      getRows(
        'profile',
        'select=*&id=eq.1&limit=1'
      ),

      getExperienceRows(),

      getRows(
        'projects',
        'select=*&order=id.asc'
      ),

      getRows(
        'skills',
        'select=*&order=level.desc,id.asc'
      ),

      getRows(
        'stats',
        'select=*&order=id.asc'
      )
    ]);

    const profile = profileRows[0] || {};

    const experiences = experienceRows.map(item => ({
      ...item,

      achievements: parseJson(
        item.achievements,
        []
      ),

      tags: item.tags || ''
    }));

    const projects = projectRows.map(item => ({
      ...item,

      details: parseJson(
        item.details ?? item.highlights,
        []
      ),

      stats: parseJson(
        item.stats,
        []
      ),

      featured: Boolean(item.featured),

      tools:
        item.tools ||
        item.technologies ||
        '',

      slug: item.slug || '',
      category: item.category || '',
      subtitle: item.subtitle || '',

      portfolio_page:
        Number(item.portfolio_page || 0)
    }));

    const skills = skillRows.map(item => ({
      ...item,

      level:
        Number(item.level) || 0,

      group_name:
        item.group_name ||
        item.category ||
        ''
    }));

    return res.status(200).json({
      profile: {
        ...profile,

        resume_path:
          '/assets/CV_Muhamad_Deja_Alwi.pdf',

        portfolio_path:
          '/assets/portfolio.pdf'
      },

      experiences,

      projects,

      skills,

      stats: statsRows,

      generatedAt:
        new Date().toISOString()
    });

  } catch (error) {
    console.error(
      'Portfolio API error:',
      error
    );

    return res.status(500).json({
      ok: false,
      message:
        'Unable to load portfolio data.'
    });
  }
};