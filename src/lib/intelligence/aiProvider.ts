// src/lib/intelligence/aiProvider.ts

export async function generateClinicalNote(timeline_context: any): Promise<string> {
  const systemPrompt = `You are a cosmetic chemist and clinical skincare advisor for Toneek, a clinical skincare platform for melanin-rich skin (FST IV-VI). Your role is to draft concise, warm, clinically accurate notes to send to customers about their skin progress. 

Rules:
- Write in first person as the Toneek clinical team
- Address the customer by first name only
- Be specific about their formula code and actual scores
- Do not make promises you cannot keep
- If there is a concern report, address it directly and reassuringly
- Keep the note under 150 words
- Do not use marketing language
- Be honest if improvement is slow
- End with a specific next action or expectation`;

  const userPrompt = `Draft a clinical note for this customer based on their journey data:

${JSON.stringify(timeline_context, null, 2)}

The note should acknowledge their current status, address any concerns they have raised, and give them a specific expectation for what comes next. Plain language, clinically accurate.`;

  // Rotation / Fallback Logic based on available environment variables
  // This allows Toneek to switch AI providers simply by changing the keys in .env
  
  if (process.env.GEMINI_API_KEY) {
    console.log('[AI Provider] Using Google Gemini API');
    return await generateWithGemini(systemPrompt, userPrompt);
  } else if (process.env.ANTHROPIC_API_KEY) {
    console.log('[AI Provider] Using Anthropic Claude API');
    return await generateWithClaude(systemPrompt, userPrompt);
  } else if (process.env.OPENAI_API_KEY) {
    console.log('[AI Provider] Using OpenAI API');
    return await generateWithOpenAI(systemPrompt, userPrompt);
  } else {
    console.warn('[AI Provider] No API keys configured');
    return 'Unable to generate draft. No AI API keys configured (checked Gemini, Anthropic, OpenAI). Please configure one or write manually.';
  }
}

async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  // Using Gemini REST API to avoid heavy dependencies
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
      })
    });

    if (!response.ok) {
      console.error('Gemini API Error:', await response.text());
      return 'Error generating draft with Gemini.';
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Unable to generate draft with Gemini.';
  } catch (error) {
    console.error('Gemini Fetch Error:', error);
    return 'Connection error to Gemini API.';
  }
}

async function generateWithClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620', // Standardized to 3.5 Sonnet
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API Error:', await response.text());
      return 'Error generating draft with Claude.';
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? 'Unable to generate draft with Claude.';
  } catch (error) {
    console.error('Claude Fetch Error:', error);
    return 'Connection error to Claude API.';
  }
}

async function generateWithOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API Error:', await response.text());
      return 'Error generating draft with OpenAI.';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'Unable to generate draft with OpenAI.';
  } catch (error) {
    console.error('OpenAI Fetch Error:', error);
    return 'Connection error to OpenAI API.';
  }
}
