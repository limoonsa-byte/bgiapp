import { create } from "zustand";
import { getAdapter } from "@/gateway/adapter-provider";
import { useChatDockStore } from "@/store/console-stores/chat-dock-store";
import { workspaceSkillsEnsureDefaults } from "@/gateway/workspace-skills-client";

/**
 * Workbench interaction mode.
 * - create: creating a brand-new skill with a fresh chat session
 * - browse: viewing an existing skill's files without an active chat session
 * - edit:   editing an existing skill via the workbench chat sidebar
 *
 * Prior to the detail-page redesign this type lived in WorkbenchToolbar.tsx;
 * it now lives in the store so modes stay independent from any UI component.
 */
export type WorkbenchMode = "create" | "browse" | "edit";

const MERMAID_FENCE_RE = /```mermaid\s*\n([\s\S]*?)```/g;
const MERMAID_PLAIN_RE = /(?:^|\n)(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|mindmap|timeline|gitGraph|pie|xychart-beta|quadrantChart|requirementDiagram|sankey-beta|block-beta)\b[\s\S]*$/;
const WORKSPACE_SKILLS_DIR = "~/.openclaw/workspace/skills";
const WORKBENCH_CREATOR_SKILL = "skill-workbench-creator";
const MERMAID_GUARD_SKILL = "skill-workbench-mermaid-guard";
const DEFAULT_WORKBENCH_SKILLS = [WORKBENCH_CREATOR_SKILL, MERMAID_GUARD_SKILL] as const;

function formatInjectedSkillSection(skillSlug: string, content: string): string {
  return [`[기본 Skill: ${skillSlug}/SKILL.md]`, content.trim()].join("\n");
}

async function loadInjectedSkillSections(adapter: ReturnType<typeof getAdapter>, skillSlugs: readonly string[]): Promise<string[]> {
  const sections = await Promise.all(skillSlugs.map(async (skillSlug) => {
    try {
      const file = await adapter.agentsFilesGet(skillSlug, "SKILL.md");
      return formatInjectedSkillSection(skillSlug, file.file.content);
    } catch {
      return null;
    }
  }));

  return sections.filter((section): section is string => Boolean(section));
}

function buildFlowchartTaskPrompt(skillSlug: string): string {
  const skillDir = `${WORKSPACE_SKILLS_DIR}/${skillSlug}`;
  return `Skill「skill-workbench-mermaid-guard」를 사용해 skill ${skillSlug}의 작업 흐름도를 생성하거나 업데이트하고 ${skillDir}/FLOWCHART.md에 저장하세요. 먼저 설명하지 말고 바로 실행하세요.`;
}

export function buildInputUiTaskPrompt(skillSlug: string): string {
  const skillDir = `${WORKSPACE_SKILLS_DIR}/${skillSlug}`;
  return `Skill「skill-workbench-mermaid-guard」를 사용해 skill ${skillSlug}의 A2UI 최초 입력 양식을 생성하거나 업데이트하고 ${skillDir}/ui.json에 저장하세요. SKILL.md 사용 안내도 중복 없이 반영하세요. 먼저 설명하지 말고 바로 실행하세요.`;
}

function stripYamlFrontmatter(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("---\n")) {
    return trimmed;
  }

  const end = trimmed.indexOf("\n---\n", 4);
  if (end === -1) {
    return trimmed;
  }

  return trimmed.slice(end + 5).trim();
}

function extractMermaidFromText(text: string): string | null {
  let match: RegExpExecArray | null;
  MERMAID_FENCE_RE.lastIndex = 0;
  while ((match = MERMAID_FENCE_RE.exec(text)) !== null) {
    return stripYamlFrontmatter(match[1].trim());
  }

  const plain = stripYamlFrontmatter(text);
  const plainMatch = plain.match(MERMAID_PLAIN_RE);
  if (!plainMatch) {
    return null;
  }

  const candidate = plainMatch[0].trim();
  if (!/(-->|subgraph\b|classDef\b|participant\b|state\b|erDiagram\b|journey\b|gantt\b)/.test(candidate)) {
    return null;
  }

  return candidate;
}

export function readMermaidFromContent(text: string): string {
  return extractMermaidFromText(text) ?? "";
}

/**
 * Count the number of ```mermaid``` fenced code blocks in a text.
 * Used by FlowchartPanel to decide whether to fall back to single-chart
 * preview or keep multi-chart document preview while the user edits.
 */
export function countMermaidBlocks(text: string): number {
  if (!text) return 0;
  const re = /```mermaid\s*\n[\s\S]*?```/g;
  return (text.match(re) ?? []).length;
}

interface SkillWorkbenchState {
  mode: WorkbenchMode;
  currentSkillSlug: string | null;
  currentSkillName: string | null;

  mermaidSource: string;
  flowchartDocument: string;
  mermaidConfirmed: boolean;

  savedSessionKey: string | null;
  sessionActive: boolean;

  fileTree: string[];
  fileContent: string | null;
  selectedFile: string | null;
  isLoadingFiles: boolean;

  /** Message to auto-send when WorkbenchChat mounts (used by one-click flowchart generation) */
  pendingAutoSendMessage: string | null;

  setMode: (mode: WorkbenchMode) => void;
  setCurrentSkill: (slug: string, name: string) => void;
  clearCurrentSkill: () => void;

  setMermaidSource: (source: string) => void;
  setFlowchartDocument: (document: string) => void;
  confirmMermaid: () => void;
  resetMermaid: () => void;

  enterWorkbench: () => void;
  leaveWorkbench: () => void;

  setFileTree: (files: string[]) => void;
  setSelectedFile: (path: string | null) => void;
  setFileContent: (content: string | null) => void;
  setLoadingFiles: (loading: boolean) => void;
  setPendingAutoSendMessage: (msg: string | null) => void;
}

export const useSkillWorkbenchStore = create<SkillWorkbenchState>((set, get) => ({
  mode: "browse",
  currentSkillSlug: null,
  currentSkillName: null,

  mermaidSource: "",
  flowchartDocument: "",
  mermaidConfirmed: false,

  savedSessionKey: null,
  sessionActive: false,

  fileTree: [],
  fileContent: null,
  selectedFile: null,
  isLoadingFiles: false,
  pendingAutoSendMessage: null,

  setMode: (mode) => {
    set({ mode });
  },

  setCurrentSkill: (slug, name) => set({ currentSkillSlug: slug, currentSkillName: name }),
  clearCurrentSkill: () => set({
    currentSkillSlug: null,
    currentSkillName: null,
    mermaidSource: "",
    flowchartDocument: "",
    mermaidConfirmed: false,
  }),

  setMermaidSource: (source) => set({ mermaidSource: source, mermaidConfirmed: false }),
  setFlowchartDocument: (flowchartDocument) => set({ flowchartDocument }),
  confirmMermaid: () => set({ mermaidConfirmed: true }),
  resetMermaid: () => set({ mermaidSource: "", flowchartDocument: "", mermaidConfirmed: false }),

  enterWorkbench: async () => {
    // Ensure that the built-in default workbench skills (e.g. the mermaid
    // guard) are installed into the user's ~/.openclaw/workspace/skills/
    // directory before we try to inject them as system context. The embedded
    // server ships these skills inside the npm package and will copy them
    // on demand. Failures here are silent: the workbench still works, the
    // injected skill section for a missing skill will just be dropped.
    try {
      await workspaceSkillsEnsureDefaults(DEFAULT_WORKBENCH_SKILLS);
    } catch (err) {
      console.warn("[skill-workbench] ensure default skills failed:", err);
    }

    const chatStore = useChatDockStore.getState();
    const { savedSessionKey, mode, currentSkillSlug } = get();
    // Use the currently active agent (e.g. "main") so the Gateway routes correctly.
    const agentId = chatStore.targetAgentId ?? "main";

    // Only save the original session on first entry; don't overwrite on mode switches.
    set({
      savedSessionKey: savedSessionKey ?? chatStore.currentSessionKey,
      sessionActive: true,
    });

    if (mode === "create") {
      // Use newSession to create a fresh, empty session with standard key format.
      // newSession sets isHistoryLoaded=true, preventing auto-load of stale history.
      chatStore.newSession(agentId);

      // Inject skill-workbench-creator instructions as system context
      // so the agent follows the structured skill creation workflow.
      try {
        const adapter = getAdapter();
        const sections = await loadInjectedSkillSections(adapter, DEFAULT_WORKBENCH_SKILLS);
        const sessionKey = chatStore.currentSessionKey;
        if (sections.length > 0) {
          await adapter.chatInject(
            sessionKey,
            [`[시스템: 이번 대화에서는 Skills 작업대의 기본 스킬 지침에 따라 작업하세요]`, ...sections].join("\n\n"),
          );
        }
      } catch {
        // Gracefully degrade when default workbench skills are unavailable.
      }
    } else if ((mode === "edit" || mode === "browse") && currentSkillSlug) {
      const pendingMsg = get().pendingAutoSendMessage;
      // Always stamp the session key with the entry timestamp so that each
      // "edit this skill" click starts a brand-new chat session without
      // leftover history from a previous edit.
      const key = pendingMsg
        ? `agent:${agentId}:skill-workbench-flowchart-${currentSkillSlug}:${Date.now()}`
        : `agent:${agentId}:skill-workbench-${mode}-${currentSkillSlug}:${Date.now()}`;
      chatStore.switchSession(key);

      try {
        const adapter = getAdapter();
        const sections = await loadInjectedSkillSections(adapter, DEFAULT_WORKBENCH_SKILLS);
        const skillDir = `${WORKSPACE_SKILLS_DIR}/${currentSkillSlug}`;
        await adapter.chatInject(
          key,
          [
            `[시스템: 현재 skill ${currentSkillSlug}을(를) ${mode === "browse" ? "검토 및 수정" : "수정"} 중입니다]`,
            `대상 디렉터리: ${skillDir}`,
            "【엄격한 작업 범위 제한 - 위반 시 오류로 간주】",
            `1. ${skillDir}/ 디렉터리 아래 파일만 읽고 쓸 수 있습니다 (SKILL.md / FLOWCHART.md / ui.json / _meta.json / scripts/ / references/ / tests/ 등).`,
            "2. 다른 skill 디렉터리, 전역 설정 파일(예: ~/.openclaw/config.* , ~/.openclaw/agents/* , ~/.openclaw/settings/*), 그리고 ~/.openclaw/workspace/skills/ 밖의 경로는 수정할 수 없습니다.",
            "3. 다른 skill을 생성/삭제/이름변경할 수 없으며, 현재 skill의 slug와 디렉터리명도 변경할 수 없습니다.",
            "4. read / write / edit / shell 실행 전 대상 경로가 " + skillDir + "/ 로 시작하는지 반드시 확인하세요. 범위를 벗어난 요청은 거절하고 “스킬 작업대에서는 현재 skill만 수정할 수 있습니다”라고 안내하세요.",
            "5. 흐름도 구조 변경 → FLOWCHART.md, 스킬 설명/동작 → SKILL.md, A2UI 양식 → ui.json을 수정하세요. 필요하면 여러 파일을 함께 수정할 수 있습니다.",
            ...sections,
          ].join("\n"),
        );
      } catch {
        // Ignore context injection failures; the user can still continue manually.
      }

      // Send pending auto-message AFTER session switch (correct key is now set).
      // Must happen here (not in WorkbenchChat useEffect) because child effects
      // fire before parent effects — sending from the child would use the old key.
      if (pendingMsg) {
        set({ pendingAutoSendMessage: null });
        await useChatDockStore.getState().clearMessages();
        void useChatDockStore.getState().sendMessage(buildFlowchartTaskPrompt(currentSkillSlug));
      }
    }
  },

  leaveWorkbench: () => {
    const { savedSessionKey } = get();
    if (savedSessionKey) {
      useChatDockStore.getState().switchSession(savedSessionKey);
    }
    set({ sessionActive: false, savedSessionKey: null });
  },

  setFileTree: (files) => set({ fileTree: files }),
  setSelectedFile: (path) => set({ selectedFile: path }),
  setFileContent: (content) => set({ fileContent: content }),
  setLoadingFiles: (loading) => set({ isLoadingFiles: loading }),
  setPendingAutoSendMessage: (msg) => set({ pendingAutoSendMessage: msg }),
}));

/**
 * Extract the last mermaid code block from messages and streaming content.
 */
export function extractLatestMermaid(
  messages: Array<{ role: string; content: string }>,
  streamingContent?: string | null,
): string | null {
  const sources = [
    ...(streamingContent ? [streamingContent] : []),
    ...messages
      .filter((m) => m.role === "assistant")
      .map((m) => m.content)
      .reverse(),
  ];

  for (const text of sources) {
    const mermaid = extractMermaidFromText(text);
    if (mermaid) return mermaid;
  }
  return null;
}
