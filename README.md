# space-debries-app
🛰️ DEBRISWATCH
Space Debris Mitigation Platform
Developed by Issam Ahmad · Hackathon Build 2025

Overview
DEBRISWATCH is a real-time space debris tracking and mitigation decision-support platform. It visualizes active orbital debris, assesses collision risk, and recommends removal strategies helping operators prioritize the most dangerous objects before a Kessler cascade event occurs.
The app is built entirely in React with no external dependencies beyond standard libraries, making it easy to run anywhere.

Features
⬡ Orbital Tracker
A live animated canvas showing 25+ tracked debris objects in low and medium Earth orbit. Objects are color-coded by risk level and orbit at realistic relative speeds. Click any object to pull up a full data panel including altitude, velocity, mass, inclination, origin country, and collision probability.
☰ Debris Catalog
A filterable, scrollable table of all tracked objects. Filter by risk level (CRITICAL / HIGH / MEDIUM / LOW) and click any row to view a live sparkline of collision probability trends alongside detailed object metadata.
◈ Mitigation Strategies
Five evidence-based debris removal technologies, each with efficacy scores, deployment timelines, cost estimates, and a plain-language description of how the method works. Selecting a strategy generates a tailored deployment plan targeting the highest-priority objects in your current queue.
StrategyEfficacyEst. CostTimelineLaser Ablation92%$2.4M6–18 monthsIon Beam Shepherd88%$3.2M8–20 monthsHarpoon Capture85%$4.1M12–24 monthsDrag Augmentation78%$0.8M3–9 monthsFoam Spray61%$0.3M1–4 months
⊕ Risk Calculator
Enter any debris object's mass (kg), orbital altitude (km), and diameter (m) to instantly compute:

Collision probability (%)
Kinetic energy on impact (GJ / kt TNT equivalent)
Natural atmospheric decay time (years)
Kessler Syndrome fragmentation model output
Recommended mitigation action


Getting Started
Prerequisites

Node.js 18+
npm or yarn

Tech Stack
LayerTechnologyFrameworkReact 18 (hooks)RenderingHTML5 Canvas APIStylingInline CSS + CSS-in-JSFontsSpace Mono, Orbitron (Google Fonts)AnimationrequestAnimationFrame, CSS keyframesDataSeeded deterministic simulation
No backend required. All orbital data is generated client-side using a seeded pseudo-random model based on real debris catalogs (TLE-inspired parameters).

Orbital Model
Debris positions are computed using a simplified 2D projection of inclined circular orbits:
x = cx + cos(θ) × orbitRadius
y = cy + sin(θ) × orbitRadius × yScale(inclination)
Where θ increments each frame at a speed proportional to the object's altitude (lower orbit = faster angular velocity), consistent with Kepler's third law.
Collision probability is derived from:

Cross-sectional area (function of debris size)
Orbital altitude (flux density peaks in LEO shell ~800–1000 km)
Object mass (determines fragmentation severity)


Risk Classification
LevelCollision ProbabilityActionCRITICAL> 2.5%Immediate removalHIGH1.0% – 2.5%Schedule within 6 monthsMEDIUM0.5% – 1.0%Monitor + plan mitigationLOW< 0.5%Passive monitoring

Background
Space debris is one of the most pressing long-term threats to orbital infrastructure. As of 2025, there are an estimated 36,500+ objects larger than 10 cm tracked by space agencies, with millions of smaller fragments untracked. A single high-energy collision can generate thousands of new debris fragments — the self-sustaining chain reaction known as Kessler Syndrome — potentially rendering entire orbital shells unusable for decades.
DEBRISWATCH was built to demonstrate how a unified decision-support interface could help operators triage removal priorities and select the most cost-effective intervention strategy.

License
MIT License — free to use, modify, and distribute.
