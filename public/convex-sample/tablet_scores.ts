import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List all tablet scores (alias for getAll)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("tablet_scores").collect();
  },
});

// Get all tablet scores (for real-time subscription)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tablet_scores")
      .collect();
  },
});

// Get scores by tablet round
export const getByRound = query({
  args: { tabletRoundId: v.id("tablet_rounds") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tablet_scores")
      .withIndex("by_tablet_round_id", (q) => q.eq("tablet_round_id", args.tabletRoundId))
      .collect();
  },
});

// Get scores by flight
export const getByFlight = query({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tablet_scores")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flightId))
      .collect();
  },
});

// Get scores by player
export const getByPlayer = query({
  args: { flightPlayerId: v.id("flight_players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tablet_scores")
      .withIndex("by_flight_player_id", (q) => q.eq("flight_player_id", args.flightPlayerId))
      .order("asc")
      .collect();
  },
});

// Get score for specific hole
export const getPlayerHoleScore = query({
  args: {
    flightId: v.id("flights"),
    playerOrder: v.number(),
    holeNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tablet_scores")
      .withIndex("by_flight_player_hole", (q) =>
        q
          .eq("flight_id", args.flightId)
          .eq("player_order", args.playerOrder)
          .eq("hole_number", args.holeNumber)
      )
      .first();
  },
});

// Create score
export const create = mutation({
  args: {
    tablet_round_id: v.optional(v.id("tablet_rounds")),
    flight_id: v.optional(v.id("flights")),
    flight_player_id: v.optional(v.id("flight_players")),
    player_order: v.optional(v.number()),
    hole_id: v.optional(v.id("holes")),
    hole_number: v.optional(v.number()),
    strokes: v.optional(v.number()),
    hole_par: v.optional(v.number()),
    putts: v.optional(v.number()),
    fairway_hit: v.optional(v.boolean()),
    bunker: v.optional(v.boolean()),
    rough: v.optional(v.boolean()),
    ob: v.optional(v.boolean()),
    pa: v.optional(v.boolean()),
    green_in_regulation: v.optional(v.boolean()),
    penalties: v.optional(v.number()),
    recorded_by: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tablet_scores", {
      ...args,
      created_at: now,
      updated_at: now,
    });
  },
});

// Update score
export const update = mutation({
  args: {
    id: v.id("tablet_scores"),
    strokes: v.optional(v.number()),
    putts: v.optional(v.number()),
    fairway_hit: v.optional(v.boolean()),
    bunker: v.optional(v.boolean()),
    rough: v.optional(v.boolean()),
    ob: v.optional(v.boolean()),
    pa: v.optional(v.boolean()),
    green_in_regulation: v.optional(v.boolean()),
    penalties: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updated_at: Date.now(),
    });
    return id;
  },
});
