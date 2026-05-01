'use client'

import { motion } from 'framer-motion'
import { Mic, FileJson, Search, LayoutGrid, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PipelineStepProps {
  icon: React.ReactNode
  label: string
  sublabel?: string
  isLast?: boolean
  delay: number
}

function PipelineStep({ icon, label, sublabel, isLast, delay }: PipelineStepProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="flex flex-col items-center gap-2"
      >
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
          {icon}
        </div>
        <div className="text-center">
          <p className="text-xs font-medium">{label}</p>
          {sublabel && (
            <p className="text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
      </motion.div>
      
      {!isLast && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: delay + 0.1 }}
          className="flex-1 h-px bg-border max-w-[60px] self-center -mt-6"
        />
      )}
    </>
  )
}

export function ArchitecturePanel() {
  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-6">
      <h3 className="text-sm font-semibold mb-6 text-center">Pipeline Architecture</h3>
      
      <div className="flex items-start justify-center gap-2 overflow-x-auto pb-2">
        <PipelineStep
          icon={<Mic className="h-5 w-5 text-primary" />}
          label="Voice/Text"
          sublabel="User Input"
          delay={0}
        />
        <PipelineStep
          icon={<FileJson className="h-5 w-5 text-primary" />}
          label="Intent JSON"
          sublabel="OpenRouter"
          delay={0.1}
        />
        <PipelineStep
          icon={<Search className="h-5 w-5 text-primary" />}
          label="Search"
          sublabel="Viator API"
          delay={0.2}
        />
        <PipelineStep
          icon={<LayoutGrid className="h-5 w-5 text-primary" />}
          label="Products"
          sublabel="Ranked Results"
          delay={0.3}
        />
        <PipelineStep
          icon={<ExternalLink className="h-5 w-5 text-primary" />}
          label="productUrl"
          sublabel="Direct Link"
          delay={0.4}
          isLast
        />
      </div>

      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Verifiable intent extraction with transparent reasoning and direct booking links
        </p>
      </div>
    </div>
  )
}
