function parseJson(value, fallback = []) {
  if (Array.isArray(value)) return value;

  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'object') {
    return Array.isArray(value) ? value : fallback;
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


/*
  Data fallback.
  Digunakan apabila field tertentu dari Supabase
  kosong / tidak tersedia.
*/
const projectFallbacks = {
  'traffic-sign': {
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

    tools:
      'CVAT · Supervisely · QA · Attribute Labeling',

    featured: true,
    portfolio_page: 2
  },

  'lidar-segmentation': {
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

    tools:
      'LiDAR View · Camera Fusion · QA',

    featured: true,
    portfolio_page: 3
  },

  'lidar-cuboid': {
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

    tools:
      'HoloPoint · LiDAR · Keyframes · Camera Fusion',

    featured: true,
    portfolio_page: 4
  },

  'sentiment-analysis': {
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

    tools:
      'Python · Google Spreadsheet · Looker Studio',

    featured: false,
    portfolio_page: 0
  },

  'coffee-inventory': {
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

    tools:
      'HTML · CSS · JavaScript · PHP · MySQL',

    featured: false,
    portfolio_page: 0
  }
};


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

      getRows(
        'experiences',
        'select=*&order=id.asc'
      ),

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

      achievements:
        parseJson(item.achievements, []),

      tags:
        item.tags || ''
    }));


    const projects = projectRows.map(item => {
      const fallback =
        projectFallbacks[item.slug] || {};

      return {
        ...item,

        slug:
          item.slug ||
          '',

        category:
          item.category ||
          fallback.category ||
          '',

        subtitle:
          item.subtitle ||
          fallback.subtitle ||
          '',

        description:
          item.description ||
          fallback.description ||
          '',

        details:
          parseJson(
            item.details ?? item.highlights,
            fallback.details || []
          ),

        stats:
          parseJson(
            item.stats,
            fallback.stats || []
          ),

        tools:
          item.tools ||
          item.technologies ||
          fallback.tools ||
          '',

        featured:
          typeof item.featured !== 'undefined'
            ? Boolean(item.featured)
            : Boolean(fallback.featured),

        portfolio_page:
          Number(item.portfolio_page) ||
          Number(fallback.portfolio_page) ||
          0
      };
    });


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