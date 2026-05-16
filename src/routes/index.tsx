import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, AlertTriangle, Scale, ThumbsUp, ThumbsDown, Scroll, Loader2, Brain } from "lucide-react";
import { analyzeIdea } from "@/lib/analyze.functions";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Devil's Advocate AI — Stress-test your ideas" },
      {
        name: "description",
        content:
          "Share an idea or opinion and get supporting arguments, opposing views, real-world concerns, social impact, and a balanced take — in plain, conversational language.",
      },
    ],
  }),
});

type Section = {
  key: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  paragraphs: string[];
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  support: ThumbsUp,
  oppose: ThumbsDown,
  real: AlertTriangle,
  ethics: Scale,
  balanced: Scroll,
};
const ACCENTS: Record<string, string> = {
  support: "from-emerald-100 to-emerald-50 text-emerald-700",
  oppose: "from-rose-100 to-rose-50 text-rose-700",
  real: "from-amber-100 to-amber-50 text-amber-700",
  ethics: "from-sky-100 to-sky-50 text-sky-700",
  balanced: "from-indigo-100 to-indigo-50 text-indigo-700",
};

function Index() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<Section[] | null>(null);
  const analyze = useServerFn(analyzeIdea);

  const handleAnalyze = async () => {
    if (!idea.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await analyze({ data: { idea: idea.trim() } });
      const sections: Section[] = result.sections.map((s) => ({
        key: s.key,
        title: s.title,
        icon: ICONS[s.key] ?? Sparkles,
        accent: ACCENTS[s.key] ?? "from-slate-100 to-slate-50 text-slate-700",
        paragraphs: s.paragraphs,
      }));
      setResponse(sections);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[oklch(0.985_0.005_250)] via-[oklch(0.97_0.01_260)] to-[oklch(0.985_0.005_250)] text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/60 border-b border-white/40">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 grid place-items-center shadow-sm">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight">Devil's Advocate AI</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#analyze" className="hover:text-foreground transition">Try it</a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Sharpen every decision before you commit
        </div>
        <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
          Stress-test your ideas with an{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-rose-500 bg-clip-text text-transparent">
            honest opponent
          </span>
          .
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
          Paste an idea, opinion, startup concept, or decision. Get instant counterarguments,
          risks, ethical concerns, and alternative perspectives — so you can think clearly before
          you act.
        </p>
      </section>

      {/* Input card */}
      <section id="analyze" className="max-w-3xl mx-auto px-6 pb-12">
        <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(30,30,80,0.25)] p-5 sm:p-6">
          <label className="block text-sm font-medium text-foreground/80 mb-2">
            Your idea or decision
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. I want to launch a subscription app that helps remote teams run async standups…"
            rows={5}
            className="w-full resize-none rounded-2xl border border-border bg-white/80 px-4 py-3 text-[15px] leading-relaxed placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-indigo-400/50 transition"
          />
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              The AI will argue the opposite side — not because you're wrong, but to make you stronger.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={!idea.trim() || loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-rose-500 px-5 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Analyze Idea
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-white/60 bg-white/60 backdrop-blur p-6 animate-pulse"
              >
                <div className="h-4 w-40 bg-muted rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-5/6 bg-muted rounded" />
                  <div className="h-3 w-4/6 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {response && (
          <div className="space-y-4">
            {response.map((section, idx) => {
              const Icon = section.icon;
              return (
                <article
                  key={section.key}
                  style={{ animationDelay: `${idx * 90}ms` }}
                  className="opacity-0 animate-[fadeUp_0.5s_ease-out_forwards] rounded-3xl border border-white/60 bg-white/75 backdrop-blur-xl shadow-[0_10px_40px_-24px_rgba(30,30,80,0.25)] p-6 sm:p-7"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${section.accent} grid place-items-center`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
                  </div>
                  <div className="space-y-3">
                    {section.paragraphs.map((p, i) => (
                      <p
                        key={i}
                        className="text-[15px] leading-relaxed text-foreground/85"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !response && (
          <div
            id="how"
            className="grid sm:grid-cols-3 gap-4 mt-4"
          >
            {[
              { t: "1. Share your idea", d: "Drop a concept, plan, or opinion in plain language." },
              { t: "2. Get challenged", d: "Counterarguments, risks, ethics, and alternatives." },
              { t: "3. Decide better", d: "Walk away with a sharper, stronger version of your idea." },
            ].map((s) => (
              <div
                key={s.t}
                className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur p-5"
              >
                <div className="text-sm font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/50 bg-white/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Devil's Advocate AI</p>
          <p>Built to make your thinking stronger.</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
