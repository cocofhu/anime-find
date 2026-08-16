window.__ModuleLoader__.load({
  id: "anime-find",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;
    const { useEffect, useMemo, useState } = React;

    const CSS = `
.af-root{font-family:inherit;color:var(--dsw-alias-label-primary);max-width:920px}
.af-hint{color:var(--dsw-alias-label-caption);font-size:12px;line-height:18px;margin:0 0 10px}
.af-search{display:flex;gap:8px;margin-bottom:12px}
.af-search input{flex:1;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:10px 12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit}
.af-search button,.af-mini{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit;font-size:12px}
.af-mini.primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent}
.af-week{font-weight:700;font-size:13px;margin:8px 0 6px}
.af-cards{display:grid;grid-template-columns:1fr;gap:10px}
.af-card{display:flex;gap:12px;align-items:flex-start;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:12px;cursor:pointer;text-align:left;width:100%;font:inherit;color:var(--dsw-alias-label-primary)}
.af-card:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-interactive-bg-hover)}
.af-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary-new-colorprimary-new-color);outline-offset:2px}
.af-card.busy{cursor:wait}
.af-cover{width:84px;height:118px;border-radius:8px;object-fit:cover;border:1px solid var(--dsw-alias-border-l1);flex-shrink:0;background:var(--dsw-alias-bg-layer-3)}
.af-meta{min-width:0;flex:1;display:flex;flex-direction:column;gap:5px}
.af-title{font-weight:700;font-size:15px;line-height:1.35;color:var(--dsw-alias-label-primary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.af-score{color:var(--dsw-alias-state-business-primary);font-weight:800;font-size:16px}
.af-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}
.af-tag{font-size:11px;padding:3px 8px;border-radius:999px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;background:var(--dsw-alias-markdown-tag);color:var(--dsw-alias-label-secondary)}
.af-tag.blue{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-state-business-primary)}
.af-tag.green{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}
.af-tag.orange{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label)}
.af-tag.pink{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}
.af-overlay{position:fixed;inset:0;z-index:2147483000;background:var(--dsw-alias-bg-mask-3);display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box}
.af-drawer{position:relative;width:min(720px,100%);height:min(86vh,840px);max-height:min(86vh,840px);margin:0 auto;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.af-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-3);cursor:pointer;font-size:18px;line-height:1;color:var(--dsw-alias-label-secondary);z-index:2}
.af-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.af-head{display:flex;gap:14px;align-items:flex-start;padding:18px 48px 16px 18px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-shrink:0}
.af-dcover{width:84px;height:118px;border-radius:8px;object-fit:cover;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-3);flex-shrink:0}
.af-head h2{margin:0 0 6px;font-size:18px;line-height:1.35;color:var(--dsw-alias-label-primary)}
.af-body{flex:1;min-height:0;overflow:auto;padding:12px 18px 20px;display:flex;flex-direction:column}
.af-body>*{flex-shrink:0}
.af-body>.af-load{flex:1;min-height:0}
.af-original{color:var(--dsw-alias-label-tertiary);font-size:12px;margin:0;line-height:1.4}
.af-card .af-original{margin:0}
.af-head .af-original{margin:-2px 0 4px}
.af-rating{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:0;font-size:12px;color:var(--dsw-alias-label-caption)}
.af-head .af-rating{margin:4px 0 4px}
.af-rating-score{color:#d97706;font-size:17px;font-weight:800;font-variant-numeric:tabular-nums}
.af-stars{color:#f59e0b;letter-spacing:1px;font-size:13px}
.af-bgm-link,.af-more-link{color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#2563eb);font-size:12px;text-decoration:none}
.af-bgm-link:hover,.af-more-link:hover{text-decoration:underline}
.af-tabs{display:flex;gap:2px;padding:0 18px;border-bottom:1px solid var(--dsw-alias-border-l2);flex-shrink:0}
.af-tab{appearance:none;border:0;border-bottom:2px solid transparent;background:transparent;padding:10px 12px 9px;cursor:pointer;color:var(--dsw-alias-label-caption);font:inherit;font-size:13px}
.af-tab.on{color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);border-bottom-color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);font-weight:600}
.af-badge{display:inline-block;margin-left:5px;padding:1px 6px;border-radius:999px;background:var(--dsw-alias-bg-layer-3);font-size:10px;color:var(--dsw-alias-label-tertiary)}
.af-tab.on .af-badge{background:var(--dsw-alias-button-ghost-active-fill);color:inherit}
.af-meta-loading{margin-left:auto;align-self:center;color:var(--dsw-alias-label-tertiary);font-size:11px}
.af-meta-chips{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}
.af-meta-chip{font-size:12px;padding:5px 8px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-caption)}
.af-meta-chip b{color:var(--dsw-alias-label-primary);margin-left:4px}
.af-summary{white-space:pre-wrap;line-height:1.8;font-size:13px;margin:0;color:var(--dsw-alias-label-primary)}
.af-empty-meta{flex:1;display:flex;align-items:center;justify-content:center;padding:28px 4px;color:var(--dsw-alias-label-caption);font-size:13px;text-align:center}
.af-comment{display:flex;gap:10px;padding:12px 0;border-bottom:1px solid var(--dsw-alias-border-l2)}
.af-avatar{width:32px;height:32px;flex:0 0 32px;border-radius:50%;object-fit:cover;background:#6366f1;color:#fff;display:grid;place-items:center;font-size:13px;font-weight:700}
.af-comment-main{min-width:0;flex:1}
.af-comment-top{display:flex;gap:7px;align-items:center;flex-wrap:wrap;font-size:12px}
.af-comment-user{font-weight:600}.af-comment-rate{color:#d97706;font-weight:700}.af-comment-time{color:var(--dsw-alias-label-tertiary);margin-left:auto;font-size:11px}
.af-comment-text{font-size:13px;line-height:1.7;margin:5px 0 0;white-space:pre-wrap;word-break:break-word}
.af-pills{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px;justify-content:flex-start}
.af-pill{font:inherit;font-size:12px;padding:5px 13px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-caption);cursor:pointer;transition:background .16s ease,border-color .16s ease,color .16s ease}
.af-pill:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.af-pill.on{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);border-color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);font-weight:600}
.af-group{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;margin-bottom:10px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);flex-shrink:0}
.af-group summary{cursor:pointer;padding:11px 14px;display:flex;gap:10px;align-items:center;font-weight:600;background:var(--dsw-alias-bg-layer-2);list-style:none;transition:background .16s ease;min-width:0}
.af-group summary::-webkit-details-marker{display:none}
.af-group summary:hover{background:var(--dsw-alias-bg-layer-3)}
.af-sub{font-weight:400;color:var(--dsw-alias-label-tertiary);font-size:12px;margin-left:auto;flex-shrink:0}
.af-ep{border-top:1px solid var(--dsw-alias-border-l2)}
.af-ep:first-of-type{border-top:0}
.af-ep-h{display:flex;align-items:center;gap:8px;padding:12px 14px 6px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-tertiary);letter-spacing:.04em}
.af-ep-h::after{content:"";flex:1;height:1px;background:var(--dsw-alias-border-l2)}
.af-item{padding:9px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;border-radius:8px;margin:0 6px;transition:background .14s ease}
.af-item:hover{background:var(--dsw-alias-bg-layer-2)}
.af-item + .af-item{border-top:1px solid var(--dsw-alias-border-l2)}
.af-item-raw{margin:3px 0 0;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.af-chips{display:flex;flex-wrap:wrap;gap:6px}
.af-chip{font-size:11px;line-height:1;padding:4px 8px;border-radius:6px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-caption);border:1px solid transparent}
.af-chip.hi{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);border-color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);font-weight:600}
.af-facts{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:5px 0 0;color:var(--dsw-alias-label-caption);font-size:12px}
.af-facts .af-size{color:var(--dsw-alias-label-primary);font-weight:600;font-variant-numeric:tabular-nums}
.af-facts-separator{color:var(--dsw-alias-label-tertiary)}
.af-btns{display:flex;gap:8px;flex-shrink:0;align-items:center}
.af-item .af-mini{display:inline-flex;align-items:center;justify-content:center;border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-caption);text-decoration:none;transition:background .16s ease,border-color .16s ease,color .16s ease}
.af-item .af-mini:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.af-item .af-mini.primary{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-caption);border-color:var(--dsw-alias-border-l2)}
.af-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:var(--dsw-alias-toast-bg);color:var(--dsw-alias-label-primary-foreground);padding:10px 16px;border-radius:999px;font-size:13px;z-index:2147483646}
.af-err{color:var(--dsw-alias-state-error-primary);font-size:12px;margin:8px 0}
.af-tool{margin:4px 0 8px}
.af-fade{animation:af-in .18s ease}
.af-inflow{position:relative;width:100%;height:min(72vh,760px);max-height:min(72vh,760px);margin:4px 0 8px}
.af-load{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:28px 8px 12px;min-height:0;box-sizing:border-box}
.af-spin{width:28px;height:28px;border:3px solid var(--dsw-alias-bg-skeleton);border-top-color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);border-radius:50%;animation:af-spin .7s linear infinite}
.af-load-text{color:var(--dsw-alias-label-caption);font-size:13px}
.af-skel{width:100%;display:flex;flex-direction:column;gap:8px;margin-top:4px}
.af-skel-row{height:46px;border-radius:8px;background:var(--dsw-alias-bg-skeleton);background-size:200% 100%;animation:af-shimmer 1.2s ease infinite}
@keyframes af-in{from{opacity:0}to{opacity:1}}
@keyframes af-spin{to{transform:rotate(360deg)}}
@keyframes af-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
.af-cfg-item{list-style:none;margin:0;padding:0;min-width:0}
.af-cfg{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;overflow:hidden;box-sizing:border-box;width:100%;min-width:0}
.af-cfg[open]{background:var(--dsw-alias-bg-layer-2)}
.af-cfg-h{display:flex;align-items:center;gap:12px;cursor:pointer;list-style:none;padding:14px 16px;box-sizing:border-box;min-width:0}
.af-cfg-h::-webkit-details-marker,.af-cfg-h::marker{display:none;content:none}
.af-cfg-t{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
.af-cfg-n{font-size:15px;font-weight:600;line-height:1.4}
.af-cfg-d{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.af-cfg-ch{color:var(--dsw-alias-label-tertiary);flex:none;width:14px;height:14px;margin-left:auto;transition:transform .16s;display:block;pointer-events:none;overflow:visible}
.af-cfg-ch-open{transform:rotate(180deg)}
.af-cfg-b{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding:8px 0 12px}
.af-cfg-f{display:flex;flex-direction:column;gap:6px;padding:10px 0;border-top:1px solid var(--dsw-alias-border-l1)}
.af-cfg-f:first-child{border-top:0}
.af-cfg-f label{font-size:13px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.af-cfg-f input[type=text],.af-cfg-f input[type=number]{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);height:34px;font:inherit;border-radius:8px;padding:0 12px;font-size:13px}
.af-cfg-hint{margin:0;color:var(--dsw-alias-label-caption);font-size:12px}
.af-cfg-src{display:flex;flex-wrap:wrap;gap:10px 16px}
.af-cfg-src label{display:flex;gap:6px;align-items:center;font-weight:400;cursor:pointer}
.af-cfg-ft{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;gap:8px;padding:12px 0 4px;display:flex}
.af-cfg-ft button{appearance:none;font:inherit;cursor:pointer;border-radius:8px;padding:5px 14px;font-size:13px}
.af-cfg-save{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border:1px solid transparent}
.af-cfg-save:disabled,.af-cfg-disc:disabled{opacity:.4;cursor:default}
.af-cfg-disc{background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}
.af-cfg-err{color:var(--dsw-alias-state-error-primary);flex:1;margin:0;font-size:12px}
.af-version{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:14px;background:var(--dsw-alias-bg-layer-3)}
.af-version-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
.af-version-k{font-size:12px;color:var(--dsw-alias-label-tertiary);margin-bottom:3px}
.af-version-v{font-size:20px;font-weight:650;font-variant-numeric:tabular-nums}
.af-version-tag{display:inline-block;margin-top:6px;padding:3px 8px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-caption);font-size:11px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.af-update-check,.af-update-copy{appearance:none;border-radius:8px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}
.af-update-check{border:1px solid transparent;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}
.af-update-copy{border:1px solid transparent;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}
.af-update-check:disabled{opacity:.55;cursor:wait}
.af-update-status{margin-top:12px;padding:10px 12px;border-radius:8px;font-size:12px;line-height:1.5}
.af-update-status.checking{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-state-business-primary)}
.af-update-status.upToDate{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}
.af-update-status.updateAvailable,.af-update-status.localInstallRestricted{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label)}
.af-update-status.noRelease{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.af-update-status.failed{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}
.af-update-compare{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin-top:12px}
.af-update-pill{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:8px 10px;font-variant-numeric:tabular-nums}
.af-update-pill span{display:block;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.af-update-pill strong{display:block;margin-top:2px;font-size:14px}
.af-update-cmd-label{margin-top:12px;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.af-update-cmd{margin-top:5px;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-toast-bg);color:var(--dsw-alias-label-primary-foreground);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.5;word-break:break-all}
.af-update-actions{display:flex;align-items:center;gap:10px;margin-top:10px}
.af-update-restart{margin:10px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}
@media (max-width:560px){.af-update-compare{grid-template-columns:1fr}.af-update-arrow{display:none}}
`;

    const CSS_ID = "anime-find-style";
    function ensureCss() {
      if (typeof document === "undefined") return () => {};
      let s = document.getElementById(CSS_ID);
      if (!s) {
        s = document.createElement("style");
        s.id = CSS_ID;
        document.head.appendChild(s);
      }
      s.textContent = CSS;
      return () => {};
    }

    const fallbackPortal = (node) => node;
    let createPortal = fallbackPortal;
    try {
      const rd = require("react-dom");
      if (rd && typeof rd.createPortal === "function") createPortal = rd.createPortal;
    } catch { /* overlay still works without portal */ }

    function placeholder(title) {
      return "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="260"></svg>',
      );
    }

    const PLUGIN_SCRIPT_PATH = "/plugins/anime-find/client.js";

    function prefixFromPluginUrl(src) {
      try {
        const path = new URL(src, typeof location !== "undefined" ? location.href : "http://local/").pathname;
        const idx = path.indexOf(PLUGIN_SCRIPT_PATH);
        if (idx <= 0) return "";
        return path.slice(0, idx).replace(/\/+$/, "");
      } catch { return ""; }
    }

    function prefixFromPathname(pathname) {
      const first = String(pathname || "/").split("/").filter(Boolean)[0];
      if (!first || !/^[A-Za-z0-9_-]{16,}$/.test(first)) return "";
      return "/" + first;
    }

    function sitePrefix() {
      if (typeof document !== "undefined") {
        for (const s of document.getElementsByTagName("script")) {
          const prefix = s.src ? prefixFromPluginUrl(s.src) : "";
          if (prefix) return prefix;
        }
        const href = document.querySelector("base")?.getAttribute("href");
        if (href) {
          try {
            const path = new URL(href, location.href).pathname.replace(/\/+$/, "");
            if (path && path !== "/") return path;
          } catch { /* ignore malformed base href */ }
        }
      }
      try {
        for (const e of performance.getEntriesByType("resource")) {
          const prefix = e.name ? prefixFromPluginUrl(e.name) : "";
          if (prefix) return prefix;
        }
      } catch { /* performance API unavailable */ }
      return typeof location !== "undefined" ? prefixFromPathname(location.pathname) : "";
    }

    function pluginUrl(path) {
      const suffix = path.startsWith("/") ? path : "/" + path;
      return sitePrefix() + suffix;
    }

    function coverSrc(url, title) {
      if (!url) return placeholder(title);
      if (url.startsWith("data:")) return url;
      return pluginUrl("/anime-find/cover") + "?url=" + encodeURIComponent(url);
    }

    async function api(method, payload) {
      const res = await fetch(pluginUrl("/anime-find"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method, ...payload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok === false) throw new Error(body.error || "HTTP " + res.status);
      return body;
    }

    async function copyText(text) {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch { /* use the legacy fallback */ }
      try {
        const input = document.createElement("input");
        input.value = text;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(input);
        return copied;
      } catch { return false; }
    }

    function Toast({ text, onDone }) {
      useEffect(() => {
        const t = setTimeout(onDone, 1600);
        return () => clearTimeout(t);
      }, [text, onDone]);
      return h("div", { className: "af-toast" }, text);
    }

    function ratingStars(score) {
      const filled = Math.round(Math.min(5, Math.max(0, Number(score) / 2)));
      return "★".repeat(filled) + "☆".repeat(5 - filled);
    }

    function RatingRow({ score, count }) {
      if (score == null || !Number.isFinite(Number(score))) return null;
      const value = Number(score);
      return h("div", { className: "af-rating" },
        h("span", { className: "af-rating-score" }, value.toFixed(1)),
        h("span", null, "/10"),
        h("span", { className: "af-stars", "aria-label": `${value.toFixed(1)}/10` }, ratingStars(value)),
        count ? h("span", null, `${Number(count).toLocaleString()} 人评分`) : null,
      );
    }

    const TAG_TONES = ["green", "pink", "blue"];

    function Tags({ item, labels }) {
      const fromLabels = (labels || item.tags || []).map(String).map((t) => t.trim()).filter(Boolean).slice(0, 3);
      const tags = fromLabels.length
        ? fromLabels.map((label, i) => [TAG_TONES[i % TAG_TONES.length], label])
        : [
          item.season && ["blue", item.season],
          ...(item.sources || []).map((source) => ["green", source]),
          item.subgroup && ["", item.subgroup],
          item.resourceCount > 0 && ["orange", `${item.resourceCount} 资源`],
          item.format && ["pink", String(item.format).toLowerCase()],
        ].filter(Boolean).slice(0, 3);
      if (!tags.length) return null;
      return h(
        "div",
        { className: "af-tags" },
        tags.map((t, i) => h("span", { key: i, className: "af-tag " + t[0] }, t[1])),
      );
    }

    function needsBangumi(item) {
      return item && (!item.bgmId || item.score == null || !(item.tags && item.tags.length));
    }

    function mergeBangumi(item, extra) {
      if (!extra) return item;
      return {
        ...item,
        bgmId: extra.bgmId || item.bgmId,
        nameOrig: extra.nameOrig || item.nameOrig,
        score: extra.score ?? item.score,
        ratingCount: extra.ratingCount ?? item.ratingCount,
        tags: extra.tags?.length ? extra.tags : item.tags,
      };
    }

    function Cards({ items, onOpen, pendingId, onPrefetch, hideEmpty }) {
      const [extra, setExtra] = useState({});
      const ids = (items || []).map((it) => it.id).join("\n");
      useEffect(() => {
        let live = true;
        const missing = (items || []).filter(needsBangumi);
        if (!missing.length) return () => { live = false; };
        Promise.all(missing.map((it) => api("bangumiCard", { id: it.id, title: it.title, bgmId: it.bgmId }).then(
          (data) => ({ id: it.id, data }),
          () => null,
        ))).then((rows) => {
          if (!live) return;
          const next = {};
          for (const row of rows) {
            if (row?.data && (row.data.bgmId || row.data.score != null || row.data.tags?.length)) next[row.id] = row.data;
          }
          if (Object.keys(next).length) setExtra((prev) => ({ ...prev, ...next }));
        });
        return () => { live = false; };
      }, [ids]);
      if (!items?.length) return hideEmpty ? null : h("div", { className: "af-hint" }, "没有结果");
      return h(
        "div",
        { className: "af-cards" },
        items.map((raw) => {
          const item = mergeBangumi(raw, extra[raw.id]);
          const score = item.score;
          const bangumiUrl = item.bgmId ? `https://bgm.tv/subject/${item.bgmId}` : "";
          return h(
            "div",
            {
              key: item.id,
              role: "button",
              tabIndex: 0,
              className: "af-card" + (pendingId === item.id ? " busy" : ""),
              onMouseEnter: () => onPrefetch?.(item),
              onFocus: () => onPrefetch?.(item),
              onClick: () => onOpen(item),
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(item);
                }
              },
            },
            h("img", { className: "af-cover", src: coverSrc(item.cover, item.title), alt: "" }),
            h("div", { className: "af-meta" },
              h("div", { className: "af-title", title: item.title }, item.title),
              item.nameOrig ? h("div", { className: "af-original" }, item.nameOrig) : null,
              score != null ? h(RatingRow, { score, count: item.ratingCount }) : null,
              bangumiUrl ? h("a", {
                className: "af-bgm-link",
                href: bangumiUrl,
                target: "_blank",
                rel: "noreferrer",
                onClick: (e) => e.stopPropagation(),
              }, "Bangumi 条目") : null,
              h(Tags, { item }),
            ),
          );
        }),
      );
    }

    function releaseView(it, animeTitle) {
      if (it.displayTitle) return { heading: it.displayTitle, tags: it.tags || [], raw: it.title, episode: it.episode };
      const raw = String(it.title || "");
      const short = raw
        .replace(/\([^)]+\)/g, " ")
        .replace(/[【\[][^】\]]+[】\]]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const heading = short.slice(0, 48) || raw.slice(0, 48);
      const ep = String(it.episode || "").trim()
        || (heading.match(/第\s*([\d.]+(?:\s*[–-]\s*[\d.]+)?)\s*集/) || [])[1]
        || (heading.match(/S\d+E([\d.]+)/i) || [])[1];
      return { heading, tags: it.tags || [], raw, episode: ep };
    }

    function groupByEpisode(items, animeTitle) {
      const order = [];
      const map = new Map();
      for (const it of items || []) {
        const view = releaseView(it, animeTitle);
        const key = view.episode ? "e:" + String(view.episode).replace(/\s/g, "") : "t:" + (it.title || view.heading);
        if (!map.has(key)) {
          map.set(key, { heading: view.heading, items: [] });
          order.push(key);
        }
        map.get(key).items.push({ it, view });
      }
      return order.map((k) => map.get(k));
    }

    const KEY_RESOLUTION_TAGS = new Set(["720p", "1080p", "2160p", "4K"]);

    function ReleaseRow({ it, view, onCopied }) {
      return h("div", { className: "af-item", title: view.raw },
        h("div", { style: { minWidth: 0 } },
          view.tags.length ? h("div", { className: "af-chips" },
            view.tags.map((t) => h("span", { key: t, className: "af-chip" + (KEY_RESOLUTION_TAGS.has(t) ? " hi" : "") }, t)),
          ) : null,
          h("div", { className: "af-facts" },
            it.size ? h("span", { className: "af-size" }, it.size) : null,
            it.size && it.createdAt ? h("span", { className: "af-facts-separator", "aria-hidden": "true" }, "·") : null,
            it.createdAt ? h("span", null, it.createdAt) : null,
          ),
          h("div", { className: "af-item-raw" }, view.raw),
        ),
        h("div", { className: "af-btns" },
          it.magnet ? h("button", {
            type: "button",
            className: "af-mini",
            onClick: async () => {
              await copyText(it.magnet);
              onCopied();
            },
          }, "复制磁力") : null,
          it.torrent ? h("a", { className: "af-mini", href: it.torrent, target: "_blank", rel: "noreferrer" }, "种子") : null,
        ),
      );
    }

    function LoadingBody({ text }) {
      return h("div", { className: "af-load", role: "status", "aria-live": "polite" },
        h("div", { className: "af-spin", "aria-hidden": "true" }),
        h("div", { className: "af-load-text" }, text || "正在加载…"),
        h("div", { className: "af-skel" },
          h("div", { className: "af-skel-row" }),
          h("div", { className: "af-skel-row" }),
          h("div", { className: "af-skel-row" }),
          h("div", { className: "af-skel-row" }),
        ),
      );
    }

    function avatarColor(nickname) {
      const colors = ["#5b7cfa", "#20a97c", "#e0668e", "#f0973a", "#7f6bd6"];
      let hash = 0;
      for (const char of String(nickname || "")) hash = ((hash * 31) + char.charCodeAt(0)) | 0;
      return colors[Math.abs(hash) % colors.length];
    }

    function DetailCard({ item, detail, meta, loading, metaLoading, onClose }) {
      const [source, setSource] = useState("all");
      const [toast, setToast] = useState("");
      const [tab, setTab] = useState("resources");
      useEffect(() => {
        setSource("all");
        setTab("resources");
      }, [item.id]);
      const groups = useMemo(() => {
        const gs = detail?.groups || [];
        if (source === "all") return gs;
        return gs.filter((g) => g.source === source);
      }, [detail, source]);
      const sources = ["all", ...new Set((detail?.groups || []).map((g) => g.source).filter(Boolean))];
      const intro = meta?.meta;
      const comments = meta?.comments || [];
      const bangumiPageUrl = intro?.pageUrl || meta?.pageUrl || (item.bgmId ? `https://bgm.tv/subject/${item.bgmId}` : "");
      const resourceCount = (detail?.groups || []).reduce((total, group) => total + (group.items?.length || 0), 0);
      const hasBangumi = !!(item.bgmId || detail?.bgmId || bangumiPageUrl);
      const tabs = [
        { id: "intro", label: "介绍" },
        { id: "comments", label: "短评", count: comments.length || undefined },
        { id: "resources", label: "资源", count: resourceCount || undefined },
      ];
      const score = intro?.score ?? item.score;
      const title = detail?.title || item.title;
      const nameOrig = intro?.nameOrig || item.nameOrig;
      const introLoading = hasBangumi && metaLoading && !intro;
      const commentsLoading = hasBangumi && metaLoading && !comments.length;
      let body;
      if (tab === "intro") {
        body = introLoading
          ? h(LoadingBody, { text: "正在加载介绍…" })
          : intro
            ? h("div", null,
              intro.chips?.length ? h("div", { className: "af-meta-chips" },
                intro.chips.map((chip) => h("span", { className: "af-meta-chip", key: chip.label }, chip.label, h("b", null, chip.value))),
              ) : null,
              intro.summary ? h("p", { className: "af-summary" }, intro.summary) : h("div", { className: "af-empty-meta" }, "该条目暂未提供介绍。"),
              h("p", null, h("a", { className: "af-more-link", href: intro.pageUrl, target: "_blank", rel: "noreferrer" }, "在 Bangumi 查看条目")),
            )
            : h("div", { className: "af-empty-meta" }, "暂无 Bangumi 介绍。");
      } else if (tab === "comments") {
        body = commentsLoading
          ? h(LoadingBody, { text: "正在加载短评…" })
          : comments.length
            ? h("div", null,
              comments.map((comment, index) => h("div", { className: "af-comment", key: `${comment.nickname}-${index}` },
                comment.avatarUrl
                  ? h("img", { className: "af-avatar", src: comment.avatarUrl, alt: "" })
                  : h("span", { className: "af-avatar", style: { background: avatarColor(comment.nickname) } }, (comment.nickname || "B").slice(0, 1)),
                h("div", { className: "af-comment-main" },
                  h("div", { className: "af-comment-top" },
                    h("span", { className: "af-comment-user" }, comment.nickname),
                    comment.rate ? h("span", { className: "af-comment-rate" }, `★ ${comment.rate}`) : null,
                    comment.updatedAt ? h("span", { className: "af-comment-time" }, comment.updatedAt) : null,
                  ),
                  h("p", { className: "af-comment-text" }, comment.comment),
                ),
              )),
              bangumiPageUrl ? h("p", null, h("a", { className: "af-more-link", href: `${bangumiPageUrl}/comments`, target: "_blank", rel: "noreferrer" }, "在 Bangumi 查看更多")) : null,
            )
            : h("div", { className: "af-empty-meta" }, "暂无短评。");
      } else {
        body = loading
          ? h(LoadingBody, { text: "正在加载字幕组与磁力…" })
          : [
            sources.length > 1 ? h("div", { key: "pills", className: "af-pills" },
              sources.map((s) => h("button", {
                key: s,
                type: "button",
                className: "af-pill" + (source === s ? " on" : ""),
                onClick: () => setSource(s),
              }, s === "all" ? "全部来源" : s)),
            ) : null,
            groups.map((g, idx) => h("details", { key: g.label + g.source + idx, className: "af-group", open: idx === 0 },
              h("summary", null,
                g.label || "未知字幕组",
                h("span", { className: "af-sub" }, `${g.source || ""} · ${g.updateDay || ""} · ${g.items?.length || 0} 条`),
              ),
              (groupByEpisode(g.items || [], detail?.title || item.title).map((bucket, bi) =>
                h("div", { key: bucket.heading + bi, className: "af-ep" },
                  h("div", { className: "af-ep-h" }, bucket.heading),
                  bucket.items.map(({ it, view }, i) => h(ReleaseRow, {
                    key: i,
                    it,
                    view,
                    onCopied: () => setToast("已复制磁力链接"),
                  })),
                ),
              )),
            )),
            !groups.length ? h("div", { key: "empty", className: "af-empty-meta" }, "该来源暂无资源") : null,
          ];
      }
      return h("div", { className: "af-drawer" + (onClose ? " af-fade" : " af-inflow"), role: onClose ? "dialog" : undefined, "aria-modal": onClose ? "true" : undefined },
        onClose ? h("button", { type: "button", className: "af-close", onClick: onClose, "aria-label": "关闭" }, "×") : null,
        h("div", { className: "af-head" },
          h("img", { className: "af-dcover", src: coverSrc(detail?.cover || item.cover, item.title), alt: "" }),
          h("div", { style: { minWidth: 0, flex: 1 } },
            h("h2", null, title),
            nameOrig ? h("div", { className: "af-original" }, nameOrig) : null,
            h(RatingRow, { score, count: intro?.ratingCount ?? item.ratingCount }),
            bangumiPageUrl ? h("a", { className: "af-bgm-link", href: bangumiPageUrl, target: "_blank", rel: "noreferrer" }, "Bangumi 条目") : null,
            h(Tags, { item: { ...item, ...(detail || {}) }, labels: intro?.tags }),
          ),
        ),
        h("div", { className: "af-tabs", role: "tablist" },
          tabs.map((entry) => h("button", {
            key: entry.id,
            type: "button",
            role: "tab",
            className: "af-tab" + (tab === entry.id ? " on" : ""),
            "aria-selected": tab === entry.id,
            onClick: () => setTab(entry.id),
          }, entry.label, entry.count ? h("span", { className: "af-badge" }, entry.count) : null)),
        ),
        h("div", { className: "af-body", "aria-busy": tab === "intro" ? introLoading : tab === "comments" ? commentsLoading : !!loading }, body),
        toast ? h(Toast, { text: toast, onDone: () => setToast("") }) : null,
      );
    }

    function Drawer({ item, detail, meta, loading, metaLoading, onClose }) {
      useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => {
          document.body.style.overflow = prev;
          window.removeEventListener("keydown", onKey);
        };
      }, [onClose]);
      const portaled = createPortal !== fallbackPortal;
      const hostRef = React.useRef(null);
      useEffect(() => {
        if (portaled) return;
        const el = hostRef.current;
        if (!el) return;
        document.body.appendChild(el);
        return () => { el.remove(); };
      }, [portaled]);
      const overlay = h("div", { ref: portaled ? undefined : hostRef, className: "af-overlay", onClick: (e) => { if (e.target === e.currentTarget) onClose(); } },
        h(DetailCard, { item, detail, meta, loading, metaLoading, onClose }),
      );
      return portaled && typeof document !== "undefined" ? createPortal(overlay, document.body) : overlay;
    }

    function useOpenDetail() {
      const [session, setSession] = useState(null);
      const [pendingId, setPendingId] = useState("");
      const cacheRef = React.useRef(new Map());
      const inflightRef = React.useRef(new Map());
      const load = (item) => {
        const cached = cacheRef.current.get(item.id);
        if (cached) return Promise.resolve(cached);
        const inflight = inflightRef.current.get(item.id);
        if (inflight) return inflight;
        const req = api("detail", { id: item.id, refs: item.refs, title: item.title })
          .catch(() => ({ title: item.title, cover: item.cover, groups: [] }))
          .then((d) => {
            cacheRef.current.set(item.id, d);
            inflightRef.current.delete(item.id);
            return d;
          });
        inflightRef.current.set(item.id, req);
        return req;
      };
      const prefetch = (item) => { load(item); };
      const loadMeta = (item, detail) => {
        const bgmId = detail?.bgmId || item.bgmId;
        if (!bgmId) return;
        setSession((cur) => cur && cur.item.id === item.id ? { ...cur, metaLoading: true } : cur);
        api("bangumiMeta", { bgmId })
          .then((meta) => setSession((cur) => cur && cur.item.id === item.id ? { ...cur, meta, metaLoading: false } : cur))
          .catch(() => setSession((cur) => cur && cur.item.id === item.id ? { ...cur, metaLoading: false } : cur));
      };
      const openItem = (item, ready) => {
        if (ready && Array.isArray(ready.groups)) {
          cacheRef.current.set(item.id, ready);
          setPendingId("");
          setSession({ item, detail: ready, loading: false, meta: null, metaLoading: false });
          loadMeta(item, ready);
          return;
        }
        const cached = cacheRef.current.get(item.id);
        if (cached) {
          setPendingId("");
          setSession({ item, detail: cached, loading: false, meta: null, metaLoading: false });
          loadMeta(item, cached);
          return;
        }
        const seq = item.id;
        setPendingId(seq);
        setSession({ item, detail: null, loading: true, meta: null, metaLoading: !!item.bgmId });
        if (item.bgmId) loadMeta(item, null);
        load(item).then((d) => {
          setPendingId((cur) => (cur === seq ? "" : cur));
          setSession((cur) => cur && cur.item.id === seq ? { ...cur, detail: d, loading: false } : cur);
          if (!item.bgmId) loadMeta(item, d);
        });
      };
      return { session, pendingId, openItem, prefetch, close: () => setSession(null) };
    }

    function parseToolArgs(props) {
      const block = props?.block;
      const raw = (block && "kind" in block ? block.call?.argsRaw : block?.argsRaw) || "";
      if (!raw || typeof raw !== "string") return {};
      try { return JSON.parse(raw); } catch { return {}; }
    }

    function contentText(node) {
      if (!node) return "";
      if (typeof node === "string") return node;
      if (Array.isArray(node)) return node.map(contentText).join("\n");
      if (typeof node === "object") {
        if (typeof node.text === "string") return node.text;
        if (node.content) return contentText(node.content);
      }
      return "";
    }

    function parseRenderedSearch(text) {
      if (!text || typeof text !== "string") return null;
      const items = [];
      const re = /^\d+\.\s+(.+?)(?:\s+★([\d.]+))?\s+\[([^\]]+)\]\s*\n\s+id:\s+(\S+)/gm;
      let m;
      while ((m = re.exec(text))) {
        items.push({
          id: m[4],
          title: m[1].trim(),
          score: m[2] ? Number(m[2]) : undefined,
          sources: m[3].split(/[+/,]/).map((s) => s.trim()).filter(Boolean),
        });
      }
      return items.length ? { kind: "anime-find-search", items } : null;
    }

    function pickPayload(props) {
      const found = [];
      const visit = (node, depth) => {
        if (!node || depth > 6) return;
        if (typeof node === "string") {
          const t = node.trim();
          if ((t.startsWith("{") || t.startsWith("[")) && t.length > 8) {
            try { visit(JSON.parse(t), depth + 1); } catch { /* ignore */ }
          }
          const parsed = parseRenderedSearch(t);
          if (parsed) found.push(parsed);
          return;
        }
        if (typeof node !== "object") return;
        if (Array.isArray(node)) {
          for (const x of node) visit(x, depth + 1);
          return;
        }
        if (Array.isArray(node.items) || Array.isArray(node.groups)) found.push(node);
        for (const key of ["block", "meta", "result", "resultView", "view", "data", "value", "payload", "content", "message"]) {
          if (node[key] != null) visit(node[key], depth + 1);
        }
      };
      visit(props, 0);
      const block = props?.block;
      visit(block?.meta, 1);
      visit(block?.content, 1);
      visit(block?.resultView, 1);
      visit(contentText(block?.content), 1);
      return found.find((x) => Array.isArray(x.items) && x.items.length)
        || found.find((x) => Array.isArray(x.groups) && x.groups.length)
        || found[0]
        || null;
    }

    function SearchToolView(props) {
      useEffect(() => ensureCss(), []);
      const payload = pickPayload(props);
      const args = parseToolArgs(props);
      const query = String(payload?.query || args.query || "").trim();
      const fromTool = Array.isArray(payload?.items) && payload.items.length ? payload.items : null;
      const running = !!(props?.block && !("kind" in props.block));
      const [fetched, setFetched] = useState(null);
      const [err, setErr] = useState("");
      const { session, pendingId, openItem, prefetch, close } = useOpenDetail();
      useEffect(() => {
        if (fromTool || running || query.length < 2) return;
        let live = true;
        api("search", { query })
          .then((d) => { if (live) setFetched(d.items || []); })
          .catch((e) => { if (live) { setFetched([]); setErr(e.message || String(e)); } });
        return () => { live = false; };
      }, [query, running, !!fromTool]);
      const items = fromTool || fetched || [];
      if (running || !items.length) return err ? h("div", { className: "af-err" }, err) : null;
      return h("div", { className: "af-root af-tool" },
        h("div", { className: "af-hint" }, `点击卡片查看磁力 · ${items.length} 条`),
        h(Cards, { items, pendingId, onOpen: openItem, onPrefetch: prefetch }),
        session ? h(Drawer, { item: session.item, detail: session.detail, meta: session.meta, loading: !!session.loading, metaLoading: !!session.metaLoading, onClose: close }) : null,
      );
    }

    function DetailToolView(props) {
      useEffect(() => ensureCss(), []);
      const payload = pickPayload(props);
      const args = parseToolArgs(props);
      const id = String(payload?.id || args.id || "").trim();
      const fromTool = payload && (payload.groups || payload.title) ? payload : null;
      const item = {
        id: fromTool?.id || id,
        title: fromTool?.title || id,
        cover: fromTool?.cover,
        score: fromTool?.score,
        bgmId: fromTool?.bgmId,
        sources: fromTool?.sources,
        refs: fromTool?.refs,
      };
      const running = !!(props?.block && !("kind" in props.block));
      const { session, pendingId, openItem, prefetch, close } = useOpenDetail();
      const ready = fromTool && Array.isArray(fromTool.groups) ? fromTool : null;
      if (running || !item.id) return null;
      return h("div", { className: "af-root af-tool" },
        h("div", { className: "af-hint" }, "点击卡片查看字幕组与磁力"),
        h(Cards, { items: [item], pendingId, onOpen: (it) => openItem(it, ready || undefined), onPrefetch: prefetch }),
        session ? h(Drawer, { item: session.item, detail: session.detail, meta: session.meta, loading: !!session.loading, metaLoading: !!session.metaLoading, onClose: close }) : null,
      );
    }

    function ChevronDown({ className }) {
      return h("svg", {
        className,
        width: 14,
        height: 14,
        viewBox: "0 0 14 14",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        "aria-hidden": "true",
      }, h("path", {
        d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
        fill: "currentColor",
      }));
    }

    const SOURCE_OPTS = [
      { id: "mikan", label: "Mikan" },
      { id: "anibt", label: "AniBT" },
      { id: "garden", label: "AnimeGarden" },
    ];

    function emptyDraft() {
      return {
        sources: ["mikan"],
        maxResults: 12,
        timeoutMs: 20000,
        mikanHost: "https://mikanani.me",
        anibtHost: "https://anibt.net",
        gardenHost: "https://api.animes.garden",
      };
    }

    function installSourceLabel(metadata) {
      const source = metadata?.installSource;
      if (source === "github") return `安装来源 · ${metadata.installReference || "github:cocofhu/anime-find"}`;
      if (source === "local") return `安装来源 · ${metadata.installReference || "本地 link/file"}`;
      return "安装来源 · 未识别";
    }

    function VersionBlock({ metadata, result, checking, onCheck, onCopy }) {
      const currentVersion = metadata?.currentVersion || "—";
      const status = checking ? "checking" : result?.status;
      const showCompare = status === "updateAvailable" || status === "localInstallRestricted";
      const showCommand = status === "updateAvailable";
      return h("div", { className: "af-cfg-f" },
        h("label", null, "版本与更新"),
        h("div", { className: "af-version" },
          h("div", { className: "af-version-head" },
            h("div", null,
              h("div", { className: "af-version-k" }, "当前版本"),
              h("div", { className: "af-version-v" }, currentVersion),
              h("span", { className: "af-version-tag", title: metadata?.installReference || "" }, installSourceLabel(metadata)),
            ),
            h("button", { type: "button", className: "af-update-check", disabled: checking, onClick: onCheck }, checking ? "检查中…" : "检查更新"),
          ),
          status ? h("div", { className: "af-update-status " + status, role: "status", "aria-live": "polite" },
            checking ? "正在查询 GitHub 正式 Release…" : result?.message,
          ) : null,
          showCompare ? h("div", { className: "af-update-compare" },
            h("div", { className: "af-update-pill" }, h("span", null, "本地"), h("strong", null, currentVersion)),
            h("div", { className: "af-update-arrow", "aria-hidden": "true" }, "→"),
            h("div", { className: "af-update-pill" }, h("span", null, "最新正式版"), h("strong", null, result.latestVersion || "—")),
          ) : null,
          showCommand ? [
            h("div", { key: "label", className: "af-update-cmd-label" }, "官方更新命令（终端执行）"),
            h("div", { key: "command", className: "af-update-cmd" }, result.updateCommand),
            h("div", { key: "actions", className: "af-update-actions" },
              h("button", { type: "button", className: "af-update-copy", onClick: () => onCopy(result.updateCommand) }, "更新"),
            ),
            h("p", { key: "restart", className: "af-update-restart" }, "在终端执行更新命令后，请重启 dsh web 并刷新页面，新版本才会生效。「更新」按钮仅复制命令，不会自动安装。"),
          ] : status === "localInstallRestricted" ? h("p", { className: "af-update-restart" }, "本地 link/file 安装请自行同步源码并重启 dsh web；请勿执行官方 update，以免破坏开发环境。") : null,
        ),
        h("p", { className: "af-cfg-hint" }, "仅在点击「检查更新」时查询 GitHub 正式 Release（忽略预发布与草稿）；不自动检查。"),
      );
    }

    function ConfigCard() {
      useEffect(() => ensureCss(), []);
      const [saved, setSaved] = useState(emptyDraft);
      const [draft, setDraft] = useState(emptyDraft);
      const [saving, setSaving] = useState(false);
      const [err, setErr] = useState("");
      const [open, setOpen] = useState(false);
      const [metadata, setMetadata] = useState(null);
      const [updateResult, setUpdateResult] = useState(null);
      const [checkingUpdate, setCheckingUpdate] = useState(false);
      const [updateToast, setUpdateToast] = useState("");
      useEffect(() => {
        let live = true;
        api("config", {})
          .then((d) => {
            if (!live) return;
            const next = {
              sources: Array.isArray(d.sources) && d.sources.length ? d.sources : ["mikan"],
              maxResults: d.maxResults || 12,
              timeoutMs: d.timeoutMs || 20000,
              mikanHost: d.mikanHost || "https://mikanani.me",
              anibtHost: d.anibtHost || "https://anibt.net",
              gardenHost: d.gardenHost || "https://api.animes.garden",
            };
            setSaved(next);
            setDraft(next);
            setMetadata({
              currentVersion: d.currentVersion,
              installSource: d.installSource,
              installReference: d.installReference,
              updateCommand: d.updateCommand,
            });
          })
          .catch((e) => { if (live) setErr(e.message || String(e)); });
        return () => { live = false; };
      }, []);
      const dirty = !!(draft && saved && JSON.stringify(draft) !== JSON.stringify(saved));
      const toggleSource = (id) => {
        if (!draft) return;
        const on = draft.sources.includes(id);
        const sources = on ? draft.sources.filter((s) => s !== id) : [...draft.sources, id];
        if (!sources.length) return;
        setDraft({ ...draft, sources });
      };
      const save = async () => {
        if (!draft) return;
        setSaving(true);
        setErr("");
        try {
          const d = await api("config", { save: true, ...draft });
          const next = {
            sources: d.sources || draft.sources,
            maxResults: d.maxResults,
            timeoutMs: d.timeoutMs,
            mikanHost: d.mikanHost,
            anibtHost: d.anibtHost,
            gardenHost: d.gardenHost,
          };
          setSaved(next);
          setDraft(next);
        } catch (e) {
          setErr(e.message || String(e));
        } finally {
          setSaving(false);
        }
      };
      const checkUpdate = async () => {
        if (checkingUpdate) return;
        setCheckingUpdate(true);
        setUpdateResult(null);
        try {
          const result = await api("checkUpdate", {});
          setMetadata((current) => ({ ...current, ...result }));
          setUpdateResult(result);
        } catch {
          setUpdateResult({
            status: "failed",
            message: "检查失败：无法连接 GitHub 或查询出错，请稍后重试。",
          });
        } finally {
          setCheckingUpdate(false);
        }
      };
      const copyUpdateCommand = async (command) => {
        const copied = await copyText(command);
        setUpdateToast(copied ? "已复制更新命令到剪贴板" : "复制失败，请手动复制上方命令");
      };
      return h("li", { className: "af-cfg-item" },
        h("details", {
          className: "af-cfg",
          open,
          onToggle: (e) => setOpen(e.currentTarget.open),
        },
          h("summary", { className: "af-cfg-h" },
            h("span", { className: "af-cfg-t" },
              h("span", { className: "af-cfg-n" }, "搜番"),
              h("span", { className: "af-cfg-d" }, "搜索源、结果数量与站点地址。默认仅 Mikan。"),
            ),
            dirty ? h("span", { className: "af-tag orange" }, "未保存") : null,
            h(ChevronDown, { className: "af-cfg-ch" + (open ? " af-cfg-ch-open" : "") }),
          ),
          h("div", { className: "af-cfg-b" },
            h("div", { className: "af-cfg-f" },
              h("label", null, "搜索源"),
              h("div", { className: "af-cfg-src" },
                SOURCE_OPTS.map((s) => h("label", { key: s.id },
                  h("input", {
                    type: "checkbox",
                    checked: draft.sources.includes(s.id),
                    onChange: () => toggleSource(s.id),
                  }),
                  s.label,
                )),
              ),
              h("p", { className: "af-cfg-hint" }, "至少保留一个。本季新番按主机时钟拉 Mikan 当季列表；AniBT 可补充评分。"),
            ),
            h("div", { className: "af-cfg-f" },
              h("label", { htmlFor: "af-max" }, "搜索结果上限"),
              h("input", {
                id: "af-max",
                type: "number",
                min: 1,
                max: 80,
                value: draft.maxResults,
                onChange: (e) => setDraft({ ...draft, maxResults: Number(e.target.value) || 12 }),
              }),
            ),
            h("div", { className: "af-cfg-f" },
              h("label", { htmlFor: "af-mikan" }, "Mikan 站点"),
              h("input", {
                id: "af-mikan",
                type: "text",
                value: draft.mikanHost,
                onChange: (e) => setDraft({ ...draft, mikanHost: e.target.value }),
              }),
              h("p", { className: "af-cfg-hint" }, "默认 https://mikanani.me，可换成镜像。"),
            ),
            h("div", { className: "af-cfg-f" },
              h("label", { htmlFor: "af-anibt" }, "AniBT 站点"),
              h("input", {
                id: "af-anibt",
                type: "text",
                value: draft.anibtHost,
                onChange: (e) => setDraft({ ...draft, anibtHost: e.target.value }),
              }),
            ),
            h("div", { className: "af-cfg-f" },
              h("label", { htmlFor: "af-garden" }, "AnimeGarden API"),
              h("input", {
                id: "af-garden",
                type: "text",
                value: draft.gardenHost,
                onChange: (e) => setDraft({ ...draft, gardenHost: e.target.value }),
              }),
            ),
            h(VersionBlock, { metadata, result: updateResult, checking: checkingUpdate, onCheck: checkUpdate, onCopy: copyUpdateCommand }),
            h("div", { className: "af-cfg-ft" },
              err ? h("p", { className: "af-cfg-err" }, err) : null,
              h("button", { type: "button", className: "af-cfg-disc", disabled: !dirty || saving, onClick: () => setDraft(saved) }, "放弃修改"),
              h("button", { type: "button", className: "af-cfg-save", disabled: !dirty || saving, onClick: save }, saving ? "保存中" : "保存"),
            ),
          ),
        ),
        updateToast ? h(Toast, { text: updateToast, onDone: () => setUpdateToast("") }) : null,
      );
    }

    const inject = ["slots"];
    function apply(ctx) {
      const slots = ctx.get("slots");
      if (!slots) return;
      ctx.effect(() => ensureCss(), "anime-find-style");
      slots.inject("tool.call.toolview", () => slots.register(
        { name: "tool.call.toolview", key: "anime_find_search" },
        SearchToolView,
      ));
      slots.inject("tool.call.toolview", () => slots.register(
        { name: "tool.call.toolview", key: "anime_find_detail" },
        DetailToolView,
      ));
      slots.inject("settings.plugin.item", () => slots.register(
        { name: "settings.plugin.item", id: "anime-find", order: 30 },
        ConfigCard,
      ));
    }

    return { inject, apply, SearchToolView, DetailToolView };
  },
});
