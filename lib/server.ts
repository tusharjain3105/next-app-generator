import { parseQuery, sortNestedObject } from "@/lib/utils";
import { NextRequest } from "next/server";
import "server-only";

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
