"use client";

import { ScheduledPost } from "@/store/calendar-store";
import {
  HOURS_24,
  HOUR_HEIGHT,
  getEventTop,
  getEventHeight,
} from "./calendar-utils";
import { EventCard } from "./event-card";
import { CurrentTimeIndicator } from "./current-time-indicator";

interface CalendarDayColumnProps {
  day: Date;
  dayIndex: number;
  posts: ScheduledPost[];
  today: Date;
  isTodayInWeek: boolean;
  currentTime: Date;
  onScroll: (index: number) => (e: React.UIEvent<HTMLDivElement>) => void;
  scrollRef: (el: HTMLDivElement | null) => void;
  onPostClick: (post: ScheduledPost) => void;
}

export function CalendarDayColumn({
  day,
  dayIndex,
  posts,
  today,
  isTodayInWeek,
  currentTime,
  onScroll,
  scrollRef,
  onPostClick,
}: CalendarDayColumnProps) {
  return (
    <div
      ref={scrollRef}
      onScroll={onScroll(dayIndex)}
      className="flex-1 border-r border-border last:border-r-0 relative min-w-44 overflow-y-auto no-scrollbar"
    >
      {HOURS_24.map((hour) => (
        <div
          key={hour}
          className="border-b border-border/50"
          style={{ height: `${HOUR_HEIGHT}px` }}
        />
      ))}

      <CurrentTimeIndicator
        day={day}
        today={today}
        isTodayInWeek={isTodayInWeek}
        currentTime={currentTime}
      />

      {posts.map((post) => {
        const top = getEventTop(post.startTime);
        const height = getEventHeight(post.startTime, post.endTime);

        return (
          <EventCard
            key={post.id}
            post={post}
            style={{
              top: `${top + 4}px`,
              height: `${height - 8}px`,
            }}
            onClick={() => onPostClick(post)}
          />
        );
      })}
    </div>
  );
}
