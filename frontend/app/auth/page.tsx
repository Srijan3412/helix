"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthPage from "../../components/subscription/AuthPage";
import { Loader2 } from "lucide-react";

function AuthPageContent() {
  const searchParams = useSearchParams();
  const rawMode = searchParams.get("mode");
  const email = searchParams.get("email") || "";
  const userId = searchParams.get("userId") || "";

  let mode: 'signin' | 'signup' | 'verify-otp' = 'signup';
  if (rawMode === 'signin') mode = 'signin';
  if (rawMode === 'verify-otp') mode = 'verify-otp';

  return (
    <AuthPage
      initialMode={mode}
      initialEmail={email}
      initialUserId={userId}
    />
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
          <div className="flex items-center gap-3 text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-mono">Loading authentication…</span>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
