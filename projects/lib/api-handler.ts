import "server-only";
import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { serialize } from "@/lib/utils";
import { env } from "@/env";
import { parseRequest } from "./server";

const apiHandler =
  <T1 = any, T2 = any>(
    cb:
      | ((cacheData: any) => T1 | Promise<T1>)
      | ((
          req: NextRequest,
          { params, query, body, revalidationKey }
        ) => T1 | Promise<T1>),
    {
      revalidate = false,
      dynamic = true,
      getCacheArgs = null,
      getRevalidationKey,
      responseMiddleware,
    }: {
      revalidate?: number | false;
      dynamic?: boolean;
      getCacheArgs?: (
        req: NextRequest,
        { params, query, body }
      ) => Promise<T2> | T2;
      getRevalidationKey?:
        | string
        | string[]
        | ((cacheArgs: T2) => string | string[]);
      responseMiddleware?: (data: T1, cacheArgs: T2) => any;
    } = {}
  ) =>
  async (req: NextRequest, data: { params; query; body; revalidationKey }) => {
    try {
      if (dynamic) {
        const { query, body } = await parseRequest(req);
        data.body = body;
        data.query = query;
        Object.assign(data, { query, body });
      }

      const cacheArgs = await getCacheArgs?.(req, data);
      const revalidationKey =
        getRevalidationKey instanceof Function
          ? getRevalidationKey(cacheArgs)
          : getRevalidationKey;

      let results;
      data.revalidationKey = serialize(
        [revalidationKey ?? [(req.method, req.url)]].flat()
      );

      if (
        revalidate &&
        (env.NODE_ENV === "production" || env.NODE_ENV === "development")
      ) {
        const key = Array.isArray(data.revalidationKey)
          ? data.revalidationKey.map((value) =>
              typeof value === "string" ? value : JSON.stringify(value)
            )
          : [JSON.stringify(data.revalidationKey)];

        results = await unstable_cache(
          (_data) =>
            // @ts-expect-error
            _data
              ? cb({ ..._data, revalidationKey }, undefined)
              : cb(req, _data || data),
          key,
          {
            revalidate: revalidate === Infinity ? false : revalidate,
            tags: key,
          }
        )(cacheArgs);
      } else {
        results = await (cacheArgs
          ? cb(cacheArgs as any, undefined)
          : cb(req, data));
      }

      if (results instanceof NextResponse) return results;

      if (typeof results === "string") {
        results = { message: results };
      }

      if (results?.json instanceof Function) results = await results.json();

      if (responseMiddleware)
        results = await responseMiddleware(results, cacheArgs);

      return NextResponse.json(
        results ?? {
          message: "No Response",
        }
      );
    } catch (e) {
      // if (dynamic) {
      return NextResponse.json(e.message && { error: e.message }, {
        status: e.statusCode || 500,
      });
      // }
    }
  };

export default apiHandler;
