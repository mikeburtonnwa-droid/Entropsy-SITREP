import { env } from "../config.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("slack");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Severity = "info" | "warning" | "error";

// ---------------------------------------------------------------------------
// Severity formatting
// ---------------------------------------------------------------------------
const SEVERITY_CONFIG: Record<Severity, { emoji: string; color: string }> = {
  info: { emoji: ":information_source:", color: "#36a64f" },
  warning: { emoji: ":warning:", color: "#ffcc00" },
  error: { emoji: ":rotating_light:", color: "#ff0000" },
};

// ---------------------------------------------------------------------------
// sendSlackAlert — post a message to a Slack webhook
// ---------------------------------------------------------------------------
export async function sendSlackAlert(
  message: string,
  severity: Severity = "info",
): Promise<void> {
  const webhookUrl = env.slackWebhookUrl();

  if (!webhookUrl) {
    log.warn("SLACK_WEBHOOK_URL not set, skipping Slack alert");
    return;
  }

  const config = SEVERITY_CONFIG[severity];

  try {
    log.debug({ severity }, "Sending Slack alert");

    const payload = {
      text: `${config.emoji} *Morning Brief ${severity.toUpperCase()}*`,
      attachments: [
        {
          color: config.color,
          text: message,
          ts: Math.floor(Date.now() / 1000).toString(),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown");
      log.error(
        { status: response.status, errorText },
        "Slack webhook error",
      );
      return;
    }

    log.info({ severity }, "Slack alert sent");
  } catch (err) {
    // Slack alerts are best-effort; never throw
    log.error({ err }, "Failed to send Slack alert");
  }
}
