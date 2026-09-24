import type { ReactNode } from "react";

import SwipeHint from "@/components/SwipeHint";
import { useSwipeSlider } from "@/hooks/use-swipe-slider";
import { cn } from "@/lib/utils";

type SwipeCarouselProps<T> = {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string | number;
  /** Persists that the visitor has discovered swiping, so the hint shows once. */
  storageKey: string;
  hintText: string;
  className?: string;
};

/**
 * One slide at a time, swipe to move, looping at both ends. Intended for
 * phones; with fewer than two items it simply renders the items.
 */
function SwipeCarousel<T>({
  items,
  renderItem,
  getKey,
  storageKey,
  hintText,
  className,
}: SwipeCarouselProps<T>) {
  const { containerRef, trackStyle, handlers, onTransitionEnd, hintVisible } = useSwipeSlider({
    count: items.length,
    storageKey,
  });

  if (items.length < 2) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={getKey(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  // The edge clones exist only to make the loop seamless; assistive
  // technology should see each item once.
  const last = items.length - 1;
  const slides = [
    { key: `clone-${getKey(items[last], last)}`, item: items[last], index: last, clone: true },
    ...items.map((item, index) => ({ key: getKey(item, index), item, index, clone: false })),
    { key: `clone-${getKey(items[0], 0)}`, item: items[0], index: 0, clone: true },
  ];

  return (
    <div className={className}>
      <div ref={containerRef} className="-mx-6 overflow-hidden" {...handlers}>
        <div className="flex" style={trackStyle} onTransitionEnd={onTransitionEnd}>
          {slides.map((slide) => (
            <div
              key={slide.key}
              className={cn("w-full flex-none px-6")}
              aria-hidden={slide.clone || undefined}
              // Clones must not be reachable by keyboard either.
              {...(slide.clone ? { inert: "" as unknown as boolean } : {})}
            >
              {renderItem(slide.item, slide.index)}
            </div>
          ))}
        </div>
      </div>
      <SwipeHint visible={hintVisible} text={hintText} />
    </div>
  );
}

export default SwipeCarousel;
