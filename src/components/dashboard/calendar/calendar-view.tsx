"use client";

import { format } from "date-fns";
import { useCalendarStore, ScheduledPost } from "@/store/calendar-store";
import { useEffect, useRef, useState } from "react";
import { CalendarWeekHeader } from "./calendar-week-header";
import { CalendarHoursColumn } from "./calendar-hours-column";
import { CalendarDayColumn } from "./calendar-day-column";
import { INITIAL_SCROLL_OFFSET } from "./calendar-utils";
import { PostSheet } from "./post-sheet";

export function CalendarView() {
  const { 
    goToNextWeek, 
    goToPreviousWeek, 
    getWeekDays, 
    getCurrentWeekPosts 
  } = useCalendarStore();
  
  const weekDays = getWeekDays();
  const posts = getCurrentWeekPosts();
  const hoursScrollRef = useRef<HTMLDivElement>(null);
  const daysScrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasScrolledRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const today = new Date();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const postsByDay: Record<string, ScheduledPost[]> = {};
  weekDays.forEach((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    postsByDay[dayStr] = posts.filter((p) => p.date === dayStr);
  });

  const isTodayInWeek = weekDays.some(
    (day) => format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
  );

  useEffect(() => {
    const scrollToInitial = () => {
      if (!hasScrolledRef.current && hoursScrollRef.current) {
        hoursScrollRef.current.scrollTop = INITIAL_SCROLL_OFFSET;
        daysScrollRefs.current.forEach((ref) => {
          if (ref) {
            ref.scrollTop = INITIAL_SCROLL_OFFSET;
          }
        });
        hasScrolledRef.current = true;
      }
    };

    scrollToInitial();
    const timeoutId = setTimeout(scrollToInitial, 100);
    return () => clearTimeout(timeoutId);
  }, [weekDays]);

  const handleHoursScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    daysScrollRefs.current.forEach((ref) => {
      if (ref) {
        ref.scrollTop = scrollTop;
      }
    });
  };

  const handleDayScroll =
    (index: number) => (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      if (hoursScrollRef.current) {
        hoursScrollRef.current.scrollTop = scrollTop;
      }
      daysScrollRefs.current.forEach((ref, idx) => {
        if (ref && idx !== index) {
          ref.scrollTop = scrollTop;
        }
      });
    };

  const handlePostClick = (post: ScheduledPost) => {
    setSelectedPost(post);
    setSheetOpen(true);
  };

  return (
    <>
      <PostSheet
        post={selectedPost}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
      <div className="flex flex-col h-full overflow-x-auto w-full border border-border rounded-xl no-scrollbar">
        <CalendarWeekHeader
          weekDays={weekDays}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
        />

        <div className="flex min-w-full w-max flex-1 overflow-hidden">
          <CalendarHoursColumn
            onScroll={handleHoursScroll}
            scrollRef={hoursScrollRef}
          />

          {weekDays.map((day, dayIndex) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayPosts = postsByDay[dayStr] || [];

            return (
              <CalendarDayColumn
                key={day.toISOString()}
                day={day}
                dayIndex={dayIndex}
                posts={dayPosts}
                today={today}
                isTodayInWeek={isTodayInWeek}
                currentTime={currentTime}
                onScroll={handleDayScroll}
                scrollRef={(el) => {
                  daysScrollRefs.current[dayIndex] = el;
                }}
                onPostClick={handlePostClick}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
