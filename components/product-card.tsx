'use client'

import { motion } from 'framer-motion'
import { Star, Clock, ExternalLink, CheckCircle, Sparkles, TrendingUp, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ViatorProduct, TravelIntent } from '@/lib/types'

interface ProductCardProps {
  product: ViatorProduct
  intent?: TravelIntent
  index: number
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function generateWhyItMatches(product: ViatorProduct, intent?: TravelIntent): string {
  const reasons: string[] = []
  
  if (intent) {
    // Check category match
    const title = product.title.toLowerCase()
    const categories = intent.experiencePreferences.categories.map(c => c.toLowerCase())
    const matchedCategory = categories.find(cat => title.includes(cat))
    if (matchedCategory) {
      reasons.push(`Matches "${matchedCategory}" category`)
    }

    // Check occasion
    if (intent.travelerContext.occasion) {
      const occasion = intent.travelerContext.occasion.toLowerCase()
      if (title.includes(occasion) || title.includes("mother")) {
        reasons.push(`Perfect for ${intent.travelerContext.occasion}`)
      }
    }

    // Check budget
    const price = product.pricing?.summary?.fromPrice
    if (price && intent.budget.max && price <= intent.budget.max) {
      reasons.push(`Within budget`)
    }
  }

  // Check rating
  const rating = product.reviews?.combinedAverageRating
  if (rating && rating >= 4.5) {
    reasons.push(`Highly rated (${rating.toFixed(1)})`)
  }

  // Check flags
  if (product.flags?.includes('BEST_SELLER')) {
    reasons.push('Best seller')
  }
  if (product.flags?.includes('FREE_CANCELLATION')) {
    reasons.push('Free cancellation available')
  }
  if (product.bookingInfo?.instantConfirmation) {
    reasons.push('Instant confirmation')
  }

  return reasons.length > 0 ? reasons.slice(0, 3).join(' • ') : 'Matches your search criteria'
}

function getFlagIcon(flag: string) {
  switch (flag) {
    case 'BEST_SELLER':
      return <TrendingUp className="h-3 w-3" />
    case 'LIKELY_TO_SELL_OUT':
      return <Sparkles className="h-3 w-3" />
    case 'SPECIAL_OFFER':
      return <Tag className="h-3 w-3" />
    case 'TOP_RATED':
      return <Star className="h-3 w-3" />
    default:
      return <CheckCircle className="h-3 w-3" />
  }
}

function formatFlag(flag: string): string {
  return flag.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
}

export function ProductCard({ product, intent, index }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.imageSource || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop'
  const rating = product.reviews?.combinedAverageRating
  const reviewCount = product.reviews?.totalReviews
  const price = product.pricing?.summary?.fromPrice
  const currency = product.pricing?.currency || 'EUR'
  const duration = product.duration?.fixedDurationInMinutes || 
                   product.duration?.variableDurationFromMinutes
  const whyItMatches = generateWhyItMatches(product, intent)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group overflow-hidden rounded-xl bg-card border hover:border-primary/50 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Flags overlay */}
        {product.flags && product.flags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            {product.flags.slice(0, 2).map((flag) => (
              <span
                key={flag}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
                  flag === 'BEST_SELLER' && "bg-primary/90 text-primary-foreground",
                  flag === 'LIKELY_TO_SELL_OUT' && "bg-warning/90 text-warning-foreground",
                  flag === 'SPECIAL_OFFER' && "bg-success/90 text-success-foreground",
                  flag === 'TOP_RATED' && "bg-secondary/90 text-secondary-foreground",
                  flag === 'FREE_CANCELLATION' && "bg-success/90 text-success-foreground"
                )}
              >
                {getFlagIcon(flag)}
                {formatFlag(flag)}
              </span>
            ))}
          </div>
        )}

        {/* Price badge */}
        {price && (
          <div className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm">
            <span className="text-xs text-muted-foreground">From </span>
            <span className="font-semibold">
              {currency === 'EUR' ? '€' : '$'}{price}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        {/* Rating & Duration */}
        <div className="flex items-center gap-3 text-sm">
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              {reviewCount && (
                <span className="text-muted-foreground">({reviewCount.toLocaleString()})</span>
              )}
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(duration)}</span>
            </div>
          )}
        </div>

        {/* Why it matches */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {whyItMatches}
          </p>
        </div>

        {/* Cancellation policy */}
        {product.bookingInfo?.cancellationPolicy && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-success" />
            {product.bookingInfo.cancellationPolicy}
          </p>
        )}

        {/* CTA */}
        {product.productUrl && (
          <Button
            asChild
            className="w-full gap-2"
            size="sm"
          >
            <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
              View Experience
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  )
}
