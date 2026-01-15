import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List all flights (alias for getAll)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("flights").collect();
  },
});

// Get flights by status with players
export const getByStatusWithPlayers = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const flights = await ctx.db
      .query("flights")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    // Fetch players for each flight
    const flightsWithPlayers = await Promise.all(
      flights.map(async (flight) => {
        const players = await ctx.db
          .query("flight_players")
          .withIndex("by_flight_id", (q) => q.eq("flight_id", flight._id))
          .collect();

        return {
          ...flight,
          players: players.map((p) => ({
            _id: p._id,
            name: p.name,
            bag_tag_number: p.bag_tag_number,
            phone_number: p.phone_number,
            rv_id: p.rv_id,
            payment_status: p.payment_status || "unpaid",
          })),
        };
      })
    );

    return flightsWithPlayers;
  },
});

// Get all flights
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("flights").collect();
  },
});

// Get all flights with players data for search functionality
export const getAllWithPlayers = query({
  handler: async (ctx) => {
    const flights = await ctx.db.query("flights").collect();

    // Fetch players for each flight
    const flightsWithPlayers = await Promise.all(
      flights.map(async (flight) => {
        const players = await ctx.db
          .query("flight_players")
          .withIndex("by_flight_id", (q) => q.eq("flight_id", flight._id))
          .collect();

        // Get rv_id from bag_drop_preplayer if not in flight_players
        const playersWithRvId = await Promise.all(
          players.map(async (p) => {
            let rvId = p.rv_id;

            // If rv_id is not in flight_players, try to get it from bag_drop_preplayer
            if (!rvId && p.bag_drop_preplayer_id) {
              const preplayer = await ctx.db.get(p.bag_drop_preplayer_id);
              rvId = preplayer?.rv_id;
            }

            return {
              name: p.name,
              bag_tag_number: p.bag_tag_number,
              phone_number: p.phone_number,
              rv_id: rvId,
              payment_status: p.payment_status || "unpaid",
            };
          }),
        );

        return {
          ...flight,
          players: playersWithRvId,
        };
      }),
    );

    return flightsWithPlayers;
  },
});

// Get flight by ID
export const getById = query({
  args: { id: v.id("flights") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get flights by status
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flights")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Get flights by course
export const getByCourse = query({
  args: { courseId: v.id("golf_courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flights")
      .withIndex("by_course_id", (q) => q.eq("course_id", args.courseId))
      .collect();
  },
});

// Get flights by date range
export const getByDateRange = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flights")
      .withIndex("by_tee_off_time")
      .filter((q) =>
        q.and(
          q.gte(q.field("tee_off_time"), args.startTime),
          q.lte(q.field("tee_off_time"), args.endTime),
        ),
      )
      .collect();
  },
});

// Get flight players
export const getFlightPlayers = query({
  args: { flight_id: v.id("flights") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flight_players")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flight_id))
      .collect();
  },
});
// Create flight
export const create = mutation({
  args: {
    course_id: v.optional(v.id("golf_courses")),
    flight_name: v.optional(v.string()),
    tee_off_time: v.optional(v.number()),
    start_hole: v.optional(v.number()),
    course_type: v.optional(v.string()),
    game_mode: v.optional(v.string()),
    scoring_system: v.optional(v.string()),
    status: v.optional(v.string()),
    created_by: v.optional(v.id("users")),
    bag_drop_completed: v.optional(v.boolean()),
    bag_drop_completed_at: v.optional(v.number()),
    registration_completed: v.optional(v.boolean()),
    registration_completed_at: v.optional(v.number()),
    // Booking flight fields
    is_booking: v.optional(v.boolean()),
    booking_date: v.optional(v.number()),
    dp_amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("flights", {
      ...args,
      current_hole: args.start_hole || 1,
      bag_drop_completed: args.bag_drop_completed ?? false,
      registration_completed: args.registration_completed ?? false,
      caddie_master_completed: false,
      starter_completed: false,
      total_players: 0,
      total_caddies: 0,
      total_carts: 0,
      payment_status: "unpaid",
      created_at: now,
      updated_at: now,
    });
  },
});

// Update flight
export const update = mutation({
  args: {
    id: v.id("flights"),
    flight_name: v.optional(v.string()),
    tee_off_time: v.optional(v.number()),
    status: v.optional(v.string()),
    current_hole: v.optional(v.number()),
    bag_drop_completed: v.optional(v.boolean()),
    bag_drop_completed_at: v.optional(v.number()),
    registration_completed: v.optional(v.boolean()),
    registration_completed_at: v.optional(v.number()),
    caddie_master_completed: v.optional(v.boolean()),
    caddie_master_completed_at: v.optional(v.number()),
    starter_completed: v.optional(v.boolean()),
    starter_completed_at: v.optional(v.number()),
    total_players: v.optional(v.number()),
    total_caddies: v.optional(v.number()),
    total_carts: v.optional(v.number()),
    cart_summary: v.optional(v.string()),
    total_price: v.optional(v.number()),
    payment_status: v.optional(v.string()),
    // Booking flight fields
    is_booking: v.optional(v.boolean()),
    booking_date: v.optional(v.number()),
    dp_amount: v.optional(v.number()),
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

// Delete flight
export const remove = mutation({
  args: { id: v.id("flights") },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Get all flight_players in this flight
    const flightPlayers = await ctx.db
      .query("flight_players")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.id))
      .collect();

    // 2. Update flight_players: set flight_id to undefined (don't delete)
    // AND update status of bag_drop_preplayer back to "verified"
    // AND reset caddie verification in bag_checking
    for (const player of flightPlayers) {
      // Update flight_player: remove flight_id but keep the record
      await ctx.db.patch(player._id, {
        flight_id: undefined,
        updated_at: now,
      });

      if (player.bag_drop_preplayer_id) {
        await ctx.db.patch(player.bag_drop_preplayer_id, {
          status: "verified",
          updated_at: now,
        });

        // Reset caddie verification for this player's bag_checking data
        // Get the preplayer to access bag_tag_number
        const preplayer = await ctx.db.get(player.bag_drop_preplayer_id);
        if (preplayer?.bag_tag_number) {
          // Get all bag_checking items for this bag tag
          const bagCheckingItems = await ctx.db
            .query("bag_checking")
            .withIndex("by_bag_tag_number", (q) =>
              q.eq("bag_tag_number", preplayer.bag_tag_number),
            )
            .collect();

          // Reset each item - clear quantity_caddie but keep quantity_bagdrop
          for (const item of bagCheckingItems) {
            await ctx.db.patch(item._id, {
              quantity_caddie: undefined,
              caddie_master_verified: false,
              caddie_master_verified_at: undefined,
              updated_at: now,
            });
          }
        }
      }
    }

    // 3. Get and delete all resource_assignments for this flight
    const resourceAssignments = await ctx.db
      .query("resource_assignments")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.id))
      .collect();

    for (const assignment of resourceAssignments) {
      await ctx.db.delete(assignment._id);
    }
    // 4. Reset carts that are assigned to this flight
    const flightCarts = await ctx.db
      .query("carts")
      .withIndex("by_current_flight_id", (q) =>
        q.eq("current_flight_id", args.id),
      )
      .collect();

    for (const cart of flightCarts) {
      await ctx.db.patch(cart._id, {
        current_flight_id: undefined,
        status: "available",
        updated_at: now,
      });
    }

    // 5. Delete tournament_flights entries if this flight is assigned to a tournament
    const tournamentFlights = await ctx.db
      .query("tournament_flights")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.id))
      .collect();

    for (const tournamentFlight of tournamentFlights) {
      await ctx.db.delete(tournamentFlight._id);
    }

    // 6. Delete the flight itself
    await ctx.db.delete(args.id);
  },
});

// Get flight data for tablet start round screen
export const getFlightForTabletStart = query({
  args: { flight_id: v.id("flights") },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.flight_id);
    if (!flight) {
      throw new Error("Flight not found");
    }

    // Get course info
    const course = flight.course_id ? await ctx.db.get(flight.course_id) : null;

    // Get all players in this flight
    const flightPlayers = await ctx.db
      .query("flight_players")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flight_id))
      .order("asc")
      .collect();

    // Get tablet_round if exists
    const tabletRound = await ctx.db
      .query("tablet_rounds")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flight_id))
      .first();

    // Get all carts assigned to this flight
    const flightCarts = await ctx.db
      .query("carts")
      .withIndex("by_current_flight_id", (q) =>
        q.eq("current_flight_id", args.flight_id),
      )
      .collect();

    // Create a map of cart_id to cart for quick lookup
    const cartMap = new Map(flightCarts.map((cart) => [cart._id, cart]));

    // Format players as list_golfer for compatibility
    const list_golfer = flightPlayers.map((player) => {
      // Get cart info from carts table if assigned
      let cartName = player.assigned_cart_name || "";
      if (player.assigned_cart_id) {
        const cart = cartMap.get(player.assigned_cart_id);
        if (cart) {
          cartName = cart.cart_name || cart.cart_id || "";
        }
      }

      return {
        name: player.name,
        caddie_id: player.assigned_caddie_id,
        caddie_name: player.assigned_caddie_name,
        cart_id: player.assigned_cart_id,
        cart_name: cartName,
        tablet_assign: player.assigned_tablet_id,
        phone_number: player.phone_number,
        handicap_index: player.handicap_index || 0,
        tee_box: player.tee_box,
        gender: player.gender,
        player_id: player._id,
      };
    });

    return {
      round: {
        _id: flight._id,
        flight_name: flight.flight_name,
        round_name: flight.flight_name,
        status: flight.status,
        course_type: flight.course_type,
        game_mode: flight.game_mode,
        scoring_system: flight.scoring_system,
        start_hole: flight.start_hole,
        tee_off_time: flight.tee_off_time,
        tablet_round_id: tabletRound?._id,
        list_golfer,
      },
      course: course
        ? {
            _id: course._id,
            name: course.name,
            total_holes: course.total_holes,
            par: course.par,
          }
        : null,
    };
  },
});

// Update player tee boxes before starting round
export const updatePlayerTeeBoxes = mutation({
  args: {
    flight_id: v.id("flights"),
    players: v.array(
      v.object({
        player_id: v.id("flight_players"),
        tee_box: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Update each player's tee box
    for (const player of args.players) {
      await ctx.db.patch(player.player_id, {
        tee_box: player.tee_box,
        updated_at: now,
      });
    }

    return { success: true, updated_count: args.players.length };
  },
});

// Start flight from tablet (create tablet_rounds and update status)
export const startFlight = mutation({
  args: {
    flight_id: v.id("flights"),
    user_id: v.id("users"),
    device_id: v.id("users"),
    device_info: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const flight = await ctx.db.get(args.flight_id);
    if (!flight) {
      throw new Error("Flight not found");
    }

    // Check if tablet_round already exists
    const existingRound = await ctx.db
      .query("tablet_rounds")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flight_id))
      .first();

    let tabletRoundId: string;

    if (existingRound) {
      tabletRoundId = existingRound._id;
    } else {
      // Create new tablet_round
      tabletRoundId = await ctx.db.insert("tablet_rounds", {
        flight_id: args.flight_id,
        device_id: args.device_id,
        device_info: args.device_info,
        current_hole: flight.start_hole || 1,
        holes_completed: 0,
        is_primary_device: true,
        finished_scoring: false,
        created_at: now,
        updated_at: now,
      });
    }

    // Update flight status to ready_to_play if not already
    if (flight.status !== "ready_to_play" && flight.status !== "in_progress") {
      await ctx.db.patch(args.flight_id, {
        status: "ready_to_play",
        updated_at: now,
      });
    }

    return {
      success: true,
      tablet_round_id: tabletRoundId,
      flight_id: args.flight_id,
    };
  },
});

// Begin round (change status from ready_to_play to in_progress)
export const beginRound = mutation({
  args: {
    flight_id: v.id("flights"),
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const flight = await ctx.db.get(args.flight_id);
    if (!flight) {
      throw new Error("Flight not found");
    }

    // Update flight status to in_progress
    await ctx.db.patch(args.flight_id, {
      status: "in_progress",
      updated_at: now,
    });

    return { success: true, flight_id: args.flight_id };
  },
});

// Complete flight - Update status to completed and update players
export const completeFlight = mutation({
  args: { flight_id: v.id("flights") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const flight = await ctx.db.get(args.flight_id);
    if (!flight) {
      throw new Error("Flight not found");
    }

    // 1. Update flight status to completed
    await ctx.db.patch(args.flight_id, {
      status: "completed",
      updated_at: now,
    });

    // 2. Get all flight_players in this flight
    const flightPlayers = await ctx.db
      .query("flight_players")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flight_id))
      .collect();

    // 3. Update status of bag_drop_preplayer to "completed"
    for (const player of flightPlayers) {
      if (player.bag_drop_preplayer_id) {
        await ctx.db.patch(player.bag_drop_preplayer_id, {
          status: "completed",
          flight_id: args.flight_id,
          payment_status: player.payment_status || "unpaid",
          completed_at: now,
          updated_at: now,
        });
      }
    }

    return { success: true, flight_id: args.flight_id };
  },
});

// Get flight by ID (simple query)
export const getFlightById = query({
  args: { flight_id: v.id("flights") },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.flight_id);
    if (!flight) {
      return null;
    }

    // Get tablet_round if exists
    const tabletRound = await ctx.db
      .query("tablet_rounds")
      .withIndex("by_flight_id", (q) => q.eq("flight_id", args.flight_id))
      .first();

    return {
      ...flight,
      tablet_round_id: tabletRound?._id,
    };
  },
});

/**
 * Create flight with ready_to_play status - for paid players with assignments
 *
 * This mutation is used when creating flights from the registration module where:
 * - Players have already been verified and paid
 * - flight_players records already exist (created during payment)
 * - Tablets and carts have been assigned
 *
 * The flow:
 * 1. Creates flight with status="ready_to_play" and all completion flags set to true
 * 2. Updates existing flight_players records (by user_id) with flight_id and assignments
 * 3. Creates tablet_rounds for each unique tablet
 * 4. Creates resource_assignments for tablets
 * 5. Updates cart status to "in_use"
 * 6. Assigns flight to tournament if tournament_id provided
 * 7. Updates bag_drop_preplayer status to "in_flight"
 *
 * @param flight_name - Name/code of the flight
 * @param course_id - Golf course ID
 * @param game_mode - Game mode (e.g., "STROKE_PLAY_HDCP")
 * @param scoring_system - Scoring system (e.g., "STROKE")
 * @param course_type - Course type ("FULL" for 18 holes, "HALF" for 9 holes)
 * @param start_hole - Starting hole number (1-18)
 * @param tee_off_time - Tee off time as ISO string
 * @param player_assignments - Array of player assignments with tablet and cart IDs
 */
export const createReadyToPlayFlight = mutation({
  args: {
    flight_name: v.string(),
    course_id: v.id("golf_courses"),
    game_mode: v.string(),
    scoring_system: v.string(),
    course_type: v.string(),
    start_hole: v.number(),
    tee_off_time: v.optional(v.string()),
    created_by: v.optional(v.id("users")),
    tournament_id: v.optional(v.id("tournaments")),
    is_booking: v.optional(v.boolean()),
    booking_date: v.optional(v.number()),
    dp_amount: v.optional(v.number()),
    player_assignments: v.array(
      v.object({
        preplayer_id: v.id("bag_drop_preplayer"),
        user_id: v.id("users"),
        tablet_id: v.id("users"),
        cart_id: v.optional(v.id("carts")), // Optional for walking players
        cart_type: v.optional(v.string()), // "sharing" or "single", optional for walking
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const teeOffTimestamp = args.tee_off_time
      ? new Date(args.tee_off_time).getTime()
      : now;

    // 1. Create the flight with ready_to_play status
    const flightId = await ctx.db.insert("flights", {
      flight_name: args.flight_name,
      course_id: args.course_id,
      status: "ready_to_play",
      game_mode: args.game_mode,
      scoring_system: args.scoring_system,
      course_type: args.course_type,
      start_hole: args.start_hole,
      current_hole: args.start_hole,
      tee_off_time: teeOffTimestamp,
      created_by: args.created_by,
      bag_drop_completed: true,
      bag_drop_completed_at: now,
      registration_completed: true,
      registration_completed_at: now,
      caddie_master_completed: true,
      caddie_master_completed_at: now,
      starter_completed: true,
      starter_completed_at: now,
      payment_status: "paid",
      total_players: args.player_assignments.length,
      total_caddies: 0,
      total_carts: 0,
      is_booking: args.is_booking || false,
      booking_date: args.booking_date,
      dp_amount: args.dp_amount,
      created_at: now,
      updated_at: now,
    });

    // 2. Update flight_players records that already exist (by user_id)
    const uniqueTablets = new Set<string>();
    const cartAssignments = new Map<string, { type: string; count: number }>();

    let playerOrder = 1; // Initialize player order counter
    for (const assignment of args.player_assignments) {
      // Find existing flight_player by bag_drop_preplayer_id where flight_id is null or undefined
      const existingFlightPlayer = await ctx.db
        .query("flight_players")
        .withIndex("by_bag_drop_preplayer_id", (q) =>
          q.eq("bag_drop_preplayer_id", assignment.preplayer_id),
        )
        .filter((q) => q.eq(q.field("flight_id"), undefined))
        .first();

      let flightPlayerId: any;

      if (!existingFlightPlayer) {
        // Create new flight_player record if doesn't exist
        const prePlayer = await ctx.db.get(assignment.preplayer_id);
        const user = await ctx.db.get(assignment.user_id);

        if (!prePlayer) {
          throw new Error(
            `Pre-player record not found for preplayer_id: ${assignment.preplayer_id}`,
          );
        }

        if (!user) {
          throw new Error(
            `User record not found for user_id: ${assignment.user_id}`,
          );
        }

        // Create new flight_player
        flightPlayerId = await ctx.db.insert("flight_players", {
          flight_id: flightId,
          bag_drop_preplayer_id: assignment.preplayer_id,
          user_id: assignment.user_id,
          name:
            user.full_name ||
            user.username ||
            prePlayer.player_name ||
            "Unknown",
          member_type: prePlayer.member_type,
          player_order: playerOrder++,
          assigned_tablet_id: assignment.tablet_id,
          assigned_cart_id: assignment.cart_id || undefined,
          cart_type: assignment.cart_type || undefined,
          payment_status: "paid", // Set as paid for direct flight creation
          created_at: now,
          updated_at: now,
        });
      } else {
        // Update the existing flight_player record
        flightPlayerId = existingFlightPlayer._id;
        await ctx.db.patch(flightPlayerId, {
          flight_id: flightId,
          player_order: playerOrder++, // Set player order incrementally
          assigned_tablet_id: assignment.tablet_id,
          assigned_cart_id: assignment.cart_id || undefined,
          cart_type: assignment.cart_type || undefined,
          payment_status: "paid", // Set as paid when assigning to flight
          updated_at: now,
        });
      }

      // Track unique tablets
      uniqueTablets.add(assignment.tablet_id);

      // Track cart assignments (only if cart_id exists - not for walking players)
      if (assignment.cart_id && assignment.cart_type) {
        const cartId = assignment.cart_id;
        if (!cartAssignments.has(cartId)) {
          cartAssignments.set(cartId, {
            type: assignment.cart_type,
            count: 0,
          });
        }
        const cartInfo = cartAssignments.get(cartId)!;
        cartInfo.count++;
      }
    }

    // 3. Create tablet_rounds for each unique tablet
    for (const tabletId of uniqueTablets) {
      await ctx.db.insert("tablet_rounds", {
        flight_id: flightId,
        device_id: tabletId as any,
        current_hole: args.start_hole,
        holes_completed: 0,
        is_primary_device: true,
        finished_scoring: false,
        created_at: now,
        updated_at: now,
      });
    }

    // 4. Create resource_assignments for tablets
    for (const tabletId of uniqueTablets) {
      const tablet = await ctx.db.get(tabletId as any);

      let tabletName = "Unknown Tablet";
      if (
        tablet &&
        "_tableName" in tablet &&
        "username" in tablet &&
        "full_name" in tablet
      ) {
        tabletName =
          (tablet as any).username ||
          (tablet as any).full_name ||
          "Unknown Tablet";
      }

      await ctx.db.insert("resource_assignments", {
        resource_type: "tablet",
        resource_id: tabletId,
        resource_name: tabletName,
        flight_id: flightId,
        assigned_at: now,
        status: "active",
        created_at: now,
        updated_at: now,
      });
    }

    // 5. Update cart status
    for (const [cartId] of cartAssignments) {
      await ctx.db.patch(cartId as any, {
        status: "in_use",
        current_flight_id: flightId,
        assigned_at: now,
        updated_at: now,
      });
    }

    // 6. Update flight with cart totals
    const totalCarts = cartAssignments.size;
    const cartSummaryParts: string[] = [];

    for (const [, info] of cartAssignments) {
      if (info.type === "sharing") {
        cartSummaryParts.push("Sharing");
      } else if (info.type === "single") {
        cartSummaryParts.push("Single");
      }
    }

    const cartSummary =
      cartSummaryParts.length > 0 ? cartSummaryParts.join(", ") : "0";

    await ctx.db.patch(flightId, {
      total_carts: totalCarts,
      cart_summary: cartSummary,
      updated_at: now,
    });

    // 7. Assign to tournament if provided
    if (args.tournament_id) {
      // Find the highest flight_order for this tournament
      const existingFlights = await ctx.db
        .query("tournament_flights")
        .withIndex("by_tournament_id", (q) =>
          q.eq("tournament_id", args.tournament_id!),
        )
        .collect();

      const maxOrder = existingFlights.reduce(
        (max, tf) => Math.max(max, tf.flight_order || 0),
        0,
      );

      await ctx.db.insert("tournament_flights", {
        tournament_id: args.tournament_id,
        flight_id: flightId,
        flight_order: maxOrder + 1,
        created_at: now,
      });
    }

    // 8. Update bag_drop_preplayer status to in_flight
    for (const assignment of args.player_assignments) {
      await ctx.db.patch(assignment.preplayer_id, {
        status: "in_flight",
        flight_id: flightId,
        updated_at: now,
      });
    }

    return {
      success: true,
      flightId: flightId,
      tabletsAssigned: uniqueTablets.size,
      cartsAssigned: cartAssignments.size,
      playersAssigned: args.player_assignments.length,
    };
  },
});
