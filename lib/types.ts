export type IdeaStatus = "idea" | "interviewing" | "ready" | "recorded" | "posted";

export interface Idea {
  id: string;
  title: string;
  hook: string;
  angle: string;
  status: IdeaStatus;
  tags?: string[];
  createdAt: number;
  interviewId?: string;
  slidesAt?: number;
}

export interface InterviewQA {
  q: string;
  a?: string;
}

export interface Interview {
  id: string;
  ideaId: string;
  questions: InterviewQA[];
  currentIndex: number;
  completedAt?: number;
}

export type SlideLayout = "default" | "stat" | "chart" | "steps" | "quote";

export interface Slide {
  layout?: SlideLayout;
  title: string;
  bullets?: string[];
  body?: string;
  speakerNotes?: string;
  // Layout-specific payloads:
  stat?: { value: string; label: string; context?: string };
  chart?: {
    type: "bar";
    items: { label: string; value: number }[];
    unit?: string;
    maxValue?: number;
  };
  steps?: { steps: string[] };
  quote?: string;
}

export interface SlideDeck {
  slides: Slide[];
  generatedAt: number;
}

export interface Profile {
  background: string;
  expertise: string;
  hotTakes: string;
  voice: string;
  audience: string;
  completedAt: number;
  rawAnswers: { q: string; a: string }[];
}

export interface YouTubeTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  channel_id: string;
  channel_title: string;
}

export interface YouTubeMyVideos {
  titles: string[];
  fetchedAt: number;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  toolCalls?: { name: string; input: unknown; result?: unknown }[];
  createdAt: number;
}

export interface ChatThread {
  messages: ChatMessage[];
}

export type ShortFormStatus = "idea" | "scripted" | "filmed" | "posted";

export interface ShortFormIdea {
  id: string;
  title: string;
  hook: string;
  angle: string;
  duration: 15 | 30 | 45 | 60 | 90;
  status: ShortFormStatus;
  createdAt: number;
  scriptAt?: number;
}

export interface ShortFormScript {
  ideaId: string;
  hook: string;
  body: string;
  close: string;
  generatedAt: number;
}
