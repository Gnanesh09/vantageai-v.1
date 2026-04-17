"use client";

import { FormEvent, useMemo, useState } from "react";
import { analyzeReview, submitReview } from "@/lib/api";
import SentimentBadge from "@/components/SentimentBadge";
import { AnalyzeReviewResponse } from "@/types";

export default function ReviewForm({
  productId,
  onPosted,
}: {
  productId: string;
  onPosted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [rawText, setRawText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [analysisInfo, setAnalysisInfo] = useState("");
  const [preview, setPreview] = useState<AnalyzeReviewResponse | null>(null);

  const canSubmit = useMemo(() => rawText.trim().length >= 10 && !loading, [rawText, loading]);

  const normalizeImageUrl = (value: string): string | undefined => {
    const cleaned = value.trim();
    if (!cleaned) return undefined;
    return cleaned;
  };

  const isDirectImageUrl = (value?: string): boolean => {
    if (!value) return false;
    if (value.startsWith("data:image/")) return true;
    if (!/^https?:\/\//i.test(value)) return false;
    return /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(value);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setAnalysisInfo("");
    setPreview(null);

    const finalImageUrl = normalizeImageUrl(imageUrl);
    const ingestPayload = {
      product_id: productId,
      raw_text: rawText.trim(),
      star_rating: rating,
      source: "ecommerce",
      image_url: finalImageUrl,
    } as const;

    const ingest = await submitReview(ingestPayload);
    if (!ingest) {
      setLoading(false);
      setError("Reviews temporarily unavailable");
      return;
    }

    setSuccess("Review posted! Thank you 🎉");
    setRawText("");
    setImageUrl("");
    onPosted();
    setLoading(false);

    const analysisPayload = {
      product_id: productId,
      raw_text: rawText.trim(),
      star_rating: rating,
      source: "ecommerce",
      image_url: isDirectImageUrl(finalImageUrl) ? finalImageUrl : undefined,
    } as const;

    const analysis = await analyzeReview(analysisPayload);
    if (analysis) {
      setPreview(analysis);
    } else if (finalImageUrl && !isDirectImageUrl(finalImageUrl)) {
      setAnalysisInfo("Review saved. Instant analysis skipped for non-direct image URL.");
    } else {
      setAnalysisInfo("Review saved. Instant analysis is temporarily unavailable.");
    }
  };

  return (
    <div className="bg-surface border border-gray-100 rounded-2xl p-4">
      <h3 className="text-base font-black text-text mb-3">Write a review</h3>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`w-8 h-8 rounded-full text-sm font-bold ${
                star <= rating ? "bg-yellow-400 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Share your experience..."
          className="w-full min-h-24 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />

        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Optional image URL"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full md:w-auto rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-bold hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "Posting..." : "Post Review"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm font-semibold text-error">{error}</p>}
      {success && <p className="mt-3 text-sm font-semibold text-success">{success}</p>}
      {analysisInfo && <p className="mt-2 text-xs font-semibold text-muted">{analysisInfo}</p>}

      {preview && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <SentimentBadge sentiment={preview.overall_sentiment} />
            <span className="text-xs font-semibold rounded-full bg-white px-2.5 py-1 text-gray-700">
              {preview.detected_language || "Unknown"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {Object.entries(preview.feature_sentiments || {}).map(([feature, item]) => (
              <span
                key={feature}
                className="rounded-full bg-white border border-gray-200 px-2 py-1 text-[11px] text-gray-700"
              >
                {feature}: {item.sentiment}
              </span>
            ))}
          </div>

          {preview.is_sarcasm && <p className="text-xs font-semibold text-yellow-700">⚠️ Sarcasm detected</p>}
        </div>
      )}
    </div>
  );
}
