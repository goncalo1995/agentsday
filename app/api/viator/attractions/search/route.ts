import { NextRequest } from 'next/server'

export const maxDuration = 30

interface AttractionsSearchRequest {
  destinationId: number
}

export async function POST(req: NextRequest) {
  try {
    const body: AttractionsSearchRequest = await req.json()

    const apiKey = process.env.VIATOR_API_KEY
    const baseUrl = process.env.VIATOR_API_BASE_URL || 'https://api.sandbox.viator.com/partner'

    if (!apiKey) {
      return Response.json(
        { error: 'VIATOR_API_KEY not configured', code: 'MISSING_API_KEY' },
        { status: 500 }
      )
    }

    const viatorRequest = {
      destinationId: body.destinationId,
    }

    const response = await fetch(`${baseUrl}/attractions/search`, {
      method: 'POST',
      headers: {
        'exp-api-key': apiKey,
        'Accept': 'application/json;version=2.0',
        'Content-Type': 'application/json;version=2.0',
        'Accept-Language': 'en-US',
      },
      body: JSON.stringify(viatorRequest),
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      if (response.status === 401 || response.status === 403) {
        return Response.json(
          { error: 'Invalid or expired VIATOR_API_KEY', code: 'AUTH_ERROR' },
          { status: 401 }
        )
      }

      return Response.json(
        { 
          error: 'Viator attractions API error', 
          status: response.status,
          details: errorText,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return Response.json({
      attractions: data.attractions || [],
      totalCount: data.totalCount || 0,
    })
  } catch (error) {
    console.error('Viator attractions search error:', error)
    return Response.json(
      { error: 'Failed to search Viator attractions', details: String(error) },
      { status: 500 }
    )
  }
}
