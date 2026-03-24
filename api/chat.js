export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic origin check — replace with your actual domain
  const origin = req.headers.origin || '';
  const allowed = ['https://www.joincoc.com', 'https://joincoc.com'];
  if (process.env.NODE_ENV !== 'development' && !allowed.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Key lives ONLY here on Vercel's servers — never sent to the browser
        'Authorization': `Bearer ${process.env.openai_api_key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        messages: messages
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}