import { randomUUID } from "node:crypto";
import { childLogger } from "../utils/logger.js";
import { getSupabase } from "../db/client.js";
import { elapsed } from "../utils/date.js";
import type { Logger } from "pino";

export interface AgentContext {
  runId: string;
  industry?: string;
}

export interface AgentRunRecord {
  run_id: string;
  agent_id: string;
  agent_name: string;
  started_at: string;
  completed_at?: string;
  status: "RUNNING" | "SUCCESS" | "ERROR" | "TIMEOUT";
  output_summary?: string;
  error_message?: string;
  tokens_used: number;
  cost_usd: number;
}

/**
 * Abstract base class for all pipeline agents.
 * Provides lifecycle management, structured logging, and DB audit trail.
 */
export abstract class BaseAgent {
  readonly agentId: string;
  abstract readonly agentName: string;

  protected log: Logger;
  protected ctx!: AgentContext;
  protected tokensUsed = 0;
  protected costUsd = 0;

  constructor() {
    this.agentId = randomUUID();
    this.log = childLogger(this.constructor.name);
  }

  /**
   * Run the agent with full lifecycle: log start → execute → log end.
   */
  async run(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.log = childLogger(`${this.agentName}:${ctx.industry ?? "all"}`);
    const start = new Date();

    await this.logRun("RUNNING");
    this.log.info({ runId: ctx.runId }, `${this.agentName} started`);

    try {
      await this.execute(ctx);
      const ms = elapsed(start);
      this.log.info({ durationMs: ms }, `${this.agentName} completed`);
      await this.logRun("SUCCESS", undefined, ms);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error({ error: msg }, `${this.agentName} failed`);
      await this.logRun("ERROR", msg, elapsed(start));
      throw err;
    }
  }

  /**
   * Subclasses implement their core logic here.
   */
  protected abstract execute(ctx: AgentContext): Promise<void>;

  /**
   * Track token usage from an LLM call.
   */
  protected trackTokens(input: number, output: number, cost: number): void {
    this.tokensUsed += input + output;
    this.costUsd += cost;
  }

  /**
   * Write an entry to the agent_run_log table.
   */
  private async logRun(
    status: AgentRunRecord["status"],
    errorMessage?: string,
    durationMs?: number,
  ): Promise<void> {
    const record: Omit<AgentRunRecord, "completed_at"> & {
      completed_at?: string;
    } = {
      run_id: this.ctx.runId,
      agent_id: this.agentId,
      agent_name: this.agentName,
      started_at: new Date().toISOString(),
      status,
      tokens_used: this.tokensUsed,
      cost_usd: this.costUsd,
    };

    if (status !== "RUNNING") {
      record.completed_at = new Date().toISOString();
    }
    if (errorMessage) {
      record.error_message = errorMessage;
    }

    try {
      const db = getSupabase();
      await db.from("agent_run_log").insert(record);
    } catch (e) {
      // Don't let logging failures break the pipeline
      this.log.warn({ error: e }, "Failed to write agent_run_log");
    }
  }
}
