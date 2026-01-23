/**
 * Schema Update Example: Add verification_code to flights table
 * 
 * Add this to your convex/schema.ts file in the flights table definition
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Example of updated flights table with verification_code field
const exampleFlightsTable = defineTable({
  // Existing fields
  bag_drop_completed: v.optional(v.boolean()),
  bag_drop_completed_at: v.optional(v.number()),
  caddie_master_completed: v.optional(v.boolean()),
  caddie_master_completed_at: v.optional(v.number()),
  cart_summary: v.optional(v.string()),
  course_id: v.optional(v.id("golf_courses")),
  course_type: v.optional(v.string()),
  created_at: v.optional(v.number()),
  created_by: v.optional(v.id("users")),
  current_hole: v.optional(v.number()),
  flight_name: v.optional(v.string()),
  game_mode: v.optional(v.string()),
  payment_status: v.optional(v.string()),
  registration_completed: v.optional(v.boolean()),
  registration_completed_at: v.optional(v.number()),
  scoring_system: v.optional(v.string()),
  start_hole: v.optional(v.number()),
  starter_completed: v.optional(v.boolean()),
  starter_completed_at: v.optional(v.number()),
  status: v.optional(v.string()),
  tee_off_time: v.optional(v.number()),
  total_caddies: v.optional(v.number()),
  total_carts: v.optional(v.number()),
  total_players: v.optional(v.number()),
  total_price: v.optional(v.number()),
  updated_at: v.optional(v.number()),
  is_booking: v.optional(v.boolean()),
  booking_date: v.optional(v.number()),
  dp_amount: v.optional(v.number()),
  
  // NEW FIELD: Add this line to your schema
  verification_code: v.optional(v.string()), // 4-digit verification code for easy flight lookup
})
  // Existing indexes
  .index("by_course_id", ["course_id"])
  .index("by_course_status", ["course_id", "status"])
  .index("by_created_by", ["created_by"])
  .index("by_status", ["status"])
  .index("by_tee_off_status", ["tee_off_time", "status"])
  .index("by_tee_off_time", ["tee_off_time"])
  
  // NEW INDEX: Add this line to your schema for fast verification code lookup
  .index("by_verification_code", ["verification_code"]);

/**
 * INSTRUCTIONS:
 * 
 * 1. Open your convex/schema.ts file
 * 
 * 2. Find the flights table definition (search for "flights: defineTable")
 * 
 * 3. Add the verification_code field:
 *    verification_code: v.optional(v.string()),
 * 
 * 4. Add the index for verification_code:
 *    .index("by_verification_code", ["verification_code"])
 * 
 * 5. Deploy the schema changes:
 *    npx convex deploy
 * 
 * 6. Run the migration to add codes to existing flights:
 *    - Go to Convex Dashboard
 *    - Navigate to Functions
 *    - Find and run: verification_code_migration:addVerificationCodesToExistingFlights
 * 
 * 7. Update your create flight mutations to generate verification codes:
 *    - Import the helper function from verification_code_migration.ts
 *    - Call generateUniqueVerificationCode(ctx) when creating new flights
 *    - Assign the result to verification_code field
 */

export default exampleFlightsTable;
