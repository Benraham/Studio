import { google, type youtube_v3, type youtubeAnalytics_v2 } from "googleapis";
import {
  deleteYtTokens,
  getMyVideos,
  getYtTokens,
  setMyVideos,
  setYtTokens,
} from "./kv";
import type { YouTubeTokens } from "./types";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error("NEXT_PUBLIC_APP_URL is not set");
  return `${base.replace(/\/$/, "")}/api/youtube/auth/callback`;
}

function newOAuth2() {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET not set");
  }
  return new google.auth.OAuth2(id, secret, getRedirectUri());
}

export function buildAuthUrl(state: string): string {
  const oauth = newOAuth2();
  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeCode(code: string): Promise<YouTubeTokens> {
  const oauth = newOAuth2();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error(
      "OAuth response missing tokens. Make sure prompt=consent and access_type=offline.",
    );
  }
  oauth.setCredentials(tokens);

  const yt = google.youtube({ version: "v3", auth: oauth });
  const me = await yt.channels.list({ part: ["snippet"], mine: true });
  const channel = me.data.items?.[0];
  const channelId = channel?.id ?? "";
  const channelTitle = channel?.snippet?.title ?? "Your channel";

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiry_date ?? Date.now() + 55 * 60 * 1000,
    channel_id: channelId,
    channel_title: channelTitle,
  };
}

async function getAuthorizedClient() {
  const stored = await getYtTokens();
  if (!stored) return null;

  const oauth = newOAuth2();
  oauth.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    expiry_date: stored.expires_at,
  });

  if (Date.now() > stored.expires_at - 60_000) {
    try {
      const refreshed = await oauth.refreshAccessToken();
      const t = refreshed.credentials;
      const updated: YouTubeTokens = {
        ...stored,
        access_token: t.access_token ?? stored.access_token,
        expires_at: t.expiry_date ?? Date.now() + 55 * 60 * 1000,
      };
      await setYtTokens(updated);
      oauth.setCredentials({
        access_token: updated.access_token,
        refresh_token: updated.refresh_token,
        expiry_date: updated.expires_at,
      });
    } catch (e) {
      console.error("YouTube token refresh failed", e);
      return null;
    }
  }

  return { oauth, tokens: stored };
}

export async function isYouTubeConnected(): Promise<{
  connected: boolean;
  channelTitle?: string;
}> {
  const tokens = await getYtTokens();
  if (!tokens) return { connected: false };
  return { connected: true, channelTitle: tokens.channel_title };
}

export async function disconnectYouTube(): Promise<void> {
  await deleteYtTokens();
}

interface OverviewStats {
  views: number;
  watchTimeMinutes: number;
  subscribersGained: number;
  averageViewDuration: number;
  impressions?: number;
  ctr?: number;
  days: number;
}

export async function getOverview(days: number): Promise<OverviewStats | null> {
  const auth = await getAuthorizedClient();
  if (!auth) return null;
  const ytAnalytics = google.youtubeAnalytics({ version: "v2", auth: auth.oauth });
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  try {
    const res = await ytAnalytics.reports.query({
      ids: "channel==MINE",
      startDate: fmt(start),
      endDate: fmt(end),
      metrics:
        "views,estimatedMinutesWatched,subscribersGained,averageViewDuration,cardImpressions,cardClickRate",
    });
    const row = res.data.rows?.[0] ?? [];
    return {
      views: Number(row[0] ?? 0),
      watchTimeMinutes: Number(row[1] ?? 0),
      subscribersGained: Number(row[2] ?? 0),
      averageViewDuration: Number(row[3] ?? 0),
      impressions: row[4] !== undefined ? Number(row[4]) : undefined,
      ctr: row[5] !== undefined ? Number(row[5]) : undefined,
      days,
    };
  } catch (e) {
    console.error("YT analytics overview failed", e);
    return null;
  }
}

export interface RecentVideo {
  id: string;
  title: string;
  publishedAt: string;
  views?: number;
  likes?: number;
  duration?: string;
}

export async function getRecentVideos(limit = 10): Promise<RecentVideo[]> {
  const auth = await getAuthorizedClient();
  if (!auth) return [];
  const yt = google.youtube({ version: "v3", auth: auth.oauth });
  try {
    const search = await yt.search.list({
      part: ["id", "snippet"],
      forMine: true,
      type: ["video"],
      order: "date",
      maxResults: Math.min(limit, 50),
    });
    const videoIds = (search.data.items ?? [])
      .map((it) => it.id?.videoId)
      .filter((x): x is string => Boolean(x));
    if (videoIds.length === 0) return [];
    const detail = await yt.videos.list({
      part: ["snippet", "statistics", "contentDetails"],
      id: videoIds,
    });
    return (detail.data.items ?? []).map((v: youtube_v3.Schema$Video) => ({
      id: v.id ?? "",
      title: v.snippet?.title ?? "(untitled)",
      publishedAt: v.snippet?.publishedAt ?? "",
      views: v.statistics?.viewCount ? Number(v.statistics.viewCount) : undefined,
      likes: v.statistics?.likeCount ? Number(v.statistics.likeCount) : undefined,
      duration: v.contentDetails?.duration ?? undefined,
    }));
  } catch (e) {
    console.error("YT recent videos failed", e);
    return [];
  }
}

export interface VideoDeepStats {
  id: string;
  title: string;
  views: number;
  likes: number;
  watchTimeMinutes?: number;
  averageViewDuration?: number;
  averageViewPercentage?: number;
  ctr?: number;
  impressions?: number;
}

export async function getVideoStats(videoId: string): Promise<VideoDeepStats | null> {
  const auth = await getAuthorizedClient();
  if (!auth) return null;
  const yt = google.youtube({ version: "v3", auth: auth.oauth });
  const ytAnalytics = google.youtubeAnalytics({ version: "v2", auth: auth.oauth });
  try {
    const detail = await yt.videos.list({
      part: ["snippet", "statistics"],
      id: [videoId],
    });
    const v = detail.data.items?.[0];
    if (!v) return null;
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    let analytics: youtubeAnalytics_v2.Schema$QueryResponse | null = null;
    try {
      const res = await ytAnalytics.reports.query({
        ids: "channel==MINE",
        startDate: fmt(start),
        endDate: fmt(end),
        metrics:
          "estimatedMinutesWatched,averageViewDuration,averageViewPercentage,cardImpressions,cardClickRate",
        filters: `video==${videoId}`,
      });
      analytics = res.data;
    } catch (e) {
      console.error("YT analytics for video failed", e);
    }
    const row = analytics?.rows?.[0] ?? [];
    return {
      id: v.id ?? videoId,
      title: v.snippet?.title ?? "(untitled)",
      views: v.statistics?.viewCount ? Number(v.statistics.viewCount) : 0,
      likes: v.statistics?.likeCount ? Number(v.statistics.likeCount) : 0,
      watchTimeMinutes: row[0] !== undefined ? Number(row[0]) : undefined,
      averageViewDuration: row[1] !== undefined ? Number(row[1]) : undefined,
      averageViewPercentage: row[2] !== undefined ? Number(row[2]) : undefined,
      impressions: row[3] !== undefined ? Number(row[3]) : undefined,
      ctr: row[4] !== undefined ? Number(row[4]) : undefined,
    };
  } catch (e) {
    console.error("YT video stats failed", e);
    return null;
  }
}

export async function listMyVideoTitles(force = false): Promise<string[]> {
  const cached = await getMyVideos();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  if (!force && cached && Date.now() - cached.fetchedAt < ONE_DAY) {
    return cached.titles;
  }
  const auth = await getAuthorizedClient();
  if (!auth) return cached?.titles ?? [];
  const yt = google.youtube({ version: "v3", auth: auth.oauth });
  const titles: string[] = [];
  let pageToken: string | undefined;
  try {
    for (let page = 0; page < 4; page++) {
      const res = await yt.search.list({
        part: ["snippet"],
        forMine: true,
        type: ["video"],
        order: "date",
        maxResults: 50,
        pageToken,
      });
      for (const it of res.data.items ?? []) {
        const t = it.snippet?.title;
        if (t) titles.push(t);
      }
      pageToken = res.data.nextPageToken ?? undefined;
      if (!pageToken) break;
    }
  } catch (e) {
    console.error("YT list titles failed", e);
    return cached?.titles ?? [];
  }
  await setMyVideos({ titles, fetchedAt: Date.now() });
  return titles;
}
