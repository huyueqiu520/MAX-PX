(() => {
  "use strict";

  const MAIN = "http://cn-xy.starryfrp.com:23660";
  const ALT = "http://111.170.175.250:23660";

  const toast = document.getElementById("toast");
  let toastTimer = null;

  function showToast(msg, ms = 2200) {
    toast.textContent = msg;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => (toast.hidden = true), 260);
    }, ms);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
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
  }

  const copyBtn = document.getElementById("copyBtn");
  copyBtn.addEventListener("click", async () => {
    const ok = await copyText(MAIN);
    showToast(ok ? "主线路链接已复制" : "复制失败，请手动选择地址");
  });

  // 记住上次使用的线路，面板上给出提示
  const mainEntry = document.getElementById("mainEntry");
  const altEntry = document.getElementById("altEntry");

  function markUsed(url) {
    try {
      localStorage.setItem("maxpx_last_entry", url);
      localStorage.setItem("maxpx_last_time", String(Date.now()));
    } catch (_) {}
  }

  mainEntry.addEventListener("click", () => markUsed(MAIN));
  altEntry.addEventListener("click", () => markUsed(ALT));

  // 从修复站返回时，如果停留极短，多半是隧道未启动
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    try {
      const t = Number(localStorage.getItem("maxpx_last_time") || 0);
      const u = localStorage.getItem("maxpx_last_entry") || "";
      if (t && Date.now() - t < 4000) {
        showToast(
          u === MAIN ? "主线路未打开？可以试试备用线路 111.170.175.250:23660" : "备用线路未打开？请确认隧道已启动",
          4200
        );
      }
    } catch (_) {}
  });

  // 小节标题淡入
  const targets = document.querySelectorAll(".card, .steps li, .stat, .sponsor-inner");
  if ("IntersectionObserver" in window) {
    targets.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(14px)";
      el.style.transition = "opacity .5s ease, transform .5s ease";
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((el) => io.observe(el));
  }
})();
