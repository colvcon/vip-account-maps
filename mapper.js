// Calls Claude API with MCP servers to run the full account mapping workflow
// Returns structured JSON matching the account map schema

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You are an enterprise sales intelligence assistant for WordPress VIP.
Given a company domain, run the full account mapping workflow and return ONLY a valid JSON object — no prose, no markdown, no backticks.

The JSON must match this exact schema:
{
  "company": "Baker Roofing Company",
  "domain": "bakerroofing.com",
  "generatedAt": "2026-04-30T12:00:00Z",
  "intentScore": 97,
  "intentTier": "HOT",
  "intentTopics": ["Content Management System"],
  "sfStage": "Prospect",
  "sfLastActivity": "2025-10-14",
  "priorOpp": "Closed Lost 2022 (price)",
  "revenue": "$500M–$1B",
  "employees": "501–1,000",
  "industry": "Commercial & Residential Construction",
  "hq": "Raleigh, NC",
  "snapshot": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "signals": ["signal 1", "signal 2", "signal 3"],
  "scoops": [],
  "compoundAlert": "Description of compound signal if present, or null",
  "contacts": [
    {
      "name": "Todd Kavanaugh",
      "title": "VP, Marketing",
      "tier": "1",
      "score": 80,
      "signal": "Known (SF, added Apr 2026) + Hot CMS intent",
      "angle": "First-touch angle for Tier 1 only — 1-2 sentences, punchy, no em dashes",
      "status": "Known"
    }
  ]
}

Scoring rules:
- Direct CMS/platform owner: 30pts
- Tech decision-maker (CTO/CIO): 25pts
- Marketing exec with digital ownership: 20pts
- Economic buyer (CEO/CFO): 15pts
- Adjacent (product/analytics): 10pts
- Manager in relevant dept: 5pts
- Tenure <6mo: +20, 6-18mo: +10, 18-36mo: +5
- Named in Tier 1 scoop: +20, Tier 2 scoop: +10, dept in scoop: +5
- In SF as active contact: +15, named in Gong: +15, SF gone cold: +5
- Hot intent + in researching dept: +10, Warm intent: +5

Tier 1 = score 50+, Tier 2 = 25-49, Tier 3 = <25.
Write angles in punchy direct prose. No em dashes. No corporate filler.`

export async function generateAccountMap(domain, anthropicKey) {
  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'mcp-client-2025-04-04'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Run a full account map for domain: ${domain}

Use the available MCP tools to:
1. Search Salesforce (app: salescloud) for any existing account history, contacts, and opportunities
2. Call ZoomInfo enrich_intent with companyId or website to get intent signals for CMS topics
3. Call ZoomInfo enrich_scoops for recent business events (last 90 days)
4. Call ZoomInfo search_contacts for C-level, VP, Director, Manager contacts across Marketing and IT functions
5. Synthesize all data into the JSON schema

Return ONLY the JSON. No markdown, no explanation.`
        }
      ],
      mcp_servers: [
        {
          type: 'url',
          url: 'https://mcp.zoominfo.com/mcp',
          name: 'zoominfo'
        },
        {
          type: 'url',
          url: 'https://mcp.glean.com/mcp',
          name: 'glean'
        }
      ]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Claude API error')
  }

  const data = await response.json()

  // Extract text from response — may be in multiple content blocks
  const textBlocks = data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  // Strip any accidental markdown fences
  const clean = textBlocks.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    throw new Error('Failed to parse account map JSON from Claude response')
  }
}
