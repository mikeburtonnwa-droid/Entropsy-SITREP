import { logger } from "./utils/logger.js";
import { runPipeline } from "./pipeline/runner.js";

const command = process.argv[2];

async function main() {
  switch (command) {
    case "run":
      logger.info("Starting Morning Brief pipeline");
      await runPipeline();
      break;
    case "status":
      logger.info("Pipeline status check — not yet implemented");
      break;
    default:
      console.log("Usage: morning-brief <run|status>");
      process.exit(1);
  }
}

main().catch((err) => {
  logger.fatal(err, "Pipeline crashed");
  process.exit(1);
});
