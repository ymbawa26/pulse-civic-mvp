"use server";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildSeedState } from "@/lib/data/seed";
import { type DatabaseState } from "@/lib/types";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIRECTORY, "demo-db.json");

export async function seedDemoDatabase(force = false) {
  await mkdir(DATA_DIRECTORY, { recursive: true });

  if (!force) {
    try {
      await readFile(DATA_FILE, "utf8");
      return;
    } catch {
      // fall through
    }
  }

  await writeDatabase(buildSeedState());
}

export async function readDatabase() {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as DatabaseState;
  } catch {
    await seedDemoDatabase(true);
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as DatabaseState;
  }
}

export async function writeDatabase(state: DatabaseState) {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(state, null, 2));
}

