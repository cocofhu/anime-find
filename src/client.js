window.__ModuleLoader__.load({
  id: "anime-find",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;
    const { useEffect, useMemo, useState } = React;

    const CSS = `
.af-root{font-family:inherit;color:var(--dsw-alias-label-primary,inherit);max-width:920px}
.af-hint{color:var(--dsw-alias-label-caption,#6b7280);font-size:12px;line-height:18px;margin:0 0 10px}
.af-search{display:flex;gap:8px;margin-bottom:12px}
.af-search input{flex:1;border:1px solid var(--dsw-alias-line-strong,#e5e7eb);border-radius:10px;padding:10px 12px;background:var(--dsw-alias-bg-primary,#fff);color:inherit;font:inherit}
.af-search button,.af-mini{border:1px solid var(--dsw-alias-line-strong,#e5e7eb);background:var(--dsw-alias-bg-primary,#fff);border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit;font-size:12px}
.af-mini.primary{background:#111827;color:#fff;border-color:#111827}
.af-week{font-weight:700;font-size:13px;margin:8px 0 6px}
.af-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
@media (max-width:720px){.af-cards{grid-template-columns:1fr}}
.af-card{display:flex;gap:10px;align-items:stretch;background:var(--dsw-alias-bg-primary,#fff);border:1px solid var(--dsw-alias-line-strong,#e5e7eb);border-radius:12px;padding:10px;cursor:pointer;text-align:left;width:100%;font:inherit;color:inherit}
.af-card:hover{border-color:#c7d2fe;box-shadow:0 4px 16px rgba(37,99,235,.12)}
.af-card.busy{cursor:wait}
.af-cover{width:72px;height:102px;border-radius:8px;object-fit:cover;border:1px solid var(--dsw-alias-line-strong,#e5e7eb);flex-shrink:0;background:#e5e7eb}
.af-meta{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px}
.af-title{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.af-score{color:#e800a4;font-weight:800;font-size:16px}
.af-tags{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}
.af-tag{font-size:11px;padding:2px 6px;border-radius:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;background:#f3f4f6;color:#4b5563}
.af-tag.blue{background:#eff6ff;color:#1d4ed8}
.af-tag.green{background:#ecfdf5;color:#047857}
.af-tag.orange{background:#fff7ed;color:#c2410c}
.af-tag.pink{background:#fdf2f8;color:#be185d}
.af-ago{color:#6b7280;font-size:12px;margin-top:auto}
.af-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.48);display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box}
.af-drawer{position:relative;width:min(720px,100%);max-height:min(86vh,840px);margin:0 auto;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 18px 50px rgba(15,23,42,.28)}
.af-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:8px;border:1px solid #d1d5db;background:#fff;cursor:pointer;font-size:18px;line-height:1;color:#4b5563;z-index:2}
.af-close:hover{background:#f3f4f6}
.af-head{display:flex;gap:14px;align-items:flex-start;padding:18px 48px 16px 18px;border-bottom:1px solid #e5e7eb}
.af-dcover{width:84px;height:118px;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;background:#e5e7eb;flex-shrink:0}
.af-head h2{margin:0 0 6px;font-size:18px;line-height:1.35}
.af-body{overflow:auto;padding:12px 18px 20px}
.af-original{color:var(--dsw-alias-label-tertiary);font-size:12px;margin:-2px 0 8px}
.af-rating{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:4px 0 8px;font-size:12px;color:var(--dsw-alias-label-caption)}
.af-rating-score{color:#d97706;font-size:17px;font-weight:800;font-variant-numeric:tabular-nums}
.af-stars{color:#f59e0b;letter-spacing:1px;font-size:13px}
.af-bgm-link,.af-more-link{color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#2563eb);font-size:12px;text-decoration:none}
.af-bgm-link:hover,.af-more-link:hover{text-decoration:underline}
.af-tabs{display:flex;gap:2px;padding:0 18px;border-bottom:1px solid var(--dsw-alias-border-l2);flex-shrink:0}
.af-tab{appearance:none;border:0;border-bottom:2px solid transparent;background:transparent;padding:10px 12px 9px;cursor:pointer;color:var(--dsw-alias-label-caption);font:inherit;font-size:13px}
.af-tab.on{color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);border-bottom-color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);font-weight:600}
.af-badge{display:inline-block;margin-left:5px;padding:1px 6px;border-radius:999px;background:var(--dsw-alias-bg-layer-3);font-size:10px;color:var(--dsw-alias-label-tertiary)}
.af-tab.on .af-badge{background:var(--dsw-alias-button-ghost-active-fill);color:inherit}
.af-meta-chips{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}
.af-meta-chip{font-size:12px;padding:5px 8px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-caption)}
.af-meta-chip b{color:var(--dsw-alias-label-primary);margin-left:4px}
.af-summary{white-space:pre-wrap;line-height:1.8;font-size:13px;margin:0;color:var(--dsw-alias-label-primary)}
.af-empty-meta{padding:28px 4px;color:var(--dsw-alias-label-caption);font-size:13px}
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
.af-group{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;margin-bottom:10px;overflow:hidden;background:var(--dsw-alias-bg-layer-1)}
.af-group summary{cursor:pointer;padding:11px 14px;display:flex;gap:10px;align-items:center;font-weight:600;background:var(--dsw-alias-bg-layer-2);list-style:none;transition:background .16s ease}
.af-group summary::-webkit-details-marker{display:none}
.af-group summary:hover{background:var(--dsw-alias-bg-layer-3)}
.af-sub{font-weight:400;color:var(--dsw-alias-label-tertiary);font-size:12px;margin-left:auto}
.af-ep{border-top:1px solid var(--dsw-alias-border-l2)}
.af-ep:first-of-type{border-top:0}
.af-ep-h{display:flex;align-items:center;gap:8px;padding:12px 14px 6px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-tertiary);letter-spacing:.04em}
.af-ep-h::after{content:"";flex:1;height:1px;background:var(--dsw-alias-border-l2)}
.af-item{padding:9px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;border-radius:8px;margin:0 6px;transition:background .14s ease}
.af-item:hover{background:var(--dsw-alias-bg-layer-2)}
.af-item + .af-item{border-top:1px solid var(--dsw-alias-border-l2)}
.af-item-raw{max-height:0;opacity:0;margin:3px 0 0;color:var(--dsw-alias-label-tertiary);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:max-height .18s ease,opacity .18s ease}
.af-item:hover .af-item-raw{max-height:20px;opacity:1}
.af-chips{display:flex;flex-wrap:wrap;gap:6px}
.af-chip{font-size:11px;line-height:1;padding:4px 8px;border-radius:6px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-caption);border:1px solid transparent}
.af-chip.hi{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);border-color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);font-weight:600}
.af-facts{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:5px 0 0;color:var(--dsw-alias-label-caption);font-size:12px}
.af-facts .af-size{color:var(--dsw-alias-label-primary);font-weight:600;font-variant-numeric:tabular-nums}
.af-facts-separator{color:var(--dsw-alias-label-tertiary)}
.af-btns{display:flex;gap:8px;flex-shrink:0;align-items:center}
.af-item .af-mini{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-caption);transition:background .16s ease,border-color .16s ease,color .16s ease}
.af-item .af-mini:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.af-item .af-mini.primary{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-caption);border-color:var(--dsw-alias-border-l2)}
.af-item .af-mini.ghost{border-color:transparent;background:transparent;color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);padding:6px 8px}
.af-item .af-mini.ghost:hover{background:var(--dsw-alias-button-ghost-active-fill)}
.af-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#111827;color:#fff;padding:10px 16px;border-radius:999px;font-size:13px;z-index:2147483646}
.af-err{color:#b91c1c;font-size:12px;margin:8px 0}
.af-tool{margin:4px 0 8px}
.af-fade{animation:af-in .18s ease}
.af-inflow{position:relative;width:100%;max-height:min(72vh,760px);margin:4px 0 8px;box-shadow:0 8px 24px rgba(15,23,42,.12)}
.af-load{display:flex;flex-direction:column;align-items:center;gap:14px;padding:28px 8px 12px;min-height:240px}
.af-spin{width:28px;height:28px;border:3px solid var(--dsw-alias-bg-skeleton);border-top-color:var(--dsw-alias-brand-primary-new-colorprimary-new-color);border-radius:50%;animation:af-spin .7s linear infinite}
.af-load-text{color:var(--dsw-alias-label-caption);font-size:13px}
.af-skel{width:100%;display:flex;flex-direction:column;gap:8px;margin-top:4px}
.af-skel-row{height:46px;border-radius:8px;background:var(--dsw-alias-bg-skeleton);background-size:200% 100%;animation:af-shimmer 1.2s ease infinite}
@keyframes af-in{from{opacity:0}to{opacity:1}}
@keyframes af-spin{to{transform:rotate(360deg)}}
@keyframes af-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
.af-cfg-item{list-style:none}
.af-cfg{border:1px solid var(--dsw-alias-border-l2,#e5e7eb);background:var(--dsw-alias-bg-layer-3,#fff);border-radius:12px}
.af-cfg[open]{background:var(--dsw-alias-bg-layer-2,#fafafa)}
.af-cfg-h{display:block;cursor:pointer;list-style:none;padding:0}
.af-cfg-h::-webkit-details-marker,.af-cfg-h::marker{display:none;content:none}
.af-cfg-h-inner{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}
.af-cfg-t{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
.af-cfg-n{font-size:15px;font-weight:600;line-height:1.4}
.af-cfg-d{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:13px;line-height:1.5}
.af-cfg-ch{color:var(--dsw-alias-label-tertiary,#6b7280);flex:none;width:14px;height:14px;transition:transform .16s;display:block;pointer-events:none}
.af-cfg[open] .af-cfg-ch{transform:rotate(180deg)}
.af-cfg-b{border-top:1px solid var(--dsw-alias-border-l2,#e5e7eb);margin:0 16px;padding:8px 0 12px}
.af-cfg-f{display:flex;flex-direction:column;gap:6px;padding:10px 0;border-top:1px solid #eee}
.af-cfg-f:first-child{border-top:0}
.af-cfg-f label{font-size:13px;font-weight:500}
.af-cfg-f input[type=text],.af-cfg-f input[type=number]{border:1px solid var(--dsw-alias-border-l2,#e5e7eb);background:var(--dsw-alias-bg-layer-3,#fff);height:34px;font:inherit;border-radius:8px;padding:0 12px;font-size:13px}
.af-cfg-hint{margin:0;color:#6b7280;font-size:12px}
.af-cfg-src{display:flex;flex-wrap:wrap;gap:10px 16px}
.af-cfg-src label{display:flex;gap:6px;align-items:center;font-weight:400;cursor:pointer}
.af-cfg-ft{border-top:1px solid var(--dsw-alias-border-l2,#e5e7eb);justify-content:flex-end;gap:8px;padding:12px 0 4px;display:flex}
.af-cfg-ft button{appearance:none;font:inherit;cursor:pointer;border-radius:8px;padding:5px 14px;font-size:13px}
.af-cfg-save{background:#111827;color:#fff;border:1px solid #111827}
.af-cfg-save:disabled,.af-cfg-disc:disabled{opacity:.4;cursor:default}
.af-cfg-disc{background:0 0;border:1px solid #d1d5db;color:#4b5563}
.af-cfg-err{color:#b91c1c;flex:1;margin:0;font-size:12px}
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
      const t = encodeURIComponent(String(title || "番").slice(0, 6));
      return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="260"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c7d2fe"/><stop offset="1" stop-color="#fbcfe8"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="52%" text-anchor="middle" fill="#374151" font-size="18" font-family="sans-serif">${t}</text></svg>`,
      )}`;
    }

    function coverSrc(url, title) {
      if (!url) return placeholder(title);
      if (url.startsWith("data:")) return url;
      return "/anime-find/cover?url=" + encodeURIComponent(url);
    }

    async function api(method, payload) {
      const res = await fetch("/anime-find", {
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
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        const input = document.createElement("input");
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        return true;
      }
    }

    function Toast({ text, onDone }) {
      useEffect(() => {
        const t = setTimeout(onDone, 1600);
        return () => clearTimeout(t);
      }, [text, onDone]);
      return h("div", { className: "af-toast" }, text);
    }

    function Tags({ item }) {
      const tags = [
        item.season && ["blue", item.season],
        item.sources && ["green", (item.sources || []).join(" · ")],
        item.subgroup && ["", item.subgroup],
        item.resourceCount > 0 && ["orange", `${item.resourceCount} 资源`],
        item.format && ["pink", item.format],
      ].filter(Boolean);
      return h(
        "div",
        { className: "af-tags" },
        tags.map((t, i) => h("span", { key: i, className: "af-tag " + t[0] }, t[1])),
      );
    }

    function Cards({ items, onOpen, pendingId, onPrefetch, hideEmpty }) {
      if (!items?.length) return hideEmpty ? null : h("div", { className: "af-hint" }, "没有结果");
      return h(
        "div",
        { className: "af-cards" },
        items.map((item) =>
          h(
            "button",
            {
              key: item.id,
              type: "button",
              className: "af-card" + (pendingId === item.id ? " busy" : ""),
              onMouseEnter: () => onPrefetch?.(item),
              onFocus: () => onPrefetch?.(item),
              onClick: () => onOpen(item),
            },
            h("img", { className: "af-cover", src: coverSrc(item.cover, item.title), alt: "" }),
            h("div", { className: "af-meta" },
              h("div", { className: "af-title", title: item.title }, item.title),
              item.score != null ? h("div", { className: "af-score" }, Number(item.score).toFixed(1)) : null,
              h(Tags, { item }),
              h("div", { className: "af-ago" }, item.id),
            ),
          ),
        ),
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
          it.torrent ? h("a", { className: "af-mini ghost", href: it.torrent, target: "_blank", rel: "noreferrer" }, "种子") : null,
        ),
      );
    }

    function LoadingBody() {
      return h("div", { className: "af-load" },
        h("div", { className: "af-spin", "aria-hidden": "true" }),
        h("div", { className: "af-load-text" }, "正在加载字幕组与磁力…"),
        h("div", { className: "af-skel" },
          h("div", { className: "af-skel-row" }),
          h("div", { className: "af-skel-row" }),
          h("div", { className: "af-skel-row" }),
          h("div", { className: "af-skel-row" }),
        ),
      );
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
      const bangumiPageUrl = intro?.pageUrl || meta?.pageUrl;
      const resourceCount = (detail?.groups || []).reduce((total, group) => total + (group.items?.length || 0), 0);
      const tabs = [
        intro && { id: "intro", label: "介绍" },
        comments.length && { id: "comments", label: "短评", count: comments.length },
        { id: "resources", label: "资源", count: resourceCount || undefined },
      ].filter(Boolean);
      if (!tabs.some((entry) => entry.id === tab)) setTab("resources");
      const stars = intro?.score ? "★".repeat(Math.round(Math.min(5, intro.score / 2))) + "☆".repeat(5 - Math.round(Math.min(5, intro.score / 2))) : "";
      return h("div", { className: "af-drawer" + (onClose ? " af-fade" : " af-inflow"), role: onClose ? "dialog" : undefined, "aria-modal": onClose ? "true" : undefined },
        onClose ? h("button", { type: "button", className: "af-close", onClick: onClose, "aria-label": "关闭" }, "×") : null,
        h("div", { className: "af-head" },
          h("img", { className: "af-dcover", src: coverSrc(detail?.cover || item.cover, item.title), alt: "" }),
          h("div", { style: { minWidth: 0, flex: 1 } },
            h("h2", null, detail?.title || item.title),
            intro?.nameOrig ? h("div", { className: "af-original" }, intro.nameOrig) : null,
            intro?.score ? h("div", { className: "af-rating" },
              h("span", { className: "af-rating-score" }, intro.score.toFixed(1)),
              h("span", null, "/10"),
              h("span", { className: "af-stars", "aria-label": `${intro.score}/10` }, stars),
              intro.ratingCount ? h("span", null, `${intro.ratingCount.toLocaleString()} 人评分`) : null,
            ) : item.score != null ? h("div", { className: "af-score" }, Number(item.score).toFixed(1)) : null,
            bangumiPageUrl ? h("a", { className: "af-bgm-link", href: bangumiPageUrl, target: "_blank", rel: "noreferrer" }, "Bangumi 条目") : null,
            h(Tags, { item: { ...item, ...(detail || {}) } }),
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
        h("div", { className: "af-body" },
          tab === "intro" && intro ? h("div", null,
            intro.chips?.length ? h("div", { className: "af-meta-chips" },
              intro.chips.map((chip) => h("span", { className: "af-meta-chip", key: chip.label }, chip.label, h("b", null, chip.value))),
            ) : null,
            intro.summary ? h("p", { className: "af-summary" }, intro.summary) : h("div", { className: "af-empty-meta" }, "该条目暂未提供介绍。"),
            h("p", null, h("a", { className: "af-more-link", href: intro.pageUrl, target: "_blank", rel: "noreferrer" }, "在 Bangumi 查看条目")),
          ) : tab === "comments" ? h("div", null,
            comments.map((comment, index) => h("div", { className: "af-comment", key: `${comment.nickname}-${index}` },
              comment.avatarUrl
                ? h("img", { className: "af-avatar", src: comment.avatarUrl, alt: "" })
                : h("span", { className: "af-avatar" }, (comment.nickname || "B").slice(0, 1)),
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
          ) : loading ? h(LoadingBody) : [
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
            !groups.length ? h("div", { key: "empty", className: "af-hint" }, "该来源暂无资源") : null,
          ],
        ),
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

    function ConfigCard() {
      useEffect(() => ensureCss(), []);
      const [saved, setSaved] = useState(emptyDraft);
      const [draft, setDraft] = useState(emptyDraft);
      const [saving, setSaving] = useState(false);
      const [err, setErr] = useState("");
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
      return h("li", { className: "af-cfg-item" },
        h("details", { className: "af-cfg" },
          h("summary", { className: "af-cfg-h" },
            h("span", { className: "af-cfg-h-inner" },
              h("span", { className: "af-cfg-t" },
                h("span", { className: "af-cfg-n" }, "搜番"),
                h("span", { className: "af-cfg-d" }, "搜索源、结果数量与站点地址。默认仅 Mikan。"),
              ),
              dirty ? h("span", { className: "af-tag orange" }, "未保存") : null,
              h(ChevronDown, { className: "af-cfg-ch" }),
            ),
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
            h("div", { className: "af-cfg-ft" },
              err ? h("p", { className: "af-cfg-err" }, err) : null,
              h("button", { type: "button", className: "af-cfg-disc", disabled: !dirty || saving, onClick: () => setDraft(saved) }, "放弃修改"),
              h("button", { type: "button", className: "af-cfg-save", disabled: !dirty || saving, onClick: save }, saving ? "保存中" : "保存"),
            ),
          ),
        ),
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
