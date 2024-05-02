import { z } from "zod";

export const Route = {
  name: "ApiComponentsLibrary",
  params: z.object({
    library: z.string(),
  })
};

