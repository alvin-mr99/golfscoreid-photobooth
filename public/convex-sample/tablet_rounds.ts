import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List all tablet rounds
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("tablet_rounds").collect();
  },
});

// Get round by flight
export const getByFlight = query({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tablet_rounds")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flightId))
      .collect();
  },
});

// Get round by flight and device
export const getByFlightDevice = query({
  args: {
    flightId: v.id("flights"),
    deviceId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tablet_rounds")
      .withIndex("by_flight_device", (q) =>
        q.eq("flight_id", args.flightId).eq("device_id", args.deviceId)
      )
      .first();
  },
});

// Get active rounds
export const getActive = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("tablet_rounds")
      .withIndex("by_finished_scoring", (q) => q.eq("finished_scoring", false))
      .collect();
  },
});

// Create round
export const create = mutation({
  args: {
    flight_id: v.optional(v.id("flights")),
    device_id: v.optional(v.id("users")),
    device_info: v.optional(v.string()),
    is_primary_device: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tablet_rounds", {
      ...args,
      current_hole: 1,
      holes_completed: 0,
      is_primary_device: args.is_primary_device !== false,
      finished_scoring: false,
      created_at: now,
      updated_at: now,
    });
  },
});

// Update round progress
export const updateProgress = mutation({
  args: {
    id: v.id("tablet_rounds"),
    current_hole: v.optional(v.number()),
    holes_completed: v.optional(v.number()),
    finished_scoring: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();
    await ctx.db.patch(id, {
      ...updates,
      finished_at: updates.finished_scoring ? now : undefined,
      completed_at: updates.finished_scoring ? now : undefined,
      updated_at: now,
    });
    return id;
  },
});

// Get tablet round data for scoring screen
export const getTabletRoundForScoring = query({
  args: { round_id: v.id("tablet_rounds") },
  handler: async (ctx, args) => {
    try {
      const tabletRound = await ctx.db.get(args.round_id);
      if (!tabletRound) {
        throw new Error("Tablet round not found");
      }

      // Get flight data
      const flight = tabletRound.flight_id ? await ctx.db.get(tabletRound.flight_id) : null;
      if (!flight) {
        throw new Error("Flight not found");
      }

      // Get course data
      const course = flight.course_id ? await ctx.db.get(flight.course_id) : null;

      // Get holes for this course - sorted by hole_number
      let holes: any[] = [];
      if (course) {
        const allHoles = await ctx.db
          .query("holes")
          .withIndex("by_course_id", (q) => q.eq("course_id", course._id))
          .collect();
        // Sort by hole_number in JavaScript
        holes = allHoles.sort((a, b) => (a.hole_number || 0) - (b.hole_number || 0));
      }

      // Get all players in this flight - sorted by player_order
      const allPlayers = await ctx.db
        .query("flight_players")
        .withIndex("by_flight_id", (q) => q.eq("flight_id", flight._id))
        .collect();
      // Sort by player_order in JavaScript
      const flightPlayers = allPlayers.sort((a, b) => (a.player_order || 0) - (b.player_order || 0));

      // Get all tablet rounds for this flight to check finish status
      const allTabletRounds = await ctx.db
        .query("tablet_rounds")
        .withIndex("by_flight_id", (q) => q.eq("flight_id", flight._id))
        .collect();

      // Get finished tablet device IDs (only tablets that have finished_scoring = true)
      const finishedTabletDeviceIds = allTabletRounds
        .filter(tr => tr.finished_scoring === true && tr.device_id)
        .map(tr => tr.device_id!);

      // Determine which players should be disabled (their assigned tablet has finished)
      // A player is disabled if:
      // 1. They have an assigned_tablet_id
      // 2. That tablet_id is in the list of finished tablets
      const disabledPlayerIds = flightPlayers
        .filter(player => {
          if (!player.assigned_tablet_id) return false;
          const isFinished = finishedTabletDeviceIds.some(
            finishedId => finishedId === player.assigned_tablet_id
          );
          return isFinished;
        })
        .map(player => player._id);

      // Get all scores for this flight (not just this tablet round) for complete view
      const allScores = await ctx.db
        .query("tablet_scores")
        .withIndex("by_flight_id", (q) => q.eq("flight_id", flight._id))
        .collect();

      // Get recorded_by usernames for scores
      const scoresWithUsernames = await Promise.all(
        allScores.map(async (score) => {
          const recordedBy = score.recorded_by ? await ctx.db.get(score.recorded_by) : null;
          return {
            ...score,
            recorded_by_username: recordedBy?.username || "Unknown",
          };
        })
      );

      // Format players with caddie info and assigned tablet info
      // Get tablet names for players that have assigned_tablet_id but no assigned_tablet_name
      const playersWithInfo = await Promise.all(
        flightPlayers.map(async (player) => {
          let tabletName = player.assigned_tablet_name || "";
          
          // If no tablet name but has tablet ID, fetch from users table
          if (!tabletName && player.assigned_tablet_id) {
            const tabletUser = await ctx.db.get(player.assigned_tablet_id);
            tabletName = tabletUser?.full_name || tabletUser?.username || "";
          }

          return {
            _id: player._id,
            name: player.name,
            player_order: player.player_order,
            handicap_index: player.handicap_index || 0, // Use from schema if available
            caddy_name: player.assigned_caddie_name || "No Caddy",
            caddy_id: player.assigned_caddie_id,
            tee_box: player.tee_box,
            gender: player.gender,
            assigned_tablet_id: player.assigned_tablet_id,
            assigned_tablet_name: tabletName,
            // Flag if this player's tablet has finished (player should be disabled)
            is_tablet_finished: player.assigned_tablet_id
              ? finishedTabletDeviceIds.includes(player.assigned_tablet_id)
              : false,
          };
        })
      );

      // Check if current tablet has finished
      const currentTabletFinished = tabletRound.finished_scoring === true;

      // Check if all tablets have finished
      const allTabletsFinished = allTabletRounds.length > 0 && 
        allTabletRounds.every(tr => tr.finished_scoring === true);

      return {
        round: {
          _id: tabletRound._id,
          flight_id: flight._id,
          round_name: flight.flight_name,
          flight_name: flight.flight_name,
          tournament_name: flight.flight_name,
          course_name: course?.name || "Unknown Course",
          status: flight.status,
          start_hole: flight.start_hole || 1,
          current_hole: tabletRound.current_hole,
          course_type: flight.course_type,
          game_mode: flight.game_mode,
          scoring_system: flight.scoring_system,
          tee_time: flight.tee_off_time,
          created_at: flight.created_at,
          players: playersWithInfo,
          // Multi-tablet status info
          current_tablet_finished: currentTabletFinished,
          current_tablet_device_id: tabletRound.device_id, // Current tablet's device ID
          all_tablets_finished: allTabletsFinished,
          total_tablets: allTabletRounds.length,
          finished_tablets: finishedTabletDeviceIds.length,
          disabled_player_ids: disabledPlayerIds,
          finished_tablet_device_ids: finishedTabletDeviceIds,
          // Debug info: all tablet rounds with their status
          tablet_rounds_debug: allTabletRounds.map(tr => ({
            device_id: tr.device_id,
            finished_scoring: tr.finished_scoring,
          })),
          // Debug info: player tablet assignments
          player_tablet_assignments: flightPlayers.map(p => ({
            player_id: p._id,
            player_name: p.name,
            assigned_tablet_id: p.assigned_tablet_id,
          })),
        },
        course: course ? {
          _id: course._id,
          name: course.name,
          total_holes: course.total_holes || 18,
          par: course.par || 72,
        } : null,
        holes: holes.map(h => ({
          _id: h._id,
          hole_number: h.hole_number,
          par: h.par,
          distance_white: h.distance_white,
          distance_blue: h.distance_blue,
          distance_black: h.distance_black,
          distance_red: h.distance_red,
          handicap_index: h.handicap_index,
          video_url: h.video_url,
          tee_box_lat: h.tee_box_lat,
          tee_box_lng: h.tee_box_lng,
          green_lat: h.green_lat,
          green_lng: h.green_lng,
        })),
        players: playersWithInfo,
        scores: scoresWithUsernames,
      };
    } catch (error: any) {
      throw new Error(`Failed to get tablet round: ${error.message}`);
    }
  },
});

// Save tablet score
export const saveTabletScore = mutation({
  args: {
    tablet_round_id: v.id("tablet_rounds"),
    player_order: v.optional(v.number()), // Made optional - can be derived from recorded_by
    hole_id: v.id("holes"),
    hole_number: v.number(),
    strokes: v.number(),
    hole_par: v.number(),
    putts: v.optional(v.number()),
    fairway_hit: v.optional(v.boolean()),
    bunker: v.optional(v.boolean()),
    rough: v.optional(v.boolean()),
    ob: v.optional(v.boolean()),
    pa: v.optional(v.boolean()),
    green_in_regulation: v.optional(v.boolean()),
    penalties: v.optional(v.number()),
    recorded_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get tablet round to get flight_id
    const tabletRound = await ctx.db.get(args.tablet_round_id);
    if (!tabletRound || !tabletRound.flight_id) {
      throw new Error("Tablet round or flight not found");
    }

    // Get flight players
    const flightPlayers = await ctx.db
      .query("flight_players")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", tabletRound.flight_id!))
      .collect();
    
    // Auto-resolve player_order and flight_player
    let playerOrder = args.player_order;
    let flightPlayer;

    if (playerOrder !== undefined) {
      // Method 1: Use provided player_order
      flightPlayer = flightPlayers.find(p => p.player_order === playerOrder);
    } else {
      // Method 2: Derive from recorded_by (user_id)
      flightPlayer = flightPlayers.find(p => p.user_id === args.recorded_by);
      playerOrder = flightPlayer?.player_order;
    }

    if (!flightPlayer || playerOrder === undefined) {
      const availablePlayers = flightPlayers.map(p => `${p.player_order}:${p.user_id}`).join(", ");
      throw new Error(
        `Cannot determine player. player_order=${args.player_order}, recorded_by=${args.recorded_by}, available players: ${availablePlayers}`
      );
    }

    // Check if score already exists
    const existingScore = await ctx.db
      .query("tablet_scores")
      .withIndex("by_flight_player_hole", (q) => 
        q.eq("flight_id", tabletRound.flight_id!)
         .eq("player_order", playerOrder)
         .eq("hole_number", args.hole_number)
      )
      .first();

    if (existingScore) {
      // Update existing score
      await ctx.db.patch(existingScore._id, {
        strokes: args.strokes,
        hole_par: args.hole_par,
        putts: args.putts,
        fairway_hit: args.fairway_hit ?? false,
        bunker: args.bunker ?? false,
        rough: args.rough ?? false,
        ob: args.ob ?? false,
        pa: args.pa ?? false,
        green_in_regulation: args.green_in_regulation,
        penalties: args.penalties ?? 0,
        recorded_by: args.recorded_by,
        updated_at: now,
      });
      return { success: true, score_id: existingScore._id, updated: true };
    } else {
      // Create new score
      const scoreId = await ctx.db.insert("tablet_scores", {
        tablet_round_id: args.tablet_round_id,
        flight_id: tabletRound.flight_id,
        flight_player_id: flightPlayer._id,
        player_order: playerOrder,
        hole_id: args.hole_id,
        hole_number: args.hole_number,
        strokes: args.strokes,
        hole_par: args.hole_par,
        putts: args.putts,
        fairway_hit: args.fairway_hit ?? false,
        bunker: args.bunker ?? false,
        rough: args.rough ?? false,
        ob: args.ob ?? false,
        pa: args.pa ?? false,
        green_in_regulation: args.green_in_regulation,
        penalties: args.penalties ?? 0,
        recorded_by: args.recorded_by,
        created_at: now,
        updated_at: now,
      });
      return { success: true, score_id: scoreId, updated: false };
    }
  },
});

// Get completed rounds for tablet history
// Only shows flights where ALL tablets have finished scoring
export const getCompletedFlightsForTablet = query({
  args: {
    tablet_id: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get completed tablet rounds for this device with finished_scoring = true
    const completedRounds = await ctx.db
      .query("tablet_rounds")
      .withIndex("by_device_id", (q) => q.eq("device_id", args.tablet_id))
      .filter((q) => q.eq(q.field("finished_scoring"), true))
      .order("desc")
      .take(limit);

    // Build detailed response for each round
    const roundsWithDetails = await Promise.all(
      completedRounds.map(async (round) => {
        // Get flight info
        const flight = round.flight_id ? await ctx.db.get(round.flight_id) : null;
        if (!flight) return null;

        // Check if ALL tablets for this flight have finished
        const allTabletRoundsForFlight = await ctx.db
          .query("tablet_rounds")
          .withIndex("by_flight_id", (q) => q.eq("flight_id", flight._id))
          .collect();

        const allTabletsFinished = allTabletRoundsForFlight.length > 0 &&
          allTabletRoundsForFlight.every(tr => tr.finished_scoring === true);

        // Only include if ALL tablets have finished
        if (!allTabletsFinished) {
          return null; // Skip this round - not all tablets finished yet
        }

        // Get course info
        const course = flight.course_id ? await ctx.db.get(flight.course_id) : null;

        // Get players in this flight
        const players = await ctx.db
          .query("flight_players")
          .withIndex("by_flight_id", (q) => q.eq("flight_id", flight._id))
          .collect();

        // Get all scores for this flight (from all tablets)
        const scores = await ctx.db
          .query("tablet_scores")
          .withIndex("by_flight_id", (q) => q.eq("flight_id", flight._id))
          .collect();

        // Calculate total strokes and holes completed
        const total_strokes = scores.reduce((sum, score) => sum + (score.strokes || 0), 0);
        const holes_completed = new Set(scores.map(s => s.hole_number)).size;

        return {
          _id: round._id,
          round_name: flight.flight_name || "Unnamed Round",
          flight_id: flight._id,
          course_name: course?.name || "Unknown Course",
          course_par: course?.par || 72,
          tee_off_time: flight.tee_off_time || flight.created_at || 0,
          completed_at: round.completed_at || round.finished_at || round.updated_at,
          status: flight.status,
          total_players: flight.total_players || players.length,
          holes_completed,
          total_strokes,
          players: players.map(p => ({
            name: p.name || "Unknown",
            tee_box: p.tee_box || "white",
          })),
        };
      })
    );

    // Filter out nulls and sort by completed_at descending
    const validRounds = roundsWithDetails
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0));

    return validRounds;
  },
});

// Update tablet round status - Per-tablet finish mechanism
// Each tablet can finish independently, flight only completes when ALL tablets finish
export const updateTabletRoundStatus = mutation({
  args: {
    round_id: v.id("tablet_rounds"),
    status: v.string(),
    device_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const tabletRound = await ctx.db.get(args.round_id);
    if (!tabletRound) {
      throw new Error("Tablet round not found");
    }

    // Update THIS tablet round only
    await ctx.db.patch(args.round_id, {
      finished_scoring: args.status === "completed",
      finished_at: args.status === "completed" ? now : undefined,
      updated_at: now,
    });

    // If completing the round, check if ALL tablets for this flight have finished
    if (args.status === "completed" && tabletRound.flight_id) {
      const flight = await ctx.db.get(tabletRound.flight_id);
      if (!flight) {
        throw new Error("Flight not found");
      }

      // Get all tablet rounds for this flight
      const allTabletRounds = await ctx.db
        .query("tablet_rounds")
        .withIndex("by_flight_id", (q) => q.eq("flight_id", tabletRound.flight_id))
        .collect();

      // Check if ALL tablets have finished scoring
      const allTabletsFinished = allTabletRounds.every(tr => 
        tr._id === args.round_id ? true : tr.finished_scoring === true
      );

      // Only perform cleanup when ALL tablets have finished
      if (allTabletsFinished) {

        // 1. Update flight status to completed
        await ctx.db.patch(tabletRound.flight_id, {
          status: "completed",
          updated_at: now,
        });

        // 2. Get all flight players to find carts and update player status
        const flightPlayers = await ctx.db
          .query("flight_players")
          .withIndex("by_flight_id", (q) => q.eq("flight_id", tabletRound.flight_id))
          .collect();

        // 3. Update bag_drop_preplayer status to "completed" for all players
        for (const player of flightPlayers) {
          if (player.bag_drop_preplayer_id) {
            await ctx.db.patch(player.bag_drop_preplayer_id, {
              status: "completed",
              flight_id: tabletRound.flight_id,
              payment_status: player.payment_status || "unpaid",
              completed_at: now,
              updated_at: now,
            });
          }
        }

        // 4. Update all carts to available status
        const cartIds = new Set<string>();
        flightPlayers.forEach(player => {
          if (player.assigned_cart_id) {
            cartIds.add(player.assigned_cart_id);
          }
        });

        for (const cartId of cartIds) {
          await ctx.db.patch(cartId as any, {
            status: "available",
            current_flight_id: undefined,
            assigned_at: undefined,
            updated_at: now,
          });
        }

        // 5. Delete resource_assignments for tablets assigned to this flight
        const tabletAssignments = await ctx.db
          .query("resource_assignments")
          .withIndex("by_flight_id", (q) => q.eq("flight_id", tabletRound.flight_id))
          .filter((q) => q.eq(q.field("resource_type"), "tablet"))
          .collect();

        for (const assignment of tabletAssignments) {
          await ctx.db.delete(assignment._id);
        }

        // 6. Delete resource_assignments for caddies assigned to this flight
        const caddieAssignments = await ctx.db
          .query("resource_assignments")
          .withIndex("by_flight_id", (q) => q.eq("flight_id", tabletRound.flight_id))
          .filter((q) => q.eq(q.field("resource_type"), "caddie"))
          .collect();

        for (const assignment of caddieAssignments) {
          await ctx.db.delete(assignment._id);
        }

        return { 
          success: true, 
          allTabletsFinished: true,
          message: "All tablets finished. Flight completed."
        };
      } else {
        // Not all tablets finished yet
        const pendingTablets = allTabletRounds.filter(tr => 
          tr._id !== args.round_id && !tr.finished_scoring
        ).length;

        return { 
          success: true, 
          allTabletsFinished: false,
          pendingTablets,
          message: `Tablet finished. Waiting for ${pendingTablets} more tablet(s) to finish.`
        };
      }
    }

    return { success: true };
  },
});

// Get flight tablet status - Check which tablets have finished
export const getFlightTabletStatus = query({
  args: { flightId: v.id("flights") },
  handler: async (ctx, args) => {
    // Get all tablet rounds for this flight
    const tabletRounds = await ctx.db
      .query("tablet_rounds")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flightId))
      .collect();

    // Get device info for each tablet
    const tabletsWithInfo = await Promise.all(
      tabletRounds.map(async (tr) => {
        const device = tr.device_id ? await ctx.db.get(tr.device_id) : null;
        return {
          tablet_round_id: tr._id,
          device_id: tr.device_id,
          device_name: device?.full_name || device?.username || "Unknown Tablet",
          finished_scoring: tr.finished_scoring || false,
          finished_at: tr.finished_at,
        };
      })
    );

    // Get players assigned to each tablet
    const flightPlayers = await ctx.db
      .query("flight_players")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flightId))
      .collect();

    // Map players to their assigned tablets
    const playersByTablet = new Map<string, string[]>();
    flightPlayers.forEach(player => {
      if (player.assigned_tablet_id) {
        const tabletId = player.assigned_tablet_id;
        if (!playersByTablet.has(tabletId)) {
          playersByTablet.set(tabletId, []);
        }
        playersByTablet.get(tabletId)!.push(player._id);
      }
    });

    // Get finished tablet IDs
    const finishedTabletIds = tabletsWithInfo
      .filter(t => t.finished_scoring && t.device_id)
      .map(t => t.device_id!);

    // Get player IDs whose tablets have finished (these players should be disabled)
    const disabledPlayerIds: string[] = [];
    finishedTabletIds.forEach(tabletId => {
      const playerIds = playersByTablet.get(tabletId) || [];
      disabledPlayerIds.push(...playerIds);
    });

    const allFinished = tabletRounds.length > 0 && 
      tabletRounds.every(tr => tr.finished_scoring === true);

    return {
      tablets: tabletsWithInfo,
      totalTablets: tabletRounds.length,
      finishedTablets: tabletsWithInfo.filter(t => t.finished_scoring).length,
      allTabletsFinished: allFinished,
      finishedTabletIds,
      disabledPlayerIds, // Player IDs that should be disabled (their tablet finished)
    };
  },
});

// Update current hole for tablet_round and flight
// This tracks scoring progress and automatically advances to next hole when all players complete current hole
export const updateCurrentHole = mutation({
  args: {
    tablet_round_id: v.id("tablet_rounds"),
    flight_id: v.id("flights"),
    hole_number: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get flight to check start_hole
    const flight = await ctx.db.get(args.flight_id);
    if (!flight) {
      throw new Error("Flight not found");
    }

    const startHole = flight.start_hole || 1;

    // Calculate expected hole sequence based on start_hole
    // Example: if start_hole = 8, sequence is: 8,9,10,11,12,13,14,15,16,17,18,1,2,3,4,5,6,7
    const getHoleSequence = (start: number): number[] => {
      const sequence: number[] = [];
      for (let i = 0; i < 18; i++) {
        const hole = ((start - 1 + i) % 18) + 1;
        sequence.push(hole);
      }
      return sequence;
    };

    const holeSequence = getHoleSequence(startHole);
    const currentHoleIndex = holeSequence.indexOf(args.hole_number);

    // Update tablet_round current_hole
    await ctx.db.patch(args.tablet_round_id, {
      current_hole: args.hole_number,
      updated_at: now,
    });

    // Update flight current_hole (represents overall flight progress)
    await ctx.db.patch(args.flight_id, {
      current_hole: args.hole_number,
      updated_at: now,
    });

    return {
      success: true,
      current_hole: args.hole_number,
      hole_sequence: holeSequence,
      current_index: currentHoleIndex,
    };
  },
});

// Check if all players have completed a specific hole
// Used to determine if we should auto-advance to next hole
export const checkHoleCompletion = query({
  args: {
    flight_id: v.id("flights"),
    hole_number: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all players in flight
    const flightPlayers = await ctx.db
      .query("flight_players")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flight_id))
      .collect();

    if (flightPlayers.length === 0) {
      return { all_completed: false, completed_count: 0, total_players: 0 };
    }

    // Get all scores for this hole
    const holeScores = await ctx.db
      .query("tablet_scores")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flight_id))
      .filter((q) => q.eq(q.field("hole_number"), args.hole_number))
      .collect();

    // Check which players have scored
    const scoredPlayerIds = new Set(holeScores.map(s => s.flight_player_id));
    const completedCount = flightPlayers.filter(p => scoredPlayerIds.has(p._id)).length;

    return {
      all_completed: completedCount === flightPlayers.length,
      completed_count: completedCount,
      total_players: flightPlayers.length,
    };
  },
});


// Get completed tournament history for tablet
// Returns tournaments where this tablet participated and all flights are completed
export const getCompletedTournamentsForTablet = query({
  args: {
    tablet_id: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get completed tablet rounds for this device
    const completedRounds = await ctx.db
      .query("tablet_rounds")
      .withIndex("by_device_id", (q) => q.eq("device_id", args.tablet_id))
      .filter((q) => q.eq(q.field("finished_scoring"), true))
      .order("desc")
      .take(limit * 2); // Get more to account for filtering

    // Get unique flight IDs
    const flightIds = [...new Set(completedRounds.map(r => r.flight_id).filter(Boolean))];

    // Find tournaments for these flights
    const tournamentMap = new Map<string, {
      tournament: any;
      flights: any[];
      allPlayers: any[];
      allScores: any[];
      course: any;
      allFlightsCompleted: boolean;
      latestCompletedAt: number;
    }>();

    for (const flightId of flightIds) {
      if (!flightId) continue;

      // Check if this flight is part of a tournament
      const tournamentFlight = await ctx.db
        .query("tournament_flights")
        .withIndex("by_flight_id", (q) => q.eq("flight_id", flightId))
        .first();

      if (!tournamentFlight) continue;

      const tournament = await ctx.db.get(tournamentFlight.tournament_id);
      if (!tournament) continue;

      const tournamentId = tournament._id;

      if (!tournamentMap.has(tournamentId)) {
        // Get all flights in this tournament
        const allTournamentFlights = await ctx.db
          .query("tournament_flights")
          .withIndex("by_tournament_id", (q) => q.eq("tournament_id", tournamentId))
          .collect();

        const flights = [];
        const allPlayers: any[] = [];
        const allScores: any[] = [];
        let course = null;
        let allFlightsCompleted = true;
        let latestCompletedAt = 0;

        for (const tf of allTournamentFlights) {
          const flight = await ctx.db.get(tf.flight_id);
          if (!flight) continue;

          // Check if all tablets for this flight have finished
          const tabletRounds = await ctx.db
            .query("tablet_rounds")
            .withIndex("by_flight_id", (q) => q.eq("flight_id", tf.flight_id))
            .collect();

          const allTabletsFinished = tabletRounds.length > 0 &&
            tabletRounds.every(tr => tr.finished_scoring === true);

          // Track if any flight is not completed
          if (!allTabletsFinished) {
            allFlightsCompleted = false;
            continue; // Skip this flight but continue checking others
          }

          // Track latest completed_at time
          for (const tr of tabletRounds) {
            if (tr.completed_at && tr.completed_at > latestCompletedAt) {
              latestCompletedAt = tr.completed_at;
            }
            if (tr.finished_at && tr.finished_at > latestCompletedAt) {
              latestCompletedAt = tr.finished_at;
            }
          }

          flights.push({
            ...flight,
            flight_order: tf.flight_order,
          });

          // Get course info (use first flight's course)
          if (!course && flight.course_id) {
            course = await ctx.db.get(flight.course_id);
          }

          // Get players for this flight
          const flightPlayers = await ctx.db
            .query("flight_players")
            .withIndex("by_flight_id", (q) => q.eq("flight_id", tf.flight_id))
            .collect();

          allPlayers.push(...flightPlayers.map(p => ({
            ...p,
            flight_name: flight.flight_name,
          })));

          // Get scores for this flight
          const flightScores = await ctx.db
            .query("tablet_scores")
            .withIndex("by_flight_id", (q) => q.eq("flight_id", tf.flight_id))
            .collect();

          allScores.push(...flightScores);
        }

        // Only add if ALL flights in tournament are completed and we have flights
        if (allFlightsCompleted && flights.length > 0 && flights.length === allTournamentFlights.length) {
          tournamentMap.set(tournamentId, {
            tournament,
            flights,
            allPlayers,
            allScores,
            course,
            allFlightsCompleted,
            latestCompletedAt,
          });
        }
      }
    }

    // Transform to response format
    const tournaments = Array.from(tournamentMap.values()).map(data => {
      const { tournament, flights, allPlayers, allScores, course, latestCompletedAt } = data;

      // Calculate totals
      const total_strokes = allScores.reduce((sum, score) => sum + (score.strokes || 0), 0);
      const holes_completed = new Set(allScores.map(s => s.hole_number)).size;

      return {
        _id: tournament._id,
        tournament_name: tournament.tournament_name,
        tournament_date: tournament.tournament_date,
        description: tournament.description,
        game_mode: tournament.game_mode,
        scoring_system: tournament.scoring_system,
        course_type: tournament.course_type,
        course_name: course?.name || "Unknown Course",
        course_par: course?.par || 72,
        completed_at: latestCompletedAt || tournament.completed_at || tournament.updated_at,
        status: tournament.status,
        total_flights: flights.length,
        total_players: allPlayers.length,
        holes_completed,
        total_strokes,
        flights: flights.map(f => ({
          _id: f._id,
          flight_name: f.flight_name,
          flight_order: f.flight_order,
        })),
        players: allPlayers.map(p => ({
          _id: p._id,
          name: p.name || "Unknown",
          tee_box: p.tee_box || "white",
          flight_name: p.flight_name,
          handicap_index: p.handicap_index,
        })),
      };
    });

    // Sort by completed_at descending
    tournaments.sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0));

    return tournaments.slice(0, limit);
  },
});

// Get tournament rankings with all players and scores
export const getTournamentRankingsForHistory = query({
  args: {
    tournament_id: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournament_id);
    if (!tournament) return null;

    // Get all flights in tournament
    const tournamentFlights = await ctx.db
      .query("tournament_flights")
      .withIndex("by_tournament_id", (q) => q.eq("tournament_id", args.tournament_id))
      .collect();

    let course = null;
    let holesData: Array<{ hole_number: number; par: number; index: number }> = [];
    const allPlayers: any[] = [];

    for (const tf of tournamentFlights) {
      const flight = await ctx.db.get(tf.flight_id);
      if (!flight) continue;

      // Get course and holes data (use first flight's course)
      if (!course && flight.course_id) {
        course = await ctx.db.get(flight.course_id);
        
        const holes = await ctx.db
          .query("holes")
          .withIndex("by_course_id", (q) => q.eq("course_id", flight.course_id!))
          .collect();

        if (holes && holes.length > 0) {
          holesData = holes
            .filter(h => h.hole_number !== undefined)
            .sort((a, b) => a.hole_number! - b.hole_number!)
            .map(h => ({ 
              hole_number: h.hole_number!, 
              par: h.par || 4, 
              index: h.handicap_index || 0 
            }));
        }
      }

      // Get players for this flight
      const flightPlayers = await ctx.db
        .query("flight_players")
        .withIndex("by_flight_id", (q) => q.eq("flight_id", tf.flight_id))
        .collect();

      for (const player of flightPlayers) {
        // Get scores for this player
        const playerScores = await ctx.db
          .query("tablet_scores")
          .withIndex("by_flight_player_id", (q) => q.eq("flight_player_id", player._id))
          .collect();

        const scoresByHole: Record<number, number> = {};
        let totalStrokes = 0;
        let holesPlayed = 0;

        playerScores.forEach(score => {
          if (score.hole_number && score.strokes) {
            scoresByHole[score.hole_number] = score.strokes;
            totalStrokes += score.strokes;
            holesPlayed++;
          }
        });

        const coursePar = course?.par || 72;
        const parForHolesPlayed = holesPlayed > 0 ? (coursePar * holesPlayed) / 18 : 0;
        const toPar = totalStrokes - parForHolesPlayed;

        // Ensure 18 holes data
        if (holesData.length === 0) {
          holesData = Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            par: 4,
            index: 0
          }));
        }

        const holesWithScores = holesData.map(h => ({
          ...h,
          strokes: scoresByHole[h.hole_number]
        }));

        allPlayers.push({
          player_id: player._id,
          player_name: player.name || "Unknown",
          flight_name: flight.flight_name,
          caddie_name: player.assigned_caddie_name || "-",
          total_strokes: totalStrokes,
          holes_played: holesPlayed,
          to_par: toPar,
          position: 0,
          scores: scoresByHole,
          holes_data: holesWithScores,
        });
      }
    }

    // Sort by strokes
    allPlayers.sort((a, b) => {
      if (a.holes_played === 0 && b.holes_played > 0) return 1;
      if (b.holes_played === 0 && a.holes_played > 0) return -1;
      if (a.holes_played === 0 && b.holes_played === 0) return 0;
      return a.total_strokes - b.total_strokes;
    });

    // Assign positions
    let currentPosition = 1;
    allPlayers.forEach((player, index) => {
      const previousPlayer = index > 0 ? allPlayers[index - 1] : null;
      if (player.holes_played === 0) {
        player.position = 0;
      } else if (previousPlayer && previousPlayer.holes_played > 0 && 
                 previousPlayer.total_strokes === player.total_strokes) {
        player.position = currentPosition;
      } else {
        currentPosition = index + 1;
        player.position = currentPosition;
      }
    });

    return {
      tournament,
      course_name: course?.name || "Unknown Course",
      course_par: course?.par || 72,
      rankings: allPlayers,
      holes_data: holesData,
    };
  },
});
