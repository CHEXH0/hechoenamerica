import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center group",
      className
    )}
    {...props}
  >
    {/* Glow effect behind track */}
    <div className="absolute inset-0 h-3 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 via-red-500 to-orange-500 blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
    
    {/* Main track with gradient */}
    <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-black/40 backdrop-blur-sm border border-white/10 shadow-inner">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-purple-500 via-pink-500 via-red-500 to-orange-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]" />
    </SliderPrimitive.Track>
    
    {/* Thumb with glow */}
    <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full bg-white shadow-[0_0_15px_rgba(236,72,153,0.8),0_0_30px_rgba(168,85,247,0.4)] border-2 border-pink-400/50 ring-offset-background transition-all duration-200 hover:scale-110 hover:shadow-[0_0_20px_rgba(236,72,153,1),0_0_40px_rgba(168,85,247,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
