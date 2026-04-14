import { users, projects, matches, feedEvents, events, type User, type InsertUser, type Project, type InsertProject, type Match, type InsertMatch, type MatchWithDetails, type FeedEvent, type InsertFeedEvent, type FeedEventWithDetails, type SDGEvent, type InsertSDGEvent } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  getAllUsers(): Promise<User[]>;
  verifyEmail(userId: number): Promise<User>;
  updateProfile(userId: number, updates: any): Promise<User>;
  deleteUser(id: number): Promise<void>;

  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  joinProject(projectId: number, userId: number): Promise<Project>;

  createMatch(match: InsertMatch): Promise<Match>;
  getUserMatches(userId: number): Promise<MatchWithDetails[]>;
  updateMatch(id: number, status: 'active' | 'rejected'): Promise<Match>;

  createFeedEvent(event: InsertFeedEvent): Promise<FeedEvent>;
  getFeed(limit?: number): Promise<FeedEventWithDetails[]>;

  createEvent(event: InsertSDGEvent): Promise<SDGEvent>;
  getEvent(id: number): Promise<SDGEvent | undefined>;
  getAllEvents(): Promise<SDGEvent[]>;
  joinEvent(eventId: number, userId: number): Promise<SDGEvent>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: any): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async verifyEmail(userId: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ emailVerified: true, emailOTP: null, emailOTPExpires: null })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateProfile(userId: number, updates: any): Promise<User> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async joinProject(projectId: number, userId: number): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error("Project not found");
    if (!project.members.includes(userId)) {
      const updatedMembers = [...project.members, userId];
      const [updatedProject] = await db.update(projects)
        .set({ members: updatedMembers })
        .where(eq(projects.id, projectId))
        .returning();
      return updatedProject;
    }
    return project;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }

  async getUserMatches(userId: number): Promise<MatchWithDetails[]> {
    const userMatches = await db.select().from(matches).where(eq(matches.user1Id, userId));
    const userMatches2 = await db.select().from(matches).where(eq(matches.user2Id, userId));
    const allMatches = [...userMatches, ...userMatches2];

    const detailedMatches: MatchWithDetails[] = [];
    for (const match of allMatches) {
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const otherUser = await this.getUser(otherUserId);
      let project;
      if (match.projectId) {
        project = await this.getProject(match.projectId);
      }
      detailedMatches.push({ ...match, otherUser, project });
    }
    return detailedMatches;
  }

  async updateMatch(id: number, status: 'active' | 'rejected'): Promise<Match> {
    const [updatedMatch] = await db.update(matches)
      .set({ status })
      .where(eq(matches.id, id))
      .returning();
    return updatedMatch;
  }

  async createFeedEvent(event: InsertFeedEvent): Promise<FeedEvent> {
    const [newEvent] = await db.insert(feedEvents).values(event).returning();
    return newEvent;
  }

  async getFeed(limit: number = 50): Promise<FeedEventWithDetails[]> {
    const feedItems = await db.select().from(feedEvents)
      .orderBy(desc(feedEvents.createdAt))
      .limit(limit);

    const detailed: FeedEventWithDetails[] = [];
    for (const item of feedItems) {
      const user = await this.getUser(item.userId);
      let project: any = undefined;
      if (item.type === 'project_created' || item.type === 'project_joined') {
        if (item.targetId) project = await this.getProject(item.targetId);
      }
      detailed.push({
        ...item,
        user: user ? { id: user.id, name: user.name, orgType: user.orgType, location: user.location, sdgs: user.sdgs } : undefined,
        project: project ? { id: project.id, title: project.title, sdgs: project.sdgs } : undefined,
      });
    }
    return detailed;
  }

  async createEvent(event: InsertSDGEvent): Promise<SDGEvent> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async getEvent(id: number): Promise<SDGEvent | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getAllEvents(): Promise<SDGEvent[]> {
    return await db.select().from(events).orderBy(desc(events.date));
  }

  async joinEvent(eventId: number, userId: number): Promise<SDGEvent> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error("Event not found");
    if (!event.attendees.includes(userId)) {
      const updatedAttendees = [...event.attendees, userId];
      const [updatedEvent] = await db.update(events)
        .set({ attendees: updatedAttendees })
        .where(eq(events.id, eventId))
        .returning();
      return updatedEvent;
    }
    return event;
  }
}

export const storage = new DatabaseStorage();
