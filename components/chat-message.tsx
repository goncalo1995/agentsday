'use client'

import { motion } from 'framer-motion'
import { User, Bot, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/lib/types'
import { ProductCard } from './product-card'
import { ExecutionLog } from './execution-log'
import { ExpandableSection } from './expandable-section'

interface ChatMessageProps {
  message: ChatMessageType
  onUseDemoFallback?: () => void
}

export function ChatMessage({ message, onUseDemoFallback }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
        isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 space-y-4",
        isUser && "flex flex-col items-end"
      )}>
        {/* Text bubble */}
        <div className={cn(
          "inline-block px-4 py-3 rounded-2xl max-w-[85%]",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-card border rounded-tl-sm"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Error state */}
        {message.error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 max-w-[85%]">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-destructive">{message.error}</p>
              {onUseDemoFallback && (
                <button
                  onClick={onUseDemoFallback}
                  className="text-sm text-primary hover:underline"
                >
                  Use demo fallback results
                </button>
              )}
            </div>
          </div>
        )}

        {/* Execution log */}
        {message.executionLog && message.executionLog.length > 0 && (
          <ExpandableSection 
            title="Execution Log" 
            subtitle="Search and ranking steps"
            defaultOpen={true}
          >
            <ExecutionLog steps={message.executionLog} />
          </ExpandableSection>
        )}

        {/* Extracted intent */}
        {message.intent && (
          <ExpandableSection 
            title="Extracted Verifiable Intent" 
            subtitle="Structured intent from voice or chat"
          >
            <pre className="text-xs font-mono bg-background/50 p-3 rounded-lg overflow-x-auto text-muted-foreground">
              {JSON.stringify(message.intent, null, 2)}
            </pre>
          </ExpandableSection>
        )}

        {/* Viator request */}
        {message.viatorRequest && (
          <ExpandableSection 
            title="Viator Search Request" 
            subtitle="Exact JSON sent to /products/search"
          >
            <pre className="text-xs font-mono bg-background/50 p-3 rounded-lg overflow-x-auto text-muted-foreground">
              {JSON.stringify(message.viatorRequest, null, 2)}
            </pre>
          </ExpandableSection>
        )}

        {/* Attractions */}
        {message.attractions && message.attractions.length > 0 && (
          <ExpandableSection 
            title="Destination Context" 
            subtitle={`${message.attractions.length} attractions found`}
          >
            <div className="flex flex-wrap gap-2">
              {message.attractions.map((attr) => (
                <div 
                  key={attr.seoId}
                  className="px-3 py-1.5 rounded-lg bg-background/50 text-sm"
                >
                  <span className="font-medium">{attr.name}</span>
                  {attr.productCount && (
                    <span className="text-muted-foreground ml-1">
                      ({attr.productCount} experiences)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Products */}
        {message.products && message.products.length > 0 && (
          <div className="w-full space-y-3">
            <p className="text-sm text-muted-foreground">
              Found {message.products.length} matching experience{message.products.length !== 1 ? 's' : ''}:
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {message.products.map((product, index) => (
                <ProductCard 
                  key={product.productCode} 
                  product={product}
                  intent={message.intent}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty results */}
        {message.products && message.products.length === 0 && !message.error && (
          <div className="p-4 rounded-lg bg-card border text-center max-w-md">
            <p className="text-sm text-muted-foreground mb-2">
              No matching experiences found for your search.
            </p>
            {onUseDemoFallback && (
              <button
                onClick={onUseDemoFallback}
                className="text-sm text-primary hover:underline"
              >
                Use demo fallback results
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
