// =============================================================================
//  CRICKET GURU MATCH ENGINE  v2
//  Shots: drive | loft | defend | sweep | cut | leave | pull | scoop
//  Fast: inswing | outswing | slow | fast | bouncer | good | full | yorker
//  Spin: offspin | carrom | arm_ball | doosra | topspin | mystery
// =============================================================================

const { EmbedBuilder } = require('discord.js');

//  SHOT / DELIVERY DEFINITIONS 

const VALID_SHOTS = ['drive', 'loft', 'defend', 'sweep', 'cut', 'leave', 'pull', 'scoop'];

const FAST_DELIVERIES = ['inswing', 'outswing', 'slow', 'fast', 'bouncer', 'good', 'full', 'yorker'];
const SPIN_DELIVERIES = ['offspin', 'carrom', 'arm_ball', 'doosra', 'topspin', 'mystery'];
const VALID_DELIVERIES = [...FAST_DELIVERIES, ...SPIN_DELIVERIES];

// Keep legacy exports for cricket-system.js compatibility
const BASE_SHOTS = VALID_SHOTS;
const BASE_DELIVERIES = VALID_DELIVERIES;

const SHOT_LABELS = {
  drive: 'Drive', loft: 'Loft', defend: 'Defend', sweep: 'Sweep',
  cut: 'Cut', leave: 'Leave', pull: 'Pull', scoop: 'Scoop',
};

const DELIVERY_LABELS = {
  inswing: 'Inswing', outswing: 'Outswing', slow: 'Slow', fast: 'Fast',
  bouncer: 'Bouncer', good: 'Good', full: 'Full', yorker: 'Yorker',
  offspin: 'Offspin', carrom: 'Carrom', arm_ball: 'Arm Ball',
  doosra: 'Doosra', topspin: 'Topspin', mystery: 'Mystery',
};

// Legacy compat
const SHOT_STRENGTH = { drive: 'full', pull: 'bouncer', cut: 'fast', sweep: 'offspin', scoop: 'yorker' };
const SHOT_WEAKNESS = { drive: 'yorker', pull: 'full', cut: 'full', sweep: 'fast', scoop: 'bouncer' };

const BALL_TIMEOUT_MS = 60 * 1000;

// ── SHOT DATA (risk + possible runs per shot) ─────────────────────────────────
const SHOT_DATA = {
  drive:        { risk: 0.25, runs: [1, 2, 4] },
  loft:         { risk: 0.60, runs: [2, 4, 6] },
  defend:       { risk: 0.05, runs: [0] },
  sweep:        { risk: 0.30, runs: [1, 2, 4] },
  cut:          { risk: 0.30, runs: [1, 2, 4] },
  leave:        { risk: 0.03, runs: [0] },
  pull:         { risk: 0.50, runs: [1, 2, 4, 6] },
  scoop:        { risk: 0.65, runs: [1, 4, 6] },
};

// ── DELIVERY RISK (wicket probability per delivery type) ──────────────────────
const SPIN_RISK  = { offspin: 0.30, carrom: 0.45, arm_ball: 0.35, doosra: 0.40, topspin: 0.38, mystery: 0.42 };
const FAST_RISK  = { inswing: 0.35, outswing: 0.30, slow: 0.45, fast: 0.32, bouncer: 0.38, good: 0.28, full: 0.25, yorker: 0.40 };
const DELIVERY_RISK = { ...SPIN_RISK, ...FAST_RISK };

// ── PLAYER SKILLS ─────────────────────────────────────────────────────────────
const SKILLS = {
  'Power Hitter':  { six_boost: 0.25,   desc: 'More sixes on loft/pull shots' },
  'Defender':      { wicket_reduce: 0.15, desc: 'Lower wicket risk on all shots' },
  'Spin Master':   { spin_bonus: 0.10,   desc: 'Better against spin deliveries' },
  'Pace Killer':   { pace_counter: 0.10, desc: 'Better against fast deliveries' },
  'Finisher':      { pressure_immune: true, desc: 'No pressure penalty on wickets' },
};
const SKILL_NAMES = Object.keys(SKILLS);

// ── WEATHER EFFECTS ───────────────────────────────────────────────────────────
const WEATHER_EFFECTS = {
  'Sunny':         { bat_boost: 0.10,    desc: 'Good batting conditions' },
  'Overcast':      { swing_boost: 0.10,  desc: 'Swing bowling favoured' },
  'Humid':         { spin_boost: 0.08,   desc: 'Spin gets extra grip' },
  'Windy':         { risk_increase: 0.08, desc: 'Unpredictable conditions' },
  'Partly Cloudy': {},
};

// ── COMMENTARY ────────────────────────────────────────────────────────────────
const COMMENTARY_MAP = {
  '0': ['Dot ball! Tight bowling.', 'No run. Good line and length.', 'Defended solidly.'],
  '1': ['Quick single taken!', 'Pushed for one.', 'Good running between the wickets.'],
  '2': ['Two runs! Well run!', 'Driven for two.', 'Good running, two more.'],
  '3': ['Three runs! Excellent effort!', 'Driven hard, three runs.'],
  '4': ['FOUR! Races to the boundary!', 'Cracking shot, four runs!', 'Timed to perfection — FOUR!'],
  '6': ['SIX! Into the stands!', 'MAXIMUM! That is gone all the way!', 'Huge hit over long-on — SIX!'],
  'W': ['OUT! Back to the pavilion!', 'WICKET! The crowd erupts!', 'Gone! What a delivery!', 'Beaten! The stumps are shattered!'],
};

function getCommentaryLine(event) {
  const pool = COMMENTARY_MAP[event] || COMMENTARY_MAP['0'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getImpactText(event) {
  return { '6': '💥 SIX!!!', '4': '🔥 FOUR!', 'W': '❌ OUT!', '0': '🧱 DOT!' }[event] || '🏃 RUN!';
}

function getCrowdText(event) {
  return { '6': '🔊 CROWD ERUPTS!', '4': '👏 Cheers!', 'W': '😱 Silence...', '0': '😐 Quiet...' }[event] || '👏';
}

//  OUTCOME MATRIX 
// Returns { matchup: 'strength'|'weakness'|'neutral'|'loft'|'defend'|'leave' }

function getMatchup(shot, delivery) {
  const isSpin = SPIN_DELIVERIES.includes(delivery);

  // Special shots
  if (shot === 'loft')   return 'loft';
  if (shot === 'defend') return 'defend';
  if (shot === 'leave')  return 'leave';

  // Sweep: strength vs spin, weakness vs fast
  if (shot === 'sweep') {
    if (isSpin) return 'strength';
    if (['fast', 'bouncer', 'inswing', 'outswing'].includes(delivery)) return 'weakness';
    return 'neutral';
  }

  // Scoop: strength vs yorker, weakness vs bouncer
  if (shot === 'scoop') {
    if (delivery === 'yorker') return 'strength';
    if (delivery === 'bouncer') return 'weakness';
    return 'neutral';
  }

  // Drive: strength vs full, weakness vs yorker/inswing/outswing
  if (shot === 'drive') {
    if (delivery === 'full') return 'strength';
    if (delivery === 'yorker' || delivery === 'inswing' || delivery === 'outswing') return 'weakness';
    return 'neutral';
  }

  // Pull: strength vs bouncer/short(fast), weakness vs full/yorker
  if (shot === 'pull') {
    if (delivery === 'bouncer' || delivery === 'fast') return 'strength';
    if (delivery === 'full' || delivery === 'yorker') return 'weakness';
    return 'neutral';
  }

  // Cut: strength vs fast(short), weakness vs full/inswing
  if (shot === 'cut') {
    if (delivery === 'fast' || delivery === 'outswing') return 'strength';
    if (delivery === 'full' || delivery === 'inswing') return 'weakness';
    if (isSpin && delivery === 'carrom') return 'weakness';
    return 'neutral';
  }

  return 'neutral';
}

//  CALCULATE OUTCOME — uses SHOT_DATA risk + DELIVERY_RISK + skills + weather + momentum/pressure

function calculateOutcome(shot, delivery, batterRating = 80, bowlerRating = 80, context = {}) {
  const { skill = null, momentum = 0, wickets = 0, weather = 'Sunny', freeHit = false } = context;

  const shotData     = SHOT_DATA[shot]     || { risk: 0.25, runs: [1, 2] };
  const deliveryRisk = DELIVERY_RISK[delivery] || 0.30;
  const isSpin       = SPIN_DELIVERIES.includes(delivery);

  // Base wicket risk = average of shot risk and delivery risk
  let wicketRisk = (shotData.risk + deliveryRisk) / 2;

  // Rating modifier: higher-rated batter reduces risk, higher-rated bowler increases it
  wicketRisk -= (batterRating - bowlerRating) / 100 * 0.12;

  // Pressure: each wicket adds 5% risk
  if (!skill?.pressure_immune) wicketRisk += wickets * 0.05;

  // Skill modifiers
  if (skill?.wicket_reduce)  wicketRisk -= skill.wicket_reduce;
  if (skill?.spin_bonus  && isSpin)  wicketRisk -= skill.spin_bonus;
  if (skill?.pace_counter && !isSpin) wicketRisk -= skill.pace_counter;

  // Weather modifiers
  const wx = WEATHER_EFFECTS[weather] || {};
  if (wx.bat_boost)      wicketRisk -= wx.bat_boost;
  if (wx.swing_boost && (delivery === 'inswing' || delivery === 'outswing')) wicketRisk += wx.swing_boost;
  if (wx.spin_boost  && isSpin)  wicketRisk += wx.spin_boost;
  if (wx.risk_increase)  wicketRisk += wx.risk_increase;

  wicketRisk = Math.max(0.02, Math.min(0.95, wicketRisk));

  // Free hit — cannot be out
  const isWicket = freeHit ? false : Math.random() < wicketRisk;

  if (isWicket) return { runs: 0, isWicket: true, type: 'wicket', matchup: 'wicket' };

  // Run calculation
  let possibleRuns = [...shotData.runs];

  // Momentum boost: 2+ consecutive boundaries → add bigger runs
  if (momentum >= 2) possibleRuns = possibleRuns.map(r => Math.min(r + 1, 6));

  // Power Hitter skill: boost chance of 6 on loft/pull
  if (skill?.six_boost && (shot === 'loft' || shot === 'pull')) {
    if (Math.random() < skill.six_boost) possibleRuns = [6];
  }

  const runs = possibleRuns[Math.floor(Math.random() * possibleRuns.length)];

  // Determine matchup type for display
  const matchup = getMatchup(shot, delivery);

  return { runs, isWicket: false, type: matchup, matchup };
}

//  COMMENTARY SYSTEM 

const SPEED_RANGES = {
  fast: [130, 145], inswing: [125, 140], outswing: [125, 140],
  bouncer: [130, 145], yorker: [128, 142], good: [125, 138], full: [122, 135],
  slow: [95, 110],
  offspin: [70, 88], carrom: [72, 88], arm_ball: [75, 90],
  doosra: [70, 86], topspin: [72, 88], mystery: [68, 85],
};

function getDeliverySpeed(delivery) {
  const range = SPEED_RANGES[delivery] || [80, 90];
  return (range[0] + Math.random() * (range[1] - range[0])).toFixed(1);
}

const DELIVERY_DESCRIPTIONS = {
  inswing:  ['Inswinging delivery', 'Inswinging yorker', 'Inswinging full delivery'],
  outswing: ['Outswinging delivery', 'Outswinging full delivery', 'Outswinger'],
  slow:     ['Slower ball', 'Change of pace delivery', 'Slow off-cutter'],
  fast:     ['Short-pitched delivery', 'Full-length delivery', 'Back of a length delivery'],
  bouncer:  ['Short-pitched bouncer', 'Rising bouncer', 'Throat ball'],
  good:     ['Good length delivery', 'Back of a length', 'Probing delivery'],
  full:     ['Full-length delivery', 'Overpitched delivery', 'Half-volley'],
  yorker:   ['Yorker', 'Full-length yorker', 'Toe-crushing yorker'],
  offspin:  ['Off break delivery', 'Off-spin delivery', 'Turning delivery'],
  carrom:   ['Carrom ball', 'Carrom delivery', 'Finger-flick delivery'],
  arm_ball: ['Arm ball', 'Arm-ball delivery', 'Straight one'],
  doosra:   ['Doosra', 'Doosra delivery', 'Wrong-un off-spinner'],
  topspin:  ['Topspinner', 'Top-spin delivery', 'Dipping delivery'],
  mystery:  ['Mystery delivery', 'Mystery spin', 'Unreadable delivery'],
};

const ACTION_WORDS = {
  drive:  ['drove', 'drove elegantly', 'pushed', 'drove through the covers'],
  loft:   ['lofted', 'smashed', 'launched', 'heaved'],
  pull:   ['pulled', 'hooked', 'whipped', 'pulled fiercely'],
  cut:    ['cut', 'slashed', 'guided', 'cut late'],
  sweep:  ['swept', 'slog swept', 'paddled', 'swept fine'],
  scoop:  ['scooped', 'flicked', 'ramp shot', 'scooped over the keeper'],
  defend: ['defended', 'blocked', 'padded away', 'played defensively'],
  leave:  ['left', 'shouldered arms', 'let it go', 'left alone'],
};

function getDeliveryDescription(delivery) {
  const descs = DELIVERY_DESCRIPTIONS[delivery] || [delivery];
  return descs[Math.floor(Math.random() * descs.length)];
}

function getActionWord(shot) {
  const actions = ACTION_WORDS[shot] || [shot];
  return actions[Math.floor(Math.random() * actions.length)];
}

// Returns { deliveryLine, actionLine }
function generateCommentary(bowlerName, batterName, shot, delivery) {
  const speed = getDeliverySpeed(delivery);
  const desc = getDeliveryDescription(delivery);
  const action = getActionWord(shot);
  const deliveryLine = `${bowlerName} : ${desc} at ${speed} kmph`;
  const actionLine = `${batterName} ${action} the ${desc.toLowerCase()}`;
  return { deliveryLine, actionLine };
}

// Legacy compat
function getCommentary(result, shot, delivery) {
  const { isWicket, runs, type } = result;
  if (isWicket) {
    if (type === 'weakness') return 'Beaten! The stumps are shattered!';
    if (type === 'loft') return 'Caught in the deep! Mistimed the loft!';
    return 'OUT! Back to the pavilion!';
  }
  if (type === 'loft') return 'MAXIMUM! That is gone all the way!';
  if (type === 'strength') return 'Timed to perfection! Races to the boundary!';
  if (runs === 0) return 'Dot ball. Tight bowling.';
  if (runs === 1) return 'Pushed for a single.';
  if (runs === 2) return 'Two runs! Good running between the wickets.';
  return 'Three runs! Excellent running!';
}


//  TIMELINE BUILDER 

// Ball log entries: 'W', '6', '4', '0', '1', '2', '3'
// Returns colored tile string like: W|2|1|6|3|4||4|1
function buildTimeline(ballLog) {
  if (!ballLog || ballLog.length === 0) return '—';
  return ballLog.slice(-12).map(b => b === '0' ? '' : b).join('|');
}

//  SCORECARD EMBED BUILDER 

function buildMatchEmbed(duel, inningsNum) {
  const inn = duel.inningsData[inningsNum];
  const battingUserId = inningsNum === 1 ? duel.teamA : duel.teamB;
  const bowlingUserId = inningsNum === 1 ? duel.teamB : duel.teamA;
  const battingName = duel.players[battingUserId]?.username || '?';
  const bowlingName = duel.players[bowlingUserId]?.username || '?';

  const overs = `${Math.floor(inn.balls / 6)}.${inn.balls % 6}`;
  const maxOvers = duel.overs;
  const title = `${battingName} ${inn.runs}/${inn.wickets} (${overs}/${maxOvers}.0)`;

  // CRR
  const crr = inn.balls > 0 ? ((inn.runs / inn.balls) * 6).toFixed(2) : '0.00';
  // Projected
  const proj = inn.balls > 0 ? Math.round((inn.runs / inn.balls) * maxOvers * 6) : 0;

  // BATTERS table — show striker* and non-striker
  let battersTable = '```\nBATTERS           R    B    SR\n';
  const striker    = duel.currentBatter ? inn.batters[duel.currentBatter.id] : null;
  const nonStrikerCard = duel.nonStriker;
  const nonStrikerStats = nonStrikerCard ? inn.batters[nonStrikerCard.id] : null;

  const displayBatters = [];
  if (striker)         displayBatters.push({ ...striker,         isStriker: true  });
  if (nonStrikerStats) displayBatters.push({ ...nonStrikerStats, isStriker: false });

  // Fallback: pick first 2 active batters if currentBatter not set yet
  if (displayBatters.length === 0) {
    Object.values(inn.batters).filter(b => !b.out).slice(0, 2).forEach((b, i) => {
      displayBatters.push({ ...b, isStriker: i === 0 });
    });
  }

  for (const b of displayBatters) {
    const sr   = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
    const mark = b.isStriker ? '*' : ' ';
    const name = (b.name.substring(0, 15) + mark).padEnd(17);
    battersTable += `${name} ${String(b.runs).padStart(3)}  ${String(b.balls).padStart(3)}  ${sr}\n`;
  }
  battersTable += '```';

  // Partnership
  const pRuns  = inn.partnershipRuns  || 0;
  const pBalls = inn.partnershipBalls || 0;
  let pship = `P'Ship: ${pRuns}(${pBalls})  CRR: ${crr}  Proj: ${proj}`;

  // RRR for 2nd innings
  let rrrLine = '';
  if (inningsNum === 2) {
    const target = duel.inningsData[1].runs + 1;
    const needed = target - inn.runs;
    const ballsLeft = maxOvers * 6 - inn.balls;
    if (ballsLeft > 0 && needed > 0) {
      const rrr = ((needed / ballsLeft) * 6).toFixed(2);
      rrrLine = `\nTarget: ${target}  Need: ${needed}  RRR: ${rrr}`;
    }
  }

  // BOWLER table
  let bowlerTable = '```\nBOWLER            O    R    W\n';
  const activeBowler = duel.currentBowler;
  if (activeBowler && inn.bowlers[activeBowler.id]) {
    const bw = inn.bowlers[activeBowler.id];
    const bwOvers = `${Math.floor(bw.balls / 6)}.${bw.balls % 6}`;
    const name = bw.name.substring(0, 16).padEnd(17);
    bowlerTable += `${name} ${bwOvers.padStart(4)}  ${String(bw.runs).padStart(3)}  ${String(bw.wickets).padStart(3)}\n`;
  }
  bowlerTable += '```';

  // Timeline
  const timeline = buildTimeline(inn.ballLog);

  // Toss info
  const tossWinnerName = duel.players[duel.tossWinner]?.username || '?';
  const tossChoice = duel.tossChoice === 'bat' ? 'bat first' : 'bowl first';
  const tossLine = `${tossWinnerName} chose to ${tossChoice}`;

  const description = [
    battersTable,
    pship + rrrLine,
    '',
    bowlerTable,
    `**Timeline**`,
    timeline,
    '',
    tossLine,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(title)
    .setDescription(description);
}


//  MILESTONE DETECTION 
function checkMilestones(prevRuns, newRuns, bowlerWickets, batterName, bowlerName) {
  const milestones = [];
  if (prevRuns < 50 && newRuns >= 50) milestones.push(` **FIFTY!** ${batterName} reaches 50 runs!`);
  if (prevRuns < 100 && newRuns >= 100) milestones.push(` **CENTURY!** ${batterName} scores 100 runs!`);
  if (bowlerWickets === 3) milestones.push(` **HAT-TRICK ALERT!** ${bowlerName} on a roll!`);
  if (bowlerWickets === 5) milestones.push(` **FIVE-FOR!** ${bowlerName} is unstoppable!`);
  return milestones;
}

//  DUEL DATA FACTORY 
function createDuelData(duelId, challengerId, challengerName, opponentId, opponentName, format) {
  const overs = format === 'odi' ? 50 : 20;
  const tossWinner = Math.random() < 0.5 ? challengerId : opponentId;
  const tossLoser  = tossWinner === challengerId ? opponentId : challengerId;

  return {
    duelId, format, overs,
    teamA: null, teamB: null,
    tossWinner, tossLoser, tossChoice: null,
    players: {
      [challengerId]: { userId: challengerId, username: challengerName },
      [opponentId]:   { userId: opponentId,   username: opponentName  },
    },
    innings: 1,
    inningsData: { 1: createInningsData(), 2: createInningsData() },
    battingTeam: null, bowlingTeam: null,
    currentBatter: null, currentBowler: null,
    nonStriker: null,          // second batter on crease
    overLocked: false,         // bowler cannot change mid-over
    pendingShot: null, pendingDelivery: null,
    lastBallTime: null,
    status: 'toss',
    winner: null,
    channelId: null,
    matchMsgId: null,
    batterMsgId: null, bowlerMsgId: null,
  };
}

function createInningsData() {
  return {
    runs: 0, wickets: 0, balls: 0,
    batters: {},
    bowlers: {},
    bowlerBalls: {},
    battingOrder: [],
    bowlingRotation: [],
    nextBatterIdx: 0,
    ballLog: [],
    currentOver: 0,
    ballsInOver: 0,
    // Partnership tracking
    partnershipRuns: 0,
    partnershipBalls: 0,
  };
}

//  INNINGS SETUP 
function setupInnings(duel, inningsNum, battingUserId, bowlingUserId, getSquadFn) {
  const inn = duel.inningsData[inningsNum];
  const battingSquad = getSquadFn(battingUserId);
  const bowlingSquad = getSquadFn(bowlingUserId);

  const order = ['Batsman', 'All-rounder', 'Wicket-keeper', 'Bowler'];
  inn.battingOrder = order.flatMap(pos => battingSquad.filter(c => c.position === pos));
  if (inn.battingOrder.length === 0) inn.battingOrder = [...battingSquad];

  inn.bowlingRotation = [
    ...bowlingSquad.filter(c => c.position === 'Bowler'),
    ...bowlingSquad.filter(c => c.position === 'All-rounder'),
  ];
  if (inn.bowlingRotation.length === 0) inn.bowlingRotation = [...bowlingSquad];

  inn.battingOrder.forEach(c => {
    inn.batters[c.id] = { name: c.name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissed: '' };
  });
  inn.bowlingRotation.forEach(c => {
    inn.bowlers[c.id] = { name: c.name, balls: 0, runs: 0, wickets: 0 };
    inn.bowlerBalls[c.id] = 0;
  });
  inn.nextBatterIdx = 0;
}

//  ELIGIBLE PLAYERS 
function getEligibleBatters(duel, userId, getSquadFn) {
  const inn = duel.inningsData[duel.innings];
  const squad = getSquadFn(userId);
  return squad.filter(c => {
    const stats = inn.batters[c.id];
    return stats && !stats.out;
  });
}

function getEligibleBowlers(duel, userId, getSquadFn) {
  const inn = duel.inningsData[duel.innings];
  const maxBalls = Math.floor(duel.overs / 5) * 6;
  const squad = getSquadFn(userId);
  const eligible = squad.filter(c =>
    (c.position === 'Bowler' || c.position === 'All-rounder') &&
    (inn.bowlerBalls[c.id] || 0) < maxBalls
  );
  return eligible.length > 0 ? eligible : squad.filter(c => c.position === 'Bowler' || c.position === 'All-rounder');
}


//  RESOLVE ONE BALL 
function resolveDuelBall(duel) {
  const shot     = duel.pendingShot;
  const delivery = duel.pendingDelivery;
  const batterRating = duel.currentBatter?.rating || 80;
  const bowlerRating = duel.currentBowler?.rating || 80;
  const inn = duel.inningsData[duel.innings];

  // Build context for outcome calculation
  const context = {
    skill:    duel.batterSkill ? SKILLS[duel.batterSkill] : null,
    momentum: duel.momentum || 0,
    wickets:  inn.wickets,
    weather:  duel.weather || 'Sunny',
    freeHit:  duel.freeHit || false,
  };

  const result = calculateOutcome(shot, delivery, batterRating, bowlerRating, context);
  const { runs, isWicket } = result;

  // Consume free hit
  if (duel.freeHit) duel.freeHit = false;

  const batterId = duel.currentBatter?.id;
  const bowlerId = duel.currentBowler?.id;
  const prevBatterRuns = batterId && inn.batters[batterId] ? inn.batters[batterId].runs : 0;

  // Update batter stats
  if (batterId && inn.batters[batterId]) {
    inn.batters[batterId].balls++;
    if (isWicket) {
      inn.batters[batterId].out = true;
      inn.batters[batterId].dismissed = `b. ${duel.currentBowler?.name || '?'}`;
    } else {
      inn.batters[batterId].runs += runs;
      if (runs === 4) inn.batters[batterId].fours++;
      if (runs === 6) inn.batters[batterId].sixes++;
    }
  }

  // Update bowler stats
  if (bowlerId && inn.bowlers[bowlerId]) {
    inn.bowlers[bowlerId].balls++;
    inn.bowlers[bowlerId].runs += runs;
    if (isWicket) inn.bowlers[bowlerId].wickets++;
    inn.bowlerBalls[bowlerId] = (inn.bowlerBalls[bowlerId] || 0) + 1;
  }

  // Update innings totals
  inn.balls++;
  inn.ballsInOver++;
  if (!isWicket) inn.runs += runs;
  if (isWicket)  inn.wickets++;

  // Momentum & Combo
  const isBoundary = runs === 4 || runs === 6;
  if (isBoundary) {
    duel.momentum = (duel.momentum || 0) + 1;
    duel.combo    = (duel.combo    || 0) + 1;
  } else {
    duel.momentum = 0;
    duel.combo    = 0;
  }

  // Partnership tracking
  if (!isWicket) {
    inn.partnershipRuns  = (inn.partnershipRuns  || 0) + runs;
    inn.partnershipBalls = (inn.partnershipBalls || 0) + 1;
  }

  // Over completion
  const overJustCompleted = inn.ballsInOver >= 6;
  if (overJustCompleted) {
    inn.currentOver++;
    inn.ballsInOver = 0;
    duel.overLocked = false;
    if (!isWicket && duel.nonStriker) {
      const tmp = duel.currentBatter;
      duel.currentBatter = duel.nonStriker;
      duel.nonStriker = tmp;
    }
  } else {
    duel.overLocked = true;
    if (!isWicket && runs % 2 === 1 && duel.nonStriker) {
      const tmp = duel.currentBatter;
      duel.currentBatter = duel.nonStriker;
      duel.nonStriker = tmp;
    }
  }

  // Ball log & history
  const event = isWicket ? 'W' : runs === 6 ? '6' : runs === 4 ? '4' : String(runs);
  inn.ballLog.push(event);
  if (inn.ballLog.length > 12) inn.ballLog.shift();

  if (!duel.history) duel.history = [];
  duel.history.push(`${SHOT_LABELS[shot] || shot} vs ${DELIVERY_LABELS[delivery] || delivery} -> ${event}`);

  // Commentary
  const bowlerName = duel.currentBowler?.name || 'Bowler';
  const batterName = duel.currentBatter?.name || 'Batter';
  const { deliveryLine, actionLine } = generateCommentary(bowlerName, batterName, shot, delivery);
  const commentaryLine = getCommentaryLine(event);
  const impactText = getImpactText(event);
  const crowdText  = getCrowdText(event);
  const commentary = { deliveryLine, actionLine, commentaryLine, impactText, crowdText, combo: duel.combo || 0, momentum: duel.momentum || 0 };

  const newBatterRuns = prevBatterRuns + (isWicket ? 0 : runs);
  const bowlerWickets = bowlerId && inn.bowlers[bowlerId] ? inn.bowlers[bowlerId].wickets : 0;
  const milestones = checkMilestones(prevBatterRuns, newBatterRuns, bowlerWickets, batterName, bowlerName);

  duel.pendingShot = null;
  duel.pendingDelivery = null;
  duel.lastBallTime = null;

  // Wicket: reset partnership, non-striker stays
  if (isWicket) {
    inn.partnershipRuns  = 0;
    inn.partnershipBalls = 0;
    duel.currentBatter   = null;
    duel.momentum        = 0;
    duel.combo           = 0;
  }

  const maxBalls    = duel.overs * 6;
  const inningsOver = inn.balls >= maxBalls || inn.wickets >= Math.min(10, inn.battingOrder.length);
  const chasingWon  = duel.innings === 2 && inn.runs > duel.inningsData[1].runs;

  let inningsSwitched = false;
  let matchOver       = false;

  if (chasingWon || inningsOver) {
    if (duel.innings === 1) {
      duel.innings       = 2;
      duel.battingTeam   = duel.teamB;
      duel.bowlingTeam   = duel.teamA;
      duel.currentBatter = null;
      duel.nonStriker    = null;
      duel.currentBowler = null;
      duel.overLocked    = false;
      duel.momentum      = 0;
      duel.combo         = 0;
      duel.status        = 'selecting';
      inningsSwitched    = true;
    } else {
      matchOver   = true;
      duel.status = 'completed';
      const s1 = duel.inningsData[1].runs;
      const s2 = duel.inningsData[2].runs;
      duel.winner = s2 > s1 ? duel.teamB : s1 > s2 ? duel.teamA : 'tie';
    }
  }

  return {
    success: true, shot, delivery, runs, isWicket, event,
    commentary, milestones, result,
    inn, inningsSwitched, matchOver, overJustCompleted,
    batterRating, bowlerRating,
    batterName, bowlerName,
    nonStrikerName: duel.nonStriker?.name || null,
  };
}


//  SCORECARD FORMATTER (legacy text) 
function formatDuelScorecard(duel, inningsNum) {
  const inn = duel.inningsData[inningsNum];
  if (!inn || !inn.battingOrder || inn.battingOrder.length === 0) return 'No data yet.';

  const battingUserId = inningsNum === 1 ? duel.teamA : duel.teamB;
  const bowlingUserId = inningsNum === 1 ? duel.teamB : duel.teamA;
  const battingName   = duel.players[battingUserId]?.username || '?';
  const bowlingName   = duel.players[bowlingUserId]?.username || '?';

  let out = `**${battingName} Batting**\n\`\`\`\n`;
  out += `${'Batter'.padEnd(18)} ${'R'.padStart(3)} ${'B'.padStart(3)} ${'4s'.padStart(3)} ${'6s'.padStart(3)}\n`;
  out += `${''.repeat(32)}\n`;
  Object.values(inn.batters).forEach(b => {
    const status = b.out ? 'out' : 'not out';
    out += `${b.name.substring(0,17).padEnd(18)} ${String(b.runs).padStart(3)} ${String(b.balls).padStart(3)} ${String(b.fours).padStart(3)} ${String(b.sixes).padStart(3)}  ${status}\n`;
  });
  out += `${''.repeat(32)}\n`;
  out += `Total: ${inn.runs}/${inn.wickets} (${Math.floor(inn.balls/6)}.${inn.balls%6} ov)\n\`\`\`\n`;

  out += `**${bowlingName} Bowling**\n\`\`\`\n`;
  out += `${'Bowler'.padEnd(18)} ${'O'.padStart(5)} ${'R'.padStart(3)} ${'W'.padStart(3)}\n`;
  out += `${''.repeat(31)}\n`;
  Object.values(inn.bowlers).forEach(b => {
    if (b.balls === 0) return;
    const overs = `${Math.floor(b.balls/6)}.${b.balls%6}`;
    out += `${b.name.substring(0,17).padEnd(18)} ${overs.padStart(5)} ${String(b.runs).padStart(3)} ${String(b.wickets).padStart(3)}\n`;
  });
  out += `\`\`\``;

  return out;
}

function formatDuelScore(duel, inningsNum) {
  const inn = duel.inningsData[inningsNum];
  return `${inn.runs}/${inn.wickets} (${Math.floor(inn.balls/6)}.${inn.balls%6} ov)`;
}

// Legacy alias
function formatScore(duel, inningsNum) { return formatDuelScore(duel, inningsNum); }

function getRequiredRunRate(duel) {
  if (duel.innings !== 2) return null;
  const inn1 = duel.inningsData[1];
  const inn2 = duel.inningsData[2];
  const target  = inn1.runs + 1;
  const needed  = target - inn2.runs;
  const ballsLeft = duel.overs * 6 - inn2.balls;
  if (ballsLeft <= 0 || needed <= 0) return null;
  const rrr = ((needed / ballsLeft) * 6).toFixed(2);
  return { needed, ballsLeft, rrr, target };
}

function isPowerplay(duel) {
  return duel.inningsData[duel.innings].balls < 36;
}

//  BOWLER TYPE DETECTION 
function isSpin(card) {
  if (!card) return false;
  const role = (card.role || '').toLowerCase();
  return role.includes('spin') || role.includes('spinner') || role.includes('off-break') || role.includes('leg-break');
}

module.exports = {
  VALID_SHOTS, VALID_DELIVERIES, FAST_DELIVERIES, SPIN_DELIVERIES,
  BASE_SHOTS, BASE_DELIVERIES,
  SHOT_LABELS, DELIVERY_LABELS, SHOT_STRENGTH, SHOT_WEAKNESS,
  BALL_TIMEOUT_MS,
  getMatchup, calculateOutcome,
  generateCommentary, getCommentary,
  buildTimeline, buildMatchEmbed,
  checkMilestones,
  createDuelData, createInningsData,
  setupInnings, getEligibleBatters, getEligibleBowlers,
  resolveDuelBall, formatDuelScorecard, formatDuelScore, formatScore,
  getRequiredRunRate, isPowerplay, isSpin,
};
