import { compactText } from "@/lib/utils";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "be",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "their",
  "there",
  "this",
  "to",
  "was",
  "were",
  "with",
]);

export const NEURAL_EMBEDDING_SIZE = 8;
export const NEURAL_INPUT_SIZE = NEURAL_EMBEDDING_SIZE * 2 + 4;

function hashToken(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function tokenizeForNeuralMatch(...values: string[]) {
  const normalized = compactText(values.join(" "))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

  const bigrams = normalized.slice(0, -1).map((token, index) => `${token}_${normalized[index + 1]}`);
  return [...normalized, ...bigrams];
}

export function embedSemanticText(text: string, size = NEURAL_EMBEDDING_SIZE) {
  const tokens = tokenizeForNeuralMatch(text);
  const vector = Array.from({ length: size }, () => 0);

  if (!tokens.length) {
    return vector;
  }

  for (const token of tokens) {
    const hash = hashToken(token);
    const bucket = hash % size;
    const sign = (hash >>> 3) % 2 === 0 ? 1 : -1;
    const magnitude = token.includes("_") ? 1.25 : 1;
    vector[bucket] += sign * magnitude;
  }

  const norm = Math.hypot(...vector) || 1;
  return vector.map((value) => value / norm);
}

export function cosineSimilarity(left: number[], right: number[]) {
  if (left.length !== right.length) {
    throw new Error("Cosine similarity requires vectors of the same length.");
  }

  const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
  const leftNorm = Math.hypot(...left);
  const rightNorm = Math.hypot(...right);

  if (!leftNorm || !rightNorm) {
    return 0;
  }

  return dot / (leftNorm * rightNorm);
}

export interface NeuralFeatureInput {
  leftText: string;
  rightText: string;
  keywordScore: number;
  institutionMatch: boolean;
  severityMatch: boolean;
}

export function buildNeuralFeatureVector(input: NeuralFeatureInput) {
  const leftEmbedding = embedSemanticText(input.leftText);
  const rightEmbedding = embedSemanticText(input.rightText);
  const absoluteDifference = leftEmbedding.map((value, index) => Math.abs(value - rightEmbedding[index]));
  const elementwiseProduct = leftEmbedding.map((value, index) => value * rightEmbedding[index]);
  const cosine = cosineSimilarity(leftEmbedding, rightEmbedding);

  return [
    ...absoluteDifference,
    ...elementwiseProduct,
    cosine,
    input.keywordScore,
    input.institutionMatch ? 1 : 0,
    input.severityMatch ? 1 : 0,
  ];
}
