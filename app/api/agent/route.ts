import { generateText, Output } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { z } from 'zod'

export const maxDuration = 30

// Intent schema for structured extraction
const intentSchema = z.object({
  intentType: z.literal('travel_experience_search'),
  rawUserRequest: z.string(),
  travelerContext: z.object({
    forSelf: z.boolean(),
    recipientRelationship: z.string().nullable(),
    occasion: z.string().nullable(),
  }),
  destination: z.object({
    city: z.string(),
    country: z.string(),
    destinationId: z.number().nullable(),
  }),
  dateConstraints: z.object({
    relativeDeadline: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    urgency: z.enum(['flexible', 'soon', 'last_minute']),
  }),
  experiencePreferences: z.object({
    categories: z.array(z.string()),
    keywords: z.array(z.string()),
    avoid: z.array(z.string()),
  }),
  budget: z.object({
    currency: z.enum(['EUR', 'USD']),
    min: z.number().nullable(),
    max: z.number().nullable(),
  }),
  searchConstraints: z.object({
    requiresInstantConfirmation: z.boolean(),
    requiresProductUrl: z.boolean(),
    limit: z.number(),
  }),
})

export type TravelIntent = z.infer<typeof intentSchema>

// Known Viator destination IDs
const KNOWN_DESTINATIONS: Record<string, number> = {
  'lisbon': 538,
  'porto': 539,
  'barcelona': 562,
  'madrid': 561,
  'paris': 479,
  'london': 737,
  'rome': 511,
  'florence': 525,
  'amsterdam': 525,
  'berlin': 488,
  'new york': 687,
  'los angeles': 645,
  'san francisco': 651,
  'tokyo': 334,
  'sydney': 357,
}

function getDestinationId(city: string): number | null {
  const normalizedCity = city.toLowerCase().trim()
  return KNOWN_DESTINATIONS[normalizedCity] ?? null
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Missing or invalid message' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'OPENROUTER_API_KEY not configured', code: 'MISSING_API_KEY' },
        { status: 500 }
      )
    }

    const openrouter = createOpenRouter({ apiKey })

    // Calculate date context
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const { output } = await generateText({
      model: openrouter('anthropic/claude-sonnet-4'),
      output: Output.object({
        schema: intentSchema,
      }),
      messages: [
        {
          role: 'system',
          content: `You are a travel experience intent extraction assistant. Extract structured travel intent from user requests.

Today's date is ${todayStr}.

Guidelines:
- For relative dates like "two days from now", calculate the actual date from today (${todayStr})
- For "Mother's Day", use the second Sunday of May for the current or next year
- If the user mentions a gift or doing something for someone else, set forSelf to false
- Map common categories: "spa" → ["spa", "wellness"], "food" → ["food", "culinary"], "tour" → ["tours", "sightseeing"]
- Default urgency: "flexible" unless they mention "soon", "urgent", "last minute", etc.
- Default budget currency to EUR for European destinations, USD for American destinations
- Set reasonable budget defaults if not specified (null for both min and max)
- Default limit to 5 unless specified
- Set requiresInstantConfirmation to true for last_minute urgency
- Always set requiresProductUrl to true

Known destination IDs (use these exact values):
- Lisbon, Portugal: 538
- Porto, Portugal: 539
- Barcelona, Spain: 562
- Madrid, Spain: 561
- Paris, France: 479
- London, UK: 737
- Rome, Italy: 511
- Florence, Italy: 525
- Amsterdam, Netherlands: 525
- Berlin, Germany: 488
- New York, USA: 687
- Los Angeles, USA: 645
- San Francisco, USA: 651
- Tokyo, Japan: 334
- Sydney, Australia: 357

If the destination is not in the list, set destinationId to null.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    })

    if (!output) {
      return Response.json(
        { error: 'Failed to extract intent from message' },
        { status: 500 }
      )
    }

    // Enrich with known destination ID if not set
    const enrichedOutput = {
      ...output,
      destination: {
        ...output.destination,
        destinationId: output.destination.destinationId ?? getDestinationId(output.destination.city),
      },
    }

    return Response.json({ intent: enrichedOutput })
  } catch (error) {
    console.error('Agent API error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        return Response.json(
          { error: 'Invalid or expired OPENROUTER_API_KEY', code: 'AUTH_ERROR' },
          { status: 401 }
        )
      }
    }

    return Response.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    )
  }
}
