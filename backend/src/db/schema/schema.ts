import { pgTable, serial, varchar, boolean, integer, text, timestamp, customType } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Custom pgvector type for Drizzle
const pgVector = customType<{ data: number[] }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown): number[] {
    if (typeof value === "string") {
      return value.slice(1, -1).split(",").map(Number);
    }
    return value as number[];
  }
});

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).$type<"USER" | "ADMIN">().default("USER").notNull(),
  verified: boolean("verified").default(false).notNull(),
  uploadLimit: integer("upload_limit").default(5).notNull(),
  searchLimit: integer("search_limit").default(10).notNull(),
  uploadsUsed: integer("uploads_used").default(0).notNull(),
  searchesUsed: integer("searches_used").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// OTPs Table
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  otpHash: varchar("otp_hash", { length: 255 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).$type<"signup" | "reset">().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Complaints Table
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 12 }).notNull(), // Strictly <= 12 characters
  complainantName: varchar("complainant_name", { length: 255 }).notNull(),
  complainantContact: text("complainant_contact").notNull(),
  incidentDatetime: text("incident_datetime").notNull(),
  incidentPlace: varchar("incident_place", { length: 255 }).notNull(),
  accusedDetails: text("accused_details").notNull(),
  description: text("description").notNull(),
  ipcSections: text("ipc_sections").array().notNull(), // text[] for IPC sections
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Complaint Embeddings Table
export const complaintEmbeddings = pgTable("complaint_embeddings", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").references(() => complaints.id, { onDelete: "cascade" }).notNull(),
  embedding: pgVector("embedding").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table relations
export const usersRelations = relations(users, ({ many }) => ({
  otps: many(otps),
  complaints: many(complaints),
}));

export const otpsRelations = relations(otps, ({ one }) => ({
  user: one(users, {
    fields: [otps.userId],
    references: [users.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one, many }) => ({
  user: one(users, {
    fields: [complaints.userId],
    references: [users.id],
  }),
  embeddings: many(complaintEmbeddings),
}));

export const complaintEmbeddingsRelations = relations(complaintEmbeddings, ({ one }) => ({
  complaint: one(complaints, {
    fields: [complaintEmbeddings.complaintId],
    references: [complaints.id],
  }),
}));
