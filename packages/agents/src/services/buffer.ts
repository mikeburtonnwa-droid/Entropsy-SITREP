import { env } from "../config.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("buffer");

const BUFFER_CREATE_URL = "https://api.bufferapp.com/1/updates/create.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface QueueToBufferOptions {
  text: string;
  profileIds: string[];
  scheduledAt?: Date;
}

export interface QueueToBufferResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// queueToBuffer — schedule a post via Buffer API
// ---------------------------------------------------------------------------
export async function queueToBuffer(
  options: QueueToBufferOptions,
): Promise<QueueToBufferResult> {
  const accessToken = env.bufferAccessToken();

  if (!accessToken) {
    log.warn("BUFFER_ACCESS_TOKEN not set, skipping Buffer queue");
    return { success: true };
  }

  const { text, profileIds, scheduledAt } = options;

  try {
    log.debug(
      { profileIds, scheduledAt: scheduledAt?.toISOString() },
      "Queueing to Buffer",
    );

    const body: Record<string, unknown> = {
      access_token: accessToken,
      text,
      profile_ids: profileIds,
    };

    if (scheduledAt) {
      body.scheduled_at = scheduledAt.toISOString();
    }

    const response = await fetch(BUFFER_CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(
        flattenForForm(body),
      ).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown");
      log.error(
        { status: response.status, errorText },
        "Buffer API error",
      );
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const json = await response.json();

    if (!json.success) {
      const message = json.message ?? "Unknown Buffer error";
      log.error({ message }, "Buffer returned failure");
      return { success: false, error: message };
    }

    log.info(
      { profileIds, updateId: json.updates?.[0]?.id },
      "Successfully queued to Buffer",
    );

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ err }, "Failed to queue to Buffer");
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flatten nested values for x-www-form-urlencoded (Buffer expects profile_ids[] format). */
function flattenForForm(
  obj: Record<string, unknown>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        result[`${key}[]`] = String(item);
      }
    } else if (value !== undefined && value !== null) {
      result[key] = String(value);
    }
  }

  return result;
}
