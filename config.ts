export const createAppChoices = {
  orm: ["prisma"],
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
