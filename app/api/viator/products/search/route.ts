import { NextRequest } from 'next/server'

export const maxDuration = 30

interface ViatorSearchRequest {
  destinationId: string
  searchTerm?: string
  lowestPrice?: number
  highestPrice?: number
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: string
  limit?: number
  currency?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: ViatorSearchRequest = await req.json()

    const apiKey = process.env.VIATOR_API_KEY
    const baseUrl = process.env.VIATOR_API_BASE_URL || 'https://api.sandbox.viator.com/partner'

    if (!apiKey) {
      return Response.json(
        { error: 'VIATOR_API_KEY not configured', code: 'MISSING_API_KEY' },
        { status: 500 }
      )
    }

    // Build filtering object - only include fields that have values
    const filtering: Record<string, unknown> = {
      destination: body.destinationId,
    }

    if (body.searchTerm) {
      filtering.searchTerm = body.searchTerm
    }

    if (body.lowestPrice !== undefined && body.lowestPrice !== null) {
      filtering.lowestPrice = body.lowestPrice
    }

    if (body.highestPrice !== undefined && body.highestPrice !== null) {
      filtering.highestPrice = body.highestPrice
    }

    if (body.startDate) {
      filtering.startDate = body.startDate
    }

    if (body.endDate) {
      filtering.endDate = body.endDate
    }

    const viatorRequest = {
      filtering,
      sorting: {
        sort: body.sortBy || 'REVIEW_AVG_RATING',
        order: body.sortOrder || 'DESCENDING',
      },
      pagination: {
        start: 1,
        count: body.limit || 12,
      },
      currency: body.currency || 'EUR',
    }

    const response = await fetch(`${baseUrl}/products/search`, {
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
          error: 'Viator API error', 
          status: response.status,
          details: errorText,
          requestSent: viatorRequest,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return Response.json({
      products: data.products || [],
      totalCount: data.totalCount || 0,
      requestSent: viatorRequest,
    })
  } catch (error) {
    console.error('Viator products search error:', error)
    return Response.json(
      { error: 'Failed to search Viator products', details: String(error) },
      { status: 500 }
    )
  }
}
