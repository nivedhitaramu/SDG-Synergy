import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  emailOTP: text("email_otp"),
  emailOTPExpires: timestamp("email_otp_expires"),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  orgType: text("org_type").notNull(), // NGO, Business, Government, Individual
  location: text("location").notNull(),
  sdgs: jsonb("sdgs").$type<number[]>().notNull(), // Array of 3 primary SDG numbers 1-17
  expertise: text("expertise").notNull(),
  projects: jsonb("projects").$type<number[]>().notNull(), // Array of project IDs
  createdAt: timestamp("created_at").defaultNow()
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  sdgs: jsonb("sdgs").$type<number[]>().notNull(),
  description: text("description").notNull(),
  resourcesNeeded: text("resources_needed").notNull(),
  resourcesOffered: text("resources_offered").notNull(),
  ownerId: integer("owner_id").notNull(),
  members: jsonb("members").$type<number[]>().notNull(), // Array of user IDs
  createdAt: timestamp("created_at").defaultNow()
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  projectId: integer("project_id"), // Optional
  score: integer("score").notNull(), // 0-100 similarity score
  status: text("status").notNull(), // 'pending', 'active', 'rejected'
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true,
  emailVerified: true,
  emailOTP: true,
  emailOTPExpires: true
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

// Match with joined data for the frontend
export type MatchWithDetails = Match & {
  otherUser?: User;
  project?: Project;
};
