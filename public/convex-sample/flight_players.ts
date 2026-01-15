import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all flight players
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("flight_players")
      .order("desc")
      .collect();
  },
});

// Get all players in a flight
export const getByFlight = query({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flight_players")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flightId))
      .order("asc")
      .collect();
  },
});

// Get player by ID
export const getById = query({
  args: { id: v.id("flight_players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get player by bag tag
export const getByBagTag = query({
  args: { bagTagNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flight_players")
      .withIndex("by_bag_tag_number", (q) => q.eq("bag_tag_number", args.bagTagNumber))
      .first();
  },
});

// Create flight player
export const create = mutation({
  args: {
    flight_id: v.optional(v.id("flights")),
    bag_drop_preplayer_id: v.optional(v.id("bag_drop_preplayer")),
    player_order: v.optional(v.number()),
    bag_tag_number: v.optional(v.string()),
    name: v.optional(v.string()),
    user_id: v.optional(v.id("users")),
    gender: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    member_type: v.optional(v.string()),
    sub_member_type: v.optional(v.string()),
    tee_box: v.optional(v.string()),
    handicap_index: v.optional(v.number()),
    rv_id: v.optional(v.string()), // RFID tag ID
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("flight_players", {
      ...args,
      payment_status: "unpaid", // Set default payment_status to unpaid
      created_at: now,
      updated_at: now,
    });
  },
});

// Update flight player
export const update = mutation({
  args: {
    id: v.id("flight_players"),
    name: v.optional(v.string()),
    tee_box: v.optional(v.string()),
    handicap_index: v.optional(v.number()),
    assigned_caddie_id: v.optional(v.id("caddies")),
    assigned_caddie_name: v.optional(v.string()),
    assigned_cart_id: v.optional(v.id("carts")),
    assigned_cart_name: v.optional(v.string()),
    cart_type: v.optional(v.string()),
    assigned_tablet_id: v.optional(v.id("users")),
    assigned_tablet_name: v.optional(v.string()),
    payment_status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Get the flight player to access bag_drop_preplayer_id
    const flightPlayer = await ctx.db.get(id);
    if (!flightPlayer) {
      throw new Error(`Flight player with ID ${id} not found`);
    }
    
    // Update flight player
    await ctx.db.patch(id, {
      ...updates,
      updated_at: Date.now(),
    });
    
    // If payment_status is being updated and bag_drop_preplayer_id exists, sync it
    if (updates.payment_status && flightPlayer.bag_drop_preplayer_id) {
      const bagDropPlayer = await ctx.db.get(flightPlayer.bag_drop_preplayer_id);
      if (bagDropPlayer) {
        await ctx.db.patch(flightPlayer.bag_drop_preplayer_id, {
          payment_status: updates.payment_status,
          updated_at: Date.now(),
        });
      }
    }
    
    return id;
  },
});

// Delete flight player
export const remove = mutation({
  args: { id: v.id("flight_players") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});


// Get players from multiple flights
export const getByMultipleFlights = query({
  args: { flightIds: v.array(v.id("flights")) },
  handler: async (ctx, args) => {
    const allPlayers = await Promise.all(
      args.flightIds.map(async (flightId) => {
        const players = await ctx.db
          .query("flight_players")
          .withIndex("by_flight_id", (q) => q.eq("flight_id", flightId))
          .collect();
        
        // Get flight name for each player
        const flight = await ctx.db.get(flightId);
        
        // Enrich each player with tablet and caddie info from resource_assignments
        const enrichedPlayers = await Promise.all(
          players.map(async (player) => {
            let tabletId = player.assigned_tablet_id;
            let tabletName = player.assigned_tablet_name || "";
            let caddieId = player.assigned_caddie_id;
            let caddieName = player.assigned_caddie_name || "";
            
            // Query resource_assignments for this player's tablet assignment
            const tabletAssignment = await ctx.db
              .query("resource_assignments")
              .withIndex("by_flight_id", (q) => q.eq("flight_id", flightId))
              .filter((q) => 
                q.and(
                  q.eq(q.field("resource_type"), "tablet"),
                  q.eq(q.field("flight_player_id"), player._id)
                )
              )
              .first();
            
            if (tabletAssignment) {
              tabletId = tabletAssignment.resource_id as any;
              tabletName = tabletAssignment.resource_name || "";
            }
            
            // Query resource_assignments for this player's caddie assignment
            const caddieAssignment = await ctx.db
              .query("resource_assignments")
              .withIndex("by_flight_id", (q) => q.eq("flight_id", flightId))
              .filter((q) => 
                q.and(
                  q.eq(q.field("resource_type"), "caddie"),
                  q.eq(q.field("flight_player_id"), player._id)
                )
              )
              .first();
            
            if (caddieAssignment) {
              caddieId = caddieAssignment.resource_id as any;
              caddieName = caddieAssignment.resource_name || "";
            }
            
            // Fallback: If no tablet name but has tablet ID, fetch from users table
            if (!tabletName && tabletId) {
              const tabletUser = await ctx.db.get(tabletId);
              tabletName = tabletUser?.full_name || tabletUser?.username || "";
            }
            
            // Fallback: If no caddie name but has caddie ID, fetch from caddies table
            if (!caddieName && caddieId) {
              const caddieUser = await ctx.db.get(caddieId);
              caddieName = caddieUser?.fullname || "";
            }
            
            return {
              ...player,
              flight_name: flight?.flight_name || "",
              assigned_tablet_id: tabletId,
              assigned_tablet_name: tabletName,
              assigned_caddie_id: caddieId,
              assigned_caddie_name: caddieName,
            };
          })
        );
        
        return enrichedPlayers;
      })
    );
    
    return allPlayers.flat();
  },
});