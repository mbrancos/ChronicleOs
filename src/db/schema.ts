import { pgTable, uuid, text, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // UUID associado ao Neon Auth
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").$type<"user" | "admin">().default("user").notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  narratorId: uuid("narrator_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description"),
});

export const characters = pgTable("characters", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // Proteger contra exclusão: vira NPC sob controle do Narrador
  name: text("name").notNull(),
  type: text("type").$type<"jogador" | "npc" | "coterie">().notNull(),
  sheetData: jsonb("sheet_data").notNull(), // Tipo JSONB rígido para a ficha reativa
});
