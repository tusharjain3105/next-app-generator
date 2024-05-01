import { z } from "zod";

const choices = {
  orm: ["prisma", "drizzle"],
  db: ["sqlite", "mongodb", "postgresql", "mysql"],
  dependencies: [
    "react-query",
    "next-themes",
    "shadcn-ui",
    "nextui",
    "next-auth",
    "declarative-routing",
    "@uidotdev/usehooks",
    "@next/mdx",
    "husky",
    "storybook",
  ],
  shadcn: {
    defaultComponents: [
      "button",
      "badge",
      "form",
      "input",
      "label",
      "select",
      "dropdown-menu",
    ],
  },
  nextui: {
    defaultComponents: ["button"],
  },
} as const;

export const createAppSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  orm: z.enum(choices.orm).optional(),
  db: z.enum(choices.db).optional(),
  dependencies: z.array(z.enum(choices.dependencies)),
  shadcnComponents: z.array(z.string()),
  nextuiComponents: z.array(z.string()),
  paths: z.array(
    z.object({
      pathname: z.string(),
      route: z.boolean().optional(),
      layout: z.boolean().optional(),
      page: z.boolean().optional(),
      error: z.boolean().optional(),
      loading: z.boolean().optional(),
      template: z.boolean().optional(),
    })
  ),
});

export type CreateAppSchema = z.infer<typeof createAppSchema>;
