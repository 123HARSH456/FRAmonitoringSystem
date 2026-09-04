import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function geminiApiPlugin(env) {
  const handler = async (req, res, next) => {
    if (req.url === '/api/gemini/explain' && req.method === 'POST') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', async () => {
        try {
          const evidence = JSON.parse(body || '{}')
          const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
          const model = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash'

          if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
            res.statusCode = 503
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error:
                  'GEMINI_API_KEY is not configured in .env or environment variables. Please add your key to enable live Gemini AI explanations.',
                code: 'NO_API_KEY',
              })
            )
            return
          }

          const systemInstruction = `You are a Forest Rights Act (FRA) spatial and cadastral decision-support assistant.
Your task is to provide a concise, objective, factual explanation of why a given FRA claim was flagged by the unsupervised anomaly detection model.

CRITICAL RULES:
1. You must NOT calculate, adjust, or change the ML risk score or risk level.
2. You must NOT decide whether a claim is fraudulent or accusatory.
3. Ground your explanation purely on the provided structured evidence metrics (such as the discrepancy between claimed and recorded area, abnormal processing duration, or negative vegetative canopy change).
4. Explain clearly why human ground verification, field boundary inspection, or Gram Sabha review may be useful for the flagged factors.
5. Keep your response concise (2-3 sentences max), professional, neutral, and factual. Do not use markdown headings, bullet points, or asterisks.`

          const userPrompt = `Explain why this FRA claim was flagged based on the following structured evidence:
- Claim ID: ${evidence.claimId}
- Claimed Area: ${evidence.claimedArea} ha
- Recorded Area: ${evidence.recordedArea} ha
- Area Mismatch: ${evidence.areaMismatch}%
- Processing Duration: ${evidence.processingDays} days
- Land-Cover Change: ${evidence.landCoverChange}%
- ML Anomaly Score: ${evidence.mlScore} / 100
- Model Risk Level: ${evidence.riskLevel}`

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
                  },
                ],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 250,
                },
              }),
            }
          )

          if (!geminiRes.ok) {
            const errData = await geminiRes.json().catch(() => ({}))
            res.statusCode = geminiRes.status
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: errData.error?.message || `Gemini API returned HTTP ${geminiRes.status}`,
                code: 'API_ERROR',
              })
            )
            return
          }

          const data = await geminiRes.json()
          const explanation =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No explanation generated.'

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ explanation, claimId: evidence.claimId }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: err.message || 'Server error processing Gemini explanation',
              code: 'SERVER_ERROR',
            })
          )
        }
      })
      return
    }
    next()
  }

  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      geminiApiPlugin(env),
    ],
    assetsInclude: ['**/*.geojson'],
  }
})

