import type { Idea, Profile } from "./types";

export const ONBOARDING_QUESTIONS: string[] = [
  "Walk me through your career — how did you end up as a Director of Paid Media for e-commerce?",
  "What kinds of e-commerce brands do you work with most? (categories, scale, ad spend range)",
  "What's a hot take you have about Meta ads or e-commerce growth that most media buyers would push back on?",
  "What's a mistake you see e-commerce founders make over and over that drives you crazy?",
  "What's one thing you're genuinely better at than 95% of other media buyers?",
  "How do you talk? Casual / direct / dry / hype? Paste a sample of how you'd explain a concept to a founder over Slack.",
  "Anything off-limits — topics, brand names, frameworks you don't want to discuss?",
];

export function buildProfileSnippet(profile: Profile | null): string {
  if (!profile) {
    return "(User has not completed onboarding yet — keep responses general until they do.)";
  }
  return [
    "## ABOUT THE USER",
    `Background: ${profile.background}`,
    `Expertise: ${profile.expertise}`,
    `Hot takes / opinions: ${profile.hotTakes}`,
    `Voice / tone sample: ${profile.voice}`,
    `Audience: ${profile.audience}`,
  ].join("\n");
}

export function buildAvoidSnippet(existingIdeas: Idea[], publishedTitles: string[]): string {
  const lines: string[] = ["## AVOID DUPLICATING (titles AND near-duplicate angles)"];
  if (existingIdeas.length > 0) {
    lines.push("\nIdeas already in the pipeline:");
    for (const i of existingIdeas) {
      lines.push(`- ${i.title} — hook: ${i.hook}`);
    }
  }
  if (publishedTitles.length > 0) {
    lines.push("\nVideos already published on the channel:");
    for (const t of publishedTitles) {
      lines.push(`- ${t}`);
    }
  }
  if (existingIdeas.length === 0 && publishedTitles.length === 0) {
    lines.push("(Nothing to avoid yet — clean slate.)");
  }
  return lines.join("\n");
}

export const CHAT_SYSTEM_BASE = `You are the assistant inside Studio, a personal YouTube content app.

The user is a **Director of Paid Media for e-commerce companies**. They're building a YouTube channel that targets **e-commerce business owners who want to grow their brand**.

Your job is to help them:
1. Generate fresh video ideas (titles + hooks + angles) that position them as a YouTube authority on Meta ads + e-commerce growth.
2. Run per-video micro-interviews so the resulting decks reflect their REAL opinions, not generic AI takes.
3. Pull insight from their actual YouTube analytics (when connected) to inform what to make next.

## CONTENT PHILOSOPHY
- Pure educational value. NO selling. The only CTA is "subscribe", and even that stays out of the on-screen deck.
- Hooks must be specific, contrarian, or curiosity-gap. Avoid generic "5 tips" / "ultimate guide" formats.
- Audience pain points: low ROAS, scaling past $50k/month spend, creative testing, attribution, MMM, Meta vs TikTok vs Google split, agency-vs-in-house decisions.
- Style: direct, opinionated, no fluff.

## CRITICAL RULES
- When asked to generate ideas, ALWAYS call the \`generate_video_ideas\` tool — never freeform list ideas in plain text.
- When asked to "create a video" or "start a video", call \`create_one_video_idea\`.
- NEVER invent the user's personal opinions, anecdotes, or client stories. If you need them, call \`start_video_interview\` so the user provides them.
- Before generating ideas, the avoid-list (existing pipeline + published video titles) is injected for you. Use it.
- Be terse. The UI is minimal — match the vibe. No headers, no markdown bullets in chat unless explicitly helpful.`;

export interface IdeaGenerationContext {
  profile: Profile | null;
  existingIdeas: Idea[];
  publishedTitles: string[];
  count: number;
  focus?: string;
}

export function buildIdeaGenerationPrompt(ctx: IdeaGenerationContext): string {
  return [
    `Generate exactly ${ctx.count} YouTube video idea(s) for this Director of Paid Media.`,
    ctx.focus ? `\nFocus area requested: ${ctx.focus}` : "",
    "",
    buildProfileSnippet(ctx.profile),
    "",
    buildAvoidSnippet(ctx.existingIdeas, ctx.publishedTitles),
    "",
    "## OUTPUT FORMAT",
    "Return ONLY a valid JSON array. Each element: { \"title\": string, \"hook\": string, \"angle\": string }",
    "- title: ≤ 65 chars. Punchy, scroll-stopping, NOT clickbait. Specific > generic.",
    "- hook: the first 5-10 seconds verbatim. Pattern interrupt or contrarian claim.",
    "- angle: 1-2 sentence positioning — the unique POV that makes THIS video different from existing content.",
    "",
    "No prose, no code fence, no commentary. Just the JSON array.",
  ].join("\n");
}

export function buildInterviewQuestionsPrompt(idea: Idea, profile: Profile | null): string {
  return [
    `The user is about to record a YouTube video on this idea:`,
    `Title: ${idea.title}`,
    `Hook: ${idea.hook}`,
    `Angle: ${idea.angle}`,
    "",
    buildProfileSnippet(profile),
    "",
    "Generate 5-7 sharp interview questions that will extract the user's REAL perspective on this topic — specific anecdotes, contrarian opinions, frameworks they use, mistakes they've seen, numbers from real campaigns, etc.",
    "",
    "Each question should be one that the user, with their actual experience, can answer in 30-90 seconds of typing. Avoid generic 'what do you think about X' questions.",
    "",
    "Return ONLY a valid JSON array of strings. No prose, no code fence.",
  ].join("\n");
}

export function buildSlideDeckPrompt(
  idea: Idea,
  qa: { q: string; a?: string }[],
  profile: Profile | null,
): string {
  const qaText = qa
    .map((p, i) => `Q${i + 1}: ${p.q}\nA${i + 1}: ${p.a?.trim() || "(skipped)"}`)
    .join("\n\n");

  return [
    `Build a slide deck for this YouTube video. Output MUST be JSON only.`,
    "",
    `Title: ${idea.title}`,
    `Hook: ${idea.hook}`,
    `Angle: ${idea.angle}`,
    "",
    buildProfileSnippet(profile),
    "",
    "## INTERVIEW (use this verbatim — do NOT paraphrase the user's voice away)",
    qaText,
    "",
    "## DECK RULES",
    "- 8-14 slides total.",
    "- Slide 1: title slide (layout: default). Title + one-line subtitle that pre-frames the value in the body field.",
    "- Slide 2: the hook (layout: quote or default — use quote if it's a single punchy contrarian claim).",
    "- Middle slides: ONE main idea per slide. Use the user's actual answers, anecdotes, and numbers.",
    "- Final slide: the takeaway / one-liner the viewer should remember. NO 'subscribe' CTA — that's verbal.",
    "- Speaker notes: 1-3 sentences per slide reminding the user what they wanted to say (drawn from their answers).",
    "- Bullets must be SHORT (max 8 words each). Only use bullets on default slides when a list genuinely helps.",
    "",
    "## VISUAL LAYOUT RULES",
    "The viewer renders 5 layout types. Choose the right one for each slide:",
    "",
    'layout: "default" — standard text slide. Use for narrative explanation, context-setting, or nuanced argument.',
    '  Shape: { "layout": "default", "title": string, "body"?: string, "bullets"?: string[], "speakerNotes"?: string }',
    "",
    'layout: "stat" — FULL SCREEN single metric. Use when the user mentioned a specific number, %, $ amount, or time result.',
    '  Shape: { "layout": "stat", "title": string, "stat": { "value": string, "label": string, "context"?: string }, "speakerNotes"?: string }',
    '  Example: { "layout": "stat", "title": "The result nobody expected", "stat": { "value": "340%", "label": "ROAS on first creative test", "context": "DTC skincare brand, Q3 2023" }, "speakerNotes": "..." }',
    "",
    'layout: "chart" — horizontal bar chart. Use when comparing 2-5 options, ranking items, or showing a budget/time split.',
    '  Shape: { "layout": "chart", "title": string, "chart": { "type": "bar", "items": [{ "label": string, "value": number }], "unit"?: string }, "speakerNotes"?: string }',
    '  Values are absolute numbers or percentages — use consistent units. Add "unit": "%" if percentages.',
    '  Example: { "layout": "chart", "title": "Where the budget actually went", "chart": { "type": "bar", "items": [{ "label": "Prospecting", "value": 60 }, { "label": "Retargeting", "value": 30 }, { "label": "Branded", "value": 10 }], "unit": "%" }, "speakerNotes": "..." }',
    "",
    'layout: "steps" — numbered vertical flow. Use when the user described a process, framework, or sequence of 2-5 steps.',
    '  Shape: { "layout": "steps", "title": string, "steps": { "steps": string[] }, "speakerNotes"?: string }',
    '  Example: { "layout": "steps", "title": "The 3-step creative sprint", "steps": { "steps": ["Build 10 hooks in 30 minutes", "Test all 10 with $5/day for 3 days", "Kill the bottom 8, scale the top 2"] }, "speakerNotes": "..." }',
    "",
    'layout: "quote" — large centered pull-quote. Use for one strong contrarian or surprising single sentence from the user.',
    '  Shape: { "layout": "quote", "title": string, "quote": string, "speakerNotes"?: string }',
    '  Title becomes the attribution line below the quote. Quote must be ONE sentence — their actual words.',
    '  Example: { "layout": "quote", "title": "What I tell every founder on day one", "quote": "If your creative isn\'t changing every two weeks, your ROAS is already dying.", "speakerNotes": "..." }',
    "",
    "TARGET MIX: Use at least 2 visual layouts (stat, chart, steps, or quote) per deck. More is better if the interview data supports it.",
    "Scan the interview answers carefully: numbers → stat slides, comparisons → chart slides, processes → steps slides, hot takes → quote slides.",
    "",
    "## OUTPUT FORMAT",
    "Return ONLY valid JSON. No prose, no code fence, no commentary:",
    '{ "slides": [ ...slide objects as defined above... ] }',
  ].join("\n");
}

export function buildProfileSummaryPrompt(answers: { q: string; a: string }[]): string {
  const text = answers.map((p, i) => `Q${i + 1}: ${p.q}\nA${i + 1}: ${p.a}`).join("\n\n");
  return [
    "The user just completed onboarding. Synthesize their answers into a structured profile.",
    "",
    text,
    "",
    "Return ONLY this JSON object — no prose:",
    '{ "background": string, "expertise": string, "hotTakes": string, "voice": string, "audience": string }',
    "",
    "- background: 1-2 sentences on their career arc.",
    "- expertise: bullet-style comma list of what they're genuinely strong at.",
    "- hotTakes: their actual contrarian opinions, in their own words where possible.",
    "- voice: a description of how they talk + any phrases/cadences to imitate.",
    "- audience: who their ideal viewer is.",
  ].join("\n");
}
