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

    const projectDefaults = {
      1: {
        slug: 'traffic-sign',
        category: 'AI DATA',
        subtitle: '2D Bounding Box Annotation',
        description:
          'Dual-camera annotation workflow for traffic-sign detection with multi-instance tracking and attribute labeling.',
        details: [
          '2D boxes on tele and wide camera feeds simultaneously',
          'Multi-instance tracking across 11 video frames',
          'Sign types: right-of-way, prohibitory, other',
          'Attributes: cover %, blur, electronic, facing',
          'Lane & road-control tagging per instance',
          'QA mode review before batch delivery'
        ],
        stats: [
          { v: '40', l: 'tasks / day' },
          { v: '10', l: 'data / task' },
          { v: '11', l: 'frames / sequence' }
        ],
        tools: 'CVAT · Supervisely · QA · Attribute Labeling',
        featured: true,
        portfolio_page: 2
      },
    
      2: {
        slug: 'lidar-segmentation',
        category: 'AI DATA',
        subtitle: '3D Semantic Segmentation',
        description:
          'Pixel-level semantic segmentation across LiDAR point clouds with camera-reference validation.',
        details: [
          'Multi-instance segmentation per class',
          'Cross-validation with tele camera reference',
          'ALL / PARTIAL scene handling',
          'Review flagging using R1–R4 markers',
          'Valid / Special scene attribute tagging',
          'Up to 774K points per scene'
        ],
        stats: [
          { v: '15', l: 'data / task' },
          { v: '774K', l: 'max pts / scene' },
          { v: '9', l: 'semantic classes' }
        ],
        tools: 'LiDAR View · Camera Fusion · QA',
        featured: true,
        portfolio_page: 3
      },
    
      3: {
        slug: 'lidar-cuboid',
        category: 'AI DATA',
        subtitle: '4D LiDAR Cuboid',
        description:
          '3D cuboid annotation with temporal keyframe tracking and multi-view validation.',
        details: [
          'Draw 3D cuboid around each object in LiDAR view',
          'Validate dimensions in FRONT / TOP / SIDE views',
          'Cross-check against wide-angle camera reference',
          'Set keyframes for temporal object tracking',
          'Handle 24+ instances per scene simultaneously',
          'Live W × H × L dimension display in meters'
        ],
        stats: [
          { v: '300', l: 'boxes / task' },
          { v: '24+', l: 'objects / scene' },
          { v: '3', l: 'orthographic views' }
        ],
        tools: 'HoloPoint · LiDAR · Keyframes · Camera Fusion',
        featured: true,
        portfolio_page: 4
      },
    
      4: {
        slug: 'sentiment-analysis',
        category: 'DATA ANALYSIS',
        subtitle: 'CRISP-DM · X / Twitter',
        description:
          'Compared Random Forest, Naïve Bayes, and Support Vector Machine approaches for sentiment analysis of the 2024 presidential and vice-presidential debate on X/Twitter.',
        details: [
          'Applied the CRISP-DM approach',
          'Compared three classification algorithms',
          'Built an end-to-end analysis workflow for labeled text data'
        ],
        stats: [
          { v: '3', l: 'models compared' },
          { v: 'CRISP-DM', l: 'methodology' },
          { v: '2024', l: 'debate dataset' }
        ],
        tools: 'Python · Google Spreadsheet · Looker Studio',
        featured: false,
        portfolio_page: 0
      },
    
      5: {
        slug: 'coffee-inventory',
        category: 'WEB DEVELOPMENT',
        subtitle: 'Coffee Break',
        description:
          'Inventory management system developed as a scientific project, focused on stock tracking and reporting.',
        details: [
          'Designed and developed an inventory management system',
          'Implemented stock tracking',
          'Implemented reporting features'
        ],
        stats: [
          { v: 'PHP', l: 'backend' },
          { v: 'MySQL', l: 'database' },
          { v: 'JS', l: 'interactive UI' }
        ],
        tools: 'HTML · CSS · JavaScript · PHP · MySQL',
        featured: false,
        portfolio_page: 0
      }
    };
    
    const projects = projectRows.map(item => {
      const fallback = projectDefaults[item.id] || {};
    
      return {
        id: item.id,
    
        slug: fallback.slug,
    
        title: item.title || '',
    
        category: fallback.category,
    
        subtitle: fallback.subtitle,
    
        description:
          item.description ||
          fallback.description ||
          '',
    
        details: fallback.details,
    
        stats: fallback.stats,
    
        tools: fallback.tools,
    
        featured: fallback.featured,
    
        portfolio_page: fallback.portfolio_page
      };
    });
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