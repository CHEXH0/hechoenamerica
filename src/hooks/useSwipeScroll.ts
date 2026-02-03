import { useRef, useCallback } from "react";

interface UseSwipeScrollOptions {
  itemWidth: number;
  onScrollChange?: (canScrollLeft: boolean, canScrollRight: boolean) => void;
}

export function useSwipeScroll({ itemWidth, onScrollChange }: UseSwipeScrollOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartScrollLeft = useRef(0);
  const isSwiping = useRef(false);
  const velocity = useRef(0);
  const lastTouchX = useRef(0);
  const lastTouchTime = useRef(0);

  const updateScrollIndicators = useCallback(() => {
    if (scrollRef.current && onScrollChange) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      onScrollChange(scrollLeft > 5, scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, [onScrollChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    
    isSwiping.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchStartScrollLeft.current = scrollRef.current.scrollLeft;
    lastTouchX.current = e.touches[0].clientX;
    lastTouchTime.current = Date.now();
    velocity.current = 0;
    
    // Stop any ongoing momentum scroll
    scrollRef.current.style.scrollBehavior = 'auto';
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current || !isSwiping.current) return;
    
    const currentX = e.touches[0].clientX;
    const currentTime = Date.now();
    const deltaX = touchStartX.current - currentX;
    
    // Calculate velocity for momentum
    const timeDelta = currentTime - lastTouchTime.current;
    if (timeDelta > 0) {
      velocity.current = (lastTouchX.current - currentX) / timeDelta;
    }
    
    lastTouchX.current = currentX;
    lastTouchTime.current = currentTime;
    
    // Apply scroll
    scrollRef.current.scrollLeft = touchStartScrollLeft.current + deltaX;
    updateScrollIndicators();
  }, [updateScrollIndicators]);

  const handleTouchEnd = useCallback(() => {
    if (!scrollRef.current || !isSwiping.current) return;
    
    isSwiping.current = false;
    
    // Apply momentum with snap-to-card
    const momentumDistance = velocity.current * 150; // Momentum multiplier
    const currentScroll = scrollRef.current.scrollLeft;
    const targetScroll = currentScroll + momentumDistance;
    
    // Snap to nearest card
    const snappedScroll = Math.round(targetScroll / itemWidth) * itemWidth;
    
    // Clamp to bounds
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    const finalScroll = Math.max(0, Math.min(snappedScroll, maxScroll));
    
    scrollRef.current.style.scrollBehavior = 'smooth';
    scrollRef.current.scrollLeft = finalScroll;
    
    // Reset scroll behavior after animation
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.style.scrollBehavior = 'auto';
        updateScrollIndicators();
      }
    }, 300);
  }, [itemWidth, updateScrollIndicators]);

  const scrollToDirection = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = itemWidth;
    const currentScroll = scrollRef.current.scrollLeft;
    const targetScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    // Snap to card boundary
    const snappedScroll = Math.round(targetScroll / itemWidth) * itemWidth;
    
    scrollRef.current.style.scrollBehavior = 'smooth';
    scrollRef.current.scrollLeft = snappedScroll;
    
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.style.scrollBehavior = 'auto';
        updateScrollIndicators();
      }
    }, 300);
  }, [itemWidth, updateScrollIndicators]);

  return {
    scrollRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    scrollToDirection,
    updateScrollIndicators,
  };
}
