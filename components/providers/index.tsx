"use client";

import { queryClient } from "@/lib/utils";
import { PropsWithChildren } from "react";
import { QueryClientProvider } from "react-query";

const Providers = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
export default Providers;
