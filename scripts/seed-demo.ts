import { seedDemoDatabase } from "../src/lib/data/demo-store";

async function main() {
  await seedDemoDatabase(true);
  console.log("Demo database seeded.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
