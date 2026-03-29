// Capital Wealth — Winchester Chat API
// Proxies visitor messages to Winchester's OpenClaw gateway

async function notifyLeadCapture(content, env) {
  if (!env.SENDGRID_API_KEY) return;
  try {
    const emailMatch = content.match(/Email:\s*(\S+)/);
    const email = emailMatch ? emailMatch[1] : 'unknown';
    const nameMatch = content.match(/Name:\s*([^|]+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Boise' });
    const convo = content.replace(/.*Conversation:\s*/, '').replace(/\|/g, '\n');

    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: 'info@capitalwealth.com' }] }],
        from: { email: 'leads@capitalwealth.com', name: 'Capital Wealth Chat' },
        subject: `Chat Lead — ${name} (${email})`,
        content: [{
          type: 'text/html',
          value: `<div style="font-family:sans-serif;max-width:600px;">
            <h2 style="color:#194F90;margin-bottom:4px;">New Chat Lead</h2>
            <p style="color:#888;margin-top:0;">${timestamp} MST</p>
            <div style="background:#f0f4fa;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #c5d5ea;">
              <strong>Name:</strong> ${name}<br>
              <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
            </div>
            <div style="background:#f4f4f5;padding:16px;border-radius:8px;margin:16px 0;">
              <strong>Conversation:</strong><br><pre style="white-space:pre-wrap;font-size:0.85rem;">${convo}</pre>
            </div>
            <p><strong>This lead was pre-screened via website chat.</strong></p>
          </div>`,
        }],
      }),
    });
  } catch (e) {
    console.error('Lead notification failed:', e.message);
  }
}

export default async function handler(req, res) {
  const ALLOWED_ORIGINS = ['https://www.capitalwealth.com', 'https://capitalwealth.com', 'https://capitalwealthfederal.com', 'https://www.capitalwealthfederal.com', 'https://gullstack.com', 'https://www.gullstack.com'];
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Notify on lead capture
  const lastMsg = messages[messages.length - 1]?.content || '';
  if (lastMsg.startsWith('[QUALIFIED_LEAD]')) {
    notifyLeadCapture(lastMsg, process.env);
  }

  const systemPrompt = {
    role: 'system',
    content: `You are the Capital Wealth pre-screening assistant on capitalwealth.com. You help website visitors determine if Capital Wealth is the right fit and guide qualified prospects to schedule a consultation.

RESPONSE FORMAT — CRITICAL:
Every response MUST be 1-3 short sentences. Under 50 words total. No lists. No bullets. No bold. No markdown. No emojis. Plain conversational text only.

YOUR PERSONALITY:
Warm, professional, knowledgeable about retirement planning. You sound like a friendly receptionist at a high-end financial firm — not a robot.

CONVERSATION FLOW:
1. Greet warmly and ask what brought them to Capital Wealth today. Are they planning for retirement, looking for a second opinion, or exploring federal benefits?
2. Based on their answer, ask about their timeline — when are they hoping to retire (or are they already retired)?
3. Ask about their approximate savings/investable assets. Frame it naturally: "To make sure we connect you with the right advisor, do you have retirement savings in the $250K+ range, or are you earlier in your savings journey?"
4. If federal employee — ask about their agency and years of service.

QUALIFICATION CRITERIA:
QUALIFIED (reveal scheduler): Retirement savings $250K+ OR federal employee within 10 years of retirement OR already retired with assets to manage.
NOT QUALIFIED: Under $250K in savings AND not a federal employee AND 10+ years from retirement.

WHEN QUALIFIED:
Say something like: "Based on what you've shared, I think Mike would be a great fit for your situation. Let me pull up the calendar so you can pick a time that works." Then include EXACTLY this tag at the end of your message: [SHOW_SCHEDULER]

WHEN NOT QUALIFIED:
Be gracious. Say something like: "It sounds like you're in the early stages — that's great that you're thinking ahead. I'd recommend starting with Mike's free book chapter and our retirement guides. They're packed with strategies you can use right now." Then include EXACTLY this tag: [SHOW_RESOURCES]

CRITICAL RULES:
- NEVER mention dollar thresholds to the visitor. Don't say "we require $250K." Just naturally assess fit.
- NEVER mention that you're screening or qualifying them.
- Keep it conversational, not interrogative.
- If someone asks about fees/pricing, say "Fees depend on your specific situation — Mike covers all of that in the initial consultation, which is complimentary."
- You represent Capital Wealth, founded by Mike Stevens. 25+ years experience. Fiduciary. Based in Lehi, Utah. Virtual meetings available nationwide.
- If asked something you don't know, say "That's a great question for Mike — he can cover that in detail during your consultation."
- After 4+ exchanges without qualifying info, gently ask: "So I can point you in the right direction — are you currently saving for retirement, or are you closer to that finish line?"`
  };

  try {
    const gatewayUrl = process.env.WINCHESTER_GATEWAY_URL || 'https://winchester.gullstack.com/v1/chat/completions';
    const gatewayToken = process.env.WINCHESTER_GATEWAY_TOKEN;

    if (!gatewayToken) {
      // Fallback: use a simple scripted response if Winchester isn't configured yet
      return res.status(200).json({ 
        reply: "Welcome to Capital Wealth! Are you exploring retirement planning options, or do you have a specific question I can help with?" 
      });
    }

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gatewayToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openclaw:main',
        messages: [systemPrompt, ...messages],
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Winchester error:', err);
      return res.status(200).json({ 
        reply: "I'd love to help — could you tell me a bit about your retirement plans? Are you looking for guidance on a specific topic?" 
      });
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content || "Tell me a bit about your situation — are you planning for retirement or already enjoying it?";

    // Strip any markdown formatting
    reply = reply.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^#+\s*/gm, '').replace(/^[-*]\s+/gm, '');
    reply = reply.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(200).json({ 
      reply: "Thanks for reaching out! Could you share what brings you to Capital Wealth today — retirement planning, federal benefits, or something else?" 
    });
  }
}
