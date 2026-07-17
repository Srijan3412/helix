"use client";

import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/api/client";
import { SubscriptionProvider } from "../components/subscription/SubscriptionProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => queryClient);
  return (
    <QueryClientProvider client={client}>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </QueryClientProvider>
  );
}
