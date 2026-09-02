module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      message: 'Method not allowed'
    });
  }

  const baseUrl = process.env.SUPABASE_URL;
  const apiKey = process.env.SUPABASE_ANON_KEY;

  if (!baseUrl || !apiKey) {
    return res.status(500).json({
      ok: false,
      message: 'Supabase environment variables are missing.'
    });
  }

  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json'
  };

  const parseJsonOr = (value, fallback) => {
    if (Array.isArray(value)) return value;

    if (value && typeof value === 'object') {
      return value;
    }

    if (typeof value !== 'string') {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  async function getTable(table, query = '?select=*') {
    const response = await fetch(
      `${baseUrl}/rest/v1/${table}${query}`,
      { headers }
    );

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`${table}: ${text}`);
    }

    return text ? JSON.parse(text) : [];
  }

  try {
    const [
      profileRows,
      statsRows,
      experienceRows,
      projectRows,
      skillRows
    ] = await Promise.all([
      getTable(
        'profile',
        '?select=*&limit=1'
      ),

      getTable(
        'stats',
        '?select=*&order=sort_order.asc'
      ),

      getTable(
        'experience',
        '?select=*&order=sort_order.asc'
      ),

      getTable(
        'projects',
        '?select=*&order=sort_order.asc'
      ),

      getTable(
        'skills',
        '?select=*&order=sort_order.asc'
      )
    ]);

    const profile = profileRows[0] || {};

    const experiences = experienceRows.map(item => ({
      id: item.id,
      company: item.company,
      role: item.role,

      period:
        item.period ||
        `${item.start_date || ''}${
          item.end_date
            ? ` – ${item.end_date}`
            : ''
        }`,

      description:
        item.description || '',

      achievements:
        parseJsonOr(
          item.achievements,
          typeof item.achievements === 'string'
            ? item.achievements
                .split('\n')
                .filter(Boolean)
            : []
        ),

      tags:
        item.tags || ''
    }));

    const projects = projectRows.map(item => ({
      id: item.id,

      slug:
        item.slug || '',

      title:
        item.title || '',

      category:
        item.category || '',

      subtitle:
        item.subtitle || '',

      description:
        item.description || '',

      details:
        parseJsonOr(
          item.details ?? item.highlights,
          typeof (item.details ?? item.highlights) === 'string'
            ? String(item.details ?? item.highlights)
                .split('·')
                .map(value => value.trim())
                .filter(Boolean)
            : []
        ),

      stats:
        parseJsonOr(
          item.stats,
          []
        ),

      tools:
        item.tools ||
        item.technologies ||
        '',

      featured:
        Boolean(item.featured),

      portfolio_page:
        Number(item.portfolio_page) || 0
    }));

    const skills = skillRows.map(item => ({
      id: item.id,

      name:
        item.name || '',

      level:
        Number(item.level) || 0,

      group_name:
        item.category ||
        item.group_name ||
        ''
    }));

    return res.status(200).json({
      profile: {
        id: profile.id,

        name:
          profile.full_name ||
          profile.name ||
          'Muhamad Deja Alwi Dzulhian',

        short_name:
          profile.short_name ||
          'DEJA ALWI',

        headline:
          profile.title ||
          profile.headline ||
          'Data Annotator · AI Training Data Specialist',

        location:
          profile.location ||
          'Jakarta, Indonesia',

        email:
          profile.email ||
          'dezadzulhian@gmail.com',

        phone:
          profile.phone ||
          '+62 813-8505-9171',

        bio:
          profile.bio || '',

        availability:
          profile.availability ||
          'Available for opportunities · Willing to relocate',

        resume_path:
          profile.cv_url ||
          profile.resume_path ||
          '/assets/CV_Muhamad_Deja_Alwi.pdf',

        portfolio_path:
          profile.portfolio_url ||
          profile.portfolio_path ||
          '/assets/portfolio.pdf'
      },

      stats: statsRows.map(item => ({
        id: item.id,
        label: item.label,
        value: item.value,
        caption:
          item.description ||
          item.caption ||
          ''
      })),

      experiences,
      projects,
      skills,

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