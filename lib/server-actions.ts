"use server";

import { CreateAppSchema } from "@/zod-schema";
import { chdir } from "process";
import { slugify } from "./utils";
import { execSync } from "child_process";
import { appendFile, mkdir, pathExists, writeFile } from "fs-extra";
import { readFile } from "fs/promises";

const editFile = async ({
  from = null,
  content = null,
  to,
  placeholder = {},
  prefix = "",
  suffix = "",
}) => {
  if (content === null) from ??= to;
  let data = from ? await readFile(from) : content;
  const dir = to.includes("/") && to.slice(0, to.lastIndexOf("/"));
  if (dir && !(await pathExists(dir)))
    await mkdir(dir, {
      recursive: true,
    });

  if (prefix || suffix || Object.keys(placeholder).length) {
    if (data instanceof Buffer) data = prefix + data.toString() + suffix;
  }

  if (Object.keys(placeholder).length) {
    for (const [key, value] of Object.entries(placeholder)) {
      data = data.replaceAll(key, value);
    }
  }

  await writeFile(to, data);
};

const exec = (
  cmd: string | string[],
  opts: Parameters<typeof execSync>[1] = {
    stdio: process.env.NODE_ENV === "development" ? "inherit" : "ignore",
  }
) => execSync([cmd].flat().join("\n"), opts);

const addEnv = async (obj, fileName = ".env.local", numberOfLinesAtEnd = 1) => {
  const env =
    Object.entries(obj)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") +
    Array(numberOfLinesAtEnd + 2)
      .fill("")
      .join("\n");

  await appendFile(fileName, env);

  // const content = readFileSync("../sample/config.ts.txt").toString();
  // const idx = content.indexOf("// Define Schema");
  // const envObj =
  //   Object.keys(obj)
  //     .map((key) =>
  //       content.includes(`${key}:`)
  //         ? ""
  //         : `${key}: ${typeof key === "string" ? "z.string()" : "z.number()"},`
  //     )
  //     .join("\n") + "\n\n";

  // const finalContent = content.split("");
  // finalContent.splice(idx, 0, envObj);

  // editFile({
  //   content: finalContent.join(""),
  //   to: "config.ts",
  // });
};

export const createApp = async (props: CreateAppSchema) => {
  const ROOT_DIR = process.env.PWD;
  try {
    const {
      title,
      db,
      orm,
      description,
      dependencies,
      nextuiComponents,
      shadcnComponents,
    } = props;
    const projectName = slugify(title);
    chdir("projects");

    if (await pathExists(projectName))
      throw new Error("Project already exists");

    // Generate Project
    exec(
      `bun x create-next-app@latest ${projectName} --use-bun --ts --tailwind --eslint --app --no-src-dir --import-alias @/*`
    );
    chdir(projectName);

    // Add ENV
    addEnv(
      {
        NEXT_PUBLIC_SITE_URL: "",
      },
      ".env"
    );
    addEnv({
      NEXT_PUBLIC_SITE_URL: "localhost:3000",
    });

    // Install Dependencies
    const commands = ["bun add server-only client-only lodash zod"];

    // Setup less Dependencies
    const directDeps = dependencies.filter(
      (p) =>
        !["nextui", "shadcn-ui", "next-auth", "@next/mdx", "husky"].includes(p)
    );
    if (directDeps.length)
      commands.push(
        `bun add ${directDeps
          .filter(
            (p) =>
              ![
                "nextui",
                "shadcn-ui",
                "next-auth",
                "@next/mdx",
                "husky",
              ].includes(p)
          )
          .join(" ")}`
      );

    if (orm === "prisma") {
      commands.push("bun x prisma init", "bun add -D @prisma/client");
    }

    if (dependencies.includes("nextui") && nextuiComponents.length) {
      commands.push(
        `bun x nextui-cli@latest add ${nextuiComponents.map((p) => slugify(p)).join(" ")}`
      );
    }

    if (dependencies.includes("shadcn-ui")) {
      commands.push("bun x shadcn-ui init");
      if (shadcnComponents.length) {
        commands.push(
          `bun x shadcn-ui@latest add ${shadcnComponents.map((p) => slugify(p)).join(" ")}`
        );
      }
    }

    if (dependencies.includes("next-auth")) {
      commands.push("bun add next-auth@beta");
    }

    if (dependencies.includes("@next/mdx")) {
      commands.push(
        "bun add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx"
      );
    }

    if (dependencies.includes("husky")) {
      commands.push("bun add -D husky", "bun x husky init");
    }

    if (dependencies.includes("storybook")) {
      commands.push("bun x storybook init");
    }

    if (dependencies.includes("declarative-routing")) {
      commands.push(
        "bun x declarative-routing init",
        "bun x declarative-routing build"
      );
    }

    exec(commands);
    // await this.addPrisma(args);
    // await this.addNextUI(args);
    // await this.addShadcnUI(args);
    // await this.addNextThemes(args);
    // await this.addAuth(args);
    // await this.addMDX(args);
    // await this.addHusky(args);
    // await this.addStorybook(args);
    // await this.addDeclarativeRouting(args);

    // Prettify & Commit
    exec([
      "bun x prettier -w .",
      "git add .",
      "git commit -m 'Initial Commit'",
    ]);
    console.log(`Project '${projectName}' created successfully!`);
  } finally {
    chdir(ROOT_DIR);
  }
};

// const cli = {
//   args: null as CreateAppSchema,

//   async init(args: CreateAppSchema) {
//     this.designDirectoryStructure();

//     this.addEnv(
//       {
//         NEXT_PUBLIC_SITE_URL: "",
//       },
//       ".env"
//     );
//     this.addEnv({
//       NEXT_PUBLIC_SITE_URL: "localhost:3000",
//     });

//     await this.addDependencies();

//     this.editFile({
//       from: paths.sample.landingPage,
//       to: paths.project.homepage,
//     });

//     rmSync(paths.project.defaultHomepage);
//   },

//   async editFile({
//     from,
//     content,
//     to,
//     placeholder = {},
//     prefix = "",
//     suffix = "",
//   }) {
//     if (content === undefined) from ??= to;
//     let data = from ? readFileSync(from) : content;
//     const dir = to.includes("/") && to.slice(0, to.lastIndexOf("/"));
//     if (dir && !this.exists(dir))
//       mkdirSync(dir, {
//         recursive: true,
//       });

//     if (prefix || suffix || Object.keys(placeholder).length) {
//       if (data instanceof Buffer) data = prefix + data.toString() + suffix;
//     }

//     if (Object.keys(placeholder).length) {
//       for (const [key, value] of Object.entries(placeholder)) {
//         data = data.replaceAll(key, value);
//       }
//     }

//     writeFileSync(to, data);
//   },

//   addEnv(obj, fileName = this.paths.project.localEnv, numberOfLinesAtEnd = 1) {
//     const env =
//       Object.entries(obj)
//         .map(([k, v]) => `${k}=${v}`)
//         .join("\n") +
//       Array(numberOfLinesAtEnd + 2)
//         .fill("")
//         .join("\n");

//     appendFileSync(fileName, env);

//     const content = readFileSync("../sample/config.ts.txt").toString();
//     const idx = content.indexOf("// Define Schema");
//     const envObj =
//       Object.keys(obj)
//         .map((key) =>
//           content.includes(`${key}:`)
//             ? ""
//             : `${key}: ${typeof key === "string" ? "z.string()" : "z.number()"},`
//         )
//         .join("\n") + "\n\n";

//     const finalContent = content.split("");
//     finalContent.splice(idx, 0, envObj);

//     this.editFile({
//       content: finalContent.join(""),
//       to: "config.ts",
//     });
//   },

//   exists: (path) => existsSync(path),

//   exec: (
//     cmd,
//     opts: Parameters<typeof execSync>[1] = {
//       stdio: "inherit",
//     }
//   ) => execSync([cmd].flat().join("\n"), opts),

//   async addDependencies(args = this.args) {
//     await this.addMustHaveDependencies();
//     await this.addPrisma(args);
//     await this.addNextUI(args);
//     await this.addShadcnUI(args);
//     await this.addNextThemes(args);
//     await this.addAuth(args);
//     await this.addMDX(args);
//     await this.addHusky(args);
//     await this.addStorybook(args);
//     await this.addDeclarativeRouting(args);
//     const dependencies = args.dependencies.filter(
//       (p) =>
//         ![
//           "nextui",
//           "shadcn-ui",
//           "next-themes",
//           "next-auth",
//           "@next/mdx",
//           "husky",
//         ].includes(p)
//     );
//     if (dependencies.length) this.exec(`bun add ${dependencies.join(" ")}`);
//   },

//   async addStorybook(args = this.args) {
//     if (args.dependencies.includes("storybook")) {
//       this.exec("bun x storybook init");
//     }
//   },

//   async addHusky(args = this.args) {
//     if (args.dependencies.includes("husky")) {
//       this.exec("bun x husky init");
//       this.editFile({
//         to: ".husky/pre-commit",
//         prefix: "git add .\n",
//       });
//       this.editFile({
//         to: "package.json",
//         placeholder: {
//           husky: "bun x husky",
//         },
//       });
//     }
//   },

//   async addDeclarativeRouting(args = this.args) {
//     if (args.dependencies.includes("declarative-routing")) {
//       this.exec("bun x declarative-routing init");
//       this.exec("bun x declarative-routing build");
//     }
//   },

//   async addPrisma(args = this.args) {
//     if (args.orm === "prisma") {
//       logger.info("Initializing Prisma...");
//       this.exec(["bun x prisma init", "bun add -D @prisma/client"]);

//       this.editFile({
//         from: paths.sample.prisma.prisma,
//         to: paths.project.prisma.prisma,
//       });

//       this.editFile({
//         to: paths.project.prisma.schema,
//         placeholder: {
//           postgresql: args.db,
//         },
//       });

//       if (args.db === "sqlite") {
//         this.addEnv(
//           {
//             DATABASE_URL: "file:./dev.db",
//           },
//           ".env"
//         );
//       }
//     }
//   },

//   async addShadcnUI(args = this.args) {
//     if (args.dependencies.includes("shadcn-ui")) {
//       logger.info("Initializing Shadcn-UI...");

//       this.exec("bun x shadcn-ui@latest init");

//       const dependencies = args.default ? choices.shadcn.defaultComponents : [];

//       this.exec(`bun x shadcn-ui add ${dependencies.join(" ").toLowerCase()}`);

//       logger.success("Initialized Shadcn-UI");
//     }
//   },

//   async addNextUI(args = this.args) {
//     if (args.dependencies.includes("nextui")) {
//       logger.info("Initializing NextUI...");

//       const dependencies = args.default ? choices.nextui.defaultComponents : [];

//       this.exec(
//         `bun x nextui-cli@latest add ${dependencies.join(" ").toLowerCase()}`
//       );

//       logger.success("Initialized NextUI");
//     }
//   },

//   async addNextThemes(args = this.args) {
//     if (args.dependencies.includes("next-themes")) {
//       logger.info("Initializing Next Themes...");
//       this.exec("bun add next-themes");

//       this.editFile({
//         from: paths.sample.theme.provider,
//         to: paths.project.theme.provider,
//       });

//       this.editFile({
//         from: paths.project.layout,
//         to: paths.project.layout,
//         placeholder: {
//           "{children}": "<ThemeProvider>{children}</ThemeProvider>",
//         },
//         prefix:
//           'import { ThemeProvider } from "@/components/providers/theme-provider"\n',
//       });

//       // check shadcn-ui theme-toggler
//       if (this.exists("components.json")) {
//         if (!this.exists("components/ui/dropdown-menu.tsx")) {
//           this.exec("bun x shadcn-ui add dropdown-menu");
//         }

//         this.editFile({
//           from: paths.sample.theme.toggler,
//           to: paths.project.theme.toggler,
//         });
//       }
//     }
//   },

//   async addAuth(args = this.args) {
//     if (args.dependencies.includes("next-auth")) {
//       this.exec("bun add next-auth@beta");
//       this.editFile({
//         from: paths.sample.auth.middleware,
//         to: paths.project.middleware,
//       });
//       this.editFile({
//         from: paths.sample.auth.config,
//         to: paths.project.auth.config,
//       });
//       this.editFile({
//         from: paths.sample.auth.auth,
//         to: paths.project.auth.auth,
//       });
//       this.editFile({
//         from: paths.sample.auth.nextApiRoute,
//         to: paths.project.auth.nextApiRoute,
//       });

//       if (args.orm === "prisma") {
//         this.editFile({
//           from:
//             args.db === "mongodb"
//               ? paths.sample.auth.authPrismaMongoDB
//               : paths.sample.auth.authPrisma,
//           to: paths.project.prisma.schema,
//         });
//         this.exec("bun x prisma generate");
//       }

//       this.addEnv({
//         AUTH_SECRET: execSync("openssl rand -base64 33")
//           .toString()
//           .slice(0, -1),
//         AUTH_GITHUB_ID: "AUTH_GITHUB_ID",
//         AUTH_GITHUB_SECRET: "AUTH_GITHUB_SECRET",
//         AUTH_GOOGLE_ID: "AUTH_GOOGLE_ID",
//         AUTH_GOOGLE_SECRET: "AUTH_GOOGLE_SECRET",
//       });
//     }
//   },

//   async addMDX(args = this.args) {
//     if (args.dependencies.includes("mdx")) {
//       this.exec("bun add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx");
//       this.editFile({
//         from: "../sample/mdx-next.config.js.txt",
//         to: "next.config.mjs",
//       });
//       this.editFile({
//         from: "../sample/mdx-eslintrc.json",
//         to: "eslintrc.json",
//       });
//       this.editFile({
//         from: "../sample/mdx-components.tsx.txt",
//         to: "mdx-components.tsx",
//       });
//       this.editFile({
//         from: "../sample/mdx-page.mdx",
//         to: "app/(main)/mdx-page/page.mdx",
//       });
//     }
//   },

//   async designDirectoryStructure() {
//     this.editFile({ to: "lib/server-actions.ts", content: '"use server";' });
//     this.editFile({
//       from: "../sample/lib/server.ts.txt",
//       to: "lib/server.ts",
//     });
//     this.editFile({ to: "lib/client.ts", content: 'import "client-only";' });
//     this.editFile({ from: "../sample/error.tsx.txt", to: "app/error.tsx" });
//     this.editFile({ from: "../sample/config.ts.txt", to: "config.ts" });
//     this.editFile({ content: "", to: "types.ts" });
//     this.editFile({
//       from: "../sample/api-middleware.ts.txt",
//       to: "lib/api-middleware.ts",
//     });
//     this.editFile({
//       from: "../sample/lib/utils.ts",
//       to: "lib/utils.ts",
//       prefix: this.exists("lib/utils.ts")
//         ? readFileSync("lib/utils.ts").toString() + "\n\n"
//         : "",
//     });
//     this.exec("rm public/*");
//   },

//   async addMustHaveDependencies() {
//     this.exec("bun add server-only client-only lodash zod");
//   },
// };

const choices = {
  orm: ["No ORM", "prisma", "drizzle"],
  db: ["No DB", "sqlite", "mongodb", "postgresql", "mysql"],
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
};

const paths = {
  sample: {
    landingPage: "app/page.tsx",
    prisma: {
      prisma: "../sample/prisma.ts.txt",
    },
    auth: {
      authPrisma: "../sample/auth-prisma.schema.txt",
      authPrismaMongoDB: "../sample/mongodb-auth-prisma.schema.txt",
      middleware: "../sample/middleware.ts.txt",
      config: "../sample/lib/auth.config.ts.txt",
      auth: "../sample/lib/auth.ts.txt",
      nextApiRoute: "../sample/nextauth-route.ts.txt",
    },
    theme: {
      provider: "../sample/theme-provider.tsx.txt",
      toggler: "../sample/theme-toggler.tsx.txt",
    },
  },
  sample1: {
    landingPage: "../sample/landing-page.tsx.txt",
    prisma: {
      prisma: "../sample/prisma.ts.txt",
    },
    auth: {
      authPrisma: "../sample/auth-prisma.schema.txt",
      authPrismaMongoDB: "../sample/mongodb-auth-prisma.schema.txt",
      middleware: "../sample/middleware.ts.txt",
      config: "../sample/lib/auth.config.ts.txt",
      auth: "../sample/lib/auth.ts.txt",
      nextApiRoute: "../sample/nextauth-route.ts.txt",
    },
    theme: {
      provider: "../sample/theme-provider.tsx.txt",
      toggler: "../sample/theme-toggler.tsx.txt",
    },
  },
  project: {
    localEnv: ".env.local",
    env: ".env",
    layout: "app/layout.tsx",
    homepage: "app/(main)/page.tsx",
    defaultHomepage: "app/page.tsx",
    prisma: {
      prisma: "prisma/prisma.ts",
      schema: "prisma/schema.prisma",
    },
    theme: {
      provider: "components/providers/theme-provider.tsx",
      toggler: "components/buttons/theme-toggler.tsx",
    },
    middleware: "middleware.ts",
    auth: {
      config: "lib/auth.config.ts",
      auth: "lib/auth.ts",
      nextApiRoute: "app/api/[...nextauth]/route.ts",
    },
  },
};

const logger = {
  error: (err, ...props) => {
    if (err instanceof Error) err = err.message;
    console.error(`❌ ${err}`, ...props);
  },
  info: (msg, ...props) => {
    console.info(`ℹ️ ${msg}`, ...props);
  },
  success: (msg, ...props) => {
    console.info(`✅ ${msg}`, ...props);
  },
  warn: (msg, ...props) => {
    console.warn(`⚠️ ${msg}`, ...props);
  },
};
