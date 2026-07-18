"use client";

import { useState } from "react";
import { Check, CreditCard, Crown, Sparkles, X } from "lucide-react";
import { PLAN_CONFIG, type Plan, type UsageKey } from "../../lib/subscription";
import { useSubscription } from "./SubscriptionProvider";

const usageItems: { key: UsageKey; label: string }[] = [{ key: "repositories", label: "Repositories" }, { key: "aiChats", label: "AI chats" }, { key: "tokens", label: "AI tokens" }];

export function SubscriptionPanel() {
  const [open, setOpen] = useState(false);
  const { plan, usage, trialDaysLeft, choosePlan } = useSubscription();
  const config = PLAN_CONFIG[plan];
  return <>
    <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20"><Crown className="h-3.5 w-3.5" /> {config.name}</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Subscription and usage"><div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-zinc-950 p-6 shadow-2xl">
      <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Subscription</p><h2 className="mt-1 text-2xl font-bold text-white">Plan & usage</h2><p className="mt-1 text-sm text-zinc-400">{plan === "trial" ? `${trialDaysLeft} trial days remaining` : `${config.name} plan active`}</p></div><button onClick={() => setOpen(false)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"><X className="h-5 w-5" /></button></div>
      <div className="mb-7 grid gap-3 sm:grid-cols-3">{usageItems.map(({ key, label }) => { const limit = config[key]; const percentage = limit === Infinity ? 0 : Math.min(100, usage[key] / limit * 100); return <div key={key} className="rounded-xl border border-border/60 bg-zinc-900/70 p-4"><p className="text-xs text-zinc-400">{label}</p><p className="mt-1 text-lg font-bold text-white">{usage[key].toLocaleString()} <span className="text-xs font-normal text-zinc-500">/ {limit === Infinity ? "Unlimited" : limit.toLocaleString()}</span></p>{limit !== Infinity && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} /></div>}</div>; })}</div>
      <div className="grid gap-4 md:grid-cols-3">{(Object.keys(PLAN_CONFIG) as Plan[]).map((planKey) => { const item = PLAN_CONFIG[planKey]; const selected = plan === planKey; return <div key={planKey} className={`rounded-xl border p-5 ${selected ? "border-primary bg-primary/5" : "border-border bg-zinc-900/50"}`}><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h3 className="font-bold text-white">{item.name}</h3></div><p className="mt-3 text-2xl font-bold text-white">{item.price === null ? "Custom" : item.price === 0 ? "Free" : `$${item.price}/mo`}</p><p className="mt-3 min-h-12 text-xs leading-relaxed text-zinc-400">{item.description}</p><button disabled={selected} onClick={() => choosePlan(planKey)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-zinc-950 disabled:cursor-default disabled:opacity-50"><Check className="h-3.5 w-3.5" />{selected ? "Current plan" : planKey === "enterprise" ? "Contact sales (demo)" : "Activate plan (demo)"}</button></div>; })}</div>
      <p className="mt-5 flex items-center gap-2 text-xs text-zinc-500"><CreditCard className="h-3.5 w-3.5" /> Checkout is in demo mode. Connect a Stripe server-side Checkout session before accepting real payments.</p>
    </div></div>}
  </>;
}
