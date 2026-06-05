import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  cvText: z.string().min(50).max(50000),
  jobDescription: z.string().min(20).max(20000),
  jobTitle: z.string().max(200).optional().nullable(),
  jobCompany: z.string().max(200).optional().nullable(),
  originalFilename: z.string().max(255),
});

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) optimizer and senior career coach.
Your job: analyze a candidate's CV against a target job description and produce concrete, ATS-friendly improvements.
Always respond ONLY with a single valid JSON object matching the requested schema. No prose, no markdown.
Be specific, professional, and use measurable phrasing with action verbs and numbers when reasonable.`;

function buildUserPrompt(cv: string, jd: string, title?: string | null, company?: string | null) {
  return `JOB TITLE: ${title || "(unspecified)"}
COMPANY: ${company || "(unspecified)"}

JOB DESCRIPTION:
"""
${jd}
"""

CANDIDATE CV (raw text):
"""
${cv}
"""

Produce a JSON object with exactly this shape:
{
  "matchScore": number (0-100, semantic match of CV to JD),
  "atsScore": number (0-100, how ATS-friendly the current CV is),
  "missingKeywords": string[] (up to 15 important JD keywords missing from the CV),
  "recommendedSkills": string[] (up to 10 skills the candidate should add or emphasize),
  "optimizedSummary": string (a polished 3-5 sentence professional summary tailored to the JD),
  "improvedExperience": string[] (6-10 rewritten resume bullets, ATS-optimized, action-verb led, with metrics where plausible),
  "coverLetter": string (a tailored ~280-380 word cover letter addressed to the hiring manager)
}
Return JSON only.`;
}

export const analyzeCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { error: "AI is not configured. Please contact support." as const };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(data.cvText, data.jobDescription, data.jobTitle, data.jobCompany) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) return { error: "Rate limit exceeded. Please wait a minute and try again." as const };
    if (res.status === 402) return { error: "AI credits exhausted. Please add credits in your workspace." as const };
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      return { error: "AI analysis failed. Please try again." as const };
    }

    const payload = await res.json();
    const raw = payload?.choices?.[0]?.message?.content;
    if (!raw) return { error: "AI returned an empty response." as const };

    let parsed: any;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return { error: "AI returned malformed JSON." as const };
    }

    const matchScore = Math.max(0, Math.min(100, Number(parsed.matchScore) || 0));
    const atsScore = Math.max(0, Math.min(100, Number(parsed.atsScore) || 0));
    const missingKeywords = Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 20).map(String) : [];
    const recommendedSkills = Array.isArray(parsed.recommendedSkills) ? parsed.recommendedSkills.slice(0, 15).map(String) : [];
    const improvedExperience = Array.isArray(parsed.improvedExperience) ? parsed.improvedExperience.slice(0, 12).map(String) : [];
    const optimizedSummary = String(parsed.optimizedSummary || "");
    const coverLetter = String(parsed.coverLetter || "");

    // Save CV upload
    const { data: cv, error: cvErr } = await supabase
      .from("cv_uploads")
      .insert({
        user_id: userId,
        original_filename: data.originalFilename,
        extracted_text: data.cvText,
      })
      .select("id")
      .single();
    if (cvErr || !cv) {
      console.error(cvErr);
      return { error: "Could not save your CV." as const };
    }

    const { data: analysis, error: aErr } = await supabase
      .from("analysis_results")
      .insert({
        user_id: userId,
        cv_id: cv.id,
        job_title: data.jobTitle ?? null,
        job_company: data.jobCompany ?? null,
        job_description: data.jobDescription,
        match_score: matchScore,
        ats_score: atsScore,
        missing_keywords: missingKeywords,
        recommended_skills: recommendedSkills,
        optimized_summary: optimizedSummary,
        improved_experience: improvedExperience,
        cover_letter: coverLetter,
        paid: false,
      })
      .select("id")
      .single();

    if (aErr || !analysis) {
      console.error(aErr);
      return { error: "Could not save your analysis." as const };
    }

    return { analysisId: analysis.id as string };
  });
