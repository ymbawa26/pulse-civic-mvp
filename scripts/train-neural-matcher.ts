import { writeFile } from "node:fs/promises";
import path from "node:path";

import { buildNeuralFeatureVector, NEURAL_INPUT_SIZE } from "@/lib/ai/neural-features";

interface TrainingExample {
  leftText: string;
  rightText: string;
  institutionMatch: boolean;
  severityMatch: boolean;
  label: number;
}

function overlapScore(leftText: string, rightText: string) {
  const left = new Set(leftText.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const right = new Set(rightText.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const intersection = Array.from(left).filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size || 1;
  return intersection / union;
}

const trainingExamples: TrainingExample[] = [
  {
    leftText: "Repeated mold and ceiling leaks in Eastline Terrace with delayed maintenance requests",
    rightText: "Tenants keep reporting water leaks and mold in Eastline hallways while repairs are ignored",
    institutionMatch: true,
    severityMatch: true,
    label: 1,
  },
  {
    leftText: "Heat outage and mold complaints keep returning in the same apartment building",
    rightText: "Residents are dealing with no heat, damp walls, and unanswered repair tickets in the building",
    institutionMatch: true,
    severityMatch: true,
    label: 1,
  },
  {
    leftText: "Main library elevator outage keeps upper floors inaccessible",
    rightText: "Campus library elevator is offline again and students using mobility devices cannot reach upper levels",
    institutionMatch: true,
    severityMatch: true,
    label: 1,
  },
  {
    leftText: "Students redirected because the library elevator failed again",
    rightText: "Recurring accessibility problem at the campus library elevator left no step-free route",
    institutionMatch: true,
    severityMatch: true,
    label: 1,
  },
  {
    leftText: "Bus stop lighting has failed after dark and riders feel unsafe waiting",
    rightText: "The transit stop stays dark at night because the shelter lights and nearby crossing light are out",
    institutionMatch: true,
    severityMatch: true,
    label: 1,
  },
  {
    leftText: "Crosswalk signal and bus shelter lighting both remain out near Harbor Avenue",
    rightText: "Night riders say the stop is unsafe because the shelter lights never came back on",
    institutionMatch: true,
    severityMatch: true,
    label: 1,
  },
  {
    leftText: "A recurring checkout processing fee keeps appearing without clear notice",
    rightText: "Residents keep finding the same unexplained service fee added at payment",
    institutionMatch: true,
    severityMatch: true,
    label: 1,
  },
  {
    leftText: "Trash pickup was missed on this block again and waste is piling up",
    rightText: "The same sanitation route keeps skipping our street and garbage bags are collecting on the sidewalk",
    institutionMatch: true,
    severityMatch: true,
    label: 1,
  },
  {
    leftText: "Potholes near the station keep reopening after temporary patch work",
    rightText: "Road crews patched the same station entrance potholes but the surface keeps breaking again",
    institutionMatch: true,
    severityMatch: true,
    label: 1,
  },
  {
    leftText: "Leaking apartment ceiling with spreading mold and ignored maintenance",
    rightText: "Campus library elevator outage left students without accessible floor access",
    institutionMatch: false,
    severityMatch: false,
    label: 0,
  },
  {
    leftText: "Bus stop lighting failed after sunset and riders no longer feel safe",
    rightText: "Unexpected billing fee keeps appearing during online checkout",
    institutionMatch: false,
    severityMatch: false,
    label: 0,
  },
  {
    leftText: "Recurring library elevator problem blocks step-free access",
    rightText: "Apartment building has no heat and mold in the hallway",
    institutionMatch: false,
    severityMatch: false,
    label: 0,
  },
  {
    leftText: "Trash pickup was missed again on this route",
    rightText: "Potholes near the station keep reopening after patch work",
    institutionMatch: false,
    severityMatch: true,
    label: 0,
  },
  {
    leftText: "Billing platform keeps adding a hidden fee at checkout",
    rightText: "Street lighting outage leaves a transit stop dark after sunset",
    institutionMatch: false,
    severityMatch: true,
    label: 0,
  },
  {
    leftText: "Apartment residents say heat outages and mold remain unresolved",
    rightText: "Apartment residents are upset about noisy landscaping in the courtyard during daytime",
    institutionMatch: true,
    severityMatch: false,
    label: 0,
  },
  {
    leftText: "Library elevator outage keeps returning and blocks step-free access",
    rightText: "Campus parking office changed permit pickup hours this week",
    institutionMatch: true,
    severityMatch: false,
    label: 0,
  },
  {
    leftText: "Transit stop remains dark at night because lights are still out",
    rightText: "Transit stop bench was repainted and riders dislike the new color",
    institutionMatch: true,
    severityMatch: false,
    label: 0,
  },
  {
    leftText: "Unexpected payment fee appears every month without notice",
    rightText: "Unexpected payment fee appears every month without notice",
    institutionMatch: true,
    severityMatch: true,
    label: 1,
  },
];

const hiddenSize = 10;
const learningRate = 0.08;
const epochs = 1600;

function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function tanh(value: number) {
  return Math.tanh(value);
}

function initializeWeights() {
  const random = seededRandom(20260415);
  const w1 = Array.from({ length: hiddenSize }, () =>
    Array.from({ length: NEURAL_INPUT_SIZE }, () => (random() * 2 - 1) * 0.35),
  );
  const b1 = Array.from({ length: hiddenSize }, () => 0);
  const w2 = Array.from({ length: hiddenSize }, () => (random() * 2 - 1) * 0.35);
  const b2 = 0;

  return { w1, b1, w2, b2 };
}

const dataset = trainingExamples.map((example) => ({
  x: buildNeuralFeatureVector({
    leftText: example.leftText,
    rightText: example.rightText,
    keywordScore: overlapScore(example.leftText, example.rightText),
    institutionMatch: example.institutionMatch,
    severityMatch: example.severityMatch,
  }),
  y: example.label,
}));

const model = initializeWeights();

for (let epoch = 0; epoch < epochs; epoch += 1) {
  const gradW1 = model.w1.map((row) => row.map(() => 0));
  const gradB1 = model.b1.map(() => 0);
  const gradW2 = model.w2.map(() => 0);
  let gradB2 = 0;

  for (const sample of dataset) {
    const hiddenPre = model.w1.map((row, rowIndex) =>
      row.reduce((sum, weight, featureIndex) => sum + weight * sample.x[featureIndex], model.b1[rowIndex]),
    );
    const hidden = hiddenPre.map((value) => tanh(value));
    const output = model.w2.reduce((sum, weight, index) => sum + weight * hidden[index], model.b2);
    const prediction = sigmoid(output);
    const error = prediction - sample.y;

    for (let hiddenIndex = 0; hiddenIndex < hiddenSize; hiddenIndex += 1) {
      gradW2[hiddenIndex] += error * hidden[hiddenIndex];
    }
    gradB2 += error;

    for (let hiddenIndex = 0; hiddenIndex < hiddenSize; hiddenIndex += 1) {
      const delta = error * model.w2[hiddenIndex] * (1 - hidden[hiddenIndex] ** 2);
      gradB1[hiddenIndex] += delta;

      for (let featureIndex = 0; featureIndex < NEURAL_INPUT_SIZE; featureIndex += 1) {
        gradW1[hiddenIndex][featureIndex] += delta * sample.x[featureIndex];
      }
    }
  }

  const scale = learningRate / dataset.length;

  for (let hiddenIndex = 0; hiddenIndex < hiddenSize; hiddenIndex += 1) {
    model.b1[hiddenIndex] -= gradB1[hiddenIndex] * scale;
    model.w2[hiddenIndex] -= gradW2[hiddenIndex] * scale;

    for (let featureIndex = 0; featureIndex < NEURAL_INPUT_SIZE; featureIndex += 1) {
      model.w1[hiddenIndex][featureIndex] -= gradW1[hiddenIndex][featureIndex] * scale;
    }
  }

  model.b2 -= gradB2 * scale;
}

function predict(features: number[]) {
  const hidden = model.w1.map((row, rowIndex) =>
    tanh(row.reduce((sum, weight, featureIndex) => sum + weight * features[featureIndex], model.b1[rowIndex])),
  );
  const output = model.w2.reduce((sum, weight, index) => sum + weight * hidden[index], model.b2);
  return sigmoid(output);
}

const accuracy =
  dataset.filter((sample) => {
    const prediction = predict(sample.x);
    return (prediction >= 0.5 ? 1 : 0) === sample.y;
  }).length / dataset.length;

async function main() {
  const outputPath = path.join(process.cwd(), "src", "lib", "ai", "neural-match-weights.json");
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        inputSize: NEURAL_INPUT_SIZE,
        hiddenSize,
        w1: model.w1,
        b1: model.b1,
        w2: model.w2,
        b2: model.b2,
        accuracy: Number(accuracy.toFixed(3)),
        epochs,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`Neural matcher weights written to ${outputPath}`);
  console.log(`Training accuracy: ${accuracy.toFixed(3)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
