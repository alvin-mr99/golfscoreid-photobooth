/**
 * Flights Mutation Update Example
 * 
 * This file shows how to update your flights.ts mutations
 * to include verification_code generation
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * STEP 1: Add helper function at the top of your flights.ts file
 */

// Generate a random 4-digit verification code
function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generate a unique 4-digit verification code
async function generateUniqueVerificationCode(ctx: any): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const code = generateVerificationCode();
    
    // Check if code already exists
    const existing = await ctx.db
      .query("flights")
      .withIndex("by_verification_code", (q) => q.eq("verification_code", code))
      .first();
    
    if (!existing) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error("Unable to generate unique verification code");
}

/**
 * STEP 2: Update the create mutation
 * 
 * BEFORE:
 */
export const createBefore = mutation({
  args: {
    course_id: v.optional(v.id("golf_courses")),
    flight_name: v.optional(v.string()),
    // ... other args
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("flights", {
      ...args,
      current_hole: args.start_hole || 1,
      created_at: now,
      updated_at: now,
    });
  },
});

/**
 * AFTER: Add verification code generation
 */
export const createAfter = mutation({
  args: {
    course_id: v.optional(v.id("golf_courses")),
    flight_name: v.optional(v.string()),
    // ... other args
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Generate unique verification code
    const verificationCode = await generateUniqueVerificationCode(ctx);
    
    return await ctx.db.insert("flights", {
      ...args,
      verification_code: verificationCode, // ADD THIS LINE
      current_hole: args.start_hole || 1,
      created_at: now,
      updated_at: now,
    });
  },
});

/**
 * STEP 3: Update the createReadyToPlayFlight mutation
 * 
 * BEFORE:
 */
export const createReadyToPlayFlightBefore = mutation({
  args: {
    flight_name: v.string(),
    course_id: v.id("golf_courses"),
    // ... other args
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const teeOffTimestamp = args.tee_off_time
      ? new Date(args.tee_off_time).getTime()
      : now;

    const flightId = await ctx.db.insert("flights", {
      flight_name: args.flight_name,
      course_id: args.course_id,
      status: "ready_to_play",
      // ... other fields
      created_at: now,
      updated_at: now,
    });
    
    // ... rest of the logic
    return { success: true, flightId };
  },
});

/**
 * AFTER: Add verification code generation
 */
export const createReadyToPlayFlightAfter = mutation({
  args: {
    flight_name: v.string(),
    course_id: v.id("golf_courses"),
    // ... other args
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const teeOffTimestamp = args.tee_off_time
      ? new Date(args.tee_off_time).getTime()
      : now;

    // Generate unique verification code
    const verificationCode = await generateUniqueVerificationCode(ctx);

    const flightId = await ctx.db.insert("flights", {
      flight_name: args.flight_name,
      course_id: args.course_id,
      status: "ready_to_play",
      verification_code: verificationCode, // ADD THIS LINE
      // ... other fields
      created_at: now,
      updated_at: now,
    });
    
    // ... rest of the logic
    return { 
      success: true, 
      flightId,
      verificationCode, // Optionally return the code
    };
  },
});

/**
 * STEP 4: (Optional) Add a query to get flight by verification code
 */
export const getByVerificationCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const flight = await ctx.db
      .query("flights")
      .withIndex("by_verification_code", (q) => q.eq("verification_code", args.code))
      .first();
    
    if (!flight) {
      return null;
    }
    
    // Get players for this flight
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
  },
});

/**
 * SUMMARY OF CHANGES:
 * 
 * 1. Add helper functions at the top of flights.ts:
 *    - generateVerificationCode()
 *    - generateUniqueVerificationCode(ctx)
 * 
 * 2. Update create mutation:
 *    - Call generateUniqueVerificationCode(ctx) before insert
 *    - Add verification_code to the insert object
 * 
 * 3. Update createReadyToPlayFlight mutation:
 *    - Call generateUniqueVerificationCode(ctx) before insert
 *    - Add verification_code to the insert object
 * 
 * 4. (Optional) Add getByVerificationCode query for direct lookup
 * 
 * 5. Update any other mutations that create flights
 */
