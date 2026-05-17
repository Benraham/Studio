import { kv } from "@vercel/kv";
import type {
  ChatThread,
  Idea,
  Interview,
  Profile,
  SlideDeck,
  YouTubeMyVideos,
  YouTubeTokens,
} from "./types";

export const keys = {
  profile: "profile:user",
  ytTokens: "auth:yt_tokens",
  ytMyVideos: "yt:my_videos",
  ideasIndex: "ideas:index",
  idea: (id: string) => `idea:${id}`,
  interview: (id: string) => `interview:${id}`,
  slides: (id: string) => `slides:${id}`,
  chatThread: "chat:thread",
};

// Profile
export async function getProfile(): Promise<Profile | null> {
  return (await kv.get<Profile>(keys.profile)) ?? null;
}

export async function setProfile(profile: Profile): Promise<void> {
  await kv.set(keys.profile, profile);
}

// YouTube tokens
export async function getYtTokens(): Promise<YouTubeTokens | null> {
  return (await kv.get<YouTubeTokens>(keys.ytTokens)) ?? null;
}

export async function setYtTokens(tokens: YouTubeTokens): Promise<void> {
  await kv.set(keys.ytTokens, tokens);
}

export async function deleteYtTokens(): Promise<void> {
  await kv.del(keys.ytTokens);
}

// YouTube my videos cache
export async function getMyVideos(): Promise<YouTubeMyVideos | null> {
  return (await kv.get<YouTubeMyVideos>(keys.ytMyVideos)) ?? null;
}

export async function setMyVideos(v: YouTubeMyVideos): Promise<void> {
  await kv.set(keys.ytMyVideos, v);
}

// Ideas
export async function listIdeaIds(): Promise<string[]> {
  return (await kv.lrange<string>(keys.ideasIndex, 0, -1)) ?? [];
}

export async function getIdea(id: string): Promise<Idea | null> {
  return (await kv.get<Idea>(keys.idea(id))) ?? null;
}

export async function listIdeas(): Promise<Idea[]> {
  const ids = await listIdeaIds();
  if (ids.length === 0) return [];
  const ideas = await Promise.all(ids.map((id) => getIdea(id)));
  return ideas.filter((x): x is Idea => x !== null);
}

export async function saveIdea(idea: Idea, isNew = false): Promise<void> {
  await kv.set(keys.idea(idea.id), idea);
  if (isNew) {
    await kv.lpush(keys.ideasIndex, idea.id);
  }
}

export async function deleteIdea(id: string): Promise<void> {
  await kv.del(keys.idea(id));
  await kv.lrem(keys.ideasIndex, 0, id);
}

// Interviews
export async function getInterview(id: string): Promise<Interview | null> {
  return (await kv.get<Interview>(keys.interview(id))) ?? null;
}

export async function saveInterview(interview: Interview): Promise<void> {
  await kv.set(keys.interview(interview.id), interview);
}

// Slides
export async function getSlides(id: string): Promise<SlideDeck | null> {
  return (await kv.get<SlideDeck>(keys.slides(id))) ?? null;
}

export async function saveSlides(id: string, deck: SlideDeck): Promise<void> {
  await kv.set(keys.slides(id), deck);
}

// Chat thread
export async function getChatThread(): Promise<ChatThread> {
  return (await kv.get<ChatThread>(keys.chatThread)) ?? { messages: [] };
}

export async function saveChatThread(thread: ChatThread): Promise<void> {
  await kv.set(keys.chatThread, thread);
}

export async function clearChatThread(): Promise<void> {
  await kv.del(keys.chatThread);
}
