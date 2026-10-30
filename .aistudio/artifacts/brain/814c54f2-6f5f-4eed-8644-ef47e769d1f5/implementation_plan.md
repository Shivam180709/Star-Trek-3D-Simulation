# Starfleet Science Exhibition Missions & 6-Digit Officer Profile System

A procedural, educational **Starfleet Missions** system crafted for a live Science Exhibition that blends authentic Star Trek command operations with real-world astrophysics, interactive scientific workstations, manual helm navigation, performance-graded XP progression, and an on-demand 6-digit Officer ID profile system.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions have been locked in based on your specifications and clarifications:

- **Confirmed Decision 1 — Manual Flight & HUD Waypoint Guidance**: When a mission is accepted, the 3D space viewport remains clean and unobstructed without artificial corridor rings in space. Instead, the **Flight HUD** displays a dedicated **360° Directional Compass Arrow**, angular bearing indicator, and real-time distance/proximity telemetry (`km` / `AU`) guiding the player to manually steer and warp the USS Enterprise into the mission proximity zone.
- **Confirmed Decision 2 — Full-Screen Dedicated LCARS Workstation Modal**: Entering the mission proximity zone triggers a **Full-Screen Dedicated LCARS Workstation Modal** engineered for deep scientific and tactical interaction (multi-stage wave-matching oscilloscopes, absorption line spectrometers, deflector particle-beam harmonic calibrators, and xenolinguistic decoding matrices), alongside live 3D visual effects in the space environment.
- **Confirmed Decision 3 — On-Demand 6-Digit Officer ID Profile System**: A profile ID is **never** generated automatically on startup. Clicking the dedicated **Officer ID / Profile** button opens a Starfleet Personnel Registry panel where visitors can either click **Create New Profile** (generating a unique 6-digit numeric code) or **Enter Existing 6-Digit Code** to immediately restore their XP, Starfleet Rank, Level, and Mission History across sessions.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the USS Enterprise simulation into an interactive Science Exhibition experience. Visitors scan deep space for procedural Starfleet Directives across four distinct scientific and tactical archetypes, manually pilot and warp the ship to the target planet or cosmic anomaly using HUD compass telemetry, complete multi-stage interactive scientific mini-games inside a full-screen LCARS workstation, and earn performance-graded XP (`S`, `A`, `B`, `C`) that advances their Starfleet Rank (`Ensign` through `Admiral`).
- **Target Audience / Persona**: Science exhibition visitors, students, and space enthusiasts who want a fast-paced (3–5 minute per mission), hands-on experience that teaches real astrophysical principles through authentic Starfleet instrumentation.
- **Key Value**: Bridges interactive 3D spaceflight with genuine physics education—covering Fraunhofer absorption spectroscopy, electromagnetic wave interference, magnetospheric Lorentz deflection, blackbody/pulsar radiation, and game-theory diplomacy—while allowing visitors to save and restore their progress on demand using a simple 6-digit numeric code.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Upper Panel & Procedural Mission Scanner**:
   - A prominent **MISSIONS** button in the top LCARS bar opens the **Starfleet Mission Command Overlay**.
   - Clicking **Scan Deep Space for Directives** runs an animated subspace sensor sweep and procedurally generates a fresh mission from one of the four core archetypes—dynamically selecting a star system, target planet or cosmic anomaly, alien civilization, difficulty tier (`1` to `5` stars), base XP reward, and real-world scientific briefing.
   - Visitors can inspect the scientific background, mission objectives, and target coordinates, then click **Accept Directive** or scan again for a different assignment.

2. **Manual Navigation & HUD Compass Flight Phase**:
   - Accepting a mission plots the target waypoint coordinates in the designated star system.
   - A **HUD Mission Waypoint Compass Banner** appears at the top-center of the Flight HUD featuring a dynamic rotating directional arrow, off-axis degree bearing (`Δ Heading`), pitch elevation cue, remaining distance in `km`, and proximity status (`IN TRANSIT` → `APPROACHING` → `PROXIMITY ZONE REACHED`).
   - Visitors manually align the USS Enterprise and engage Warp Drive or Impulse engines to reach the target proximity zone (`< 450 km`).

3. **Full-Screen LCARS Mission Workstation (4 Core Archetypes)**:
   - Upon entering the proximity zone, the **Engage Mission Workstation** prompt activates (and opens the Full-Screen LCARS Science & Tactical Workstation):
   - **Archetype 1 — First Contact & Xenolinguistics**:
     - *Stage 1 (EM Carrier Wave Alignment)*: Match frequency ($\text{MHz}$), amplitude, and phase shift sliders on a live dual-trace oscilloscope to lock onto the alien vessel's subspace carrier wave, teaching constructive wave interference and the electromagnetic spectrum.
     - *Stage 2 (Universal Translator Syntax Matrix)*: Decode alien phoneme glyphs and mathematical primes (inspired by the Arecibo message and information theory) to establish semantic translation.
     - *Stage 3 (High-Stakes Diplomatic Protocol)*: Navigate a 3-turn game-theory diplomatic exchange tailored to the species' cultural psychology (Vulcan logic, Klingon honor deterrence, Romulan strategic parity, Andorian directness).
   - **Archetype 2 — Astrophysical Anomaly Investigation**:
     - *Stage 1 (Multi-Band Spectrographic Analysis)*: Align optical/UV/X-ray spectrometer markers with real Fraunhofer absorption/emission lines ($\text{H}-\alpha\ 656\text{ nm}$, $\text{O III}\ 500.7\text{ nm}$, $\text{Fe XXV}$ K-shell) to determine chemical composition and redshift velocity.
     - *Stage 2 (Radiation & Particle Flux Profiling)*: Balance magnetic multipole shielding against relativistic synchrotron radiation and measure Schwarzschild/pulsar spin-down telemetry while turbulent subspace shear shakes the ship if shielding drifts.
     - *Stage 3 (Quantum Probe Deployment)*: Time the launch window of a Class-VIII scientific probe into the anomaly's stable Lagrange/orbital resonance corridor.
   - **Archetype 3 — Planetary Defense (Enemy Wave)**:
     - *Stage 1 (Tactical Threat & Shield Harmonics Workstation)*: Analyze incoming hostile disruptor/plasma weapon signatures ($\text{THz}$ modulation) and calibrate the Enterprise's multiphasic shield nutation frequency to maximize energy reflection efficiency.
     - *Stage 2 (Live Planetary Defense Engagement)*: Defend the target planet or outpost in 3D space against a spawned hostile strike group, with real-time HUD shield frequency modulation controls, phaser array locks, photon torpedo salvos, and planetary defense perimeter integrity tracking.
   - **Archetype 4 — Planetary Magnetosphere & Ecological Rescue**:
     - *Stage 1 (Geophysical Crisis Diagnostics)*: Analyze a planet suffering a Coronal Mass Ejection (CME) super-storm, core dynamo collapse, or runaway atmospheric sputtering; inspect real magnetohydrodynamic (MHD) telemetry and solar wind ram pressure ($\text{nPa}$).
     - *Stage 2 (Navigational Deflector Particle Beam Calibration)*: Configure the Main Deflector Dish particle emitter—selecting particle species (Positron, Graviton, or Baryon stream), beam focal aperture, and cyclotron resonance frequency ($\text{GHz}$).
     - *Stage 3 (High-Energy Beam Firing & Magnetosphere Restoration)*: Fire a continuous, visually dramatic 3D particle beam from the Enterprise's Navigational Deflector dish into the planet's upper ionosphere, maintaining harmonic lock against solar flare surges until the planetary magnetic dipole stabilizes.

4. **Starfleet Mission Debriefing & Performance XP Grading**:
   - Completing a mission opens the **Starfleet Mission Debriefing Modal**:
     - Displays an overall Performance Grade (`S`, `A`, `B`, or `C`) based on **Scan & Calibration Accuracy (%)**, **Tactical & Hull Efficiency (%)**, **Diplomatic / Scientific Outcome**, and **Completion Speed / Bonus Objectives**.
     - Shows an itemized XP breakdown (`Base Directive XP` + `Calibration Precision Bonus` + `Tactical Integrity Bonus` + `Speed & Secondary Objective Bonus`).
     - Animates the player's Starfleet Rank & Level progress bar, triggering a celebratory Starfleet Promotion fanfare when crossing level thresholds.
     - Presents a **"Real-World Astrophysics Takeaway"** summary card explaining the real scientific laws demonstrated during the mission.

5. **On-Demand 6-Digit Officer Profile Modal**:
   - Clicking the **Officer ID** button in the top bar or Mission Command header opens the **Starfleet Personnel Registry Modal**.
   - **Tab 1 — Create New Profile**: Generates a unique 6-digit code (e.g., `482910`) only when the user clicks **Generate 6-Digit Officer ID**, binds it to their current XP/Rank/Mission log, and displays the code prominently so the visitor can write it down or remember it.
   - **Tab 2 — Restore Existing Profile**: Provides a 6-digit numeric code entry field. Entering a saved 6-digit code restores the visitor's exact XP, Level, Starfleet Rank, completed mission count, and combat rating immediately.

---

### Visual Identity & Theme

- **Aesthetic Direction**: High-precision Starfleet LCARS meets clinical aerospace telemetry (`Science, Space & Biotech` + `Education & Simulations` domain standards).
- **60-30-10 Color Palette**:
  - **60% Dominant Canvas**: Deep space obsidian (`#07090E` / `bg-slate-950`) for full-screen workstation backdrops.
  - **30% Structural Panels & Grids**: Flat slate instrument panels (`#111827` / `bg-slate-900`), crisp `1px` hairline borders (`border-slate-800`), coordinate reticle grids, and unboxed metadata separators (`·`).
  - **10% Precision Telemetry Accents**: Calibrated Starfleet amber (`#F59E0B`), laser cyan (`#06B6D4`) for active wave locks and deflector beams, emerald (`#10B981`) for `● NOMINAL` states, and coral red (`#EF4444`) for `▲ HAZARD` warnings.
- **Typography & Precision Notation**:
  - **Display Headers**: `Orbitron` / `font-trek` for Starfleet Command headers and rank titles.
  - **Technical Prose & Educational Briefings**: Clean geometric sans-serif with comfortable `65ch` measure for scientific explanations.
  - **Telemetry & Measurements**: `JetBrains Mono` / `font-mono tabular-nums` with explicit scientific unit separation ($\text{nm}$, $\text{MHz}$, $\text{GHz}$, $\text{nT}$, $\text{keV}$, $\text{km/s}$) so fluctuating numbers never jitter.
- **Workspace Spatial Architecture**:
  - **Top Telemetry Ribbon (`44px`)**: Mission title, Stardate, elapsed mission timer, active stage indicator (`Stage 1 of 3`), and abort/minimize controls.
  - **Two-Zone Sandbox Split**: Left/Center interactive visual stage ($65\%$ width—oscilloscope canvas, emission spectrum analyzer, MHD magnetosphere diagram, or diplomatic comm viewscreen) paired with Right parameter control deck ($35\%$ width—labeled sliders with tick marks, harmonic frequency steppers, and execution triggers).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — HUD Directional Compass vs. 3D Space Rings**:
  - *Chosen Approach*: Render a precision 2D/HUD directional compass arrow, angular bearing readout, and live distance counter on the Flight HUD rather than floating 3D rings in space.
  - *Why*: Preserves the realistic, cinematic look of deep space while giving visitors unmistakable directional guidance to pilot and warp the ship manually.
- **Decision 2 — Interactive Multi-Stage Scientific Mini-Games**:
  - *Chosen Approach*: Build canvas/SVG-driven interactive instruments (real-time sine-wave interference matching, spectral line alignment, and dynamic thermal/magnetic equilibrium gauges) with real-time accuracy scoring ($0\text{--}100\%$).
  - *Why*: Ensures visitors learn how frequency, wavelength, and magnetic deflection work by actively manipulating physical parameters rather than clicking a single button.
- **Decision 3 — Hybrid 6-Digit Profile Persistence**:
  - *Chosen Approach*: Store profiles indexed by their 6-digit code in persistent browser storage AND embed a self-contained deterministic recovery signature/sync table so any code created at the exhibition restores instantaneously when entered into the Restore panel.
  - *Why*: Visitors can effortlessly resume their Starfleet career at any time without automatic popups or forced registration.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        LCARS Top Header & Flight HUD                         │
│  ┌─────────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │  [MISSIONS] Button [J]  │  │ [OFFICER ID] Button  │  │ HUD Waypoint    │  │
│  │  Opens Mission Command  │  │ Opens 6-Digit Panel  │  │ Compass & Dist  │  │
│  └────────────┬────────────┘  └──────────┬───────────┘  └────────┬────────┘  │
└───────────────┼──────────────────────────┼───────────────────────┼───────────┘
                ▼                          ▼                       ▼
┌────────────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐
│  StarfleetMissionModal     │  │ OfficerProfileModal  │  │ SimulationEngine   │
│  • Procedural Scanner      │  │ • Create 6-Digit ID  │  │ • Waypoint Vector  │
│  • 4 Archetype Generator   │  │ • Restore by 6-Digit │  │ • Proximity Check  │
│  • Science Briefing Card   │  │ • Rank & XP Sync     │  │ • 3D Deflector &   │
│  • Accept / Plot Course    │  └──────────┬───────────┘  │   Anomaly VFX      │
└───────────────┬────────────┘             │              └────────┬───────────┘
                │                          │                       │
                └──────────────────────────┼───────────────────────┘
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 Full-Screen LCARS Mission Workstation Modal                  │
│  ┌──────────────────┬──────────────────┬──────────────────┬───────────────┐  │
│  │ Type 1: First    │ Type 2: Anomaly  │ Type 3: Planetary│ Type 4:       │  │
│  │ Contact &        │ Spectroscopy &   │ Defense Shield   │ Magnetosphere │  │
│  │ Xenolinguistics  │ Flux Analyzer    │ Harmonics & Wave │ Deflector Beam│  │
│  └────────┬─────────┴────────┬─────────┴────────┬─────────┴───────┬───────┘  │
└───────────┼──────────────────┼──────────────────┼─────────────────┼──────────┘
            └──────────────────┴─────────┬────────┴─────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Starfleet Mission Debriefing Modal                      │
│  • Performance Grade (S / A / B / C) & Accuracy / Tactical / Speed Metrics   │
│  • Itemized XP Breakdown & Animated Level / Rank Promotion Bar               │
│  • Real-World Astrophysics Educational Takeaway Summary                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **`StarfleetMission`**:
  - `id`, `title`, `stardate`, `archetype` (`'first_contact' | 'anomaly_investigation' | 'planetary_defense' | 'magnetosphere_rescue'`).
  - `difficulty` (`1` to `5`), `baseXp` (`400` to `1200`), `bonusObjectiveText`.
  - `targetSystemId`, `targetSystemName`, `targetPlanetId`, `targetPlanetName`, `targetCoordinates: [number, number, number]`.
  - `scienceBriefing`: Real-world physics concept title, formula/principle, and exhibition explanation.
  - `archetypeData`:
    - *First Contact*: `speciesId`, `speciesName`, `targetFreqMhz`, `targetPhaseDeg`, `targetAmplitude`, `cipherPhrases`, `diplomaticScenario`.
    - *Anomaly*: `anomalyType` (`'Emission Nebula' | 'Supernova Remnant' | 'Millisecond Pulsar' | 'Quantum Singularity'`), `spectralElements` (wavelengths in $\text{nm}$), `radiationFluxSv`, `optimalShieldMultipole`.
    - *Planetary Defense*: `hostileFaction`, `enemyCount`, `disruptorFreqThz`, `planetIntegrityPercent`.
    - *Magnetosphere Rescue*: `crisisType` (`'Coronal Mass Ejection' | 'Core Dynamo Collapse' | 'Ionospheric Stripping'`), `particleType`, `targetResonanceGhz`, `targetApertureDeg`, `magnetosphereStabilityPercent`.
  - `status`: `'briefing' | 'en_route' | 'in_proximity' | 'workstation_active' | 'combat_active' | 'completed' | 'failed'`.

- **`MissionPerformanceReport`**:
  - `missionId`, `missionTitle`, `archetype`, `difficulty`.
  - `grade`: `'S' | 'A' | 'B' | 'C'`.
  - `accuracyScore` ($0\text{--}100\%$), `tacticalEfficiencyScore` ($0\text{--}100\%$), `diplomaticOrScienceScore` ($0\text{--}100\%$), `elapsedSeconds`, `bonusCompleted`.
  - `baseXpEarned`, `accuracyBonusXp`, `tacticalBonusXp`, `speedBonusXp`, `totalXpEarned`.
  - `previousXp`, `newXp`, `previousLevel`, `newLevel`, `previousRank`, `newRank`, `promoted: boolean`.
  - `astrophysicsTakeaway`: Curated scientific summary of what the visitor accomplished.

- **`OfficerProfileRecord` (6-Digit Profile System)**:
  - `code`: 6-digit string (e.g. `'583921'`).
  - `callsign`: Optional visitor name/callsign (e.g. `'CADET NOVA'`).
  - `xp`, `level`, `rank`, `missionsCompleted`, `missionHistory` (list of completed mission grades and titles), `totalKills`, `combatRating`, `updatedAt`.

### Interactive Component & State Mapping

- **Mission Scanner & Waypoint Plotting**:
  - Clicking **Scan Deep Space** synthesizes a randomized `StarfleetMission` anchored to real coordinates in `STAR_TREK_SOLAR_SYSTEMS`.
  - Clicking **Accept Directive** sets `activeMission` to `'en_route'`, registers the waypoint coordinates in `SimulationEngine`, and activates the HUD directional compass arrow.
- **Real-Time Compass & Proximity Trigger**:
  - Each frame in `SimulationEngine`, the vector from the Enterprise to `activeMission.targetCoordinates` is projected into the ship's local forward/right/up basis to compute `relativeBearingDeg` ($-180^{\circ}$ to $+180^{\circ}$), `elevationDeg`, and `distanceKm`.
  - When `distanceKm <= 450` and not warping, `activeMission.status` transitions to `'in_proximity'`, playing a bridge hail chime and enabling the **Open Mission Workstation** action.
- **3D Visual Effects Integration**:
  - During **Type 2 (Anomaly)** and **Type 4 (Magnetosphere Rescue)** missions, `SimulationEngine` renders a dynamic 3D cosmic anomaly field or fires a glowing cyan/gold particle stream from the Enterprise's Navigational Deflector dish directly toward the target planet's magnetosphere.
  - During **Type 3 (Planetary Defense)**, calibrated shield harmonics apply a real damage-reflection multiplier against the spawned hostile wave around the defended planet.
- **6-Digit Profile Lifecycle**:
  - Clicking **Generate 6-Digit Code** creates a unique collision-checked 6-digit key, persists the current `PlayerProgression` and mission records, and links future mission XP gains automatically to that active code during the session.
  - Entering any existing 6-digit code in the **Restore Profile** tab validates the code, updates `SimulationEngine.combatManager.adaptiveTracker` (`playerXp`, `playerLevel`, `playerRank`, kills), and refreshes all HUD and Mission Command rank badges immediately.
