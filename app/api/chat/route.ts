import type Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { getChatThread, saveChatThread } from "@/lib/kv";
import { CHAT_SYSTEM_BASE, buildProfileSnippet } from "@/lib/prompts";
import { getProfile, listIdeas } from "@/lib/kv";
import { isYouTubeConnected, listMyVideoTitles } from "@/lib/youtube";
import { runTool, toolDefs } from "@/lib/tools";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatPostBody {
  message: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatPostBody;
  if (!body?.message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const profile = await getProfile();
  const ideas = await listIdeas();
  const yt = await isYouTubeConnected();
  const titles = yt.connected ? await listMyVideoTitles() : [];

  const contextLines: string[] = [];
  contextLines.push(buildProfileSnippet(profile));
  contextLines.push("");
  if (ideas.length > 0) {
    contextLines.push("## CURRENT PIPELINE");
    for (const i of ideas) {
      contextLines.push(`- [${i.status}] ${i.id} — ${i.title}`);
    }
  } else {
    contextLines.push("## CURRENT PIPELINE\n(empty)");
  }
  contextLines.push("");
  contextLines.push(
    yt.connected
      ? `## YOUTUBE: connected to "${yt.channelTitle}" (${titles.length} published video(s))`
      : "## YOUTUBE: not connected — analytics tools will return an error.",
  );

  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: CHAT_SYSTEM_BASE,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: contextLines.join("\n"),
    },
  ];

  // Load thread + push user message
  const thread = await getChatThread();
  const userMsg: ChatMessage = {
    id: nanoid(8),
    role: "user",
    content: body.message,
    createdAt: Date.now(),
  };
  thread.messages.push(userMsg);

  // Build Anthropic message history
  const apiMessages: Anthropic.MessageParam[] = thread.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const a = getAnthropic();
  const accumulatedToolCalls: { name: string; input: unknown; result?: unknown }[] = [];
  let finalText = "";

  // Agent loop — up to 6 iterations
  for (let step = 0; step < 6; step++) {
    const res = await a.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemBlocks,
      tools: toolDefs,
      messages: apiMessages,
    });

    // Collect text + tool uses from this response
    const textParts: string[] = [];
    const toolUses: Anthropic.ToolUseBlock[] = [];
    for (const block of res.content) {
      if (block.type === "text") textParts.push(block.text);
      else if (block.type === "tool_use") toolUses.push(block);
    }
    finalText = textParts.join("\n").trim();

    if (toolUses.length === 0 || res.stop_reason === "end_turn") {
      break;
    }

    // Push assistant message (with tool_use blocks) into history
    apiMessages.push({ role: "assistant", content: res.content });

    // Run tools and push tool_result blocks
    const resultBlocks: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const result = await runTool(tu.name, tu.input);
      accumulatedToolCalls.push({ name: tu.name, input: tu.input, result });
      resultBlocks.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(result),
      });
    }
    apiMessages.push({ role: "user", content: resultBlocks });
  }

  if (!finalText) {
    finalText = "(no response)";
  }

  const assistantMsg: ChatMessage = {
    id: nanoid(8),
    role: "assistant",
    content: finalText,
    toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined,
    createdAt: Date.now(),
  };
  thread.messages.push(assistantMsg);
  await saveChatThread(thread);

  return NextResponse.json({
    message: assistantMsg,
    toolCalls: accumulatedToolCalls,
  });
}

export async function GET() {
  const thread = await getChatThread();
  return NextResponse.json({ messages: thread.messages });
}

export async function DELETE() {
  await saveChatThread({ messages: [] });
  return NextResponse.json({ ok: true });
}
