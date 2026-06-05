import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, FileText, Mail, ArrowLeft, FileType2 } from "lucide-react";
import { downloadCvPdf, downloadCvDocx, downloadCoverLetterPdf, downloadCoverLetterDocx, type OptimizedDocs } from "@/lib/generate-docs";

export const Route = createFileRoute("/_authenticated/results/$id")({
  component: ResultsPage,
});

type Row = {
  id: string;
  job_title: string | null;
  job_company: string | null;
  match_score: number;
  ats_score: number;
  missing_keywords: string[];
  recommended_skills: string[];
  optimized_summary: string | null;
  improved_experience: string[];
  cover_letter: string | null;
  created_at: string;
};

function ResultsPage() {
  const { id } = useParams({ from: "/_authenticated/results/$id" });
  const [row, setRow] = useState<Row | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.from("analysis_results").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error || !data) setNotFound(true);
      else setRow(data as Row);
    });
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Analysis not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may have been deleted.</p>
        <Button asChild className="mt-6"><Link to="/_authenticated/dashboard">Back to dashboard</Link></Button>
      </div>
    );
  }
  if (!row) return <div className="px-4 py-10 text-sm text-muted-foreground">Loading…</div>;

  const docs: OptimizedDocs = {
    jobTitle: row.job_title ?? undefined,
    company: row.job_company ?? undefined,
    optimizedSummary: row.optimized_summary || "",
    improvedExperience: row.improved_experience || [],
    recommendedSkills: row.recommended_skills || [],
    coverLetter: row.cover_letter || "",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/_authenticated/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
      </Button>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          {row.job_title || "Untitled role"}{row.job_company ? ` — ${row.job_company}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Optimization report</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <ScoreCard label="Match score" value={row.match_score} desc="How well your CV aligns with the JD." />
        <ScoreCard label="ATS score" value={row.ats_score} desc="How parser-friendly your CV is." />
        <Card className="border-hairline shadow-prestige">
          <CardHeader>
            <CardTitle className="font-display text-base">Downloads</CardTitle>
            <CardDescription>Get your optimized documents.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCvPdf(docs)}><Download className="mr-2 h-3 w-3" /> CV (PDF)</Button>
            <Button variant="outline" size="sm" onClick={() => downloadCvDocx(docs)}><FileType2 className="mr-2 h-3 w-3" /> CV (DOCX)</Button>
            <Button variant="outline" size="sm" onClick={() => downloadCoverLetterPdf(docs)}><Mail className="mr-2 h-3 w-3" /> Letter (PDF)</Button>
            <Button variant="outline" size="sm" onClick={() => downloadCoverLetterDocx(docs)}><Mail className="mr-2 h-3 w-3" /> Letter (DOCX)</Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-hairline">
          <CardHeader>
            <CardTitle className="font-display text-base">Missing keywords</CardTitle>
            <CardDescription>Add these where they're true to your experience.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {row.missing_keywords.length === 0 ? <span className="text-sm text-muted-foreground">None — great coverage!</span>
              : row.missing_keywords.map((k) => (<Badge key={k} variant="secondary" className="bg-gold/15 text-gold-foreground">{k}</Badge>))}
          </CardContent>
        </Card>

        <Card className="border-hairline">
          <CardHeader>
            <CardTitle className="font-display text-base">Recommended skills</CardTitle>
            <CardDescription>Skills section additions worth considering.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {row.recommended_skills.map((k) => (<Badge key={k} variant="outline">{k}</Badge>))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-hairline">
        <CardHeader>
          <CardTitle className="font-display text-base"><FileText className="mr-2 inline h-4 w-4" />Optimized professional summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{row.optimized_summary}</p>
        </CardContent>
      </Card>

      <Card className="mt-6 border-hairline">
        <CardHeader>
          <CardTitle className="font-display text-base">Improved experience bullets</CardTitle>
          <CardDescription>Drop-in replacements for your résumé.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {row.improved_experience.map((b, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6 border-hairline">
        <CardHeader>
          <CardTitle className="font-display text-base"><Mail className="mr-2 inline h-4 w-4" />Tailored cover letter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{row.cover_letter}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreCard({ label, value, desc }: { label: string; value: number; desc: string }) {
  return (
    <Card className="border-hairline shadow-prestige">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-sm uppercase tracking-wide text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-display text-5xl font-bold text-gradient-gold">{value}</div>
        <Progress value={value} className="mt-3" />
        <p className="mt-3 text-xs text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
