"use client";

import { HOURS_24, HOUR_HEIGHT } from "./calendar-utils";

interface CalendarHoursColumnProps {
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function CalendarHoursColumn({
  onScroll,
  scrollRef,
}: CalendarHoursColumnProps) {
  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="w-[80px] md:w-[104px] border-r border-border shrink-0 overflow-y-auto relative no-scrollbar"
    >
      {HOURS_24.map((hour) => (
        <div
          key={hour}
          className="border-b border-border p-2 md:p-3 text-[10px] md:text-xs font-semibold text-muted-foreground bg-muted/5 flex justify-center"
          style={{ height: `${HOUR_HEIGHT}px` }}
        >
          {hour}
        </div>
      ))}
    </div>
  );
}
