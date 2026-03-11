import type { Express } from "express";
import type { Server } from "http";
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

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SDG Synergy <onboarding@resend.dev>",
          to: [email],
          subject: "Your OTP - SDG Synergy",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
              <h2 style="color:#16a34a;">SDG Synergy</h2>
              <p>Hello,</p>
              <p>Your email verification OTP is:</p>
              <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#16a34a;padding:16px 0;">${otp}</div>
              <p style="color:#6b7280;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
            </div>
          `,
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        console.error("Resend error:", err);
      } else {
        console.log(`📧 OTP email sent to ${email}`);
      }
    } catch (err) {
      console.error("Failed to send email via Resend:", err);
    }
  } else {
    // Fallback: log to console
    console.log(`\n📧 [DEV] OTP for ${email}: ${otp}\n`);
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
      phone: "+91-9876543210",
      address: "123 Green Street, Chennai",
      orgType: "NGO",
      location: "Chennai",
      sdgs: [13, 14, 15],
      expertise: "Conservation, wildlife",
      projects: [],
      emailVerified: true
    });
    
    const user2 = await storage.createUser({
      email: "farming@biz.com",
      password: hashedPassword,
      name: "Sustainable Farming Corp",
      phone: "+91-9876543211",
      address: "456 Farm Road, Bangalore",
      orgType: "Business",
      location: "Bangalore",
      sdgs: [2, 12, 15],
      expertise: "Agriculture, supply chain",
      projects: [],
      emailVerified: true
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
    cookie: { secure: false }
  }));

  // Seed DB
  seedDatabase().catch(console.error);

  // Auth routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      const user = await storage.createUser({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        phone: input.phone,
        address: input.address,
        orgType: input.orgType,
        location: input.location,
        sdgs: input.sdgs,
        expertise: input.expertise,
        projects: [],
        emailVerified: false,
        emailOTP: otp,
        emailOTPExpires: otpExpires
      });
      
      await sendOTPEmail(input.email, otp);

      // In development (no email configured), return OTP so user can verify immediately
      const isDev = !process.env.RESEND_API_KEY;
      res.status(201).json({
        message: "OTP sent. Please verify your email.",
        userId: user.id,
        otp: isDev ? otp : undefined,   // Only expose in dev mode
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error("Registration error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.verifyOTP.path, async (req, res) => {
    try {
      const { email, otp } = api.auth.verifyOTP.input.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      if (!user.emailOTP || user.emailOTP !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      
      if (!user.emailOTPExpires || user.emailOTPExpires < new Date()) {
        return res.status(400).json({ message: "OTP expired" });
      }
      
      const verifiedUser = await storage.verifyEmail(user.id);
      req.session.userId = verifiedUser.id;
      res.status(200).json(verifiedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
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
      
      if (!user.emailVerified) {
        return res.status(401).json({ message: "Please verify your email first" });
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

  // Profile routes
  app.patch(api.profile.update.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const updates = api.profile.update.input.parse(req.body);
      const user = await storage.updateProfile(req.session.userId, updates);
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
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
