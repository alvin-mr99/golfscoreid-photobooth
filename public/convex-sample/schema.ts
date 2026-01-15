import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Member Types table - defines available membership types
  member_types: defineTable({
    code: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    is_active: v.boolean(),
    price: v.optional(v.number()),
    discount_percentage: v.optional(v.number()),
    expiry_date_months: v.optional(v.number()),
  }).index("by_code", ["code"]),

  // User Memberships table - one user can have multiple memberships
  user_memberships: defineTable({
    user_id: v.id("users"),
    member_type_code: v.string(),
    member_number: v.string(),
    start_date: v.number(),
    expiry_date: v.number(),
    is_active: v.boolean(),
    notes: v.optional(v.string()),
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_member_number", ["member_number"])
    .index("by_user_and_type", ["user_id", "member_type_code"])
    .index("by_expiry", ["expiry_date"]),

  // Users table
  users: defineTable({
    avatar_url: v.optional(v.string()),
    created_at: v.optional(v.number()),
    email: v.optional(v.string()),
    full_name: v.optional(v.string()),
    gender: v.optional(v.string()),
    last_login: v.optional(v.number()),
    member_type: v.optional(v.string()),
    password_hash: v.optional(v.string()),
    phone: v.optional(v.string()),
    profile_photo: v.optional(v.id("_storage")),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
    sub_member_type: v.optional(v.string()),
    updated_at: v.optional(v.number()),
    username: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .index("by_username", ["username"])
    .searchIndex("search_full_name", {
      searchField: "full_name",
    }),

  advertisements: defineTable({
    advertiser_contact: v.optional(v.string()),
    advertiser_name: v.optional(v.string()),
    clicks_count: v.optional(v.number()),
    created_at: v.optional(v.number()),
    duration_seconds: v.optional(v.number()),
    end_date: v.optional(v.number()),
    impressions_count: v.optional(v.number()),
    media_storage_id: v.optional(v.id("_storage")),
    media_type: v.optional(v.string()),
    priority: v.optional(v.number()),
    start_date: v.optional(v.number()),
    status: v.optional(v.string()),
    target_screens: v.optional(v.any()),
    title: v.optional(v.string()),
    updated_at: v.optional(v.number()),
    youtube_url: v.optional(v.string()),
  })
    .index("by_date_range", ["start_date", "end_date"])
    .index("by_media_type", ["media_type"])
    .index("by_priority", ["priority"])
    .index("by_status", ["status"]),

  bag_checking: defineTable({
    bag_tag_number: v.optional(v.string()),
    bagdrop_verified: v.optional(v.boolean()),
    bagdrop_verified_at: v.optional(v.number()),
    caddie_master_verified: v.optional(v.boolean()),
    caddie_master_verified_at: v.optional(v.number()),
    check_in_time: v.optional(v.number()),
    created_at: v.optional(v.number()),
    has_mismatch: v.optional(v.boolean()),
    item_name: v.optional(v.string()),
    notes: v.optional(v.string()),
    player_name: v.optional(v.string()),
    quantity_bagdrop: v.optional(v.number()),
    quantity_caddie: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    user_id: v.optional(v.id("users")),
    // Golf equipment clubset data
    sticks_count: v.optional(v.number()),
    covers_count: v.optional(v.number()),
    club_numbers: v.optional(v.array(v.string())),
    club_number_covers: v.optional(v.array(v.string())),
    // Created by bagdropper info
    created_by: v.optional(v.id("users")),
    created_by_name: v.optional(v.string()),
  })
    .index("by_bag_tag_item", ["bag_tag_number", "item_name"])
    .index("by_bag_tag_number", ["bag_tag_number"])
    .index("by_check_in_time", ["check_in_time"])
    .index("by_user_id", ["user_id"])
    .searchIndex("search_player_name", {
      searchField: "player_name",
    }),

  bag_drop_preplayer: defineTable({
    bag_returned: v.optional(v.boolean()),
    bag_returned_at: v.optional(v.number()),
    bag_tag_number: v.optional(v.string()),
    cart_type: v.optional(v.string()),
    caddiemaster_cek: v.optional(v.boolean()),
    completed_at: v.optional(v.number()),
    created_at: v.optional(v.number()),
    drop_off_time: v.optional(v.number()),
    flight_id: v.optional(v.id("flights")),
    gender: v.optional(v.string()),
    member_type: v.optional(v.string()),
    notes: v.optional(v.string()),
    number_of_followers: v.optional(v.number()),
    payment_responsible_person: v.optional(v.string()),
    payment_status: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    player_name: v.optional(v.string()),
    requested_caddie_ids: v.optional(v.array(v.id("caddies"))),
    requested_caddie_names: v.optional(v.array(v.string())),
    rv_id: v.optional(v.string()),
    status: v.optional(v.string()),
    updated_at: v.optional(v.number()),
    user_id: v.optional(v.id("users")),
  })
    .index("by_bag_tag_number", ["bag_tag_number"])
    .index("by_rv_id", ["rv_id"])
    .index("by_status", ["status"])
    .index("by_user_id", ["user_id"])
    .searchIndex("search_player_name", {
      searchField: "player_name",
    }),

  caddie_ratings: defineTable({
    caddie_id: v.string(),
    caddie_name: v.string(),
    created_at: v.number(),
    evaluation: v.optional(v.string()),
    flight_id: v.id("flights"),
    rated_by_user_id: v.id("users"),
    rated_by_username: v.string(),
    rating: v.number(),
    tablet_round_id: v.optional(v.id("tablet_rounds")),
    updated_at: v.optional(v.number()),
  })
    .index("by_caddie_and_flight", ["caddie_id", "flight_id"])
    .index("by_caddie_id", ["caddie_id"])
    .index("by_flight_id", ["flight_id"])
    .index("by_rated_by_user_id", ["rated_by_user_id"])
    .index("by_tablet_round_id", ["tablet_round_id"]),

  cart_payments: defineTable({
    cart_fee: v.number(),
    cart_index: v.number(),
    cart_type: v.string(),
    created_at: v.number(),
    flight_id: v.id("flights"),
    notes: v.optional(v.string()),
    paid_by_player_id: v.optional(v.id("flight_players")),
    paid_by_player_name: v.optional(v.string()),
    payment_date: v.optional(v.number()),
    payment_method: v.optional(v.string()),
    payment_status: v.string(),
    updated_at: v.number(),
  })
    .index("by_flight_id", ["flight_id"])
    .index("by_flight_status", ["flight_id", "payment_status"])
    .index("by_payment_status", ["payment_status"]),

  carts: defineTable({
    assigned_at: v.optional(v.number()),
    cart_id: v.optional(v.string()),
    cart_name: v.optional(v.string()),
    created_at: v.optional(v.number()),
    current_flight_id: v.optional(
      v.union(v.id("flights"), v.id("flight_payments"), v.string()),
    ),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_cart_id", ["cart_id"])
    .index("by_current_flight_id", ["current_flight_id"])
    .index("by_status", ["status"])
    .searchIndex("search_cart_name", {
      searchField: "cart_name",
    }),

  flight_payments: defineTable({
    amount_outstanding: v.optional(v.number()),
    amount_paid: v.optional(v.number()),
    caddie_fee: v.optional(v.number()),
    cart_fee: v.optional(v.number()),
    created_at: v.optional(v.number()),
    flight_id: v.optional(v.id("flights")),
    flight_player_id: v.optional(v.id("flight_players")),
    green_fee: v.optional(v.number()),
    member_category: v.optional(v.string()),
    notes: v.optional(v.string()),
    payment_date: v.optional(v.number()),
    payment_method: v.optional(v.string()),
    payment_status: v.optional(v.string()),
    pricing_category: v.optional(v.string()),
    total_amount: v.optional(v.number()),
    updated_at: v.optional(v.number()),
  })
    .index("by_flight_id", ["flight_id"])
    .index("by_flight_player_id", ["flight_player_id"])
    .index("by_payment_date", ["payment_date"])
    .index("by_payment_status", ["payment_status"]),

  flight_players: defineTable({
    assigned_caddie_id: v.optional(v.id("caddies")),
    assigned_caddie_name: v.optional(v.string()),
    assigned_caddies: v.optional(
      v.array(
        v.object({
          caddie_id: v.id("caddies"),
          caddie_name: v.string(),
        }),
      ),
    ),
    assigned_cart_id: v.optional(v.id("carts")),
    assigned_cart_name: v.optional(v.string()),
    assigned_tablet_id: v.optional(v.id("users")),
    assigned_tablet_name: v.optional(v.string()),
    bag_drop_preplayer_id: v.optional(v.id("bag_drop_preplayer")),
    bag_tag_number: v.optional(v.string()),
    cart_type: v.optional(v.string()),
    created_at: v.optional(v.number()),
    flight_id: v.optional(v.id("flights")),
    gender: v.optional(v.string()),
    handicap_index: v.optional(v.number()),
    member_type: v.optional(v.string()),
    name: v.optional(v.string()),
    payment_status: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    player_order: v.optional(v.number()),
    rv_id: v.optional(v.string()),
    sharing_cart_with: v.optional(v.array(v.number())),
    sub_member_type: v.optional(v.string()),
    tee_box: v.optional(v.string()),
    updated_at: v.optional(v.number()),
    user_id: v.optional(v.id("users")),
    caller_device_id: v.optional(v.id("users")),
    caller_name: v.optional(v.string()),
    caller_type: v.optional(v.string()),
    hole_number: v.optional(v.number()),
    issue_type: v.optional(v.string()),
    issue_description: v.optional(v.string()),
    responded_by: v.optional(v.id("users")),
    responded_at: v.optional(v.number()),
    response_notes: v.optional(v.string()),
    resolution_status: v.optional(v.string()),
    order_items: v.optional(
      v.array(
        v.object({
          item_id: v.string(),
          item_name: v.string(),
          item_price: v.number(),
          quantity: v.number(),
          subtotal: v.number(),
        }),
      ),
    ),
    total_amount: v.optional(v.number()),
    read_at: v.optional(v.number()),
  })
    .index("by_assigned_caddie_id", ["assigned_caddie_id"])
    .index("by_assigned_cart_id", ["assigned_cart_id"])
    .index("by_assigned_tablet_id", ["assigned_tablet_id"])
    .index("by_bag_drop_preplayer_id", ["bag_drop_preplayer_id"])
    .index("by_bag_tag_number", ["bag_tag_number"])
    .index("by_flight_id", ["flight_id"])
    .index("by_payment_status", ["payment_status"])
    .index("by_user_id", ["user_id"]),

  flights: defineTable({
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
  })
    .index("by_course_id", ["course_id"])
    .index("by_course_status", ["course_id", "status"])
    .index("by_created_by", ["created_by"])
    .index("by_status", ["status"])
    .index("by_tee_off_status", ["tee_off_time", "status"])
    .index("by_tee_off_time", ["tee_off_time"]),

  food_items: defineTable({
    allergens: v.optional(v.string()),
    calories: v.optional(v.number()),
    category: v.optional(v.string()),
    cost_price: v.optional(v.number()),
    created_at: v.optional(v.number()),
    created_by: v.optional(v.id("users")),
    description: v.optional(v.string()),
    discount_percentage: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    image_storage_id: v.optional(v.id("_storage")),
    ingredients: v.optional(v.string()),
    is_halal: v.optional(v.boolean()),
    is_spicy: v.optional(v.boolean()),
    is_vegetarian: v.optional(v.boolean()),
    min_stock_alert: v.optional(v.number()),
    name: v.optional(v.string()),
    preparation_time: v.optional(v.number()),
    price: v.optional(v.number()),
    spicy_level: v.optional(v.number()),
    status: v.optional(v.string()),
    stock_quantity: v.optional(v.number()),
    store_id: v.optional(v.id("food_stores")),
    sub_category: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_featured", ["featured"])
    .index("by_status", ["status"])
    .index("by_store_category", ["store_id", "category"])
    .index("by_store_id", ["store_id"])
    .index("by_store_status", ["store_id", "status"])
    .searchIndex("search_name", { searchField: "name" }),

  food_stores: defineTable({
    created_at: v.optional(v.number()),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    location: v.optional(v.string()),
    logo_storage_id: v.optional(v.id("_storage")),
    manager_name: v.optional(v.string()),
    operating_hours: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    status: v.optional(v.string()),
    store_code: v.optional(v.string()),
    store_name: v.optional(v.string()),
    updated_at: v.optional(v.number()),
    whatsapp_number: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_store_code", ["store_code"])
    .searchIndex("search_store_name", {
      searchField: "store_name",
    }),

  golf_courses: defineTable({
    course_rating: v.optional(v.number()),
    created_at: v.optional(v.number()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    logo: v.optional(v.id("_storage")),
    name: v.optional(v.string()),
    par: v.optional(v.number()),
    slope_rating: v.optional(v.number()),
    status: v.optional(v.string()),
    tee_boxes: v.optional(v.any()),
    total_holes: v.optional(v.number()),
    updated_at: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .index("by_status", ["status"]),

  holes: defineTable({
    center_lat: v.optional(v.number()),
    center_lng: v.optional(v.number()),
    course_id: v.optional(v.id("golf_courses")),
    created_at: v.optional(v.number()),
    description: v.optional(v.string()),
    distance_black: v.optional(v.number()),
    distance_blue: v.optional(v.number()),
    distance_white: v.optional(v.number()),
    distance_yellow: v.optional(v.number()),
    distance_red: v.optional(v.number()),
    gps_lat: v.optional(v.number()),
    gps_lng: v.optional(v.number()),
    green_lat: v.optional(v.number()),
    green_lng: v.optional(v.number()),
    handicap_index: v.optional(v.number()),
    hole_number: v.optional(v.number()),
    layout_image: v.optional(v.id("_storage")),
    midpoint_lat: v.optional(v.number()),
    midpoint_lng: v.optional(v.number()),
    par: v.optional(v.number()),
    tee_box_lat: v.optional(v.number()),
    tee_box_lng: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    video_url: v.optional(v.id("_storage")),
    zoom_level: v.optional(v.number()),
  })
    .index("by_course_hole", ["course_id", "hole_number"])
    .index("by_course_id", ["course_id"]),

  notifications: defineTable({
    caller_device_id: v.optional(v.id("users")),
    caller_name: v.optional(v.string()),
    caller_type: v.optional(v.string()),
    created_at: v.optional(v.number()),
    flight_id: v.optional(v.id("flights")),
    hole_number: v.optional(v.number()),
    is_read: v.optional(v.boolean()),
    is_opened: v.optional(v.boolean()),
    issue_description: v.optional(v.string()),
    issue_type: v.optional(v.string()),
    message: v.optional(v.string()),
    metadata: v.optional(v.string()),
    order_items: v.optional(
      v.array(
        v.object({
          item_id: v.string(),
          item_name: v.string(),
          item_price: v.number(),
          quantity: v.number(),
          store_id: v.optional(v.string()),
          subtotal: v.number(),
        }),
      ),
    ),
    priority: v.optional(v.string()),
    read_at: v.optional(v.number()),
    resolution_status: v.optional(v.string()),
    responded_at: v.optional(v.number()),
    responded_by: v.optional(v.id("users")),
    response_notes: v.optional(v.string()),
    store_id: v.optional(v.string()),
    title: v.optional(v.string()),
    total_amount: v.optional(v.number()),
    type: v.optional(v.string()),
    user_id: v.optional(v.id("users")),
    target_recipient: v.optional(v.string()), // Tujuan notifikasi: "marshal", "food_store", "admin", "tablet", "all", dll
  })
    .index("by_created_at", ["created_at"])
    .index("by_flight_id", ["flight_id"])
    .index("by_priority", ["priority"])
    .index("by_resolution_status", ["resolution_status"])
    .index("by_store_id", ["store_id"])
    .index("by_type", ["type"])
    .index("by_user_id", ["user_id"])
    .index("by_user_read", ["user_id", "is_read"])
    .index("by_user_opened", ["user_id", "is_opened"])
    .index("by_target_recipient", ["target_recipient"]),

  pricing: defineTable({
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    // Category (e.g., "Regular", "Ladies")
    category: v.string(),
    // Day Label (e.g., "Monday", "Tuesday - Friday", "Weekend AM", "Saturday PM", "Sunday PM")
    label: v.string(),
    // Day Type (e.g., "weekday", "weekend")
    day_type: v.string(),
    // Specific day this pricing applies to (e.g., "Monday", "Saturday") - MANDATORY
    day: v.string(),
    // Time Period: "AM", "PM", or "Full Day"
    time: v.optional(v.string()),
    // Prices
    green_fee: v.number(),
    cart_single: v.number(),
    cart_sharing: v.number(),
    follower: v.optional(v.number()),
    currency: v.optional(v.string()),
    // Status - only one pricing can be active per day per category
    is_active: v.optional(v.boolean()),
  })
    .index("by_category", ["category"])
    .index("by_day_type", ["day_type"])
    .index("by_day", ["day"])
    .index("by_category_day", ["category", "day"])
    .index("by_category_day_type", ["category", "day_type"])
    .index("by_active", ["is_active"]),

  // Other Pricing Settings - stores additional fee configurations
  other_pricing: defineTable({
    follower_fee: v.number(), // Fee per follower person
    ppn_rate: v.number(), // PPN (Tax) percentage
    insurance_fee: v.number(), // Insurance fee per person
    bca_fee_rate: v.optional(v.number()), // BCA bank fee percentage
    mandiri_fee_rate: v.optional(v.number()), // Mandiri bank fee percentage
    bni_fee_rate: v.optional(v.number()), // BNI bank fee percentage
    bri_fee_rate: v.optional(v.number()), // BRI bank fee percentage
    // Legacy fields - will be removed after migration
    bank_fee_rate: v.optional(v.number()),
    service_charge_rate: v.optional(v.number()),
  }),

  resource_assignments: defineTable({
    assigned_at: v.optional(v.number()),
    created_at: v.optional(v.number()),
    flight_id: v.optional(v.id("flights")),
    flight_player_id: v.optional(v.id("flight_players")),
    released_at: v.optional(v.number()),
    resource_id: v.optional(v.string()),
    resource_name: v.optional(v.string()),
    resource_type: v.optional(v.string()),
    status: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_flight_id", ["flight_id"])
    .index("by_resource", ["resource_type", "resource_id"])
    .index("by_resource_status", ["resource_type", "status"])
    .index("by_status", ["status"]),

  ringtones: defineTable({
    created_at: v.optional(v.number()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    file_id: v.optional(v.id("_storage")),
    file_type: v.optional(v.string()),
    is_default: v.optional(v.boolean()),
    name: v.optional(v.string()),
    status: v.optional(v.string()),
    updated_at: v.optional(v.number()),
  })
    .index("by_is_default", ["is_default"])
    .index("by_status", ["status"]),

  tablet_rounds: defineTable({
    completed_at: v.optional(v.number()),
    created_at: v.optional(v.number()),
    current_hole: v.optional(v.number()),
    device_id: v.optional(v.id("users")),
    device_info: v.optional(v.string()),
    finished_at: v.optional(v.number()),
    finished_scoring: v.optional(v.boolean()),
    flight_id: v.optional(v.id("flights")),
    holes_completed: v.optional(v.number()),
    is_primary_device: v.optional(v.boolean()),
    updated_at: v.optional(v.number()),
  })
    .index("by_device_id", ["device_id"])
    .index("by_finished_scoring", ["finished_scoring"])
    .index("by_flight_device", ["flight_id", "device_id"])
    .index("by_flight_id", ["flight_id"]),

  tablet_scores: defineTable({
    bunker: v.optional(v.boolean()),
    created_at: v.optional(v.number()),
    fairway_hit: v.optional(v.boolean()),
    flight_id: v.optional(v.id("flights")),
    flight_player_id: v.optional(v.id("flight_players")),
    green_in_regulation: v.optional(v.boolean()),
    hole_id: v.optional(v.id("holes")),
    hole_number: v.optional(v.number()),
    hole_par: v.optional(v.number()),
    ob: v.optional(v.boolean()),
    pa: v.optional(v.boolean()),
    penalties: v.optional(v.number()),
    player_order: v.optional(v.number()),
    putts: v.optional(v.number()),
    recorded_by: v.optional(v.id("users")),
    rough: v.optional(v.boolean()),
    strokes: v.optional(v.number()),
    tablet_round_id: v.optional(v.id("tablet_rounds")),
    updated_at: v.optional(v.number()),
  })
    .index("by_flight_id", ["flight_id"])
    .index("by_flight_player", ["flight_id", "player_order"])
    .index("by_flight_player_hole", [
      "flight_id",
      "player_order",
      "hole_number",
    ])
    .index("by_flight_player_id", ["flight_player_id"])
    .index("by_hole_id", ["hole_id"])
    .index("by_recorded_by", ["recorded_by"])
    .index("by_tablet_round_id", ["tablet_round_id"]),

  tournament_flights: defineTable({
    created_at: v.number(),
    flight_id: v.id("flights"),
    flight_order: v.optional(v.number()),
    tournament_id: v.id("tournaments"),
  })
    .index("by_flight_id", ["flight_id"])
    .index("by_tournament_id", ["tournament_id"])
    .index("by_tournament_order", ["tournament_id", "flight_order"]),

  tournaments: defineTable({
    completed_at: v.optional(v.number()),
    course_type: v.optional(v.string()),
    created_at: v.number(),
    created_by: v.optional(v.id("users")),
    description: v.optional(v.string()),
    game_mode: v.optional(v.string()),
    scoring_system: v.optional(v.string()),
    start_hole: v.optional(v.number()),
    started_at: v.optional(v.number()),
    status: v.string(),
    tee_off_time: v.optional(v.number()),
    total_flights: v.optional(v.number()),
    total_players: v.optional(v.number()),
    tournament_date: v.number(),
    tournament_name: v.string(),
    updated_at: v.optional(v.number()),
  })
    .index("by_created_by", ["created_by"])
    .index("by_status", ["status"])
    .index("by_tournament_date", ["tournament_date"])
    .searchIndex("search_tournament_name", {
      searchField: "tournament_name",
    }),

  user_sessions: defineTable({
    created_at: v.optional(v.number()),
    device_id: v.optional(v.string()),
    device_info: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    ip_address: v.optional(v.string()),
    last_activity: v.optional(v.number()),
    logout_at: v.optional(v.number()),
    session_token: v.optional(v.string()),
    status: v.optional(v.string()),
    user_agent: v.optional(v.string()),
    user_id: v.optional(v.id("users")),
    username: v.optional(v.string()),
  })
    .index("by_device_id", ["device_id"])
    .index("by_expires_at", ["expires_at"])
    .index("by_session_token", ["session_token"])
    .index("by_status", ["status"])
    .index("by_user_id", ["user_id"])
    .index("by_user_status", ["user_id", "status"]),

  user_settings: defineTable({
    auto_mark_read: v.optional(v.boolean()),
    created_at: v.optional(v.number()),
    food_ringtone_id: v.optional(v.id("ringtones")),
    notification_popup: v.optional(v.boolean()),
    notification_sound: v.optional(v.boolean()),
    notification_volume: v.optional(v.number()),
    print_ringtone_id: v.optional(v.id("ringtones")),
    selected_ringtone_id: v.optional(v.id("ringtones")),
    updated_at: v.optional(v.number()),
    user_id: v.id("users"),
  }).index("by_user_id", ["user_id"]),

  // Player Payments - records of individual player payments
  player_payments: defineTable({
    bag_drop_preplayer_id: v.optional(v.id("bag_drop_preplayer")),
    player_name: v.string(),
    phone_number: v.optional(v.string()),
    member_type: v.optional(v.string()),
    cart_type: v.optional(v.string()),
    payment_responsible_person: v.optional(v.string()),

    // Pricing breakdown
    green_fee: v.number(),
    member_discount: v.number(),
    cart_fee: v.number(),
    follower_fee: v.number(),
    caddie_fee: v.optional(v.number()), // Caddie fee
    caddie_tips: v.optional(v.number()), // Tips for caddie (additional)
    insurance: v.optional(v.number()), // Insurance fee
    service_charge: v.optional(v.number()), // Service charge (legacy)
    service_adjustment: v.optional(v.number()), // Service Adjustment (SA/Pembulatan) - max 5500
    bank_fee: v.optional(v.number()), // Bank fee for non-cash payments
    subtotal: v.number(),
    ppn: v.number(),
    total: v.number(),

    // Payment details
    payment_method: v.string(), // cash, card, transfer, qris
    payment_status: v.string(), // paid, partial, unpaid
    bank_name: v.optional(v.string()),
    card_brand: v.optional(v.string()),
    transaction_id: v.optional(v.string()),

    // Receipt tracking
    receipt_printed: v.optional(v.boolean()),
    receipt_printed_count: v.optional(v.number()),
    first_print_date: v.optional(v.number()),
    last_print_date: v.optional(v.number()),

    // Related data
    pricing_label: v.optional(v.string()),
    number_of_followers: v.optional(v.number()),
    notes: v.optional(v.string()),
    staff_name: v.optional(v.string()),

    // Timestamps
    payment_date: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_bag_drop_preplayer", ["bag_drop_preplayer_id"])
    .index("by_payment_status", ["payment_status"])
    .index("by_payment_date", ["payment_date"])
    .index("by_payment_responsible_person", ["payment_responsible_person"])
    .index("by_transaction_id", ["transaction_id"]),

  // Caddies table - master data for all caddies
  caddies: defineTable({
    group: v.string(), // A or B
    type_group: v.string(), // MAN or LADIES
    gender: v.string(), // M or F
    no_induk: v.number(), // Caddie registration number
    username: v.string(),
    fullname: v.string(),
    phone: v.optional(v.string()),
    email: v.string(),
    status: v.optional(v.string()), // active, inactive, suspended
    assignment: v.optional(v.boolean()), // true if assigned to a flight, false otherwise
    notes: v.optional(v.string()), // Additional notes about the caddie
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
  })
    .index("by_username", ["username"])
    .index("by_email", ["email"])
    .index("by_group", ["group"])
    .index("by_type_group", ["type_group"])
    .index("by_gender", ["gender"])
    .index("by_no_induk", ["no_induk"])
    .index("by_group_type", ["group", "type_group"])
    .index("by_status", ["status"])
    .index("by_assignment", ["assignment"])
    .index("by_fullname", ["fullname"])
    .searchIndex("search_fullname", {
      searchField: "fullname",
    }),

  // Announcements table - templates for announcements
  announcements: defineTable({
    title: v.string(),
    message: v.string(),
    category: v.string(), // weather, emergency, delay, safety, general
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_created_at", ["created_at"]),

  // Tablet Locations - real-time GPS tracking for tablets
  tablet_locations: defineTable({
    tablet_id: v.id("users"), // Reference to tablet user
    tablet_name: v.optional(v.string()),
    flight_id: v.optional(v.id("flights")),
    flight_name: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()), // GPS accuracy in meters
    altitude: v.optional(v.number()),
    heading: v.optional(v.number()), // Direction in degrees
    speed: v.optional(v.number()), // Speed in m/s
    current_hole: v.optional(v.number()),
    battery_level: v.optional(v.number()), // Battery percentage
    is_active: v.boolean(), // Is tablet currently active
    last_updated: v.number(), // Timestamp of last location update
    created_at: v.number(),
  })
    .index("by_tablet_id", ["tablet_id"])
    .index("by_flight_id", ["flight_id"])
    .index("by_is_active", ["is_active"])
    .index("by_last_updated", ["last_updated"])
    .index("by_tablet_flight", ["tablet_id", "flight_id"]),
});
