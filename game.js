// Game constants
const GRID_SIZE = 40;
const GRID_COLS = 18;
const GRID_ROWS = 14;
const CANVAS_WIDTH = GRID_COLS * GRID_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * GRID_SIZE + 120;

// Game state
let gameState = 'intro';
let gameMode = null; // 'relaxed' or 'challenging'
let speedMultiplier = 1; // 1 = normal, 2 = fast
let round = 1;
let gold = 150;
let baseHealth = 100;
let maxBaseHealth = 100;
let enemies = [];
let towers = [];
let traps = [];
let slowPuddles = []; // Sticky mine puddles that slow enemies
let projectiles = [];
let enemyProjectiles = [];
let particles = [];
let knights = [];
let enemiesSpawned = 0;
let enemiesThisRound = 0;
let buildTimer = 0;
let spawnTimer = 0;
let selectedTower = null;
let hoveredCell = null;
let deleteMode = false;
let upgradeMode = false;

// Sir Tut Tutorial System (Relaxed mode only)
let tutorialActive = false;
let tutorialStep = 0;
let tutorialQueue = [];
let sirTutVisible = false;
let sirTutX = -150; // Start off-screen left
let sirTutTargetX = 20; // Slide to this position
let sirTutSprite = null; // Will be loaded from image
let currentTutorialMessage = '';
let tutorialHighlights = []; // Array of {x, y, w, h, element} to highlight
let showNextButton = false;

// Tower upgrade system
const TIER_2_UNLOCK = 14;
const TIER_3_UNLOCK = 21;

// Sir Tut Tutorial Dialogues
const TUTORIAL_DIALOGUES = {
  welcome: [
    "Welcome to the Crystal Citadel. I am Sir Tut and I am here to help you along the way."
  ],
  artifact: [
    "The Crystal Citadel has uncovered a new magical artifact which has started to draw in some enemies who want to take the artifact for themselves. We must protect this at all costs."
  ],
  defenseOptions: [
    "We should look into building some defenses to protect ourselves against these new invaders. Below are some options for defenses. Each defense has its own unique defense type."
  ],
  enemyGold: [
    "Enemies often carry gold on them so slaying enemies should help fund new defense structures during times of rest between enemy waves."
  ],
  placeDefenses: [
    "The enemies should be arriving soon. You should start some construction of some defenses before they arrive. After selecting a defense, place it anywhere within the cobblestone area."
  ],
  deleteAndReady: [
    "If you need to remove a defense after placing it, you can use the delete button at the top. Be aware that you will not get a full gold return when you delete a defense. Select ready for next round when you have finished placing your defenses."
  ],
  afterFirstRound: [
    "Victory! Our castle survived the first wave!",
    "Notice the castle health bar at the top? It regenerates between rounds!",
    "Early rounds restore 20 HP, but this decreases as rounds progress. Protect the castle!"
  ],
  mageUnlock: [
    "Round 6! The Mage Tower is now unlocked!",
    "Mages fire chain lightning that jumps between enemies AND stuns them briefly!",
    "The stun freezes enemies in place. Perfect for crowd control!"
  ],
  barracksUnlock: [
    "Round 10! The Barracks are now available!",
    "Barracks spawn knights that fight enemies directly. They're mobile defenders!",
    "Knights stay within range of their barracks and attack any enemies nearby."
  ],
  upgradeUnlock: [
    "Round 14! Tower Upgrades are now available!",
    "Click the UPGRADE button (below Ready button) to upgrade existing towers!",
    "Upgrading increases damage, fire rate, and bonuses. Stars appear to show the tier!"
  ],
  stickyMineUnlock: [
    "Round 19! Sticky Mines are now unlocked!",
    "These mines create slowing puddles that last 10 seconds when triggered!",
    "Enemies that walk through are slowed by 60% for 4 seconds after leaving!"
  ],
  fireUnlock: [
    "Round 20! The Fire Tower is here!",
    "This powerful tower fires a continuous beam with no cooldown!",
    "At tier 3, it fires TWO beams simultaneously at different targets. Incredible damage!"
  ],
  tier3Unlock: [
    "Round 21! Maximum tier upgrades are now available!",
    "Your towers can now reach Tier 3 - their ultimate power level!",
    "Tier 3 towers show three gold stars and have incredible enhanced abilities!"
  ]
};

// Tutorial trigger conditions
const TUTORIAL_TRIGGERS = {
  welcome: () => tutorialActive && gameState === 'building' && round === 1 && tutorialQueue.length === 0,
  artifact: () => tutorialActive && round === 1 && tutorialQueue.includes('welcome') && !tutorialQueue.includes('artifact'),
  defenseOptions: () => tutorialActive && round === 1 && tutorialQueue.includes('artifact') && !tutorialQueue.includes('defenseOptions'),
  enemyGold: () => tutorialActive && round === 1 && tutorialQueue.includes('defenseOptions') && !tutorialQueue.includes('enemyGold'),
  placeDefenses: () => tutorialActive && round === 1 && tutorialQueue.includes('enemyGold') && !tutorialQueue.includes('placeDefenses'),
  deleteAndReady: () => tutorialActive && round === 1 && tutorialQueue.includes('placeDefenses') && !tutorialQueue.includes('deleteAndReady'),
  afterFirstRound: () => tutorialActive && round === 2 && gameState === 'building' && !tutorialQueue.includes('afterFirstRound'),
  mageUnlock: () => tutorialActive && round === 6 && gameState === 'building' && !tutorialQueue.includes('mageUnlock'),
  barracksUnlock: () => tutorialActive && round === 10 && gameState === 'building' && !tutorialQueue.includes('barracksUnlock'),
  upgradeUnlock: () => tutorialActive && round === 14 && gameState === 'building' && !tutorialQueue.includes('upgradeUnlock'),
  stickyMineUnlock: () => tutorialActive && round === 19 && gameState === 'building' && !tutorialQueue.includes('stickyMineUnlock'),
  fireUnlock: () => tutorialActive && round === 20 && gameState === 'building' && !tutorialQueue.includes('fireUnlock'),
  tier3Unlock: () => tutorialActive && round === 21 && gameState === 'building' && !tutorialQueue.includes('tier3Unlock')
};

// Tower types
const TOWER_TYPES = {
  archer: {
    name: 'Archer Tower',
    cost: 40,
    damage: 15,
    range: 150,
    fireRate: 30,
    projectileColor: [101, 67, 33],
    size: 1,
    upgrades: {
      tier2: { cost: 60, damage: 21, fireRate: 25 },
      tier3: { cost: 120, damage: 29, fireRate: 22 }
    }
  },
  mage: {
    name: 'Mage Tower',
    cost: 65,
    damage: 15,
    range: 200,
    fireRate: 50,
    projectileColor: [180, 220, 255],
    chainRadius: 120,
    chainMax: 3,
    unlockRound: 6,
    size: 2,
    upgrades: {
      tier2: { cost: 100, damage: 21, fireRate: 42, stunDuration: 18, chainMax: 4 },
      tier3: { cost: 200, damage: 29, fireRate: 36, stunDuration: 24, chainMax: 5 }
    }
  },
  barracks: {
    name: 'Barracks',
    cost: 350,
    unlockRound: 10,
    spawnCooldown: 600,
    maxKnights: 2,
    knightLeashRange: 5, // Knights stay within 5 tiles of barracks
    size: 3,
    upgrades: {
      tier2: { cost: 200, knightHealth: 196, knightDamage: 21, maxKnights: 3 },
      tier3: { cost: 400, knightHealth: 274, knightDamage: 29, maxKnights: 4 }
    }
  },
  turret: {
    name: '2x Archer',
    cost: 50,
    damage: 8,
    range: 100,
    fireRate: 16,
    projectileColor: [101, 67, 33],
    size: 1,
    upgrades: {
      tier2: { cost: 75, damage: 11, fireRate: 13 },
      tier3: { cost: 150, damage: 15, fireRate: 11 }
    }
  },
  mine: {
    name: 'Gold Mine',
    cost: 40,
    income: 5,
    size: 1
  },
  fire: {
    name: 'Fire Tower',
    cost: 800,
    damage: 70,
    dps: 70, // Continuous beam damage
    range: 200, // 5 blocks (5 * 40 = 200)
    unlockRound: 20,
    size: 2,
    upgrades: {
      tier2: { cost: 400, dps: 98 },
      tier3: { cost: 800, dps: 137 }
    }
  }
};

// Trap types (one-time use, trigger when enemy is close)
const TRAP_TYPES = {
  explosion: {
    name: 'Mine',
    cost: 15,
    triggerRadius: 42,
    damage: 55,
    blastRadius: 85,
    size: 1
  },
  sticky: {
    name: 'Sticky Mine',
    cost: 25,
    triggerRadius: 42,
    slowPercent: 0.60, // 60% speed reduction
    puddleDuration: 600, // 10 seconds at 60fps - puddle stays on ground
    debuffDuration: 240, // 4 seconds at 60fps - debuff lasts on enemy
    puddleSize: 2, // 2x2 grid area
    unlockRound: 19,
    size: 1
  }
};

// Check if a tower/trap type is unlocked for the current round
function isTowerUnlocked(type) {
  let data = TOWER_TYPES[type] || TRAP_TYPES[type];
  if (!data || data.unlockRound === undefined) return true;
  return round >= data.unlockRound;
}

// Tower button order: always-available first, then mage (round 6), then barracks (round 10)
const TOWER_BUTTON_ORDER = ['archer', 'turret', 'mine', 'explosion', 'sticky', 'mage', 'fire', 'barracks'];

// Base position (center, occupies 2x2 area in middle of even grid)
const baseX = Math.floor(GRID_COLS / 2) - 1; // For 18 cols: 9-1 = 8, so base at 8,9
const baseY = Math.floor(GRID_ROWS / 2) - 1; // For 14 rows: 7-1 = 6, so base at 6,7
const baseSize = 2; // Base occupies 2x2

// Sprite cache
let sprites = {};

// Preload Sir Tut sprite image
function preload() {
  // Try to load Sir Tut sprite, but don't block if it fails
  // The game will use a nice placeholder if the image isn't available
  try {
    // If you have sir_tut.png in the same folder, uncomment this:
    // sirTutSprite = loadImage('sir_tut.png');
  } catch (e) {
    console.log('Sir Tut sprite not found, using placeholder');
  }
}

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  frameRate(60);
  generateSprites();
  console.log('Game initialized! Press Play to start.');
}

function draw() {
  // Much darker grassy background
  background(30, 50, 28);
  
  // Calculate buildable area bounds (4 tiles from any edge of 2x2 base)
  let minBuildX = max(0, baseX - 4);
  let maxBuildX = min(GRID_COLS - 1, baseX + baseSize + 3);
  let minBuildY = max(0, baseY - 4);
  let maxBuildY = min(GRID_ROWS - 1, baseY + baseSize + 3);
  
  // Draw cobblestone in buildable area
  noStroke();
  for (let y = minBuildY; y <= maxBuildY; y++) {
    for (let x = minBuildX; x <= maxBuildX; x++) {
      // Check if this cell is actually buildable
      let withinRange = false;
      for (let by = 0; by < baseSize; by++) {
        for (let bx = 0; bx < baseSize; bx++) {
          let dx = abs(x - (baseX + bx));
          let dy = abs(y - (baseY + by));
          if (dx <= 4 && dy <= 4) {
            withinRange = true;
            break;
          }
        }
        if (withinRange) break;
      }
      
      if (withinRange) {
        // Cobblestone base color
        fill(85, 85, 90);
        rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        
        // Draw individual cobblestones (4x4 grid per cell)
        for (let cy = 0; cy < 2; cy++) {
          for (let cx = 0; cx < 2; cx++) {
            let stoneX = x * GRID_SIZE + cx * 20 + 2;
            let stoneY = y * GRID_SIZE + cy * 20 + 2;
            let stoneSize = 16;
            
            // Vary stone color slightly
            let variation = ((x + cx) * 7 + (y + cy) * 11) % 15 - 7;
            fill(75 + variation, 75 + variation, 80 + variation);
            
            // Rounded rectangle for cobblestone
            rect(stoneX, stoneY, stoneSize, stoneSize, 3);
            
            // Highlight on stone
            fill(95 + variation, 95 + variation, 100 + variation);
            rect(stoneX + 1, stoneY + 1, stoneSize - 2, stoneSize / 2, 2);
          }
        }
        
        // Grout/mortar lines
        stroke(60, 60, 65);
        strokeWeight(2);
        line(x * GRID_SIZE + 20, y * GRID_SIZE, x * GRID_SIZE + 20, y * GRID_SIZE + GRID_SIZE);
        line(x * GRID_SIZE, y * GRID_SIZE + 20, x * GRID_SIZE + GRID_SIZE, y * GRID_SIZE + 20);
        noStroke();
      }
    }
  }
  
  // Draw random grass pattern (only outside buildable area)
  for (let i = 0; i < 80; i++) {
    let x = (i * 123.456 + 50) % CANVAS_WIDTH;
    let y = ((i * 234.567 + 30) % (GRID_ROWS * GRID_SIZE));
    
    // Check if this grass tuft is in buildable area
    let gridX = floor(x / GRID_SIZE);
    let gridY = floor(y / GRID_SIZE);
    let inBuildArea = false;
    
    for (let by = 0; by < baseSize; by++) {
      for (let bx = 0; bx < baseSize; bx++) {
        let dx = abs(gridX - (baseX + bx));
        let dy = abs(gridY - (baseY + by));
        if (dx <= 4 && dy <= 4) {
          inBuildArea = true;
          break;
        }
      }
      if (inBuildArea) break;
    }
    
    if (!inBuildArea) {
      fill(35, 60, 32, 120);
      ellipse(x, y, 18, 10);
    }
  }
  
  // Additional grass layer for texture (only outside buildable area)
  for (let i = 0; i < 60; i++) {
    let x = (i * 345.678 + 100) % CANVAS_WIDTH;
    let y = ((i * 456.789 + 75) % (GRID_ROWS * GRID_SIZE));
    
    let gridX = floor(x / GRID_SIZE);
    let gridY = floor(y / GRID_SIZE);
    let inBuildArea = false;
    
    for (let by = 0; by < baseSize; by++) {
      for (let bx = 0; bx < baseSize; bx++) {
        let dx = abs(gridX - (baseX + bx));
        let dy = abs(gridY - (baseY + by));
        if (dx <= 4 && dy <= 4) {
          inBuildArea = true;
          break;
        }
      }
      if (inBuildArea) break;
    }
    
    if (!inBuildArea) {
      fill(40, 65, 35, 80);
      ellipse(x, y, 12, 7);
    }
  }
  
  // Draw bushes - better distributed using different seeds
  let bushPositions = [
    {x: 80, y: 60},
    {x: 520, y: 120},
    {x: 200, y: 380},
    {x: 450, y: 280},
    {x: 100, y: 250},
    {x: 570, y: 400},
    {x: 300, y: 100},
    {x: 380, y: 350},
    {x: 150, y: 420},
    {x: 500, y: 50}
  ];
  
  for (let bush of bushPositions) {
    let x = bush.x;
    let y = bush.y;
    
    // Check if bush is in buildable area
    let gridX = floor(x / GRID_SIZE);
    let gridY = floor(y / GRID_SIZE);
    let inBuildArea = false;
    
    for (let by = 0; by < baseSize; by++) {
      for (let bx = 0; bx < baseSize; bx++) {
        let dx = abs(gridX - (baseX + bx));
        let dy = abs(gridY - (baseY + by));
        if (dx <= 4 && dy <= 4) {
          inBuildArea = true;
          break;
        }
      }
      if (inBuildArea) break;
    }
    
    // Don't draw bushes in buildable area
    if (inBuildArea) continue;
    
    // Dark bush base
    fill(30, 55, 28);
    ellipse(x, y + 5, 28, 22);
    // Medium bush layer
    fill(38, 65, 35);
    ellipse(x - 6, y, 22, 20);
    ellipse(x + 6, y, 22, 20);
    // Lighter bush top
    fill(45, 75, 42);
    ellipse(x, y - 3, 20, 18);
    // Highlight
    fill(52, 82, 48);
    ellipse(x - 2, y - 5, 12, 10);
  }
  
  // Subtle stars/sparkles in background (during night time)
  if (round % 3 === 0 || gameState === 'intro') {
    for (let i = 0; i < 20; i++) {
      let x = (frameCount * 0.1 + i * 123.456) % CANVAS_WIDTH;
      let y = (i * 234.567) % (GRID_ROWS * GRID_SIZE);
      let twinkle = abs(sin(frameCount * 0.05 + i));
      fill(255, 255, 255, twinkle * 150);
      noStroke();
      ellipse(x, y, 2, 2);
    }
  }
  
  // Handle intro screen
  if (gameState === 'intro') {
    drawIntroScreen();
    return;
  }
  
  // Draw build range overlay (during build phase only)
  if (gameState === 'building') {
    drawBuildRangeOverlay();
  }
  
  // Draw grid
  drawGrid();
  
  // Draw base
  drawBase();
  
  // Draw slow puddles from sticky mines
  for (let puddle of slowPuddles) {
    drawSlowPuddle(puddle);
  }
  
  // Draw towers
  for (let tower of towers) {
    drawTower(tower);
  }

  // Draw traps
  for (let trap of traps) {
    drawTrap(trap);
  }

  // Draw enemies
  for (let enemy of enemies) {
    drawEnemy(enemy);
  }
  
  // Draw knights
  for (let knight of knights) {
    drawKnight(knight);
  }
  
  // Draw projectiles
  for (let proj of projectiles) {
    drawProjectile(proj);
  }
  
  // Draw enemy projectiles (arrows, fireballs)
  for (let ep of enemyProjectiles) {
    drawEnemyProjectile(ep);
  }
  
  // Draw particles
  for (let particle of particles) {
    drawParticle(particle);
  }
  
  // Draw base health bar ON TOP of everything
  drawBaseHealthBar();
  
  // Draw speed control button (bottom right of battlefield)
  drawSpeedButton();
  
  // Draw hover effect
  if (selectedTower && hoveredCell) {
    drawPlacementPreview();
  }
  
  // Crystal counter (top-right, over game area)
  drawCrystalCounter();
  
  // Update game state
  if (gameState === 'playing') {
    updatePlaying();
  } else if (gameState === 'building') {
    updateBuilding();
  }
  
  // Update tutorial system (Relaxed mode only)
  if (tutorialActive) {
    updateTutorial();
  }
  
  // Draw UI
  drawUI();
  
  // Draw tutorial (on top of everything)
  if (tutorialActive) {
    drawTutorial();
  }
  
  // Clean up
  enemies = enemies.filter(e => e.health > 0);
  projectiles = projectiles.filter(p => !p.hit);
  enemyProjectiles = enemyProjectiles.filter(ep => !ep.hit);
  particles = particles.filter(p => p.life > 0);
  knights = knights.filter(k => k.health > 0);
}

function generateSprites() {
  sprites.base = createBaseSprite();
  sprites.archer = createArcherSprite();
  sprites.mage = createMageSprite();
  sprites.fire = createFireTowerSprite();
  sprites.barracks = createBarracksSprite();
  sprites.turret = createTurretSprite();
  sprites.mine = createMineSprite();
  sprites.trap = createTrapSprite();
  sprites.stickyTrap = createStickyTrapSprite();
  sprites.goblin = createGoblinSprite();
  sprites.orc = createOrcSprite();
  sprites.demon = createDemonSprite();
  sprites.bowman = createBowmanSprite();
  sprites.warlock = createWarlockSprite();
  sprites.knight = createKnightSprite();
  sprites.goblinKing = createGoblinKingSprite();
  sprites.demonLord = createDemonLordSprite();
  sprites.troll = createTrollSprite();
  sprites.drake = createDrakeSprite();
  sprites.giant = createGiantSprite();
}

function createBaseSprite() {
  let g = createGraphics(80, 80);
  g.noStroke();
  
  // Castle foundation
  g.fill(100, 100, 110);
  g.rect(10, 65, 60, 14);
  g.fill(80, 80, 90);
  g.rect(10, 65, 60, 3);
  
  // Main castle walls
  g.fill(140, 130, 120);
  g.rect(15, 35, 50, 32);
  
  // Castle battlements (top of walls)
  g.fill(120, 110, 100);
  for (let i = 0; i < 6; i++) {
    g.rect(15 + i * 10, 30, 6, 8);
  }
  
  // Central tower (taller)
  g.fill(130, 120, 110);
  g.rect(30, 15, 20, 52);
  
  // Tower battlements
  g.fill(110, 100, 90);
  g.rect(30, 10, 4, 8);
  g.rect(38, 10, 4, 8);
  g.rect(46, 10, 4, 8);
  
  // Pointed tower roof
  g.fill(100, 50, 40);
  g.triangle(28, 15, 52, 15, 40, 3);
  g.fill(120, 60, 45);
  g.triangle(30, 15, 40, 5, 40, 3);
  
  // Windows with glowing light
  g.fill(255, 220, 100, 200);
  g.rect(36, 22, 8, 10);
  g.rect(36, 38, 8, 10);
  g.rect(36, 54, 8, 10);
  g.fill(255, 240, 150);
  g.rect(37, 23, 6, 8);
  g.rect(37, 39, 6, 8);
  
  // Side windows
  g.fill(255, 220, 100, 150);
  g.rect(19, 45, 6, 8);
  g.rect(55, 45, 6, 8);
  
  // Main gate
  g.fill(60, 50, 45);
  g.rect(34, 58, 12, 9);
  g.fill(80, 65, 60);
  g.arc(40, 58, 12, 10, PI, TWO_PI);
  
  // Gate details (wood planks)
  g.fill(50, 40, 35);
  g.rect(34, 59, 12, 2);
  g.rect(34, 63, 12, 2);
  
  // Flag on tower
  g.fill(100, 100, 110);
  g.rect(38, 3, 3, 14);
  g.fill(200, 50, 60);
  g.triangle(41, 5, 41, 12, 50, 8.5);
  
  // Stone texture lines on walls
  g.fill(120, 115, 110);
  for (let y = 40; y < 67; y += 8) {
    g.rect(15, y, 50, 1);
  }
  
  // Stone blocks on tower
  for (let y = 20; y < 67; y += 8) {
    g.rect(30, y, 20, 1);
  }
  
  return g;
}

function createArcherSprite() {
  let g = createGraphics(30, 35);
  g.noStroke();
  
  // Stone platform
  g.fill(100, 100, 110);
  g.rect(3, 26, 24, 8);
  g.fill(80, 80, 90);
  g.rect(3, 26, 24, 2);
  
  // Wooden tower base
  g.fill(101, 67, 33);
  g.rect(6, 18, 18, 10);
  g.fill(80, 50, 25);
  g.rect(6, 18, 2, 10);
  g.rect(22, 18, 2, 10);
  
  // Archer figure
  g.fill(139, 90, 60);
  g.ellipse(15, 14, 6, 7);
  g.fill(80, 60, 100);
  g.rect(12, 16, 6, 6);
  
  // Bow
  g.noFill();
  g.stroke(101, 67, 33);
  g.strokeWeight(1.5);
  g.arc(19, 14, 8, 10, -HALF_PI, HALF_PI);
  g.stroke(200, 200, 180);
  g.strokeWeight(0.5);
  g.line(19, 9, 19, 19);
  
  // Quiver with arrows
  g.noStroke();
  g.fill(80, 50, 30);
  g.rect(10, 16, 3, 5);
  g.fill(180, 160, 140);
  g.triangle(10.5, 16, 11, 15, 11.5, 16);
  g.triangle(11.5, 16, 12, 15, 12.5, 16);
  
  return g;
}

function createMageSprite() {
  let g = createGraphics(60, 80);
  g.noStroke();
  
  // Stone platform (larger)
  g.fill(100, 100, 110);
  g.rect(6, 64, 48, 14);
  g.fill(80, 80, 90);
  g.rect(6, 64, 48, 4);
  
  // Purple tower base with mystical patterns (larger)
  g.fill(80, 40, 100);
  g.rect(14, 44, 32, 24);
  g.fill(100, 50, 120);
  g.rect(16, 46, 4, 20);
  g.rect(40, 46, 4, 20);
  
  // Mage figure in robe (larger)
  g.fill(138, 43, 226);
  g.ellipse(30, 32, 20, 24);
  g.triangle(20, 44, 40, 44, 30, 56);
  
  // Wizard hat (larger)
  g.fill(100, 30, 140);
  g.triangle(22, 32, 38, 32, 30, 12);
  g.ellipse(30, 32, 20, 8);
  
  // Crystal ball with glow (larger)
  g.fill(180, 220, 255, 200);
  g.ellipse(30, 6, 16, 16);
  g.fill(200, 240, 255);
  g.ellipse(30, 6, 10, 10);
  g.fill(255, 255, 255, 200);
  g.ellipse(28, 4, 4, 4);
  
  // Magical sparkles (larger)
  g.fill(200, 100, 255, 150);
  g.ellipse(18, 16, 4, 4);
  g.ellipse(42, 20, 4, 4);
  g.ellipse(24, 24, 3, 3);
  
  // Additional mystical details
  g.fill(150, 80, 180, 120);
  g.ellipse(30, 30, 28, 35);
  
  return g;
}

function createFireTowerSprite() {
  let g = createGraphics(60, 80);
  g.noStroke();
  
  // Stone platform
  g.fill(80, 60, 60);
  g.rect(6, 64, 48, 14);
  g.fill(60, 40, 40);
  g.rect(6, 64, 48, 4);
  
  // Dark red tower base with flame patterns
  g.fill(120, 40, 40);
  g.rect(14, 44, 32, 24);
  g.fill(140, 50, 50);
  g.rect(16, 46, 4, 20);
  g.rect(40, 46, 4, 20);
  
  // Flame pattern details on base
  g.fill(200, 80, 40, 150);
  g.triangle(18, 62, 22, 62, 20, 54);
  g.triangle(26, 62, 30, 62, 28, 56);
  g.triangle(34, 62, 38, 62, 36, 54);
  
  // Fire mage figure in red/orange robe
  g.fill(200, 60, 40);
  g.ellipse(30, 32, 20, 24);
  g.triangle(20, 44, 40, 44, 30, 56);
  
  // Hood with flame accent
  g.fill(140, 40, 30);
  g.triangle(22, 32, 38, 32, 30, 12);
  g.ellipse(30, 32, 20, 8);
  
  // Glowing flame orb (instead of crystal ball)
  g.fill(255, 150, 50, 220);
  g.ellipse(30, 6, 18, 18);
  g.fill(255, 200, 80, 200);
  g.ellipse(30, 6, 13, 13);
  g.fill(255, 255, 150, 200);
  g.ellipse(30, 6, 8, 8);
  g.fill(255, 255, 200);
  g.ellipse(28, 4, 4, 4);
  
  // Flame sparkles
  g.fill(255, 150, 50, 180);
  g.ellipse(18, 14, 5, 5);
  g.ellipse(42, 18, 5, 5);
  g.ellipse(24, 22, 4, 4);
  
  // Fire aura glow
  g.fill(255, 100, 40, 100);
  g.ellipse(30, 30, 32, 40);
  
  // Embers rising from base
  for (let i = 0; i < 6; i++) {
    let x = 20 + i * 4;
    let y = 40 + random(-3, 3);
    g.fill(255, 150, 50, random(100, 180));
    g.ellipse(x, y, 2, 3);
  }
  
  return g;
}

function createBarracksSprite() {
  let g = createGraphics(90, 95);
  g.noStroke();
  
  // Stone foundation (larger)
  g.fill(100, 100, 110);
  g.rect(6, 78, 78, 16);
  g.fill(80, 80, 90);
  g.rect(6, 78, 78, 4);
  
  // Wooden barracks building (much larger)
  g.fill(101, 67, 33);
  g.rect(12, 42, 66, 40);
  g.fill(120, 80, 50);
  g.rect(18, 48, 54, 30);
  
  // Roof (larger)
  g.fill(120, 60, 40);
  g.triangle(9, 42, 81, 42, 45, 18);
  g.fill(100, 50, 35);
  g.triangle(15, 42, 45, 24, 45, 18);
  
  // Door/entrance (larger)
  g.fill(60, 45, 35);
  g.rect(33, 54, 24, 28);
  g.fill(80, 60, 50);
  g.arc(45, 54, 24, 24, PI, TWO_PI);
  
  // Windows on sides (larger)
  g.fill(80, 70, 60);
  g.rect(20, 52, 10, 10);
  g.rect(60, 52, 10, 10);
  g.rect(20, 66, 10, 10);
  g.rect(60, 66, 10, 10);
  
  // Training dummy or weapon rack (larger)
  g.fill(80, 80, 85);
  g.rect(22, 30, 5, 16);
  g.fill(180, 185, 190);
  g.rect(19, 30, 10, 5);
  
  // Flag on roof (larger)
  g.fill(140, 140, 145);
  g.rect(42, 12, 6, 24);
  g.fill(200, 50, 60);
  g.triangle(48, 15, 48, 27, 66, 21);
  
  // Stone blocks detail (larger)
  g.fill(90, 90, 100);
  for (let i = 0; i < 5; i++) {
    g.rect(12 + i * 13, 42, 12, 2);
  }
  
  // Shield decorations on walls
  g.fill(180, 180, 200);
  g.ellipse(25, 58, 6, 8);
  g.ellipse(65, 58, 6, 8);
  g.fill(200, 60, 70);
  g.ellipse(25, 58, 4, 6);
  g.ellipse(65, 58, 4, 6);
  
  // Torch holders
  g.fill(80, 60, 50);
  g.rect(16, 50, 3, 8);
  g.rect(71, 50, 3, 8);
  g.fill(255, 150, 50, 180);
  g.ellipse(17.5, 48, 5, 5);
  g.ellipse(72.5, 48, 5, 5);
  
  return g;
}

function createTurretSprite() {
  let g = createGraphics(30, 36);
  g.noStroke();

  // Stone platform
  g.fill(100, 100, 110);
  g.rect(2, 29, 26, 6);
  g.fill(80, 80, 90);
  g.rect(2, 29, 26, 2);

  // Wooden tower base
  g.fill(101, 67, 33);
  g.rect(5, 18, 20, 12);
  g.fill(80, 50, 25);
  g.rect(5, 18, 2, 12);
  g.rect(23, 18, 2, 12);
  
  // Platform top
  g.fill(90, 60, 40);
  g.rect(3, 16, 24, 3);

  // Left archer
  g.fill(80, 60, 100);
  g.rect(8, 10, 4, 6);
  g.fill(100, 80, 120);
  g.ellipse(10, 8, 4, 5);
  
  // Right archer
  g.fill(80, 60, 100);
  g.rect(18, 10, 4, 6);
  g.fill(100, 80, 120);
  g.ellipse(20, 8, 4, 5);
  
  // Left bow
  g.noFill();
  g.stroke(101, 67, 33);
  g.strokeWeight(1);
  g.arc(12, 11, 4, 5, -HALF_PI, HALF_PI);
  
  // Right bow
  g.arc(18, 11, 4, 5, -HALF_PI, HALF_PI);
  
  // Quivers
  g.noStroke();
  g.fill(80, 50, 30);
  g.rect(9, 11, 2, 3);
  g.rect(19, 11, 2, 3);
  
  // Arrows in quivers
  g.fill(180, 160, 140);
  g.triangle(9.5, 11, 10, 10, 10.5, 11);
  g.triangle(19.5, 11, 20, 10, 20.5, 11);
  
  // Tower support beams
  g.fill(70, 50, 30);
  g.rect(7, 18, 2, 12);
  g.rect(21, 18, 2, 12);
  
  return g;
}

function createTrapSprite() {
  let g = createGraphics(28, 28);
  g.noStroke();

  // Ground plate/shadow
  g.fill(30, 30, 35);
  g.ellipse(14, 17, 24, 8);

  // Metal casing with rivets
  g.fill(70, 70, 75);
  g.ellipse(14, 14, 20, 10);
  g.fill(90, 90, 95);
  g.ellipse(6, 14, 2, 2);
  g.ellipse(22, 14, 2, 2);
  g.ellipse(14, 11, 2, 2);
  g.ellipse(14, 17, 2, 2);
  
  // Danger markings (yellow/black stripes)
  g.fill(255, 220, 0);
  g.arc(14, 14, 18, 9, -0.3, 0.3);
  g.arc(14, 14, 18, 9, PI - 0.3, PI + 0.3);
  g.fill(50, 50, 50);
  g.arc(14, 14, 18, 9, 0.3, 0.8);
  g.arc(14, 14, 18, 9, PI + 0.3, PI + 0.8);

  // Central explosive core with glow
  g.fill(255, 80, 40, 220);
  g.ellipse(14, 14, 10, 10);
  g.fill(255, 120, 60, 180);
  g.ellipse(14, 14, 7, 7);
  g.fill(255, 180, 100);
  g.ellipse(14, 14, 4, 4);
  
  // Hot spot highlight
  g.fill(255, 255, 200, 200);
  g.ellipse(13, 13, 2, 2);
  
  // Pulsing danger glow
  g.fill(255, 100, 40, 60);
  g.ellipse(14, 14, 16, 16);
  
  // Activation lights
  g.fill(255, 0, 0, 200);
  g.ellipse(10, 10, 2, 2);
  g.ellipse(18, 10, 2, 2);
  g.ellipse(10, 18, 2, 2);
  g.ellipse(18, 18, 2, 2);

  return g;
}

function createStickyTrapSprite() {
  let g = createGraphics(28, 28);
  g.noStroke();

  // Ground plate/shadow
  g.fill(30, 30, 35);
  g.ellipse(14, 17, 24, 8);

  // Metal casing with rivets
  g.fill(70, 70, 75);
  g.ellipse(14, 14, 20, 10);
  g.fill(90, 90, 95);
  g.ellipse(6, 14, 2, 2);
  g.ellipse(22, 14, 2, 2);
  g.ellipse(14, 11, 2, 2);
  g.ellipse(14, 17, 2, 2);
  
  // Green warning markings (instead of yellow)
  g.fill(100, 255, 100);
  g.arc(14, 14, 18, 9, -0.3, 0.3);
  g.arc(14, 14, 18, 9, PI - 0.3, PI + 0.3);
  g.fill(50, 50, 50);
  g.arc(14, 14, 18, 9, 0.3, 0.8);
  g.arc(14, 14, 18, 9, PI + 0.3, PI + 0.8);

  // Central sticky core with glow (green)
  g.fill(50, 200, 80, 220);
  g.ellipse(14, 14, 10, 10);
  g.fill(80, 220, 100, 180);
  g.ellipse(14, 14, 7, 7);
  g.fill(150, 255, 150);
  g.ellipse(14, 14, 4, 4);
  
  // Highlight
  g.fill(200, 255, 200, 200);
  g.ellipse(13, 13, 2, 2);
  
  // Pulsing glow (green)
  g.fill(80, 220, 100, 60);
  g.ellipse(14, 14, 16, 16);
  
  // Activation lights (green)
  g.fill(100, 255, 100, 200);
  g.ellipse(10, 10, 2, 2);
  g.ellipse(18, 10, 2, 2);
  g.ellipse(10, 18, 2, 2);
  g.ellipse(18, 18, 2, 2);

  return g;
}

function createMineSprite() {
  let g = createGraphics(25, 25);
  g.noStroke();
  
  // Dark stone/cave entrance
  g.fill(40, 40, 50);
  g.arc(12.5, 18, 20, 16, PI, TWO_PI);
  
  // Cave opening (darker)
  g.fill(20, 20, 30);
  g.arc(12.5, 18, 16, 12, PI, TWO_PI);
  
  // Wooden support beams
  g.fill(80, 60, 50);
  g.rect(4, 10, 3, 12);
  g.rect(18, 10, 3, 12);
  g.rect(4, 10, 17, 3);
  
  // Mine cart with gold
  g.fill(60, 50, 45);
  g.rect(8, 16, 9, 5);
  
  // Gold ore in cart (bright yellow/gold)
  g.fill(255, 215, 0);
  g.ellipse(10, 16, 3, 3);
  g.ellipse(13, 16, 4, 4);
  g.ellipse(15, 16, 3, 3);
  
  // Gold ore highlights
  g.fill(255, 240, 150);
  g.ellipse(13, 15.5, 2, 2);
  g.ellipse(10, 15.5, 1.5, 1.5);
  
  // Gold nuggets scattered on ground
  g.fill(255, 215, 0);
  g.ellipse(6, 20, 2, 2);
  g.ellipse(19, 20, 2.5, 2.5);
  g.ellipse(11, 21, 1.5, 1.5);
  
  // Gold highlights on ground
  g.fill(255, 240, 150, 200);
  g.ellipse(6, 19.5, 1, 1);
  g.ellipse(19, 19.5, 1.5, 1.5);
  
  // Gold glimmer sparkles
  g.fill(255, 255, 200, 180);
  g.ellipse(7, 17, 1.5, 1.5);
  g.ellipse(14, 15, 1, 1);
  g.ellipse(18, 19, 1, 1);
  
  // Cart wheels
  g.fill(40, 40, 40);
  g.ellipse(9, 21, 3, 3);
  g.ellipse(16, 21, 3, 3);
  
  // Pickaxe leaning on side
  g.fill(80, 60, 50);
  g.rect(19, 13, 2, 8);
  g.fill(100, 100, 110);
  g.beginShape();
  g.vertex(19, 13);
  g.vertex(21, 13);
  g.vertex(20, 10);
  g.endShape(CLOSE);
  
  return g;
}

function createGoblinSprite() {
  let g = createGraphics(20, 25);
  g.noStroke();
  
  // Legs
  g.fill(100, 150, 60);
  g.rect(6, 18, 3, 7);
  g.rect(11, 18, 3, 7);
  
  // Body with ragged armor
  g.fill(80, 70, 60);
  g.ellipse(10, 16, 13, 11);
  g.fill(100, 150, 60);
  g.ellipse(10, 16, 11, 9);
  
  // Arms
  g.fill(120, 170, 80);
  g.ellipse(5, 16, 4, 8);
  g.ellipse(15, 16, 4, 8);
  
  // Head
  g.fill(120, 170, 80);
  g.ellipse(10, 10, 11, 13);
  
  // Large pointed ears
  g.fill(100, 150, 60);
  g.triangle(4, 8, 2, 10, 4, 12);
  g.triangle(16, 8, 18, 10, 16, 12);
  
  // Evil red eyes
  g.fill(255, 50, 50);
  g.ellipse(8, 9, 3, 3);
  g.ellipse(12, 9, 3, 3);
  g.fill(150, 0, 0);
  g.ellipse(8, 9, 1.5, 1.5);
  g.ellipse(12, 9, 1.5, 1.5);
  
  // Nasty grin
  g.fill(80, 100, 50);
  g.arc(10, 12, 6, 4, 0, PI);
  
  // Small fangs
  g.fill(220, 220, 200);
  g.rect(8, 12, 1, 2);
  g.rect(11, 12, 1, 2);
  
  return g;
}

function createOrcSprite() {
  let g = createGraphics(25, 30);
  g.noStroke();
  
  // Thick legs with boots
  g.fill(60, 60, 70);
  g.rect(7, 24, 4, 6);
  g.rect(14, 24, 4, 6);
  g.fill(80, 120, 60);
  g.rect(7, 18, 4, 8);
  g.rect(14, 18, 4, 8);
  
  // Muscular body with armor
  g.fill(100, 100, 110);
  g.rect(7, 16, 11, 10);
  g.fill(80, 120, 60);
  g.ellipse(12.5, 18, 14, 12);
  
  // Strong arms
  g.fill(100, 140, 80);
  g.ellipse(5, 19, 5, 10);
  g.ellipse(20, 19, 5, 10);
  
  // Large head
  g.fill(100, 140, 80);
  g.ellipse(12.5, 12, 15, 16);
  
  // Fierce red eyes
  g.fill(200, 50, 50);
  g.ellipse(9, 11, 4, 4);
  g.ellipse(16, 11, 4, 4);
  g.fill(255, 100, 100);
  g.ellipse(9, 10.5, 2, 2);
  g.ellipse(16, 10.5, 2, 2);
  
  // Large tusks
  g.fill(220, 220, 200);
  g.beginShape();
  g.vertex(8, 15);
  g.vertex(9, 18);
  g.vertex(10, 15);
  g.endShape(CLOSE);
  g.beginShape();
  g.vertex(15, 15);
  g.vertex(16, 18);
  g.vertex(17, 15);
  g.endShape(CLOSE);
  
  // Scar across face
  g.stroke(70, 100, 60);
  g.strokeWeight(1);
  g.line(7, 10, 13, 14);
  
  // Helmet/armor piece
  g.noStroke();
  g.fill(100, 100, 100);
  g.ellipse(12.5, 8, 12, 6);
  g.fill(80, 80, 80);
  g.ellipse(12.5, 8, 10, 4);
  
  return g;
}

function createDemonSprite() {
  let g = createGraphics(30, 35);
  g.noStroke();
  
  // Dark shadow
  g.fill(40, 20, 20, 100);
  g.ellipse(15, 33, 26, 8);
  
  // Legs with dark armor plating
  g.fill(80, 30, 30);
  g.rect(8, 26, 5, 9);
  g.rect(17, 26, 5, 9);
  g.fill(60, 20, 20);
  g.rect(8, 26, 5, 3);
  g.rect(17, 26, 5, 3);
  
  // Clawed feet
  g.fill(100, 20, 20);
  g.triangle(8, 35, 10, 35, 7, 37);
  g.triangle(10, 35, 12, 35, 11, 37);
  g.triangle(17, 35, 19, 35, 16, 37);
  g.triangle(19, 35, 21, 35, 20, 37);
  
  // Powerful armored body
  g.fill(100, 35, 35);
  g.ellipse(15, 22, 18, 16);
  g.fill(120, 40, 40);
  g.ellipse(15, 22, 15, 13);
  
  // Armored chest plate with spikes
  g.fill(60, 25, 25);
  g.beginShape();
  g.vertex(9, 18);
  g.vertex(21, 18);
  g.vertex(20, 26);
  g.vertex(10, 26);
  g.endShape(CLOSE);
  
  // Shoulder spikes
  g.fill(80, 30, 30);
  g.triangle(6, 18, 8, 14, 10, 18);
  g.triangle(24, 18, 22, 14, 20, 18);
  
  // Muscular arms
  g.fill(100, 35, 35);
  g.ellipse(6, 22, 7, 14);
  g.ellipse(24, 22, 7, 14);
  
  // Clawed hands
  g.fill(60, 20, 20);
  g.ellipse(5, 28, 5, 6);
  g.ellipse(25, 28, 5, 6);
  // Individual claws
  g.fill(40, 15, 15);
  g.triangle(4, 31, 4.5, 31, 4.2, 33);
  g.triangle(5.5, 31, 6, 31, 5.7, 33);
  g.triangle(24, 31, 24.5, 31, 24.2, 33);
  g.triangle(25.5, 31, 26, 31, 25.7, 33);
  
  // Large demonic head with helmet
  g.fill(100, 35, 35);
  g.ellipse(15, 14, 18, 16);
  g.fill(120, 40, 40);
  g.ellipse(15, 14, 15, 13);
  
  // Dark skull-like helmet
  g.fill(50, 20, 20);
  g.arc(15, 14, 17, 15, PI, TWO_PI);
  
  // Large curved horns from helmet
  g.fill(40, 15, 15);
  // Left horn
  g.beginShape();
  g.vertex(9, 11);
  g.bezierVertex(6, 8, 4, 9, 3, 13);
  g.vertex(5, 12);
  g.bezierVertex(6, 10, 7, 10, 9, 12);
  g.endShape(CLOSE);
  // Right horn
  g.beginShape();
  g.vertex(21, 11);
  g.bezierVertex(24, 8, 26, 9, 27, 13);
  g.vertex(25, 12);
  g.bezierVertex(24, 10, 23, 10, 21, 12);
  g.endShape(CLOSE);
  
  // Glowing eyes (small, not overpowering)
  g.fill(255, 150, 0);
  g.ellipse(11, 14, 4, 5);
  g.ellipse(19, 14, 4, 5);
  g.fill(255, 200, 100);
  g.ellipse(11, 13.5, 2.5, 2.5);
  g.ellipse(19, 13.5, 2.5, 2.5);
  
  // Sharp teeth/fangs
  g.fill(240, 240, 240);
  g.triangle(13, 17, 12, 20, 14, 19);
  g.triangle(17, 17, 16, 20, 18, 19);
  
  // Small bat wings (darker, no glow)
  g.fill(60, 25, 25, 200);
  g.triangle(7, 22, 2, 20, 6, 26);
  g.triangle(23, 22, 28, 20, 24, 26);
  g.fill(80, 35, 35, 180);
  g.triangle(7, 22, 4, 21, 6, 24);
  g.triangle(23, 22, 26, 21, 24, 24);
  
  // Belt with skull buckle
  g.fill(60, 25, 25);
  g.rect(11, 25, 8, 2);
  g.fill(200, 200, 210);
  g.ellipse(15, 26, 3, 3);
  g.fill(40, 15, 15);
  g.ellipse(14, 25.5, 1, 1);
  g.ellipse(16, 25.5, 1, 1);
  
  return g;
}

function createBowmanSprite() {
  let g = createGraphics(22, 26);
  g.noStroke();
  
  // Legs
  g.fill(60, 50, 70);
  g.rect(7, 18, 3, 8);
  g.rect(12, 18, 3, 8);
  
  // Body with leather armor
  g.fill(80, 60, 100);
  g.ellipse(11, 16, 11, 10);
  g.fill(90, 70, 110);
  g.ellipse(11, 16, 9, 8);
  
  // Arms
  g.fill(100, 80, 120);
  g.ellipse(6, 16, 4, 8);
  g.ellipse(16, 16, 4, 8);
  
  // Hooded head
  g.fill(70, 50, 90);
  g.ellipse(11, 10, 14, 15);
  g.fill(100, 80, 120);
  g.ellipse(11, 11, 11, 13);
  
  // Hood shadow over face
  g.fill(40, 30, 60);
  g.ellipse(11, 9, 10, 6);
  
  // Mysterious glowing eyes
  g.fill(100, 200, 255);
  g.ellipse(9, 9, 2.5, 2.5);
  g.ellipse(13, 9, 2.5, 2.5);
  g.fill(180, 240, 255);
  g.ellipse(9, 8.5, 1.5, 1.5);
  g.ellipse(13, 8.5, 1.5, 1.5);
  
  // Quiver on back
  g.fill(80, 60, 50);
  g.rect(14, 12, 3, 6);
  g.fill(160, 140, 120);
  g.triangle(14.5, 12, 15, 11, 15.5, 12);
  g.triangle(15.5, 12, 16, 11, 16.5, 12);
  
  // Belt
  g.fill(60, 50, 40);
  g.rect(7, 18, 8, 2);
  
  return g;
}

function createWarlockSprite() {
  let g = createGraphics(24, 28);
  g.noStroke();
  
  // Floating/levitating base
  g.fill(50, 40, 80, 100);
  g.ellipse(12, 26, 16, 6);
  
  // Long flowing robes
  g.fill(50, 40, 80);
  g.beginShape();
  g.vertex(6, 18);
  g.vertex(4, 26);
  g.vertex(20, 26);
  g.vertex(18, 18);
  g.endShape(CLOSE);
  g.fill(60, 50, 90);
  g.ellipse(12, 18, 14, 12);
  
  // Upper body with robe details
  g.fill(70, 55, 100);
  g.ellipse(12, 13, 13, 14);
  
  // Hood
  g.fill(50, 40, 80);
  g.arc(12, 10, 15, 16, PI, TWO_PI);
  g.fill(60, 50, 90);
  g.arc(12, 10, 13, 14, PI, TWO_PI);
  
  // Shadowed face
  g.fill(30, 25, 50);
  g.ellipse(12, 11, 10, 12);
  
  // Glowing mystical eyes
  g.fill(200, 100, 255);
  g.ellipse(10, 10, 3, 3);
  g.ellipse(14, 10, 3, 3);
  g.fill(240, 180, 255);
  g.ellipse(10, 9.5, 2, 2);
  g.ellipse(14, 9.5, 2, 2);
  
  // Dark beard/mouth area
  g.fill(40, 35, 60);
  g.arc(12, 13, 6, 6, 0, PI);
  
  // Mystical amulet
  g.fill(200, 100, 255);
  g.ellipse(12, 16, 4, 4);
  g.fill(240, 180, 255);
  g.ellipse(12, 16, 2, 2);
  
  // Magical energy swirls
  g.fill(150, 80, 200, 120);
  g.ellipse(12, 12, 18, 18);
  g.fill(180, 120, 220, 80);
  g.ellipse(12, 12, 22, 22);
  
  // Robe trim
  g.fill(90, 70, 120);
  g.rect(6, 18, 12, 2);
  
  return g;
}

function createKnightSprite() {
  let g = createGraphics(22, 28);
  g.noStroke();
  
  // Legs in armor
  g.fill(120, 120, 130);
  g.rect(7, 20, 3, 8);
  g.rect(12, 20, 3, 8);
  g.fill(100, 100, 110);
  g.rect(7, 20, 3, 2);
  g.rect(12, 20, 3, 2);
  
  // Body with chainmail/armor
  g.fill(140, 140, 150);
  g.ellipse(11, 16, 10, 11);
  g.fill(160, 160, 170);
  g.ellipse(11, 16, 8, 9);
  
  // Tabard/tunic over armor
  g.fill(200, 50, 60);
  g.rect(8, 16, 6, 6);
  g.fill(220, 70, 80);
  g.rect(9, 17, 4, 4);
  
  // Arms with armored gauntlets
  g.fill(140, 140, 150);
  g.ellipse(6, 16, 3, 7);
  g.ellipse(16, 16, 3, 7);
  
  // Shield (left side)
  g.fill(180, 180, 200);
  g.beginShape();
  g.vertex(4, 14);
  g.vertex(4, 20);
  g.vertex(5.5, 22);
  g.vertex(7, 20);
  g.vertex(7, 14);
  g.endShape(CLOSE);
  g.fill(200, 60, 70);
  g.beginShape();
  g.vertex(4.5, 15);
  g.vertex(4.5, 19);
  g.vertex(5.5, 20.5);
  g.vertex(6.5, 19);
  g.vertex(6.5, 15);
  g.endShape(CLOSE);
  
  // Sword (right side)
  g.fill(180, 185, 190);
  g.rect(16, 12, 2, 10);
  g.fill(100, 80, 60);
  g.rect(15.5, 20, 3, 3);
  g.fill(200, 200, 210);
  g.rect(15, 11, 4, 2);
  
  // Helmet
  g.fill(140, 140, 150);
  g.ellipse(11, 10, 10, 11);
  g.fill(160, 160, 170);
  g.ellipse(11, 10, 8, 9);
  
  // Visor slit
  g.fill(40, 40, 50);
  g.rect(8, 9, 6, 2);
  
  // Helmet crest/plume
  g.fill(200, 50, 60);
  g.triangle(10, 5, 11, 2, 12, 5);
  g.fill(220, 70, 80);
  g.triangle(10.5, 5, 11, 3, 11.5, 5);
  
  // Belt
  g.fill(100, 80, 60);
  g.rect(8, 19, 6, 2);
  g.fill(180, 180, 100);
  g.rect(10, 19, 2, 2);
  
  return g;
}

function createGoblinKingSprite() {
  let g = createGraphics(48, 56);
  g.noStroke();
  
  // Large shadow
  g.fill(20, 40, 20, 100);
  g.ellipse(24, 52, 40, 12);
  
  // Legs with armor (bigger)
  g.fill(100, 140, 100);
  g.rect(14, 40, 8, 14);
  g.rect(26, 40, 8, 14);
  g.fill(80, 100, 80);
  g.rect(14, 40, 8, 4);
  g.rect(26, 40, 8, 4);
  
  // Body (much larger)
  g.fill(120, 160, 120);
  g.ellipse(24, 30, 28, 32);
  g.fill(140, 180, 140);
  g.ellipse(24, 30, 24, 28);
  
  // Armor chest plate
  g.fill(140, 140, 150);
  g.ellipse(24, 30, 20, 24);
  g.fill(160, 160, 170);
  g.ellipse(24, 28, 16, 20);
  
  // Arms with muscles
  g.fill(100, 140, 100);
  g.ellipse(12, 30, 10, 18);
  g.ellipse(36, 30, 10, 18);
  
  // Head (larger)
  g.fill(120, 160, 120);
  g.ellipse(24, 16, 22, 24);
  g.fill(140, 180, 140);
  g.ellipse(24, 16, 18, 20);
  
  // Large pointed ears
  g.fill(100, 140, 100);
  g.triangle(12, 14, 8, 16, 14, 18);
  g.triangle(36, 14, 40, 16, 34, 18);
  g.fill(120, 160, 120);
  g.triangle(13, 15, 10, 16, 13, 17);
  g.triangle(35, 15, 38, 16, 35, 17);
  
  // Evil glowing red eyes
  g.fill(255, 50, 50);
  g.ellipse(19, 15, 5, 5);
  g.ellipse(29, 15, 5, 5);
  g.fill(255, 100, 100);
  g.ellipse(19, 14, 3, 3);
  g.ellipse(29, 14, 3, 3);
  
  // Nasty grin with large fangs
  g.fill(200, 220, 200);
  g.arc(24, 20, 12, 10, 0, PI);
  g.fill(255, 255, 255);
  g.triangle(20, 20, 18, 25, 22, 22);
  g.triangle(28, 20, 26, 25, 30, 22);
  
  // GOLDEN CROWN
  g.fill(255, 215, 0);
  g.rect(14, 4, 20, 6);
  // Crown points
  g.triangle(14, 4, 16, 0, 18, 4);
  g.triangle(21, 4, 24, -2, 27, 4);
  g.triangle(30, 4, 32, 0, 34, 4);
  // Crown jewels
  g.fill(255, 50, 50);
  g.ellipse(24, 5, 4, 4);
  g.fill(50, 255, 50);
  g.ellipse(18, 6, 3, 3);
  g.ellipse(30, 6, 3, 3);
  
  // Crown shine
  g.fill(255, 255, 150);
  g.ellipse(26, 3, 2, 2);
  
  return g;
}

function createDemonLordSprite() {
  let g = createGraphics(56, 70);
  g.noStroke();
  
  // Large dark shadow/aura
  g.fill(100, 20, 20, 120);
  g.ellipse(28, 65, 50, 15);
  
  // Flame aura base (much larger)
  g.fill(255, 50, 0, 100);
  g.ellipse(28, 40, 52, 60);
  g.fill(255, 100, 0, 80);
  g.ellipse(28, 40, 48, 56);
  g.fill(255, 180, 0, 60);
  g.ellipse(28, 40, 44, 52);
  
  // Legs with clawed feet (larger)
  g.fill(150, 30, 30);
  g.rect(16, 50, 10, 18);
  g.rect(30, 50, 10, 18);
  // Claws
  g.fill(100, 20, 20);
  for (let i = 0; i < 3; i++) {
    g.triangle(16 + i * 3, 68, 17 + i * 3, 68, 16.5 + i * 3, 70);
    g.triangle(30 + i * 3, 68, 31 + i * 3, 68, 30.5 + i * 3, 70);
  }
  
  // Massive body
  g.fill(180, 40, 40);
  g.ellipse(28, 35, 32, 38);
  g.fill(200, 50, 50);
  g.ellipse(28, 35, 28, 34);
  
  // Muscular arms
  g.fill(160, 35, 35);
  g.ellipse(12, 35, 12, 22);
  g.ellipse(44, 35, 12, 22);
  
  // Large head
  g.fill(180, 40, 40);
  g.ellipse(28, 18, 28, 30);
  g.fill(200, 50, 50);
  g.ellipse(28, 18, 24, 26);
  
  // Massive curved horns
  g.fill(80, 20, 20);
  g.beginShape();
  g.vertex(18, 12);
  g.bezierVertex(12, 8, 8, 10, 6, 18);
  g.vertex(10, 16);
  g.bezierVertex(12, 12, 14, 12, 18, 14);
  g.endShape(CLOSE);
  
  g.beginShape();
  g.vertex(38, 12);
  g.bezierVertex(44, 8, 48, 10, 50, 18);
  g.vertex(46, 16);
  g.bezierVertex(44, 12, 42, 12, 38, 14);
  g.endShape(CLOSE);
  
  // Glowing yellow eyes
  g.fill(255, 255, 0);
  g.ellipse(22, 17, 6, 6);
  g.ellipse(34, 17, 6, 6);
  g.fill(255, 255, 200);
  g.ellipse(22, 16, 4, 4);
  g.ellipse(34, 16, 4, 4);
  
  // Sharp fangs
  g.fill(255, 255, 255);
  g.triangle(22, 24, 20, 30, 24, 26);
  g.triangle(34, 24, 32, 30, 36, 26);
  
  // Bat-like wings
  g.fill(100, 20, 20, 180);
  g.beginShape();
  g.vertex(10, 30);
  g.vertex(2, 25);
  g.vertex(4, 35);
  g.vertex(8, 40);
  g.endShape(CLOSE);
  
  g.beginShape();
  g.vertex(46, 30);
  g.vertex(54, 25);
  g.vertex(52, 35);
  g.vertex(48, 40);
  g.endShape(CLOSE);
  
  // Glowing core/chest
  g.fill(255, 150, 0, 200);
  g.ellipse(28, 35, 10, 10);
  g.fill(255, 255, 100, 180);
  g.ellipse(28, 35, 6, 6);
  
  return g;
}

function createTrollSprite() {
  let g = createGraphics(34, 40);
  g.noStroke();
  
  // Shadow
  g.fill(20, 30, 50, 100);
  g.ellipse(17, 38, 30, 10);
  
  // Large thick legs (blue)
  g.fill(80, 120, 150);
  g.rect(9, 28, 7, 12);
  g.rect(18, 28, 7, 12);
  g.fill(60, 100, 130);
  g.rect(9, 28, 7, 4);
  g.rect(18, 28, 7, 4);
  
  // Massive body
  g.fill(100, 140, 170);
  g.ellipse(17, 22, 20, 18);
  g.fill(120, 160, 190);
  g.ellipse(17, 22, 17, 15);
  
  // Muscular arms
  g.fill(90, 130, 160);
  g.ellipse(8, 22, 9, 16);
  g.ellipse(26, 22, 9, 16);
  
  // Large fists
  g.fill(80, 120, 150);
  g.ellipse(7, 30, 7, 8);
  g.ellipse(27, 30, 7, 8);
  
  // Large brutish head
  g.fill(100, 140, 170);
  g.ellipse(17, 13, 18, 17);
  g.fill(120, 160, 190);
  g.ellipse(17, 13, 15, 14);
  
  // Protruding brow
  g.fill(90, 130, 160);
  g.rect(10, 11, 14, 4);
  
  // Small beady eyes
  g.fill(255, 200, 100);
  g.ellipse(13, 13, 4, 4);
  g.ellipse(21, 13, 4, 4);
  g.fill(50, 30, 20);
  g.ellipse(13, 13, 2, 2);
  g.ellipse(21, 13, 2, 2);
  
  // Large underbite with tusks
  g.fill(200, 200, 210);
  g.rect(14, 18, 6, 3);
  g.fill(255, 255, 255);
  g.triangle(13, 18, 11, 22, 15, 20);
  g.triangle(21, 18, 19, 22, 23, 20);
  
  // Scraggly hair
  g.fill(70, 100, 120);
  for (let i = 0; i < 5; i++) {
    g.triangle(9 + i * 4, 6, 10 + i * 4, 6, 9.5 + i * 4, 9);
  }
  
  return g;
}

function createDrakeSprite() {
  let g = createGraphics(44, 38);
  g.noStroke();
  
  // Shadow
  g.fill(60, 20, 20, 100);
  g.ellipse(22, 36, 36, 10);
  
  // Tail (long and serpentine)
  g.fill(160, 50, 40);
  g.beginShape();
  g.vertex(18, 24);
  g.vertex(10, 28);
  g.vertex(4, 30);
  g.vertex(2, 28);
  g.vertex(6, 26);
  g.vertex(12, 24);
  g.vertex(18, 22);
  g.endShape(CLOSE);
  
  // Tail spikes
  g.fill(120, 40, 30);
  g.triangle(14, 24, 12, 22, 16, 24);
  g.triangle(10, 26, 8, 24, 12, 26);
  g.triangle(6, 28, 4, 26, 8, 28);
  
  // LARGE bat-like wings (behind body)
  g.fill(100, 30, 30, 200);
  // Left wing
  g.beginShape();
  g.vertex(16, 18);
  g.vertex(4, 10);
  g.vertex(2, 16);
  g.vertex(8, 22);
  g.endShape(CLOSE);
  // Wing membrane detail
  g.fill(80, 25, 25, 180);
  g.triangle(16, 18, 6, 12, 10, 20);
  
  // Right wing
  g.fill(100, 30, 30, 200);
  g.beginShape();
  g.vertex(28, 18);
  g.vertex(40, 10);
  g.vertex(42, 16);
  g.vertex(36, 22);
  g.endShape(CLOSE);
  // Wing membrane detail
  g.fill(80, 25, 25, 180);
  g.triangle(28, 18, 38, 12, 34, 20);
  
  // Wing claws/hooks
  g.fill(60, 20, 20);
  g.triangle(4, 10, 3, 8, 5, 9);
  g.triangle(40, 10, 39, 8, 41, 9);
  
  // Powerful hind legs with talons
  g.fill(140, 50, 40);
  g.rect(16, 22, 5, 8);
  g.rect(23, 22, 5, 8);
  g.fill(100, 35, 30);
  g.rect(16, 22, 5, 3);
  g.rect(23, 22, 5, 3);
  
  // Dragon talons (3 per foot)
  g.fill(60, 20, 20);
  g.triangle(16, 30, 17, 30, 16.5, 33);
  g.triangle(18, 30, 19, 30, 18.5, 33);
  g.triangle(20, 30, 21, 30, 20.5, 33);
  g.triangle(23, 30, 24, 30, 23.5, 33);
  g.triangle(25, 30, 26, 30, 25.5, 33);
  g.triangle(27, 30, 28, 30, 27.5, 33);
  
  // Muscular body
  g.fill(180, 60, 50);
  g.ellipse(22, 20, 18, 16);
  g.fill(200, 70, 60);
  g.ellipse(22, 20, 15, 13);
  
  // Chest scales/armor
  g.fill(220, 180, 100);
  for (let i = 0; i < 3; i++) {
    g.ellipse(22, 18 + i * 3, 10 - i * 2, 3);
  }
  
  // Long serpentine neck
  g.fill(180, 60, 50);
  g.beginShape();
  g.vertex(20, 14);
  g.vertex(24, 14);
  g.vertex(23, 8);
  g.vertex(21, 8);
  g.endShape(CLOSE);
  
  // Dragon head (elongated and fierce)
  g.fill(200, 70, 60);
  g.ellipse(22, 7, 14, 10);
  g.fill(220, 80, 70);
  g.ellipse(22, 7, 11, 8);
  
  // Extended snout
  g.fill(180, 60, 50);
  g.beginShape();
  g.vertex(17, 7);
  g.vertex(12, 8);
  g.vertex(12, 10);
  g.vertex(17, 9);
  g.endShape(CLOSE);
  
  // Sharp teeth
  g.fill(255, 255, 255);
  g.triangle(13, 9, 12, 11, 14, 10);
  g.triangle(15, 9, 14, 11, 16, 10);
  
  // Curved horns (multiple)
  g.fill(60, 20, 20);
  // Large back-swept horns
  g.beginShape();
  g.vertex(18, 5);
  g.bezierVertex(16, 3, 14, 2, 13, 4);
  g.vertex(15, 4);
  g.bezierVertex(16, 3, 17, 4, 18, 6);
  g.endShape(CLOSE);
  
  g.beginShape();
  g.vertex(26, 5);
  g.bezierVertex(28, 3, 30, 2, 31, 4);
  g.vertex(29, 4);
  g.bezierVertex(28, 3, 27, 4, 26, 6);
  g.endShape(CLOSE);
  
  // Smaller forehead horns
  g.triangle(20, 4, 19, 2, 21, 4);
  g.triangle(24, 4, 23, 2, 25, 4);
  
  // Fierce glowing eyes
  g.fill(255, 200, 0);
  g.ellipse(19, 7, 4, 4);
  g.ellipse(25, 7, 4, 4);
  g.fill(255, 255, 100);
  g.ellipse(19, 6.5, 2.5, 2.5);
  g.ellipse(25, 6.5, 2.5, 2.5);
  
  // Slit pupils
  g.fill(20, 20, 20);
  g.rect(18.5, 6, 1, 3);
  g.rect(24.5, 6, 1, 3);
  
  // Nostril flames/smoke
  g.fill(255, 150, 0, 200);
  g.ellipse(13, 9, 3, 3);
  g.fill(255, 200, 100, 150);
  g.ellipse(12, 8, 2, 2);
  
  // Spine ridges along neck and back
  g.fill(140, 45, 35);
  for (let i = 0; i < 4; i++) {
    let x = 22;
    let y = 13 + i * 3;
    g.triangle(x - 1, y, x + 1, y, x, y - 2);
  }
  
  return g;
}

function createGiantSprite() {
  let g = createGraphics(64, 80);
  g.noStroke();
  
  // Large shadow
  g.fill(30, 30, 40, 120);
  g.ellipse(32, 76, 55, 15);
  
  // Enormous legs
  g.fill(140, 120, 100);
  g.rect(18, 56, 12, 24);
  g.rect(34, 56, 12, 24);
  g.fill(120, 100, 80);
  g.rect(18, 56, 12, 6);
  g.rect(34, 56, 12, 6);
  
  // Massive body
  g.fill(160, 140, 120);
  g.ellipse(32, 42, 36, 32);
  g.fill(180, 160, 140);
  g.ellipse(32, 42, 32, 28);
  
  // Fur/hide vest
  g.fill(100, 80, 60);
  g.ellipse(32, 42, 28, 24);
  
  // Huge muscular arms
  g.fill(150, 130, 110);
  g.ellipse(14, 42, 14, 26);
  g.ellipse(50, 42, 14, 26);
  
  // Giant fists
  g.fill(140, 120, 100);
  g.ellipse(12, 56, 12, 14);
  g.ellipse(52, 56, 12, 14);
  
  // Enormous head
  g.fill(160, 140, 120);
  g.ellipse(32, 22, 28, 26);
  g.fill(180, 160, 140);
  g.ellipse(32, 22, 24, 22);
  
  // Heavy brow
  g.fill(140, 120, 100);
  g.rect(20, 18, 24, 6);
  
  // Small eyes for size
  g.fill(255, 200, 100);
  g.ellipse(26, 22, 5, 5);
  g.ellipse(38, 22, 5, 5);
  g.fill(80, 60, 40);
  g.ellipse(26, 22, 3, 3);
  g.ellipse(38, 22, 3, 3);
  
  // Large jaw
  g.fill(160, 140, 120);
  g.rect(24, 28, 16, 8);
  
  // Tusks/teeth
  g.fill(255, 255, 255);
  g.triangle(24, 28, 22, 34, 26, 31);
  g.triangle(40, 28, 38, 34, 42, 31);
  
  // Wild hair
  g.fill(100, 80, 60);
  for (let i = 0; i < 8; i++) {
    g.triangle(18 + i * 4, 10, 19 + i * 4, 10, 18.5 + i * 4, 14);
  }
  
  // Club in hand
  g.fill(80, 60, 40);
  g.rect(50, 52, 8, 24);
  g.ellipse(54, 50, 12, 12);
  g.fill(100, 80, 60);
  g.ellipse(54, 50, 8, 8);
  
  // Belt
  g.fill(80, 60, 40);
  g.rect(20, 52, 24, 4);
  g.fill(180, 160, 100);
  g.rect(30, 51, 4, 6);
  
  return g;
}

function drawIntroScreen() {
  // Semi-transparent dark overlay
  fill(0, 0, 0, 220);
  noStroke();
  rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Animated title glow
  let glowPulse = sin(frameCount * 0.05) * 20 + 100;
  fill(100, 200, 255, glowPulse);
  textSize(64);
  textAlign(CENTER, CENTER);
  text('CASTLE', CANVAS_WIDTH / 2 + 3, 85);
  text('DEFENSE', CANVAS_WIDTH / 2 + 3, 135);
  
  // Main title
  fill(255, 255, 255);
  textSize(60);
  text('CASTLE', CANVAS_WIDTH / 2, 83);
  text('DEFENSE', CANVAS_WIDTH / 2, 133);
  
  // Subtitle with shimmer
  fill(200, 220, 255);
  textSize(18);
  text('Protect Your Castle From The Goblin Hordes!', CANVAS_WIDTH / 2, 175);
  
  // Instructions box
  fill(30, 35, 50, 200);
  stroke(100, 200, 255, 150);
  strokeWeight(2);
  rect(80, 200, CANVAS_WIDTH - 160, 140, 10);
  
  // Instructions text
  fill(255, 255, 255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text('• Build towers within 4 blocks of your castle', 110, 230);
  text('• Mines can be placed anywhere on the map', 110, 255);
  text('• Earn gold by defeating enemies and from gold mines', 110, 280);
  text('• New towers unlock as you progress - Survive all 30 rounds!', 110, 305);
  
  // Mode selection prompt
  fill(255, 220, 100);
  textSize(22);
  textAlign(CENTER, CENTER);
  text('SELECT GAME MODE:', CANVAS_WIDTH / 2, 365);
  
  // Relaxed mode button
  let relaxedX = CANVAS_WIDTH / 2 - 230;
  let relaxedY = 400;
  let buttonW = 200;
  let buttonH = 70;
  
  let isHoveringRelaxed = mouseX >= relaxedX && mouseX <= relaxedX + buttonW &&
                          mouseY >= relaxedY && mouseY <= relaxedY + buttonH;
  
  if (isHoveringRelaxed) {
    fill(80, 180, 120);
    stroke(120, 220, 160);
  } else {
    fill(60, 140, 100);
    stroke(100, 180, 140);
  }
  strokeWeight(3);
  rect(relaxedX, relaxedY, buttonW, buttonH, 10);
  
  fill(255);
  noStroke();
  textSize(24);
  text('RELAXED', relaxedX + buttonW / 2, relaxedY + 22);
  textSize(13);
  fill(220, 255, 220);
  text('No time pressure', relaxedX + buttonW / 2, relaxedY + 45);
  text('Take your time!', relaxedX + buttonW / 2, relaxedY + 60);
  
  // Challenging mode button
  let challengingX = CANVAS_WIDTH / 2 + 30;
  let challengingY = 400;
  
  let isHoveringChallenging = mouseX >= challengingX && mouseX <= challengingX + buttonW &&
                              mouseY >= challengingY && mouseY <= challengingY + buttonH;
  
  if (isHoveringChallenging) {
    fill(180, 80, 80);
    stroke(220, 120, 120);
  } else {
    fill(140, 60, 60);
    stroke(180, 100, 100);
  }
  strokeWeight(3);
  rect(challengingX, challengingY, buttonW, buttonH, 10);
  
  fill(255);
  noStroke();
  textSize(24);
  text('CHALLENGING', challengingX + buttonW / 2, challengingY + 22);
  textSize(13);
  fill(255, 220, 220);
  text('Timed rounds', challengingX + buttonW / 2, challengingY + 45);
  text('Beat the clock!', challengingX + buttonW / 2, challengingY + 60);
  
  // Animated particles around the screen
  for (let i = 0; i < 8; i++) {
    let angle = (frameCount * 0.02 + i * TWO_PI / 8);
    let x = CANVAS_WIDTH / 2 + cos(angle) * 220;
    let y = 280 + sin(angle) * 100;
    let size = 3 + sin(frameCount * 0.1 + i) * 2;
    fill(100, 200, 255, 200);
    ellipse(x, y, size, size);
  }
}

function drawSpeedButton() {
  // Speed button (bottom right of battlefield)
  if (speedMultiplier === 2) {
    fill(50, 150, 255);
    stroke(100, 180, 255);
  } else {
    fill(70, 120, 200);
    stroke(100, 150, 230);
  }
  strokeWeight(3);
  rect(UI_SPEED_X, UI_SPEED_Y, UI_SPEED_W, UI_SPEED_H, 8);
  
  // Button highlight
  fill(255, 255, 255, 30);
  noStroke();
  rect(UI_SPEED_X, UI_SPEED_Y, UI_SPEED_W, UI_SPEED_H / 3, 8, 8, 0, 0);
  
  // Speed text
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(22);
  text('2X', UI_SPEED_X + UI_SPEED_W / 2, UI_SPEED_Y + UI_SPEED_H / 2 - 2);
  
  // Arrow
  textSize(16);
  text('▶', UI_SPEED_X + UI_SPEED_W / 2 + 18, UI_SPEED_Y + UI_SPEED_H / 2);
  
  // Active indicator
  if (speedMultiplier === 2) {
    fill(100, 255, 150);
    textSize(10);
    text('ACTIVE', UI_SPEED_X + UI_SPEED_W / 2, UI_SPEED_Y + UI_SPEED_H + 12);
  }
}

function drawGrid() {
  stroke(40, 45, 60);
  strokeWeight(1);
  
  for (let x = 0; x <= GRID_COLS; x++) {
    line(x * GRID_SIZE, 0, x * GRID_SIZE, GRID_ROWS * GRID_SIZE);
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    line(0, y * GRID_SIZE, CANVAS_WIDTH, y * GRID_SIZE);
  }
}

function drawBuildRangeOverlay() {
  noStroke();
  
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      // Check if this cell is within 4 tiles of ANY of the 4 base cells
      let withinRange = false;
      for (let by = 0; by < baseSize; by++) {
        for (let bx = 0; bx < baseSize; bx++) {
          let dx = abs(x - (baseX + bx));
          let dy = abs(y - (baseY + by));
          if (dx <= 4 && dy <= 4) {
            withinRange = true;
            break;
          }
        }
        if (withinRange) break;
      }
      
      if (withinRange) {
        // Light green tint for valid build area
        fill(100, 255, 100, 15);
      } else {
        // Light red tint for restricted area
        fill(255, 100, 100, 15);
      }
      
      rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }
  }
}

function drawBase() {
  // Base occupies 2x2 cells, so center it in that area
  let x = baseX * GRID_SIZE + GRID_SIZE;
  let y = baseY * GRID_SIZE + GRID_SIZE;
  
  // Protective shield (blue/white for castle)
  let pulseSize = 95 + sin(frameCount * 0.05) * 10;
  fill(100, 150, 255, 10);
  noStroke();
  ellipse(x, y, pulseSize, pulseSize);
  
  // Secondary pulse ring
  let pulse2 = 75 + sin(frameCount * 0.08 + 1) * 8;
  fill(150, 180, 255, 15);
  ellipse(x, y, pulse2, pulse2);
  
  // Shield ring effect
  noFill();
  stroke(100, 150, 255, 40);
  strokeWeight(2);
  ellipse(x, y, pulseSize - 5, pulseSize - 5);
  
  // Draw the castle sprite
  imageMode(CENTER);
  image(sprites.base, x, y);
  
  // Torchlight sparkles around castle
  let orbitAngle = frameCount * 0.02;
  for (let i = 0; i < 4; i++) {
    let angle = orbitAngle + (TWO_PI / 4) * i;
    let dist = 45;
    let sparkleX = x + cos(angle) * dist;
    let sparkleY = y + sin(angle) * dist;
    fill(255, 200, 100, 150);
    ellipse(sparkleX, sparkleY, 3, 3);
    fill(255, 240, 150, 100);
    ellipse(sparkleX, sparkleY, 1.5, 1.5);
  }
  
  // Occasional torch smoke particles
  if (frameCount % 20 === 0) {
    let angle = random(TWO_PI);
    let dist = 35;
    particles.push({
      x: x + cos(angle) * dist,
      y: y + sin(angle) * dist,
      vx: random(-0.3, 0.3),
      vy: -0.8,
      life: 180,
      size: 2,
      color: [100, 100, 110]
    });
  }
}

function drawBaseHealthBar() {
  // Draw health bar ON TOP of everything else
  let x = baseX * GRID_SIZE + GRID_SIZE;
  let y = baseY * GRID_SIZE + GRID_SIZE;
  
  // Health bar background
  fill(60, 20, 20);
  noStroke();
  rect(x - 35, y - 55, 70, 8, 4);
  
  // Health bar fill with color gradient
  let healthPercent = baseHealth / maxBaseHealth;
  let healthWidth = healthPercent * 70;
  if (healthPercent > 0.6) {
    fill(100, 200, 100);
  } else if (healthPercent > 0.3) {
    fill(255, 200, 50);
  } else {
    fill(255, 80, 80);
  }
  rect(x - 35, y - 55, healthWidth, 8, 4);
  
  // Health bar highlight
  fill(255, 255, 255, 100);
  rect(x - 35, y - 55, healthWidth, 3, 4);
  
  // Health text
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(10);
  text(`${baseHealth}/${maxBaseHealth}`, x, y - 51);
}

// ===== SIR TUT TUTORIAL SYSTEM =====

function updateTutorial() {
  if (!tutorialActive) return;
  
  // Only check for new tutorial triggers if no tutorial is currently showing
  if (!sirTutVisible) {
    for (let trigger in TUTORIAL_TRIGGERS) {
      if (TUTORIAL_TRIGGERS[trigger]() && !tutorialQueue.includes(trigger)) {
        startTutorial(trigger);
        console.log('Starting tutorial:', trigger, '| Queue:', tutorialQueue);
        break; // Only one tutorial at a time
      }
    }
  }
  
  // Animate Sir Tut sliding in/out
  if (sirTutVisible && sirTutX < sirTutTargetX) {
    sirTutX += 5; // Slide in speed
    if (sirTutX > sirTutTargetX) sirTutX = sirTutTargetX;
  } else if (!sirTutVisible && sirTutX > -150) {
    sirTutX -= 5; // Slide out speed
  }
}

function startTutorial(dialogueKey) {
  tutorialQueue.push(dialogueKey);
  currentTutorialMessage = TUTORIAL_DIALOGUES[dialogueKey][0];
  tutorialStep = 0;
  sirTutVisible = true;
  showNextButton = true; // Always show Next button so player can progress
  
  // Set highlights based on tutorial
  setTutorialHighlights(dialogueKey);
  
  console.log('Tutorial started:', dialogueKey, '| Message:', currentTutorialMessage);
}

function nextTutorialMessage() {
  // Find the currently active tutorial (last one in queue)
  if (tutorialQueue.length === 0) return;
  
  let currentDialogue = tutorialQueue[tutorialQueue.length - 1];
  if (!TUTORIAL_DIALOGUES[currentDialogue]) return;
  
  let messages = TUTORIAL_DIALOGUES[currentDialogue];
  tutorialStep++;
  
  if (tutorialStep < messages.length) {
    // Still more messages in this tutorial
    currentTutorialMessage = messages[tutorialStep];
    showNextButton = true; // Always show Next
  } else {
    // This tutorial is complete - end it
    console.log('Tutorial complete:', currentDialogue);
    endCurrentTutorial();
  }
}

function endCurrentTutorial() {
  sirTutVisible = false;
  tutorialHighlights = []; // Clear highlights
  showNextButton = false;
  tutorialStep = 0;
  currentTutorialMessage = '';
  console.log('Tutorial segment ended');
}

// Helper function to get the visual position of a tower button (accounting for unlocked towers only)
function getVisualTowerButtonIndex(towerType) {
  let unlockedTypes = TOWER_BUTTON_ORDER.filter(t => isTowerUnlocked(t));
  return unlockedTypes.indexOf(towerType);
}

function setTutorialHighlights(dialogueKey) {
  tutorialHighlights = [];
  
  // Add yellow highlights for specific UI elements
  switch(dialogueKey) {
    case 'welcome':
    case 'artifact':
    case 'enemyGold':
      // No highlights for these intro dialogues
      break;
      
    case 'defenseOptions':
      // Highlight archer, 2x archer (turret), gold mine, and explosion mine buttons
      let defenseTypes = ['archer', 'turret', 'mine', 'explosion'];
      for (let type of defenseTypes) {
        let visualIndex = getVisualTowerButtonIndex(type);
        if (visualIndex >= 0) {
          tutorialHighlights.push({
            x: UI_BUTTON_X + visualIndex * (UI_BUTTON_W + UI_BUTTON_SPACING),
            y: UI_TOWER_ROW_Y,
            w: UI_BUTTON_W,
            h: UI_BUTTON_H,
            element: type + ' Button'
          });
        }
      }
      break;
      
    case 'placeDefenses':
      // Highlight entire cobblestone build area
      let minBuildX = max(0, baseX - 4);
      let maxBuildX = min(GRID_COLS - 1, baseX + baseSize + 3);
      let minBuildY = max(0, baseY - 4);
      let maxBuildY = min(GRID_ROWS - 1, baseY + baseSize + 3);
      
      tutorialHighlights.push({
        x: minBuildX * GRID_SIZE,
        y: minBuildY * GRID_SIZE,
        w: (maxBuildX - minBuildX + 1) * GRID_SIZE,
        h: (maxBuildY - minBuildY + 1) * GRID_SIZE,
        element: 'Build Area'
      });
      break;
      
    case 'deleteAndReady':
      // Highlight delete button and ready button
      tutorialHighlights.push({
        x: UI_DELETE_X,
        y: UI_DELETE_Y,
        w: UI_DELETE_W,
        h: UI_DELETE_H,
        element: 'Delete Button'
      });
      tutorialHighlights.push({
        x: UI_READY_X,
        y: UI_READY_Y,
        w: UI_READY_W,
        h: UI_READY_H,
        element: 'Ready Button'
      });
      break;
      
    case 'upgradeUnlock':
      tutorialHighlights.push({
        x: UI_UPGRADE_X,
        y: UI_UPGRADE_Y,
        w: UI_UPGRADE_W,
        h: UI_UPGRADE_H,
        element: 'Upgrade Button'
      });
      break;
      
    case 'mageUnlock':
      let mageVisualIndex = getVisualTowerButtonIndex('mage');
      if (mageVisualIndex >= 0) {
        tutorialHighlights.push({
          x: UI_BUTTON_X + mageVisualIndex * (UI_BUTTON_W + UI_BUTTON_SPACING),
          y: UI_TOWER_ROW_Y,
          w: UI_BUTTON_W,
          h: UI_BUTTON_H,
          element: 'Mage Button'
        });
      }
      break;
      
    case 'barracksUnlock':
      let barracksVisualIndex = getVisualTowerButtonIndex('barracks');
      if (barracksVisualIndex >= 0) {
        tutorialHighlights.push({
          x: UI_BUTTON_X + barracksVisualIndex * (UI_BUTTON_W + UI_BUTTON_SPACING),
          y: UI_TOWER_ROW_Y,
          w: UI_BUTTON_W,
          h: UI_BUTTON_H,
          element: 'Barracks Button'
        });
      }
      break;
      
    case 'stickyMineUnlock':
      let stickyVisualIndex = getVisualTowerButtonIndex('sticky');
      if (stickyVisualIndex >= 0) {
        tutorialHighlights.push({
          x: UI_BUTTON_X + stickyVisualIndex * (UI_BUTTON_W + UI_BUTTON_SPACING),
          y: UI_TOWER_ROW_Y,
          w: UI_BUTTON_W,
          h: UI_BUTTON_H,
          element: 'Sticky Mine Button'
        });
      }
      break;
      
    case 'fireUnlock':
      let fireVisualIndex = getVisualTowerButtonIndex('fire');
      if (fireVisualIndex >= 0) {
        tutorialHighlights.push({
          x: UI_BUTTON_X + fireVisualIndex * (UI_BUTTON_W + UI_BUTTON_SPACING),
          y: UI_TOWER_ROW_Y,
          w: UI_BUTTON_W,
          h: UI_BUTTON_H,
          element: 'Fire Tower Button'
        });
      }
      break;
  }
}

function drawTutorial() {
  if (!tutorialActive) return;
  
  // Draw yellow highlights only when Sir Tut is visible
  if (sirTutVisible && sirTutX > -100) {
    for (let highlight of tutorialHighlights) {
      stroke(255, 215, 0); // Gold yellow
      strokeWeight(3);
      noFill();
      rect(highlight.x - 3, highlight.y - 3, highlight.w + 6, highlight.h + 6, 5);
      
      // Pulsing glow effect
      let pulse = 100 + sin(frameCount * 0.1) * 50;
      stroke(255, 215, 0, pulse);
      strokeWeight(5);
      rect(highlight.x - 5, highlight.y - 5, highlight.w + 10, highlight.h + 10, 7);
    }
  }
  
  // Don't draw Sir Tut if he's off screen
  if (sirTutX <= -150) return;
  
  // Draw Sir Tut character (left side)
  let tutX = sirTutX;
  let tutY = CANVAS_HEIGHT - 280;
  
  // Character background panel
  fill(40, 40, 50, 230);
  stroke(100, 100, 120);
  strokeWeight(2);
  rect(tutX - 10, tutY - 10, 140, 160, 8);
  
  // Draw Sir Tut sprite
  if (sirTutSprite) {
    // Draw sprite centered in panel, scaled to fit nicely
    imageMode(CENTER);
    image(sirTutSprite, tutX + 60, tutY + 65, 120, 120);
    imageMode(CORNER);
    
    // Name label below sprite
    fill(255, 215, 0);
    textSize(14);
    textAlign(CENTER);
    noStroke();
    text('Sir Tut', tutX + 60, tutY + 135);
  } else {
    // Enhanced placeholder knight (matches uploaded sprite style)
    let kx = tutX + 60;
    let ky = tutY + 65;
    
    // Shield (left side) - teal with gold cross
    fill(60, 90, 100);
    stroke(40, 40, 40);
    strokeWeight(2);
    rect(kx - 35, ky - 15, 18, 30, 3);
    // Gold cross on shield
    fill(220, 180, 60);
    noStroke();
    rect(kx - 28, ky - 10, 4, 20);
    rect(kx - 35, ky - 2, 18, 4);
    
    // Body/Chest - gray armor
    fill(100, 110, 120);
    stroke(40, 40, 40);
    strokeWeight(2);
    rect(kx - 12, ky - 10, 24, 25, 3);
    // Armor highlights
    fill(130, 140, 150);
    noStroke();
    rect(kx - 8, ky - 8, 16, 3);
    
    // Gold trim
    fill(220, 180, 60);
    rect(kx - 12, ky - 5, 24, 2);
    rect(kx - 12, ky + 8, 24, 2);
    
    // Helmet - silver
    fill(140, 145, 150);
    stroke(40, 40, 40);
    strokeWeight(2);
    rect(kx - 10, ky - 30, 20, 22, 4);
    // Helmet top highlight
    fill(170, 175, 180);
    noStroke();
    rect(kx - 8, ky - 28, 16, 4);
    // Visor slit
    fill(40, 40, 40);
    rect(kx - 8, ky - 18, 16, 6);
    // Gold visor trim
    fill(220, 180, 60);
    rect(kx - 10, ky - 16, 20, 2);
    
    // Sword (right side) - silver blade
    fill(160, 165, 170);
    stroke(40, 40, 40);
    strokeWeight(2);
    rect(kx + 20, ky - 35, 4, 30);
    // Blade highlight
    fill(200, 205, 210);
    noStroke();
    rect(kx + 21, ky - 34, 2, 28);
    // Gold crossguard
    fill(220, 180, 60);
    stroke(40, 40, 40);
    strokeWeight(2);
    rect(kx + 15, ky - 6, 14, 3);
    // Grip
    fill(80, 60, 40);
    rect(kx + 20, ky - 3, 4, 8);
    
    // Name label
    fill(255, 215, 0);
    textSize(14);
    textAlign(CENTER);
    noStroke();
    text('Sir Tut', tutX + 60, tutY + 135);
  }
  
  // Speech bubble (to the right of character)
  let bubbleX = tutX + 150;
  let bubbleY = tutY;
  let bubbleW = 380;
  let bubbleH = 140;
  
  // Bubble background
  fill(255, 255, 240);
  stroke(80, 80, 80);
  strokeWeight(3);
  rect(bubbleX, bubbleY, bubbleW, bubbleH, 12);
  
  // Bubble pointer triangle
  fill(255, 255, 240);
  stroke(80, 80, 80);
  triangle(
    bubbleX, bubbleY + 40,
    bubbleX, bubbleY + 60,
    bubbleX - 20, bubbleY + 50
  );
  
  // Message text
  fill(40, 40, 40);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  
  // Word wrap the message
  let words = currentTutorialMessage.split(' ');
  let line = '';
  let y = bubbleY + 15;
  let maxWidth = bubbleW - 30;
  
  for (let word of words) {
    let testLine = line + word + ' ';
    let testWidth = textWidth(testLine);
    
    if (testWidth > maxWidth && line.length > 0) {
      text(line, bubbleX + 15, y);
      line = word + ' ';
      y += 20;
    } else {
      line = testLine;
    }
  }
  text(line, bubbleX + 15, y);
  
  // Next button
  if (showNextButton) {
    let btnX = bubbleX + bubbleW - 80;
    let btnY = bubbleY + bubbleH - 40;
    let btnW = 65;
    let btnH = 30;
    
    // Button hover detection
    let isHover = mouseX >= btnX && mouseX <= btnX + btnW &&
                  mouseY >= btnY && mouseY <= btnY + btnH;
    
    if (isHover) {
      fill(100, 180, 100);
      cursor(HAND);
    } else {
      fill(80, 150, 80);
    }
    
    stroke(120, 200, 120);
    strokeWeight(2);
    rect(btnX, btnY, btnW, btnH, 5);
    
    fill(255);
    noStroke();
    textSize(14);
    textAlign(CENTER, CENTER);
    text('Next', btnX + btnW/2, btnY + btnH/2);
    
    // Store button bounds for click detection
    window.tutorialNextButton = {x: btnX, y: btnY, w: btnW, h: btnH};
  } else {
    window.tutorialNextButton = null;
  }
}

function drawTower(tower) {
  let size = TOWER_TYPES[tower.type].size || 1;
  let x = tower.x * GRID_SIZE + (GRID_SIZE * size) / 2;
  let y = tower.y * GRID_SIZE + (GRID_SIZE * size) / 2;
  
  if (hoveredCell && hoveredCell.x >= tower.x && hoveredCell.x < tower.x + size &&
      hoveredCell.y >= tower.y && hoveredCell.y < tower.y + size) {
    noFill();
    stroke(255, 255, 255, 50);
    strokeWeight(2);
    if (tower.type !== 'mine') {
      ellipse(x, y, TOWER_TYPES[tower.type].range * 2);
    }
  }
  
  imageMode(CENTER);
  image(sprites[tower.type], x, y);
  
  // Tier visual indicators (stars in center of tower's grid space)
  if (tower.tier && tower.tier > 1 && tower.type !== 'mine') {
    let tier = tower.tier;
    
    // For archer and 2x archer (1x1 towers), position stars in bottom 1/3
    // For other towers, position in center
    let starY;
    if (tower.type === 'archer' || tower.type === 'turret') {
      starY = y + (GRID_SIZE * size / 3); // Bottom 1/3 of the tile
    } else {
      starY = y; // Center for larger towers (mage, fire, barracks)
    }
    
    // Tier 2 - 2 stars
    if (tier === 2) {
      // Two blue stars
      fill(100, 200, 255);
      textSize(10);
      textAlign(CENTER, CENTER);
      text('⭐', x - 7, starY);
      text('⭐', x + 7, starY);
    }
    // Tier 3 - 3 stars (no glow)
    else if (tier === 3) {
      // Three gold stars
      fill(255, 215, 0);
      textSize(10);
      textAlign(CENTER, CENTER);
      text('⭐', x - 10, starY);
      text('⭐', x, starY);
      text('⭐', x + 10, starY);
    }
  }
  
  // Gold mine progress indicator (arc only, no glowing orb)
  if (tower.type === 'mine') {
    let progress = tower.incomeTimer / 300;
    fill(255, 215, 0, 150);
    noStroke();
    arc(x, y, 28, 28, -HALF_PI, -HALF_PI + TWO_PI * progress);
  }
}

function drawTrap(trap) {
  let x = trap.x * GRID_SIZE + GRID_SIZE / 2;
  let y = trap.y * GRID_SIZE + GRID_SIZE / 2;

  if (hoveredCell && hoveredCell.x === trap.x && hoveredCell.y === trap.y) {
    noFill();
    stroke(trap.type === 'sticky' ? color(100, 255, 100, 80) : color(255, 150, 50, 80));
    strokeWeight(2);
    ellipse(x, y, TRAP_TYPES[trap.type].triggerRadius * 2);
  }

  imageMode(CENTER);
  let trapSprite = trap.type === 'sticky' ? sprites.stickyTrap : sprites.trap;
  image(trapSprite, x, y);
}

function drawSlowPuddle(puddle) {
  // Draw 2x2 grid of green goo
  noStroke();
  let alpha = map(puddle.life, 600, 0, 180, 60); // Fade out over 10 seconds
  
  for (let py = 0; py < puddle.size; py++) {
    for (let px = 0; px < puddle.size; px++) {
      let x = (puddle.gridX + px) * GRID_SIZE;
      let y = (puddle.gridY + py) * GRID_SIZE;
      
      // Green goo puddle
      fill(80, 200, 100, alpha);
      ellipse(x + GRID_SIZE/2, y + GRID_SIZE/2, GRID_SIZE * 0.9, GRID_SIZE * 0.9);
      
      // Darker center
      fill(60, 150, 80, alpha * 0.8);
      ellipse(x + GRID_SIZE/2, y + GRID_SIZE/2, GRID_SIZE * 0.6, GRID_SIZE * 0.6);
      
      // Highlight bubbles
      fill(120, 255, 150, alpha * 0.6);
      ellipse(x + GRID_SIZE/2 - 8, y + GRID_SIZE/2 - 5, 6, 6);
      ellipse(x + GRID_SIZE/2 + 6, y + GRID_SIZE/2 + 4, 4, 4);
    }
  }
}

function drawFireBeam(x1, y1, x2, y2) {
  // Calculate beam direction
  let dx = x2 - x1;
  let dy = y2 - y1;
  let dist = sqrt(dx * dx + dy * dy);
  let angle = atan2(dy, dx);
  
  // Draw core beam (bright red)
  stroke(255, 100, 50, 200);
  strokeWeight(8);
  line(x1, y1, x2, y2);
  
  // Draw inner beam (yellow-white hot core)
  stroke(255, 255, 150, 220);
  strokeWeight(4);
  line(x1, y1, x2, y2);
  
  // Draw outer glow
  stroke(255, 150, 50, 100);
  strokeWeight(14);
  line(x1, y1, x2, y2);
  
  // Fire particles along beam
  for (let i = 0; i < 8; i++) {
    let t = i / 8;
    let px = lerp(x1, x2, t) + random(-4, 4);
    let py = lerp(y1, y2, t) + random(-4, 4);
    
    noStroke();
    fill(255, random(100, 200), random(30, 80), random(150, 220));
    ellipse(px, py, random(3, 7), random(3, 7));
  }
  
  // Ember particles at target
  for (let i = 0; i < 5; i++) {
    let spreadAngle = angle + random(-0.5, 0.5);
    let spreadDist = random(5, 15);
    let px = x2 + cos(spreadAngle) * spreadDist;
    let py = y2 + sin(spreadAngle) * spreadDist;
    
    fill(255, random(150, 255), random(50, 100), random(100, 200));
    ellipse(px, py, random(2, 5), random(2, 5));
  }
  
  noStroke();
}

function drawEnemy(enemy) {
  let isBoss = (enemy.type === 'goblinKing' || enemy.type === 'demonLord' || enemy.type === 'giant');
  
  // Boss gets special large health bar at top of screen
  if (isBoss) {
    let barWidth = 400;
    let barHeight = 20;
    let barX = (CANVAS_WIDTH - barWidth) / 2;
    let barY = 5;
    
    // Boss name
    fill(255, 215, 0);
    textSize(16);
    textAlign(CENTER, CENTER);
    let bossName = enemy.type === 'goblinKing' ? '👑 GOBLIN KING 👑' : (enemy.type === 'demonLord' ? '🔥 DEMON LORD 🔥' : '⚔️ GIANT ⚔️');
    text(bossName, CANVAS_WIDTH / 2, barY - 15);
    
    // Health bar background
    fill(60, 20, 20);
    noStroke();
    rect(barX, barY, barWidth, barHeight, 5);
    
    // Health bar fill
    let healthPercent = enemy.health / enemy.maxHealth;
    let healthWidth = healthPercent * barWidth;
    if (healthPercent > 0.5) {
      fill(255, 100, 100);
    } else if (healthPercent > 0.25) {
      fill(255, 150, 50);
    } else {
      fill(255, 50, 50);
    }
    rect(barX, barY, healthWidth, barHeight, 5);
    
    // Health text
    fill(255);
    textSize(14);
    text(`${floor(enemy.health)} / ${enemy.maxHealth}`, CANVAS_WIDTH / 2, barY + barHeight / 2);
  } else {
    // Regular enemy health bar
    fill(60, 20, 20);
    noStroke();
    rect(enemy.x - 12, enemy.y - 20, 24, 4);
    
    fill(255, 100, 100);
    let healthWidth = (enemy.health / enemy.maxHealth) * 24;
    rect(enemy.x - 12, enemy.y - 20, healthWidth, 4);
  }
  
  imageMode(CENTER);
  image(sprites[enemy.type], enemy.x, enemy.y);
  
  // STUN VISUAL INDICATOR
  if (enemy.stunTimer && enemy.stunTimer > 0) {
    // Electric sparks around stunned enemy
    for (let i = 0; i < 4; i++) {
      let angle = (TWO_PI / 4) * i + frameCount * 0.1;
      let dist = isBoss ? 24 : 12;
      fill(180, 230, 255, 200);
      noStroke();
      ellipse(enemy.x + cos(angle) * dist, enemy.y + sin(angle) * dist, 3, 3);
    }
    
    // Stun icon above enemy
    fill(255, 255, 100);
    textSize(isBoss ? 24 : 16);
    textAlign(CENTER, CENTER);
    text('⚡', enemy.x, enemy.y - (isBoss ? 40 : 25));
  }
  
  // SLOW VISUAL INDICATOR
  if (enemy.isSlowed && enemy.slowTimer > 0) {
    // Green drip particles around slowed enemy
    for (let i = 0; i < 4; i++) {
      let angle = (TWO_PI / 4) * i + frameCount * 0.05;
      let dist = isBoss ? 24 : 12;
      fill(100, 255, 150, 150);
      noStroke();
      ellipse(enemy.x + cos(angle) * dist, enemy.y + sin(angle) * dist + 3, 4, 6);
    }
    
    // Turtle icon above enemy (offset if also stunned)
    let yOffset = (enemy.stunTimer && enemy.stunTimer > 0) ? (isBoss ? 60 : 40) : (isBoss ? 40 : 25);
    fill(100, 200, 100);
    textSize(isBoss ? 24 : 16);
    textAlign(CENTER, CENTER);
    text('🐢', enemy.x, enemy.y - yOffset);
  }
  
  let phase = enemy.weaponPhase ?? 0;
  
  if (enemy.type === 'goblin' || enemy.type === 'orc' || enemy.type === 'demon' || 
      enemy.type === 'goblinKing' || enemy.type === 'demonLord' || enemy.type === 'troll' || enemy.type === 'giant') {
    drawEnemySword(enemy, 0);
  } else if (enemy.type === 'bowman') {
    drawEnemyBow(enemy, phase);
  } else if (enemy.type === 'warlock' || enemy.type === 'drake') {
    drawEnemyStaff(enemy, phase);
  }
}

function drawEnemySword(enemy, swingAngle) {
  push();
  translate(enemy.x + 8, enemy.y + 2);
  rotate(swingAngle);
  fill(90, 70, 50);
  noStroke();
  rect(-2, -1, 4, 6);
  fill(180, 185, 190);
  rect(-1.5, -8, 3, 10);
  pop();
}

function drawEnemyBow(enemy, phase) {
  let basePx = baseX * GRID_SIZE + GRID_SIZE;
  let basePy = baseY * GRID_SIZE + GRID_SIZE;
  let aimAngle = atan2(basePy - enemy.y, basePx - enemy.x);
  let pull = 0.3 + 0.25 * (0.5 + 0.5 * sin(phase * 1.5));
  push();
  translate(enemy.x + 7, enemy.y);
  rotate(aimAngle);
  noFill();
  stroke(101, 67, 33);
  strokeWeight(2);
  arc(0, 0, 14, 14, -HALF_PI - 0.4, HALF_PI + 0.4);
  stroke(80, 60, 40);
  strokeWeight(1);
  line(-5 * (1 - pull), -4, 5 * (1 - pull), 4);
  noStroke();
  pop();
}

function drawEnemyStaff(enemy, phase) {
  let sway = sin(phase * 0.8) * 0.25;
  push();
  translate(enemy.x + 6, enemy.y + 4);
  rotate(sway);
  fill(80, 60, 40);
  noStroke();
  rect(-1.5, -14, 3, 18);
  fill(200, 100, 255);
  ellipse(0, -16, 6, 6);
  fill(220, 180, 255, 180);
  ellipse(0, -16, 4, 4);
  pop();
}

function drawKnight(knight) {
  // Health bar
  fill(60, 20, 20);
  noStroke();
  rect(knight.x - 12, knight.y - 18, 24, 3);
  
  fill(100, 200, 255);
  let healthWidth = (knight.health / knight.maxHealth) * 24;
  rect(knight.x - 12, knight.y - 18, healthWidth, 3);
  
  // Draw knight sprite
  imageMode(CENTER);
  image(sprites.knight, knight.x, knight.y);
  
  // Sword swing animation when attacking
  if (knight.attackCooldown > knight.attackSpeed - 10) {
    let swingProgress = (knight.attackSpeed - knight.attackCooldown) / 10;
    let swingAngle = swingProgress * HALF_PI - QUARTER_PI;
    drawKnightSwordSwing(knight, swingAngle);
  }
}

function drawKnightSwordSwing(knight, angle) {
  push();
  translate(knight.x + 8, knight.y + 2);
  rotate(angle);
  fill(180, 185, 190);
  noStroke();
  rect(-2, -10, 3, 12);
  fill(200, 200, 210);
  rect(-3, -11, 5, 2);
  pop();
}

function drawProjectile(proj) {
  noStroke();
  
  if (proj.type === 'mage') {
    drawLightningBolt(proj);
  } else if (proj.type === 'turret' || proj.type === 'archer') {
    // Enhanced arrow for archer and turret
    push();
    translate(proj.x, proj.y);
    rotate(atan2(proj.vy, proj.vx));
    
    // Motion blur trail
    fill(101, 67, 33, 50);
    rect(-10, -1.5, 8, 3);
    
    // Arrow shaft
    fill(139, 90, 60);
    rect(-8, -1.5, 14, 3);
    
    // Arrow head
    fill(120, 120, 130);
    beginShape();
    vertex(6, 0);
    vertex(0, -2.5);
    vertex(0, 2.5);
    endShape(CLOSE);
    fill(140, 140, 150);
    triangle(3, -1.5, 3, 1.5, 6, 0);
    
    // Fletching (feathers)
    fill(200, 50, 50, 180);
    triangle(-8, -3, -8, 0, -5, -1);
    triangle(-8, 3, -8, 0, -5, 1);
    fill(180, 40, 40, 180);
    triangle(-8, -2, -8, 0, -6, -0.5);
    triangle(-8, 2, -8, 0, -6, 0.5);
    
    // Shaft detail
    fill(80, 50, 30);
    rect(-2, -1, 1, 2);
    rect(2, -1, 1, 2);
    
    pop();
  }
}

function drawLightningBolt(proj) {
  let dx = proj.vx;
  let dy = proj.vy;
  let len = sqrt(dx * dx + dy * dy) || 1;
  dx /= len;
  dy /= len;
  let perpX = -dy;
  let perpY = dx;
  let tail = 18;
  
  let seed = (proj.x + proj.y + frameCount * 0.8) % 1000;
  let jitter = (offset) => (sin(seed * 12.9898 + offset) * 0.5 + 0.5) * 8 - 4;
  
  // Multiple lightning bolts for forked effect
  for (let fork = -1; fork <= 1; fork++) {
    let forkOffset = fork * 5;
    let x0 = proj.x - dx * tail + perpX * forkOffset;
    let y0 = proj.y - dy * tail + perpY * forkOffset;
    let x1 = proj.x + perpX * (jitter(1) + forkOffset) - dx * tail * 0.7;
    let y1 = proj.y + perpY * (jitter(1) + forkOffset) - dy * tail * 0.7;
    let x2 = proj.x + perpX * (jitter(2) + forkOffset) - dx * tail * 0.4;
    let y2 = proj.y + perpY * (jitter(2) + forkOffset) - dy * tail * 0.4;
    let x3 = proj.x + perpX * (jitter(3) + forkOffset) - dx * tail * 0.1;
    let y3 = proj.y + perpY * (jitter(3) + forkOffset) - dy * tail * 0.1;
    
    let alpha = fork === 0 ? 255 : 150;
    
    // Outer glow (cyan)
    strokeWeight(6);
    stroke(100, 200, 255, alpha * 0.4);
    noFill();
    beginShape();
    vertex(x0, y0);
    vertex(x1, y1);
    vertex(x2, y2);
    vertex(x3, y3);
    vertex(proj.x, proj.y);
    endShape();
    
    // Main bolt (bright cyan)
    strokeWeight(3);
    stroke(180, 230, 255, alpha * 0.8);
    beginShape();
    vertex(x0, y0);
    vertex(x1, y1);
    vertex(x2, y2);
    vertex(x3, y3);
    vertex(proj.x, proj.y);
    endShape();
    
    // Core (white hot)
    strokeWeight(1.5);
    stroke(240, 250, 255, alpha);
    beginShape();
    vertex(x0, y0);
    vertex(x1, y1);
    vertex(x2, y2);
    vertex(x3, y3);
    vertex(proj.x, proj.y);
    endShape();
  }
  
  // Impact point glow
  noStroke();
  fill(180, 220, 255, 200);
  ellipse(proj.x, proj.y, 12, 12);
  fill(220, 240, 255, 220);
  ellipse(proj.x, proj.y, 8, 8);
  fill(255, 255, 255, 200);
  ellipse(proj.x, proj.y, 4, 4);
  
  // Crackling energy particles
  for (let i = 0; i < 3; i++) {
    let angle = random(TWO_PI);
    let dist = random(8, 15);
    fill(200, 230, 255, random(150, 255));
    ellipse(proj.x + cos(angle) * dist, proj.y + sin(angle) * dist, random(1, 3), random(1, 3));
  }
}

function drawEnemyProjectile(ep) {
  if (ep.type === 'arrow') {
    push();
    translate(ep.x, ep.y);
    rotate(atan2(ep.vy, ep.vx));
    
    // Motion trail
    fill(80, 60, 50, 80);
    rect(-8, -1, 6, 2);
    
    // Arrow shaft
    fill(101, 67, 33);
    rect(-6, -1.5, 12, 3);
    
    // Arrow head
    fill(100, 100, 110);
    beginShape();
    vertex(6, 0);
    vertex(0, -2.5);
    vertex(0, 2.5);
    endShape(CLOSE);
    fill(120, 120, 130);
    triangle(3, -1.5, 3, 1.5, 6, 0);
    
    // Dark fletching
    fill(80, 60, 80, 180);
    triangle(-6, -2.5, -6, 0, -4, -0.8);
    triangle(-6, 2.5, -6, 0, -4, 0.8);
    
    pop();
  } else if (ep.type === 'fireball') {
    // Smoke trail
    for (let i = 0; i < 4; i++) {
      fill(60, 40, 40, 100 - i * 25);
      ellipse(ep.x - ep.vx * i * 1.5, ep.y - ep.vy * i * 1.5, 12 - i * 2, 12 - i * 2);
    }
    
    // Outer flame
    fill(200, 60, 20, 200);
    ellipse(ep.x, ep.y, 16, 16);
    
    // Mid flame
    fill(255, 120, 40, 220);
    ellipse(ep.x, ep.y, 12, 12);
    
    // Inner core
    fill(255, 180, 60, 240);
    ellipse(ep.x, ep.y, 8, 8);
    
    // Hot center
    fill(255, 240, 150);
    ellipse(ep.x, ep.y, 4, 4);
    
    // White hot spot
    fill(255, 255, 255, 200);
    ellipse(ep.x - 1, ep.y - 1, 2, 2);
    
    // Flame glow
    fill(255, 140, 40, 80);
    ellipse(ep.x, ep.y, 20, 20);
    
    // Sparks
    for (let i = 0; i < 3; i++) {
      let angle = random(TWO_PI);
      let dist = random(6, 12);
      fill(255, random(150, 220), 50, random(150, 255));
      ellipse(ep.x + cos(angle) * dist, ep.y + sin(angle) * dist, random(1, 2.5), random(1, 2.5));
    }
  }
}

function drawParticle(particle) {
  fill(...particle.color, particle.life);
  noStroke();
  ellipse(particle.x, particle.y, particle.size);
}

function spawnHitParticles(proj) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: proj.x,
      y: proj.y,
      vx: random(-2, 2),
      vy: random(-2, 2),
      life: 255,
      size: random(2, 5),
      color: TOWER_TYPES[proj.type].projectileColor
    });
  }
}

function spawnDeathParticles(enemy) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: enemy.x,
      y: enemy.y,
      vx: random(-3, 3),
      vy: random(-3, 3),
      life: 255,
      size: random(3, 7),
      color: [255, 220, 100]
    });
  }
}

function applyMageChainDamage(proj) {
  let def = TOWER_TYPES.mage;
  let chainRadius = def.chainRadius;
  let maxHits = proj.chainMax || def.chainMax;
  let hitList = [];
  let current = proj.target;
  if (!current || current.health <= 0) return;
  hitList.push(current);
  current.health -= proj.damage;
  
  // STUN EFFECT - freeze enemy (12/18/24 frames based on tier)
  // BOSSES ARE IMMUNE TO STUN
  let isBoss = (current.type === 'goblinKing' || current.type === 'demonLord' || current.type === 'giant');
  if (!isBoss) {
    if (!current.stunTimer) current.stunTimer = 0;
    current.stunTimer = proj.stunDuration || 12;
  }
  
  spawnHitParticles(proj);
  if (current.health <= 0) {
    gold += current.goldReward;
    spawnDeathParticles(current);
  }
  while (hitList.length < maxHits) {
    let lastHit = hitList[hitList.length - 1];
    let best = null;
    let bestDist = chainRadius + 1;
    for (let e of enemies) {
      if (e.health <= 0 || hitList.includes(e)) continue;
      let dx = e.x - lastHit.x;
      let dy = e.y - lastHit.y;
      let d = sqrt(dx * dx + dy * dy);
      if (d <= chainRadius && d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    if (!best) break;
    best.health -= proj.damage;
    
    // STUN EFFECT on chained enemy - BOSSES ARE IMMUNE
    let isChainedBoss = (best.type === 'goblinKing' || best.type === 'demonLord' || best.type === 'giant');
    if (!isChainedBoss) {
      if (!best.stunTimer) best.stunTimer = 0;
      best.stunTimer = 12;
    }
    
    hitList.push(best);
    
    // ENHANCED CHAIN LIGHTNING VISUAL - Draw actual lightning arc
    let dx = best.x - lastHit.x;
    let dy = best.y - lastHit.y;
    let len = sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
    let perpX = -dy;
    let perpY = dx;
    
    // Create jagged lightning path between enemies
    let segments = 8;
    for (let s = 0; s < segments; s++) {
      let t = s / segments;
      let x = lerp(lastHit.x, best.x, t);
      let y = lerp(lastHit.y, best.y, t);
      let perpOffset = sin(t * PI * 2) * random(8, 15);
      
      particles.push({
        x: x + perpX * perpOffset,
        y: y + perpY * perpOffset,
        vx: random(-0.5, 0.5),
        vy: random(-0.5, 0.5),
        life: 200,
        size: random(4, 7),
        color: [180, 230, 255]
      });
    }
    
    // Add glowing connection particles along the path
    for (let s = 0; s < 12; s++) {
      let t = s / 12;
      let x = lerp(lastHit.x, best.x, t);
      let y = lerp(lastHit.y, best.y, t);
      
      particles.push({
        x: x,
        y: y,
        vx: random(-1, 1),
        vy: random(-1, 1),
        life: 220,
        size: random(2, 4),
        color: [220, 240, 255]
      });
    }
    
    // Impact sparkles at target
    for (let i = 0; i < 12; i++) {
      let angle = random(TWO_PI);
      let speed = random(2, 4);
      particles.push({
        x: best.x,
        y: best.y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        life: 220,
        size: random(3, 5),
        color: [200, 240, 255]
      });
    }
    
    // Electric ring around chained enemy
    for (let i = 0; i < 8; i++) {
      let angle = (TWO_PI / 8) * i;
      particles.push({
        x: best.x + cos(angle) * 15,
        y: best.y + sin(angle) * 15,
        vx: cos(angle) * 1,
        vy: sin(angle) * 1,
        life: 180,
        size: random(2, 4),
        color: [180, 230, 255]
      });
    }
    
    if (best.health <= 0) {
      gold += best.goldReward;
      spawnDeathParticles(best);
    }
  }
}

function getMaxCrystalMines() {
  return 1 + floor(round / 10);
}

function drawCrystalCounter() {
  let mineCount = towers.filter(t => t.type === 'mine').length;
  let maxMines = getMaxCrystalMines();
  let boxW = 100;
  let boxH = 28;
  let boxX = CANVAS_WIDTH - boxW - 8;
  let boxY = 8;
  fill(15, 20, 35, 180);
  noStroke();
  rect(boxX, boxY, boxW, boxH, 6);
  fill(255, 215, 0);
  textSize(13);
  textAlign(LEFT, CENTER);
  text(`Gold Mines: ${mineCount}/${maxMines}`, boxX + 8, boxY + boxH / 2);
}

function drawPlacementPreview() {
  let isValidLocation = canPlaceTower(hoveredCell.x, hoveredCell.y, selectedTower);
  let isWithinRange = isWithinBuildRange(hoveredCell.x, hoveredCell.y, selectedTower);
  
  // Explosion and sticky traps can be placed anywhere, towers must be within range
  let isTrap = (selectedTower === 'explosion' || selectedTower === 'sticky');
  let withinRange = isTrap || isWithinRange;
  
  let data = TOWER_TYPES[selectedTower] || TRAP_TYPES[selectedTower];
  let size = data.size || 1;
  
  // Draw preview for all cells the tower will occupy
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      let cellX = hoveredCell.x + dx;
      let cellY = hoveredCell.y + dy;
      
      if (cellX >= GRID_COLS || cellY >= GRID_ROWS) continue;
      
      if (!isValidLocation || !withinRange) {
        fill(255, 0, 0, 100);
      } else {
        fill(0, 255, 0, 100);
      }
      noStroke();
      rect(cellX * GRID_SIZE, cellY * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }
  }
  
  if (selectedTower !== 'mine') {
    noFill();
    stroke(255, 255, 255, 100);
    strokeWeight(2);
    let x = hoveredCell.x * GRID_SIZE + (GRID_SIZE * size) / 2;
    let y = hoveredCell.y * GRID_SIZE + (GRID_SIZE * size) / 2;
    if (selectedTower === 'explosion') {
      ellipse(x, y, TRAP_TYPES.explosion.triggerRadius * 2);
    } else if (TOWER_TYPES[selectedTower] && TOWER_TYPES[selectedTower].range) {
      ellipse(x, y, TOWER_TYPES[selectedTower].range * 2);
    }
  }
}

// UI layout constants (so click areas match draw)
const UI_LEFT_X = 18;
const UI_TOP_ROW_Y = GRID_ROWS * GRID_SIZE + 24;
const UI_READY_W = 98;
const UI_READY_H = 40;
const UI_TOWER_ROW_Y = GRID_ROWS * GRID_SIZE + 64;
const UI_BUTTON_X = 150; // Moved from 208 to 150 (58 pixels left)
const UI_BUTTON_W = 50;
const UI_BUTTON_H = 48;
const UI_BUTTON_SPACING = 2;
const UI_READY_X = CANVAS_WIDTH - UI_READY_W - 12;
const UI_READY_Y = GRID_ROWS * GRID_SIZE + 8;
const UI_DELETE_X = 8;
const UI_DELETE_Y = 8;
const UI_DELETE_W = 85;
const UI_DELETE_H = 45;
const UI_UPGRADE_X = UI_READY_X;
const UI_UPGRADE_Y = UI_READY_Y + UI_READY_H + 8;
const UI_UPGRADE_W = UI_READY_W;
const UI_UPGRADE_H = 45;
const UI_SPEED_X = CANVAS_WIDTH - 85;
const UI_SPEED_Y = GRID_ROWS * GRID_SIZE - 55;
const UI_SPEED_W = 75;
const UI_SPEED_H = 45;

function drawUI() {
  fill(15, 20, 30);
  noStroke();
  rect(0, GRID_ROWS * GRID_SIZE, CANVAS_WIDTH, 120);
  
  // Delete button (top left corner, only during build phase)
  if (gameState === 'building') {
    if (deleteMode) {
      fill(200, 80, 80);
      stroke(255, 100, 100);
    } else {
      fill(80, 40, 40);
      stroke(150, 80, 80);
    }
    strokeWeight(2);
    rect(UI_DELETE_X, UI_DELETE_Y, UI_DELETE_W, UI_DELETE_H, 5);
    
    fill(255);
    noStroke();
    textSize(14);
    textAlign(CENTER, CENTER);
    text('DELETE', UI_DELETE_X + UI_DELETE_W / 2, UI_DELETE_Y + 14);
    textSize(10);
    text('Get 2/3', UI_DELETE_X + UI_DELETE_W / 2, UI_DELETE_Y + 28);
    text('gold back', UI_DELETE_X + UI_DELETE_W / 2, UI_DELETE_Y + 38);
  }
  
  // Left column: Round, Gold, Base HP (kept within UI_STATS_LEFT_MAX so no overlap with towers)
  fill(255);
  textSize(16);
  textAlign(LEFT);
  text(`Round: ${round}`, UI_LEFT_X, UI_TOP_ROW_Y + 8);
  text(`Gold: ${gold}`, UI_LEFT_X, UI_TOP_ROW_Y + 28);
  fill(255, 100, 100);
  text(`Base HP: ${baseHealth}/${maxBaseHealth}`, UI_LEFT_X, UI_TOWER_ROW_Y + UI_BUTTON_H - 6);
  
  if (gameState === 'building') {
    fill(100, 200, 255);
    textAlign(CENTER);
    textSize(18);
    if (gameMode === 'challenging') {
      text(`Build Phase - ${Math.ceil(buildTimer / 60)}s remaining`, CANVAS_WIDTH / 2, UI_TOP_ROW_Y - 4);
    } else {
      text(`Build Phase - No Time Limit (Relaxed Mode)`, CANVAS_WIDTH / 2, UI_TOP_ROW_Y - 4);
    }
    
    // Castle regeneration info
    if (baseHealth < maxBaseHealth) {
      let regenAmount = 20;
      if (round > 5) {
        regenAmount = 20 - (round - 5);
      }
      if (regenAmount < 5) {
        regenAmount = 5;
      }
      
      // Don't show more than missing health
      let actualRegen = Math.min(regenAmount, maxBaseHealth - baseHealth);
      
      fill(100, 255, 150);
      textSize(13);
      text(`⚕️ Castle regenerating ${actualRegen} HP`, CANVAS_WIDTH / 2, UI_TOP_ROW_Y + 14);
    }
    
    // BOSS WARNING
    if (round === 10 || round === 20 || round === 30) {
      let bossName = round === 10 ? 'GOBLIN KING' : (round === 20 ? 'DEMON LORD' : 'GIANT');
      let pulseAlpha = 200 + sin(frameCount * 0.1) * 55;
      
      fill(255, 50, 50, pulseAlpha);
      textSize(28);
      text(`⚠️ BOSS ROUND ⚠️`, CANVAS_WIDTH / 2, 30);
      
      fill(255, 200, 50);
      textSize(22);
      text(`${bossName} APPROACHING!`, CANVAS_WIDTH / 2, 60);
    }
    
    fill(255, 255, 100);
    textSize(13);
    text('Click a tower below, then click on the grid to place!', CANVAS_WIDTH / 2, UI_TOWER_ROW_Y - 12);
    
    // Ready for next round button (same row as build phase timer, right side)
    fill(60, 140, 80);
    stroke(120, 200, 140);
    strokeWeight(2);
    rect(UI_READY_X, UI_READY_Y, UI_READY_W, UI_READY_H, 6);
    fill(255);
    noStroke();
    textSize(10);
    textAlign(CENTER, CENTER);
    text('Ready for\nnext round', UI_READY_X + UI_READY_W / 2, UI_READY_Y + UI_READY_H / 2);
    
    // Upgrade button (below ready button, build phase only, shows at round 14+)
    let tier2Unlocked = round >= TIER_2_UNLOCK;
    let tier3Unlocked = round >= TIER_3_UNLOCK;
    
    // Only show upgrade button if tier 2 is unlocked
    if (tier2Unlocked) {
      if (upgradeMode) {
        // Active - yellow
        fill(255, 215, 0);
        stroke(255, 215, 0);
      } else {
        // Available - dark yellow
        fill(184, 134, 11);
        stroke(184, 134, 11);
      }
      strokeWeight(2);
      rect(UI_UPGRADE_X, UI_UPGRADE_Y, UI_UPGRADE_W, UI_UPGRADE_H, 6);
      
      fill(255);
      noStroke();
      textSize(13);
      textAlign(CENTER, CENTER);
      text('UPGRADE', UI_UPGRADE_X + UI_UPGRADE_W / 2, UI_UPGRADE_Y + 14);
      textSize(9);
      if (!tier3Unlocked) {
        text('Tier 2', UI_UPGRADE_X + UI_UPGRADE_W / 2, UI_UPGRADE_Y + 28);
        text('available', UI_UPGRADE_X + UI_UPGRADE_W / 2, UI_UPGRADE_Y + 38);
      } else {
        text('Max tier', UI_UPGRADE_X + UI_UPGRADE_W / 2, UI_UPGRADE_Y + 28);
        text('available', UI_UPGRADE_X + UI_UPGRADE_W / 2, UI_UPGRADE_Y + 38);
      }
    }
  } else if (gameState === 'playing') {
    fill(255, 200, 100);
    textAlign(CENTER);
    textSize(18);
    let remainingEnemies = enemiesThisRound - (enemiesSpawned - enemies.length);
    text(`Wave: ${remainingEnemies} / ${enemiesThisRound} enemies`, CANVAS_WIDTH / 2, UI_TOP_ROW_Y + 20);
  }
  
  let buttonX = UI_BUTTON_X;
  let buttonY = UI_TOWER_ROW_Y;
  let buttonWidth = UI_BUTTON_W;
  let buttonHeight = UI_BUTTON_H;
  let spacing = UI_BUTTON_SPACING;

  let types = TOWER_BUTTON_ORDER.filter(t => isTowerUnlocked(t));
  let mineCount = towers.filter(t => t.type === 'mine').length;
  let maxMines = getMaxCrystalMines();
  for (let i = 0; i < types.length; i++) {
    let type = types[i];
    let x = buttonX + i * (buttonWidth + spacing);
    let data = TOWER_TYPES[type] || TRAP_TYPES[type];
    let mineAtCap = (type === 'mine' && mineCount >= maxMines);

    if (selectedTower === type) {
      fill(100, 200, 255);
      stroke(200);
    } else if (mineAtCap || gold < data.cost) {
      fill(60, 60, 60);
      stroke(200);
    } else {
      fill(80, 80, 100);
      stroke(200);
    }

    strokeWeight(2);
    rect(x, buttonY, buttonWidth, buttonHeight, 5);

    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(11);
    
    // Show full name for specific towers, otherwise show first word
    if (type === '2x Archer' || type === 'turret') {
      text('2x Archer', x + buttonWidth / 2, buttonY + 10);
    } else if (type === 'mine') {
      text('Gold Mine', x + buttonWidth / 2, buttonY + 10);
    } else if (type === 'sticky') {
      text('Mine', x + buttonWidth / 2, buttonY + 10);
    } else {
      text(data.name.split(' ')[0], x + buttonWidth / 2, buttonY + 10);
    }

    if (type === 'mine') {
      fill(100, 200, 100);
      text(`+${data.income}g`, x + buttonWidth / 2, buttonY + 24);
    } else if (type === 'explosion') {
      fill(255, 150, 80);
      text(`DMG: ${data.damage}`, x + buttonWidth / 2, buttonY + 24);
    } else if (type === 'sticky') {
      fill(100, 255, 150);
      textSize(10);
      text(`SLOW`, x + buttonWidth / 2, buttonY + 24);
    } else if (type === 'fire') {
      fill(255, 150, 50);
      textSize(9);
      text(`${data.dps} DPS`, x + buttonWidth / 2, buttonY + 24);
    } else if (type === 'barracks') {
      fill(200, 200, 255);
      textSize(10);
      text(`Knights`, x + buttonWidth / 2, buttonY + 24);
    } else if (type === 'mage') {
      fill(180, 230, 255);
      textSize(9);
      text(`${data.damage} +STUN`, x + buttonWidth / 2, buttonY + 24);
    } else {
      text(`DMG: ${data.damage}`, x + buttonWidth / 2, buttonY + 24);
    }
    fill(255, 220, 100);
    textSize(9);
    text(`${data.cost}g`, x + buttonWidth / 2, buttonY + 38);
  }
  
  if (gameState === 'gameOver' || gameState === 'victory') {
    fill(0, 0, 0, 200);
    rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (gameState === 'gameOver') {
      fill(255, 100, 100);
      textSize(48);
      textAlign(CENTER, CENTER);
      text('DEFEAT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      fill(255);
      textSize(20);
      text(`You survived ${round - 1} rounds`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      text('Click to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    } else {
      fill(100, 255, 100);
      textSize(48);
      text('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      fill(255);
      textSize(20);
      text(`Completed all rounds!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      text('Click to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }
  }
}

function updatePlaying() {
  if (enemiesSpawned < enemiesThisRound) {
    spawnTimer++;
    
    // Calculate spawn delay - gets faster every 3 rounds
    let spawnDelay = 60; // Base 1 second (60 frames)
    
    // Reduce delay by 7 frames every 3 rounds (was 5)
    let speedIncrements = Math.floor(round / 3);
    spawnDelay = Math.max(12, spawnDelay - (speedIncrements * 7)); // Minimum 12 frames (was 20)
    
    if (spawnTimer >= spawnDelay) {
      spawnEnemy();
      enemiesSpawned++;
      spawnTimer = 0;
    }
  }
  
  let basePx = baseX * GRID_SIZE + GRID_SIZE;
  let basePy = baseY * GRID_SIZE + GRID_SIZE;
  const BOWMAN_RANGE = 3 * GRID_SIZE;
  const WARLOCK_RANGE = 4 * GRID_SIZE;
  const DRAKE_RANGE = 3 * GRID_SIZE;
  const MELEE_RANGE = 30;

  for (let enemy of enemies) {
    enemy.weaponPhase = (enemy.weaponPhase ?? 0) + 0.12;
    if (enemy.attackCooldown > 0) enemy.attackCooldown -= speedMultiplier;
    
    // Handle stun timer
    if (!enemy.stunTimer) enemy.stunTimer = 0;
    if (enemy.stunTimer > 0) {
      enemy.stunTimer -= speedMultiplier;
      // Enemy is stunned - skip all movement and attacking
      continue;
    }
    
    // BOSSES IGNORE KNIGHTS - they go straight for the base!
    let isBoss = (enemy.type === 'goblinKing' || enemy.type === 'demonLord' || enemy.type === 'giant');
    
    // Check for nearby knights to attack (non-bosses only)
    if (!isBoss) {
      let nearestKnight = null;
      let nearestKnightDist = 100;
      for (let knight of knights) {
        let kdx = knight.x - enemy.x;
        let kdy = knight.y - enemy.y;
        let kdist = sqrt(kdx * kdx + kdy * kdy);
        if (kdist < nearestKnightDist) {
          nearestKnightDist = kdist;
          nearestKnight = knight;
        }
      }
      
      // If knight is very close, attack it instead of base
      if (nearestKnight && nearestKnightDist < MELEE_RANGE + 10) {
        let isRanged = (enemy.type === 'bowman' || enemy.type === 'warlock' || enemy.type === 'drake');
        let kdx = nearestKnight.x - enemy.x;
        let kdy = nearestKnight.y - enemy.y;
        
        if (!isRanged && nearestKnightDist < MELEE_RANGE) {
          if (enemy.attackCooldown <= 0) {
            nearestKnight.health -= enemy.damage;
            enemy.attackCooldown = 60;
            for (let i = 0; i < 8; i++) {
              particles.push({ x: nearestKnight.x, y: nearestKnight.y, vx: random(-2, 2), vy: random(-2, 2), life: 200, size: random(2, 5), color: [255, 200, 100] });
            }
          }
        } else if (isRanged && ((enemy.type === 'bowman' && nearestKnightDist < BOWMAN_RANGE) || 
                               (enemy.type === 'warlock' && nearestKnightDist < WARLOCK_RANGE) ||
                               (enemy.type === 'drake' && nearestKnightDist < DRAKE_RANGE))) {
          if (enemy.attackCooldown <= 0) {
            let speed = 5;
            let vx = (kdx / nearestKnightDist) * speed;
            let vy = (kdy / nearestKnightDist) * speed;
            if (enemy.type === 'bowman') {
              enemyProjectiles.push({ x: enemy.x, y: enemy.y, vx, vy, damage: enemy.damage, type: 'arrow', hit: false, targetKnight: true });
              enemy.attackCooldown = 75;
            } else if (enemy.type === 'warlock') {
              enemyProjectiles.push({ x: enemy.x, y: enemy.y, vx, vy, damage: enemy.damage, type: 'fireball', hit: false, targetKnight: true });
              enemy.attackCooldown = 100;
            }
          }
        } else {
          // Move toward knight
          let moveSpeed = enemy.speed;
          if (enemy.isSlowed) {
            moveSpeed *= (1 - enemy.slowPercent);
          }
          
          enemy.x += (kdx / nearestKnightDist) * moveSpeed * speedMultiplier;
          enemy.y += (kdy / nearestKnightDist) * moveSpeed * speedMultiplier;
        }
        continue;
      }
    }
    
    // Otherwise target base as normal (bosses always come here)
    let dx = basePx - enemy.x;
    let dy = basePy - enemy.y;
    let dist = sqrt(dx * dx + dy * dy);
    
    let isRanged = (enemy.type === 'bowman' || enemy.type === 'warlock' || enemy.type === 'drake');
    let inRangedRange = (enemy.type === 'bowman' && dist <= BOWMAN_RANGE) || 
                        (enemy.type === 'warlock' && dist <= WARLOCK_RANGE) ||
                        (enemy.type === 'drake' && dist <= DRAKE_RANGE);
    
    if (isRanged && inRangedRange) {
      if (enemy.attackCooldown <= 0) {
        let speed = 5;
        let vx = (dx / dist) * speed;
        let vy = (dy / dist) * speed;
        if (enemy.type === 'bowman') {
          enemyProjectiles.push({ x: enemy.x, y: enemy.y, vx, vy, damage: enemy.damage, type: 'arrow', hit: false });
          enemy.attackCooldown = 75;
        } else if (enemy.type === 'warlock' || enemy.type === 'drake') {
          enemyProjectiles.push({ x: enemy.x, y: enemy.y, vx, vy, damage: enemy.damage, type: 'fireball', hit: false });
          enemy.attackCooldown = 100;
        }
      }
    } else if (!isRanged && dist <= MELEE_RANGE) {
      // Melee enemy is in range of castle
      
      // GOBLINS AND ORCS: Suicide attack (die on impact)
      if (enemy.type === 'goblin' || enemy.type === 'orc') {
        baseHealth -= enemy.damage;
        enemy.health = 0; // Die immediately
        
        // Explosion particles for suicide attack
        for (let i = 0; i < 15; i++) {
          particles.push({ x: enemy.x, y: enemy.y, vx: random(-3, 3), vy: random(-3, 3), life: 255, size: random(3, 8), color: [255, 100, 100] });
        }
        
        if (baseHealth <= 0) gameState = 'gameOver';
      } 
      // ALL OTHER MELEE ENEMIES: Stay alive and keep attacking
      else {
        if (enemy.attackCooldown <= 0) {
          baseHealth -= enemy.damage;
          enemy.attackCooldown = 60; // Attack once per second
          
          // Attack particles
          for (let i = 0; i < 15; i++) {
            particles.push({ x: enemy.x, y: enemy.y, vx: random(-3, 3), vy: random(-3, 3), life: 255, size: random(3, 8), color: [255, 100, 100] });
          }
          
          if (baseHealth <= 0) gameState = 'gameOver';
        }
      }
    } else if (dist > (isRanged ? (enemy.type === 'bowman' ? BOWMAN_RANGE : (enemy.type === 'drake' ? DRAKE_RANGE : WARLOCK_RANGE)) : MELEE_RANGE)) {
      // Apply slow if enemy is in sticky puddle
      let moveSpeed = enemy.speed;
      if (enemy.isSlowed) {
        moveSpeed *= (1 - enemy.slowPercent); // Reduce speed by slow percent
      }
      
      enemy.x += (dx / dist) * moveSpeed * speedMultiplier;
      enemy.y += (dy / dist) * moveSpeed * speedMultiplier;
    }
  }
  
  for (let ep of enemyProjectiles) {
    ep.x += ep.vx * speedMultiplier;
    ep.y += ep.vy * speedMultiplier;
    
    // Check collision with knights if targeting them
    if (ep.targetKnight) {
      for (let knight of knights) {
        let kdx = knight.x - ep.x;
        let kdy = knight.y - ep.y;
        if (sqrt(kdx * kdx + kdy * kdy) < 15) {
          knight.health -= ep.damage;
          ep.hit = true;
          for (let i = 0; i < (ep.type === 'fireball' ? 12 : 6); i++) {
            particles.push({ x: ep.x, y: ep.y, vx: random(-2, 2), vy: random(-2, 2), life: 255, size: random(2, 6), color: ep.type === 'fireball' ? [255, 100, 40] : [101, 67, 33] });
          }
          break;
        }
      }
      if (ep.hit) continue;
    }
    
    // Check collision with base
    let ddx = basePx - ep.x;
    let ddy = basePy - ep.y;
    if (sqrt(ddx * ddx + ddy * ddy) < 35) {
      baseHealth -= ep.damage;
      ep.hit = true;
      for (let i = 0; i < (ep.type === 'fireball' ? 12 : 6); i++) {
        particles.push({ x: ep.x, y: ep.y, vx: random(-2, 2), vy: random(-2, 2), life: 255, size: random(2, 6), color: ep.type === 'fireball' ? [255, 100, 40] : [101, 67, 33] });
      }
      if (baseHealth <= 0) gameState = 'gameOver';
    }
  }
  
  // Knight AI - move toward nearest enemy and attack
  for (let knight of knights) {
    if (knight.attackCooldown > 0) knight.attackCooldown -= speedMultiplier;
    
    // Check distance from barracks (leash range)
    let leashRange = TOWER_TYPES.barracks.knightLeashRange * GRID_SIZE;
    let dxBarracks = knight.x - knight.barracksX;
    let dyBarracks = knight.y - knight.barracksY;
    let distFromBarracks = sqrt(dxBarracks * dxBarracks + dyBarracks * dyBarracks);
    
    let nearestEnemy = null;
    let nearestDist = 999999;
    for (let enemy of enemies) {
      let dx = enemy.x - knight.x;
      let dy = enemy.y - knight.y;
      let dist = sqrt(dx * dx + dy * dy);
      
      // Only target enemies within leash range of barracks
      let edxBarracks = enemy.x - knight.barracksX;
      let edyBarracks = enemy.y - knight.barracksY;
      let enemyDistFromBarracks = sqrt(edxBarracks * edxBarracks + edyBarracks * edyBarracks);
      
      if (dist < nearestDist && enemyDistFromBarracks <= leashRange) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }
    
    if (nearestEnemy) {
      let dx = nearestEnemy.x - knight.x;
      let dy = nearestEnemy.y - knight.y;
      let dist = sqrt(dx * dx + dy * dy);
      
      if (dist <= knight.attackRange) {
        // Attack
        if (knight.attackCooldown <= 0) {
          nearestEnemy.health -= knight.damage;
          knight.attackCooldown = knight.attackSpeed;
          
          // Hit particles
          for (let i = 0; i < 8; i++) {
            particles.push({
              x: nearestEnemy.x,
              y: nearestEnemy.y,
              vx: random(-2, 2),
              vy: random(-2, 2),
              life: 200,
              size: random(2, 5),
              color: [255, 200, 100]
            });
          }
          
          if (nearestEnemy.health <= 0) {
            gold += nearestEnemy.goldReward;
            spawnDeathParticles(nearestEnemy);
          }
        }
      } else {
        // Move toward enemy (but check leash)
        let wouldBeX = knight.x + (dx / dist) * knight.speed * speedMultiplier;
        let wouldBeY = knight.y + (dy / dist) * knight.speed * speedMultiplier;
        let wouldBeDx = wouldBeX - knight.barracksX;
        let wouldBeDy = wouldBeY - knight.barracksY;
        let wouldBeDist = sqrt(wouldBeDx * wouldBeDx + wouldBeDy * wouldBeDy);
        
        // Only move if it keeps knight within leash range
        if (wouldBeDist <= leashRange) {
          knight.x = wouldBeX;
          knight.y = wouldBeY;
        }
      }
    } else {
      // No enemy in leash range - return to barracks if outside leash
      if (distFromBarracks > leashRange * 0.5) {
        let dx = knight.barracksX - knight.x;
        let dy = knight.barracksY - knight.y;
        let dist = sqrt(dx * dx + dy * dy);
        if (dist > 10) { // Don't jitter when very close
          knight.x += (dx / dist) * knight.speed * speedMultiplier;
          knight.y += (dy / dist) * knight.speed * speedMultiplier;
        }
      }
    }
  }
  
  // Remove dead knights and update barracks counts
  let deadKnights = knights.filter(k => k.health <= 0);
  for (let knight of deadKnights) {
    // Knight death particles
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: knight.x,
        y: knight.y,
        vx: random(-3, 3),
        vy: random(-3, 3),
        life: 255,
        size: random(3, 7),
        color: [200, 200, 220]
      });
    }
    
    // Update barracks count
    if (knight.barracksId !== undefined && towers[knight.barracksId]) {
      towers[knight.barracksId].knightCount--;
    }
  }
  knights = knights.filter(k => k.health > 0);
  
  // Update slow puddles
  for (let puddle of slowPuddles) {
    puddle.life -= speedMultiplier;
  }
  slowPuddles = slowPuddles.filter(p => p.life > 0);
  
  // Apply slow effect to enemies in puddles
  for (let enemy of enemies) {
    // Initialize slow timer if needed
    if (!enemy.slowTimer) enemy.slowTimer = 0;
    
    // Decrease slow timer
    if (enemy.slowTimer > 0) {
      enemy.slowTimer -= speedMultiplier;
    }
    
    // Check if enemy is in any puddle
    let inPuddle = false;
    for (let puddle of slowPuddles) {
      let enemyGridX = floor(enemy.x / GRID_SIZE);
      let enemyGridY = floor(enemy.y / GRID_SIZE);
      
      // Check if enemy is in the 2x2 puddle area
      if (enemyGridX >= puddle.gridX && enemyGridX < puddle.gridX + puddle.size &&
          enemyGridY >= puddle.gridY && enemyGridY < puddle.gridY + puddle.size) {
        inPuddle = true;
        enemy.slowTimer = puddle.debuffDuration; // Refresh timer while in puddle
        enemy.slowPercent = puddle.slowPercent;
        break; // One puddle is enough
      }
    }
    
    // Set slow flag based on timer (persists after leaving puddle)
    enemy.isSlowed = enemy.slowTimer > 0;
  }
  
  // Check traps for proximity trigger
  let trapsToRemove = [];
  for (let trap of traps) {
    let trapCx = trap.x * GRID_SIZE + GRID_SIZE / 2;
    let trapCy = trap.y * GRID_SIZE + GRID_SIZE / 2;
    let def = TRAP_TYPES[trap.type];

    for (let enemy of enemies) {
      let dx = enemy.x - trapCx;
      let dy = enemy.y - trapCy;
      if (sqrt(dx * dx + dy * dy) < def.triggerRadius) {
        
        if (trap.type === 'sticky') {
          // STICKY MINE: Create slow puddle
          slowPuddles.push({
            gridX: trap.x,
            gridY: trap.y,
            life: def.puddleDuration,
            slowPercent: def.slowPercent,
            debuffDuration: def.debuffDuration,
            size: def.puddleSize
          });
          
          // Green goo explosion particles
          for (let i = 0; i < 40; i++) {
            let angle = random(TWO_PI);
            let speed = random(2, 6);
            particles.push({
              x: trapCx,
              y: trapCy,
              vx: cos(angle) * speed,
              vy: sin(angle) * speed - random(1, 2),
              life: random(150, 200),
              size: random(3, 8),
              color: [random(80, 120), random(200, 255), random(100, 150)]
            });
          }
          
        } else {
          // EXPLOSION MINE: Damage enemies
          for (let e of enemies) {
            let edx = e.x - trapCx;
            let edy = e.y - trapCy;
            if (sqrt(edx * edx + edy * edy) < def.blastRadius) {
              e.health -= def.damage;
              if (e.health <= 0) gold += e.goldReward;
            }
          }
          
          // SPECTACULAR EXPLOSION EFFECT
          // Fire burst particles
          for (let i = 0; i < 50; i++) {
            let angle = random(TWO_PI);
            let speed = random(2, 8);
            particles.push({
              x: trapCx,
              y: trapCy,
              vx: cos(angle) * speed,
              vy: sin(angle) * speed - random(1, 3),
              life: random(200, 255),
              size: random(4, 12),
              color: random() > 0.5 ? [255, random(100, 180), 40] : [255, random(50, 100), 20]
            });
          }
          
          // Smoke particles
          for (let i = 0; i < 30; i++) {
            let angle = random(TWO_PI);
            let speed = random(1, 4);
            particles.push({
              x: trapCx,
              y: trapCy,
              vx: cos(angle) * speed,
              vy: sin(angle) * speed - random(2, 4),
              life: random(150, 200),
              size: random(6, 16),
              color: [random(50, 80), random(40, 60), random(40, 60)]
            });
          }
          
          // Bright flash particles
          for (let i = 0; i < 20; i++) {
            let angle = random(TWO_PI);
            let speed = random(3, 10);
            particles.push({
            x: trapCx,
            y: trapCy,
            vx: cos(angle) * speed,
            vy: sin(angle) * speed,
            life: 255,
            size: random(2, 6),
            color: [255, 255, random(150, 255)]
          });
        }
        
        // Shockwave ring particles
        for (let i = 0; i < 15; i++) {
          let angle = (TWO_PI / 15) * i;
          let speed = 12;
          particles.push({
            x: trapCx,
            y: trapCy,
            vx: cos(angle) * speed,
            vy: sin(angle) * speed,
            life: 180,
            size: 8,
            color: [255, 200, 100]
          });
        }
        }  // End of explosion mine else block
        
        trapsToRemove.push(trap);
        break;
      }
    }
  }
  traps = traps.filter(t => !trapsToRemove.includes(t));

  for (let tower of towers) {
    if (tower.cooldown > 0) {
      tower.cooldown -= speedMultiplier;
    }

    if (tower.type === 'mine') {
      tower.incomeTimer++;
      if (tower.incomeTimer >= 300) {
        gold += TOWER_TYPES.mine.income;
        tower.incomeTimer = 0;
        
        for (let i = 0; i < 5; i++) {
          particles.push({
            x: tower.x * GRID_SIZE + GRID_SIZE / 2,
            y: tower.y * GRID_SIZE + GRID_SIZE / 2,
            vx: random(-1, 1),
            vy: random(-3, -1),
            life: 255,
            size: random(3, 6),
            color: [100, 200, 255]
          });
        }
      }
    } else if (tower.type === 'fire') {
      // Fire tower continuous beam attack
      if (!tower.target) tower.target = null;
      if (!tower.target2) tower.target2 = null;
      
      // Calculate tower center (2x2 tower)
      let size = TOWER_TYPES.fire.size || 1;
      let tx = tower.x * GRID_SIZE + (GRID_SIZE * size) / 2;
      let ty = tower.y * GRID_SIZE + (GRID_SIZE * size) / 2;
      
      // Tier 3 can target two enemies, tier 1-2 targets one
      let maxTargets = (tower.tier === 3) ? 2 : 1;
      
      // Keep current targets if they're still alive and in range
      if (tower.target && tower.target.health > 0) {
        let dx = tower.target.x - tx;
        let dy = tower.target.y - ty;
        let dist = sqrt(dx * dx + dy * dy);
        if (dist > TOWER_TYPES.fire.range) {
          tower.target = null; // Out of range, clear target
        }
      } else {
        tower.target = null; // Dead or invalid, clear target
      }
      
      if (tower.target2 && tower.target2.health > 0) {
        let dx = tower.target2.x - tx;
        let dy = tower.target2.y - ty;
        let dist = sqrt(dx * dx + dy * dy);
        if (dist > TOWER_TYPES.fire.range) {
          tower.target2 = null; // Out of range, clear target
        }
      } else {
        tower.target2 = null; // Dead or invalid, clear target
      }
      
      // Find new targets if needed
      if (!tower.target || (maxTargets === 2 && !tower.target2)) {
        let enemiesByDistance = enemies.filter(enemy => {
          let dx = enemy.x - tx;
          let dy = enemy.y - ty;
          let dist = sqrt(dx * dx + dy * dy);
          return dist <= TOWER_TYPES.fire.range;
        }).sort((a, b) => {
          let distA = sqrt(pow(a.x - tx, 2) + pow(a.y - ty, 2));
          let distB = sqrt(pow(b.x - tx, 2) + pow(b.y - ty, 2));
          return distA - distB;
        });
        
        // Assign first target if needed
        if (!tower.target && enemiesByDistance.length > 0) {
          tower.target = enemiesByDistance[0];
        }
        
        // Assign second target if tier 3 and needed (must be different from first)
        if (maxTargets === 2 && !tower.target2 && enemiesByDistance.length > 1) {
          for (let enemy of enemiesByDistance) {
            if (enemy !== tower.target) {
              tower.target2 = enemy;
              break;
            }
          }
        }
      }
      
      // Apply continuous damage to targets - FULL damage per beam
      let damagePerFrame = (tower.dps || TOWER_TYPES.fire.dps) / 60;
      
      // Damage first target
      if (tower.target) {
        tower.target.health -= damagePerFrame * speedMultiplier;
        
        if (tower.target.health <= 0) {
          gold += tower.target.goldReward;
          spawnDeathParticles(tower.target);
          tower.target = null; // Clear dead target
        } else {
          // Draw fire beam to first target
          drawFireBeam(tx, ty, tower.target.x, tower.target.y);
        }
      }
      
      // Damage second target (tier 3 only)
      if (tower.target2) {
        tower.target2.health -= damagePerFrame * speedMultiplier;
        
        if (tower.target2.health <= 0) {
          gold += tower.target2.goldReward;
          spawnDeathParticles(tower.target2);
          tower.target2 = null; // Clear dead target
        } else {
          // Draw fire beam to second target
          drawFireBeam(tx, ty, tower.target2.x, tower.target2.y);
        }
      }
    } else if (tower.type === 'barracks') {
      // Barracks spawns knights
      if (!tower.spawnCooldown) tower.spawnCooldown = 0;
      if (!tower.knightCount) tower.knightCount = 0;
      
      tower.spawnCooldown--;
      
      if (tower.spawnCooldown <= 0 && tower.knightCount < (tower.maxKnights || TOWER_TYPES.barracks.maxKnights)) {
        // Calculate barracks center (3x3 tower)
        let size = TOWER_TYPES.barracks.size || 1;
        let tx = tower.x * GRID_SIZE + (GRID_SIZE * size) / 2;
        let ty = tower.y * GRID_SIZE + (GRID_SIZE * size) / 2;
        
        // Spawn knight near barracks
        let spawnAngle = random(TWO_PI);
        let knightHP = tower.knightHealth || 140;
        let knightDmg = tower.knightDamage || 15;
        knights.push({
          x: tx + cos(spawnAngle) * 30,
          y: ty + sin(spawnAngle) * 30,
          health: knightHP,
          maxHealth: knightHP,
          speed: 0.8,
          damage: knightDmg,
          attackSpeed: 45,
          attackCooldown: 0,
          attackRange: 25,
          barracksId: towers.indexOf(tower),
          barracksX: tx,
          barracksY: ty
        });
        
        tower.knightCount++;
        tower.spawnCooldown = TOWER_TYPES.barracks.spawnCooldown;
        
        // Spawn particles
        for (let i = 0; i < 15; i++) {
          particles.push({
            x: tx,
            y: ty,
            vx: random(-3, 3),
            vy: random(-3, 3),
            life: 200,
            size: random(3, 6),
            color: [200, 200, 255]
          });
        }
      }
    } else if (tower.cooldown <= 0) {
      let target = null;
      let minDist = TOWER_TYPES[tower.type].range;
      
      // Calculate tower center based on size
      let size = TOWER_TYPES[tower.type].size || 1;
      let tx = tower.x * GRID_SIZE + (GRID_SIZE * size) / 2;
      let ty = tower.y * GRID_SIZE + (GRID_SIZE * size) / 2;
      
      for (let enemy of enemies) {
        let dx = enemy.x - tx;
        let dy = enemy.y - ty;
        let dist = sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
          minDist = dist;
          target = enemy;
        }
      }
      
      if (target) {
        let dx = target.x - tx;
        let dy = target.y - ty;
        let dist = sqrt(dx * dx + dy * dy);
        
        projectiles.push({
          x: tx,
          y: ty,
          vx: (dx / dist) * 6,
          vy: (dy / dist) * 6,
          damage: tower.damage || TOWER_TYPES[tower.type].damage,
          target: target,
          type: tower.type,
          hit: false,
          stunDuration: tower.stunDuration || 12,
          chainMax: tower.chainMax || TOWER_TYPES[tower.type].chainMax
        });
        
        // MUZZLE FLASH EFFECTS
        if (tower.type === 'turret' || tower.type === 'archer') {
          // Arrow release effect
          for (let i = 0; i < 3; i++) {
            particles.push({
              x: tx,
              y: ty,
              vx: random(-1, 1),
              vy: random(-2, 2),
              life: random(80, 120),
              size: random(1, 3),
              color: [200, 180, 150]
            });
          }
        } else if (tower.type === 'mage') {
          // Magic sparkles
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: tx,
              y: ty,
              vx: random(-2, 2),
              vy: random(-3, -1),
              life: random(150, 200),
              size: random(2, 5),
              color: [random(150, 220), random(200, 255), 255]
            });
          }
        }
        
        tower.cooldown = tower.fireRate || TOWER_TYPES[tower.type].fireRate;
      }
    }
  }
  
  for (let proj of projectiles) {
    proj.x += proj.vx * speedMultiplier;
    proj.y += proj.vy * speedMultiplier;
    
    if (proj.target && proj.target.health > 0) {
      let dx = proj.target.x - proj.x;
      let dy = proj.target.y - proj.y;
      let dist = sqrt(dx * dx + dy * dy);
      
      if (dist < 10) {
        if (proj.type === 'mage') {
          applyMageChainDamage(proj);
        } else {
          proj.target.health -= proj.damage;
          spawnHitParticles(proj);
          if (proj.target.health <= 0) {
            gold += proj.target.goldReward;
            spawnDeathParticles(proj.target);
          }
        }
        proj.hit = true;
      }
    } else {
      proj.hit = true;
    }
  }
  
  for (let particle of particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.1;
    particle.life -= 5 * speedMultiplier;
  }
  
  if (enemies.length === 0 && enemiesSpawned >= enemiesThisRound) {
    if (round >= 30) {
      gameState = 'victory';
    } else {
      round++;
      startBuildPhase();
    }
  }
}

function updateBuilding() {
  // Only countdown timer in challenging mode
  if (gameMode === 'challenging') {
    buildTimer--;
    
    if (buildTimer <= 0) {
      startCombatPhase();
    }
  }
}

function startBuildPhase() {
  gameState = 'building';
  buildTimer = 3000; // 50 seconds at 60fps
  
  // Castle health regeneration mechanic - FLAT HP regeneration
  if (baseHealth < maxBaseHealth) {
    // Start at 20 HP for first 5 rounds
    let regenAmount = 20;
    
    // After round 5, reduce by 1 HP per round
    if (round > 5) {
      regenAmount = 20 - (round - 5);
    }
    
    // Minimum 5 HP regeneration
    if (regenAmount < 5) {
      regenAmount = 5;
    }
    
    // Don't overheal
    let actualRegen = Math.min(regenAmount, maxBaseHealth - baseHealth);
    
    if (actualRegen > 0) {
      baseHealth += actualRegen;
      console.log(`Castle regenerated ${actualRegen} HP`);
      
      // Create healing particles
      for (let i = 0; i < 20; i++) {
        let angle = random(TWO_PI);
        let dist = random(30, 50);
        let x = (baseX + 1) * GRID_SIZE + cos(angle) * dist;
        let y = (baseY + 1) * GRID_SIZE + sin(angle) * dist;
        particles.push({
          x: x,
          y: y,
          vx: 0,
          vy: random(-1, -2),
          life: 150,
          size: random(2, 4),
          color: [100, 255, 150]
        });
      }
    }
  }
  
  console.log('Build phase - Round', round);
}

function startCombatPhase() {
  gameState = 'playing';
  
  // Boss rounds have fewer total enemies
  if (round === 10 || round === 20 || round === 30) {
    enemiesThisRound = 1 + round; // Boss + some minions
  } else {
    enemiesThisRound = 5 + round * 3;
    
    // After round 13, add 18 more enemies per round (was 12)
    if (round > 13) {
      enemiesThisRound += (round - 13) * 18;
    }
    
    // Additional scaling after round 20
    if (round > 20) {
      enemiesThisRound += (round - 20) * 10;
    }
  }
  
  enemiesSpawned = 0;
  spawnTimer = 0;
  console.log('Combat! Spawning', enemiesThisRound, 'enemies');
}

function spawnEnemy() {
  let side = floor(random(4));
  let x, y;
  
  if (side === 0) {
    x = random(CANVAS_WIDTH);
    y = -20;
  } else if (side === 1) {
    x = CANVAS_WIDTH + 20;
    y = random(GRID_ROWS * GRID_SIZE);
  } else if (side === 2) {
    x = random(CANVAS_WIDTH);
    y = GRID_ROWS * GRID_SIZE + 20;
  } else {
    x = -20;
    y = random(GRID_ROWS * GRID_SIZE);
  }
  
  let type, health, speed, damage, goldReward;
  
  let goblinHealth = 30 + round * 5;
  
  // Additional health scaling after round 15
  if (round > 15) {
    goblinHealth += (round - 15) * 8;
  }
  
  let orcHealth = floor(goblinHealth * (5 / 3));
  let warlockHealth = max(18, floor(goblinHealth * 0.7));

  // BOSS ROUNDS
  if (round === 10 && enemiesSpawned === 0) {
    // Goblin King Boss
    type = 'goblinKing';
    health = 1800;
    speed = 0.7;
    damage = 15;
    goldReward = 100;
  } else if (round === 20 && enemiesSpawned === 0) {
    // Demon Lord Boss
    type = 'demonLord';
    health = 4500;
    speed = 0.5;
    damage = 30;
    goldReward = 200;
  } else if (round === 30 && enemiesSpawned === 0) {
    // Giant Boss
    type = 'giant';
    health = 13000;
    speed = 0.4;
    damage = 40;
    goldReward = 300;
  } else if (round <= 2) {
    type = 'goblin';
    health = goblinHealth;
    speed = 1;
    damage = 5;
    goldReward = 5;
  } else if (round <= 4) {
    let r = random();
    if (r > 0.6) {
      type = 'goblin';
      health = goblinHealth;
      speed = 1.1;
      damage = 5;
      goldReward = 5;
    } else if (r > 0.25) {
      type = 'bowman';
      health = goblinHealth;
      speed = 1;
      damage = 5;
      goldReward = 5;
    } else {
      type = 'orc';
      health = orcHealth;
      speed = 0.85;
      damage = 5;
      goldReward = 10;
    }
  } else if (round <= 10) {
    let r = random();
    if (r > 0.65) {
      type = 'goblin';
      health = goblinHealth;
      speed = 1.2;
      damage = 5;
      goldReward = 5;
    } else if (r > 0.4) {
      type = 'bowman';
      health = goblinHealth;
      speed = 1;
      damage = 5;
      goldReward = 5;
    } else if (r > 0.2) {
      type = 'orc';
      health = orcHealth;
      speed = 0.9;
      damage = 5;
      goldReward = 10;
    } else {
      type = 'warlock';
      health = warlockHealth;
      speed = 0.85;
      damage = 8;
      goldReward = 5;
    }
  } else if (round <= 22) {
    // Rounds 11-22: demons, trolls (starting round 20), orcs, warlocks, bowmen, goblins
    let rand = random();
    if (round >= 20 && rand > 0.85) {
      type = 'troll';
      health = 800;
      speed = 0.55;
      damage = 35;
      goldReward = 20;
    } else if (rand > 0.65) {
      type = 'demon';
      health = 150 + round * 20;
      speed = 0.6;
      damage = 20;
      goldReward = 15;
    } else if (rand > 0.4) {
      type = 'orc';
      health = orcHealth;
      speed = 0.9;
      damage = 5;
      goldReward = 10;
    } else if (rand > 0.2) {
      type = 'warlock';
      health = warlockHealth;
      speed = 0.8;
      damage = 10;
      goldReward = 5;
    } else if (rand > 0.05) {
      type = 'bowman';
      health = goblinHealth;
      speed = 1;
      damage = 5;
      goldReward = 5;
    } else {
      type = 'goblin';
      health = goblinHealth;
      speed = 1.3;
      damage = 5;
      goldReward = 5;
    }
  } else {
    // Rounds 23+: All enemy types including drakes
    let rand = random();
    if (rand > 0.82) {
      type = 'drake';
      health = 600;
      speed = 0.75;
      damage = 17; // About 2/3 more than warlock (10 * 1.7 ≈ 17)
      goldReward = 25;
    } else if (rand > 0.72) {
      type = 'troll';
      health = 800;
      speed = 0.55;
      damage = 35;
      goldReward = 20;
    } else if (rand > 0.55) {
      type = 'demon';
      health = 150 + round * 20;
      speed = 0.6;
      damage = 20;
      goldReward = 15;
    } else if (rand > 0.35) {
      type = 'orc';
      health = orcHealth;
      speed = 0.9;
      damage = 5;
      goldReward = 10;
    } else if (rand > 0.2) {
      type = 'warlock';
      health = warlockHealth;
      speed = 0.8;
      damage = 10;
      goldReward = 5;
    } else if (rand > 0.05) {
      type = 'bowman';
      health = goblinHealth;
      speed = 1;
      damage = 5;
      goldReward = 5;
    } else {
      type = 'goblin';
      health = goblinHealth;
      speed = 1.3;
      damage = 5;
      goldReward = 5;
    }
  }
  
  enemies.push({
    x: x,
    y: y,
    health: health,
    maxHealth: health,
    weaponPhase: random(TWO_PI),
    attackCooldown: 0,
    speed: speed,
    damage: damage,
    goldReward: goldReward,
    type: type
  });
}

function isWithinBuildRange(gridX, gridY, towerType) {
  // For a 2x2 base, we want to allow 4 tiles away from ANY edge of the base
  // Base occupies: (baseX, baseY), (baseX+1, baseY), (baseX, baseY+1), (baseX+1, baseY+1)
  
  // If no tower type specified, just check the single cell
  if (!towerType) {
    // Check if cell is within 4 tiles of ANY base cell
    for (let by = 0; by < baseSize; by++) {
      for (let bx = 0; bx < baseSize; bx++) {
        let dx = abs(gridX - (baseX + bx));
        let dy = abs(gridY - (baseY + by));
        if (dx <= 4 && dy <= 4) {
          return true;
        }
      }
    }
    return false;
  }
  
  // For multi-tile towers, check that ALL cells are within range
  let data = TOWER_TYPES[towerType] || TRAP_TYPES[towerType];
  let size = data.size || 1;
  
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      let checkX = gridX + dx;
      let checkY = gridY + dy;
      
      // Check if THIS cell is within range of ANY base cell
      let withinRange = false;
      for (let by = 0; by < baseSize; by++) {
        for (let bx = 0; bx < baseSize; bx++) {
          let distX = abs(checkX - (baseX + bx));
          let distY = abs(checkY - (baseY + by));
          
          if (distX <= 4 && distY <= 4) {
            withinRange = true;
            break;
          }
        }
        if (withinRange) break;
      }
      
      // If ANY cell is outside the range, return false
      if (!withinRange) {
        return false;
      }
    }
  }
  
  return true;
}

function canPlaceTower(gridX, gridY, towerType) {
  let size = 1;
  if (towerType) {
    let data = TOWER_TYPES[towerType] || TRAP_TYPES[towerType];
    size = data.size || 1;
  }
  
  // Check all cells the tower would occupy
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      let checkX = gridX + dx;
      let checkY = gridY + dy;
      
      // Check bounds
      if (checkX >= GRID_COLS || checkY >= GRID_ROWS) return false;
      
      // Check if base is here (2x2 base area)
      for (let by = 0; by < baseSize; by++) {
        for (let bx = 0; bx < baseSize; bx++) {
          if (checkX === baseX + bx && checkY === baseY + by) return false;
        }
      }
      
      // Check if any tower occupies this cell
      for (let tower of towers) {
        let towerSize = TOWER_TYPES[tower.type].size || 1;
        for (let tdy = 0; tdy < towerSize; tdy++) {
          for (let tdx = 0; tdx < towerSize; tdx++) {
            if (tower.x + tdx === checkX && tower.y + tdy === checkY) {
              return false;
            }
          }
        }
      }
      
      // Check if any trap occupies this cell
      for (let trap of traps) {
        if (trap.x === checkX && trap.y === checkY) return false;
      }
    }
  }
  
  return true;
}

function mousePressed() {
  // Handle tutorial Next button click
  if (tutorialActive && window.tutorialNextButton) {
    let btn = window.tutorialNextButton;
    if (mouseX >= btn.x && mouseX <= btn.x + btn.w &&
        mouseY >= btn.y && mouseY <= btn.y + btn.h) {
      nextTutorialMessage();
      return;
    }
  }
  
  // Handle intro screen mode selection
  if (gameState === 'intro') {
    let relaxedX = CANVAS_WIDTH / 2 - 230;
    let relaxedY = 400;
    let buttonW = 200;
    let buttonH = 70;
    
    // Relaxed mode button
    if (mouseX >= relaxedX && mouseX <= relaxedX + buttonW &&
        mouseY >= relaxedY && mouseY <= relaxedY + buttonH) {
      gameMode = 'relaxed';
      tutorialActive = true; // Enable Sir Tut tutorial
      startBuildPhase();
      console.log('Game started in RELAXED mode with Sir Tut tutorial! Round:', round);
      return;
    }
    
    // Challenging mode button
    let challengingX = CANVAS_WIDTH / 2 + 30;
    let challengingY = 400;
    if (mouseX >= challengingX && mouseX <= challengingX + buttonW &&
        mouseY >= challengingY && mouseY <= challengingY + buttonH) {
      gameMode = 'challenging';
      tutorialActive = false; // No tutorial in challenging mode
      startBuildPhase();
      console.log('Game started in CHALLENGING mode! Round:', round);
      return;
    }
    return;
  }
  
  // Speed button (only during gameplay)
  if (gameState === 'playing' || gameState === 'building') {
    if (mouseX >= UI_SPEED_X && mouseX <= UI_SPEED_X + UI_SPEED_W &&
        mouseY >= UI_SPEED_Y && mouseY <= UI_SPEED_Y + UI_SPEED_H) {
      speedMultiplier = speedMultiplier === 1 ? 2 : 1;
      console.log('Speed multiplier:', speedMultiplier);
      return;
    }
  }
  
  if (gameState === 'gameOver' || gameState === 'victory') {
    round = 1;
    gold = 150;
    baseHealth = 100;
    enemies = [];
    towers = [];
    traps = [];
    slowPuddles = [];
    projectiles = [];
    enemyProjectiles = [];
    particles = [];
    knights = [];
    selectedTower = null;
    deleteMode = false;
    upgradeMode = false;
    gameMode = null;
    speedMultiplier = 1;
    // Reset tutorial
    tutorialActive = false;
    tutorialStep = 0;
    tutorialQueue = [];
    sirTutVisible = false;
    sirTutX = -150;
    gameState = 'intro';
    return;
  }
  
  let mx = mouseX;
  let my = mouseY;

  // Ready for next round button (build phase only)
  if (gameState === 'building') {
    if (mx >= UI_READY_X && mx <= UI_READY_X + UI_READY_W && my >= UI_READY_Y && my <= UI_READY_Y + UI_READY_H) {
      startCombatPhase();
      return;
    }
    
    // Delete button (top left corner)
    if (mx >= UI_DELETE_X && mx <= UI_DELETE_X + UI_DELETE_W && 
        my >= UI_DELETE_Y && my <= UI_DELETE_Y + UI_DELETE_H) {
      deleteMode = !deleteMode;
      upgradeMode = false;
      selectedTower = null;
      console.log('Delete mode:', deleteMode);
      return;
    }
    
    // Upgrade button (next to delete button)
    if (mx >= UI_UPGRADE_X && mx <= UI_UPGRADE_X + UI_UPGRADE_W && 
        my >= UI_UPGRADE_Y && my <= UI_UPGRADE_Y + UI_UPGRADE_H) {
      if (round >= TIER_2_UNLOCK) {
        upgradeMode = !upgradeMode;
        deleteMode = false;
        selectedTower = null;
        console.log('Upgrade mode:', upgradeMode);
      }
      return;
    }
  }
  
  if (my >= UI_TOWER_ROW_Y && my < UI_TOWER_ROW_Y + UI_BUTTON_H) {
    let buttonX = UI_BUTTON_X;
    let buttonWidth = UI_BUTTON_W;
    let spacing = UI_BUTTON_SPACING;
    let types = TOWER_BUTTON_ORDER.filter(t => isTowerUnlocked(t));

    for (let i = 0; i < types.length; i++) {
      let x = buttonX + i * (buttonWidth + spacing);
      if (mx >= x && mx <= x + buttonWidth) {
        selectedTower = types[i];
        deleteMode = false;
        upgradeMode = false;
        console.log('Selected:', selectedTower);
        return;
      }
    }
  }

  // Handle tower placement or deletion
  if (gameState === 'building') {
    let gridX = floor(mx / GRID_SIZE);
    let gridY = floor(my / GRID_SIZE);
    
    if (gridY >= GRID_ROWS) return;
    
    // Delete mode
    if (deleteMode) {
      // Check if clicking on a tower
      for (let i = towers.length - 1; i >= 0; i--) {
        let tower = towers[i];
        let size = TOWER_TYPES[tower.type].size || 1;
        
        // Check if click is within tower bounds
        if (gridX >= tower.x && gridX < tower.x + size && 
            gridY >= tower.y && gridY < tower.y + size) {
          let refund = floor(TOWER_TYPES[tower.type].cost * 2 / 3);
          gold += refund;
          
          // If it's a barracks, remove its knights
          if (tower.type === 'barracks') {
            knights = knights.filter(k => k.barracksId !== i);
          }
          
          towers.splice(i, 1);
          console.log('Deleted tower, refunded', refund, 'gold');
          return;
        }
      }
      
      // Check if clicking on a trap
      for (let i = traps.length - 1; i >= 0; i--) {
        let trap = traps[i];
        if (gridX === trap.x && gridY === trap.y) {
          let refund = floor(TRAP_TYPES[trap.type].cost * 2 / 3);
          gold += refund;
          traps.splice(i, 1);
          console.log('Deleted trap, refunded', refund, 'gold');
          return;
        }
      }
      return;
    }
    
    // Upgrade mode
    if (upgradeMode) {
      // Check if clicking on a tower
      for (let i = towers.length - 1; i >= 0; i--) {
        let tower = towers[i];
        let size = TOWER_TYPES[tower.type].size || 1;
        
        // Check if click is within tower bounds
        if (gridX >= tower.x && gridX < tower.x + size && 
            gridY >= tower.y && gridY < tower.y + size) {
          
          // Can't upgrade gold mines
          if (tower.type === 'mine') {
            console.log('Cannot upgrade gold mines');
            return;
          }
          
          let currentTier = tower.tier || 1;
          let towerData = TOWER_TYPES[tower.type];
          
          // Check if can upgrade
          if (currentTier === 1 && round >= TIER_2_UNLOCK && towerData.upgrades && towerData.upgrades.tier2) {
            let upgradeCost = towerData.upgrades.tier2.cost;
            if (gold >= upgradeCost) {
              tower.tier = 2;
              gold -= upgradeCost;
              
              // Apply tier 2 upgrades
              if (towerData.upgrades.tier2.damage) tower.damage = towerData.upgrades.tier2.damage;
              if (towerData.upgrades.tier2.fireRate) tower.fireRate = towerData.upgrades.tier2.fireRate;
              if (towerData.upgrades.tier2.dps) tower.dps = towerData.upgrades.tier2.dps;
              if (towerData.upgrades.tier2.stunDuration) tower.stunDuration = towerData.upgrades.tier2.stunDuration;
              if (towerData.upgrades.tier2.chainMax) tower.chainMax = towerData.upgrades.tier2.chainMax;
              if (towerData.upgrades.tier2.knightHealth) tower.knightHealth = towerData.upgrades.tier2.knightHealth;
              if (towerData.upgrades.tier2.knightDamage) tower.knightDamage = towerData.upgrades.tier2.knightDamage;
              if (towerData.upgrades.tier2.maxKnights) tower.maxKnights = towerData.upgrades.tier2.maxKnights;
              
              console.log('✨ UPGRADED TO TIER 2!', tower.type, 'for', upgradeCost, 'gold');
              console.log('  Stats:', { damage: tower.damage, fireRate: tower.fireRate, dps: tower.dps, tier: tower.tier });
              return;
            } else {
              console.log('Not enough gold for upgrade');
              return;
            }
          } else if (currentTier === 2 && round >= TIER_3_UNLOCK && towerData.upgrades && towerData.upgrades.tier3) {
            let upgradeCost = towerData.upgrades.tier3.cost;
            if (gold >= upgradeCost) {
              tower.tier = 3;
              gold -= upgradeCost;
              
              // Apply tier 3 upgrades
              if (towerData.upgrades.tier3.damage) tower.damage = towerData.upgrades.tier3.damage;
              if (towerData.upgrades.tier3.fireRate) tower.fireRate = towerData.upgrades.tier3.fireRate;
              if (towerData.upgrades.tier3.dps) tower.dps = towerData.upgrades.tier3.dps;
              if (towerData.upgrades.tier3.stunDuration) tower.stunDuration = towerData.upgrades.tier3.stunDuration;
              if (towerData.upgrades.tier3.chainMax) tower.chainMax = towerData.upgrades.tier3.chainMax;
              if (towerData.upgrades.tier3.knightHealth) tower.knightHealth = towerData.upgrades.tier3.knightHealth;
              if (towerData.upgrades.tier3.knightDamage) tower.knightDamage = towerData.upgrades.tier3.knightDamage;
              if (towerData.upgrades.tier3.maxKnights) tower.maxKnights = towerData.upgrades.tier3.maxKnights;
              
              console.log('⭐ UPGRADED TO TIER 3!', tower.type, 'for', upgradeCost, 'gold');
              console.log('  Stats:', { damage: tower.damage, fireRate: tower.fireRate, dps: tower.dps, tier: tower.tier });
              return;
            } else {
              console.log('Not enough gold for upgrade');
              return;
            }
          } else {
            console.log('Tower already at max tier or upgrade not unlocked');
            return;
          }
        }
      }
      return;
    }
    
    // Placement mode
    if (selectedTower) {
      let cost = (TOWER_TYPES[selectedTower] || TRAP_TYPES[selectedTower]).cost;
      let mineCount = towers.filter(t => t.type === 'mine').length;
      let maxMines = getMaxCrystalMines();
      let canPlaceMine = selectedTower !== 'mine' || mineCount < maxMines;
      
      // Explosion and sticky traps can be placed anywhere, towers must be within range
      let isTrap = (selectedTower === 'explosion' || selectedTower === 'sticky');
      let withinRange = isTrap || isWithinBuildRange(gridX, gridY, selectedTower);

      if (canPlaceTower(gridX, gridY, selectedTower) && withinRange && gold >= cost && canPlaceMine && isTowerUnlocked(selectedTower)) {
        if (selectedTower === 'explosion') {
          traps.push({
            x: gridX,
            y: gridY,
            type: 'explosion'
          });
        } else if (selectedTower === 'sticky') {
          traps.push({
            x: gridX,
            y: gridY,
            type: 'sticky'
          });
        } else {
          let towerData = TOWER_TYPES[selectedTower];
          towers.push({
            x: gridX,
            y: gridY,
            type: selectedTower,
            cooldown: 0,
            incomeTimer: 0,
            tier: 1,  // All towers start at tier 1
            // Initialize base stats
            damage: towerData.damage,
            fireRate: towerData.fireRate,
            dps: towerData.dps,
            stunDuration: 12,
            chainMax: towerData.chainMax,
            knightHealth: 140,
            knightDamage: 15,
            maxKnights: towerData.maxKnights
          });
        }
        gold -= cost;
        console.log('Placed', selectedTower, 'at', gridX, gridY);
      }
    }
  }
}

function mouseMoved() {
  let mx = mouseX;
  let my = mouseY;
  
  if (my < GRID_ROWS * GRID_SIZE) {
    let gridX = floor(mx / GRID_SIZE);
    let gridY = floor(my / GRID_SIZE);
    hoveredCell = { x: gridX, y: gridY };
  } else {
    hoveredCell = null;
  }
}

function keyPressed() {
  // Hidden cheat code: Ctrl + Shift + Arrow Keys
  if (keyIsDown(CONTROL) && keyIsDown(SHIFT)) {
    if (keyCode === UP_ARROW) {
      // Advance 5 rounds and gain 9999 gold
      round = min(30, round + 5);
      gold += 9999;
      return false; // Prevent default behavior
    } else if (keyCode === DOWN_ARROW) {
      // Go back 5 rounds
      round = max(1, round - 5);
      return false; // Prevent default behavior
    }
  }
}
