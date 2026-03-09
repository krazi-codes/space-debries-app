import { useState, useEffect, useRef, useCallback } from "react";

// ── Palette & helpers ────────────────────────────────────────────────
const PALETTE = {
  bg: "#03060f",
  panel: "#070d1a",
  border: "#0f2040",
  amber: "#f5a623",
  red: "#ff3b5c",
  blue: "#1ae0ff",
  green: "#00e5a0",
  dim: "#3a5070",
  text: "#c8dff5",
  muted: "#4a6a8a",
};

// seeded pseudo-random for deterministic debris
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRand(42);

const DEBRIS_NAMES = [
  "FENGYUN-1C","COSMOS 954","IRIDIUM-33","BLITS","SL-16","SL-8","COSMOS 2251",
  "RESURS-1","ASTROS II","ANIK B","DELTA II","ARIANE 44LP","ATLAS AGENA",
  "THOR ABLE","VANGUARD 1","TELSTAR 1","OPS 6933","SL-14 DEB","PSLV R/B",
  "H-IIA DEB","STEP 2","LEASAT F1","SATCOM 3","SOLIDARIDAD 1","ARABSAT 1A",
];

function generateDebris() {
  return DEBRIS_NAMES.map((name, i) => {
    const r = seededRand(i * 137 + 7);
    const altitude = 300 + r() * 1800;
    const size = 0.1 + r() * 9.9;
    const velocity = 7.2 + r() * 1.3;
    const inclination = r() * 98;
    const collisionProb = r() * 0.04;
    const risk = collisionProb > 0.025 ? "CRITICAL" : collisionProb > 0.01 ? "HIGH" : collisionProb > 0.005 ? "MEDIUM" : "LOW";
    return {
      id: i,
      name,
      altitude: Math.round(altitude),
      size: +size.toFixed(1),
      velocity: +velocity.toFixed(2),
      inclination: +inclination.toFixed(1),
      collisionProb: +collisionProb.toFixed(4),
      risk,
      mass: Math.round(10 + r() * 2990),
      country: ["USA","RUS","CHN","EU","IND","JPN"][Math.floor(r() * 6)],
      year: 1978 + Math.floor(r() * 44),
      theta: r() * Math.PI * 2,
      phi: r() * Math.PI,
      orbitSpeed: 0.0003 + r() * 0.0004,
      selected: false,
    };
  });
}

const ALL_DEBRIS = generateDebris();

const MITIGATIONS = [
  { id: "laser", name: "Laser Ablation", icon: "⚡", color: PALETTE.blue, eta: "6–18 months", cost: "$2.4M", efficacy: 92, desc: "Ground/space-based pulsed laser heats debris surface, generating thrust to deorbit." },
  { id: "drag", name: "Drag Augmentation", icon: "🪂", color: PALETTE.green, eta: "3–9 months", cost: "$0.8M", efficacy: 78, desc: "Deploy electrodynamic drag sail to increase atmospheric drag and accelerate reentry." },
  { id: "harpoon", name: "Harpoon Capture", icon: "🎯", color: PALETTE.amber, eta: "12–24 months", cost: "$4.1M", efficacy: 85, desc: "Chaser satellite fires tethered harpoon to capture and tow debris to graveyard orbit." },
  { id: "foam", name: "Foam Spray", icon: "💨", color: "#d066f5", eta: "1–4 months", cost: "$0.3M", efficacy: 61, desc: "Spray expanding polyurethane foam cloud to slow small debris via aerogel drag medium." },
  { id: "ion", name: "Ion Beam Shepherd", icon: "🔵", color: "#5bdfff", eta: "8–20 months", cost: "$3.2M", efficacy: 88, desc: "Contactless ion thruster directs focused plasma beam at debris to change trajectory safely." },
];

// ── Canvas Visualizer ────────────────────────────────────────────────
function OrbitalCanvas({ debris, selected, onSelect }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const thetasRef = useRef(debris.map(d => d.theta));
  const hoveredRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frame = 0;

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      const cx = W / 2, cy = H / 2;
      const earthR = Math.min(W, H) * 0.2;

      ctx.clearRect(0, 0, W, H);

      // Starfield
      if (frame === 0) {
        canvas._stars = Array.from({ length: 200 }, () => ({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.2, a: 0.2 + Math.random() * 0.6,
        }));
      }
      (canvas._stars || []).forEach(s => {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${s.a})`; ctx.fill();
      });

      // Earth glow
      const glow = ctx.createRadialGradient(cx, cy, earthR * 0.8, cx, cy, earthR * 2.5);
      glow.addColorStop(0, "rgba(26,100,220,0.18)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

      // Earth
      const earthGrad = ctx.createRadialGradient(cx - earthR * 0.3, cy - earthR * 0.3, earthR * 0.1, cx, cy, earthR);
      earthGrad.addColorStop(0, "#2a7fd4"); earthGrad.addColorStop(0.5, "#1a5ba8"); earthGrad.addColorStop(1, "#0a2040");
      ctx.beginPath(); ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
      ctx.fillStyle = earthGrad; ctx.fill();
      ctx.strokeStyle = "rgba(26,224,255,0.3)"; ctx.lineWidth = 1.5;
      ctx.stroke();

      // Atmosphere ring
      const atmo = ctx.createRadialGradient(cx, cy, earthR, cx, cy, earthR * 1.08);
      atmo.addColorStop(0, "rgba(80,160,255,0.25)"); atmo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(cx, cy, earthR * 1.08, 0, Math.PI * 2);
      ctx.fillStyle = atmo; ctx.fill();

      // Orbits + debris
      debris.forEach((d, i) => {
        const scale = Math.min(W, H) * 0.5;
        const orbitR = earthR + (d.altitude / 2000) * (scale - earthR) * 0.85;
        const tilt = (d.inclination / 98) * 0.5;

        // Orbit ring
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 0.55 + tilt * 0.4);
        ctx.beginPath(); ctx.arc(0, 0, orbitR, 0, Math.PI * 2);
        ctx.strokeStyle = selected === d.id ? "rgba(26,224,255,0.35)" : "rgba(15,32,64,0.7)";
        ctx.lineWidth = selected === d.id ? 1.2 : 0.5; ctx.stroke();
        ctx.restore();

        // Debris dot
        thetasRef.current[i] += d.orbitSpeed;
        const t = thetasRef.current[i];
        const yScale = 0.55 + tilt * 0.4;
        const dx = cx + Math.cos(t) * orbitR;
        const dy = cy + Math.sin(t) * orbitR * yScale;

        const isHovered = hoveredRef.current === d.id;
        const isSelected = selected === d.id;
        const dotR = isSelected ? 5 : isHovered ? 4 : d.size > 5 ? 3.5 : 2.5;
        const color = d.risk === "CRITICAL" ? PALETTE.red : d.risk === "HIGH" ? PALETTE.amber : d.risk === "MEDIUM" ? "#f5e623" : PALETTE.dim;

        if (isSelected || isHovered) {
          ctx.beginPath(); ctx.arc(dx, dy, dotR * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = color.replace(")", ",0.25)").replace("rgb", "rgba"); ctx.fill();
        }

        ctx.beginPath(); ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();

        // Store positions for hit testing
        d._px = dx; d._py = dy;
      });

      frame++;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, [debris, selected]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    mouseRef.current = { x: mx, y: my };
    let closest = null, minD = 15;
    debris.forEach(d => {
      if (d._px !== undefined) {
        const dist = Math.hypot(d._px - mx, d._py - my);
        if (dist < minD) { minD = dist; closest = d.id; }
      }
    });
    hoveredRef.current = closest;
    canvasRef.current.style.cursor = closest !== null ? "pointer" : "default";
  }, [debris]);

  const handleClick = useCallback(() => {
    if (hoveredRef.current !== null) onSelect(hoveredRef.current);
  }, [onSelect]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

// ── Sparkline ────────────────────────────────────────────────────────
function Sparkline({ color = PALETTE.blue, height = 32 }) {
  const pts = useRef(Array.from({ length: 24 }, () => 20 + Math.random() * 60));
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      pts.current = [...pts.current.slice(1), Math.max(5, Math.min(95, pts.current.at(-1) + (Math.random() - 0.5) * 18))];
      tick(n => n + 1);
    }, 800);
    return () => clearInterval(t);
  }, []);
  const W = 120, H = height;
  const step = W / (pts.current.length - 1);
  const path = pts.current.map((v, i) => `${i === 0 ? "M" : "L"}${i * step},${H - (v / 100) * H}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${(pts.current.length - 1) * step},${H} L0,${H} Z`} fill={`url(#sg-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// ── Risk Badge ───────────────────────────────────────────────────────
function RiskBadge({ risk }) {
  const colors = { CRITICAL: PALETTE.red, HIGH: PALETTE.amber, MEDIUM: "#f5e623", LOW: PALETTE.green };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      padding: "2px 7px", borderRadius: 3,
      background: colors[risk] + "22", color: colors[risk],
      border: `1px solid ${colors[risk]}44`,
      fontFamily: "'Space Mono', monospace",
    }}>{risk}</span>
  );
}

// ── Main App ─────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("tracker");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [mitigation, setMitigation] = useState(null);
  const [alertCount, setAlertCount] = useState(3);
  const [time, setTime] = useState(Date.now());
  const [calcInputs, setCalcInputs] = useState({ mass: "250", altitude: "750", size: "1.2" });
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const selectedDebris = ALL_DEBRIS.find(d => d.id === selected);
  const filtered = filter === "ALL" ? ALL_DEBRIS : ALL_DEBRIS.filter(d => d.risk === filter);
  const critCount = ALL_DEBRIS.filter(d => d.risk === "CRITICAL").length;
  const highCount = ALL_DEBRIS.filter(d => d.risk === "HIGH").length;

  function calcCollision() {
    const m = parseFloat(calcInputs.mass), a = parseFloat(calcInputs.altitude), s = parseFloat(calcInputs.size);
    if (isNaN(m) || isNaN(a) || isNaN(s)) return;
    const prob = Math.min(0.999, (m / 3000) * (s / 10) * (1 - a / 2500) * 0.08);
    const tle = (a * 0.004 * Math.max(0.1, 1 - a / 2000)).toFixed(1);
    const ke = (0.5 * m * 7700 ** 2 / 1e9).toFixed(0);
    setCalcResult({ prob: (prob * 100).toFixed(3), tle, ke, risk: prob > 0.025 ? "CRITICAL" : prob > 0.01 ? "HIGH" : prob > 0.005 ? "MEDIUM" : "LOW" });
  }

  const utc = new Date(time).toUTCString().replace("GMT", "UTC");

  return (
    <div style={{
      background: PALETTE.bg, minHeight: "100vh", fontFamily: "'Space Mono', monospace",
      color: PALETTE.text, display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@400;600;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #070d1a; } ::-webkit-scrollbar-thumb { background: #0f2040; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.7} }
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .tab-btn { background:none; border:none; cursor:pointer; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:0.1em; padding:10px 18px; color:#3a5070; transition:all .2s; position:relative; }
        .tab-btn.active { color:#1ae0ff; }
        .tab-btn.active::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:#1ae0ff; }
        .tab-btn:hover:not(.active) { color:#c8dff5; }
        .card { background:#070d1a; border:1px solid #0f2040; border-radius:6px; padding:16px; }
        .row-item { padding:8px 10px; border-bottom:1px solid #0a1828; cursor:pointer; transition:background .15s; display:flex; align-items:center; gap:10px; animation:fadeIn .3s ease; }
        .row-item:hover { background:#0a1828; }
        .row-item.active { background:#0d2040; border-left:2px solid #1ae0ff; }
        .metric { display:flex; flex-direction:column; gap:3px; }
        .metric-val { font-size:22px; font-weight:700; font-family:'Orbitron',monospace; }
        .metric-label { font-size:10px; letter-spacing:0.1em; color:#4a6a8a; }
        .input-field { background:#03060f; border:1px solid #0f2040; color:#c8dff5; font-family:'Space Mono',monospace; font-size:12px; padding:8px 10px; border-radius:4px; width:100%; outline:none; }
        .input-field:focus { border-color:#1ae0ff44; }
        .action-btn { background:transparent; border:1px solid; border-radius:4px; padding:8px 16px; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:0.08em; cursor:pointer; transition:all .2s; }
        .mit-card { border:1px solid #0f2040; border-radius:6px; padding:14px; cursor:pointer; transition:all .2s; }
        .mit-card:hover { border-color:#1ae0ff44; background:#0a1828; }
        .mit-card.selected { background:#0d1f38; }
        .progress-bar { height:4px; border-radius:2px; background:#0f2040; overflow:hidden; }
        .progress-fill { height:100%; border-radius:2px; transition:width .5s; }
      `}</style>

      {/* Scanline overlay */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9, overflow: "hidden", opacity: 0.03 }}>
        <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.8)", animation: "scan 4s linear infinite" }} />
      </div>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${PALETTE.border}`, padding: "0 24px", display: "flex", alignItems: "center", gap: 24, height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="5" fill="none" stroke={PALETTE.blue} strokeWidth="1.5" />
            <ellipse cx="14" cy="14" rx="13" ry="5" fill="none" stroke={PALETTE.blue} strokeWidth="1" opacity="0.5" />
            <ellipse cx="14" cy="14" rx="13" ry="5" fill="none" stroke={PALETTE.blue} strokeWidth="1" opacity="0.5" transform="rotate(60 14 14)" />
            <ellipse cx="14" cy="14" rx="13" ry="5" fill="none" stroke={PALETTE.blue} strokeWidth="1" opacity="0.5" transform="rotate(120 14 14)" />
            <circle cx="21" cy="8" r="2" fill={PALETTE.red} style={{ animation: "pulse 1.5s infinite" }} />
          </svg>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "0.15em" }}>DEBRIS<span style={{ color: PALETTE.blue }}>WATCH</span></span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, color: PALETTE.muted, letterSpacing: "0.08em", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span style={{ color: PALETTE.dim, fontSize: 9, letterSpacing: "0.12em" }}>OPERATOR</span>
          <span style={{ color: PALETTE.blue, fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em" }}>ISSAM AHMAD</span>
        </div>
        <div style={{ width: 1, height: 28, background: PALETTE.border }} />
        <div style={{ fontSize: 10, color: PALETTE.muted, letterSpacing: "0.08em" }}>
          UTC {utc}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {alertCount > 0 && (
            <div style={{ background: PALETTE.red + "22", border: `1px solid ${PALETTE.red}55`, borderRadius: 4, padding: "3px 10px", fontSize: 10, color: PALETTE.red, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: PALETTE.red, display: "inline-block", animation: "pulse 1s infinite" }} />
              {alertCount} CRITICAL ALERTS
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${PALETTE.border}`, padding: "0 20px", display: "flex" }}>
        {["tracker", "catalog", "mitigate", "calculator"].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "tracker" ? "⬡ ORBITAL TRACKER" : t === "catalog" ? "☰ DEBRIS CATALOG" : t === "mitigate" ? "◈ MITIGATION" : "⊕ RISK CALC"}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", gap: 0 }}>

        {/* ── TRACKER TAB ── */}
        {tab === "tracker" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Canvas */}
            <div style={{ flex: 1, position: "relative" }}>
              <OrbitalCanvas debris={ALL_DEBRIS} selected={selected} onSelect={setSelected} />
              {/* Overlay stats */}
              <div style={{ position: "absolute", top: 16, left: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "TRACKED OBJECTS", val: ALL_DEBRIS.length, color: PALETTE.blue },
                  { label: "CRITICAL RISK", val: critCount, color: PALETTE.red },
                  { label: "HIGH RISK", val: highCount, color: PALETTE.amber },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: "8px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontFamily: "'Orbitron'", fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</span>
                    <span style={{ fontSize: 9, color: PALETTE.muted, letterSpacing: "0.1em" }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", bottom: 16, left: 16, fontSize: 9, color: PALETTE.muted, letterSpacing: "0.08em" }}>
                CLICK DEBRIS OBJECT TO SELECT · LEO/MEO VISUALIZATION
              </div>
            </div>

            {/* Side panel */}
            <div style={{ width: 280, borderLeft: `1px solid ${PALETTE.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${PALETTE.border}`, fontSize: 10, color: PALETTE.muted, letterSpacing: "0.1em" }}>
                {selectedDebris ? "OBJECT DETAILS" : "SELECT AN OBJECT"}
              </div>
              {selectedDebris ? (
                <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Orbitron'", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{selectedDebris.name}</div>
                    <RiskBadge risk={selectedDebris.risk} />
                  </div>
                  {[
                    ["ALTITUDE", `${selectedDebris.altitude} km`],
                    ["VELOCITY", `${selectedDebris.velocity} km/s`],
                    ["MASS", `${selectedDebris.mass} kg`],
                    ["SIZE", `${selectedDebris.size} m`],
                    ["INCLINATION", `${selectedDebris.inclination}°`],
                    ["ORIGIN", selectedDebris.country],
                    ["LAUNCH YEAR", selectedDebris.year],
                    ["COLLISION PROB", `${(selectedDebris.collisionProb * 100).toFixed(2)}%`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, borderBottom: "1px solid #0a1828", paddingBottom: 6 }}>
                      <span style={{ color: PALETTE.muted, letterSpacing: "0.08em" }}>{k}</span>
                      <span style={{ color: PALETTE.text }}>{v}</span>
                    </div>
                  ))}
                  <button className="action-btn" onClick={() => { setTab("mitigate"); }}
                    style={{ borderColor: PALETTE.blue, color: PALETTE.blue, width: "100%", marginTop: 8 }}>
                    ◈ PLAN MITIGATION
                  </button>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 16 }}>
                  <div style={{ fontSize: 10, color: PALETTE.muted, lineHeight: 1.8 }}>Click any orbital object to inspect its data and assess collision risk.</div>
                  <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: 16 }}>
                    <div style={{ fontSize: 10, color: PALETTE.muted, letterSpacing: "0.08em", marginBottom: 12 }}>ALTITUDE DISTRIBUTION</div>
                    {[["LEO (300–800km)", 62], ["MEO (800–2000km)", 28], ["GEO (35786km)", 10]].map(([l, v]) => (
                      <div key={l} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                          <span style={{ color: PALETTE.muted }}>{l}</span><span>{v}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${v}%`, background: PALETTE.blue }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CATALOG TAB ── */}
        {tab === "catalog" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Filters */}
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${PALETTE.border}`, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: PALETTE.muted, marginRight: 4 }}>FILTER:</span>
                {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(f => {
                  const colors = { ALL: PALETTE.blue, CRITICAL: PALETTE.red, HIGH: PALETTE.amber, MEDIUM: "#f5e623", LOW: PALETTE.green };
                  return (
                    <button key={f} onClick={() => setFilter(f)}
                      style={{ background: filter === f ? colors[f] + "22" : "transparent", border: `1px solid ${filter === f ? colors[f] : PALETTE.border}`, color: filter === f ? colors[f] : PALETTE.muted, borderRadius: 3, padding: "3px 10px", fontSize: 10, cursor: "pointer", letterSpacing: "0.08em", fontFamily: "'Space Mono'" }}>
                      {f}
                    </button>
                  );
                })}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 10, color: PALETTE.muted }}>{filtered.length} OBJECTS</span>
              </div>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 80px 90px", padding: "6px 10px", borderBottom: `1px solid ${PALETTE.border}`, fontSize: 9, color: PALETTE.muted, letterSpacing: "0.1em" }}>
                {["OBJECT ID", "ALT (km)", "SIZE (m)", "VEL (km/s)", "MASS (kg)", "ORIGIN", "RISK"].map(h => <div key={h}>{h}</div>)}
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                {filtered.map(d => (
                  <div key={d.id} className={`row-item ${selected === d.id ? "active" : ""}`}
                    onClick={() => { setSelected(d.id); }}
                    style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 80px 90px", fontSize: 11 }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 11 }}>{d.name}</div>
                    <div>{d.altitude}</div>
                    <div>{d.size}</div>
                    <div>{d.velocity}</div>
                    <div>{d.mass}</div>
                    <div style={{ color: PALETTE.muted }}>{d.country}</div>
                    <div><RiskBadge risk={d.risk} /></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Detail panel */}
            {selected !== null && (
              <div style={{ width: 260, borderLeft: `1px solid ${PALETTE.border}`, padding: 16, overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                {selectedDebris && <>
                  <div>
                    <div style={{ fontFamily: "'Orbitron'", fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{selectedDebris.name}</div>
                    <RiskBadge risk={selectedDebris.risk} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: PALETTE.muted, letterSpacing: "0.1em", marginBottom: 8 }}>COLLISION PROBABILITY</div>
                    <div style={{ fontFamily: "'Orbitron'", fontSize: 26, fontWeight: 900, color: selectedDebris.risk === "CRITICAL" ? PALETTE.red : PALETTE.amber }}>
                      {(selectedDebris.collisionProb * 100).toFixed(2)}%
                    </div>
                    <Sparkline color={selectedDebris.risk === "CRITICAL" ? PALETTE.red : PALETTE.amber} />
                  </div>
                  <div style={{ fontSize: 10, color: PALETTE.muted, lineHeight: 1.9 }}>
                    {selectedDebris.name} is a <b style={{ color: PALETTE.text }}>{selectedDebris.size}m</b> object at <b style={{ color: PALETTE.text }}>{selectedDebris.altitude}km</b> altitude, travelling at <b style={{ color: PALETTE.text }}>{selectedDebris.velocity}km/s</b>. Launched by <b style={{ color: PALETTE.text }}>{selectedDebris.country}</b> in <b style={{ color: PALETTE.text }}>{selectedDebris.year}</b>.
                  </div>
                  <button className="action-btn" onClick={() => setTab("mitigate")}
                    style={{ borderColor: PALETTE.blue, color: PALETTE.blue }}>
                    PLAN MITIGATION →
                  </button>
                </>}
              </div>
            )}
          </div>
        )}

        {/* ── MITIGATION TAB ── */}
        {tab === "mitigate" && (
          <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'Orbitron'", fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 6 }}>MITIGATION STRATEGIES</div>
                <div style={{ fontSize: 11, color: PALETTE.muted }}>Select a debris removal technology to evaluate feasibility and estimated outcomes.</div>
              </div>

              {/* Priority queue */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: PALETTE.muted, letterSpacing: "0.1em", marginBottom: 12 }}>⚡ PRIORITY REMOVAL QUEUE</div>
                {ALL_DEBRIS.filter(d => d.risk === "CRITICAL" || d.risk === "HIGH").slice(0, 5).map((d, i) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${PALETTE.border}` : "none" }}>
                    <span style={{ fontFamily: "'Orbitron'", fontSize: 14, fontWeight: 900, color: PALETTE.muted, width: 20 }}>#{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#fff" }}>{d.name}</span>
                    <span style={{ fontSize: 11, color: PALETTE.muted }}>{d.altitude} km</span>
                    <span style={{ fontSize: 11, color: PALETTE.muted }}>{d.mass} kg</span>
                    <RiskBadge risk={d.risk} />
                  </div>
                ))}
              </div>

              {/* Strategy cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 24 }}>
                {MITIGATIONS.map(m => (
                  <div key={m.id} className={`mit-card ${mitigation === m.id ? "selected" : ""}`}
                    onClick={() => setMitigation(mitigation === m.id ? null : m.id)}
                    style={{ borderColor: mitigation === m.id ? m.color + "88" : PALETTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
                        <div style={{ fontFamily: "'Orbitron'", fontSize: 12, fontWeight: 700, color: "#fff" }}>{m.name}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: PALETTE.muted }}>EFFICACY</div>
                        <div style={{ fontFamily: "'Orbitron'", fontSize: 18, fontWeight: 900, color: m.color }}>{m.efficacy}%</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: PALETTE.muted, lineHeight: 1.7, marginBottom: 12 }}>{m.desc}</div>
                    <div className="progress-bar" style={{ marginBottom: 12 }}>
                      <div className="progress-fill" style={{ width: `${m.efficacy}%`, background: m.color }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                      <span style={{ color: PALETTE.muted }}>ETA: <span style={{ color: PALETTE.text }}>{m.eta}</span></span>
                      <span style={{ color: PALETTE.muted }}>COST: <span style={{ color: m.color }}>{m.cost}</span></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison when selected */}
              {mitigation && (() => {
                const m = MITIGATIONS.find(x => x.id === mitigation);
                return (
                  <div className="card" style={{ borderColor: m.color + "44", animation: "fadeIn .3s ease" }}>
                    <div style={{ fontFamily: "'Orbitron'", fontSize: 13, fontWeight: 700, color: m.color, marginBottom: 16 }}>
                      {m.icon} {m.name.toUpperCase()} — DEPLOYMENT PLAN
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                      {[
                        ["TIMELINE", m.eta, PALETTE.text],
                        ["ESTIMATED COST", m.cost, m.color],
                        ["SUCCESS RATE", `${m.efficacy}%`, m.color],
                        ["DEBRIS REDUCED", `${Math.round(m.efficacy * 0.22)} objects`, PALETTE.green],
                      ].map(([l, v, c]) => (
                        <div key={l} className="metric">
                          <div className="metric-label">{l}</div>
                          <div className="metric-val" style={{ fontSize: 16, color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16, fontSize: 10, color: PALETTE.muted, lineHeight: 1.8, padding: "12px", background: "#03060f", borderRadius: 4, border: `1px solid ${PALETTE.border}` }}>
                      RECOMMENDATION: Deploy {m.name} targeting critical objects in 200–800km LEO band. Priority targets: {ALL_DEBRIS.filter(d => d.risk === "CRITICAL").slice(0, 3).map(d => d.name).join(", ")}.
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── CALCULATOR TAB ── */}
        {tab === "calculator" && (
          <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Orbitron'", fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 6 }}>COLLISION RISK CALCULATOR</div>
              <div style={{ fontSize: 11, color: PALETTE.muted, marginBottom: 24 }}>Enter debris parameters to compute probability of orbital collision and kinetic energy impact.</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                {[
                  { key: "mass", label: "MASS (kg)", placeholder: "e.g. 250" },
                  { key: "altitude", label: "ALTITUDE (km)", placeholder: "e.g. 750" },
                  { key: "size", label: "DIAMETER (m)", placeholder: "e.g. 1.2" },
                ].map(f => (
                  <div key={f.key} className="card">
                    <div style={{ fontSize: 9, color: PALETTE.muted, letterSpacing: "0.1em", marginBottom: 8 }}>{f.label}</div>
                    <input className="input-field" value={calcInputs[f.key]} placeholder={f.placeholder}
                      onChange={e => setCalcInputs(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>

              <button className="action-btn" onClick={calcCollision}
                style={{ borderColor: PALETTE.blue, color: PALETTE.blue, fontSize: 12, padding: "10px 32px", marginBottom: 24 }}>
                ⊕ COMPUTE RISK ASSESSMENT
              </button>

              {calcResult && (
                <div style={{ animation: "fadeIn .4s ease" }}>
                  <div className="card" style={{ borderColor: calcResult.risk === "CRITICAL" ? PALETTE.red + "55" : PALETTE.border, marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: PALETTE.muted, letterSpacing: "0.1em", marginBottom: 16 }}>ASSESSMENT RESULTS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
                      <div className="metric">
                        <div className="metric-label">COLLISION PROBABILITY</div>
                        <div className="metric-val" style={{ color: calcResult.risk === "CRITICAL" ? PALETTE.red : calcResult.risk === "HIGH" ? PALETTE.amber : PALETTE.green }}>
                          {calcResult.prob}%
                        </div>
                        <div style={{ marginTop: 6 }}><RiskBadge risk={calcResult.risk} /></div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">KINETIC ENERGY (GJ)</div>
                        <div className="metric-val" style={{ color: PALETTE.blue }}>{parseInt(calcResult.ke).toLocaleString()} GJ</div>
                        <div style={{ fontSize: 10, color: PALETTE.muted, marginTop: 6 }}>~{Math.round(calcResult.ke / 4.2)} kt TNT equivalent</div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">TIME TO LOWER ENTRY</div>
                        <div className="metric-val" style={{ color: PALETTE.amber }}>{calcResult.tle} yrs</div>
                        <div style={{ fontSize: 10, color: PALETTE.muted, marginTop: 6 }}>Natural atmospheric decay</div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">RECOMMENDED ACTION</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: PALETTE.text, lineHeight: 1.6 }}>
                          {calcResult.risk === "CRITICAL" ? "⚡ IMMEDIATE LASER ABLATION" : calcResult.risk === "HIGH" ? "🎯 SCHEDULE HARPOON CAPTURE" : calcResult.risk === "MEDIUM" ? "🪂 DEPLOY DRAG AUGMENT" : "📡 CONTINUE MONITORING"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ fontSize: 10, color: PALETTE.muted, letterSpacing: "0.1em", marginBottom: 12 }}>IMPACT FRAGMENTATION MODEL</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {["Primary fragment cloud", "Secondary debris field", "Cascade threshold", "Kessler factor", "Orbital lifetime"].map((l, i) => (
                        <div key={l} style={{ background: "#0a1828", border: `1px solid ${PALETTE.border}`, borderRadius: 3, padding: "4px 10px", fontSize: 10, color: PALETTE.muted }}>
                          {l}: <span style={{ color: PALETTE.text }}>{[">2400", "~14000", calcResult.risk === "CRITICAL" ? "EXCEEDED" : "SAFE", (parseFloat(calcResult.prob) * 12).toFixed(2), `${calcResult.tle}yr`][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Info section */}
              <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { title: "Kessler Syndrome", body: "Cascade effect where collisions generate fragments that cause further collisions, potentially rendering LEO unusable." },
                  { title: "NASA Standard Breakup Model", body: "Debris generated follows power-law size distributions with characteristic length L_c as primary parameter." },
                ].map(c => (
                  <div key={c.title} className="card" style={{ fontSize: 11, lineHeight: 1.7 }}>
                    <div style={{ fontFamily: "'Orbitron'", fontSize: 11, fontWeight: 700, color: PALETTE.blue, marginBottom: 8 }}>{c.title}</div>
                    <div style={{ color: PALETTE.muted }}>{c.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
