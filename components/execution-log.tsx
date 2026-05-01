'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExecutionStep } from '@/lib/types'

interface ExecutionLogProps {
  steps: ExecutionStep[]
}

export function ExecutionLog({ steps }: ExecutionLogProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "flex items-start gap-3 p-2 rounded-lg transition-colors",
            step.status === 'in-progress' && "bg-primary/5",
            step.status === 'error' && "bg-destructive/5"
          )}
        >
          {/* Status icon */}
          <div className="shrink-0 mt-0.5">
            {step.status === 'complete' && (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
            {step.status === 'in-progress' && (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            )}
            {step.status === 'pending' && (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            {step.status === 'error' && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                {String(step.step).padStart(2, '0')}
              </span>
              <p className={cn(
                "text-sm",
                step.status === 'complete' && "text-foreground",
                step.status === 'in-progress' && "text-primary font-medium",
                step.status === 'pending' && "text-muted-foreground",
                step.status === 'error' && "text-destructive"
              )}>
                {step.message}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
