import * as React from "react"
import { cn } from "../../lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-md border-2 border-border bg-card px-3 py-2 text-sm text-foreground font-mono transition-all resize-vertical",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:bg-background focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.2),0_0_20px_hsl(var(--primary)/0.3)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
