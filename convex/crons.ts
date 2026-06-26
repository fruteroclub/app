import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled Functions (Cron Jobs)
 * 
 * Convex cron jobs run on the server and can call internal mutations/actions.
 * 
 * Note: We use the internal version to avoid exposing sync logic publicly.
 * For manual testing, use the public action: api.luma.syncAction.syncCalendar
 */

const crons = cronJobs();

/**
 * Sync Frutero Club events from Luma calendar
 * 
 * Runs daily at 6:00 AM Mexico City time (12:00 PM UTC)
 * 
 * Timezone conversion:
 * - Mexico City (CDMX): UTC-6
 * - 6:00 AM CDMX = 12:00 PM UTC
 */
crons.daily(
  "sync frutero luma calendar",
  {
    hourUTC: 12, // 6 AM Mexico City
    minuteUTC: 0,
  },
  internal.luma.sync.syncCalendar,
  { calendarSlug: "fruteroclub" }
);

export default crons;
