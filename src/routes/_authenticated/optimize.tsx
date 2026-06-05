import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, Loader2, Wand2, FileText } from "lucide-react";
import { toast } from "sonner";
import { extractTextFromFile } from "@/lib/extract-text";
import { analyzeCv } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/optimize")({
  component: OptimizePage,
});

function OptimizePage() {
  const navigate = useNavigate();
  const runAnalyze = useServerFn(analyzeCv);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setFile(f);
    setExtracting(true);
    try {
      const text = await extractTextFromFile(f);
      if (!text || text.length < 50) {
        toast.error("Couldn't extract enough text. Try a different file or paste it manually.");
      } else {
        setCvText(text);
        toast.success(`Extracted ${text.length.toLocaleString()} characters`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to read file");
    } finally {
      setExtracting(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cvText.trim().length < 50) return toast.error("Please upload or paste a CV (50+ characters).");
    if (jd.trim().length < 20) return toast.error("Please paste a job description (20+ characters).");

    setSubmitting(true);
    try {
      const result = await runAnalyze({
        data: {
          cvText: cvText.trim(),
          jobDescription: jd.trim(),
          jobTitle: jobTitle.trim() || null,
          jobCompany: company.trim() || null,
          originalFilename: file?.name || "pasted-cv.txt",
        },
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Analysis complete");
        navigate({ to: "/_authenticated/results/$id", params: { id: result.analysisId } });
      }
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Optimize my CV</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload your CV and paste the job description — we'll do the rest.</p>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-hairline">
          <CardHeader>
            <CardTitle className="font-display text-lg"><FileText className="mr-2 inline h-4 w-4" />Your CV</CardTitle>
            <CardDescription>PDF, DOCX, or TXT — extracted in your browser, never uploaded raw.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 px-4 py-8 text-center transition-colors hover:border-accent hover:bg-accent/5"
            >
              <FileUp className="mb-2 h-6 w-6 text-accent" />
              <div className="text-sm font-medium">{file ? file.name : "Choose a file"}</div>
              <div className="mt-1 text-xs text-muted-foreground">PDF / DOCX / TXT — up to ~10 MB</div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label htmlFor="cvtext">Extracted text {extracting && <span className="text-xs text-muted-foreground">(extracting…)</span>}</Label>
              <Textarea
                id="cvtext"
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Or paste your CV text here…"
                className="mt-1 min-h-[180px] font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-hairline">
          <CardHeader>
            <CardTitle className="font-display text-lg"><Wand2 className="mr-2 inline h-4 w-4" />Target job</CardTitle>
            <CardDescription>Paste the JD. Title & company are optional but help.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="title">Job title</Label>
                <Input id="title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Senior Product Designer" />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
              </div>
            </div>
            <div>
              <Label htmlFor="jd">Job description</Label>
              <Textarea id="jd" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description…" className="mt-1 min-h-[260px] text-sm" />
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" size="lg" disabled={submitting || extracting} className="h-12 px-8 shadow-prestige">
            {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</>) : (<><Wand2 className="mr-2 h-4 w-4" /> Run analysis</>)}
          </Button>
        </div>
      </form>
    </div>
  );
}
