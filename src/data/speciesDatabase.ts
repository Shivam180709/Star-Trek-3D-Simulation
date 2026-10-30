/**
 * Starfleet Exobiology & Interstellar Civilization Database
 * LCARS Astrometric Record Archive - Starfleet Command
 * 
 * Canonical Star Trek Alien Species Database
 * Sorted by cultural & franchise popularity: Humans, Klingons, Vulcans, Romulans, Borg, Ferengi, etc.
 */

import { StarTrekSpecies } from '../types/species';

export const STAR_TREK_SPECIES: StarTrekSpecies[] = [
  // 1. HUMANS
  {
    id: 'human',
    name: 'Humans (Terrans)',
    nativeName: 'Homo sapiens sapiens',
    popularityRank: 1,
    category: 'federation',
    affiliation: 'United Federation of Planets',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Earth (Terra)',
      systemName: 'Sol System (Sector 001)',
      systemId: 'sol_system',
      coordinates: 'Alpha Quadrant · Grid 001 · 000-000-000',
      classification: 'Class-M (Terrestrial)',
      climate: 'Temperate, diverse biomes with oceans covering 71% of surface.',
      description: 'Cradle of humanity, seat of the Federation Council, Starfleet Command, and Starfleet Academy.',
    },
    physicalCharacteristics: {
      averageHeight: '1.65 m - 1.85 m',
      lifespan: '120 - 140 standard years (24th Century medicine)',
      bloodChemistry: 'Iron-based (Hemoglobin), red coloration',
      distinctiveFeatures: [
        'Endoskeletal bipedal humanoid physiology',
        'High morphological diversity in pigment, build, and facial features',
        'Opposable thumbs with precision manipulation',
        'Binaural hearing and binocular trichromatic vision',
      ],
      physicalStrength: 'Standard humanoid baseline (1.0x federation standard)',
      sensoryTraits: 'Standard optical range (380-740 nm), auditory range 20 Hz - 20 kHz',
      uniqueBiology:
        'Exceptional physiological adaptability to diverse gravitational, climatic, and barometric environments. High psychological resilience and emotional drive.',
    },
    biology:
      'Humans are mammalian bipeds originating from Earth. Their cardiovascular system features a four-chambered heart circulating oxygenated iron-rich hemoglobin. Unlike many specialized species, human evolutionary biology prioritized broad environmental adaptability, generalist problem solving, endurance running, and social cooperation. 24th-century regenerative medicine, cybernetic implants, and genetic disease therapies have extended human life expectancies beyond 130 years while eliminating nearly all terrestrial pathogens.',
    culture:
      'Human culture transformed dramatically following the Post-Atomic Horror, First Contact with Vulcans on April 5, 2063, and the eradication of war, poverty, and currency on Earth. Governed by the pursuit of self-improvement, scientific curiosity, artistic expression, and peaceful exploration, Earth culture champions diversity as its greatest strength. Classical music, jazz, theater, holodeck storytelling, and historical preservation are revered.',
    philosophy:
      'Infinite Diversity in Infinite Combinations (adopted from Vulcan ethos), humanist ethics, cooperative self-determination, and the Prime Directive (Starfleet General Order 1) protecting developing civilizations.',
    language: 'Federation Standard (derived from English), alongside regional Terran dialects.',
    history: [
      '2063: Zefram Cochrane pilots the Phoenix, achieving humanity\'s first warp flight; Vulcans detect the warp signature and initiate First Contact.',
      '2151: Starfleet launches Enterprise NX-01 under Captain Jonathan Archer, inaugurating deep-space exploration and interstellar diplomacy.',
      '2161: Following the Earth-Romulan War, Earth co-founds the United Federation of Planets alongside Vulcan, Andoria, and Tellar.',
      '2265-2270: Historic five-year mission of the USS Enterprise NCC-1701 under Captain James T. Kirk.',
      '2360s-2370s: Under Captain Jean-Luc Picard, Captain Benjamin Sisko, and Captain Kathryn Janeway, humanity leads Starfleet through encounters with the Q Continuum, the Borg, and victory in the Dominion War.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Cruising Warp 8-9, Emergency Warp 9.975+ with M/AM reactors)',
      signatureTech: [
        'Transporter technology with quantum resolution Heisenberg compensators',
        'Replicator technology utilizing matter-energy conversion',
        'Phaser directed energy systems (continuous particle beam / nadion emission)',
        'Photon and Quantum Torpedo ordnance',
        'Multiphasic deflector shield grids',
      ],
      weaponry: 'Type-II/III phasers, Type-X ship phaser arrays, Photon/Quantum torpedoes',
      defense: 'Multi-layered regenerative deflector shields, high-density tritanium hull armor',
      propulsion: 'Deuterium/Antideuterium warp drive with dilithium crystal matrix focusing',
      techLevelSummary: 'Advanced Level 4 interstellar civilization; core technological contributor to Starfleet and the Federation.',
    },
    government: {
      name: 'United Earth / Member of the United Federation of Planets',
      structure: 'Representative democratic planetary commonwealth',
      rulingBody: 'United Earth Government & Starfleet Command',
      seatOfPower: 'San Francisco, North America (Starfleet HQ) & Paris, Europe (Federation President’s Office)',
    },
    notableIndividuals: [
      {
        name: 'James T. Kirk',
        title: 'Captain / Admiral of USS Enterprise NCC-1701',
        era: '23rd Century (TOS / Movies)',
        summary: 'Legendary explorer, master tactician, and recipient of the Palm Leaf of the Axanar Peace Mission.',
      },
      {
        name: 'Jean-Luc Picard',
        title: 'Captain of USS Enterprise NCC-1701-D/E, Admiral',
        era: '24th Century (TNG / Movies / Picard)',
        summary: 'Philosopher-diplomat, archaeologist, and premier arbiter of Federation ethics.',
      },
      {
        name: 'Benjamin Sisko',
        title: 'Captain of Deep Space 9 / USS Defiant, Emissary of the Prophets',
        era: '24th Century (DS9)',
        summary: 'Strategic commander who led Allied forces to victory in the Dominion War.',
      },
      {
        name: 'Kathryn Janeway',
        title: 'Captain of USS Voyager, Vice Admiral',
        era: '24th Century (VOY)',
        summary: 'Navigated the Delta Quadrant across 70,000 light years, dealing devastating blows to the Borg Collective.',
      },
    ],
    relationshipWithFederation: {
      status: 'Founding Member',
      treaties: ['Articles of Federation (2161)', 'Khitomer Accords (2293)', 'Treaty of Algeron (2311)'],
      summary: 'Founding species and driving administrative and exploratory vanguard of the United Federation of Planets.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/7/72/William_Shatner_Star_Trek.JPG',
      fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/William_Shatner_1975.jpg/500px-William_Shatner_1975.jpg',
      bannerOrScene: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'Captain James T. Kirk commanding on the Bridge of the USS Enterprise NCC-1701.',
    },
    voiceBriefing: {
      quote: 'Space: the final frontier. These are the voyages of the starship Enterprise...',
      speaker: 'Captain James T. Kirk',
      audioText: 'Species dossier: Humans. Originating from Sector 001, Sol System. Founding members of the United Federation of Planets.',
    },
    tags: ['Federation', 'Sol', 'Earth', 'Exploration', 'Starfleet'],
  },

  // 2. KLINGONS
  {
    id: 'klingon',
    name: 'Klingons',
    nativeName: 'tlhIngan',
    popularityRank: 2,
    category: 'rival_hostile',
    affiliation: 'Klingon Empire',
    quadrant: 'Beta Quadrant',
    homeworld: {
      name: 'Qo\'noS (Kronos)',
      systemName: 'Kronos System',
      systemId: 'kronos_system',
      coordinates: 'Beta Quadrant · Kronos Sector · Grid 443',
      classification: 'Class-M (Heavily volcanic, cavernous, dense crust)',
      climate: 'Harsh, tectonic instability, warm humid swamps and jagged obsidian ranges.',
      description: 'Capital of the Klingon Empire, home to the Great Hall of the High Council and the First City.',
    },
    physicalCharacteristics: {
      averageHeight: '1.80 m - 2.10 m',
      lifespan: '150 - 170 standard years',
      bloodChemistry: 'Iron-based, distinctive lilac/violet hue with high platelet density',
      distinctiveFeatures: [
        'Prominent cranial sagittal bone ridges (symbol of family bloodline)',
        'Redundant internal organ architecture (Brak\'lul) with 8-chambered heart and 3 lungs',
        'Exoskeletal spinal bracing and dense musculoskeletal density',
        'Large, pointed canines and deep baritone vocal resonators',
      ],
      physicalStrength: 'Superior (approximately 2.5x to 3x human baseline)',
      sensoryTraits: 'Acute low-frequency acoustic perception and low-light predator vision',
      uniqueBiology:
        'The Brak\'lul redundancy enables survival against normally fatal punctures, organ destruction, and battlefield trauma. Extraordinary pain tolerance and rapid biological clotting.',
    },
    biology:
      'Klingon physiology is evolved for ferocious physical combat and survival in brutal volcanic conditions. Their internal systems feature duplicate backup organs—two livers, three lungs, an eight-chambered heart, and twenty-three ribs. Their lilac-colored blood carries an exceptionally high oxygen-carrying capacity. Genetic tampering during the 22nd century Augment crisis temporarily caused facial ridge loss among some populations, which was later resolved by biological restoration.',
    culture:
      'Klingon society is deeply martial and organized into Great Houses (tuq). Personal worth is measured by martial valor, family honor, integrity in combat, and dying an honorable death to enter Sto-vo-kor (the afterlife of heroes) alongside Kahless the Unforgettable. Cowards and traitors are cursed to Gre\'thor. Hand-to-hand combat using the bat\'leth (sword of honor) and d\'k tahg dagger is a sacred rite.',
    philosophy:
      'Honor (quv) is the measure of the soul. Victory without honor is defeat. Death in service to the Empire is glorious.',
    language: 'tlhIngan Hol (Klingon language), characterized by guttural consonants and poetic warrior epics.',
    history: [
      'c. 9th Century: Kahless the Unforgettable slays the tyrant Molor and unites the Klingon people with the original bat\'leth forged from his hair in the Kri\'stak volcano.',
      '2151: First Contact with humanity on Broken Bow, Oklahoma.',
      '2267: Organian Peace Treaty halts full-scale war with the Federation.',
      '2293: Praxis, the moon of Qo\'noS, explodes due to over-mining; Chancellor Gorkon negotiates the historic Khitomer Accords with the Federation.',
      '2372-2375: Chancellor Gowron and General Martok lead the Empire alongside the Federation and Romulans to defeat the Dominion.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Warp 8 to 9.2 combat sprint)',
      signatureTech: [
        'Cloaking device technology utilizing selective graviton distortion',
        'Disruptor cannons and spiral-wave nadion particle beam armaments',
        'Bird-of-Prey and Negh\'Var heavy warship architectural design',
        'Subspace shockwave ordnance and photon torpedo arrays',
      ],
      weaponry: 'Heavy disruptor banks, forward photon torpedo tubes, point-defense pulse disruptors',
      defense: 'Polarized battle shields, high-density duranium hull armor',
      propulsion: 'Standard matter/antimatter warp drive with high emergency reserve capacitors',
      techLevelSummary: 'Formidable Tier 4 martial space power capable of matching Federation Starfleet in ship-to-ship firepower.',
    },
    government: {
      name: 'Klingon Empire (tlhIngan Wo\')',
      structure: 'Feudal military empire overseen by noble Great Houses',
      rulingBody: 'Klingon High Council (led by Chancellor, overseen by the Emperor / Spiritual Head)',
      seatOfPower: 'The Great Hall, First City, Qo\'noS',
    },
    notableIndividuals: [
      {
        name: 'Worf, Son of Mogh',
        title: 'Lieutenant Commander / Starfleet Strategic Operations Officer',
        era: '24th Century (TNG / DS9 / Picard)',
        summary: 'First Klingon officer in Starfleet, Slayer of Gowron, hero of the Dominion War, and Federation Ambassador.',
      },
      {
        name: 'Chancellor Gowron',
        title: 'Leader of the Klingon High Council',
        era: '24th Century (TNG / DS9)',
        summary: 'Politically cunning warrior who united the Empire through the Klingon Civil War.',
      },
      {
        name: 'General Martok',
        title: 'Supreme Commander of the Ninth Fleet / Later Chancellor',
        era: '24th Century (DS9)',
        summary: 'Honorable common-born warrior who escaped Dominion internment and led Klingon forces to victory.',
      },
      {
        name: 'Kahless the Unforgettable',
        title: 'Founder of the Klingon Empire',
        era: 'Ancient Klingon History (9th Century)',
        summary: 'Legendary cultural icon who set down the code of honor and forged the first Bat\'leth.',
      },
    ],
    relationshipWithFederation: {
      status: 'Allied Power',
      treaties: ['Khitomer Accords (2293)', 'Treaty of Alliance (2372)'],
      summary: 'Formerly bitter Cold War adversaries; transformed into stalwart allies following the Khitomer Accords and the Dominion War.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Klingon_%281305760507%29.jpg',
      fallback: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Klingon_trekkie_armed.jpg',
      bannerOrScene: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Klingon_Warrior_Costume_-_Star_Trek_-_The_Next_Generation_-_Star_Trek-_Exploring_New_Worlds_Exhibit_at_the_Henry_Ford_Museum%2C_Dearborn%2C_Michigan.jpg',
      caption: 'Klingon warrior displaying distinctive sagittal cranial bone crests, dark beard, and battle armor.',
    },
    voiceBriefing: {
      quote: 'Today is a good day to die! Qapla\'!',
      speaker: 'Commander Worf',
      audioText: 'Species dossier: Klingons. Homeworld: Qo\'noS, Kronos System. Renowned martial culture, current signatories to the Khitomer Accords.',
    },
    tags: ['Empire', 'Qo\'noS', 'Kronos', 'Warrior', 'Bat\'leth', 'Honor'],
  },

  // 3. VULCANS
  {
    id: 'vulcan',
    name: 'Vulcans',
    nativeName: 'Vulkanu',
    popularityRank: 3,
    category: 'federation',
    affiliation: 'United Federation of Planets',
    quadrant: 'Beta Quadrant',
    homeworld: {
      name: 'Vulcan (T\'Khasi / 40 Eridani A II)',
      systemName: 'Vulcan System',
      systemId: 'vulcan_system',
      coordinates: 'Beta Quadrant · 16.5 Light Years from Sol · 40 Eridani A',
      classification: 'Class-M (Hot desert planet, sparse water, thin atmosphere, high gravity)',
      climate: 'Extremely arid, desert plateaus, fire plains, and red sandstone canyons.',
      description: 'Ancient, logical world harboring the Vulcan Science Academy, Mount Seleya, and the High Command.',
    },
    physicalCharacteristics: {
      averageHeight: '1.75 m - 1.95 m',
      lifespan: '200 - 250 standard years',
      bloodChemistry: 'Copper-based (Hemocyanin), distinctive green blood and tissues',
      distinctiveFeatures: [
        'Pointed, arched auricular ears and upward-swept eyebrows',
        'Secondary inner eyelid (nictitating membrane) shielding against intense desert glare',
        'Heart positioned in lower right thoracic cavity',
        'Extremely low body hydration requirement; high perspiration efficiency',
      ],
      physicalStrength: 'Exceptional (approximately 3x human baseline due to Vulcan\'s high gravity)',
      sensoryTraits: 'Highly sensitive auditory acuity and keen low-light perception',
      uniqueBiology:
        'Possess telepathic psionic potential via the Katric mind meld; undergo the Pon Farr (mating drive cycle every 7 years); capable of storing consciousness (Katra).',
    },
    biology:
      'Originating on a harsh desert planet with higher gravity and a thinner atmosphere than Earth, Vulcans evolved copper-based green blood with hemocyanin, making them extraordinarily resilient to oxygen deprivation. Their heart beats at nearly 300 pulses per minute. Their brain architecture contains a specialized telepathic neural center located in the dorsal lobe, enabling the sacred psionic practice of the Mind Meld. Vulcans suppress volcanic primal emotions through rigorous mental disciplines codified by Surak.',
    culture:
      'Ancient Vulcans were a savagely violent and emotionally volatile species that nearly eradicated themselves in atomic wars. The philosopher Surak introduced the Way of Logic (Cthia), teaching that emotion must be purged in favor of pure logic, pacifying the civilization. Monastic rituals such as the Kolinahr purge any lingering emotional impulses. The concept of IDIC (Infinite Diversity in Infinite Combinations) celebrates cosmic variety.',
    philosophy:
      'Logic is the beginning of wisdom, not the end. The needs of the many outweigh the needs of the few, or the one. Infinite Diversity in Infinite Combinations.',
    language: 'Vulcan language (Vulkanu / Traditional Golic Vulcan scripts).',
    history: [
      'c. 4th Century: The Time of Awakening; Surak teaches peace and logic during the catastrophic Vulcan nuclear wars; "Those Who March Beneath the Raptor\'s Wings" reject logic and depart into space (becoming the Romulans).',
      '2063: Survey ship T\'Plana-Hath detects Zefram Cochrane\'s warp flight and lands in Bozeman, Montana, initiating First Contact with humanity.',
      '2150s: Vulcan High Command guides Earth Starfleet, gradually overcoming isolationist hesitation under Ambassador Soval.',
      '2161: Vulcan co-founds the United Federation of Planets alongside Earth, Andoria, and Tellar.',
      '2260s-24th Century: Vulcans serve as premier scientists, logicians, and Starfleet officers.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'Ultra-Advanced Warp & Subspace Dynamics (pioneered early warp rings & curved nacelles)',
      signatureTech: [
        'Annular warp drive and high-efficiency photonic computing cores',
        'Subspace sensor arrays with supreme resolution',
        'Advanced telepathic transceiver probes and neural monitoring grids',
        'Deflector shielding and plasma cannonry',
      ],
      weaponry: 'Phased plasma cannons, heavy particle beam arrays, tractor-repulsor grids',
      defense: 'High-density multi-harmonic shielding, reinforced polaric deflector matrices',
      propulsion: 'High-efficiency antimatter warp engines and crystalline fusion generators',
      techLevelSummary: 'Premier scientific powerhouse of the Alpha and Beta Quadrants; pioneers of modern exobiology.',
    },
    government: {
      name: 'Vulcan High Council / Federation Member State',
      structure: 'Meritocratic council of elders and scientific ministers governed by logic',
      rulingBody: 'Vulcan High Command and Vulcan Science Academy',
      seatOfPower: 'ShirKahr / Mount Seleya, Vulcan',
    },
    notableIndividuals: [
      {
        name: 'Spock',
        title: 'Science Officer & First Officer / Starfleet Ambassador',
        era: '23rd - 24th Century (TOS / TNG / Movies)',
        summary: 'Half-human, half-Vulcan legend who bridged interstellar civilizations and championed Vulcan-Romulan reunification.',
      },
      {
        name: 'Surak',
        title: 'Father of Vulcan Logic and Philosophy',
        era: 'Ancient Vulcan (4th Century)',
        summary: 'The greatest visionary in Vulcan history; ushered in the Time of Awakening.',
      },
      {
        name: 'Sarek of Vulcan',
        title: 'Federation Ambassador to the Klingon Empire and Alpha Quadrant',
        era: '23rd - 24th Century (TOS / TNG)',
        summary: 'Esteemed diplomat, father of Spock, architect of crucial Federation treaties.',
      },
      {
        name: 'T\'Pol',
        title: 'Sub-Commander / First Officer of Enterprise NX-01',
        era: '22nd Century (Enterprise)',
        summary: 'Pioneering Vulcan liaison who fostered mutual respect between Earth and Vulcan.',
      },
    ],
    relationshipWithFederation: {
      status: 'Founding Member',
      treaties: ['Articles of Federation (2161)', 'Treaty of Coridan (2151)'],
      summary: 'Founding member, intellectual bedrock, and moral conscience of the United Federation of Planets.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Leonard_Nimoy_as_Spock_1967.jpg',
      fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Spock_and_T%27Pring.jpg/500px-Spock_and_T%27Pring.jpg',
      bannerOrScene: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Spock_and_parents_1968.jpg/960px-Spock_and_parents_1968.jpg',
      caption: 'First Officer Spock displaying canonical Vulcan pointed ears, arched eyebrows, and science uniform.',
    },
    voiceBriefing: {
      quote: 'Live long and prosper. Logic is the foundation of functioning civilization.',
      speaker: 'Ambassador Spock',
      audioText: 'Species dossier: Vulcans. Originating from 40 Eridani A. Founding members of the Federation, governed by the philosophy of Surak.',
    },
    tags: ['Federation', 'Vulcan', 'Logic', 'Spock', 'IDIC', 'MindMeld'],
  },

  // 4. ROMULANS
  {
    id: 'romulan',
    name: 'Romulans',
    nativeName: 'Rihannsu',
    popularityRank: 4,
    category: 'rival_hostile',
    affiliation: 'Romulan Star Empire',
    quadrant: 'Beta Quadrant',
    homeworld: {
      name: 'Romulus (ch\'Rihan) & Remus (ch\'Havran)',
      systemName: 'Romulus System',
      systemId: 'romulus_system',
      coordinates: 'Beta Quadrant · Romulan Sector · Grid 215',
      classification: 'Class-M (Twin planet system; Romulus lush water world, Remus harsh mineral world)',
      climate: 'Romulus is temperate with rich oceans and verdant valleys; Remus is tidally locked and arid.',
      description: 'Imperial capital of the Romulan Star Empire, seat of the Romulan Senate and the Praetor.',
    },
    physicalCharacteristics: {
      averageHeight: '1.75 m - 1.95 m',
      lifespan: '200 - 240 standard years',
      bloodChemistry: 'Copper-based (Hemocyanin), emerald green blood',
      distinctiveFeatures: [
        'Pointed ears and high cheekbones sharing Vulcan genetic ancestry',
        'Pronounced V-shaped cranial frontal bone ridges (more prominent than Vulcans)',
        'Dark, straight hair usually styled in angular geometric cuts',
        'Lower right thoracic heart positioning and high physiological endurance',
      ],
      physicalStrength: 'Superior (approximately 2.5x to 3x human baseline)',
      sensoryTraits: 'Acute hearing and vision comparable to Vulcans',
      uniqueBiology:
        'Share common ancestry with Vulcans, having split off c. 4th Century AD. Do not suppress emotion through logic, retaining passionate emotional intensity, pride, and fierce territorial loyalty.',
    },
    biology:
      'Romulans are biologically nearly identical to Vulcans, possessing copper-based hemocyanin green blood, superior physical strength, and exceptional lifespans exceeding two centuries. However, unlike Vulcans, Romulans rejected Surak\'s philosophy of emotional suppression and logic, choosing instead to embrace passion, national pride, and imperial hierarchy. They rarely display active telepathy due to cultural taboo and lack of mental training.',
    culture:
      'Romulan society is defined by state secrecy, honor through victory, espionage, and devotion to the Empire. Citizens operate under constant surveillance by the Tal Shiar (the dread secret police). Romulans consider non-Romulans untrustworthy barbarians. Imperial architecture emphasizes titanic green stone monoliths, soaring eagle raptors, and strict military order.',
    philosophy:
      'The preservation, expansion, and supremacy of the Romulan Star Empire above all else. Absolute loyalty, strategic deception, and self-sacrifice for the State.',
    language: 'Rihannsu / Romulan language.',
    history: [
      'c. 4th Century: "Those Who March Beneath the Raptor\'s Wings" depart Vulcan during the Time of Awakening, enduring an exodus across space to colonize Romulus and Remus.',
      '2156-2160: Earth-Romulan War fought with nuclear weaponry and primitive sublight vessels without visual contact; ends with the establishment of the Romulan Neutral Zone.',
      '2266: A Romulan Bird-of-Prey armed with a plasma weapon and cloaking device breaches the Neutral Zone, confronting Captain Kirk\'s Enterprise.',
      '2311: The Tomed Incident leads to the Treaty of Algeron, banning Federation cloaking device research.',
      '2374: Romulan Empire joins the Federation and Klingons against the Dominion following Senator Vreenak\'s death.',
      '2387: The Hobus supernova destroys Romulus, shattering the Empire into regional factions.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp powered by Artificial Quantum Singularities (Micro-Black Holes)',
      signatureTech: [
        'Advanced cloaking devices granting total sensor invisibility',
        'Artificial quantum singularity warp cores (cannot be turned off once activated)',
        'D\'deridex Class Warbird and Valdore Class battlecruisers',
        'Plasma torpedoes and heavy disruptor beam banks',
        'Thalaron radiation biogenic weaponry',
      ],
      weaponry: 'Plasma torpedoes, heavy disruptors, focused thalaron emitters',
      defense: 'Graviton shield grids, multi-layer stealth hull coatings',
      propulsion: 'Quantum singularity warp drive; avoids reliance on antimatter fuel',
      techLevelSummary: 'Premier military superpower of the Beta Quadrant possessing apex stealth and warship technology.',
    },
    government: {
      name: 'Romulan Star Empire',
      structure: 'Oligarchic imperial republic dominated by the Senate, Praetor, and Tal Shiar',
      rulingBody: 'Romulan Senate, Office of the Praetor, and the Tal Shiar',
      seatOfPower: 'Imperial Senate Chamber, Ki Baratan, Romulus',
    },
    notableIndividuals: [
      {
        name: 'Commander Tomalak',
        title: 'Fleet Commander, Romulan Star Empire',
        era: '24th Century (TNG)',
        summary: 'Cunning military strategist who commanded D\'deridex Warbirds in multiple tense standoffs with Captain Picard.',
      },
      {
        name: 'Commander Sela',
        title: 'Tal Shiar Operative & Military Leader',
        era: '24th Century (TNG)',
        summary: 'Daughter of alternate-timeline Tasha Yar; orchestrator of the Romulan interference in the Klingon Civil War.',
      },
      {
        name: 'Praetor Shinzon',
        title: 'Reman Praetor & Ruler of the Empire',
        era: '24th Century (Nemesis)',
        summary: 'Human clone of Jean-Luc Picard who seized the Senate with Reman shock troops and the Scimitar.',
      },
      {
        name: 'Senator Vreenak',
        title: 'Secretary of the Romulan High Council',
        era: '24th Century (DS9)',
        summary: 'Statesman whose assassination brought the Romulan Star Empire into the Dominion War on the Allied side.',
      },
    ],
    relationshipWithFederation: {
      status: 'Cold War / Tense Truce',
      treaties: ['Treaty of 2160 (Established Neutral Zone)', 'Treaty of Algeron (2311)'],
      summary: 'Perennial geopolitical adversaries separated by the Neutral Zone; occasional uneasy allies during existential crises.',
    },
    images: {
      primary: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Star_Trek_costume_-_Romulan.jpg/960px-Star_Trek_costume_-_Romulan.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
      caption: 'Romulan military officer uniform and ceremonial armor.',
    },
    voiceBriefing: {
      quote: 'We are a patient people, Captain. The Empire will endure long after your Federation has fallen.',
      speaker: 'Commander Tomalak',
      audioText: 'Species dossier: Romulans. Originating from Romulus and Remus. Beta Quadrant superpower, operating artificial singularity warp drives and cloaking technology.',
    },
    tags: ['Romulan', 'Empire', 'Romulus', 'Cloak', 'TalShiar', 'Warbird'],
  },

  // 5. THE BORG
  {
    id: 'borg',
    name: 'The Borg Collective',
    nativeName: 'The Collective',
    popularityRank: 5,
    category: 'delta_borg',
    affiliation: 'Borg Collective',
    quadrant: 'Delta Quadrant',
    homeworld: {
      name: 'The Borg Unicomplex (Sector 001, Delta Quadrant)',
      systemName: 'Borg Unicomplex System',
      systemId: 'borg_unicomplex_system',
      coordinates: 'Delta Quadrant · Grid 092 · Thousands of Star Systems assimilated',
      classification: 'Gigantic synthetic mega-structure / Assimilated Worlds',
      climate: 'Sterile, metallic, hyper-efficient ambient temp 39.1°C, 92% humidity, high ozone levels.',
      description: 'Heart of the Borg Collective spanning trillions of drones interconnected into a singular consciousness.',
    },
    physicalCharacteristics: {
      averageHeight: 'Varies based on assimilated species (Humanoid baseline ~1.8 m)',
      lifespan: 'Indefinite through cellular regeneration and mechanical replacement',
      bloodChemistry: 'Infused with microscopic nanoprobes capable of molecular reprogramming',
      distinctiveFeatures: [
        'Heavy biomechanical cybernetic implants replacing limbs, sensory organs, and skull',
        'Pale, ashen epidermal pallor caused by cellular nanotech restructuring',
        'Ocular sensor eyepieces emitting laser targeting frequencies',
        'Neural transceivers wired directly into cerebral cortex linking drone to the Hive Mind',
      ],
      physicalStrength: 'Immense (3x to 5x humanoid strength boosted by powered exoskeletons)',
      sensoryTraits: 'Multispectral sensor implants analyzing subatomic energy, subspace, and temporal flux',
      uniqueBiology:
        'Assimilation via nanoprobes injected through vascular tubules; instantaneous rewriting of DNA, neurological synapses, and metabolic pathways into the Collective.',
    },
    biology:
      'The Borg are not a single biological species, but rather a terrifying fusion of organic bodies and cybernetics drawn from thousands of assimilated civilizations. Drones possess synthetic circulatory regulators, dermal armor, and neural transceivers. Nanoprobes circulate in their bloodstream, capable of repairing injuries, reprogramming foreign biological tissue, and reconstructing technology at the molecular level. Drones do not sleep or eat, regenerating in specialized regeneration alcoves.',
    culture:
      'The Borg possess no individual identity, art, literature, or personal desires. All thoughts and experiences are pooled into a single hive mind overseen by the Borg Queen. Their sole directive is the relentless pursuit of perfection through the assimilation of biological and technological distinctiveness from all discovered civilizations.',
    philosophy:
      '"Resistance is futile. Your biological and technological distinctiveness will be added to our own."',
    language: 'Subspace mathematical code, binary telemetry, and universal translated broadcast.',
    history: [
      'c. Ancient Times: The Collective begins in the Delta Quadrant as a small cybernetic civilization before initiating interstellar assimilation.',
      '2365: Q introduces the USS Enterprise-D to a Borg Cube in Sector J-25, 7,000 light-years away.',
      '2366-2367: Battle of Wolf 359; a single Borg Cube led by Locutus of Borg (the assimilated Captain Picard) annihilates 39 Starfleet vessels.',
      '2373: First Contact incident; Borg Queen travels back in time to 2063 Earth to stop First Contact; defeated by Picard and Enterprise-E.',
      '2371-2378: USS Voyager under Captain Janeway survives repeated engagements in the Delta Quadrant, destroying the Borg Transwarp Hub.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'Transwarp Drive (speeds exceeding Warp 9.9999 via Transwarp Conduits)',
      signatureTech: [
        'Transwarp Conduit corridors linking all four quadrants of the galaxy',
        'Adaptive personal and ship shielding (adapts after 2-3 directed energy discharges)',
        'Nanoprobe assimilation tubules',
        'Borg Cubes (3 km on each side) and Tactical Spheres featuring self-repairing hulls',
        'Tractor cutting beams slicing through starship hulls',
      ],
      weaponry: 'High-energy cutting beams, torpedoes with gravimetric payloads, magnetometric pulse bursts',
      defense: 'Automated frequency-adaptive shielding, decentralized hull architecture without critical bridge/engine spots',
      propulsion: 'Transwarp coil drive with transwarp hub network',
      techLevelSummary: 'Supreme galactic technological threat; incorporates scientific knowledge of over 10,000 assimilated worlds.',
    },
    government: {
      name: 'The Borg Collective',
      structure: 'Decentralized cybernetic hive mind guided by the Borg Queen',
      rulingBody: 'The Borg Queen / Hive Consciousness',
      seatOfPower: 'Borg Unicomplex, Delta Quadrant',
    },
    notableIndividuals: [
      {
        name: 'The Borg Queen',
        title: 'Incarnation of the Collective\'s Will',
        era: '24th Century (First Contact / VOY / Picard)',
        summary: 'I am the beginning, the end, the one who is many. She orchestrates the consciousness of the entire hive.',
      },
      {
        name: 'Seven of Nine (Annika Hansen)',
        title: 'Tertiary Adjunct of Unimatrix 01 / Later Starfleet Captain',
        era: '24th Century (VOY / Picard)',
        summary: 'Assimilated as a child; liberated by Voyager; regained her humanity to become a legendary Starfleet officer.',
      },
      {
        name: 'Locutus of Borg',
        title: 'Borg Voice and Liaison to Humanity (Captain Picard)',
        era: '24th Century (TNG)',
        summary: 'Designation given to Jean-Luc Picard when assimilated for the devastating assault on Sector 001.',
      },
      {
        name: 'Hugh (Third of Five)',
        title: 'Liberated Borg Drone / Ex-Borg Leader',
        era: '24th Century (TNG / Picard)',
        summary: 'First drone to re-learn individuality after being cared for by Geordi La Forge and the Enterprise crew.',
      },
    ],
    relationshipWithFederation: {
      status: 'Existential Threat',
      treaties: ['Temporary tactical alliance against Species 8472 (2374)'],
      summary: 'The ultimate existential threat to the Federation; seeks the total subjugation and assimilation of all humanity and allied worlds.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Trekkie_-_Borg_-_Star_Trek_Convention_%289504912575%29.jpg',
      fallback: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/The_Borg_Collective_-_Star_Trek-_First_Contact_movie_1996_-_Star_Trek_-_Exploring_New_Worlds_exhibit_at_the_Henry_Ford_Museum%2C_Dearborn%2C_Michigan.jpg',
      caption: 'Cybernetic Borg drone with cranial ocular sensor array and reinforced exoskeleton.',
    },
    voiceBriefing: {
      quote: 'We are the Borg. Lower your shields and surrender your ships. Resistance is futile.',
      speaker: 'The Borg Collective',
      audioText: 'Warning. Species dossier: The Borg. Cybernetic hive civilization from the Delta Quadrant. Adaptive shielding online.',
    },
    tags: ['Borg', 'Collective', 'Assimilation', 'Cube', 'Transwarp', 'SevenOfNine'],
  },

  // 6. FERENGI
  {
    id: 'ferengi',
    name: 'Ferengi',
    nativeName: 'Ferengi',
    popularityRank: 6,
    category: 'alpha_beta_powers',
    affiliation: 'Ferengi Alliance',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Ferenginar',
      systemName: 'Ferenginar System',
      systemId: 'ferenginar_system',
      coordinates: 'Alpha Quadrant · Sector 424 · Grid 109',
      classification: 'Class-M (Super-humid, torrential perpetual rainfall world)',
      climate: 'Heavy unrelenting tropical rain, warm marshland, decaying organic soil, mossy plains.',
      description: 'Capital of the Ferengi Alliance, site of the 40-story Tower of Commerce and the Sacred Marketplace.',
    },
    physicalCharacteristics: {
      averageHeight: '1.45 m - 1.65 m',
      lifespan: '100 - 120 standard years',
      bloodChemistry: 'Iron-based, dark yellow/golden brown blood',
      distinctiveFeatures: [
        'Enormous auricles (ears / lobes) serving as sensitive auditory, thermal, and erogenous zones',
        'Four-lobed brain structure rendering them completely immune to telepathic reading (e.g. Betazoids, Vulcans)',
        'Pronounced ridged nose and sharp serrated teeth (often sharpened with tooth-sharpeners)',
        'Compact stature with high metabolic rate',
      ],
      physicalStrength: 'Lower than human baseline (~0.75x human strength)',
      sensoryTraits: 'Supreme directional auditory sensitivity capable of detecting faint footsteps or whispers at distance',
      uniqueBiology:
        'The four-lobed ascending brain structure creates unique neural resonance patterns that prevent psionic intrusion or empathic probe.',
    },
    biology:
      'The Ferengi are short-statured humanoids who evolved on the damp world of Ferenginar. Their defining anatomical feature is their large ears ("lobes"), which contain delicate capillary networks and heightened acoustic nerves. Their four-lobed cerebral architecture confers complete immunity to telepathic and empathic scanning, making them formidable negotiators in interstellar trade.',
    culture:
      'Ferengi culture is unapologetically hyper-capitalist, structured around the 285 Rules of Acquisition compiled by the first Grand Nagus Gint. Status is determined entirely by wealth accumulated in Gold-Pressed Latinum. In traditional society, females were historically prohibited from wearing clothes or earning profit, though groundbreaking reforms championed by Ishka and Grand Nagus Rom transformed the Alliance into a progressive welfare society.',
    philosophy:
      '"Greed is eternal." Rule of Acquisition #1: Once you have their money, you never give it back. Rule of Acquisition #34: War is good for business. Rule of Acquisition #35: Peace is good for business.',
    language: 'Ferengi language, written in spiraling currency voucher symbols.',
    history: [
      'c. 10,000 BCE: Gint writes the first Rule of Acquisition, instituting the Grand Nagus leadership.',
      '2364: First official Federation contact with the Ferengi Alliance at Delphi Ardu IV (The Last Outpost).',
      '2369-2375: Quark\'s Bar on Deep Space 9 becomes the diplomatic nexus of the Alpha Quadrant during the Dominion War.',
      '2375: Grand Nagus Zek steps down; appoints Rom as Grand Nagus, inaugurating a revolutionary era of universal education, progressive taxation, and female rights.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Purchased from other spacefaring races and refined for commercial speed)',
      signatureTech: [
        'D\'Kora Class Marauder battleships (matching Galaxy Class starships in firepower)',
        'Advanced energy whip shock weapons',
        'Subspace financial transaction cryptonetworks',
        'Long-range commercial sensor arrays specialized in mineral detection',
      ],
      weaponry: 'Plasma disruptor torpedoes, pulsed beam cannons, energy whips',
      defense: 'High-output commercial deflector shields, hull polarizers',
      propulsion: 'Standard matter/antimatter warp drive',
      techLevelSummary: 'Pragmatic spacefaring civilization that purchases cutting-edge technology rather than inventing it from scratch.',
    },
    government: {
      name: 'Ferengi Alliance',
      structure: 'Commercial corporatocracy overseen by the Board of Liquidators',
      rulingBody: 'The Grand Nagus and the Ferengi Commerce Authority (FCA)',
      seatOfPower: 'Tower of Commerce, Sacred Marketplace, Ferenginar',
    },
    notableIndividuals: [
      {
        name: 'Quark',
        title: 'Proprietor of Quark\'s Bar, Grill, Gaming House and Holosuite Arcade',
        era: '24th Century (DS9)',
        summary: 'Cunning bartender, secret philanthropist, and unlikely hero who saved Deep Space 9 and the Ferengi people.',
      },
      {
        name: 'Grand Nagus Rom',
        title: 'Leader of the Ferengi Alliance',
        era: '24th Century (DS9)',
        summary: 'Engineering genius whose progressive administration revolutionized the Ferengi economy.',
      },
      {
        name: 'Nog',
        title: 'Lieutenant / Chief Engineer of USS Defiant',
        era: '24th Century (DS9)',
        summary: 'First Ferengi to graduate from Starfleet Academy; celebrated hero of the Dominion War.',
      },
      {
        name: 'Grand Nagus Zek',
        title: 'Legendary Supreme Nagus of the Alliance',
        era: '24th Century (DS9)',
        summary: 'Wealthiest Ferengi in history who oversaw decades of immense economic expansion.',
      },
    ],
    relationshipWithFederation: {
      status: 'Neutral / Trade Partner',
      treaties: ['Ferengi-Federation Commercial Accord of 2370'],
      summary: 'Transitioned from suspicious commercial adversaries into reliable trading partners and diplomatic allies.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Mannequin_in_Ferengi_Makeup_and_Uniform.jpg',
      caption: 'Ferengi merchant displaying large auditory lobes and traditional patterned tunic.',
    },
    voiceBriefing: {
      quote: 'Hear all, trust nothing! Rule of Acquisition number twenty-two.',
      speaker: 'Quark',
      audioText: 'Species dossier: Ferengi. Homeworld: Ferenginar. Governed by the Ferengi Commerce Authority and the sacred Rules of Acquisition.',
    },
    tags: ['Ferengi', 'Ferenginar', 'Quark', 'Latinum', 'Commerce', 'Nagus'],
  },

  // 7. CARDASSIANS
  {
    id: 'cardassian',
    name: 'Cardassians',
    nativeName: 'Cardassians',
    popularityRank: 7,
    category: 'rival_hostile',
    affiliation: 'Cardassian Union',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Cardassia Prime',
      systemName: 'Cardassia System',
      systemId: 'cardassia_system',
      coordinates: 'Alpha Quadrant · Sector 21511 · Grid 994',
      classification: 'Class-M (Hot, dry, resource-depleted world)',
      climate: 'Arid, hot, high ambient temperatures, dimly lit reddish skies.',
      description: 'Seat of the Cardassian Central Command and the Obsidian Order; rebuilt following the devastation of the Dominion War.',
    },
    physicalCharacteristics: {
      averageHeight: '1.75 m - 1.95 m',
      lifespan: '110 - 130 standard years',
      bloodChemistry: 'Iron-based, dark red',
      distinctiveFeatures: [
        'Distinctive spoon-shaped depression on forehead ("spoonheads" slur)',
        'Prominent lateral neck ridges connecting mastoid to shoulders',
        'Thick grayish-tan scaled skin resistant to high heat and low humidity',
        'Photophobic eyes adapted to warm, dim, low-lux illumination',
      ],
      physicalStrength: 'Slightly above human baseline (1.2x human strength)',
      sensoryTraits: 'Exceptional photographic memory and acute auditory discernment',
      uniqueBiology:
        'Thrive in warm, dim environments (often keeping starship temperatures at 30°C / 86°F with subdued amber illumination).',
    },
    biology:
      'Cardassians evolved from reptilian humanoids on Cardassia Prime, retaining heat-resistant dermal scales and neck ridges. Because their homeworld was resource-poor, their physiology is naturally efficient with water and metabolic retention. Cardassians possess extraordinary photographic memories and analytical minds, reinforced from early childhood through rigorous state-mandated mnemonic training.',
    culture:
      'Cardassian culture is defined by loyalty to the State, deep devotion to family and elders, and intricate literary tragedy (the "Never-Ending Sacrifice"). Due to resource scarcity, the civilian Hebitian civilization collapsed and was supplanted by the military Central Command and the terrifying Obsidian Order (secret intelligence). The legal system is famous for trials where the verdict (guilty) is determined before the trial begins.',
    philosophy:
      'Duty to the State is the highest honor. The individual exists solely to preserve the collective survival and supremacy of the Cardassian people.',
    language: 'Cardassian language, noted for its precise forensic cadence and rhetorical elegance.',
    history: [
      'c. 2328-2369: Cardassian Union occupies Bajor, ruthlessly stripping its mineral wealth and enslaving its population until forced to withdraw.',
      '2347-2367: Border wars with the United Federation of Planets, concluding in the armistice creating the Demilitarized Zone and the Maquis resistance.',
      '2373: Gul Dukat secretly allies the Cardassian Union with the Dominion, bringing the Gamma Quadrant superpower into the Alpha Quadrant.',
      '2375: Legate Damar realizes the Dominion is enslaving his people and launches the Cardassian Rebellion; the Female Changeling orders the extermination of 800 million Cardassians before Allied liberation.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Cruising Warp 8, Galor Class Warships)',
      signatureTech: [
        'Galor Class and Keldon Class heavy cruisers',
        'Spiral-wave disruptor cannons with yellow-amber particle beams',
        'Advanced surveillance, encrypted listening posts, and counter-intelligence networks',
        'Orbital defense platforms equipped with regenerative Breen-enhanced shielding',
      ],
      weaponry: 'Spiral-wave disruptors, compression phaser rifles, photon torpedo arrays',
      defense: 'High-density duranium hull armor with automated deflector fields',
      propulsion: 'Standard matter/antimatter warp drive',
      techLevelSummary: 'Advanced military-industrial space power with exceptional fortifications and heavy weapon platforms.',
    },
    government: {
      name: 'Cardassian Union',
      structure: 'Military stratocracy (Central Command) balanced by the Obsidian Order; later democratic Detapa Council',
      rulingBody: 'Central Command & the Detapa Council',
      seatOfPower: 'Government District, Cardassia Prime',
    },
    notableIndividuals: [
      {
        name: 'Gul Dukat',
        title: 'Prefect of Bajor / Head of the Cardassian Union',
        era: '24th Century (DS9)',
        summary: 'Charismatic, ruthless military leader whose vanity led to the Dominion alliance and eventual spiritual fall.',
      },
      {
        name: 'Elim Garak',
        title: 'Cardassian Tailor on Deep Space 9 / Master Obsidian Order Spy',
        era: '24th Century (DS9)',
        summary: '"Just a simple tailor." Brilliant intelligence operative who orchestrated the Federation-Romulan alliance.',
      },
      {
        name: 'Legate Damar',
        title: 'Leader of the Cardassian Rebellion',
        era: '24th Century (DS9)',
        summary: 'Flawed officer who transformed into the legendary liberator of Cardassia against Dominion tyranny.',
      },
      {
        name: 'Enabran Tain',
        title: 'Former Head of the Obsidian Order',
        era: '24th Century (DS9)',
        summary: 'The only man to retire from the Obsidian Order alive; father of Elim Garak.',
      },
    ],
    relationshipWithFederation: {
      status: 'Peace Treaty / Non-Aggression',
      treaties: ['Federation-Cardassian Treaty of 2367', 'Treaty of Bajor (2375)'],
      summary: 'Former bitter wartime enemies; post-Dominion War relations are focused on humanitarian reconstruction and peaceful diplomatic stabilization.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Garak.jpg',
      caption: 'Cardassian official displaying characteristic facial bone ridges and neck flanges.',
    },
    voiceBriefing: {
      quote: 'True victory is making your enemy see that they were wrong to oppose you in the first place.',
      speaker: 'Gul Dukat',
      audioText: 'Species dossier: Cardassians. Homeworld: Cardassia Prime. Military stratocracy recovering from the devastation of the Dominion War.',
    },
    tags: ['Cardassian', 'Cardassia', 'Dukat', 'Garak', 'ObsidianOrder', 'Galor'],
  },

  // 8. ANDORIANS
  {
    id: 'andorian',
    name: 'Andorians',
    nativeName: 'Andorii',
    popularityRank: 8,
    category: 'federation',
    affiliation: 'United Federation of Planets',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Andoria (Fek\'lhr / Andor)',
      systemName: 'Andoria System',
      systemId: 'andoria_system',
      coordinates: 'Alpha Quadrant · Epsilon Indi VIII · Moon of a Ringed Gas Giant',
      classification: 'Class-M (Frozen icy moon, subterranean cities, geothermal caves)',
      climate: 'Hyper-glacial frozen tundra; surface temperature averages -28°C; civilization thrives in underground geothermal warrens.',
      description: 'Icy moon and founding Federation world, home to the Andorian Imperial Guard and Central Council.',
    },
    physicalCharacteristics: {
      averageHeight: '1.70 m - 1.95 m',
      lifespan: '110 - 135 standard years',
      bloodChemistry: 'Cobalt-based (Hemocyanin derivative), vibrant blue blood',
      distinctiveFeatures: [
        'Vibrant azure/cobalt-blue pigmented skin',
        'Silver or shock-white hair',
        'Two movable cranial antennae providing directional echolocation and balance',
        'Dense fibrous musculature adapted to subterranean climbing and cold',
      ],
      physicalStrength: 'Superior (approximately 1.8x to 2x human baseline)',
      sensoryTraits: 'Antennae provide ultra-precise balance, acoustic echolocation, and barometric sensitivity',
      uniqueBiology:
        'Severed antennae cause severe loss of equilibrium and orientation, though they slowly regenerate over nine months. Marriage typically requires four partners (thaan, chen, shen, zhen).',
    },
    biology:
      'Andorians are blue-skinned humanoid warriors whose blood is cobalt-based, giving their veins and tissues a distinct royal blue tint. Their primary evolutionary features are their paired cranial antennae, which articulate independently to register subtle air currents, atmospheric pressure shifts, and high-frequency sound waves. A genetic sub-species, the blind telepathic Aenar, lives in the northern wastes of Andoria.',
    culture:
      'Andorian society is passionate, fiercely honorable, and organized around martial excellence. They revere military service in the Imperial Guard and settle blood feuds through the Ushaan—a ritual duel to the death fought with Ushaan-tor ice picks. Unlike the stoic Vulcans, Andorians wear their passions, loyalties, and fiery temper on their sleeves.',
    philosophy:
      'Honor through brotherhood, duty to the clan, and protection of comrades. "The blood of an enemy is cold; the blood of an Andorian runs forever hot."',
    language: 'Andorian language (featuring soft sibilants and clicking clicks).',
    history: [
      '2151: Commander Shran encounters Captain Jonathan Archer at the P\'Jem Vulcan sanctuary, uncovering a clandestine Vulcan surveillance station.',
      '2154: Andorians and Vulcans nearly go to war, averted by Archer and Shran during the Kir\'Shara crisis.',
      '2161: Andoria co-founds the United Federation of Planets alongside Earth, Vulcan, and Tellar.',
      '23rd - 24th Century: Andorians provide elite tactical personnel, security chiefs, and shipwrights to Starfleet.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Fast interceptor engine designs, Kumarun Class)',
      signatureTech: [
        'Particle beam phaser cannons with rapid cyclic fire rates',
        'Subterranean geothermal power taps and thermal field shielding',
        'Advanced sensor arrays integrated with antenna biometrics',
        'Heavy ice-breaker starship hull metallurgy',
      ],
      weaponry: 'Pulse phasers, plasma disruptor torpedoes, Ushaan-tor combat blades',
      defense: 'High-density ablative thermal shielding and reinforced tritanium hull plating',
      propulsion: 'Antimatter warp drive with high acceleration burst capacitors',
      techLevelSummary: 'Premier military and exploration pioneer; core contributor to Starfleet Defense Tactics.',
    },
    government: {
      name: 'Andorian Empire / Member of the United Federation of Planets',
      structure: 'Parliamentary confederation guided by the Presidium and the Imperial Guard',
      rulingBody: 'The Andorian Parliament & Imperial Guard High Command',
      seatOfPower: 'Lor\'Vela, Andoria',
    },
    notableIndividuals: [
      {
        name: 'Thy\'lek Shran',
        title: 'Commander / General of the Andorian Imperial Guard',
        era: '22nd Century (Enterprise)',
        summary: 'Fiery, loyal commander who developed a deep bond with Captain Archer and helped found the Federation.',
      },
      {
        name: 'Talla Shran',
        title: 'Daughter of Shran / Imperial Guard Officer',
        era: '22nd Century (Enterprise)',
        summary: 'Symbol of the peaceful unification of Andorian clans and human friendship.',
      },
      {
        name: 'Thelin',
        title: 'Commander / First Officer of USS Enterprise (Alternate Timeline)',
        era: '23rd Century (Animated Series)',
        summary: 'Loyal Andorian officer who served as Spock\'s replacement when timeline fractured.',
      },
    ],
    relationshipWithFederation: {
      status: 'Founding Member',
      treaties: ['Articles of Federation (2161)', 'Treaty of P\'Jem (2151)'],
      summary: 'Founding member of the Federation; provided the military backbone and tactical valor that forged the early alliance.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/0/03/StarTrek.Andorian.01.jpg',
      caption: 'Andorian Imperial Guard displaying vibrant cobalt skin and cranial antennae.',
    },
    voiceBriefing: {
      quote: 'Tell me, pink skin... have you ever fought on ice where the wind can strip the flesh from your bones?',
      speaker: 'Commander Shran',
      audioText: 'Species dossier: Andorians. Homeworld: Andoria. Blue-skinned founding members of the United Federation of Planets.',
    },
    tags: ['Federation', 'Andoria', 'Shran', 'Antennae', 'ImperialGuard', 'Blue'],
  },

  // 9. BAJORANS
  {
    id: 'bajoran',
    name: 'Bajorans',
    nativeName: 'Bajorans',
    popularityRank: 9,
    category: 'federation',
    affiliation: 'United Federation of Planets',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Bajor (Bajor Prime)',
      systemName: 'Bajor System',
      systemId: 'bajor_system',
      coordinates: 'Alpha Quadrant · Sector 401 · Near the Denorios Belt',
      classification: 'Class-M (Verdant agricultural world, lush emerald oceans)',
      climate: 'Warm, temperate, fertile soil, five major continents surrounded by oceans.',
      description: 'Ancient spiritual paradise world, gateway to the Bajoran Wormhole (Celestial Temple of the Prophets).',
    },
    physicalCharacteristics: {
      averageHeight: '1.65 m - 1.85 m',
      lifespan: '120 - 140 standard years',
      bloodChemistry: 'Iron-based, red blood',
      distinctiveFeatures: [
        'Four to seven distinct horizontal ridges across the bridge of the nose',
        'Traditional ornate d\'jaresse ear cuff (d\'kora) worn on the right ear symbolizing pagh (spiritual soul) and family lineage',
        'Internal anatomy largely identical to human baseline with heart mirrored horizontally',
      ],
      physicalStrength: 'Standard humanoid baseline (1.0x human baseline)',
      sensoryTraits: 'Standard optical and auditory range',
      uniqueBiology:
        'Pregnancy gestation lasts five months (compared to nine for humans); women experience frequent sneezes during labor due to vascular shifts.',
    },
    biology:
      'Bajorans are nearly identical to humans in external form, distinguished by their characteristic nose ridges. Internally, the Bajoran heart is configured horizontally across the chest rather than vertically. Their emotional and physical health is closely tied to spiritual equilibrium.',
    culture:
      'Bajor is one of the oldest and most artistically sophisticated civilizations in the galaxy, having constructed sublight solar sail vessels when humanity was still in the Stone Age. Culture centers around deep religious faith in the Prophets (non-corporeal wormhole beings) and the sacred Tears of the Prophets (Orbs). The spiritual leader is the Kai, alongside the First Minister of the Provisional Government.',
    philosophy:
      'Trust in the will of the Prophets. The pagh (life essence / soul) must be kept pure through faith, justice, and compassion.',
    language: 'Bajoran language, written in fluid, calligraphic holy glyphs.',
    history: [
      'c. 25,000 BCE: Bajoran civilization blossoms; construct monumental architecture, philosophy, and solar sailing craft.',
      '2328-2369: The brutal Cardassian Occupation ravages Bajor, killing over 10 million citizens and spawning the Bajoran Resistance.',
      '2369: Cardassians withdraw; Starfleet assumes joint administration of Deep Space 9; Commander Benjamin Sisko discovers the Bajoran Wormhole and is hailed as the Emissary of the Prophets.',
      '2375: Following the Dominion War, Bajor formally signs Federation accession documents.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'Standard Warp (Modern Starfleet-compatible vessels)',
      signatureTech: [
        'Ancient Solar Sailing vessels propelled by tachyon particle streams',
        'Orb-energy shielding and temple stasis field harmonics',
        'Sublight impulse raiders and planetary agricultural terraforming arrays',
      ],
      weaponry: 'Phaser pistols, compression rifles, planetary defense torpedoes',
      defense: 'Standard deflector grids and planetary shield arrays',
      propulsion: 'Matter/antimatter warp engines',
      techLevelSummary: 'Ancient culture undergoing rapid post-occupation technological and infrastructural renaissance.',
    },
    government: {
      name: 'Bajoran Provisional Government & Religious Vedek Assembly',
      structure: 'Democratically elected chamber of ministers balanced by the monastic Vedek Assembly',
      rulingBody: 'First Minister and the Office of the Kai',
      seatOfPower: 'Temple of the Prophets & Council Chambers, Ashalla, Bajor',
    },
    notableIndividuals: [
      {
        name: 'Major Kira Nerys',
        title: 'First Officer of Deep Space 9 / Later Station Commander',
        era: '24th Century (DS9)',
        summary: 'Fierce resistance fighter who transitioned into a brilliant statesman, soldier, and champion of Bajor.',
      },
      {
        name: 'Kai Winn Adami',
        title: 'Spiritual Leader of Bajor (Kai)',
        era: '24th Century (DS9)',
        summary: 'Politically ambitious religious figure whose hunger for divine recognition led to tragic betrayal.',
      },
      {
        name: 'Kai Opaka Sulan',
        title: 'Beloved Spiritual Guide of Bajor',
        era: '24th Century (DS9)',
        summary: 'Holy woman who recognized Benjamin Sisko as the Emissary; chosen to heal the Ennis and Kellerun in the Gamma Quadrant.',
      },
      {
        name: 'Ro Laren',
        title: 'Starfleet Ensign / Maquis Operative / Intelligence Agent',
        era: '24th Century (TNG / Picard)',
        summary: 'Talented, defiant officer whose deep love for Bajor led her into the Maquis resistance.',
      },
    ],
    relationshipWithFederation: {
      status: 'Full Member',
      treaties: ['Federation Accession Accord of 2375'],
      summary: 'Deeply bonded through Starfleet\'s administration of DS9; key Federation territory housing the gateway to the Gamma Quadrant.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/QTXP_20121019_Destination_Star_Trek_London_MG_1490_cropped.jpg',
      caption: 'Bajoran officer showing horizontal nasal bridge ridges and traditional earring.',
    },
    voiceBriefing: {
      quote: 'The Prophets do not work on Starfleet\'s schedule. Have faith.',
      speaker: 'Colonel Kira Nerys',
      audioText: 'Species dossier: Bajorans. Homeworld: Bajor, near the Celestial Temple Wormhole. Joined with the United Federation of Planets.',
    },
    tags: ['Bajor', 'Prophets', 'Kira', 'Wormhole', 'DS9', 'Pagh'],
  },

  // 10. GORN
  {
    id: 'gorn',
    name: 'Gorn',
    nativeName: 'Gorn',
    popularityRank: 10,
    category: 'rival_hostile',
    affiliation: 'Gorn Hegemony',
    quadrant: 'Beta Quadrant',
    homeworld: {
      name: 'Gorn Prime (Gornar)',
      systemName: 'Gorn Sector',
      systemId: 'gorn_sector',
      coordinates: 'Beta Quadrant · Gorn Sector · Grid 883',
      classification: 'Class-M (Extreme tropical heat, sulfuric jungles, high radiation)',
      climate: 'Sweltering hot jungles, high humidity, volcanic basalt rock ridges.',
      description: 'Capital of the militaristic Gorn Hegemony; fiercely guarded territorial boundaries.',
    },
    physicalCharacteristics: {
      averageHeight: '2.00 m - 2.50 m',
      lifespan: '180 - 220 standard years',
      bloodChemistry: 'Cold-blooded reptilian hemolymph with high coagulant density',
      distinctiveFeatures: [
        'Massive reptilian bipedal build covered in thick, dark-green scaled hide',
        'Faceted, multi-lens compound eyes resembling glittering diamond or amber crystals',
        'Powerful jaw lined with serrated razor-sharp teeth',
        'Clawed, four-digit talons capable of tearing through duranium plating',
      ],
      physicalStrength: 'Colossal (approximately 5x to 6x human baseline)',
      sensoryTraits: 'Compound visual lenses detecting thermal gradients, electromagnetic fields, and high-speed motion',
      uniqueBiology:
        'Thick scaly hide acts as natural bulletproof armor, shrugging off low-power phaser blasts and projectile weapons; vulnerable to extreme freezing temperatures.',
    },
    biology:
      'The Gorn are cold-blooded reptilian bipeds of enormous mass and physical power. Their scaly epidermal plates can withstand heavy physical trauma and laser radiation. Their multifaceted compound eyes grant a 270-degree field of vision and exquisite thermal targeting. While their deliberate, methodical movements appear slow, their explosive striking reflex is lethal.',
    culture:
      'Gorn culture is ruthlessly territorial, pragmatically military, and hierarchical. They perceive trespass into Hegemony space as an act of war requiring total eradication. The Metrons forced a celebrated duel between a Gorn captain and Captain Kirk on an asteroid, where Kirk\'s refusal to murder the defeated Gorn commander established the first mutual respect between the species.',
    philosophy:
      'Survival of the fittest, unyielding defense of territorial boundaries, and tactical dominance through raw strength and cunning patience.',
    language: 'Gorn language (deep gutter hiss, clicks, and subsonic vocalizations).',
    history: [
      '2267: Gorn forces destroy the Federation colony on Cestus III, which had unwittingly settled on Hegemony sovereign territory; Captain Kirk confronts the Gorn Captain under the observation of the Metrons.',
      '2270s-2370s: Gorn Hegemony maintains strict border pacts with the Federation, engaging in occasional skirmishes with the Klingons.',
      '24th Century: Gorn representatives participate in exploratory diplomatic summits with Starfleet.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Heavy lumbering battleships equipped with plasma torpedoes)',
      signatureTech: [
        'Heavy Plasma Torpedo launcher tubes firing devastating solar-temp flares',
        'Bio-resistant thermal shielding',
        'Subspace sensor scramblers',
        'High-tensile crystalline battle armor hulls',
      ],
      weaponry: 'Heavy plasma torpedoes, disruptor beam banks, claws and tail strikes',
      defense: 'Reinforced magnetic deflector fields, natural ballistic-resistant hide',
      propulsion: 'High-yield antimatter warp drive tuned for high sustained sublight mass',
      techLevelSummary: 'Formidable Tier 4 space power possessing destructive firepower and nearly indestructible warships.',
    },
    government: {
      name: 'Gorn Hegemony',
      structure: 'Militaristic reptilian council of clan warlords',
      rulingBody: 'The Supreme Hegemon and Council of Elders',
      seatOfPower: 'Gornar Citadel, Gorn Prime',
    },
    notableIndividuals: [
      {
        name: 'The Gorn Captain',
        title: 'Commander of the Cestus III Strike Force',
        era: '23rd Century (TOS - "Arena")',
        summary: 'Formidable commander who fought Captain Kirk to a standstill in the Metron arena.',
      },
      {
        name: 'S\'Gorn',
        title: 'Diplomatic Envoy to the Federation',
        era: '24th Century',
        summary: 'Statesman who negotiated the non-aggression demarcation boundary around Cestus III.',
      },
    ],
    relationshipWithFederation: {
      status: 'Peace Treaty / Non-Aggression',
      treaties: ['Cestus III Demarcation Treaty of 2271'],
      summary: 'Strictly defined non-aggression boundary; generally respectful but intensely guarded neutrality.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/The_Gorn%21_Star_Trek-_Exploring_New_Worlds_exhibit_at_the_Henry_Ford_Museum%2C_Dearborn%2C_Michigan.jpg',
      caption: 'The Gorn Captain — iconic reptilian warrior possessing colossal physical strength and compound eyes.',
    },
    voiceBriefing: {
      quote: 'We saw you as invaders. You destroyed our outpost, and you were condemned.',
      speaker: 'The Gorn Captain',
      audioText: 'Species dossier: Gorn. Homeworld: Gorn Prime, Beta Quadrant. Cold-blooded reptilian species of immense physical strength.',
    },
    tags: ['Gorn', 'Arena', 'Reptilian', 'CestusIII', 'Hegemony'],
  },

  // 11. TRILL
  {
    id: 'trill',
    name: 'Trill',
    nativeName: 'Trill',
    popularityRank: 11,
    category: 'federation',
    affiliation: 'United Federation of Planets',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Trill Homeworld',
      systemName: 'Trill System',
      systemId: 'trill_system',
      coordinates: 'Alpha Quadrant · Sector 628 · Grid 540',
      classification: 'Class-M (Mild, crystal clear waters, temperate emerald continents)',
      climate: 'Serene, temperate, gentle seasons, vast subterranean thermal pools.',
      description: 'Birthplace of both the humanoid Trill and the subterranean symbiont pools of Mak\'ala.',
    },
    physicalCharacteristics: {
      averageHeight: '1.65 m - 1.85 m',
      lifespan: 'Humanoid host: 100-130 years; Symbiont: 300 - 550+ years',
      bloodChemistry: 'Iron-based, red blood',
      distinctiveFeatures: [
        'Characteristic twin bands of dark brown/black leopard-like spots running from hairline down the neck, torso, and legs',
        'Internal abdominal pouch in Joined Trill designed to house the vermiform symbiont',
        'Merged dual consciousness and memory retention in Joined individuals',
      ],
      physicalStrength: 'Standard humanoid baseline (1.0x human baseline)',
      sensoryTraits: 'Heightened sensitivity to telepathic or bio-electric fields from the symbiont',
      uniqueBiology:
        'Biological symbiosis: The vermiform symbiont connects its nervous system to the host\'s spinal cord, merging the memories, personalities, and skills of all previous lifetimes.',
    },
    biology:
      'The Trill species comprises two co-evolved entities: humanoid hosts and sentient, vermiform subterranean symbionts. The Symbiosis Commission carefully selects hosts to join with a symbiont. Once joined, host and symbiont become a single integrated persona with access to centuries of memories, personalities, romances, and technical skills from past lives.',
    culture:
      'Trill culture is dignified, intellectual, and deeply committed to self-knowledge and artistic mastery. Becoming joined is considered the supreme honor, though strict laws prevent re-associating with lovers or spouses from past lifetimes (the taboo of reassociation).',
    philosophy:
      'Accumulate wisdom across lifetimes; contribute uniquely to the continuum of knowledge; cherish the harmony of symbiosis.',
    language: 'Trill language, with rich idiomatic expressions spanning multiple centuries.',
    history: [
      'c. Ancient Times: The symbionts living in the pools of Mak\'ala first merge with humanoid Trill, establishing a timeless partnership.',
      '2260s: Trill maintain quiet relations with the Federation, keeping the full truth of symbiosis secret from outsiders.',
      '2367: Ambassador Odan works with Doctor Beverly Crusher, revealing the truth of Trill joining to Starfleet.',
      '2369-2375: Jadzia Dax, the eighth host of the Dax symbiont, serves as Chief Science Officer of Deep Space 9.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Starfleet Level 4 standard)',
      signatureTech: [
        'Advanced neurochemical synthesis and symbiont life-support grids',
        'High-density memory crystal matrix technology',
        'Subspace communications relays',
      ],
      weaponry: 'Standard Starfleet phasers and defensive grids',
      defense: 'Multiphasic shielding',
      propulsion: 'Antimatter warp drive',
      techLevelSummary: 'Advanced member civilization of the Federation contributing cutting-edge neural sciences.',
    },
    government: {
      name: 'Trill Symbiosis Commission & Senate',
      structure: 'Elected parliamentary council guided by the Symbiosis Commission',
      rulingBody: 'The Symbiosis Commission & Trill Ruling Council',
      seatOfPower: 'Mak\'ala, Trill Homeworld',
    },
    notableIndividuals: [
      {
        name: 'Jadzia Dax',
        title: 'Eighth Host of Dax / Lieutenant Commander, DS9',
        era: '24th Century (DS9)',
        summary: 'Brilliant astrophysicist, master bat\'leth duelist, and beloved officer who carried 300 years of Dax memories.',
      },
      {
        name: 'Ezri Dax',
        title: 'Ninth Host of Dax / Counselor & Starfleet Captain',
        era: '24th Century (DS9)',
        summary: 'Emergency host who courageously overcame unexpected joining to become an essential officer in the Dominion War.',
      },
      {
        name: 'Curzon Dax',
        title: 'Seventh Host of Dax / Federation Ambassador to the Klingon Empire',
        era: '24th Century (DS9)',
        summary: 'Legendary diplomat, blood brother to Kang, Koloth, and Kor; mentor to Benjamin Sisko.',
      },
    ],
    relationshipWithFederation: {
      status: 'Full Member',
      treaties: ['Articles of Federation'],
      summary: 'Key Federation member providing visionary scientists, diplomats, and senior officers.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Trill — joined beings merging centuries of host memories with a subterranean symbiont.',
    },
    voiceBriefing: {
      quote: 'I have lived seven lifetimes. I have been a father, a mother, an ambassador, and a scientist.',
      speaker: 'Jadzia Dax',
      audioText: 'Species dossier: Trill. Homeworld: Trill System. Humanoid hosts joined with long-lived subterranean symbionts.',
    },
    tags: ['Trill', 'Dax', 'Symbiont', 'Spots', 'Federation'],
  },

  // 12. BETAZOIDS
  {
    id: 'betazoid',
    name: 'Betazoids',
    nativeName: 'Betazoid',
    popularityRank: 12,
    category: 'federation',
    affiliation: 'United Federation of Planets',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Betazed',
      systemName: 'Betazed System',
      systemId: 'betazed_system',
      coordinates: 'Alpha Quadrant · Sector 331 · Grid 712',
      classification: 'Class-M (Lush pastoral world, crystal lakes, pristine forests)',
      climate: 'Mild, idyllic, warm breezes, minimal seasonal extremes.',
      description: 'Peaceful, telepathic paradise world, seat of the Ruling Houses and the Great House of Betazed.',
    },
    physicalCharacteristics: {
      averageHeight: '1.65 m - 1.85 m',
      lifespan: '110 - 130 standard years',
      bloodChemistry: 'Iron-based, red blood',
      distinctiveFeatures: [
        'Completely black irises (giving eyes an intense, deep, pupil-less appearance)',
        'Externally indistinguishable from Terran humans aside from ocular pigmentation',
        'Naturally telepathic and empathic neural paracortex',
      ],
      physicalStrength: 'Standard humanoid baseline (1.0x human baseline)',
      sensoryTraits: 'Natural psionic telepathy and emotional empathy spanning planet-wide or starship distances',
      uniqueBiology:
        'Telepathic abilities typically manifest during adolescence; half-Betazoids (like Deanna Troi) possess empathy rather than full telepathy.',
    },
    biology:
      'Betazoids are physiologically nearly identical to humans, distinguished by their jet-black irises and their paracortex—a specialized neural region responsible for telepathic communication and empathic perception. Full Betazoids communicate with each other through thoughts from childhood and can read the emotional states of most sentient humanoid minds (with exceptions like Ferengi, Breen, and Dopterians).',
    culture:
      'Because deception and lies are nearly impossible in a telepathic society, Betazoid culture values complete honesty, emotional openness, and personal vulnerability. Society is matriarchal, organized into Great Houses led by noble matriarchs. Traditional weddings are celebrated completely in the nude to signify total honesty between partners.',
    philosophy:
      'Honesty is the breath of truth. Empathy connects all living beings in cosmic harmony.',
    language: 'Betazoid (spoken rarely among themselves; primarily mental projection).',
    history: [
      'Ancient times: Betazed transitions into a peaceful global community with virtually zero violent crime due to universal telepathy.',
      '2270s: Betazed joins the United Federation of Planets.',
      '2360s: Counselor Deanna Troi serves on the USS Enterprise-D, utilizing empathy to advise Captain Picard.',
      '2374: During the Dominion War, the Tenth Jem\'Hadar Fleet invades and occupies Betazed; liberated by Allied forces in 2375.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Starfleet Level 4 standards)',
      signatureTech: [
        'Psionic dampening and amplification lattices',
        'Harmonic ecological starship architectures',
        'Advanced psycho-therapeutic holographic diagnostics',
      ],
      weaponry: 'Standard Starfleet phasers and defensive grids',
      defense: 'High-density deflector grids',
      propulsion: 'Matter/antimatter warp drive',
      techLevelSummary: 'Enlightened civilization renowned for diplomatic, psychological, and exobiological brilliance.',
    },
    government: {
      name: 'Matriarchal House Council of Betazed',
      structure: 'Hereditary matriarchal aristocracy integrated with representative council',
      rulingBody: 'The Ruling Houses of Betazed',
      seatOfPower: 'House of Troi, Medara, Betazed',
    },
    notableIndividuals: [
      {
        name: 'Deanna Troi',
        title: 'Ship\'s Counselor / Commander, USS Enterprise-D/E/Titan',
        era: '24th Century (TNG / Movies / Picard)',
        summary: 'Half-human, half-Betazoid empath whose emotional insight saved the Enterprise on countless diplomatic missions.',
      },
      {
        name: 'Lwaxana Troi',
        title: 'Daughter of the Fifth House, Holder of the Sacred Chalice of Rixx',
        era: '24th Century (TNG / DS9)',
        summary: 'Flamboyant, indomitable Federation Ambassador who used her telepathic gifts to expose conspiracies.',
      },
    ],
    relationshipWithFederation: {
      status: 'Full Member',
      treaties: ['Articles of Federation'],
      summary: 'Devoted, peaceful Federation member world providing Starfleet\'s finest counselors, diplomats, and negotiators.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Betazoid people — telepathic civilization distinguished by intense black irises and deep empathy.',
    },
    voiceBriefing: {
      quote: 'I sense great deception... but also profound sorrow.',
      speaker: 'Counselor Deanna Troi',
      audioText: 'Species dossier: Betazoids. Homeworld: Betazed. Telepathic and empathic members of the United Federation of Planets.',
    },
    tags: ['Betazed', 'Troi', 'Telepathy', 'Empathy', 'Federation'],
  },

  // 13. CHANGELINGS (FOUNDERS)
  {
    id: 'changeling',
    name: 'Changelings (The Founders)',
    nativeName: 'The Founders',
    popularityRank: 13,
    category: 'gamma_dominion',
    affiliation: 'Dominion',
    quadrant: 'Gamma Quadrant',
    homeworld: {
      name: 'The Great Link (Omarion Nebula)',
      systemName: 'Omarion System',
      systemId: 'omarion_system',
      coordinates: 'Gamma Quadrant · Omarion Nebula · Deep Dominion Space',
      classification: 'Class-M (Oceanic liquid changeling substrate world)',
      climate: 'Vast golden sea of pure liquid biological morphogenic matter.',
      description: 'Mystical spiritual home of the Changelings, where billions of Founders merge into a single harmonious ocean.',
    },
    physicalCharacteristics: {
      averageHeight: 'Variable (Can mimic any object, gas, fire, humanoid, or creature from micro to macro)',
      lifespan: 'Immortal / Centuries across continuous existence in the Great Link',
      bloodChemistry: 'Morphogenic matrix (contains no blood, cells, or organs in native state)',
      distinctiveFeatures: [
        'Naturally gelatinous, amber-colored liquid state',
        'Capable of flawless cellular and molecular mimicry (replicating rocks, fire, animals, starships, humans)',
        'In humanoid rest shape, facial features are stylized, smooth, and lacking fine dermal pores',
      ],
      physicalStrength: 'Variable; can generate tremendous hydraulic pressure or tensile strength',
      sensoryTraits: 'Direct molecular perception; can sense subspace, gravitational, and electromagnetic disturbances',
      uniqueBiology:
        'When merged in the Great Link, thoughts, memories, and identities flow seamlessly between all members; can survive in the vacuum of deep space by becoming space-faring organisms.',
    },
    biology:
      'Changelings are metamorphs composed of an extraordinary morphogenic enzyme matrix. They possess neither internal organs, bones, nor genetic cellular walls in their natural liquid state. By consciously shifting their molecular structure, a Changeling can replicate any material—becoming hard as diamond, light as gas, or biologically indistinguishable from a living humanoid down to cellular scans.',
    culture:
      'Historically hunted, persecuted, and tortured by "solids" (mono-form species), the Changelings retreated into the Gamma Quadrant and adopted a fanatical philosophy: what you control cannot hurt you. They forged the Dominion, genetically breeding the Vorta as administrators and the Jem\'Hadar as shock troops to enforce iron order across thousands of worlds.',
    philosophy:
      'Order must be imposed upon the chaotic galaxy. What you control cannot hurt you. The Great Link is the ultimate manifestation of harmony.',
    language: 'Direct neural and emotional flow during the Link; speak standard languages when dealing with solids.',
    history: [
      'Ancient times: "Solids" fear and hunt the Changeling race across the Gamma Quadrant, driving them to form the Dominion.',
      'c. 2000 Years Ago: The Dominion is established, maintaining ruthless control over the Gamma Quadrant.',
      '2370: The Federation discovers the Bajoran Wormhole, encroaching on Dominion space; the Founders reveal themselves.',
      '2373-2375: The Dominion War consumes the Alpha and Beta Quadrants; ended when Odo cures the morphogenic virus and returns to the Great Link.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp / Transwarp research capabilities',
      signatureTech: [
        'Advanced genetic engineering (creation of the Vorta and Jem\'Hadar)',
        'Phased polaron beam weapons penetrating standard Federation shields',
        'Subspace sensor netting spanning entire solar systems',
        'Ketracel-white chemical synthesizer facilities',
      ],
      weaponry: 'Phased polaron beams, biogenic weapons, quantum resonance disruptors',
      defense: 'High-density regenerative shields, stealth infiltration',
      propulsion: 'Antimatter warp drives and sublight polaron drives',
      techLevelSummary: 'Colossal galactic empire wielding unmatched genetic, industrial, and military resources.',
    },
    government: {
      name: 'The Dominion',
      structure: 'Absolute imperial theocracy ruled by the Founders through cloned servant races',
      rulingBody: 'The Great Link / Female Changeling',
      seatOfPower: 'The Great Link, Omarion Nebula, Gamma Quadrant',
    },
    notableIndividuals: [
      {
        name: 'Odo',
        title: 'Chief of Security, Deep Space 9 / Savior of the Great Link',
        era: '24th Century (DS9)',
        summary: 'One of the Hundred infants sent into the galaxy; chose justice and friendship with solids, eventually curing the Link.',
      },
      {
        name: 'The Female Changeling',
        title: 'Leader of Dominion Forces in the Alpha Quadrant',
        era: '24th Century (DS9)',
        summary: 'Ruthless strategic leader who waged the Dominion War until convinced by Odo to surrender on Cardassia.',
      },
      {
        name: 'Laas',
        title: 'One of the Hundred',
        era: '24th Century (DS9)',
        summary: 'Changeling explorer capable of shifting into space-faring creatures and pure light.',
      },
    ],
    relationshipWithFederation: {
      status: 'Peace Treaty / Non-Aggression',
      treaties: ['Treaty of Bajor (2375)'],
      summary: 'Perpetrators of the bloodiest conflict in modern Alpha Quadrant history; peaceful relations maintained via Odo\'s moral guidance.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Founders — liquid morphogenic beings ruling the vast Dominion from the Great Link.',
    },
    voiceBriefing: {
      quote: 'No Changeling has ever harmed another. Until now.',
      speaker: 'Constable Odo',
      audioText: 'Species dossier: Changelings, the Founders of the Dominion. Native to the Great Link, Omarion Nebula, Gamma Quadrant.',
    },
    tags: ['Dominion', 'Founder', 'Odo', 'GreatLink', 'Changeling', 'GammaQuadrant'],
  },

  // 14. JEM'HADAR
  {
    id: 'jemhadar',
    name: 'Jem\'Hadar',
    nativeName: 'Jem\'Hadar',
    popularityRank: 14,
    category: 'gamma_dominion',
    affiliation: 'Dominion',
    quadrant: 'Gamma Quadrant',
    homeworld: {
      name: 'Dominion Gestation World (Kurill Prime)',
      systemName: 'Dominion Prime Sector',
      systemId: 'omarion_system',
      coordinates: 'Gamma Quadrant · Dominion Core Territories',
      classification: 'Cloning and Gestation Military Creches',
      climate: 'Sterile, military barracks, training grounds.',
      description: 'Manufactured shock troops of the Dominion bred in massive birthing hatcheries.',
    },
    physicalCharacteristics: {
      averageHeight: '1.85 m - 2.10 m',
      lifespan: 'Artificially shortened: Reach adulthood in 3 days; rarely live past 15-20 years in combat',
      bloodChemistry: 'Chemically dependent on isogenic enzyme Ketracel-white',
      distinctiveFeatures: [
        'Rugged, grayish-scaled reptilian-like hide with spikes along the jawline and brow',
        'External isogenic intake port on neck connecting to Ketracel-white dispenser tube',
        'Lethal physical bulk and lightning-fast hand-to-hand combat prowess',
        'Capable of organic visual shrouding (invisibility)',
      ],
      physicalStrength: 'Enormous (approximately 3x to 4x human baseline)',
      sensoryTraits: 'Exceptional tracking senses, immunity to sleep deprivation, zero food requirements',
      uniqueBiology:
        'Genetically engineered by the Founders to have no reproductive organs, no childhood, no fear of death, and complete physiological addiction to Ketracel-white.',
    },
    biology:
      'The Jem\'Hadar are the ultimate bio-engineered infantry of the galaxy. Created by the Founders in cloning creches, they mature from birth to fighting warrior in three days. They require neither sleep, recreation, nor standard nutrition, sustaining themselves entirely through the synthetic enzyme Ketracel-white dispensed via an intake tube in their collar. They possess an innate biological cloaking ability called the "shroud."',
    culture:
      'Jem\'Hadar culture is Spartan, fatalistic, and fanatically loyal to the Founders, whom they worship as living gods. Their hierarchy is commanded by a "First", followed by a "Second" and "Third", overseen by a Vorta administrator who controls the supply of Ketracel-white. They accept death as an inescapable duty.',
    philosophy:
      '"I am First [Name], and I am dead. As of this moment, we are all dead. We go into battle to reclaim our lives. This we do gladly, for we are Jem\'Hadar. Victory is life!"',
    language: 'Dominion Standard / Jem\'Hadar battle code.',
    history: [
      'c. 2000 Years Ago: Created by the Founders as the supreme military vanguard of the Dominion.',
      '2370: First engagement with Starfleet on DS9; a single Jem\'Hadar warship conducts a suicide run that destroys the Galaxy-class USS Odyssey.',
      '2373-2375: Wage relentless warfare across the Alpha Quadrant during the Dominion War.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Attack Bug Ships and massive Battleships)',
      signatureTech: [
        'Phased polaron pulse beam cannons',
        'Biological shroud field cloaking',
        'Automated collision ramming tactics',
      ],
      weaponry: 'Polaron beam rifles, phased polaron ship cannons, dermal disrupters',
      defense: 'High-energy deflector shielding',
      propulsion: 'High-acceleration sublight impulse and antimatter warp drive',
      techLevelSummary: 'Lethal, mass-manufactured military fleet capable of overwhelming planetary defenses.',
    },
    government: {
      name: 'The Dominion (Military Wing)',
      structure: 'Absolute military hierarchy under the authority of Vorta overseers and Founders',
      rulingBody: 'The First of each unit, answering to the Vorta',
      seatOfPower: 'Dominion Central Military Fleet Command',
    },
    notableIndividuals: [
      {
        name: 'Remata\'Klan',
        title: 'First of the Third Unit',
        era: '24th Century (DS9 - "Rocks and Shoals")',
        summary: 'Honorable Jem\'Hadar First who obeyed orders to lead his troops into battle knowing his Vorta had betrayed them.',
      },
      {
        name: 'Goran\'Agar',
        title: 'First on Bopak III',
        era: '24th Century (DS9)',
        summary: 'Rare Jem\'Hadar who discovered a planetary mineral that freed him from Ketracel-white addiction.',
      },
    ],
    relationshipWithFederation: {
      status: 'Peace Treaty / Non-Aggression',
      treaties: ['Treaty of Bajor (2375)'],
      summary: 'Withdrew through the Bajoran Wormhole to the Gamma Quadrant at the conclusion of the Dominion War.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Jem\'Hadar — genetically engineered shock infantry of the Dominion.',
    },
    voiceBriefing: {
      quote: 'Victory is life! We go into battle to reclaim our lives.',
      speaker: 'First Remata\'Klan',
      audioText: 'Species dossier: Jem\'Hadar. Genetically engineered shock infantry of the Dominion, sustained by Ketracel-white.',
    },
    tags: ['JemHadar', 'Dominion', 'KetracelWhite', 'Shroud', 'VictoryIsLife'],
  },

  // 15. Q CONTINUUM
  {
    id: 'q_continuum',
    name: 'Q Continuum',
    nativeName: 'Q',
    popularityRank: 15,
    category: 'cosmic_unique',
    affiliation: 'Higher Cosmic Entity',
    quadrant: 'Non-Spatial / Extra-dimensional',
    homeworld: {
      name: 'The Q Continuum',
      systemName: 'Extra-dimensional Realm',
      coordinates: 'Beyond standard space-time coordinates',
      classification: 'Non-corporeal infinite dimension',
      climate: 'Infinite, non-spatial; often represented to human minds as an endless roadhouse or American Civil War battlefield.',
      description: 'Extra-dimensional plane of existence transcending the boundaries of time, space, and reality.',
    },
    physicalCharacteristics: {
      averageHeight: 'Infinite / Manifests as standard humanoid (typically male human in Starfleet uniform)',
      lifespan: 'Truly immortal, timeless, and indestructible',
      bloodChemistry: 'None; pure omnipotent energy / consciousness',
      distinctiveFeatures: [
        'Can assume any form, size, species, or appearance across the multiverse',
        'Accompanied by bright flashes of white light and thunderous musical chimes upon manifesting',
        'Capable of snapping fingers to alter reality, teleport starships, or rewrite timelines',
      ],
      physicalStrength: 'Infinite (Omnipotent)',
      sensoryTraits: 'Omniscient (Sees all past, present, future, and alternate timelines simultaneously)',
      uniqueBiology:
        'Not a biological entity in any conventional sense; possesses total mastery over matter, energy, time, space, and probability.',
    },
    biology:
      'The Q are immortal, omnipotent, and omniscient beings dwelling in the extra-dimensional Q Continuum. They do not age, sicken, or perish under standard physical laws. They can alter the universal gravitational constant, transport starships across millions of light-years with a gesture, and step between parallel timelines at will.',
    culture:
      'Because they have achieved everything, explored everything, and experienced everything, the Q Continuum suffered for eons from existential boredom and philosophical stagnation. A notable Q became obsessed with humanity, testing Captain Jean-Luc Picard, Captain Kathryn Janeway, and Commander Sisko to see if humanity had the potential to evolve beyond its primitive beginnings.',
    philosophy:
      'Perpetual evaluation of lesser species; testing the limits of mortal morality, imagination, and compassion.',
    language: 'Direct consciousness communication, fluent in every known language across the cosmos.',
    history: [
      'c. Pre-Cosmic: The Q exist beyond the Big Bang.',
      '2364: Q places humanity on trial at Farpoint Station, accusing the human race of being a "grievously savage child-race."',
      '2365: Q hurls the USS Enterprise-D across the galaxy to meet the Borg, preparing humanity for future threats.',
      '2370: Q guides Picard through the Anti-Time Anomaly, challenging him to expand his mind beyond linear constraints.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'Transcends technology (Can teleport starships anywhere in the universe instantaneously)',
      signatureTech: [
        'Reality alteration via mental command',
        'Temporal manipulation and timeline reconstruction',
        'Creation and destruction of solar systems at will',
      ],
      weaponry: 'Omnipotent cosmic manipulation (Q weapons manifest as supernovas in standard space)',
      defense: 'Absolute invulnerability to physical weaponry',
      propulsion: 'Instantaneous non-spatial relocation',
      techLevelSummary: 'Godlike Tier 0 Cosmic Civilization beyond technological classification.',
    },
    government: {
      name: 'The Q Continuum',
      structure: 'Collective cosmic consensus enforcing non-interference and continuum stability',
      rulingBody: 'The Q Collective',
      seatOfPower: 'The Q Continuum',
    },
    notableIndividuals: [
      {
        name: 'Q (John de Lancie)',
        title: 'Representative of the Continuum',
        era: '24th Century (TNG / DS9 / VOY / Picard)',
        summary: 'Flamboyant, theatrical, and deeply philosophical trickster entity fascinated by Captain Jean-Luc Picard.',
      },
      {
        name: 'Quinn',
        title: 'Dissident Q Philosopher',
        era: '24th Century (VOY - "Death Wish")',
        summary: 'Sought the right to end his immortal life, sparking a profound philosophical debate on freedom within the Continuum.',
      },
      {
        name: 'Amanda Rogers',
        title: 'Child of Q Raised as a Human',
        era: '24th Century (TNG - "True Q")',
        summary: 'Discovered her true heritage on Enterprise-D and chose to embrace her powers responsibly.',
      },
    ],
    relationshipWithFederation: {
      status: 'Neutral / Trade Partner',
      treaties: ['None; operates beyond mortal law'],
      summary: 'Perpetual cosmic adjudicators and tricksters; alternately tormentors, teachers, and guardians of humanity\'s potential.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Q Continuum — omnipotent, immortal entities existing beyond space and time.',
    },
    voiceBriefing: {
      quote: 'The trial never ends, Jean-Luc. Never.',
      speaker: 'Q',
      audioText: 'Species dossier: Q Continuum. Omnipotent, immortal entities from beyond standard space-time.',
    },
    tags: ['Q', 'Omnipotent', 'Picard', 'Continuum', 'Trial', 'Cosmic'],
  },

  // 16. THOLIANS
  {
    id: 'tholian',
    name: 'Tholians',
    nativeName: 'Tholian Assembly',
    popularityRank: 16,
    category: 'cosmic_unique',
    affiliation: 'Tholian Assembly',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Tholia',
      systemName: 'Tholian Sector',
      systemId: 'tholian_sector',
      coordinates: 'Alpha Quadrant · Grid 811 · Extreme High Temperature Zone',
      classification: 'Class-Y (Super-heated volcanic world, 480 Kelvin / 207°C)',
      climate: 'Superheated, molten surface with dense silicate atmosphere and intense tectonic activity.',
      description: 'Capital of the xenophobic, punctilious Tholian Assembly; totally inhospitable to humanoid life.',
    },
    physicalCharacteristics: {
      averageHeight: '1.5 m tall, 2.0 m wide multi-legged body',
      lifespan: 'Unknown (Presumed centuries due to crystalline structure)',
      bloodChemistry: 'Silicon-based mineral liquid lattice',
      distinctiveFeatures: [
        'Non-humanoid crystalline arachnoid body with six articulated legs',
        'Carapace glows with internal red, amber, and iridescent crystalline facets',
        'Radiates intense heat (requires temperatures above 400 K to survive)',
        'Fractures and perishes if exposed to standard humanoid room temperatures (290 K)',
      ],
      physicalStrength: 'Very high mineral durability',
      sensoryTraits: 'Subspace acoustic resonance and electromagnetic facet scanning',
      uniqueBiology:
        'Silicon-based biology: Bodily carapace is hard as mineral quartz; communicates through high-frequency acoustic clicks and subspace harmonics.',
    },
    biology:
      'The Tholians are non-humanoid, silicon-based crystalline arachnids. They thrive only in extreme thermal environments exceeding 400 Kelvin (127°C / 260°F). If ambient temperature drops significantly, their carapaces crack and shatter, killing them. Because of their radical physiology, they must wear bulky environmental suits or operate in heated mobile enclosures when interacting with humanoids.',
    culture:
      'Tholians are famous for two traits: extreme xenophobic territoriality and obsessive punctuality. They regard their territorial borders as sacred and tolerate zero intrusion. If an agreement or treaty specifies a deadline down to the second, they will open fire the instant that second expires.',
    philosophy:
      'Punctuality is absolute. Order must be preserved. Intruders into Tholian space will be encapsulated and purged.',
    language: 'High-frequency clicks, glass-like harmonic chirps, and subspace telemetry.',
    history: [
      '2152: Tholians attempt to capture the future Earth starship Enterprise NX-01 during the Temporal Cold War.',
      '2268: A Tholian vessel traps the USS Defiant NCC-1764 in interphase space; weaves a deadly energy web around Captain Kirk\'s Enterprise.',
      '2370s: The Tholian Assembly maintains cautious non-aggression treaties with both the Federation and the Dominion.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Compact, geometric triangular interceptors)',
      signatureTech: [
        'The Tholian Web: A lattice of interlocking energy filaments spun around enemy ships, crushing them upon completion',
        'Tetryon particle beam emitters',
        'Interphase rift detection systems',
      ],
      weaponry: 'Tholian energy web spinners, tetryon beam cannons, thermionic disruptors',
      defense: 'Crystalline polarization shielding, extreme thermal radiance',
      propulsion: 'High-efficiency sublight impulse and antimatter warp drive',
      techLevelSummary: 'Unique, highly specialized Tier 4 space power possessing unmatched energy containment technology.',
    },
    government: {
      name: 'Tholian Assembly',
      structure: 'Rigid collective crystalline oligarchy',
      rulingBody: 'The Assembly Council of Silk-Masters',
      seatOfPower: 'Tholia Central Hive Structure',
    },
    notableIndividuals: [
      {
        name: 'Commander Loskene',
        title: 'Captain of the Tholian Web Spinners',
        era: '23rd Century (TOS - "The Tholian Web")',
        summary: 'Punctilious commander who famously warned Captain Kirk that his time in Tholian space had expired.',
      },
    ],
    relationshipWithFederation: {
      status: 'Peace Treaty / Non-Aggression',
      treaties: ['Tholian-Federation Neutral Zone Accord of 2270'],
      summary: 'Strictly respected territorial boundaries; peaceful but intensely isolated and suspicious.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Tholians — silicon-based crystalline beings famous for spinning lethal energy webs.',
    },
    voiceBriefing: {
      quote: 'You have exceeded your allotted time. You will now be captured in the web.',
      speaker: 'Commander Loskene',
      audioText: 'Species dossier: Tholians. Homeworld: Tholia. Silicon-based non-humanoid species wielding the deadly Tholian Web.',
    },
    tags: ['Tholian', 'TholianWeb', 'Silicon', 'Crystalline', 'Loskene'],
  },

  // 17. BREEN
  {
    id: 'breen',
    name: 'Breen',
    nativeName: 'Breen',
    popularityRank: 17,
    category: 'rival_hostile',
    affiliation: 'Breen Confederacy',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Breen Homeworld',
      systemName: 'Breen System',
      systemId: 'breen_system',
      coordinates: 'Alpha Quadrant · Sector 014 · Deep Neutral Territory',
      classification: 'Class-M (Historically rumoured to be frozen; revealed as temperate and comfortable)',
      climate: 'Pleasant, temperate (the frozen world reputation was deliberately cultivated disinformation).',
      description: 'Capital of the secretive Breen Confederacy; protected by advanced cloaking and defense webs.',
    },
    physicalCharacteristics: {
      averageHeight: '1.75 m - 1.95 m',
      lifespan: 'Unknown (Presumed 100-140 standard years)',
      bloodChemistry: 'Lacks a conventional circulatory system; tissue operates through direct nutrient osmosis',
      distinctiveFeatures: [
        'Never seen without full-body refrigerated combat encounter suits with opaque snout-shaped faceplates',
        'Voice emanates as mechanical, modulated digital buzzing and screeching sounds',
        'Lack of conventional blood or vascular system',
      ],
      physicalStrength: 'Superior (approximately 2x human baseline)',
      sensoryTraits: 'Suit visor integrates multispectral thermal, ultraviolet, and subspace scanners',
      uniqueBiology:
        'Biologically comfortable in diverse temperatures despite wearing heavy refrigeration suits; physiological composition renders them immune to standard empathic and telepathic detection.',
    },
    biology:
      'The Breen remain one of the most enigmatic civilizations in known space. They wear heavy environmental suits equipped with helmet refrigeration units, concealing their facial features and bodies entirely. Post-mortem examinations reveal an absence of a traditional heart or vascular blood system, with organs bathed in osmotic fluid.',
    culture:
      'The Breen Confederacy is ruthless, expansionist, and governed by extreme operational secrecy. They do not maintain distinct social castes or emotional diplomacy with outsiders. During the Dominion War, the Breen joined the Dominion, launching a daring strike directly against Earth that devastated Starfleet Headquarters.',
    philosophy:
      '"Never turn your back on a Breen." Complete pragmatism, operational secrecy, and lethal surprise.',
    language: 'Electronic electronic buzzing, frequency-shifted screeching, and garbled vocal synthesizer tones.',
    history: [
      '2360s: Romulans and Klingons regard the Breen with immense caution; legendary Klingon proverb warns: "Never turn your back on a Breen."',
      '2375: The Breen Confederacy officially signs an alliance with the Dominion; their energy-dampening weapon renders Allied fleets helpless at the Battle of Chin\'toka.',
      '2375: Breen starships execute an unprecedented suicide run on Earth, inflicting severe damage on Starfleet Headquarters in San Francisco before being destroyed.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Organic/crystalline hull warship designs)',
      signatureTech: [
        'Energy-Dampening Weapon: Completely drains all starship power grids within seconds, leaving shields, phasers, and warp drives dead in space',
        'Refrigeration environmental suits with encrypted combat telemetry',
        'Biochemical cloaking lattices',
      ],
      weaponry: 'Energy-dampening beams, heavy disruptor cannons, torpedo arrays',
      defense: 'High-density ablative plating, immune to conventional shield drain',
      propulsion: 'Matter/antimatter warp drive with stealth shielding',
      techLevelSummary: 'Deadly Tier 4 space power possessing game-changing anti-power weapon systems.',
    },
    government: {
      name: 'Breen Confederacy',
      structure: 'Militaristic confederation governed by masked Primarchs',
      rulingBody: 'The Primarchs of the Breen',
      seatOfPower: 'Breen Prime',
    },
    notableIndividuals: [
      {
        name: 'Thot Pran',
        title: 'Breen Commander in the Alpha Quadrant',
        era: '24th Century (DS9)',
        summary: 'Commander who led the Breen fleet into alliance with the Female Changeling and Gul Dukat.',
      },
      {
        name: 'Thot Gor',
        title: 'Breen Supreme Emissary to the Dominion',
        era: '24th Century (DS9)',
        summary: 'Signed the Dominion treaty and oversaw the devastating assault on the Chin\'toka system.',
      },
    ],
    relationshipWithFederation: {
      status: 'Peace Treaty / Non-Aggression',
      treaties: ['Treaty of Bajor (2375)'],
      summary: 'Bitter wartime combatants who inflicted grave casualties on Earth; withdrawn behind sealed borders following the Dominion War.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Breen — armored, mysterious warriors wielding starship-disabling energy-dampening weapons.',
    },
    voiceBriefing: {
      quote: 'There is an old Klingon proverb: Never turn your back on a Breen.',
      speaker: 'General Martok',
      audioText: 'Species dossier: Breen Confederacy. Masked, secretive power wielding energy-dampening weapons that drain starship reactors.',
    },
    tags: ['Breen', 'Confederacy', 'EnergyDampener', 'Armor', 'DominionWar'],
  },

  // 18. TELLARITES
  {
    id: 'tellarite',
    name: 'Tellarites',
    nativeName: 'Tellarites',
    popularityRank: 18,
    category: 'federation',
    affiliation: 'United Federation of Planets',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Tellar Prime (Miracht)',
      systemName: 'Tellar System',
      systemId: 'tellar_system',
      coordinates: 'Alpha Quadrant · 61 Cygni · Sector 004',
      classification: 'Class-M (Rich peat marshes, mountain valleys, temperate)',
      climate: 'Damp, cool, mineral-rich mountain ranges and peat valleys.',
      description: 'Founding world of the Federation, renowned for shipyards, metallurgy, and vigorous debate.',
    },
    physicalCharacteristics: {
      averageHeight: '1.60 m - 1.75 m',
      lifespan: '110 - 130 standard years',
      bloodChemistry: 'Iron-based, dark red',
      distinctiveFeatures: [
        'Stocky, robust build with porcine facial features and snout',
        'Thick, bristly facial hair and beards',
        'Deep-set eyes and thick leathery skin resistant to physical cuts',
        'Hoof-like feet and thick, durable three-digit hands',
      ],
      physicalStrength: 'Superior (approximately 1.7x human baseline)',
      sensoryTraits: 'Exceptional olfactory and auditory perception',
      uniqueBiology:
        'Dense skeletal structure and low center of gravity; highly resilient against blunt physical impact and extreme atmospheric pressure shifts.',
    },
    biology:
      'Tellarites are stout, strong humanoids characterized by a porcine snout, thick facial hair, and dense bone structure. Their low center of gravity and leathery hide make them remarkably durable physical combatants. They evolved in mineral-heavy mountain highlands, resulting in exceptional pulmonary capacity and endurance.',
    culture:
      'Tellarite culture considers passionate argument, blunt criticism, and vigorous debate to be the highest form of social courtesy and respect. Politeness or compliments are viewed as insulting, cowardly, or deceitful. They are master engineers, stellar architects, and brilliant legal scholars.',
    philosophy:
      'Truth is forged in the furnace of debate. Speak bluntly; flattery is the weapon of the incompetent.',
    language: 'Tellarite language, spoken in forceful, raspy, energetic baritone cadences.',
    history: [
      '2154: Captain Jonathan Archer mediates the ancient border dispute between Tellarites and Andorians aboard Enterprise NX-01.',
      '2161: Tellar co-founds the United Federation of Planets alongside Earth, Vulcan, and Andoria.',
      '2268: Tellarite Ambassador Gav debates Sarek at the Babel Conference.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Renowned commercial and explorer hulls)',
      signatureTech: [
        'High-efficiency structural integrity field generators',
        'Deep-core planetary mining and mineral extraction lasers',
        'Reinforced duranium alloys and heavy industrial tractor beams',
      ],
      weaponry: 'Particle cannons and photon torpedo arrays',
      defense: 'High-density industrial deflector shielding',
      propulsion: 'Heavy-torque matter/antimatter warp drive',
      techLevelSummary: 'Founding Federation member providing industrial engineering, mining, and legal expertise.',
    },
    government: {
      name: 'Tellarite Parliamentary Assembly',
      structure: 'Direct democratic parliamentary debate congress',
      rulingBody: 'The Congress of Tellar',
      seatOfPower: 'Tellar Prime Central Council',
    },
    notableIndividuals: [
      {
        name: 'Ambassador Gral',
        title: 'Tellarite Diplomat to the Early Federation',
        era: '22nd Century (Enterprise)',
        summary: 'Fiery diplomat who overcame historical enmity with Andorians to help forge the Coalition of Planets.',
      },
      {
        name: 'Ambassador Gav',
        title: 'Tellarite Representative to Babel',
        era: '23rd Century (TOS - "Journey to Babel")',
        summary: 'Passionate advocate who challenged Sarek of Vulcan on the admission of Coridan to the Federation.',
      },
      {
        name: 'Dr. Noum',
        title: 'Chief Medical Officer / Starfleet Commander',
        era: '24th Century (Prodigy)',
        summary: 'Blunt, brilliant Tellarite physician aboard the USS Dauntless.',
      },
    ],
    relationshipWithFederation: {
      status: 'Founding Member',
      treaties: ['Articles of Federation (2161)'],
      summary: 'One of the four founding species of the Federation; provided the industrial and legal bedrock of Starfleet.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Tellarites — founding Federation members renowned for vigorous debate and master engineering.',
    },
    voiceBriefing: {
      quote: 'If you cannot defend your position under insult, your position is worthless!',
      speaker: 'Ambassador Gral',
      audioText: 'Species dossier: Tellarites. Homeworld: Tellar Prime. Founding member of the Federation, masters of debate and starship engineering.',
    },
    tags: ['Federation', 'Tellarite', 'Tellar', 'Debate', 'Engineer', 'FoundingMember'],
  },

  // 19. DENOBULANS
  {
    id: 'denobulan',
    name: 'Denobulans',
    nativeName: 'Denobulan',
    popularityRank: 19,
    category: 'federation',
    affiliation: 'United Federation of Planets',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Denobula Triaxa',
      systemName: 'Denobula System',
      coordinates: 'Alpha Quadrant · Sector 005',
      classification: 'Class-M (Densely populated, beautiful communal megacities)',
      climate: 'Mild, warm, lush vegetation with dense urban integration.',
      description: 'Cradle of Denobulan civilization, where billions live in harmonious, polyamorous extended family collectives.',
    },
    physicalCharacteristics: {
      averageHeight: '1.65 m - 1.85 m',
      lifespan: '140 - 180 standard years',
      bloodChemistry: 'Iron-based, dark red',
      distinctiveFeatures: [
        'Prominent vertical facial ridges running down the forehead and cheeks',
        'Remarkably elastic facial skin capable of expanding into a large defensive threat puffer-display',
        'Extraordinarily wide, open smile and expressive eyes',
        'Long, dark prehensile toenails useful for arboreal climbing',
      ],
      physicalStrength: 'Standard humanoid baseline with exceptional agility',
      sensoryTraits: 'Natural resistance to telepathic invasion and radiation poisoning',
      uniqueBiology:
        'Require only two to three days of hibernation sleep per year; during waking months, operate on almost zero rest; face inflates defensively when startled.',
    },
    biology:
      'Denobulans are gregarious humanoids possessing elastic facial musculature that can inflate into an intimidating puffer-fish display when threatened. Their metabolic cycle includes an annual hibernation of five to six days, during which they rest deeply; outside of this period, they function continuously on minimal rest. They possess natural biological resistance to telepathic coercion and nanovirus infection.',
    culture:
      'Denobulans are cheerful, polyamorous, and deeply communal. A typical Denobulan marriage consists of three husbands and three wives, each of whom may have other spouses, creating massive, loving, supportive extended family networks. Because Denobula is densely populated, personal boundaries are respected through voluntary discretion and genuine warmth rather than isolation.',
    philosophy:
      'Life is to be celebrated with curiosity, humor, and extended family love. There is no shame in honest human physiology.',
    language: 'Denobulan language, melodic and punctuated with expressive whistles and chuckles.',
    history: [
      '2151-2155: Dr. Phlox serves as Chief Medical Officer aboard the historic Enterprise NX-01 under Captain Jonathan Archer.',
      '2150s: Denobulan Interspecies Medical Exchange shares cutting-edge medical technologies with early Starfleet.',
      '22nd Century: Denobula integrates closely with the nascent United Federation of Planets.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Starfleet Level 4 standards)',
      signatureTech: [
        'The Interspecies Medical Exchange exobiological databases',
        'Advanced bio-containment fields and organic medical remedies',
        'High-density cellular regeneration pods',
      ],
      weaponry: 'Standard defensive phaser arrays',
      defense: 'Multiphasic shielding',
      propulsion: 'Matter/antimatter warp drive',
      techLevelSummary: 'Advanced medical and scientific pioneers contributing revolutionary therapies to Starfleet.',
    },
    government: {
      name: 'Denobulan Commonwealth',
      structure: 'Representative communal council of family syndicates',
      rulingBody: 'Denobulan Central Council',
      seatOfPower: 'Triaxa Central, Denobula',
    },
    notableIndividuals: [
      {
        name: 'Dr. Phlox',
        title: 'Chief Medical Officer, Enterprise NX-01',
        era: '22nd Century (Enterprise)',
        summary: 'Beloved, eccentric, and brilliant physician who utilized exotic live exobiological creatures to cure Starfleet crews.',
      },
      {
        name: 'Feezal Phlox',
        title: 'Astronomer & Denobulan Scientist',
        era: '22nd Century (Enterprise)',
        summary: 'Second wife of Dr. Phlox; pioneer of interspecies deep-space sensor telemetry.',
      },
    ],
    relationshipWithFederation: {
      status: 'Full Member',
      treaties: ['Articles of Federation'],
      summary: 'Trusted, warm Federation partners who established the foundations of Starfleet Xenobiology.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Denobulans — cheerful communal humanoids possessing defensive puffing facial elasticity.',
    },
    voiceBriefing: {
      quote: 'Optimism, Captain! A healthy smile can cure what medicine cannot reach.',
      speaker: 'Dr. Phlox',
      audioText: 'Species dossier: Denobulans. Homeworld: Denobula Triaxa. Warm, communal humanoids renowned for exobiological medical mastery.',
    },
    tags: ['Denobulan', 'Phlox', 'Enterprise', 'Medicine', 'Federation'],
  },

  // 20. ORIONS
  {
    id: 'orion',
    name: 'Orions',
    nativeName: 'Orions',
    popularityRank: 20,
    category: 'alpha_beta_powers',
    affiliation: 'Independent / Non-Aligned',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Orion',
      systemName: 'Orion System',
      coordinates: 'Alpha Quadrant · Rigel Sector · Grid 084',
      classification: 'Class-M (Vibrant desert and jungle world, ancient ruins)',
      climate: 'Warm, subtropical, rich spice trading harbors.',
      description: 'Capital of the ancient Orion civilization and shadow capital of the Orion Syndicate.',
    },
    physicalCharacteristics: {
      averageHeight: '1.65 m - 1.95 m',
      lifespan: '110 - 130 standard years',
      bloodChemistry: 'Copper-iron hybrid or iron-based, copper tinting skin emerald green',
      distinctiveFeatures: [
        'Vibrant emerald-green skin tone',
        'Dark or emerald hair, athletic physical build',
        'Females emit powerful pheromones capable of inducing hypnotic infatuation in males of most humanoid species',
      ],
      physicalStrength: 'Superior (approximately 1.3x human baseline)',
      sensoryTraits: 'Heightened olfactory receptors sensitive to chemical pheromones',
      uniqueBiology:
        'Orion females produce potent airborne pheromones that target humanoid neuro-transmitters, establishing powerful hypnotic dominance over males (Vulcans are typically immune through mental discipline).',
    },
    biology:
      'Orions are emerald-skinned humanoids renowned across the Alpha Quadrant for their physical beauty, cunning, and chemical pheromones. While historically presenting the illusion of a patriarchal culture where females were sold as "slave girls," the reality is the exact reverse: Orion society is a fierce matriarchy where the pheromone-wielding females subtly control the pirate cartels and political dynasties.',
    culture:
      'Orion society operates primarily through the Orion Syndicate—the largest, wealthiest, and most ruthless organized crime network in the Alpha and Beta Quadrants. They specialize in smuggling, illicit latinum trade, extortion, and starship piracy. Despite this criminal underworld, independent Orion scientists, merchants, and Starfleet officers also exist.',
    philosophy:
      'Profit, cunning, and independence. Never bow to foreign law; leverage every advantage nature has provided.',
    language: 'Orion language, spoken with melodic, purring undertones.',
    history: [
      '2254: Captain Christopher Pike encounters an illusion of an Orion slave girl created by the Talosians.',
      '2268: Orion operatives attempt to sabotage the Babel Conference aboard the USS Enterprise.',
      '2370s: The Orion Syndicate infiltrates Starfleet and the Federation, engaging in covert operations with Starfleet Intelligence.',
      '2380s: D\'Vana Tendi serves with honor aboard the USS Cerritos, demonstrating that Orions can be exemplary Starfleet officers.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Fast pirate corsairs, interceptors, and Syndicate Dreadnoughts)',
      signatureTech: [
        'Stealth transponder spoofers and sensor jammers',
        'High-output tractor beam snares',
        'Disruptor cannons and illegal plasma torpedo modifications',
      ],
      weaponry: 'Pirate pulse disruptors, ion snares, plasma mines',
      defense: 'Modified heavy deflector shielding and signature-scrambling cloaks',
      propulsion: 'Overclocked matter/antimatter warp drive',
      techLevelSummary: 'Resourceful spacefaring power utilizing heavily modified black-market technology.',
    },
    government: {
      name: 'The Orion Syndicate / Orion Matriarchy',
      structure: 'Secret matriarchal syndicate of crime bosses and merchant princes',
      rulingBody: 'The Orion Matriarchs & Syndicate Council',
      seatOfPower: 'Orion Prime',
    },
    notableIndividuals: [
      {
        name: 'D\'Vana Tendi',
        title: 'Science Officer / Lieutenant, USS Cerritos',
        era: '24th Century (Lower Decks)',
        summary: 'Enthusiastic, compassionate Starfleet officer who shattered stereotypes of Orion culture.',
      },
      {
        name: 'Gaila',
        title: 'Starfleet Academy Cadet',
        era: '23rd Century (Alternate Timeline)',
        summary: 'Orion cadet at Starfleet Academy whose connection to Kirk helped him take the Kobayashi Maru.',
      },
      {
        name: 'Vima',
        title: 'Syndicate Syndicate Boss',
        era: '24th Century (DS9)',
        summary: 'Powerful boss in the Syndicate hierarchy involved in espionage with Starfleet Intelligence.',
      },
    ],
    relationshipWithFederation: {
      status: 'Neutral / Trade Partner',
      treaties: ['No official state treaties; governed by interstellar anti-piracy maritime pacts'],
      summary: 'Complex relationship ranging from criminal syndicate smuggling rings to individual Starfleet officers of great distinction.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Orions — emerald-skinned civilization balancing ancient matriarchies with the galactic Syndicate.',
    },
    voiceBriefing: {
      quote: 'You think the men run Orion? You clearly have not been paying attention.',
      speaker: 'D\'Vana Tendi',
      audioText: 'Species dossier: Orions. Homeworld: Orion. Emerald-skinned humanoids possessing potent pheromonal capabilities.',
    },
    tags: ['Orion', 'Syndicate', 'Tendi', 'Green', 'Pheromones', 'AlphaQuadrant'],
  },

  // 21. BOLIANS
  {
    id: 'bolian',
    name: 'Bolians',
    nativeName: 'Bolians',
    popularityRank: 21,
    category: 'federation',
    affiliation: 'United Federation of Planets',
    quadrant: 'Alpha Quadrant',
    homeworld: {
      name: 'Bolarus IX',
      systemName: 'Bolian System',
      systemId: 'bolian_system',
      coordinates: 'Alpha Quadrant · Sector 421 · Grid 303',
      classification: 'Class-M (Temperate oceans, azure skies, gentle rolling plains)',
      climate: 'Temperate, mild, ocean breezes, mineral-rich soils.',
      description: 'Prosperous, peaceful Federation member world, home to the Bank of Bolias.',
    },
    physicalCharacteristics: {
      averageHeight: '1.65 m - 1.85 m',
      lifespan: '110 - 130 standard years',
      bloodChemistry: 'Cobalt-based, blue blood',
      distinctiveFeatures: [
        'Vibrant sky-blue or cerulean skin tone',
        'Prominent vertical bifurcation cartilage ridge dividing the face and skull into two halves',
        'Hairless scalp and eyebrows',
        'Corrosion-resistant digestive lining capable of consuming food that would kill other humanoids',
      ],
      physicalStrength: 'Standard humanoid baseline (1.0x human baseline)',
      sensoryTraits: 'Standard optical and auditory range',
      uniqueBiology:
        'Remarkable gastrointestinal lining that can safely ingest corroding acids, decomposing matter, and spoiled food without ill effect; tongue texture is coarse and ribbed.',
    },
    biology:
      'Bolians are blue-skinned, hairless humanoids distinguished by a prominent vertical cartilage ridge that splits the face down the midline from brow to chin. Their digestive tracts are lined with specialized protective enzymes capable of digesting materials hazardous to humans. Their tongue has an abrasive ribbed surface.',
    culture:
      'Bolians are sociable, talkative, cooperative, and deeply dedicated to public service. They are famously skilled barbers, bankers (the Bank of Bolias is famous across the quadrant), chefs, and Starfleet officers. Cooperative marriages involving multiple partners are common, reflecting their group-oriented social structure.',
    philosophy:
      'Cooperation, conversation, and collective prosperity. A problem shared is a problem solved.',
    language: 'Bolian language, rhythmic and lively.',
    history: [
      '23rd Century: First Contact with the Federation; formal treaties signed.',
      '2373: Captain Rixx commands the USS Pegasus and USS Thomas Paine; Bolians serve throughout Starfleet during the Dominion War.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'High Warp (Starfleet Level 4 standard)',
      signatureTech: [
        'Secure banking encryption matrices and vault shields',
        'Advanced exobiological digestive and enzyme filters',
        'High-yield warp plasma regulators',
      ],
      weaponry: 'Standard Starfleet phasers and torpedoes',
      defense: 'Multiphasic shielding',
      propulsion: 'Matter/antimatter warp drive',
      techLevelSummary: 'Enlightened Federation member contributing financial stability, diplomacy, and Starfleet personnel.',
    },
    government: {
      name: 'Bolian Republic',
      structure: 'Representative democratic commonwealth',
      rulingBody: 'The Bolian Senate & Bank of Bolias Board',
      seatOfPower: 'Bolarus Central City',
    },
    notableIndividuals: [
      {
        name: 'Captain Rixx',
        title: 'Captain of the USS Thomas Paine',
        era: '24th Century (TNG - "Conspiracy")',
        summary: 'Trusted friend of Captain Picard who warned him of the neural parasite infiltration in Starfleet Command.',
      },
      {
        name: 'Mr. Mot',
        title: 'Chief Barber, USS Enterprise-D',
        era: '24th Century (TNG)',
        summary: 'Chatty, beloved barber who frequently dispensed tactical advice to Captain Picard.',
      },
    ],
    relationshipWithFederation: {
      status: 'Full Member',
      treaties: ['Articles of Federation'],
      summary: 'Stalwart, cheerful, highly respected Federation member world.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'The Bolians — cerulean-skinned humanoids distinguished by a midline facial bifurcation.',
    },
    voiceBriefing: {
      quote: 'A fresh haircut and a sharp conversation solve half the galaxy\'s troubles.',
      speaker: 'Mr. Mot',
      audioText: 'Species dossier: Bolians. Homeworld: Bolarus IX. Blue-skinned Federation members renowned for finance, barbering, and service.',
    },
    tags: ['Bolian', 'Bolarus', 'Mot', 'Blue', 'Federation'],
  },

  // 22. SPECIES 8472
  {
    id: 'species_8472',
    name: 'Species 8472 (Undine)',
    nativeName: 'Undine',
    popularityRank: 22,
    category: 'delta_borg',
    affiliation: 'Independent / Non-Aligned',
    quadrant: 'Non-Spatial / Extra-dimensional',
    homeworld: {
      name: 'Fluidic Space',
      systemName: 'Fluidic Dimension',
      coordinates: 'Extragalactic / Non-spatial fluidic realm',
      classification: 'Pure organic fluidic universe',
      climate: 'Dense, nutrient-rich biological fluid without stars, planets, or vacuum.',
      description: 'An entire alternate dimension filled with continuous organic fluid, free of stars or cold vacuum.',
    },
    physicalCharacteristics: {
      averageHeight: '2.50 m - 3.20 m (Tripedal stance)',
      lifespan: 'Unknown (Presumed thousands of years due to genetic perfection)',
      bloodChemistry: 'Extremely dense triple-helix DNA with hyper-aggressive immune antibodies',
      distinctiveFeatures: [
        'Tripedal skeletal architecture with three legs, two arms, and a forward-thrusting torso',
        'Large, elongated head with piercing yellow compound eyes',
        'Dense, hairless grey-brown biomechanical hide',
        'Immunity to all known biological pathogens, nanoprobes, and energy scans',
      ],
      physicalStrength: 'Devastating (Capable of tearing through Borg armor with bare claws)',
      sensoryTraits: 'Direct telepathic subspace consciousness sensing thought across light-years',
      uniqueBiology:
        'Hyper-dense genetic structure destroys any foreign cell or nanoprobe instantly, rendering them completely immune to Borg assimilation; capable of morphing into humanoid shapes via genetic mimicry.',
    },
    biology:
      'Species 8472 resides in Fluidic Space—an alternate dimension filled entirely with organic fluid. Their triple-helix DNA is so densely encoded that their immune system destroys foreign matter, nanoprobes, and pathogens in microseconds. They do not use technology in a mechanical sense; their starships are living biological organisms sharing their exact genetic DNA.',
    culture:
      'Species 8472 viewed our galaxy as diseased and impure after the Borg invaded Fluidic Space to assimilate them. They launched a counter-invasion, destroying entire Borg star systems. Captain Janeway negotiated peace by proving that not all species in our universe are like the Borg.',
    philosophy:
      '"The weak will perish." Absolute biological purity, defensive vigilance, and preservation of Fluidic Space.',
    language: 'Subspace telepathic pulses and biological resonance.',
    history: [
      '2373: The Borg discover Fluidic Space and attempt to assimilate Species 8472; Species 8472 counter-attacks, decimating Borg fleets.',
      '2374: USS Voyager allies with the Borg, developing modified nanoprobes that halt the 8472 invasion.',
      '2375: Voyager encounters an 8472 staging facility disguised as Starfleet Academy on Earth; Janeway negotiates peaceful coexistence.',
    ],
    technologicalCapabilities: {
      warpDriveStatus: 'Quantum singularity slipstream biology (Bio-ships travel between dimensions)',
      signatureTech: [
        'Organic Bio-ships: Living starships grown from 8472 cells with devastating bio-beam weapons',
        'Planetary Destroyer Formation: Five Bio-ships linking beams can crack and incinerate an entire planet in seconds',
        'Dimensional rift generators',
      ],
      weaponry: 'Bio-plasmic energy beams, focused antiproton discharges',
      defense: 'Organic regenerative hull shields completely deflecting Borg and Federation phasers',
      propulsion: 'Fluidic slipstream drives',
      techLevelSummary: 'Supreme extra-dimensional biological superpower capable of annihilating the Borg Collective.',
    },
    government: {
      name: 'The Undine Collective Consciousness',
      structure: 'Unified telepathic consensus',
      rulingBody: 'The Undine Council of Elders',
      seatOfPower: 'Fluidic Space',
    },
    notableIndividuals: [
      {
        name: 'The Infiltrator (Boothby)',
        title: 'Commander of Terrasphere 8',
        era: '24th Century (VOY - "In the Flesh")',
        summary: 'Species 8472 leader disguised as Starfleet groundskeeper Boothby who agreed to a historic peace accord with Captain Janeway.',
      },
    ],
    relationshipWithFederation: {
      status: 'Peace Treaty / Non-Aggression',
      treaties: ['Voyager Peace Accord of 2375'],
      summary: 'Maintains peaceful non-aggression and isolation in Fluidic Space following diplomatic talks with Captain Janeway.',
    },
    images: {
      primary: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Enterprise_NCC-1701.jpg/500px-Enterprise_NCC-1701.jpg',
      caption: 'Species 8472 — tripedal extra-dimensional beings of genetic perfection residing in Fluidic Space.',
    },
    voiceBriefing: {
      quote: 'Your galaxy is a contamination. We will cleanse it.',
      speaker: 'Species 8472',
      audioText: 'Species dossier: Species 8472, the Undine. Originating from Fluidic Space. Possesses living bio-ships immune to Borg assimilation.',
    },
    tags: ['Species8472', 'Undine', 'FluidicSpace', 'Borg', 'BioShip', 'Voyager'],
  },
];

export const SPECIES_CATEGORIES = [
  { id: 'all', label: 'All Species', count: STAR_TREK_SPECIES.length },
  { id: 'federation', label: 'Federation Members', description: 'Founding worlds and member civilizations' },
  { id: 'alpha_beta_powers', label: 'Alpha & Beta Powers', description: 'Independent empires and merchant alliances' },
  { id: 'rival_hostile', label: 'Rivals & Empires', description: 'Klingon, Romulan, Cardassian, Gorn empires' },
  { id: 'gamma_dominion', label: 'The Dominion', description: 'Changelings, Jem\'Hadar, and Gamma Quadrant' },
  { id: 'delta_borg', label: 'Delta Quadrant & Borg', description: 'The Collective and Fluidic Space' },
  { id: 'cosmic_unique', label: 'Cosmic & Non-Humanoid', description: 'Q Continuum, Tholians, and higher entities' },
] as const;
