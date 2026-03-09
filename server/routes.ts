import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertProjectSchema } from "@shared/schema";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

async function seedDatabase() {
  const usersList = await storage.getAllUsers();
  if (usersList.length === 0) {
    console.log("Seeding database with initial data...");
    const hashedPassword = await bcrypt.hash("password", 10);
    const user1 = await storage.createUser({
      email: "green@ngo.org",
      password: hashedPassword,
      name: "Green Future Initiative",
      orgType: "NGO",
      location: "India",
      sdgs: [13, 14, 15],
      expertise: "Conservation, wildlife",
      projects: []
    });
    
    const user2 = await storage.createUser({
      email: "farming@biz.com",
      password: hashedPassword,
      name: "Sustainable Farming Corp",
      orgType: "Business",
      location: "India",
      sdgs: [2, 12, 15],
      expertise: "Agriculture, supply chain",
      projects: []
    });

    const project1 = await storage.createProject({
      title: "Coastal Cleanup",
      sdgs: [14],
      description: "Organizing a massive coastal cleanup in Chennai.",
      resourcesNeeded: "Volunteers, garbage bags",
      resourcesOffered: "Training, food",
      ownerId: user1.id,
      members: [user1.id]
    });

    await storage.createMatch({
      user1Id: user1.id,
      user2Id: user2.id,
      projectId: project1.id,
      score: 92,
      status: "pending"
    });
    console.log("Seed complete.");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup simple sessions
  app.use(session({
    secret: process.env.SESSION_SECRET || 'sdg_synergy_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // false for HTTP development
  }));

  // Seed DB
  seedDatabase().catch(console.error);

  // Auth routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword
      });
      req.session.userId = user.id;
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = user.id;
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.status(200).json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    res.status(200).json(user);
  });

  // Projects routes
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getAllProjects();
    res.status(200).json(projects);
  });

  app.post(api.projects.create.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...input,
        ownerId: req.session.userId,
        members: [req.session.userId]
      });
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ message: "Not found" });
    res.status(200).json(project);
  });

  app.post(api.projects.join.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const project = await storage.joinProject(Number(req.params.id), req.session.userId);
      res.status(200).json(project);
    } catch (err) {
      res.status(404).json({ message: "Project not found" });
    }
  });

  // Matches routes
  app.get(api.matches.list.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const matches = await storage.getUserMatches(req.session.userId);
    res.status(200).json(matches);
  });

  app.patch(api.matches.update.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const status = z.enum(['active', 'rejected']).parse(req.body.status);
      const match = await storage.updateMatch(Number(req.params.id), status);
      res.status(200).json(match);
    } catch (err) {
      res.status(400).json({ message: "Invalid status" });
    }
  });

  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getAllUsers();
    res.status(200).json(users);
  });

  return httpServer;
}
