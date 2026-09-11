import http from 'node:http';
import fs from 'node:fs';
import { URL } from 'node:url';

const port = Number(process.env.ORO_AUTH_HELPER_PORT || '18800');
const token = process.env.ORO_AUTH_HELPER_TOKEN || '';
const logFile = process.env.ORO_OAUTH_LOG || '/home/node/.openclaw/oro-openai-oauth.log';
const fifo = process.env.ORO_OAUTH_FIFO || '/tmp/oro-openai-oauth-in';
const doneMarker = process.env.ORO_OAUTH_DONE || '/home/node/.openclaw/.oro-openai-oauth-complete';

function authorized(reqUrl) {
  if (!token) return true;
  return reqUrl.searchParams.get('token') === token;
}

function readLog() {
  try { return fs.readFileSync(logFile, 'utf8'); } catch { return ''; }
}

function extractAuthUrl(text) {
  const matches = text.match(/https:\/\/auth\.openai\.com\/oauth\/authorize\?[^\s\x1b]+/g);
  if (!matches?.length) return '';
  return matches[matches.length - 1].replace(/[\r\n]+/g, '');
}

function statusPayload() {
  const log = readLog();
  const authUrl = extractAuthUrl(log);
  const done = fs.existsSync(doneMarker) || /OAuth.*(complete|success)|Model configured/i.test(log);
  const failed = /OAuth failed|token_exchange|error:/i.test(log) && !done;
  return { authUrl, done, failed };
}

function html(authToken) {
  const qp = authToken ? `?token=${encodeURIComponent(authToken)}` : '';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ORO ChatGPT 연결</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#0f1115;color:#fff;margin:0;padding:24px}.card{max-width:620px;margin:0 auto;background:#191d24;border:1px solid #2b313b;border-radius:20px;padding:22px}h1{font-size:24px;margin:0 0 10px}.muted{color:#aab3c0;line-height:1.55}.btn{display:block;width:100%;box-sizing:border-box;text-align:center;background:#fff;color:#111;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;border:0;font-size:16px;margin:14px 0}textarea{width:100%;min-height:120px;box-sizing:border-box;border-radius:12px;border:1px solid #39414d;background:#0f1319;color:#fff;padding:12px;font-size:14px}button{width:100%;padding:14px;border:0;border-radius:12px;background:#2f7df4;color:#fff;font-weight:700;font-size:16px;margin-top:10px}.ok{color:#7be495}.warn{color:#ffd166}.err{color:#ff7b7b}code{word-break:break-all}</style></head><body><div class="card"><h1>ORO AI OFFICE · ChatGPT 연결</h1><p class="muted">API 키 없이 현재 ChatGPT/Codex 구독으로 OpenClaw를 연결합니다.</p><div id="state" class="warn">로그인 링크 준비 중…</div><a id="login" class="btn" href="#" target="_blank" style="display:none">ChatGPT로 로그인</a><p class="muted">로그인 후 브라우저가 <code>localhost:1455</code>로 이동하며 페이지가 안 열려도 정상입니다. 주소창의 <b>전체 URL</b>을 복사해서 아래에 붙여 넣으세요.</p><form method="post" action="/callback${qp}"><textarea name="callback" placeholder="http://localhost:1455/auth/callback?code=...&state=..."></textarea><button type="submit">이 URL로 연결 완료</button></form></div><script>const q='${qp}';async function tick(){try{const r=await fetch('/status'+q);const s=await r.json();const st=document.getElementById('state');const a=document.getElementById('login');if(s.done){st.className='ok';st.textContent='ChatGPT 연결 완료. ORO AI OFFICE에서 사용할 수 있습니다.';a.style.display='none';return;}if(s.failed){st.className='err';st.textContent='로그인 처리 중 오류가 있었습니다. 새 로그인 링크를 다시 시도하세요.';}else if(s.authUrl){st.className='ok';st.textContent='로그인 링크 준비 완료';a.href=s.authUrl;a.style.display='block';}else{st.className='warn';st.textContent='로그인 링크 준비 중…';}setTimeout(tick,1500)}catch{setTimeout(tick,2000)}}tick();</script></body></html>`;
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (!authorized(reqUrl)) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/status') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(statusPayload()));
    return;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/callback') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const callback = (params.get('callback') || '').trim();
      if (!/^http:\/\/localhost:1455\/auth\/callback\?/.test(callback) && !/^http:\/\/127\.0\.0\.1:1455\/auth\/callback\?/.test(callback)) {
        res.writeHead(400, { 'content-type': 'text/html; charset=utf-8' });
        res.end('<h3>콜백 URL 형식이 올바르지 않습니다. localhost:1455 전체 주소를 붙여 넣어주세요.</h3>');
        return;
      }
      try {
        fs.appendFileSync(fifo, `${callback}\n`, { encoding: 'utf8' });
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;padding:24px"><h2>전송 완료</h2><p>ChatGPT OAuth 완료를 확인 중입니다. 5~10초 후 이전 화면으로 돌아가 상태를 확인하세요.</p></body>');
      } catch (err) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`Failed to send callback: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html(token));
});

server.listen(port, '0.0.0.0', () => console.log(`[ORO] OAuth helper listening on ${port}`));
