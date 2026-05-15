"use client";

import { useState, useEffect } from "react";
import styles from "./cheat-menu-demo.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavId = "aimbot" | "visuals" | "radar" | "misc" | "config";

const TABS: Record<NavId, readonly string[]> = {
  aimbot:  ["General", "Triggerbot", "Recoil"],
  visuals: ["General", "Players", "World"],
  radar:   ["General"],
  misc:    ["General"],
  config:  ["Profiles"],
};

// ─── State ────────────────────────────────────────────────────────────────────

type S = {
  ag_enabled: boolean; ag_aimKey: string; ag_aimType: string;
  ag_smooth: boolean; ag_smoothness: number; ag_drawFov: boolean;
  ag_fovRadius: number; ag_prediction: boolean; ag_predDot: boolean;
  ag_targetLock: boolean; ag_vischeck: boolean; ag_maxDist: number; ag_bones: string;

  at_enabled: boolean; at_onlyAim: boolean; at_delay: number;
  at_hitbox: string; at_reactionDelay: number;

  ar_enabled: boolean; ar_stillOnly: boolean; ar_mode: string;
  ar_strength: number; ar_randomization: number;

  vg_name: boolean; vg_box: boolean; vg_skeleton: boolean;
  vg_distance: boolean; vg_health: boolean; vg_armor: boolean;
  vg_maxDist: number; vg_arrows: boolean; vg_arrowsRange: number;
  vg_radar: boolean; vg_radarScale: number; vg_maxShowDist: number;

  vp_chams: boolean; vp_chamsType: string; vp_glow: boolean;
  vp_glowColor: string; vp_outlines: boolean;

  vw_itemEsp: boolean; vw_vehicles: boolean; vw_dropped: boolean; vw_lootGrade: string;

  rg_enabled: boolean; rg_showTeam: boolean; rg_showEnemies: boolean;
  rg_scale: number; rg_range: number; rg_opacity: number;

  mg_speedhack: boolean; mg_noRecoil: boolean; mg_noSpread: boolean;
  mg_bunnyHop: boolean; mg_battleMode: boolean; mg_crosshair: boolean;
  mg_autoAccept: boolean; mg_panicKey: string;

  cfg_active: string;
  cfg_name: string;
};

const INIT: S = {
  ag_enabled: true, ag_aimKey: "MB4", ag_aimType: "Memory",
  ag_smooth: true, ag_smoothness: 25, ag_drawFov: false,
  ag_fovRadius: 60, ag_prediction: true, ag_predDot: true,
  ag_targetLock: false, ag_vischeck: false, ag_maxDist: 500, ag_bones: "Head",

  at_enabled: false, at_onlyAim: true, at_delay: 50, at_hitbox: "Chest", at_reactionDelay: 30,

  ar_enabled: true, ar_stillOnly: false, ar_mode: "Per-Weapon",
  ar_strength: 100, ar_randomization: 15,

  vg_name: true, vg_box: false, vg_skeleton: true, vg_distance: true,
  vg_health: true, vg_armor: false, vg_maxDist: 500,
  vg_arrows: true, vg_arrowsRange: 60, vg_radar: true,
  vg_radarScale: 1.0, vg_maxShowDist: 300,

  vp_chams: false, vp_chamsType: "Flat", vp_glow: true, vp_glowColor: "Blue", vp_outlines: false,

  vw_itemEsp: true, vw_vehicles: false, vw_dropped: true, vw_lootGrade: "All",

  rg_enabled: true, rg_showTeam: true, rg_showEnemies: true,
  rg_scale: 1.0, rg_range: 500, rg_opacity: 80,

  mg_speedhack: false, mg_noRecoil: true, mg_noSpread: false,
  mg_bunnyHop: false, mg_battleMode: true, mg_crosshair: true,
  mg_autoAccept: false, mg_panicKey: "End",

  cfg_active: "Cfg",
  cfg_name: "",
};

type Setter = (k: keyof S, v: S[keyof S]) => void;

// ─── Icons ────────────────────────────────────────────────────────────────────

function NavIcon({ id }: { id: NavId }) {
  if (id === "aimbot") return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="0.5" x2="9" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="14.5" x2="9" y2="17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0.5" y1="9" x2="3.5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14.5" y1="9" x2="17.5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (id === "visuals") return (
    <svg viewBox="0 0 18 13" fill="none" aria-hidden="true">
      <ellipse cx="9" cy="6.5" rx="8" ry="5.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
  if (id === "radar") return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="4" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.5 2" />
      <line x1="9" y1="1" x2="9" y2="17" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" />
      <line x1="1" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" />
      <circle cx="12.5" cy="5.5" r="1.4" fill="currentColor" />
    </svg>
  );
  if (id === "misc") return (
    <svg viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <rect x="0" y="0" width="18" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="0" y="5.75" width="18" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="0" y="11.5" width="11" height="2.5" rx="1.25" fill="currentColor" />
    </svg>
  );
  return (
    <svg viewBox="0 0 16 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4.5" y1="6" x2="11.5" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="4.5" y1="9" x2="11.5" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="4.5" y1="12" x2="8.5" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`${styles.toggle} ${on ? styles.toggleOn : ""}`}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

function RangeSlider({ value, onChange, min = 0, max = 100, step = 1 }: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className={styles.slider}
      min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ "--fill": `${pct}%` } as React.CSSProperties}
    />
  );
}

function Sel({ value, opts, onChange }: { value: string; opts: string[]; onChange: (v: string) => void }) {
  return (
    <select className={styles.sel} value={value} onChange={e => onChange(e.target.value)}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Row({ label, disabled, children }: { label: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <div className={`${styles.row} ${disabled ? styles.rowOff : ""}`}>
      <span className={styles.rowLabel}>{label}</span>
      <span>{children}</span>
    </div>
  );
}

function SRow({ label, unit = "%", value, onChange, min, max, step, disabled }: {
  label: string; unit?: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; disabled?: boolean;
}) {
  return (
    <div className={`${styles.srow} ${disabled ? styles.rowOff : ""}`}>
      <div className={styles.srowTop}>
        <span className={styles.rowLabel}>{label}</span>
        <span className={styles.srowVal}>{value}{unit}</span>
      </div>
      <RangeSlider value={value} onChange={onChange} min={min} max={max} step={step} />
    </div>
  );
}

function ColHead({ label }: { label: string }) {
  return <div className={styles.colHead}>{label}</div>;
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function PanelAimbotGeneral({ s, set }: { s: S; set: Setter }) {
  return (
    <div className={styles.grid2}>
      <div className={styles.col}>
        <Row label="Enable"><Toggle on={s.ag_enabled} onChange={() => set("ag_enabled", !s.ag_enabled)} /></Row>
        <Row label="Aim Key"><Sel value={s.ag_aimKey} opts={["MB1","MB2","MB3","MB4","Shift","Alt","Ctrl"]} onChange={v => set("ag_aimKey", v)} /></Row>
        <Row label="Aim Type"><Sel value={s.ag_aimType} opts={["Memory","Raw Input","Prediction"]} onChange={v => set("ag_aimType", v)} /></Row>
        <Row label="Smooth"><Toggle on={s.ag_smooth} onChange={() => set("ag_smooth", !s.ag_smooth)} /></Row>
        <SRow label="Smoothness" value={s.ag_smoothness} onChange={v => set("ag_smoothness", v)} min={1} max={100} disabled={!s.ag_smooth} />
        <Row label="Draw FOV"><Toggle on={s.ag_drawFov} onChange={() => set("ag_drawFov", !s.ag_drawFov)} /></Row>
        <SRow label="FOV Radius" unit="px" value={s.ag_fovRadius} onChange={v => set("ag_fovRadius", v)} min={10} max={200} disabled={!s.ag_drawFov} />
        <Row label="Prediction"><Toggle on={s.ag_prediction} onChange={() => set("ag_prediction", !s.ag_prediction)} /></Row>
        <Row label="Prediction Dot"><Toggle on={s.ag_predDot} onChange={() => set("ag_predDot", !s.ag_predDot)} /></Row>
      </div>
      <div className={styles.col}>
        <Row label="Target Lock"><Toggle on={s.ag_targetLock} onChange={() => set("ag_targetLock", !s.ag_targetLock)} /></Row>
        <Row label="Vischeck"><Toggle on={s.ag_vischeck} onChange={() => set("ag_vischeck", !s.ag_vischeck)} /></Row>
        <SRow label="Max Aim Distance" unit="m" value={s.ag_maxDist} onChange={v => set("ag_maxDist", v)} min={50} max={1000} step={10} />
        <Row label="Target Bones"><Sel value={s.ag_bones} opts={["Head","Neck","Chest","Pelvis","Closest"]} onChange={v => set("ag_bones", v)} /></Row>
      </div>
    </div>
  );
}

function PanelAimbotTriggerbot({ s, set }: { s: S; set: Setter }) {
  return (
    <div className={styles.grid2}>
      <div className={styles.col}>
        <Row label="Enable"><Toggle on={s.at_enabled} onChange={() => set("at_enabled", !s.at_enabled)} /></Row>
        <Row label="Only On Aim Key" disabled={!s.at_enabled}><Toggle on={s.at_onlyAim} onChange={() => set("at_onlyAim", !s.at_onlyAim)} /></Row>
        <Row label="Hitbox" disabled={!s.at_enabled}><Sel value={s.at_hitbox} opts={["Head","Neck","Chest","Body"]} onChange={v => set("at_hitbox", v)} /></Row>
      </div>
      <div className={styles.col}>
        <SRow label="Delay" unit="ms" value={s.at_delay} onChange={v => set("at_delay", v)} min={0} max={500} step={5} disabled={!s.at_enabled} />
        <SRow label="Reaction Delay" unit="ms" value={s.at_reactionDelay} onChange={v => set("at_reactionDelay", v)} min={0} max={200} step={5} disabled={!s.at_enabled} />
      </div>
    </div>
  );
}

function PanelAimbotRecoil({ s, set }: { s: S; set: Setter }) {
  return (
    <div className={styles.grid2}>
      <div className={styles.col}>
        <Row label="Enabled"><Toggle on={s.ar_enabled} onChange={() => set("ar_enabled", !s.ar_enabled)} /></Row>
        <Row label="Stand Still Only" disabled={!s.ar_enabled}><Toggle on={s.ar_stillOnly} onChange={() => set("ar_stillOnly", !s.ar_stillOnly)} /></Row>
        <Row label="Mode" disabled={!s.ar_enabled}><Sel value={s.ar_mode} opts={["Per-Weapon","Global","Minimal"]} onChange={v => set("ar_mode", v)} /></Row>
      </div>
      <div className={styles.col}>
        <SRow label="Strength" value={s.ar_strength} onChange={v => set("ar_strength", v)} min={0} max={100} disabled={!s.ar_enabled} />
        <SRow label="Randomization" value={s.ar_randomization} onChange={v => set("ar_randomization", v)} min={0} max={50} disabled={!s.ar_enabled} />
      </div>
    </div>
  );
}

function PanelVisualsGeneral({ s, set }: { s: S; set: Setter }) {
  return (
    <div className={styles.grid2}>
      <div className={styles.col}>
        <ColHead label="ESP" />
        <Row label="Name"><Toggle on={s.vg_name} onChange={() => set("vg_name", !s.vg_name)} /></Row>
        <Row label="Box"><Toggle on={s.vg_box} onChange={() => set("vg_box", !s.vg_box)} /></Row>
        <Row label="Skeleton"><Toggle on={s.vg_skeleton} onChange={() => set("vg_skeleton", !s.vg_skeleton)} /></Row>
        <Row label="Distance"><Toggle on={s.vg_distance} onChange={() => set("vg_distance", !s.vg_distance)} /></Row>
        <Row label="Health"><Toggle on={s.vg_health} onChange={() => set("vg_health", !s.vg_health)} /></Row>
        <Row label="Armor"><Toggle on={s.vg_armor} onChange={() => set("vg_armor", !s.vg_armor)} /></Row>
        <SRow label="Max Distance" unit="m" value={s.vg_maxDist} onChange={v => set("vg_maxDist", v)} min={50} max={1000} step={10} />
      </div>
      <div className={styles.col}>
        <ColHead label="Arrows" />
        <Row label="Arrows"><Toggle on={s.vg_arrows} onChange={() => set("vg_arrows", !s.vg_arrows)} /></Row>
        <SRow label="Arrows Range" unit="m" value={s.vg_arrowsRange} onChange={v => set("vg_arrowsRange", v)} min={10} max={200} disabled={!s.vg_arrows} />
        <ColHead label="Radar" />
        <Row label="Enable"><Toggle on={s.vg_radar} onChange={() => set("vg_radar", !s.vg_radar)} /></Row>
        <SRow label="Radar Scale" unit="x" value={s.vg_radarScale} onChange={v => set("vg_radarScale", v)} min={0.5} max={3} step={0.1} disabled={!s.vg_radar} />
        <SRow label="Max Show Distance" unit="" value={s.vg_maxShowDist} onChange={v => set("vg_maxShowDist", v)} min={50} max={1000} step={10} disabled={!s.vg_radar} />
      </div>
    </div>
  );
}

function PanelVisualsPlayers({ s, set }: { s: S; set: Setter }) {
  return (
    <div className={styles.grid2}>
      <div className={styles.col}>
        <ColHead label="Rendering" />
        <Row label="Chams"><Toggle on={s.vp_chams} onChange={() => set("vp_chams", !s.vp_chams)} /></Row>
        <Row label="Chams Type" disabled={!s.vp_chams}><Sel value={s.vp_chamsType} opts={["Flat","Glass","Wireframe","XQZ"]} onChange={v => set("vp_chamsType", v)} /></Row>
        <Row label="Outlines"><Toggle on={s.vp_outlines} onChange={() => set("vp_outlines", !s.vp_outlines)} /></Row>
      </div>
      <div className={styles.col}>
        <ColHead label="Effects" />
        <Row label="Glow"><Toggle on={s.vp_glow} onChange={() => set("vp_glow", !s.vp_glow)} /></Row>
        <Row label="Glow Color" disabled={!s.vp_glow}><Sel value={s.vp_glowColor} opts={["Blue","Red","Green","White","Custom"]} onChange={v => set("vp_glowColor", v)} /></Row>
      </div>
    </div>
  );
}

function PanelVisualsWorld({ s, set }: { s: S; set: Setter }) {
  return (
    <div className={styles.grid2}>
      <div className={styles.col}>
        <ColHead label="Items" />
        <Row label="Item ESP"><Toggle on={s.vw_itemEsp} onChange={() => set("vw_itemEsp", !s.vw_itemEsp)} /></Row>
        <Row label="Dropped Weapons"><Toggle on={s.vw_dropped} onChange={() => set("vw_dropped", !s.vw_dropped)} /></Row>
        <Row label="Loot Grade" disabled={!s.vw_itemEsp}><Sel value={s.vw_lootGrade} opts={["All","Rare+","Epic+","Legendary"]} onChange={v => set("vw_lootGrade", v)} /></Row>
      </div>
      <div className={styles.col}>
        <ColHead label="Vehicles" />
        <Row label="Vehicle ESP"><Toggle on={s.vw_vehicles} onChange={() => set("vw_vehicles", !s.vw_vehicles)} /></Row>
      </div>
    </div>
  );
}

function PanelRadarGeneral({ s, set }: { s: S; set: Setter }) {
  return (
    <div className={styles.grid2}>
      <div className={styles.col}>
        <Row label="Enable"><Toggle on={s.rg_enabled} onChange={() => set("rg_enabled", !s.rg_enabled)} /></Row>
        <Row label="Show Teammates" disabled={!s.rg_enabled}><Toggle on={s.rg_showTeam} onChange={() => set("rg_showTeam", !s.rg_showTeam)} /></Row>
        <Row label="Show Enemies" disabled={!s.rg_enabled}><Toggle on={s.rg_showEnemies} onChange={() => set("rg_showEnemies", !s.rg_showEnemies)} /></Row>
      </div>
      <div className={styles.col}>
        <SRow label="Scale" unit="x" value={s.rg_scale} onChange={v => set("rg_scale", v)} min={0.5} max={3} step={0.1} disabled={!s.rg_enabled} />
        <SRow label="Range" unit="m" value={s.rg_range} onChange={v => set("rg_range", v)} min={100} max={2000} step={50} disabled={!s.rg_enabled} />
        <SRow label="Opacity" unit="%" value={s.rg_opacity} onChange={v => set("rg_opacity", v)} min={10} max={100} disabled={!s.rg_enabled} />
      </div>
    </div>
  );
}

function PanelMiscGeneral({ s, set }: { s: S; set: Setter }) {
  return (
    <div className={styles.grid2}>
      <div className={styles.col}>
        <Row label="Speedhack"><Toggle on={s.mg_speedhack} onChange={() => set("mg_speedhack", !s.mg_speedhack)} /></Row>
        <Row label="Bunny Hop"><Toggle on={s.mg_bunnyHop} onChange={() => set("mg_bunnyHop", !s.mg_bunnyHop)} /></Row>
        <Row label="No Recoil"><Toggle on={s.mg_noRecoil} onChange={() => set("mg_noRecoil", !s.mg_noRecoil)} /></Row>
        <Row label="No Spread"><Toggle on={s.mg_noSpread} onChange={() => set("mg_noSpread", !s.mg_noSpread)} /></Row>
      </div>
      <div className={styles.col}>
        <Row label="Battle Mode"><Toggle on={s.mg_battleMode} onChange={() => set("mg_battleMode", !s.mg_battleMode)} /></Row>
        <Row label="Crosshair"><Toggle on={s.mg_crosshair} onChange={() => set("mg_crosshair", !s.mg_crosshair)} /></Row>
        <Row label="Auto Accept"><Toggle on={s.mg_autoAccept} onChange={() => set("mg_autoAccept", !s.mg_autoAccept)} /></Row>
        <Row label="Panic Key"><Sel value={s.mg_panicKey} opts={["End","Delete","F12","Home","Insert"]} onChange={v => set("mg_panicKey", v)} /></Row>
      </div>
    </div>
  );
}

function PanelConfigProfiles({ s, set }: { s: S; set: Setter }) {
  return (
    <div className={styles.cfgMain}>
      <div className={styles.cfgCrumb}>
        <span>Configs</span>
        <span className={styles.cfgCrumbSep}>/</span>
        <span className={styles.cfgCrumbActive}>Cfg</span>
      </div>

      <div className={styles.cfgSectionLabel}>Main</div>

      <input
        type="text"
        className={styles.cfgInput}
        placeholder="Config Name"
        value={s.cfg_name}
        onChange={(e) => set("cfg_name", e.target.value)}
      />

      <div className={styles.cfgBtnRow}>
        <button type="button" className={styles.cfgBtn}>Create New Config</button>
        <button type="button" className={styles.cfgBtn}>Import Config</button>
      </div>
    </div>
  );
}

function renderPanel(nav: NavId, tabIdx: number, s: S, set: Setter): React.ReactNode {
  const tab = TABS[nav][tabIdx] ?? TABS[nav][0];
  if (nav === "aimbot") {
    if (tab === "General")    return <PanelAimbotGeneral s={s} set={set} />;
    if (tab === "Triggerbot") return <PanelAimbotTriggerbot s={s} set={set} />;
    if (tab === "Recoil")     return <PanelAimbotRecoil s={s} set={set} />;
  }
  if (nav === "visuals") {
    if (tab === "General") return <PanelVisualsGeneral s={s} set={set} />;
    if (tab === "Players") return <PanelVisualsPlayers s={s} set={set} />;
    if (tab === "World")   return <PanelVisualsWorld s={s} set={set} />;
  }
  if (nav === "radar")  return <PanelRadarGeneral s={s} set={set} />;
  if (nav === "misc")   return <PanelMiscGeneral s={s} set={set} />;
  if (nav === "config") return <PanelConfigProfiles s={s} set={set} />;
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

const NAV_IDS: NavId[] = ["aimbot", "visuals", "radar", "misc", "config"];

export function CheatMenuDemo() {
  const [nav, setNav] = useState<NavId>("aimbot");
  const [tabIdxes, setTabIdxes] = useState<Record<NavId, number>>({
    aimbot: 0, visuals: 0, radar: 0, misc: 0, config: 0,
  });
  const [s, setS] = useState<S>(INIT);
  const [fps, setFps] = useState(163);

  useEffect(() => {
    const id = setInterval(() => {
      setFps(prev => {
        const delta = Math.floor(Math.random() * 11) - 5;
        return Math.min(180, Math.max(140, prev + delta));
      });
    }, 800);
    return () => clearInterval(id);
  }, []);

  const set: Setter = (k, v) => setS(prev => ({ ...prev, [k]: v } as S));

  const tabIdx = tabIdxes[nav];

  return (
    <div className={styles.wrap}>
      <header className={styles.heading}>
        <h2>See It In Action</h2>
        <p>A live interactive preview of our cheat menu. Every toggle and slider works.</p>
      </header>

      <div className={styles.window}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sbHead}>
            <div className={styles.sbName}>CheatParadise</div>
            <div className={styles.sbVer}>v2.0</div>
          </div>

          <nav className={styles.sbNav}>
            {NAV_IDS.map(id => (
              <button
                key={id}
                type="button"
                className={`${styles.sbItem} ${nav === id ? styles.sbItemActive : ""}`}
                onClick={() => setNav(id)}
              >
                <NavIcon id={id} />
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </nav>

          <div className={styles.sbFooter}>
            <svg viewBox="0 0 16 14" fill="none" aria-hidden="true">
              <rect x="0" y="8" width="3" height="6" rx="1" fill="currentColor" />
              <rect x="4.5" y="5" width="3" height="9" rx="1" fill="currentColor" />
              <rect x="9" y="2" width="3" height="12" rx="1" fill="currentColor" />
              <rect x="13.5" y="0" width="2.5" height="14" rx="1" fill="currentColor" />
            </svg>
            {fps} FPS
          </div>
        </aside>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.tabs}>
            {TABS[nav].map((tab, i) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tabBtn} ${tabIdx === i ? styles.tabBtnActive : ""}`}
                onClick={() => setTabIdxes(prev => ({ ...prev, [nav]: i }))}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={styles.panel}>
            <div key={`${nav}-${tabIdx}`} className={styles.panelInner}>
              {renderPanel(nav, tabIdx, s, set)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
