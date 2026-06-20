import { pgTable, uuid, text, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";

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

export const rolls = pgTable("rolls", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id, { onDelete: "cascade" })
    .notNull(),
  characterId: uuid("character_id")
    .references(() => characters.id, { onDelete: "cascade" }),
  characterName: text("character_name").notNull(),
  poolName: text("pool_name").notNull(),
  resultData: jsonb("result_data").$type<unknown>().notNull(), // Estrutura V5RollResult ou RouseCheckResult
  hungerDice: integer("hunger_dice").default(0).notNull(),
  isRerolled: boolean("is_rerolled").default(false).notNull(),
  isSecret: boolean("is_secret").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sceneTokens = pgTable("scene_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id, { onDelete: "cascade" })
    .notNull(),
  characterId: uuid("character_id")
    .references(() => characters.id, { onDelete: "cascade" }), // Nulo para figurantes rápidos (quick_npc)
  name: text("name").notNull(),
  type: text("type").$type<"player" | "full_npc" | "quick_npc">().notNull(),
  x: integer("x").default(100).notNull(),
  y: integer("y").default(100).notNull(),
  isVisible: boolean("is_visible").default(false).notNull(), // true se estiver dentro do "Palco"
  hasActed: boolean("has_acted").default(false).notNull(),
  quickStats: jsonb("quick_stats").$type<{
    physical: number;
    social: number;
    combat: number;
    health: {
      max: number;
      superficial: number;
      aggravated: number;
    };
  }>() // Nulo se type !== "quick_npc"
});
