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
    {/* Main track with gradient */}
    <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-black/40 backdrop-blur-sm border border-white/10 shadow-inner">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-purple-500 via-pink-500 via-red-500 to-orange-500" />
    </SliderPrimitive.Track>
    
    {/* Bubble-style thumb */}
    <SliderPrimitive.Thumb className="block h-7 w-7 rounded-full bg-gradient-to-br from-white/90 via-white/60 to-white/30 backdrop-blur-sm border border-white/40 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.6),inset_-1px_-1px_3px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.15)] ring-offset-background transition-all duration-200 hover:scale-110 hover:from-white/95 hover:via-white/70 hover:to-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing active:scale-95" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
