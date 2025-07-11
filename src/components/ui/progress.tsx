"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value?: number;
  indicatorColor?: string;
  backgroundColor?: string;
}

function Progress({
  className,
  value,
  indicatorColor,
  backgroundColor,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        !backgroundColor && "bg-primary/20",
        className
      )}
      style={backgroundColor ? { backgroundColor } : undefined}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all",
          !indicatorColor && "bg-primary"
        )}
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          ...(indicatorColor && { backgroundColor: indicatorColor })
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }