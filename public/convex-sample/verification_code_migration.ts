/**
 * Migration Script: Add Verification Code to Flights
 * 
 * This script adds verification_code field to existing flights
 * and provides helper functions for generating unique codes.
 * 
 * Usage:
 * 1. Add this file to your convex/ directory
 * 2. Deploy to Convex: npx convex deploy
 * 3. Run migration once: Call addVerificationCodesToExistingFlights from Convex dashboard
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate a random 4-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a unique 4-digit verification code
 * Checks database to ensure no duplicates
 */
async function generateUniqueVerificationCode(ctx: any): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loop
  
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
  
  // If we can't find a unique code after 100 attempts, throw error
  throw new Error("Unable to generate unique verification code after 100 attempts");
}

/**
 * Migration: Add verification codes to all existing flights
 * Run this once after deploying the schema changes
 */
export const addVerificationCodesToExistingFlights = mutation({
  handler: async (ctx) => {
    const flights = await ctx.db.query("flights").collect();
    let updated = 0;
    let skipped = 0;
    
    for (const flight of flights) {
      // Only update flights that don't have a verification code
      if (!flight.verification_code) {
        try {
          const code = await generateUniqueVerificationCode(ctx);
          await ctx.db.patch(flight._id, {
            verification_code: code,
            updated_at: Date.now(),
          });
          updated++;
        } catch (error) {
          console.error(`Failed to update flight ${flight._id}:`, error);
        }
      } else {
        skipped++;
      }
    }
    
    return {
      success: true,
      total: flights.length,
      updated,
      skipped,
      message: `Migration completed: ${updated} flights updated, ${skipped} flights skipped (already have codes)`,
    };
  },
});

/**
 * Query: Get flight by verification code
 * Useful for quick lookup
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
 * Mutation: Regenerate verification code for a specific flight
 * Useful if there's a duplicate or need to change code
 */
export const regenerateVerificationCode = mutation({
  args: { flight_id: v.id("flights") },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.flight_id);
    
    if (!flight) {
      throw new Error("Flight not found");
    }
    
    const newCode = await generateUniqueVerificationCode(ctx);
    
    await ctx.db.patch(args.flight_id, {
      verification_code: newCode,
      updated_at: Date.now(),
    });
    
    return {
      success: true,
      flight_id: args.flight_id,
      old_code: flight.verification_code,
      new_code: newCode,
    };
  },
});

/**
 * Query: Check if verification code is available
 * Useful for manual code assignment
 */
export const isVerificationCodeAvailable = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    // Validate code format (must be 4 digits)
    if (!/^\d{4}$/.test(args.code)) {
      return {
        available: false,
        reason: "Code must be exactly 4 digits",
      };
    }
    
    const existing = await ctx.db
      .query("flights")
      .withIndex("by_verification_code", (q) => q.eq("verification_code", args.code))
      .first();
    
    return {
      available: !existing,
      reason: existing ? "Code already in use" : "Code is available",
    };
  },
});

/**
 * Mutation: Set custom verification code for a flight
 * Useful for manual code assignment
 */
export const setVerificationCode = mutation({
  args: {
    flight_id: v.id("flights"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate code format
    if (!/^\d{4}$/.test(args.code)) {
      throw new Error("Verification code must be exactly 4 digits");
    }
    
    // Check if code is already in use by another flight
    const existing = await ctx.db
      .query("flights")
      .withIndex("by_verification_code", (q) => q.eq("verification_code", args.code))
      .first();
    
    if (existing && existing._id !== args.flight_id) {
      throw new Error(`Verification code ${args.code} is already in use by another flight`);
    }
    
    // Update the flight
    await ctx.db.patch(args.flight_id, {
      verification_code: args.code,
      updated_at: Date.now(),
    });
    
    return {
      success: true,
      flight_id: args.flight_id,
      verification_code: args.code,
    };
  },
});

/**
 * Export helper function for use in other mutations
 * Add this to your flights.ts file
 */
export { generateUniqueVerificationCode };
