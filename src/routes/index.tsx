import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, Target, FileCheck2, Bot, Download, ShieldCheck, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen CV — AI CV Optimizer for Every Job" },
      { name: "description", content: "Tailor your CV and cover letter to any job description. ATS scoring, keyword gap analysis, and instant PDF/DOCX exports." },
      { property: "og:title", content: "Lumen CV — AI CV Optimizer" },
      { property: "og:description", content: "Beat the ATS. Land more interviews. AI-optimized CVs in minutes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { theme, toggle } = useTheme();
  return (
    <div className="bg-prestige min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Sparkles className="h-5 w-5 text-gold" /> Lumen CV
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
          <Button asChild><Link to="/auth">Get started</Link></Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border-hairline px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Trained on hundreds of recruiter playbooks
          </div>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
            The CV that <span className="text-gradient-gold">opens doors</span>,
            tailored to the job.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Upload your CV, paste a job description, and get a rewritten résumé and cover letter
            optimized to beat the ATS and impress the hiring manager — in under 60 seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-base shadow-prestige">
              <Link to="/auth">Optimize my CV <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link to="/auth">See a sample report</Link>
            </Button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Free preview · PDF & DOCX downloads · No credit card to start
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3"
        >
          {[
            { label: "ATS match score", value: "92" },
            { label: "Keywords added", value: "+14" },
            { label: "Bullet rewrites", value: "8" },
          ].map((m) => (
            <Card key={m.label} className="border-hairline bg-card/60 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="font-display text-5xl font-bold text-gradient-gold">{m.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{m.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </section>

      <section className="border-t border-hairline bg-background/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold">Everything you need to land the interview</h2>
            <p className="mt-3 text-muted-foreground">A senior recruiter in your pocket — minus the retainer.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { icon: Target, title: "ATS-optimized scoring", desc: "Get a real match score, ATS compatibility score, and the exact keywords you're missing." },
              { icon: Bot, title: "Tailored rewrites", desc: "AI rewrites your summary and experience bullets to match the job's tone, scope, and seniority." },
              { icon: FileCheck2, title: "Cover letter included", desc: "A tailored 300-word cover letter ready to send — no blank-page anxiety." },
              { icon: Download, title: "PDF & DOCX export", desc: "Download a clean, ATS-friendly CV and cover letter in one click." },
              { icon: ShieldCheck, title: "Your data, secure", desc: "Encrypted at rest. Used only to generate your report — never to train models." },
              { icon: Sparkles, title: "Iterate in seconds", desc: "Try multiple job descriptions and compare scores from your dashboard." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-hairline transition-shadow hover:shadow-prestige">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold">Stop guessing what recruiters want.</h2>
          <p className="mt-3 text-muted-foreground">Get your optimized CV in the time it takes to brew coffee.</p>
          <Button asChild size="lg" className="mt-8 h-12 px-8 text-base shadow-prestige">
            <Link to="/auth">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-hairline py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumen CV. Built to help you land the role.
      </footer>
    </div>
  );
}
