(() => {
  "use strict";

  const GIST_RAW =
    "https://gist.githubusercontent.com/huyueqiu520/d7854660d23c5085d41fc9d6c841b397/raw/max_px_url.json";
  const POLL_MS = 15000;

  const $liveDot = document.getElementById("liveDot");
  const $liveLabel = document.getElementById("liveLabel");
  const $mainHost = document.getElementById("mainHost");
  const $altHost = document.getElementById("altHost");
  const $mainBtn = document.getElementById("mainBtn");
  const $altBtn = document.getElementById("altBtn");
  const $ctaBtn = document.getElementById("ctaBtn");
  const $copyBtn = document.getElementById("copyBtn");
  const $entryTip = document.getElementById("entryTip");
  const $toast = document.getElementById("toast");

  const state = {
    https: "",
    http: "",
    fetchedAt: 0,
    ok: false,
    lastError: "",
  };

  function showToast(msg, ms = 2200) {
    $toast.textContent = msg;
    $toast.hidden = false;
    requestAnimationFrame(() => $toast.classList.add("show"));
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      $toast.classList.remove("show");
      setTimeout(() => ($toast.hidden = true), 260);
    }, ms);
  }

  function setLive(stateStr, msg) {
    // stateStr: 'loading' | 'live' | 'offline' | 'stale'
    $liveDot.classList.remove("live", "offline", "stale");
    if (stateStr === "live") $liveDot.classList.add("live");
    else if (stateStr === "offline") $liveDot.classList.add("offline");
    else if (stateStr === "stale") $liveDot.classList.add("stale");
    $liveLabel.textContent = msg;
  }

  function hostOf(url) {
    if (!url) return "—";
    try {
      return new URL(url).host;
    } catch (_) {
      return url;
    }
  }

  function updateLinks() {
    const https = state.https;
    const http = state.http;
    if (https) {
      $mainBtn.href = https;
      $ctaBtn.href = https;
      $mainHost.textContent = hostOf(https);
    } else if (http) {
      $mainBtn.href = http;
      $ctaBtn.href = http;
      $mainHost.textContent = hostOf(http) + "  (https 不可用)";
    } else {
      $mainBtn.removeAttribute("href");
      $ctaBtn.removeAttribute("href");
      $mainHost.textContent = "—";
    }
    if (http) {
      $altBtn.href = http;
      $altHost.textContent = hostOf(http);
    } else {
      $altBtn.removeAttribute("href");
      $altHost.textContent = "—";
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {}
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (_) {}
    document.body.removeChild(ta);
    return ok;
  }

  async function fetchTunnel() {
    setLive("loading", "正在拉取 cpolar 实时地址…");
    try {
      const resp = await fetch(GIST_RAW + "?t=" + Date.now(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!resp.ok) throw new Error("gist HTTP " + resp.status);
      const data = await resp.json();
      const newHttps = (data.url || data.https || "").trim();
      const newHttp = (data.http || "").trim();
      if (!newHttps && !newHttp) throw new Error("gist 无 url 字段");

      const changed = newHttps !== state.https || newHttp !== state.http;
      state.https = newHttps;
      state.http = newHttp;
      state.fetchedAt = data.updated_at || Math.floor(Date.now() / 1000);
      state.ok = true;
      state.lastError = "";

      updateLinks();
      setLive("live", "实时在线 · cpolar 隧道");
      if (changed && state.fetchedAt > 0) {
        // address rotated since last fetch
        const now = Math.floor(Date.now() / 1000);
        const secs = Math.max(0, now - state.fetchedAt);
        if (secs < 120) showToast("检测到新的公网地址，已自动更新入口");
      }
    } catch (e) {
      state.ok = false;
      state.lastError = String(e.message || e);
      setLive("offline", "实时地址暂不可用");
      if (!state.https && !state.http) {
        $entryTip.innerHTML =
          "暂时无法获取 cpolar 实时地址（本地 monitor 未推送 / 网络异常）。<br>" +
          "<b>请确保后台 monitor 正在运行</b>：<code>python backend/scripts/tunnel_monitor.py</code>，然后刷新本页。";
        $entryTip.style.border = "1px solid rgba(255,107,107,0.3)";
        $entryTip.style.background = "rgba(255,107,107,0.06)";
        $entryTip.style.color = "#ffb0b0";
      } else {
        // 上次拿到的 URL 继续用
        setLive("stale", "使用上次缓存的地址（网络异常）");
      }
    }
  }

  // Copy button copies current main (https preferred) URL
  $copyBtn.addEventListener("click", async () => {
    const target = state.https || state.http;
    if (!target) {
      showToast("暂无地址可复制");
      return;
    }
    const ok = await copyText(target);
    showToast(ok ? "实时链接已复制" : "复制失败，请手动选择地址栏");
  });

  $mainBtn.addEventListener("click", () => {
    localStorage.setItem("maxpx_last_entry", state.https || state.http || "");
    localStorage.setItem("maxpx_last_time", String(Date.now()));
  });
  $ctaBtn.addEventListener("click", () => {
    localStorage.setItem("maxpx_last_entry", state.https || state.http || "");
    localStorage.setItem("maxpx_last_time", String(Date.now()));
  });

  fetchTunnel();
  setInterval(fetchTunnel, POLL_MS);
})();
