import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Luma Calendar Sync
 * 
 * Fetches events from a Luma calendar and syncs them to Convex.
 * Called by scheduled cron job (see convex/crons.ts)
 */

// Types for parsed event data
interface LumaCalendarEvent {
  title: string;
  url: string;
  slug: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  coordinates: { lat: number; lng: number } | null;
  coverImage?: string | null;
}

/**
 * Extract calendar events from JSON-LD structured data
 */
function extractCalendarEvents(html: string): LumaCalendarEvent[] {
  const extractedEvents: LumaCalendarEvent[] = [];

  // Find all JSON-LD script tags
  const jsonLdRegex =
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonLd = JSON.parse(match[1]);

      // Handle Organization with events array (Luma calendar format)
      if (jsonLd["@type"] === "Organization" && Array.isArray(jsonLd.events)) {
        for (const item of jsonLd.events) {
          if (item["@type"] === "Event") {
            const event = parseJsonLdEvent(item);
            if (event) extractedEvents.push(event);
          }
        }
      }

      // Handle single event
      if (jsonLd["@type"] === "Event") {
        const event = parseJsonLdEvent(jsonLd);
        if (event) extractedEvents.push(event);
      }

      // Handle array of events
      if (Array.isArray(jsonLd)) {
        for (const item of jsonLd) {
          if (item["@type"] === "Event") {
            const event = parseJsonLdEvent(item);
            if (event) extractedEvents.push(event);
          }
        }
      }

      // Handle @graph format
      if (jsonLd["@graph"] && Array.isArray(jsonLd["@graph"])) {
        for (const item of jsonLd["@graph"]) {
          if (item["@type"] === "Event") {
            const event = parseJsonLdEvent(item);
            if (event) extractedEvents.push(event);
          }
        }
      }
    } catch {
      // Ignore JSON parse errors for individual blocks
    }
  }

  return extractedEvents;
}

/**
 * Parse a single JSON-LD event object
 */
function parseJsonLdEvent(
  jsonLd: Record<string, unknown>
): LumaCalendarEvent | null {
  try {
    // Luma uses @id for the event URL, fallback to url
    const url = (jsonLd["@id"] as string) || (jsonLd.url as string);
    if (!url) return null;

    // Extract slug from URL
    const slugMatch = url.match(
      /(?:lu\.ma|luma\.com)\/([a-zA-Z0-9-_]+)(?:\?|$)/
    );
    const slug = slugMatch?.[1];
    if (!slug) return null;

    const location = jsonLd.location as Record<string, unknown> | undefined;
    const address = location?.address as Record<string, unknown> | undefined;
    const geo = location?.geo as Record<string, unknown> | undefined;

    // Handle coordinates - can be numbers or strings
    let coordinates: { lat: number; lng: number } | null = null;
    if (geo) {
      const lat = geo.latitude as number | string;
      const lng = geo.longitude as number | string;
      if (lat !== undefined && lng !== undefined) {
        coordinates = {
          lat: typeof lat === "number" ? lat : parseFloat(lat),
          lng: typeof lng === "number" ? lng : parseFloat(lng),
        };
      }
    }

    // Get cover image from images array if available
    let coverImage: string | null = null;
    if (Array.isArray(jsonLd.image) && jsonLd.image.length > 0) {
      coverImage = jsonLd.image[0] as string;
    } else if (typeof jsonLd.image === "string") {
      coverImage = jsonLd.image;
    }

    return {
      title: (jsonLd.name as string) || "Untitled Event",
      url,
      slug,
      startDate: jsonLd.startDate as string,
      endDate: (jsonLd.endDate as string) || null,
      location: (address?.streetAddress as string) || null,
      coordinates,
      coverImage,
    };
  } catch {
    return null;
  }
}

/**
 * Sync Luma calendar events to Convex
 * 
 * This is an internal mutation called by the cron job.
 */
export const syncCalendar = internalMutation({
  args: {
    calendarSlug: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🔄 Syncing Luma calendar: ${args.calendarSlug}`);

    try {
      // 1. Fetch the calendar page
      const calendarUrl = `https://luma.com/${args.calendarSlug}`;
      const response = await fetch(calendarUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Poktapok/1.0; +https://poktapok.com)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch calendar: ${response.status}`);
        return {
          success: false,
          error: `Failed to fetch calendar: ${response.status}`,
        };
      }

      const html = await response.text();

      // 2. Extract events from JSON-LD
      const calendarEvents = extractCalendarEvents(html);

      if (calendarEvents.length === 0) {
        console.log("⚠️  No events found in calendar");
        return {
          success: true,
          synced: 0,
          created: 0,
          updated: 0,
          message: "No events found in calendar",
        };
      }

      console.log(`📅 Found ${calendarEvents.length} events`);

      // 3. Upsert each event to Convex
      let created = 0;
      let updated = 0;

      for (const calendarEvent of calendarEvents) {
        try {
          // Check if event already exists by lumaSlug
          const existing = await ctx.db
            .query("events")
            .withIndex("by_luma_slug", (q) =>
              q.eq("lumaSlug", calendarEvent.slug)
            )
            .unique();

          const eventData = {
            title: calendarEvent.title,
            lumaUrl: calendarEvent.url,
            lumaSlug: calendarEvent.slug,
            startDate: new Date(calendarEvent.startDate).getTime(),
            endDate: calendarEvent.endDate
              ? new Date(calendarEvent.endDate).getTime()
              : undefined,
            location: calendarEvent.location ?? undefined,
            coordinates: calendarEvent.coordinates ?? undefined,
            coverImage: calendarEvent.coverImage ?? undefined,
            calendar: args.calendarSlug,
          };

          if (existing) {
            // Update existing event
            await ctx.db.patch(existing._id, {
              ...eventData,
              // Keep original values for these fields
              isPublished: existing.isPublished,
              isFeatured: existing.isFeatured,
            });
            updated++;
            console.log(`✏️  Updated: ${calendarEvent.title}`);
          } else {
            // Create new event
            await ctx.db.insert("events", {
              ...eventData,
              eventType: "in-person", // Default
              timezone: "America/Mexico_City",
              hosts: [],
              status: "upcoming",
              isPublished: true, // Auto-publish synced events
              isFeatured: false,
              registrationCount: 0,
              registrationType: "free",
            });
            created++;
            console.log(`➕ Created: ${calendarEvent.title}`);
          }
        } catch (error) {
          console.error(`❌ Error processing event ${calendarEvent.slug}:`, error);
        }
      }

      const result = {
        success: true,
        synced: calendarEvents.length,
        created,
        updated,
        message: `Synced ${calendarEvents.length} events (${created} created, ${updated} updated)`,
      };

      console.log(`✅ ${result.message}`);
      return result;
    } catch (error) {
      console.error("❌ Sync failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
