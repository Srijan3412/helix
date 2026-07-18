"use client";

import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/api/client";
import { SubscriptionProvider } from "../lib/subscription/SubscriptionContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => queryClient);
  return (
    <SubscriptionProvider>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </SubscriptionProvider>
  );
}
