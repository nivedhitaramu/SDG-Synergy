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
  orgType: text("org_type").notNull(),
  location: text("location").notNull(),
  sdgs: jsonb("sdgs").$type<number[]>().notNull(),
  expertise: text("expertise").notNull(),
  projects: jsonb("projects").$type<number[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  sdgs: jsonb("sdgs").$type<number[]>().notNull(),
  description: text("description").notNull(),
  resourcesNeeded: text("resources_needed").notNull(),
  resourcesOffered: text("resources_offered").notNull(),
  helpNeeded: boolean("help_needed").default(false),
  helpTypes: jsonb("help_types").$type<string[]>().default([]),
  ownerId: integer("owner_id").notNull(),
  members: jsonb("members").$type<number[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  projectId: integer("project_id"),
  score: integer("score").notNull(),
  aiReason: text("ai_reason"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("event_type").notNull(), // 'webinar' | 'field_visit' | 'workshop'
  sdgs: jsonb("sdgs").$type<number[]>().notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  organizerId: integer("organizer_id").notNull(),
  attendees: jsonb("attendees").$type<number[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow()
});

// Feed events for the SDG Impact Feed
export const feedEvents = pgTable("feed_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'user_joined' | 'project_created' | 'match_made' | 'project_joined'
  userId: integer("user_id").notNull(),
  targetId: integer("target_id"),   // project id or matched user id
  metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default({}),
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
export const insertFeedEventSchema = createInsertSchema(feedEvents).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type FeedEvent = typeof feedEvents.$inferSelect;
export type InsertFeedEvent = z.infer<typeof insertFeedEventSchema>;
export type SDGEvent = typeof events.$inferSelect;
export type InsertSDGEvent = z.infer<typeof insertEventSchema>;

export type MatchWithDetails = Match & {
  otherUser?: User;
  project?: Project;
};

export type FeedEventWithDetails = FeedEvent & {
  user?: Pick<User, 'id' | 'name' | 'orgType' | 'location' | 'sdgs'>;
  project?: Pick<Project, 'id' | 'title' | 'sdgs'>;
};
