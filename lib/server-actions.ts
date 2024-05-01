"use server";

import { CreateAppSchema } from "@/zod-schema";
import { chdir } from "process";
import { slugify } from "./utils";
import { execSync } from "child_process";
import { appendFile, copy, mkdir, pathExists, writeFile } from "fs-extra";
import { readFile } from "fs/promises";

const fileStructure = async (props: CreateAppSchema) => {
  const { paths, title, description } = props;
  await copy("../lib", "lib");

  await Promise.all(
    paths.map(async (path) => {
      const pathname = `/${path.pathname.trim()}`.replace("//", "/");
      if (pathname) {
        if (path.route) {
          await editFile({
            from: `../sample/route.ts`,
            to: `app${pathname}/route.ts`,
          });
        } else {
          if (path.page) {
            await editFile({
              from: `../sample/page.tsx`,
              to: `app${pathname}/page.tsx`,
            });
          }
          if (path.loading) {
            await editFile({
              from: `../sample/page.tsx`,
              to: `app${pathname}/loading.tsx`,
            });
          }
          if (path.layout) {
            await editFile({
              from: `../sample/layout.tsx`,
              to: `app${pathname}/layout.tsx`,
            });
          }
          if (path.template) {
            await editFile({
              from: `../sample/layout.tsx`,
              to: `app${pathname}/template.tsx`,
            });
          }
          if (path.error) {
            await editFile({
              from: `../sample/error.tsx`,
              to: `app${pathname}/error.tsx`,
            });
          }
        }
      }
    })
  );

  await editFile({ from: "../../error.ts", to: "error.ts" });
  await editFile({
    to: "app/layout.tsx",
    placeholder: {
      "Create Next App": title,
      "Generated by create next app": description,
    },
  });

  // Blank Files
  await Promise.all(
    ["types.ts", "zod-schema.ts", "config.ts"].map((to) =>
      editFile({ content: "", to })
    )
  );

  await exec("rm public/*");
};

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

const exec = async (
  cmd: string | string[],
  opts: Parameters<typeof execSync>[1] = {
    stdio: process.env.NODE_ENV === "development" ? "inherit" : "ignore",
  }
) => {
  return execSync([cmd].flat().join("\n"), opts);
};

const addEnv = async (
  obj: Record<string, string | number>,
  fileName = ".env.local",
  numberOfLinesAtEnd = 1
) => {
  const env =
    `\n` +
    Object.entries(obj)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") +
    Array(numberOfLinesAtEnd + 2)
      .fill("")
      .join("\n");

  await appendFile(fileName, env);

  const content = (await readFile("../sample/config.ts.txt")).toString();
  const idx = content.indexOf("// Define Schema");
  const envObj =
    Object.keys(obj)
      .map((key) =>
        content.includes(`${key}:`)
          ? ""
          : `${key}: ${typeof key === "string" ? "z.string()" : "z.number()"},`
      )
      .join("\n") + "\n\n";

  const finalContent = content.split("");
  finalContent.splice(idx, 0, envObj);

  editFile({
    content: finalContent.join(""),
    to: "config.ts",
  });
};

export const createApp = async (props: CreateAppSchema) => {
  return new Promise(async (res, rej) => {
    const ROOT_DIR = process.env.PWD;
    try {
      const {
        title,
        db,
        orm,
        dependencies,
        nextuiComponents,
        shadcnComponents,
      } = props;
      const projectName = slugify(title);
      chdir("projects");

      if (await pathExists(projectName))
        throw new Error("Project already exists");

      // Generate Project
      await exec(
        `bun x create-next-app@latest ${projectName} --use-bun --ts --tailwind --eslint --app --no-src-dir --import-alias @/*`
      );
      chdir(projectName);

      // Add ENV
      await addEnv(
        {
          NEXT_PUBLIC_SITE_URL: "",
        },
        ".env"
      );

      await addEnv({
        NEXT_PUBLIC_SITE_URL: "localhost:3000",
      });

      // Install Dependencies
      const commands = ["bun add server-only client-only lodash zod"];

      // Setup less Dependencies
      const directDeps = dependencies.filter(
        (p) =>
          !["nextui", "shadcn-ui", "next-auth", "@next/mdx", "husky"].includes(
            p
          )
      );

      if (directDeps.length) {
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
      }

      if (orm === "prisma") {
        exec(["bun x prisma init", "bun add -D @prisma/client"]);
        await editFile({
          from: paths.sample.prisma.prisma,
          to: paths.project.prisma.prisma,
        });
        await editFile({
          placeholder: {
            postgresql: db,
          },
          to: paths.project.prisma.schema,
        });
        if (db === "sqlite") {
          await addEnv(
            {
              DATABASE_URL: "file:./dev.db",
            },
            ".env"
          );
        }
      }

      if (dependencies.includes("nextui") && nextuiComponents.length) {
        commands.push(
          `bun x nextui-cli@latest add ${nextuiComponents.map((p) => slugify(p)).join(" ")}`
        );
      }

      if (dependencies.includes("shadcn-ui")) {
        await exec("bun x shadcn-ui@latest init");
        if (shadcnComponents.length) {
          commands.push(
            `bun x shadcn-ui@latest add ${shadcnComponents.map((p) => slugify(p)).join(" ")}`
          );
        }
      }

      if (dependencies.includes("next-auth")) {
        await exec("bun add next-auth@beta");
        await editFile({
          from: paths.sample.auth.middleware,
          to: paths.project.middleware,
        });
        await editFile({
          from: paths.sample.auth.config,
          to: paths.project.auth.config,
        });
        await editFile({
          from: paths.sample.auth.auth,
          to: paths.project.auth.auth,
        });
        await editFile({
          from: paths.sample.auth.nextApiRoute,
          to: paths.project.auth.nextApiRoute,
        });

        if (orm === "prisma") {
          await editFile({
            from:
              db === "mongodb"
                ? paths.sample.auth.authPrismaMongoDB
                : paths.sample.auth.authPrisma,
            to: paths.project.prisma.schema,
          });
          await exec("bun x prisma generate");
        }

        await addEnv({
          AUTH_SECRET: execSync("openssl rand -base64 33")
            .toString()
            .slice(0, -1),
          AUTH_GITHUB_ID: "AUTH_GITHUB_ID",
          AUTH_GITHUB_SECRET: "AUTH_GITHUB_SECRET",
          AUTH_GOOGLE_ID: "AUTH_GOOGLE_ID",
          AUTH_GOOGLE_SECRET: "AUTH_GOOGLE_SECRET",
        });
      }

      if (dependencies.includes("@next/mdx")) {
        await exec("bun add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx");
        await editFile({
          from: "../sample/mdx-next.config.js.txt",
          to: "next.config.mjs",
        });
        await editFile({
          from: "../sample/mdx-eslintrc.json",
          to: "eslintrc.json",
        });
        await editFile({
          from: "../sample/mdx-components.tsx.txt",
          to: "mdx-components.tsx",
        });
        await editFile({
          from: "../sample/mdx-page.mdx",
          to: "app/(main)/mdx-page/page.mdx",
        });
      }

      if (dependencies.includes("husky")) {
        await exec("bun add husky");
        await editFile({
          to: ".husky/pre-commit",
          content: "git add .\n",
        });
        await editFile({
          to: "package.json",
        });
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

      if (dependencies.includes("next-themes")) {
        await editFile({
          from: paths.sample.theme.provider,
          to: paths.project.theme.provider,
        });

        await editFile({
          from: paths.project.layout,
          to: paths.project.layout,
          placeholder: {
            "{children}": "<ThemeProvider>{children}</ThemeProvider>",
          },
          prefix:
            'import { ThemeProvider } from "@/components/providers/theme-provider"\n',
        });

        // check shadcn-ui theme-toggler
        if (await pathExists("components.json")) {
          if (!(await pathExists("components/ui/dropdown-menu.tsx"))) {
            await exec("bun x shadcn-ui add dropdown-menu");
          }

          await editFile({
            from: paths.sample.theme.toggler,
            to: paths.project.theme.toggler,
          });
        }
      }

      await exec(commands);

      await fileStructure(props);

      // Prettify & Commit
      await exec("bun x prettier -w .");
      // await exec("git add .");
      // await exec("git commit -m 'Initial Commit'");
      console.log(`Project '${projectName}' created successfully!`);
    } catch (e) {
      rej(e);
    } finally {
      chdir(ROOT_DIR);
      return res("App is created successfully");
    }
  });
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
