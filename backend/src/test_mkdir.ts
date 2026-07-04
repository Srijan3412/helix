import fs from "fs/promises";

async function main() {
  const p = "C:\\Users\\91798\\Documents\\projectAnalyser\\backend\\storage\\repositories\\repo_x5uo7xkkd";
  console.log("Creating directory:", p);
  await fs.mkdir(p, { recursive: true });
  console.log("Successfully created directory!");
}

main().catch(console.error);
