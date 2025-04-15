import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We'll keep the users table from the template
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Add project table to store project information
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  path: true,
  userId: true,
});

// Add files table to store information about files in a project
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  path: text("path").notNull(),
  name: text("name").notNull(),
  isDirectory: boolean("is_directory").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFileSchema = createInsertSchema(files).pick({
  projectId: true,
  path: true,
  name: true,
  isDirectory: true,
  content: true,
});

// Add codebase index table to store AI-generated codebase analysis
export const codebaseIndices = pgTable("codebase_indices", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  summary: text("summary").notNull(),
  keyComponents: text("key_components").notNull(), // Stored as JSON string
  coreFunctionality: text("core_functionality").notNull(), // Stored as JSON string
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCodebaseIndexSchema = createInsertSchema(codebaseIndices).pick({
  projectId: true,
  summary: true,
  keyComponents: true,
  coreFunctionality: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertCodebaseIndex = z.infer<typeof insertCodebaseIndexSchema>;
export type CodebaseIndex = typeof codebaseIndices.$inferSelect;
