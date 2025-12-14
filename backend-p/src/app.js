// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { corsOptions } from "./middleware/helmet.js";
import { baseLimiter } from "./middleware/rateLimit.js";
import { audit } from "./middleware/audit.js";
import errorHandler from "./middleware/error.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

import studentRoutes from "./routes/student.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import filesRoutes from "./routes/files.routes.js";

import facultyDashRoutes from "./routes/faculty.dashboard.routes.js";
import facultyStudentsRoutes from "./routes/faculty.students.routes.js";
import facultyProfileRoutes from "./routes/faculty.profile.routes.js";
import facultyComplaintsRoutes from "./routes/faculty.complaints.routes.js";
import facultyMyRoutes from "./routes/faculty.my.routes.js";

import wardenDashboardRoutes from "./routes/warden.dashboard.routes.js";
import wardenComplaintsRoutes from "./routes/warden.complaints.routes.js";
import wardenProfileRoutes from "./routes/warden.profile.routes.js";
import wardenDirectoryRoutes from "./routes/warden.directory.routes.js";

import securityProfileRoutes from "./routes/security.profile.routes.js";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "3mb" }));
app.use(baseLimiter);
app.use(audit);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);

// Core resources
app.use("/api/student", studentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/files", filesRoutes);

// Faculty surface
app.use("/api/faculty/profile", facultyProfileRoutes);
app.use("/api/faculty/my", facultyMyRoutes);
app.use("/api/faculty/dashboard", facultyDashRoutes);
app.use("/api/faculty/students", facultyStudentsRoutes);
app.use("/api/faculty/complaints", facultyComplaintsRoutes);

// Warden surface
app.use("/api/warden/profile", wardenProfileRoutes);
app.use("/api/warden/dashboard", wardenDashboardRoutes);
app.use("/api/warden/complaints", wardenComplaintsRoutes);
app.use("/api/warden/directory", wardenDirectoryRoutes);
// Security utilities
app.use("/api/security", securityProfileRoutes);

app.use(errorHandler);

export default app;
