import * as React from "react"
import { cn } from "../../lib/utils"

const TabsContext = React.createContext({
  value: "",
  onValueChange: () => {},
})

function nextTabIndex(key, index, count) {
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  const direction = key === "ArrowRight" ? 1 : -1;
  return (index + direction + count) % count;
}

const Tabs = React.forwardRef(({ className, value, onValueChange, ...props }, ref) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div ref={ref} className={cn("w-full", className)} {...props} />
  </TabsContext.Provider>
))
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    onKeyDown={(event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]:not(:disabled)')];
      if (!tabs.length) return;
      event.preventDefault();
      const index = tabs.indexOf(document.activeElement);
      const next = nextTabIndex(event.key, index, tabs.length);
      tabs[next].focus();
    }}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, value: triggerValue, ...props }, ref) => {
  const { value, onValueChange } = React.useContext(TabsContext)
  const isActive = value === triggerValue
  
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isActive}
      id={`task-${triggerValue}`}
      aria-controls={`panel-${triggerValue}`}
      onClick={() => onValueChange(triggerValue)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, value: contentValue, ...props }, ref) => {
  const { value } = React.useContext(TabsContext)
  
  if (value !== contentValue) {
    return null
  }
  
  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`panel-${contentValue}`}
      aria-labelledby={`task-${contentValue}`}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
