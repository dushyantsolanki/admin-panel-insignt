export function parseAnalyticsDates(url: string) {
  const { searchParams } = new URL(url);
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  const now = new Date();
  
  // Default to 30 days if not provided
  const currentEnd = endDateStr ? new Date(endDateStr) : now;
  const currentStart = startDateStr ? new Date(startDateStr) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Default time boundaries
  currentStart.setHours(0, 0, 0, 0);
  currentEnd.setHours(23, 59, 59, 999);

  const daysDifference = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Previous period for comparison
  const previousStart = new Date(currentStart.getTime() - daysDifference * 24 * 60 * 60 * 1000);
  const previousEnd = new Date(currentStart.getTime() - 1);

  return { currentStart, currentEnd, previousStart, previousEnd, daysDifference };
}
