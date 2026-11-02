import React, { useState, useEffect, useMemo } from 'react';
import {
  ShipState,
  MissionPerformanceReport,
  OfficerProfileRecord,
} from '../types/simulation';
import { officerProfileStore } from '../data/starfleetMissionsData';
import { soundEffects } from '../audio/soundEffects';
import {
  Award,
  Download,
  Printer,
  Copy,
  Check,
  X,
  Sparkles,
  Atom,
  Orbit,
  Gauge,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  UserCheck,
  FileBadge,
} from 'lucide-react';

interface OfficerCommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipState: ShipState | null;
  activeOfficerCode: string | null;
  lastMissionReport: MissionPerformanceReport | null;
  missionsCompletedCount: number;
  onProfileActivated: (profile: OfficerProfileRecord) => void;
}

interface PhysicsTaskSummary {
  id: string;
  domain: string;
  formula: string;
  description: string;
  statusLabel: string;
  proficiencyPercent: number;
  verified: boolean;
  accentColor: string;
  badgeBg: string;
}

export const OfficerCommendationModal: React.FC<OfficerCommendationModalProps> = ({
  isOpen,
  onClose,
  shipState,
  activeOfficerCode,
  lastMissionReport,
  missionsCompletedCount,
  onProfileActivated,
}) => {
  const [officerName, setOfficerName] = useState<string>('STARFLEET SCIENCE OFFICER');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const activeProfile = useMemo(() => {
    if (!activeOfficerCode) return null;
    return officerProfileStore.getProfile(activeOfficerCode);
  }, [activeOfficerCode, missionsCompletedCount, shipState?.progression?.xp]);

  useEffect(() => {
    if (activeProfile?.callsign) {
      setOfficerName(activeProfile.callsign);
    } else if (activeOfficerCode) {
      setOfficerName(`OFFICER-${activeOfficerCode.slice(0, 3)}`);
    }
  }, [activeProfile?.callsign, activeOfficerCode]);

  const stardate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1).getTime();
    const fraction = (now.getTime() - startOfYear) / (365.25 * 24 * 3600 * 1000);
    return ((year - 2000) * 100 + fraction * 1000).toFixed(1);
  }, []);

  const progression = shipState?.progression || {
    xp: activeProfile?.xp || 0,
    level: activeProfile?.level || 1,
    rank: activeProfile?.rank || 'Ensign',
    nextLevelXp: 500,
    totalEnemiesDestroyed: activeProfile?.totalKills || 0,
    scoutsDestroyed: activeProfile?.scoutsDestroyed || 0,
    cruisersDestroyed: activeProfile?.cruisersDestroyed || 0,
    mothershipsDestroyed: activeProfile?.mothershipsDestroyed || 0,
    activeThreatLevel: 'Standard' as const,
  };

  const missionHistory = activeProfile?.missionHistory || [];
  const totalMissionsDone = Math.max(
    missionsCompletedCount,
    activeProfile?.missionsCompleted || 0,
    missionHistory.length,
    lastMissionReport ? 1 : 0
  );

  // Calculate composite scientific & tactical accuracy score
  const overallAccuracy = useMemo(() => {
    if (lastMissionReport) {
      return Math.round(
        lastMissionReport.accuracyScore * 0.45 +
          lastMissionReport.diplomaticOrScienceScore * 0.35 +
          lastMissionReport.tacticalEfficiencyScore * 0.2
      );
    }
    if (missionHistory.length > 0) {
      const gradeMap: Record<'S' | 'A' | 'B' | 'C', number> = { S: 97, A: 91, B: 84, C: 76 };
      const sum = missionHistory.reduce((acc, m) => acc + (gradeMap[m.grade] || 88), 0);
      return Math.round(sum / missionHistory.length);
    }
    const adaptiveAcc = shipState?.adaptiveDifficulty?.recentAccuracy;
    if (adaptiveAcc && adaptiveAcc > 0) {
      return Math.min(99, Math.max(78, Math.round(adaptiveAcc * 100)));
    }
    return Math.min(98, 86 + Math.min(12, Math.floor(progression.xp / 250)));
  }, [lastMissionReport, missionHistory, shipState?.adaptiveDifficulty?.recentAccuracy, progression.xp]);

  const commendationTier = useMemo(() => {
    if (overallAccuracy >= 94 || progression.level >= 5) {
      return {
        title: 'DAYSTROM INSTITUTE ASTROPHYSICS LAUREATE',
        grade: 'S-CLASS DISTINCTION',
        citation: 'Awarded for extraordinary mastery of relativistic astrometrics, quantum spectroscopy, and starship command.',
      };
    }
    if (overallAccuracy >= 88 || progression.level >= 3) {
      return {
        title: 'VULCAN SCIENCE ACADEMY HONORS CITATION',
        grade: 'A-CLASS HONORS',
        citation: 'Awarded for exemplary empirical precision in orbital mechanics, wave interference, and planetary defense.',
      };
    }
    return {
      title: 'STARFLEET ACADEMY SCIENCE EXHIBITION COMMENDATION',
      grade: 'HONORABLE PROFICIENCY',
      citation: 'Certified for demonstrated competency in applied starship physics, telemetry analysis, and helm navigation.',
    };
  }, [overallAccuracy, progression.level]);

  // Build the 4 core Physics Tasks breakdown (Spectroscopy, Orbital Mechanics, Warp Math, Wave & Shield Harmonics)
  const physicsTasks: PhysicsTaskSummary[] = useMemo(() => {
    const hasAnomaly =
      missionHistory.some((m) => m.archetype === 'anomaly_investigation') ||
      lastMissionReport?.archetype === 'anomaly_investigation';
    const hasFirstContact =
      missionHistory.some((m) => m.archetype === 'first_contact') ||
      lastMissionReport?.archetype === 'first_contact';
    const hasDefenseOrMag =
      missionHistory.some((m) => m.archetype === 'planetary_defense' || m.archetype === 'magnetosphere_rescue') ||
      lastMissionReport?.archetype === 'planetary_defense' ||
      lastMissionReport?.archetype === 'magnetosphere_rescue';

    const specScore = hasAnomaly
      ? Math.min(100, overallAccuracy + 3)
      : Math.min(98, Math.max(84, overallAccuracy));
    const orbitalScore =
      shipState?.currentSystemId !== 'sol_system' || totalMissionsDone > 0
        ? Math.min(100, overallAccuracy + 2)
        : Math.min(96, Math.max(85, overallAccuracy - 1));
    const warpScore =
      (shipState?.warpFactor ?? 1) > 1 || progression.xp > 0
        ? Math.min(100, overallAccuracy + 4)
        : 90;
    const waveScore =
      hasFirstContact || hasDefenseOrMag || progression.totalEnemiesDestroyed > 0
        ? Math.min(100, overallAccuracy + 2)
        : Math.min(95, Math.max(83, overallAccuracy - 2));

    return [
      {
        id: 'spectroscopy',
        domain: '01. Quantum Spectroscopy & Doppler Redshift',
        formula: 'ΔE = hc / λ   ·   z = (λ_obs − λ_rest) / λ_rest',
        description:
          'Calibrated Balmer H-Alpha (656.3 nm) & [O III] (500.7 nm) emission lines and analyzed planetary atmospheric transmission spectra.',
        statusLabel: hasAnomaly ? 'FIELD VERIFIED (ANOMALY LAB)' : 'SPECTROMETER CALIBRATED',
        proficiencyPercent: specScore,
        verified: true,
        accentColor: 'text-cyan-300',
        badgeBg: 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200',
      },
      {
        id: 'orbital_mechanics',
        domain: '02. Orbital Mechanics & Relativistic Gravity',
        formula: 'v_orb = √(GM / r)   ·   R_s = 2GM / c²',
        description:
          'Computed Keplerian orbital velocities, planetary surface gravity vectors, and safe orbital insertion perimeters across multi-body star systems.',
        statusLabel:
          shipState?.currentSystemId !== 'sol_system'
            ? `INTERSTELLAR ORBIT (${shipState?.currentSystemName || 'DEEP SPACE'})`
            : 'ORBITAL EPHEMERIS LOCKED',
        proficiencyPercent: orbitalScore,
        verified: true,
        accentColor: 'text-amber-300',
        badgeBg: 'bg-amber-500/15 border-amber-400/50 text-amber-200',
      },
      {
        id: 'warp_math',
        domain: '03. Alcubierre Warp Metric & Subspace Kinematics',
        formula: 'v_warp = w³ · c   ·   t_ETA = d / (w³ · v_base)',
        description:
          'Executed non-linear warp field velocity scaling and real-time time-to-target trajectory integration with matter/antimatter core balance (E = mc²).',
        statusLabel: `WARP FIELD RATED (MAX W${Math.max(6, Math.round((shipState?.warpFactor || 6) * 10) / 10)})`,
        proficiencyPercent: warpScore,
        verified: true,
        accentColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200',
      },
      {
        id: 'wave_harmonics',
        domain: '04. Wave Superposition & Magnetospheric Physics',
        formula: 'ψ(t) = A sin(2πft + φ)   ·   B_dipole ∝ M / r³',
        description:
          'Synchronized 1420.4 MHz neutral hydrogen carrier phase-locks, multiphasic shield nutation frequencies, and planetary magnetopause deflectors.',
        statusLabel:
          hasFirstContact || hasDefenseOrMag ? 'HARMONIC RESONANCE LOCKED' : 'DEFLECTOR MATRIX ONLINE',
        proficiencyPercent: waveScore,
        verified: true,
        accentColor: 'text-purple-300',
        badgeBg: 'bg-purple-500/15 border-purple-400/50 text-purple-200',
      },
    ];
  }, [missionHistory, lastMissionReport, overallAccuracy, shipState, totalMissionsDone, progression]);

  if (!isOpen) return null;

  // Ensure visitor has an active 6-digit ID if they click "Assign 6-Digit ID"
  const handleEnsureOfficerId = () => {
    soundEffects.playLcarsAcknowledge();
    if (activeOfficerCode && activeProfile) {
      // Update callsign if edited
      const updated = officerProfileStore.createNewProfile(
        officerName,
        progression,
        shipState?.adaptiveDifficulty?.combatRating ?? 100
      );
      onProfileActivated(updated);
      return updated.code;
    }
    const created = officerProfileStore.createNewProfile(
      officerName,
      progression,
      shipState?.adaptiveDifficulty?.combatRating ?? 100
    );
    onProfileActivated(created);
    return created.code;
  };

  const displayOfficerCode = activeOfficerCode || '170109';

  // High-Resolution HTML5 Canvas Certificate Generator (1600 x 1120 px)
  const handleDownloadCertificatePng = () => {
    setIsDownloadingPng(true);
    soundEffects.playPromotionChime();

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1120;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsDownloadingPng(false);
        return;
      }

      // 1. Deep-Space Obsidian & Radial Nebula Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1120);
      bgGrad.addColorStop(0, '#030712');
      bgGrad.addColorStop(0.5, '#071126');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1600, 1120);

      // Subtle Astrometric Polar Grid Circles
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.06)';
      ctx.lineWidth = 1.5;
      [220, 380, 540, 700].forEach((r) => {
        ctx.beginPath();
        ctx.arc(800, 560, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 2. Outer LCARS Frame & Corner Elbows
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(36, 36, 1528, 1048);

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, 1504, 1024);

      // Top Left LCARS Gold Bar
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(36, 36, 260, 46);
      ctx.fillStyle = '#030712';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('LCARS // NCC-1701', 56, 66);

      // Top Right Stardate & Registry Pill
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(1260, 36, 304, 46);
      ctx.fillStyle = '#030712';
      ctx.font = 'bold 19px monospace';
      ctx.fillText(`STARDATE ${stardate}`, 1310, 66);

      // 3. Starfleet Delta Emblem (Top Center)
      ctx.save();
      ctx.translate(800, 115);
      ctx.beginPath();
      ctx.arc(0, 5, 44, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(24, 28);
      ctx.quadraticCurveTo(0, 10, -24, 28);
      ctx.closePath();
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.restore();

      // 4. Header Typography
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(
        'UNITED FEDERATION OF PLANETS  ·  STARFLEET ACADEMY & SCIENCE EXHIBITION COMMAND',
        800,
        190
      );

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('OFFICIAL STARFLEET SCIENCE & MISSION COMMENDATION', 800, 240);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${commendationTier.title}  //  ${commendationTier.grade}`, 800, 276);

      // 5. Officer Identity Banner Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.fillRect(80, 305, 1440, 130);
      ctx.strokeRect(80, 305, 1440, 130);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('ISSUED TO STARFLEET OFFICER / CALLSIGN:', 110, 340);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px monospace';
      ctx.fillText((officerName || 'STARFLEET OFFICER').toUpperCase(), 110, 385);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px monospace';
      ctx.fillText('ASSIGNED FLAGSHIP: USS ENTERPRISE NCC-1701 (CONSTITUTION-CLASS REFIT)', 110, 416);

      // Right-side Stats inside Identity Banner
      const statBoxes = [
        { label: '6-DIGIT OFFICER ID', value: `#${displayOfficerCode}`, color: '#22d3ee', x: 790 },
        { label: 'STARFLEET RANK', value: `${progression.rank.toUpperCase()} (LV.${progression.level})`, color: '#fbbf24', x: 1020 },
        { label: 'SCIENCE ACCURACY', value: `${overallAccuracy}% (${progression.xp} XP)`, color: '#34d399', x: 1290 },
      ];
      statBoxes.forEach((b) => {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(b.label, b.x, 345);
        ctx.fillStyle = b.color;
        ctx.font = 'bold 26px monospace';
        ctx.fillText(b.value, b.x, 385);
      });

      // 6. Completed Physics & Astrophysics Tasks Section
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('COMPLETED ASTROPHYSICS & STARSHIP ENGINEERING DIRECTIVES:', 80, 475);

      physicsTasks.forEach((task, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const boxX = 80 + col * 730;
        const boxY = 495 + row * 185;
        const boxW = 710;
        const boxH = 168;

        ctx.fillStyle = 'rgba(9, 16, 32, 0.92)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Left accent bar
        const barColors = ['#22d3ee', '#fbbf24', '#34d399', '#c084fc'];
        ctx.fillStyle = barColors[idx % barColors.length];
        ctx.fillRect(boxX, boxY, 8, boxH);

        // Title & Proficiency
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 19px sans-serif';
        ctx.fillText(task.domain, boxX + 24, boxY + 34);

        ctx.textAlign = 'right';
        ctx.fillStyle = barColors[idx % barColors.length];
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`${task.proficiencyPercent}% VERIFIED`, boxX + boxW - 20, boxY + 34);

        // Formula pill
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(boxX + 24, boxY + 48, boxW - 44, 34);
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`LAW / EQUATION:  ${task.formula}`, boxX + 36, boxY + 71);

        // Description wrapped (2 lines)
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '15px sans-serif';
        const words = task.description.split(' ');
        let line1 = '';
        let line2 = '';
        words.forEach((w) => {
          if ((line1 + w).length < 78) {
            line1 += (line1 ? ' ' : '') + w;
          } else {
            line2 += (line2 ? ' ' : '') + w;
          }
        });
        ctx.fillText(line1, boxX + 24, boxY + 108);
        if (line2) ctx.fillText(line2, boxX + 24, boxY + 130);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`STATUS: ✓ ${task.statusLabel}`, boxX + 24, boxY + 154);
      });

      // 7. Footer Signatures & Telemetry Verification
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(80, 885, 1440, 155);
      ctx.strokeRect(80, 885, 1440, 155);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('EXHIBITION PERFORMANCE SUMMARY:', 110, 918);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px monospace';
      ctx.fillText(
        `Directives Completed: ${totalMissionsDone}   |   Hostiles Neutralized: ${progression.totalEnemiesDestroyed}   |   Combat Rating: ${shipState?.adaptiveDifficulty?.combatRating || 100}`,
        110,
        948
      );
      ctx.fillStyle = '#38bdf8';
      ctx.font = '15px sans-serif';
      ctx.fillText(commendationTier.citation, 110, 978);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px monospace';
      ctx.fillText(
        `TELEMETRY HASH: SF-1701-${displayOfficerCode}-${overallAccuracy}A-SD${stardate}   ·   RESTORE PROGRESS ANYTIME WITH 6-DIGIT ID #${displayOfficerCode}`,
        110,
        1015
      );

      // Signatures on Right
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'italic bold 22px serif';
      ctx.fillText('James T. Kirk', 1140, 945);
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(1040, 958);
      ctx.lineTo(1240, 958);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('CAPT. JAMES T. KIRK', 1140, 978);
      ctx.fillText('COMMANDING OFFICER, NCC-1701', 1140, 995);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'italic bold 22px serif';
      ctx.fillText('S\'chn T\'gai Spock', 1380, 945);
      ctx.beginPath();
      ctx.moveTo(1280, 958);
      ctx.lineTo(1480, 958);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('CMDR. SPOCK', 1380, 978);
      ctx.fillText('CHIEF SCIENCE OFFICER', 1380, 995);

      // Trigger PNG Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Starfleet_Science_Certificate_${displayOfficerCode}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handlePrintCertificate = () => {
    soundEffects.playLcarsAcknowledge();
    window.print();
  };

  const handleCopySummary = () => {
    const text = [
      `====================================================================`,
      `UNITED FEDERATION OF PLANETS // STARFLEET SCIENCE EXHIBITION CERTIFICATE`,
      `====================================================================`,
      `OFFICER CALLSIGN : ${officerName.toUpperCase()}`,
      `6-DIGIT ID CODE  : #${displayOfficerCode}`,
      `STARFLEET RANK   : ${progression.rank} (Level ${progression.level} · ${progression.xp.toLocaleString()} XP)`,
      `ASSIGNED VESSEL  : USS Enterprise NCC-1701`,
      `STARDATE         : ${stardate}`,
      `HONORS RATING    : ${commendationTier.title} (${overallAccuracy}% Accuracy)`,
      `--------------------------------------------------------------------`,
      `COMPLETED PHYSICS & ASTROPHYSICS TASKS:`,
      ...physicsTasks.map(
        (t) => `• ${t.domain} [${t.proficiencyPercent}%]\n  Formula: ${t.formula}\n  Status : ${t.statusLabel}`
      ),
      `====================================================================`,
    ].join('\n');

    navigator.clipboard?.writeText(text);
    setCopiedSummary(true);
    soundEffects.playLcarsBeep(980, 0.08);
    setTimeout(() => setCopiedSummary(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-2 sm:p-5 overflow-y-auto select-none print:bg-slate-950 print:p-0">
      {/* Print-specific stylesheet so clicking "Print Commendation" prints cleanly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #starfleet-commendation-printable,
          #starfleet-commendation-printable * {
            visibility: visible;
          }
          #starfleet-commendation-printable {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            max-width: 100vw;
            margin: 0;
            padding: 16px;
            box-shadow: none !important;
            background: #030712 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="starfleet-commendation-printable"
        className="w-full max-w-5xl bg-[#040916] border-2 border-amber-500/80 rounded-xl shadow-[0_0_90px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[94vh] print:max-h-none"
      >
        {/* Top LCARS Gold & Cyan Header Strip */}
        <div className="px-4 sm:px-6 py-3 bg-[#0a1224] border-b border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded-tl-lg bg-amber-500 flex items-center justify-center text-slate-950 font-trek font-black text-xs tracking-wider">
              CERT
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400">
                UNITED FEDERATION OF PLANETS // SCIENCE EXHIBITION COMMENDATION
              </div>
              <h2 className="text-sm sm:text-lg font-trek font-bold uppercase tracking-wider text-white">
                Starfleet Officer Science Certificate & Telemetry Record
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handleDownloadCertificatePng}
              disabled={isDownloadingPng}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-trek font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
              title="Download a crisp 1600x1120 PNG image of your Starfleet Science Certificate"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingPng ? 'Rendering PNG...' : downloadSuccess ? 'PNG Downloaded!' : 'Download PNG Certificate'}</span>
            </button>

            <button
              onClick={handlePrintCertificate}
              className="px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200 font-trek font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              title="Open Print / Save as PDF Dialog"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy Plain-Text Citation Summary"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copiedSummary ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Certificate"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.12),_transparent_65%)]">
          {/* Official Commendation Banner */}
          <div className="relative p-4 sm:p-5 rounded-xl bg-slate-950/90 border border-amber-500/50 shadow-inner flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left: Starfleet Delta Insignia & Honors Title */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/25 via-amber-500/10 to-cyan-500/20 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                {/* SVG Starfleet Delta Emblem */}
                <svg viewBox="0 0 64 64" className="w-10 h-10">
                  <circle cx="32" cy="34" r="24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
                  <path
                    d="M32 6 L50 54 Q32 39 14 54 Z"
                    fill="#fbbf24"
                    stroke="#fef08a"
                    strokeWidth="1.5"
                  />
                  <path d="M32 18 L36 33 L32 30 L28 33 Z" fill="#030712" />
                </svg>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-widest">
                    {commendationTier.grade}
                  </span>
                  <span className="text-xs font-mono text-cyan-300 tabular-nums">
                    STARDATE {stardate}
                  </span>
                  <span className="text-xs font-mono text-slate-500">·</span>
                  <span className="text-xs font-mono text-slate-300">
                    USS ENTERPRISE NCC-1701
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-trek font-bold text-white uppercase tracking-wider mt-1">
                  {commendationTier.title}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {commendationTier.citation}
                </p>
              </div>
            </div>

            {/* Right: Overall Scientific Accuracy Score Badge */}
            <div className="flex items-center gap-3 self-stretch lg:self-auto px-4 py-3 rounded-xl bg-slate-900/95 border border-emerald-500/50 shrink-0">
              <div className="text-right font-mono">
                <div className="text-[10px] uppercase tracking-widest text-emerald-300">
                  OVERALL ACCURACY
                </div>
                <div className="text-3xl font-black text-emerald-400 tabular-nums">
                  {overallAccuracy}%
                </div>
                <div className="text-[10px] text-slate-400">
                  Calibration & Telemetry
                </div>
              </div>
              <div className="w-11 h-11 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 font-trek font-black text-xl">
                {overallAccuracy >= 92 ? 'S' : overallAccuracy >= 85 ? 'A' : 'B'}
              </div>
            </div>
          </div>

          {/* Officer Identity, Rank, XP & Editable Name Strip */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Officer Callsign / Visitor Name (Editable for Printing) */}
            <div className="md:col-span-5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-1">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  OFFICER NAME / EXHIBITION VISITOR
                </span>
                <span className="text-slate-400 no-print">(Click to customize)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={28}
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  placeholder="ENTER YOUR NAME OR CALLSIGN"
                  className="w-full bg-slate-950 border border-cyan-500/40 focus:border-amber-400 rounded-lg px-3 py-1.5 text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-white outline-none select-text"
                />
              </div>
            </div>

            {/* 6-Digit Officer ID Card */}
            <div className="md:col-span-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                6-DIGIT OFFICER ID
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-black font-mono tracking-[0.2em] text-cyan-300 tabular-nums">
                  #{displayOfficerCode}
                </span>
                {!activeOfficerCode && (
                  <button
                    onClick={handleEnsureOfficerId}
                    className="no-print px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-[10px] uppercase cursor-pointer"
                    title="Bind this certificate to an official 6-digit Officer ID"
                  >
                    Bind ID
                  </button>
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                {activeOfficerCode ? 'Synced to Starfleet Registry' : 'Portable Exhibition Code'}
              </div>
            </div>

            {/* Rank & Cumulative XP Card */}
            <div className="md:col-span-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                COMMISSIONED RANK & XP
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-trek font-bold uppercase text-white tracking-wider">
                  {progression.rank}
                </span>
                <span className="text-sm font-mono font-bold text-amber-300 tabular-nums">
                  LVL {progression.level} · {progression.xp.toLocaleString()} XP
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
                <span>Directives Completed: {totalMissionsDone}</span>
                <span>Hostiles Neutralized: {progression.totalEnemiesDestroyed}</span>
              </div>
            </div>
          </div>

          {/* Completed Physics & Astrophysics Tasks Grid (2x2) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                <Atom className="w-4 h-4 text-cyan-400" />
                <span>Completed Physics, Astrometrics & Engineering Tasks</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Real-Time Simulator Telemetry Verification
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {physicsTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl bg-slate-900/85 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Atom className="w-4 h-4 text-cyan-400 shrink-0" />}
                        {index === 1 && <Orbit className="w-4 h-4 text-amber-400 shrink-0" />}
                        {index === 2 && <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {index === 3 && <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />}
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {task.domain}
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold shrink-0 ${task.badgeBg}`}>
                        {task.proficiencyPercent}%
                      </span>
                    </div>

                    {/* Mathematical Law / Equation Pill */}
                    <div className="mt-2 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800/90 font-mono text-[11px] text-amber-300 flex items-center justify-between">
                      <span className="text-slate-400 text-[9.5px] uppercase mr-2">Formula:</span>
                      <span className="truncate font-semibold">{task.formula}</span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] font-mono">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {task.statusLabel}
                    </span>
                    <span className="text-slate-400">CERTIFIED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logged Mission Directives History (If any missions completed) */}
          {missionHistory.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/75 border border-slate-800 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
                <FileBadge className="w-3.5 h-3.5 text-amber-400" />
                <span>Verified Starfleet Directive Log ({missionHistory.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {missionHistory.slice(0, 6).map((m) => (
                  <div
                    key={m.id + m.timestamp}
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-white font-bold truncate">{m.title}</div>
                      <div className="text-[10px] text-cyan-400">+{m.xpEarned} XP · {m.timestamp}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold text-xs shrink-0">
                      {m.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Signatures & Authentication Footer */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 font-mono text-[11px]">
              <div className="text-amber-300 font-bold uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>STARFLEET COMMAND DIGITAL AUTHENTICATION</span>
              </div>
              <div className="text-slate-400">
                HASH: <span className="text-cyan-300">SF-1701-{displayOfficerCode}-{overallAccuracy}A-SD{stardate}</span>
              </div>
              <div className="text-slate-400 text-[10px]">
                Keep your 6-digit Officer ID (<strong className="text-white">#{displayOfficerCode}</strong>) to restore your rank and XP at any exhibition terminal.
              </div>
            </div>

            <div className="flex items-center gap-6 self-end md:self-center">
              <div className="text-center">
                <div className="font-serif italic text-base text-amber-300 tracking-wide">
                  James T. Kirk
                </div>
                <div className="w-36 h-px bg-slate-700 my-1" />
                <div className="text-[9.5px] font-mono uppercase text-slate-400">
                  Capt. James T. Kirk · Commanding
                </div>
              </div>

              <div className="text-center">
                <div className="font-serif italic text-base text-cyan-300 tracking-wide">
                  S&apos;chn T&apos;gai Spock
                </div>
                <div className="w-36 h-px bg-slate-700 my-1" />
                <div className="text-[9.5px] font-mono uppercase text-slate-400">
                  Cmdr. Spock · Chief Science Officer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
