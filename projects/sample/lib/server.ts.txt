import "server-only";
import { NextRequest } from "next/server";
import { parseQuery, sortNestedObject } from "@/lib/utils";

export const parseBody = async (req: NextRequest) =>
  ["GET", "DELETE", "PUT"].includes(req.method)
    ? {}
    : { ...(await req.json()) };

export const parseRequestQuery = (req) =>
  parseQuery(req.nextUrl.search.slice(1).replaceAll("[]", ""));

export const parseRequest = async (req: NextRequest) =>
  sortNestedObject({
    query: parseRequestQuery(req),
    body: await parseBody(req),
  });
