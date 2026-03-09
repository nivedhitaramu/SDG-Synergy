import { users, projects, matches, type User, type InsertUser, type Project, type InsertProject, type Match, type InsertMatch, type MatchWithDetails } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  joinProject(projectId: number, userId: number): Promise<Project>;

  createMatch(match: InsertMatch): Promise<Match>;
  getUserMatches(userId: number): Promise<MatchWithDetails[]>;
  updateMatch(id: number, status: 'active' | 'rejected'): Promise<Match>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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
      detailedMatches.push({
        ...match,
        otherUser,
        project
      });
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
}

export const storage = new DatabaseStorage();
