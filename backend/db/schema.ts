import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  real,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const address = pgTable("address", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(), // ชื่อผู้ส่ง หรือส่งในนาม
  company: varchar("company", { length: 150 }),
  email: varchar("email", { length: 150 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  type: varchar("type", { length: 20 }), // sender หรือ recipient
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  isSaved: boolean("is_saved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const parcel = pgTable("parcel", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  senderAddressId: uuid("sender_address_id").references(() => address.id, {
    onDelete: "set null",
  }),
  recipientAddressId: uuid("recipient_address_id").references(
    () => address.id,
    { onDelete: "set null" }
  ),
  driverId: uuid("driver_id").references(() => driver.id, {
    onDelete: "set null",
  }),
  parcelName: varchar("parcel_name", { length: 150 }).notNull(),
  quantity: integer("quantity").notNull(),
  weight: real("weight").notNull(),

  dimensionLength: real("dimension_length"),
  dimensionWidth: real("dimension_width"),
  dimensionHeight: real("dimension_height"),

  temperatureRangeMin: real("temperature_range_min"),
  temperatureRangeMax: real("temperature_range_max"),

  allowedDeviation: real("allowed_deviation"),
  specialNotes: text("special_notes"),

  trackingNo: varchar("tracking_no", { length: 20 }).unique().notNull(),
  isDelivered: boolean("is_delivered").default(false).notNull(),
  deliveredAt: timestamp("delivered_at"),
  isShipped: boolean("is_shipped").default(false).notNull(),
  shippedAt: timestamp("shipped_at"),
  signature: text("signature"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const driver = pgTable("driver", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  regNumber: varchar("reg_number", { length: 50 }),
  imageUrl: text("image_url"),
  email: varchar("email", { length: 150 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notification = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  notificationId: varchar("notification_id", { length: 255 }).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});