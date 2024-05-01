import apiMiddleware from "@/lib/api-middleware";
import { parse } from "node-html-parser";

export const GET = apiMiddleware(
  async ({ library }) => {
    if (library === "shadcn-ui") {
      const htmlText = await fetch(
        "https://ui.shadcn.com/docs/components"
      ).then((res) => res.text());
      const document = parse(htmlText);
      return [...document.querySelectorAll("h4")]
        ?.find((p) => p.innerText === "Components")
        ?.nextSibling.childNodes.map((p) => p.innerText.replace("New", ""));
    }

    if (library === "nextui") {
      const htmlText = await fetch("https://nextui.org/docs/components").then(
        (res) => res.text()
      );
      const document = parse(htmlText);
      return [
        ...[...document.querySelectorAll("[role=treeitem]")]
          .find((p) => p.innerText.includes("Components"))
          .querySelectorAll("[role=link]"),
      ].map((p) => p.innerText.replace("New", ""));
    }
  },
  {
    revalidate: 86400,
    getCacheArgs(_, { params: { library } }) {
      return {
        library,
      };
    },
  }
);
