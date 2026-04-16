import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ChevronDown,
  FlaskConical,
  Search,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

interface FdaResult {
  brand_name?: string[];
  generic_name?: string[];
  purpose?: string[];
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  warnings?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  description?: string[];
}

function parseFirstArray(arr?: string[]): string {
  if (!arr || arr.length === 0) return "";
  return arr[0].replace(/<[^>]*>/g, " ").trim();
}

async function getHFSummary(text: string): Promise<string> {
  const truncated = text.slice(0, 1000);
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: truncated,
          parameters: { max_length: 150, min_length: 40 },
        }),
      },
    );
    if (!res.ok) throw new Error("HF error");
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.summary_text)
      return data[0].summary_text;
    if (data?.error) throw new Error(data.error);
    return "";
  } catch {
    return "";
  }
}

export default function MedicineSearch() {
  const { actor } = useActor();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<FdaResult | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searched, setSearched] = useState("");

  async function handleSearch() {
    if (!query.trim() || !actor) return;
    setLoading(true);
    setError("");
    setResult(null);
    setAiSummary("");
    setSearched(query.trim());
    try {
      const raw = await actor.getMedicineInfo(query.trim());
      let parsed: { results?: FdaResult[] } = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        /* ignore */
      }

      if (!parsed.results || parsed.results.length === 0) {
        setError("No FDA data found for this medicine.");
        setLoading(false);
        return;
      }
      const fdaResult = parsed.results[0];
      setResult(fdaResult);
      setLoading(false);

      // Get AI summary in parallel
      const textForSummary = [
        parseFirstArray(fdaResult.purpose),
        parseFirstArray(fdaResult.indications_and_usage),
        parseFirstArray(fdaResult.dosage_and_administration),
      ]
        .filter(Boolean)
        .join(" ");

      if (textForSummary) {
        setAiLoading(true);
        const summary = await getHFSummary(textForSummary);
        setAiSummary(summary);
        setAiLoading(false);
      }
    } catch {
      setError("Failed to fetch medicine information. Please try again.");
      setLoading(false);
    }
  }

  const sections = result
    ? [
        {
          label: "Purpose",
          content: parseFirstArray(result.purpose),
          icon: "🎯",
        },
        {
          label: "Indications & Usage",
          content: parseFirstArray(result.indications_and_usage),
          icon: "📋",
        },
        {
          label: "Dosage & Administration",
          content: parseFirstArray(result.dosage_and_administration),
          icon: "💊",
        },
        {
          label: "Warnings",
          content: parseFirstArray(result.warnings),
          icon: "⚠️",
        },
        {
          label: "Adverse Reactions",
          content: parseFirstArray(result.adverse_reactions),
          icon: "🔴",
        },
        {
          label: "Drug Interactions",
          content: parseFirstArray(result.drug_interactions),
          icon: "🔗",
        },
      ].filter((s) => s.content)
    : [];

  const primarySections = sections.slice(0, 3);
  const detailSections = sections.slice(3);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Medicine Search</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Look up FDA drug information with AI-powered summaries
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          data-ocid="search.search_input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search medicine name (e.g. Metformin)"
          className="flex-1"
        />
        <Button
          data-ocid="search.primary_button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="shrink-0"
        >
          <Search className="w-4 h-4 mr-1.5" />
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div data-ocid="search.loading_state" className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          data-ocid="search.error_state"
          className="flex items-start gap-3 p-4 bg-destructive/10 rounded-xl border border-destructive/20"
        >
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Medicine name header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  {parseFirstArray(result.brand_name) || searched}
                </h3>
                {result.generic_name && (
                  <p className="text-sm text-muted-foreground">
                    Generic: {parseFirstArray(result.generic_name)}
                  </p>
                )}
              </div>
              <Badge className="ml-auto text-xs bg-primary/10 text-primary border-0">
                FDA Data
              </Badge>
            </div>

            {/* AI Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {aiLoading ? (
                  <div
                    data-ocid="search.ai.loading_state"
                    className="space-y-2"
                  >
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                ) : aiSummary ? (
                  <p className="text-sm text-foreground leading-relaxed">
                    {aiSummary}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    AI summary unavailable (rate limited). See details below.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Primary info */}
            {primarySections.map((sec) => (
              <Card key={sec.label}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span>{sec.icon}</span> {sec.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
                    {sec.content}
                  </p>
                </CardContent>
              </Card>
            ))}

            {/* Expandable details */}
            {detailSections.length > 0 && (
              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    data-ocid="search.details.toggle"
                    variant="outline"
                    className="w-full justify-between"
                  >
                    {detailsOpen ? "Hide Details" : "Show More Details"}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  {detailSections.map((sec) => (
                    <Card key={sec.label}>
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <span>{sec.icon}</span> {sec.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {sec.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && !error && (
        <div data-ocid="search.empty_state" className="text-center py-12">
          <Search className="w-14 h-14 text-muted mx-auto mb-3" />
          <p className="text-muted-foreground">Search for any medicine</p>
          <p className="text-sm text-muted-foreground mt-1">
            Get FDA-verified information and an AI-powered summary
          </p>
        </div>
      )}
    </div>
  );
}
