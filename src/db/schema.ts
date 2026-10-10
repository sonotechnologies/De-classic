import { relations } from "drizzle-orm";
import { boolean, date, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["owner", "manager", "front_desk"]);
export const stayTypeEnum = pgEnum("stay_type", ["overnight", "short_stay"]);
export const contactMethodEnum = pgEnum("contact_method", ["call", "whatsapp"]);
export const reservationStatusEnum = pgEnum("reservation_status", [
  "new",
  "confirmed",
  "declined",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
]);
export const galleryTagEnum = pgEnum("gallery_tag", ["rooms", "bar", "exterior"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export type BarHours = { days: string; time: string }[];
export type Landmark = { place: string; time: string }[];

export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  /** Short area line used in headings, e.g. "agric, ikorodu". */
  area: text("area").notNull().default(""),
  address: text("address").notNull(),
  mapUrl: text("map_url").notNull().default(""),
  mapEmbedUrl: text("map_embed_url").notNull().default(""),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull().default(""),
  /** Reception hours, free text such as "Reception is open 24 hours". */
  hours: text("hours").notNull().default(""),
  barHours: jsonb("bar_hours").$type<BarHours>().notNull().default([]),
  barIntro: text("bar_intro").notNull().default(""),
  landmarks: jsonb("landmarks").$type<Landmark>().notNull().default([]),
  checkInTime: text("check_in_time").notNull().default("14:00"),
  checkOutTime: text("check_out_time").notNull().default("12:00"),
  allowsShortStay: boolean("allows_short_stay").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  isSample: boolean("is_sample").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const roomTypes = pgTable(
  "room_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    /** Short lowercase line on the room page, e.g. "room for two, and a desk". */
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    /** Kobo. */
    pricePerNight: integer("price_per_night").notNull(),
    /** Kobo. Null when short stay is not offered for this room. */
    shortStayPrice: integer("short_stay_price"),
    capacity: integer("capacity").notNull().default(2),
    amenities: jsonb("amenities").$type<string[]>().notNull().default([]),
    units: integer("units").notNull().default(1),
    isVisible: boolean("is_visible").notNull().default(true),
    isSample: boolean("is_sample").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("room_types_branch_slug").on(t.branchId, t.slug)],
);

export const roomImages = pgTable("room_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomTypeId: uuid("room_type_id")
    .notNull()
    .references(() => roomTypes.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  publicId: text("public_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  terms: text("terms").notNull().default(""),
  /** Optional tag text shown instead of the end date, e.g. "every thursday". */
  badge: text("badge").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default(""),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on"),
  isActive: boolean("is_active").notNull().default(true),
  isSample: boolean("is_sample").notNull().default(false),
  ...timestamps,
});

export const offerRoomTypes = pgTable(
  "offer_room_types",
  {
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.offerId, t.roomTypeId] })],
);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  /** Empty for the owner, who sees every branch. */
  branchId: uuid("branch_id").references(() => branches.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),
    roomTypeId: uuid("room_type_id").references(() => roomTypes.id, {
      onDelete: "set null",
    }),
    /** Snapshot so history survives a deleted room type. */
    roomName: text("room_name").notNull(),
    /** Kobo, the rate quoted when the guest sent the request. */
    quotedRate: integer("quoted_rate").notNull().default(0),
    offerId: uuid("offer_id").references(() => offers.id, {
      onDelete: "set null",
    }),
    offerTitle: text("offer_title"),
    stayType: stayTypeEnum("stay_type").notNull(),
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out"),
    arrivalTime: text("arrival_time"),
    rooms: integer("rooms").notNull().default(1),
    guests: integer("guests").notNull().default(1),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    contactMethod: contactMethodEnum("contact_method").notNull(),
    requests: text("requests"),
    status: reservationStatusEnum("status").notNull().default("new"),
    ipHash: text("ip_hash"),
    ...timestamps,
  },
  (t) => [
    index("reservations_branch_status").on(t.branchId, t.status),
    index("reservations_created").on(t.createdAt),
    index("reservations_phone").on(t.phone),
  ],
);

export const reservationEvents = pgTable(
  "reservation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Snapshot of who acted, kept if the account is removed. */
    userName: text("user_name"),
    fromStatus: reservationStatusEnum("from_status"),
    toStatus: reservationStatusEnum("to_status"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reservation_events_res").on(t.reservationId)],
);

export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => menuCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  /** Kobo. */
  price: integer("price").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  isSample: boolean("is_sample").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const galleryImages = pgTable("gallery_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  publicId: text("public_id"),
  tag: galleryTagEnum("tag").notNull(),
  width: integer("width").notNull().default(1200),
  height: integer("height").notNull().default(900),
  isSample: boolean("is_sample").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Created now so guest reviews can be added later; not shown at launch. */
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  reservationId: uuid("reservation_id").references(() => reservations.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const branchesRelations = relations(branches, ({ many }) => ({
  roomTypes: many(roomTypes),
  offers: many(offers),
  menuCategories: many(menuCategories),
  galleryImages: many(galleryImages),
}));

export const roomTypesRelations = relations(roomTypes, ({ one, many }) => ({
  branch: one(branches, {
    fields: [roomTypes.branchId],
    references: [branches.id],
  }),
  images: many(roomImages),
  offerLinks: many(offerRoomTypes),
}));

export const roomImagesRelations = relations(roomImages, ({ one }) => ({
  roomType: one(roomTypes, {
    fields: [roomImages.roomTypeId],
    references: [roomTypes.id],
  }),
}));

export const offersRelations = relations(offers, ({ one, many }) => ({
  branch: one(branches, {
    fields: [offers.branchId],
    references: [branches.id],
  }),
  roomLinks: many(offerRoomTypes),
}));

export const offerRoomTypesRelations = relations(offerRoomTypes, ({ one }) => ({
  offer: one(offers, {
    fields: [offerRoomTypes.offerId],
    references: [offers.id],
  }),
  roomType: one(roomTypes, {
    fields: [offerRoomTypes.roomTypeId],
    references: [roomTypes.id],
  }),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ one, many }) => ({
  branch: one(branches, {
    fields: [menuCategories.branchId],
    references: [branches.id],
  }),
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  branch: one(branches, {
    fields: [reservations.branchId],
    references: [branches.id],
  }),
  roomType: one(roomTypes, {
    fields: [reservations.roomTypeId],
    references: [roomTypes.id],
  }),
  offer: one(offers, {
    fields: [reservations.offerId],
    references: [offers.id],
  }),
  events: many(reservationEvents),
}));

export const reservationEventsRelations = relations(reservationEvents, ({ one }) => ({
  reservation: one(reservations, {
    fields: [reservationEvents.reservationId],
    references: [reservations.id],
  }),
  user: one(users, {
    fields: [reservationEvents.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
}));

export type Branch = typeof branches.$inferSelect;
export type RoomType = typeof roomTypes.$inferSelect;
export type RoomImage = typeof roomImages.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type ReservationEvent = typeof reservationEvents.$inferSelect;
export type User = typeof users.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type ReservationStatus = (typeof reservationStatusEnum.enumValues)[number];
export type GalleryTag = (typeof galleryTagEnum.enumValues)[number];
