import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertProjectSchema, insertEventSchema } from "@shared/schema";
import nodemailer from "nodemailer";
import OpenAI from "openai";
import { computeBadges } from "@shared/badges";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const OTP_EMAIL_HTML = (otp: string) => `
  <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
    <h2 style="color:#16a34a;margin-bottom:4px;">SDG Synergy</h2>
    <p style="color:#374151;">Your email verification code is:</p>
    <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#16a34a;padding:16px 0;">${otp}</div>
    <p style="color:#6b7280;font-size:14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
  </div>
`;

const NOTIFICATION_EMAIL_HTML = (title: string, message: string, ctaText: string, ctaUrl: string) => `
  <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <span style="font-size:24px;">🌿</span>
      <h2 style="color:#16a34a;margin:0;">SDG Synergy</h2>
    </div>
    <h3 style="color:#111827;margin-bottom:8px;">${title}</h3>
    <p style="color:#374151;line-height:1.6;">${message}</p>
    <a href="${ctaUrl}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">${ctaText}</a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">You're receiving this because you have an account on SDG Synergy.</p>
  </div>
`;

async function sendNotificationEmail(email: string, subject: string, title: string, message: string, ctaText: string, ctaUrl: string): Promise<boolean> {
  const html = NOTIFICATION_EMAIL_HTML(title, message, ctaText, ctaUrl);
  const brevoLogin = process.env.BREVO_LOGIN;
  const brevoKey = process.env.BREVO_SMTP_KEY;
  if (brevoLogin && brevoKey) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: { user: brevoLogin, pass: brevoKey },
      });
      const senderEmail = process.env.SENDER_EMAIL || brevoLogin;
      await transporter.sendMail({
        from: `"SDG Synergy" <${senderEmail}>`,
        to: email,
        subject,
        html,
      });
      console.log(`📧 Notification sent via Brevo to ${email}: "${subject}"`);
      return true;
    } catch (err) {
      console.error("Brevo notification error:", err);
    }
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SDG Synergy <onboarding@resend.dev>",
          to: [email],
          subject,
          html,
        }),
      });
      if (res.ok) {
        console.log(`📧 Notification sent via Resend to ${email}`);
        return true;
      }
    } catch (err) {
      console.error("Resend notification error:", err);
    }
  }
  return false;
}

async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  // Option 1: Resend API (preferred)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SDG Synergy <onboarding@resend.dev>",
          to: [email],
          subject: "Your Verification Code - SDG Synergy",
          html: OTP_EMAIL_HTML(otp),
        }),
      });
      if (res.ok) {
        console.log(`📧 OTP sent via Resend to ${email}`);
        return true;
      }
      const errBody = await res.text();
      console.error(`Resend API error (${res.status}):`, errBody);
      // Note: Free Resend accounts can only send to verified addresses unless a custom domain is set up
    } catch (err) {
      console.error("Resend fetch error:", err);
    }
  }

  // Option 2: Brevo SMTP (sends to any email, free plan, 300/day)
  const brevoLogin = process.env.BREVO_LOGIN;
  const brevoKey = process.env.BREVO_SMTP_KEY;
  if (brevoLogin && brevoKey) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: { user: brevoLogin, pass: brevoKey },
      });
      const senderEmail = process.env.SENDER_EMAIL || brevoLogin;
      await transporter.sendMail({
        from: `"SDG Synergy" <${senderEmail}>`,
        to: email,
        subject: "Your Verification Code - SDG Synergy",
        html: OTP_EMAIL_HTML(otp),
      });
      console.log(`📧 OTP sent via Brevo SMTP to ${email}`);
      return true;
    } catch (err) {
      console.error("Brevo SMTP error:", err);
    }
  }

  // Option 3: Generic Gmail SMTP (requires App Password)
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({
        from: `"SDG Synergy" <${smtpUser}>`,
        to: email,
        subject: "Your Verification Code - SDG Synergy",
        html: OTP_EMAIL_HTML(otp),
      });
      console.log(`📧 OTP sent via Gmail SMTP to ${email}`);
      return true;
    } catch (err) {
      console.error("Nodemailer error:", err);
    }
  }

  // No email service configured — return false so UI shows the OTP
  console.log(`\n📧 [DEV] No email service configured. OTP for ${email}: ${otp}\n`);
  return false;
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
      
      const emailSent = await sendOTPEmail(input.email, otp);

      res.status(201).json({
        message: emailSent
          ? "OTP sent to your email. Please verify."
          : "OTP generated. Email not configured — check server console.",
        userId: user.id,
        otp: emailSent ? undefined : otp,  // expose only when email not configured
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

      // Fire feed event: new member joined
      storage.createFeedEvent({
        type: 'user_joined',
        userId: verifiedUser.id,
        metadata: { name: verifiedUser.name, orgType: verifiedUser.orgType, location: verifiedUser.location, sdgs: verifiedUser.sdgs }
      }).catch(console.error);

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

      // Fire feed event
      storage.createFeedEvent({
        type: 'project_created',
        userId: req.session.userId,
        targetId: project.id,
        metadata: { projectTitle: project.title, sdgs: project.sdgs }
      }).catch(console.error);

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

      // Fire feed event
      storage.createFeedEvent({
        type: 'project_joined',
        userId: req.session.userId,
        targetId: project.id,
        metadata: { projectTitle: project.title, sdgs: project.sdgs }
      }).catch(console.error);

      // Notify project owner if they're not the one joining
      if (project.ownerId !== req.session.userId) {
        const joiner = await storage.getUser(req.session.userId);
        const owner = await storage.getUser(project.ownerId);
        if (joiner && owner) {
          sendNotificationEmail(
            owner.email,
            `Someone offered help on your project`,
            `New help offer on "${project.title}"`,
            `<strong>${joiner.name}</strong> has offered to help with your project <strong>"${project.title}"</strong> on SDG Synergy. Log in to connect with them and coordinate next steps.`,
            `View Project`,
            `https://${req.headers.host}/projects`
          ).catch(console.error);
        }
      }

      res.status(200).json(project);
    } catch (err) {
      res.status(404).json({ message: "Project not found" });
    }
  });

  // Matches routes
  app.post('/api/matches/request', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const { targetUserId, aiReason } = z.object({
        targetUserId: z.number(),
        aiReason: z.string().optional(),
      }).parse(req.body);

      const currentUser = await storage.getUser(req.session.userId);
      const targetUser = await storage.getUser(targetUserId);
      if (!currentUser || !targetUser) return res.status(404).json({ message: "User not found" });

      // Check no existing match
      const existing = await storage.getUserMatches(req.session.userId);
      const alreadyMatched = existing.some(m => m.user1Id === targetUserId || m.user2Id === targetUserId);
      if (alreadyMatched) return res.status(409).json({ message: "Already matched" });

      // Compute SDG overlap score
      const mySDGs = new Set(currentUser.sdgs);
      const overlap = targetUser.sdgs.filter(s => mySDGs.has(s)).length;
      const score = Math.round((overlap / 3) * 100);

      const match = await storage.createMatch({
        user1Id: req.session.userId,
        user2Id: targetUserId,
        score,
        aiReason: aiReason || null,
        status: 'pending',
        projectId: null,
      });

      // Fire feed event
      storage.createFeedEvent({
        type: 'match_made',
        userId: req.session.userId,
        targetId: targetUserId,
        metadata: { matchedWith: targetUser.name, score }
      }).catch(console.error);

      // Notify the target user via email
      sendNotificationEmail(
        targetUser.email,
        `New connection request on SDG Synergy`,
        `Someone wants to connect with you!`,
        `<strong>${currentUser.name}</strong> has sent you a connection request on SDG Synergy with a <strong>${score}% SDG match score</strong>. Log in to review and accept or decline the request.`,
        `View Connection Request`,
        `https://${req.headers.host}/matches`
      ).catch(console.error);

      res.status(201).json(match);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

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

  // Badges
  app.get('/api/badges/:userId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const allMatches = await storage.getUserMatches(userId);
      const allProjects = await storage.getAllProjects();

      const activeMatchCount = allMatches.filter(m => m.status === 'active').length;
      const ownedProjectCount = allProjects.filter(p => p.ownerId === userId).length;
      const joinedProjectCount = allProjects.filter(p =>
        p.ownerId !== userId && p.members.includes(userId)
      ).length;

      const badges = computeBadges({
        userId,
        emailVerified: user.emailVerified ?? false,
        expertise: user.expertise,
        address: user.address,
        sdgs: user.sdgs,
        activeMatchCount,
        ownedProjectCount,
        joinedProjectCount,
      });

      res.status(200).json(badges);
    } catch (err) {
      console.error("Badges error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // SDG Impact Feed
  app.get('/api/feed', async (req, res) => {
    try {
      const feed = await storage.getFeed(50);
      res.status(200).json(feed);
    } catch (err) {
      console.error("Feed error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Matchmaking — finds best org/NGO matches for current user's projects
  app.get('/api/matches/ai-suggestions', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) return res.status(404).json({ message: "User not found" });

      const allUsers = await storage.getAllUsers();
      const allProjects = await storage.getAllProjects();
      const userProjects = allProjects.filter(p => p.ownerId === currentUser.id || p.members.includes(currentUser.id));

      // Filter out self and already-matched users
      const existingMatches = await storage.getUserMatches(currentUser.id);
      const matchedUserIds = new Set(existingMatches.map(m => m.user1Id === currentUser.id ? m.user2Id : m.user1Id));

      const candidates = allUsers.filter(u =>
        u.id !== currentUser.id &&
        u.emailVerified &&
        !matchedUserIds.has(u.id)
      );

      if (candidates.length === 0) return res.status(200).json([]);

      // Build a compact profile summary for the AI
      const myProfile = `Name: ${currentUser.name}
Org Type: ${currentUser.orgType}
Location: ${currentUser.location}
SDGs: ${currentUser.sdgs.join(', ')}
Expertise: ${currentUser.expertise}
Projects: ${userProjects.map(p => `${p.title} (${p.description.slice(0, 80)})`).join('; ') || 'None yet'}`;

      const candidateList = candidates.map((u, i) => {
        const theirProjects = allProjects.filter(p => p.ownerId === u.id || p.members.includes(u.id));
        return `[${i}] ${u.name} | ${u.orgType} | ${u.location} | SDGs: ${u.sdgs.join(',')} | Expertise: ${u.expertise} | Projects: ${theirProjects.map(p => p.title).join(', ') || 'None'}`;
      }).join('\n');

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "system",
          content: `You are an SDG collaboration matchmaker. Given a user profile and a list of candidates, rank the top matches and explain WHY each is a good collaboration partner. Focus on SDG alignment, complementary expertise, and project synergy. Be concise and specific.`
        }, {
          role: "user",
          content: `MY PROFILE:\n${myProfile}\n\nCANDIDATES:\n${candidateList}\n\nReturn a JSON array of the top 5 matches (or fewer if less available). Each item: { "index": number, "score": number (0-100), "reason": string (2-3 sentences explaining the match) }. Score based on SDG overlap, expertise fit, and collaboration potential.`
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000
      });

      const content = aiResponse.choices[0]?.message?.content || '{"matches":[]}';
      const parsed = JSON.parse(content);
      const aiMatches: Array<{index: number; score: number; reason: string}> = parsed.matches || parsed;

      const results = aiMatches
        .filter(m => m.index >= 0 && m.index < candidates.length)
        .map(m => ({
          user: candidates[m.index],
          score: m.score,
          aiReason: m.reason
        }));

      res.status(200).json(results);
    } catch (err) {
      console.error("AI matchmaking error:", err);
      res.status(500).json({ message: "AI matchmaking failed" });
    }
  });

  // Chat route
  app.post('/api/chat', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const { messages } = z.object({
        messages: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        }))
      }).parse(req.body);

      const user = await storage.getUser(req.session.userId);
      const allProjects = await storage.getAllProjects();
      const allEvents = await storage.getAllEvents();

      const userContext = user ? `
Current user: ${user.name} (${user.orgType}) from ${user.location}
SDG Focus: SDGs ${user.sdgs.join(', ')}
Expertise: ${user.expertise}
Projects on platform: ${allProjects.length} | Upcoming events: ${allEvents.filter(e => new Date(e.date) >= new Date()).length}
` : '';

      const systemPrompt = `You are Synergy, the AI assistant for SDG Synergy — a sustainability networking platform where organisations and individuals connect around the UN Sustainable Development Goals (SDGs).

${userContext}

Your role:
- Help users navigate the platform (matches, projects, events, profile, feed)
- Explain any of the 17 UN SDGs in plain language
- Suggest collaboration opportunities based on SDG alignment
- Answer questions about sustainability, impact, and social enterprise in the Indian context
- Be warm, concise, and action-oriented

Platform features you can reference:
- AI Matches: SDG-based matching with % scores and AI explanations
- Projects: collaborative initiatives with a "Help Wanted" system (Technical, Funding, Mentorship, Volunteers, Marketing, Legal)
- Events: Webinars, Field Visits, and Workshops tied to SDGs
- Impact Feed: live activity stream of the community
- Badges: achievements for community engagement
- Profile: SDG focus, expertise, org type, location

Keep responses under 150 words unless explaining an SDG in depth. Use bullet points where helpful. Always be encouraging and specific.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_completion_tokens: 400,
      });

      const reply = response.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
      res.status(200).json({ reply });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid request" });
      console.error("Chat error:", err);
      res.status(500).json({ message: "Chat unavailable right now." });
    }
  });

  // Events routes
  app.get('/api/events', async (req, res) => {
    try {
      const allEvents = await storage.getAllEvents();
      res.status(200).json(allEvents);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/events', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = insertEventSchema.parse({
        ...req.body,
        date: new Date(req.body.date),
        organizerId: req.session.userId,
        attendees: [req.session.userId],
      });
      const event = await storage.createEvent(input);

      storage.createFeedEvent({
        type: 'event_created',
        userId: req.session.userId,
        targetId: event.id,
        metadata: { eventTitle: event.title, eventType: event.eventType, sdgs: event.sdgs }
      }).catch(console.error);

      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/events/:id/join', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const event = await storage.joinEvent(Number(req.params.id), req.session.userId);

      storage.createFeedEvent({
        type: 'event_joined',
        userId: req.session.userId,
        targetId: event.id,
        metadata: { eventTitle: event.title, eventType: event.eventType, sdgs: event.sdgs }
      }).catch(console.error);

      // Notify organizer if someone else joins
      if (event.organizerId !== req.session.userId) {
        const joiner = await storage.getUser(req.session.userId);
        const organizer = await storage.getUser(event.organizerId);
        if (joiner && organizer) {
          sendNotificationEmail(
            organizer.email,
            `Someone registered for your event`,
            `New attendee for "${event.title}"`,
            `<strong>${joiner.name}</strong> has registered to attend your event <strong>"${event.title}"</strong> on SDG Synergy.`,
            `View Event`,
            `https://${req.headers.host}/events`
          ).catch(console.error);
        }
      }

      res.status(200).json(event);
    } catch (err) {
      res.status(404).json({ message: "Event not found" });
    }
  });

  // Admin stats
  app.get('/api/admin/stats', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const allUsers = await storage.getAllUsers();
      const allProjects = await storage.getAllProjects();
      const allEvents = await storage.getAllEvents();

      // Matches: pull all from both sides
      let allMatchRows: any[] = [];
      for (const u of allUsers) {
        const m = await storage.getUserMatches(u.id);
        allMatchRows.push(...m);
      }
      // Deduplicate by id
      const seenIds = new Set<number>();
      const allMatches = allMatchRows.filter(m => {
        if (seenIds.has(m.id)) return false;
        seenIds.add(m.id);
        return true;
      });

      // SDG frequency across all users
      const sdgCount: Record<number, number> = {};
      for (const u of allUsers) {
        for (const sdg of (u.sdgs || [])) {
          sdgCount[sdg] = (sdgCount[sdg] || 0) + 1;
        }
      }
      const topSDGs = Object.entries(sdgCount)
        .map(([id, count]) => ({ id: Number(id), count }))
        .sort((a, b) => b.count - a.count);

      // Org type breakdown
      const orgTypes: Record<string, number> = {};
      for (const u of allUsers) {
        orgTypes[u.orgType] = (orgTypes[u.orgType] || 0) + 1;
      }

      // Location breakdown
      const locations: Record<string, number> = {};
      for (const u of allUsers) {
        const loc = u.location?.trim();
        if (loc) locations[loc] = (locations[loc] || 0) + 1;
      }
      const topLocations = Object.entries(locations)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Help types across help-wanted projects
      const helpTypes: Record<string, number> = {};
      for (const p of allProjects) {
        if ((p as any).helpNeeded) {
          for (const t of ((p as any).helpTypes || [])) {
            helpTypes[t] = (helpTypes[t] || 0) + 1;
          }
        }
      }

      // User growth: count by join date (last 14 days)
      const now = new Date();
      const growth: { date: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count = allUsers.filter(u => {
          const joined = u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '';
          return joined === dateStr;
        }).length;
        growth.push({ date: dateStr, count });
      }

      // Recent users (last 10)
      const recentUsers = [...allUsers]
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 10)
        .map(u => ({ id: u.id, name: u.name, orgType: u.orgType, location: u.location, sdgs: u.sdgs, createdAt: u.createdAt, emailVerified: u.emailVerified }));

      res.status(200).json({
        totals: {
          users: allUsers.length,
          projects: allProjects.length,
          helpWantedProjects: allProjects.filter(p => (p as any).helpNeeded).length,
          matches: allMatches.length,
          activeMatches: allMatches.filter(m => m.status === 'active').length,
          pendingMatches: allMatches.filter(m => m.status === 'pending').length,
          events: allEvents.length,
          upcomingEvents: allEvents.filter(e => new Date(e.date) >= now).length,
          verifiedUsers: allUsers.filter(u => u.emailVerified).length,
        },
        topSDGs,
        orgTypes,
        topLocations,
        helpTypes,
        growth,
        recentUsers,
      });
    } catch (err) {
      console.error("Admin stats error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Submission status notification email ────────────────────────────────
  app.post('/api/submissions/notify', async (req, res) => {
    const { email, applicantName, projectName, ngoName, status, helpCategory, certId } = req.body;

    if (!email || !applicantName || !status) {
      return res.status(400).json({ message: "email, applicantName, and status are required" });
    }

    const appUrl = req.headers.origin || "https://sdgsynergy.replit.app";

    type StatusConfig = { subject: string; title: string; message: string; cta: string; ctaUrl: string };
    const statusConfigs: Record<string, StatusConfig> = {
      reviewed: {
        subject: `Your application is being reviewed – ${projectName}`,
        title: "Application Under Review",
        message: `Hi ${applicantName},<br><br>Your <strong>${helpCategory || "help"}</strong> application for <strong>${projectName}</strong> (${ngoName}) is currently being reviewed by the project team.<br><br>We'll update you soon with next steps.`,
        cta: "View Volunteer Hub",
        ctaUrl: `${appUrl}/volunteer-hub`,
      },
      contacted: {
        subject: `${ngoName} wants to connect with you! – ${projectName}`,
        title: "They Want to Connect!",
        message: `Hi ${applicantName},<br><br><strong>${ngoName}</strong> has reviewed your application for <strong>${projectName}</strong> and would like to get in touch with you.<br><br>Please check your email or phone for their message, or log in to your volunteer hub to see the next steps.`,
        cta: "Check Volunteer Hub",
        ctaUrl: `${appUrl}/volunteer-hub`,
      },
      approved: {
        subject: `🎉 You've been accepted! – ${projectName}`,
        title: "Application Approved!",
        message: `Hi ${applicantName},<br><br>Congratulations! <strong>${ngoName}</strong> has officially accepted your <strong>${helpCategory || "help"}</strong> offer for <strong>${projectName}</strong>.<br><br>Please coordinate with the project team on next steps. Your contribution will make a real difference toward the Sustainable Development Goals.`,
        cta: "View My Applications",
        ctaUrl: `${appUrl}/volunteer-hub`,
      },
      rejected: {
        subject: `Update on your application – ${projectName}`,
        title: "Application Update",
        message: `Hi ${applicantName},<br><br>Thank you for offering to help with <strong>${projectName}</strong> at <strong>${ngoName}</strong>.<br><br>Unfortunately, the project team was unable to proceed with your application at this time. This may be because they have found other contributors or their needs have changed.<br><br>We encourage you to explore other opportunities on SDG Synergy.`,
        cta: "Find More Projects",
        ctaUrl: `${appUrl}/ngos`,
      },
      completed: {
        subject: `✅ Volunteering completed – Your certificate is ready!`,
        title: "Volunteering Marked as Completed",
        message: `Hi ${applicantName},<br><br>Congratulations on completing your <strong>${helpCategory || "volunteering"}</strong> contribution to <strong>${projectName}</strong> at <strong>${ngoName}</strong>!<br><br>${certId ? `Your <strong>Certificate of Appreciation</strong> is now ready. Use the button below to view and download it.` : `Your contribution has been recorded. Log in to your Volunteer Hub to see your completed submissions.`}<br><br>Thank you for your commitment to social impact and the UN Sustainable Development Goals.`,
        cta: certId ? "Download Certificate" : "View Volunteer Hub",
        ctaUrl: certId ? `${appUrl}/certificate/${certId}` : `${appUrl}/volunteer-hub`,
      },
    };

    const config = statusConfigs[status];
    if (!config) {
      return res.status(200).json({ message: "No email needed for this status", sent: false });
    }

    try {
      const sent = await sendNotificationEmail(email, config.subject, config.title, config.message, config.cta, config.ctaUrl);
      res.json({ sent, status });
    } catch (err) {
      console.error("Submission notify error:", err);
      res.status(500).json({ message: "Failed to send notification", sent: false });
    }
  });

  return httpServer;
}
