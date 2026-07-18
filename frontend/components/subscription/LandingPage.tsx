import { useState } from 'react';
import {
  Terminal, Layers, Network, Database, Zap, Sparkles, Shield,
  GitBranch, Activity, FileText, ChevronDown, CheckCircle2,
  ArrowRight, Bot, GitCompare
} from 'lucide-react';
import Pricing from './Pricing';
import type { Plan } from '../../lib/subscription/subscription';

interface LandingPageProps {
  onGetStarted: () => void;
  onSelectPlan: (plan: Plan) => void;
}

const features = [
  { icon: Layers, title: 'Architecture Engine', desc: 'Visualize your codebase as interactive dependency graphs, layer views, and metro maps.' },
  { icon: Network, title: 'Route Analysis', desc: 'Trace every API endpoint from HTTP entry through middleware to database.' },
  { icon: Database, title: 'Database Engine', desc: 'Auto-detect ORM, entities, and data flows. Understand schema at a glance.' },
  { icon: Zap, title: 'Impact Analysis', desc: 'See exactly which files break when you change a dependency. Risk-scored.' },
  { icon: Sparkles, title: 'AI Architect', desc: 'Ask questions about any codebase. Get summaries, refactoring tips, onboarding.' },
  { icon: Shield, title: 'Health Diagnostics', desc: 'Detect circular dependencies, dead code, god services, broken imports.' },
  { icon: GitCompare, title: 'Compare Versions', desc: 'Diff two repository snapshots. See added, removed, modified files.' },
  { icon: Bot, title: 'Onboarding Checklist', desc: 'Generated learning paths that guide new developers file by file.' },
];

const faqs = [
  { q: 'How does the free trial work?', a: 'You get 14 days of full access with limits: 3 repositories, 20 AI chats, 10 architecture views, and 5 impact analyses. No credit card required.' },
  { q: 'What are AI tokens?', a: 'Token-based features consume tokens. Repository analysis costs 100 tokens, AI chat costs 10, impact analysis costs 40. Trial gets 500 tokens; Professional gets 100,000 per month.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from the Billing page at any time. You keep access until the end of your current billing period.' },
  { q: 'What is included in Enterprise?', a: 'SSO/SAML, private cloud deployment, API access, audit logs, role management, custom AI models, and priority support. Contact sales for custom pricing.' },
  { q: 'Do you support GitHub repositories?', a: 'Yes. Paste a GitHub URL, upload a ZIP archive, or provide a local path. The engine clones, parses, and analyzes automatically.' },
];

export default function LandingPage({ onGetStarted, onSelectPlan }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-neutral-950/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-400 flex items-center justify-center">
              <Layers size={18} className="text-neutral-950" />
            </div>
            <span className="font-bold text-white text-lg">Archaeologist</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>
          <button
            onClick={onGetStarted}
            className="px-4 py-2 rounded-xl bg-primary text-neutral-950 text-sm font-bold hover:bg-primary-400 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 max-w-6xl mx-auto">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6 hover:border-primary/20 transition">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Repository Intelligence Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
              Understand Any Codebase
            </span>
            <br />
            <span className="text-gradient">In 30 Seconds</span>
          </h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            AST Engine → Graph Engine → Route Engine → Database Engine → Auth Engine → Architecture Engine → AI
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-6 py-3 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition flex items-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </button>
            <a href="#features" className="px-6 py-3 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition">
              Explore Features
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-neutral-600">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> 14-day trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider text-primary uppercase">Features</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4">Eight Engines. One Platform.</h2>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
            Every tool you need to understand, analyze, and onboard onto any codebase.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i} className="border border-white/8 bg-white/3 hover:border-white/15 rounded-2xl p-6 group transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots / Stats */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'AST Parsing', value: '8 langs', icon: Terminal },
            { label: 'Route Detection', value: 'Auto', icon: Network },
            { label: 'AI Analysis', value: 'Real-time', icon: Sparkles },
            { label: 'Graph Rendering', value: 'Interactive', icon: GitBranch },
          ].map((s, i) => (
            <div key={i} className="border border-white/8 bg-white/3 rounded-2xl p-6 text-center">
              <s.icon className="w-6 h-6 text-primary mx-auto mb-3" />
              <div className="text-2xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs text-neutral-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <div id="pricing">
        <Pricing onSelectPlan={onSelectPlan} />
      </div>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider text-primary uppercase">FAQ</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-white/8 bg-white/3 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-semibold text-white">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-neutral-400 leading-relaxed transition-all">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="border-2 border-primary/20 bg-white/3 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to understand your codebase?</h2>
          <p className="text-neutral-500 mb-8">Start your 14-day free trial. No credit card required.</p>
          <button
            onClick={onGetStarted}
            className="px-8 py-3.5 rounded-xl bg-primary text-neutral-950 font-bold text-sm hover:bg-primary-400 transition inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-400 flex items-center justify-center">
              <Layers size={16} className="text-neutral-950" />
            </div>
            <span className="font-bold text-white text-sm">Archaeologist</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-neutral-600">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Security</a>
            <a href="#" className="hover:text-white transition">Docs</a>
          </div>
          <div className="text-xs text-neutral-700">Built with precision for developers</div>
        </div>
      </footer>
    </div>
  );
}
