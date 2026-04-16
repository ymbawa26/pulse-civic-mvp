import weights from "@/lib/ai/neural-match-weights.json";
import { buildNeuralFeatureVector, type NeuralFeatureInput, NEURAL_INPUT_SIZE } from "@/lib/ai/neural-features";
import { clamp } from "@/lib/utils";

interface NeuralWeights {
  inputSize: number;
  hiddenSize: number;
  w1: number[][];
  b1: number[];
  w2: number[];
  b2: number;
}

const model = weights as NeuralWeights;

if (model.inputSize !== NEURAL_INPUT_SIZE) {
  throw new Error(`Neural matcher expected ${NEURAL_INPUT_SIZE} inputs but received ${model.inputSize}.`);
}

function tanh(value: number) {
  return Math.tanh(value);
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

export function scoreNeuralSimilarity(input: NeuralFeatureInput) {
  const features = buildNeuralFeatureVector(input);

  const hidden = model.w1.map((row, rowIndex) =>
    tanh(row.reduce((sum, weight, featureIndex) => sum + weight * features[featureIndex], model.b1[rowIndex])),
  );

  const output = model.w2.reduce((sum, weight, index) => sum + weight * hidden[index], model.b2);
  return clamp(12 + sigmoid(output) * 76, 0, 100);
}
