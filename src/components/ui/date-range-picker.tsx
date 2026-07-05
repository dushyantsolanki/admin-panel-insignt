import * as React from "react"
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear
} from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
  className,
  date,
  setDate,
}: React.HTMLAttributes<HTMLDivElement> & {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}) {
  const handlePreset = (preset: "today" | "yesterday" | "7days" | "30days" | "thisMonth" | "lastMonth" | "thisYear") => {
    const today = new Date();
    switch (preset) {
      case "today":
        setDate({ from: today, to: today });
        break;
      case "yesterday":
        setDate({ from: subDays(today, 1), to: subDays(today, 1) });
        break;
      case "7days":
        setDate({ from: subDays(today, 7), to: today });
        break;
      case "30days":
        setDate({ from: subDays(today, 30), to: today });
        break;
      case "thisMonth":
        setDate({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case "thisYear":
        setDate({ from: startOfYear(today), to: endOfYear(today) });
        break;
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col sm:flex-row" align="start">
          <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-border p-3 gap-2 w-full sm:w-[150px]">
            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => handlePreset("today")}>Today</Button>
            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => handlePreset("yesterday")}>Yesterday</Button>
            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => handlePreset("7days")}>Last 7 Days</Button>
            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => handlePreset("30days")}>Last 30 Days</Button>
            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => handlePreset("thisMonth")}>This Month</Button>
            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => handlePreset("lastMonth")}>Last Month</Button>
            <Button variant="ghost" size="sm" className="justify-start font-normal" onClick={() => handlePreset("thisYear")}>This Year</Button>
          </div>
          <div className="flex flex-col">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
