function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value.replace(/\/$/, '');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    if (body.website) {
      return res.status(400).json({ ok: false, message: 'Invalid submission.' });
    }

    const name = String(body.name || '').trim().slice(0, 120);
    const email = String(body.email || '').trim().slice(0, 160);
    const message = String(body.message || '').trim().slice(0, 5000);

    if (message.length < 4) {
      return res.status(400).json({ ok: false, message: 'Please enter a message.' });
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ ok: false, message: 'Please enter a valid email.' });
    }

    const base = env('SUPABASE_URL');
    const key = process.env.SUPABASE_ANON_KEY;

    const response = await fetch(`${base}/rest/v1/contact_messages`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ name, email, message })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase contact_messages ${response.status}: ${detail}`);
    }

    return res.status(200).json({
      ok: true,
      message: 'Thanks — your message has been saved.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: 'Unable to save your message right now.'
    });
  }
};
