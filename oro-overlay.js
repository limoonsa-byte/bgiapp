(() => {
  const DICT = new Map(Object.entries({
    "OpenClaw Office":"ORO AI OFFICE",
    "Office":"가상 사무실",
    "Chat":"AI 채팅",
    "Dashboard":"종합 현황",
    "Agents":"AI 직원",
    "Channels":"연결 채널",
    "Skills":"스킬",
    "Skill Workbench":"스킬 작업실",
    "Cron":"자동 실행",
    "Settings":"설정",
    "Overview":"개요",
    "Activity":"실시간 활동",
    "Recent Activity":"최근 활동",
    "Total Agents":"전체 AI 직원",
    "Active Agents":"작업 중 직원",
    "Online":"온라인",
    "Offline":"오프라인",
    "Idle":"대기",
    "Working":"작업 중",
    "Thinking":"생각 중",
    "Speaking":"대화 중",
    "Tool Calling":"도구 실행 중",
    "Error":"오류",
    "Connected":"연결됨",
    "Disconnected":"연결 끊김",
    "Connect":"연결",
    "Disconnect":"연결 해제",
    "New Session":"새 대화",
    "New Chat":"새 대화",
    "Search":"검색",
    "Send":"보내기",
    "Cancel":"취소",
    "Save":"저장",
    "Delete":"삭제",
    "Create":"만들기",
    "Update":"업데이트",
    "Install":"설치",
    "Installed":"설치됨",
    "All":"전체",
    "Name":"이름",
    "Status":"상태",
    "Model":"모델",
    "Tools":"도구",
    "Files":"파일",
    "Theme":"테마",
    "Language":"언어",
    "Appearance":"화면",
    "Gateway":"게이트웨이",
    "Developer":"개발자",
    "Advanced":"고급",
    "About":"정보",
    "Updates":"업데이트",
    "Sessions":"세션",
    "Session":"세션",
    "Tasks":"업무",
    "Task":"업무",
    "Cost":"비용",
    "Tokens":"토큰",
    "Usage":"사용량",
    "Workspace":"작업공간",
    "Meeting":"회의",
    "Meeting Room":"회의실",
    "Lounge":"휴게실",
    "Desk":"자리",
    "Hot Desk":"공용 자리",
    "Loading...":"불러오는 중...",
    "No data":"데이터 없음",
    "No agents":"AI 직원 없음",
    "Refresh":"새로고침",
    "Close":"닫기",
    "Back":"뒤로",
    "Next":"다음",
    "Done":"완료",
    "Success":"성공",
    "Failed":"실패",
    "Unknown":"알 수 없음",
    "Password":"비밀번호",
    "Access Token":"접근 토큰",
    "Gateway URL":"Gateway 주소",
    "Connect to OpenClaw Gateway":"OpenClaw Gateway 연결",
    "Mock Mode":"모의 실행 모드"
  }));

  const ROLE_ICONS = ["✨","🛡️","🧙","📐","📝","🔧","🧠","📣","🧪","💡","🎯","📊"];

  function translateTextNode(node) {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const raw = node.nodeValue || "";
    const trimmed = raw.trim();
    if (!trimmed) return;
    const hit = DICT.get(trimmed);
    if (hit) node.nodeValue = raw.replace(trimmed, hit);
  }

  function translateAttributes(el) {
    if (!(el instanceof Element)) return;
    ["placeholder","title","aria-label"].forEach(attr => {
      const v = el.getAttribute(attr);
      if (v && DICT.has(v.trim())) el.setAttribute(attr, DICT.get(v.trim()));
    });
  }

  function walk(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) translateTextNode(n);
    if (root.querySelectorAll) root.querySelectorAll("*").forEach(translateAttributes);
    decorateAgents();
    brand();
  }

  function brand() {
    document.title = "ORO AI OFFICE";
    document.documentElement.lang = "ko";
    document.querySelectorAll("h1,h2,h3,strong,span,div").forEach(el => {
      if (el.children.length === 0 && el.textContent && el.textContent.trim() === "OpenClaw Office") {
        el.textContent = "ORO AI OFFICE";
      }
    });
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function decorateAgents() {
    document.querySelectorAll("g[data-agent-id]").forEach(group => {
      if (group.querySelector(":scope > .oro-role-icon")) return;
      const id = group.getAttribute("data-agent-id") || "agent";
      const ns = "http://www.w3.org/2000/svg";
      const text = document.createElementNS(ns, "text");
      text.setAttribute("class", "oro-role-icon");
      text.setAttribute("x", "13");
      text.setAttribute("y", "-19");
      text.setAttribute("font-size", "12");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("aria-hidden", "true");
      text.textContent = ROLE_ICONS[hash(id) % ROLE_ICONS.length];
      group.appendChild(text);
    });
  }

  try {
    localStorage.setItem("i18nextLng", "en");
    localStorage.setItem("oroAiOfficeSkin", "ko-pixel");
  } catch {}

  const obs = new MutationObserver(mutations => {
    for (const m of mutations) {
      m.addedNodes.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) translateTextNode(n);
        else if (n.nodeType === Node.ELEMENT_NODE) walk(n);
      });
    }
    decorateAgents();
  });

  const boot = () => {
    walk(document.body);
    obs.observe(document.body, {childList:true, subtree:true});
    setInterval(decorateAgents, 1500);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();