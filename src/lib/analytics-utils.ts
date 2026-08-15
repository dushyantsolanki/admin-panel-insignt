import moment from "moment-timezone";

export function parseAnalyticsDates(url: string) {
  const { searchParams } = new URL(url);
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  const TIMEZONE = "Asia/Kolkata";
  const now = moment().tz(TIMEZONE);
  
  // Default to 30 days if not provided
  const mEnd = endDateStr ? moment.tz(endDateStr, TIMEZONE) : now.clone();
  const mStart = startDateStr ? moment.tz(startDateStr, TIMEZONE) : now.clone().subtract(30, 'days');

  // Set time boundaries explicitly to IST day boundaries
  mStart.startOf('day');
  mEnd.endOf('day');

  const currentStart = mStart.toDate();
  const currentEnd = mEnd.toDate();

  const daysDifference = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Previous period for comparison
  const previousStart = mStart.clone().subtract(daysDifference, 'days').toDate();
  const previousEnd = mStart.clone().subtract(1, 'millisecond').toDate();

  return { currentStart, currentEnd, previousStart, previousEnd, daysDifference };
}
