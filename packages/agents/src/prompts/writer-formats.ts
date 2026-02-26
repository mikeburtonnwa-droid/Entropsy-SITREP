/**
 * PRD §3.1-3.4 format specifications encoded as prompt text.
 * Returned as a single string block to embed in the writer system prompt.
 */
export function getFormatSpecs(): string {
  return `## Format Specifications

### 1. Morning Brief Block (50-80 words per story)
- Story number + **Headline** (bold)
- Source + publish time (e.g., "Reuters · 3 hours ago")
- **Summary**: Exactly 2-3 sentences. No fluff. What happened, who was affected, what changed.
- **Why It Matters**: 1-2 sentences. Written for a senior professional in this vertical. Connect it to their world explicitly.
- Total brief (all stories combined): 200-400 words. Never exceed 400.

### 1b. Morning Brief Article (200-400 words)
- A longer-form analysis of the story for professionals who want deeper context.
- **Lead paragraph**: 2-3 sentences summarizing what happened and why it matters. Hook the reader immediately.
- **Context & Analysis**: 2-3 paragraphs. What led to this development? What are the key details? How does this fit into broader industry trends?
- **Implications**: 1-2 paragraphs. What should professionals in this industry do or watch for? Be specific — name roles, workflows, or business functions affected.
- **Bottom Line**: 1 sentence. The single takeaway a busy executive should remember.
- Written in the same "Morning Brew meets McKinsey" voice. No academic jargon. Every paragraph earns its place.

### 2. LinkedIn Post (150-300 words)
- **Hook (Line 1)**: A single provocative statement or uncomfortable truth. Must make a senior professional pause. No questions as hooks — statements only. Max 15 words.
- **[blank line]**: Forces "see more" click on LinkedIn.
- **Body (3-5 lines)**: The insight. What the story means for professionals in this industry. Written in first-person plural where natural ("We're watching..."). Each line = one idea. Short lines. Punchy.
- **Implication**: One line on what this means for the reader's practice, firm, or clients. Be specific — not "this changes everything" but "law firms with under 50 attorneys are most exposed to this shift."
- **CTA**: A genuine question that invites professional discussion. Not "what do you think?" but a specific, thoughtful prompt the target audience has an opinion on.
- **Hashtags**: 3-5 hashtags. One broad (#AI), one industry-specific, one topic-specific. Never more than 5.

### 3. Facebook Post (100-200 words)
- **Opening**: A relatable scenario or question that brings the abstract AI story into everyday professional life. More conversational than LinkedIn. 1-2 sentences.
- **Body**: Explain the story accessibly. Avoid acronyms without explanation. Write as if briefing a smart non-specialist colleague over coffee. 3-4 short paragraphs.
- **The "So What"**: One clear sentence on why this matters to the reader's business, job, or industry. Plain language. Specific.
- **Engagement prompt**: A direct question that encourages comments. Easy to answer with a quick reaction. No hashtags — they don't help on Facebook for B2B.

### 4. Video Transcript — Variant A: Talking Head (130-160 words)
- Natural spoken word. Include (pause) markers, emphasis in CAPS for key words.
- **[HOOK - 5 sec]**: One punchy opening statement, direct to camera.
- **[CONTEXT - 15 sec]**: What happened — 2-3 sentences.
- **[INSIGHT - 25 sec]**: Why it matters for this industry. Be specific.
- **[CTA - 10 sec]**: "Follow for daily AI briefings" or similar.
- Include tone markers: [Lean forward], [Slow down here], [Direct eye contact].

### 5. Video Transcript — Variant B: AI Avatar (120-140 words)
- Written for text-to-speech. No contractions. No em dashes. Shorter sentences.
- Same 4-part structure as Variant A but adapted for TTS pacing.
- Add [PAUSE 1s] markers between sections.
- Specify avatar background suggestion aligned to industry.

### 6. Video Transcript — Variant C: Caption Sequence (8-12 cards)
- A sequence of 8-12 text cards displayed sequentially on screen.
- Each card: 1-2 lines maximum. Designed to be read in 2-3 seconds per card.
- **Card 1**: Hook statement (bold claim). **Cards 2-3**: What happened. **Cards 4-6**: Why it matters. **Cards 7-9**: Specific implication. **Card 10-11**: Bigger picture. **Final card**: CTA + follow prompt.
- Separate each card with "---" on its own line.
- Optional: include a voiceover script after the cards, separated by "===VOICEOVER===".`;
}
