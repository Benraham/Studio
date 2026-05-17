import type Anthropic from "@anthropic-ai/sdk";
import { nanoid } from "nanoid";
import {
  getIdea,
  getInterview,
  getProfile,
  listIdeas,
  saveIdea,
  saveInterview,
} from "./kv";
import {
  getOverview,
  getRecentVideos,
  getVideoStats,
  listMyVideoTitles,
} from "./youtube";
import { callJson } from "./anthropic";
import {
  buildIdeaGenerationPrompt,
  buildInterviewQuestionsPrompt,
  CHAT_SYSTEM_BASE,
} from "./prompts";
import type { Idea, IdeaStatus } from "./types";

export const toolDefs: Anthropic.Tool[] = [
  {
    name: "generate_video_ideas",
    description:
      "Generate one or more new YouTube video ideas, automatically de-duplicated against existing pipeline ideas and the user's published video titles. Saves them to the pipeline and returns the new ideas.",
    input_schema: {
      type: "object",
      properties: {
        count: {
          type: "integer",
          description: "How many ideas to generate (1-12).",
          minimum: 1,
          maximum: 12,
        },
        focus: {
          type: "string",
          description:
            "Optional theme, sub-topic, or constraint for these ideas (e.g. 'creative testing', 'attribution after iOS 14', 'TikTok-style ads').",
        },
      },
      required: ["count"],
    },
  },
  {
    name: "create_one_video_idea",
    description:
      "The 'Create a video' flow. Generates ONE de-duplicated idea AND immediately starts a per-video interview. Returns the interview URL.",
    input_schema: {
      type: "object",
      properties: {
        focus: {
          type: "string",
          description: "Optional sub-topic / direction.",
        },
      },
      required: [],
    },
  },
  {
    name: "list_video_ideas",
    description: "List the current video idea pipeline.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["idea", "interviewing", "ready", "recorded", "posted"],
          description: "Optional status filter.",
        },
      },
      required: [],
    },
  },
  {
    name: "update_idea_status",
    description: "Update the status of a single idea.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: {
          type: "string",
          enum: ["idea", "interviewing", "ready", "recorded", "posted"],
        },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "start_video_interview",
    description:
      "Generate the micro-interview questions for an existing idea and persist them. Returns the interview URL.",
    input_schema: {
      type: "object",
      properties: {
        ideaId: { type: "string" },
      },
      required: ["ideaId"],
    },
  },
  {
    name: "get_youtube_overview",
    description:
      "Get channel-level YouTube analytics for the past N days (views, watch time, subs gained, average view duration, CTR if available).",
    input_schema: {
      type: "object",
      properties: {
        days: {
          type: "integer",
          minimum: 1,
          maximum: 365,
          description: "Number of past days to summarize (default 28).",
        },
      },
      required: [],
    },
  },
  {
    name: "get_recent_videos",
    description: "List the user's most recent published YouTube videos with basic stats.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 25 },
      },
      required: [],
    },
  },
  {
    name: "get_video_stats",
    description:
      "Deep stats for a single video: views, likes, watch time, retention, CTR (if available).",
    input_schema: {
      type: "object",
      properties: {
        videoId: { type: "string" },
      },
      required: ["videoId"],
    },
  },
];

interface RawIdea {
  title: string;
  hook: string;
  angle: string;
}

async function generateAndSaveIdeas(
  count: number,
  focus?: string,
): Promise<Idea[]> {
  const profile = await getProfile();
  const existingIdeas = await listIdeas();
  const publishedTitles = await listMyVideoTitles();
  const prompt = buildIdeaGenerationPrompt({
    profile,
    existingIdeas,
    publishedTitles,
    count,
    focus,
  });
  const raw = await callJson<RawIdea[]>({
    system: CHAT_SYSTEM_BASE,
    userPrompt: prompt,
    cacheSystem: true,
  });
  const now = Date.now();
  const saved: Idea[] = [];
  for (const r of raw) {
    const idea: Idea = {
      id: nanoid(10),
      title: r.title,
      hook: r.hook,
      angle: r.angle,
      status: "idea",
      createdAt: now,
    };
    await saveIdea(idea, true);
    saved.push(idea);
  }
  return saved;
}

async function generateInterviewForIdea(idea: Idea): Promise<string> {
  const profile = await getProfile();
  const prompt = buildInterviewQuestionsPrompt(idea, profile);
  const questions = await callJson<string[]>({
    system: CHAT_SYSTEM_BASE,
    userPrompt: prompt,
    cacheSystem: true,
  });
  const interviewId = nanoid(10);
  await saveInterview({
    id: interviewId,
    ideaId: idea.id,
    questions: questions.map((q) => ({ q })),
    currentIndex: 0,
  });
  idea.status = "interviewing";
  idea.interviewId = interviewId;
  await saveIdea(idea);
  return interviewId;
}

type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

const handlers: Record<string, ToolHandler> = {
  async generate_video_ideas(input) {
    const count = Math.min(Math.max(Number(input.count ?? 1), 1), 12);
    const focus = typeof input.focus === "string" ? input.focus : undefined;
    const ideas = await generateAndSaveIdeas(count, focus);
    return {
      ideas: ideas.map((i) => ({
        id: i.id,
        title: i.title,
        hook: i.hook,
        angle: i.angle,
      })),
      message: `Saved ${ideas.length} new idea(s) to the pipeline.`,
    };
  },

  async create_one_video_idea(input) {
    const focus = typeof input.focus === "string" ? input.focus : undefined;
    const [idea] = await generateAndSaveIdeas(1, focus);
    if (!idea) throw new Error("Idea generation returned empty");
    const interviewId = await generateInterviewForIdea(idea);
    return {
      ideaId: idea.id,
      title: idea.title,
      hook: idea.hook,
      interviewUrl: `/interview/${interviewId}`,
      message: `Created idea "${idea.title}" and queued the interview.`,
    };
  },

  async list_video_ideas(input) {
    const status = typeof input.status === "string" ? (input.status as IdeaStatus) : undefined;
    let ideas = await listIdeas();
    if (status) ideas = ideas.filter((i) => i.status === status);
    return {
      count: ideas.length,
      ideas: ideas.map((i) => ({
        id: i.id,
        title: i.title,
        hook: i.hook,
        status: i.status,
        createdAt: i.createdAt,
      })),
    };
  },

  async update_idea_status(input) {
    const id = String(input.id);
    const status = String(input.status) as IdeaStatus;
    const idea = await getIdea(id);
    if (!idea) return { error: "Idea not found" };
    idea.status = status;
    await saveIdea(idea);
    return { ok: true, id, status };
  },

  async start_video_interview(input) {
    const ideaId = String(input.ideaId);
    const idea = await getIdea(ideaId);
    if (!idea) return { error: "Idea not found" };
    if (idea.interviewId) {
      const existing = await getInterview(idea.interviewId);
      if (existing && !existing.completedAt) {
        return {
          interviewUrl: `/interview/${existing.id}`,
          message: "Interview already in progress.",
        };
      }
    }
    const interviewId = await generateInterviewForIdea(idea);
    return {
      interviewUrl: `/interview/${interviewId}`,
      message: `Interview ready with ${
        (await getInterview(interviewId))?.questions.length ?? 0
      } questions.`,
    };
  },

  async get_youtube_overview(input) {
    const days = Math.min(Math.max(Number(input.days ?? 28), 1), 365);
    const stats = await getOverview(days);
    if (!stats) {
      return { connected: false, message: "YouTube is not connected. Use Settings to connect." };
    }
    return { connected: true, ...stats };
  },

  async get_recent_videos(input) {
    const limit = Math.min(Math.max(Number(input.limit ?? 10), 1), 25);
    const videos = await getRecentVideos(limit);
    return { count: videos.length, videos };
  },

  async get_video_stats(input) {
    const videoId = String(input.videoId);
    const stats = await getVideoStats(videoId);
    if (!stats) return { error: "Video not found or YouTube not connected." };
    return stats;
  },
};

export async function runTool(name: string, input: unknown): Promise<unknown> {
  const handler = handlers[name];
  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }
  try {
    return await handler((input ?? {}) as Record<string, unknown>);
  } catch (e) {
    console.error(`Tool ${name} failed`, e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
