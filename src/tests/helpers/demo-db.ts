import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildSeedState } from "@/lib/data/seed";

const DATA_FILE = path.join(process.cwd(), "data", "demo-db.json");

export async function resetDemoDatabase() {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(buildSeedState(), null, 2));
}

