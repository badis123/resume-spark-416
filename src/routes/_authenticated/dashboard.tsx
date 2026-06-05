import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type Row = {
  id: string;
  job_title: string | null;
  job_company: string | null;
  match_score: number;
  ats_score: number;
  created_at: string;
};

function DashboardPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    supabase
      .from("analysis_results")
      .select("id, job_title, job_company, match_score, ats_score, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Your analyses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every CV optimization you've run.</p>
        </div>
        <Button asChild className="shadow-prestige">
          <Link to="/_authenticated/optimize"><Plus className="mr-2 h-4 w-4" /> New analysis</Link>
        </Button>
      </div>

      {rows === null ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <Card className="border-hairline">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <div className="font-display text-lg font-semibold">No analyses yet</div>
            <p className="mt-1 text-sm text-muted-foreground">Run your first CV optimization in under a minute.</p>
            <Button asChild className="mt-6"><Link to="/_authenticated/optimize">Start now</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Link key={r.id} to="/_authenticated/results/$id" params={{ id: r.id }} className="block">
              <Card className="border-hairline transition-shadow hover:shadow-prestige">
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 py-4">
                  <div>
                    <CardTitle className="font-display text-base">
                      {r.job_title || "Untitled role"}{r.job_company ? ` — ${r.job_company}` : ""}
                    </CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <Metric label="Match" value={r.match_score} />
                    <Metric label="ATS" value={r.ats_score} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <div className="font-display text-xl font-bold text-gradient-gold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
