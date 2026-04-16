// ─────────────────────────────────────────────────────────────────────────────
//  CRICKET GURU MATCH ENGINE
//  Exact replica of Cricket Guru's match system:
//  - Shots: cover_drive | square_drive | pull | straight_drive (+ lofted_ prefix)
//  - Deliveries: yorker | good | full | short (+ spin_ prefix)
//  - Strength/weakness/neutral system
//  - Lofted = 6 or out vs any delivery
//  - Spin = extra wicket chance on neutral
//  - Both players submit simultaneously (secret until both submit)
//  - Full innings, wickets, scorecard, commentary
// ─────────────────────────────────────────────────────────────────────────────

// ── SHOT / DELIVERY DEFINITIONS ──────────────────────────────────────────────
//
//  Shot strengths (shot → delivery it beats for 4 runs):
//    cover_drive   → full
//    square_drive  → yorker
//    pull          → short
//    straight_drive→ good
//
//  Shot weaknesses (shot → delivery that gets it out):
//    cover_drive   → short
//    square_drive  → good
//    pull          → yorker
//    straight_drive→ full
//
//  Lofted shots (lofted_cover_drive etc.) → always 6 or wicket
//  Spin deliveries (spin_yorker etc.) → neutral gets extra wicket chance

const BASE_SHOTS = ['cover_drive', 'square_drive', 'pull', 'straight_drive'];
const BASE_DELIVERIES = ['yorker', 'good', 'full', 'short'];

const VALID_SHOTS = [
  'cover_drive', 'square_drive', 'pull', 'straight_drive',
  'lofted_cover_drive', 'lofted_square_drive', 'lofted_pull', 'lofted_straight_drive',
];
const VALID_DELIVERIES = [
  'yorker', 'good', 'full', 'short',
  'spin_yorker', 'spin_good', 'spin_full', 'spin_short',
];

const SHOT_LABELS = {
  cover_drive: 'Cover Drive', square_drive: 'Square Drive',
  pull: 'Pull', straight_drive: 'Straight Drive',
  lofted_cover_drive: 'Lofted Cover Drive 🚀', lofted_square_drive: 'Lofted Square Drive 🚀',
  lofted_pull: 'Lofted Pull 🚀', lofted_straight_drive: 'Lofted Straight Drive 🚀',
};
const DELIVERY_LABELS = {
  yorker: 'Yorker', good: 'Good Length', full: 'Full Toss', short: 'Short Ball',
  spin_yorker: 'Spin Yorker 🌀', spin_good: 'Spin Good Length 🌀',
  spin_full: 'Spin Full Toss 🌀', spin_short: 'Spin Short Ball 🌀',
};

// Strength map: shot → delivery it beats
const SHOT_STRENGTH = {
  cover_drive: 'full', square_drive: 'yorker',
  pull: 'short', straight_drive: 'good',
};
// Weakness map: shot → delivery that gets it out
const SHOT_WEAKNESS = {
  cover_drive: 'short', square_drive: 'good',
  pull: 'yorker', straight_drive: 'full',
};

const BALL_TIMEOUT_MS = 60 * 1000;

// ── OUTCOME CALCULATOR ────────────────────────────────────────────────────────
function calculateOutcome(shot, delivery, batterRating = 80, bowlerRating = 80) {
  const isLofted = shot.startsWith('lofted_');
  const isSpin   = delivery.startsWith('spin_');
  const baseShot = isLofted ? shot.replace('lofted_', '') : shot;
  const baseDel  = isSpin   ? delivery.replace('spin_', '') : delivery;

  // Rating modifier: ±12% wicket chance based on rating diff
  const ratingMod = (batterRating - bowlerRating) / 100 * 0.12;

  // LOFTED: always 6 or wicket
  if (isLofted) {
    // Lofted against weakness delivery = very high wicket chance
    const isWeakness = SHOT_WEAKNESS[baseShot] === baseDel;
    const baseWicket = isWeakness ? 0.70 : 0.45;
    const wicketChance = Math.max(0.05, Math.min(0.95, baseWicket - ratingMod));
    const isWicket = Math.random() < wicketChance;
    return { runs: isWicket ? 0 : 6, isWicket, type: 'lofted' };
  }

  const strength = SHOT_STRENGTH[baseShot];
  const weakness = SHOT_WEAKNESS[baseShot];

  // STRENGTH: 4 runs, very low wicket chance
  if (baseDel === strength) {
    const wicketChance = Math.max(0.02, 0.07 - ratingMod);
    const isWicket = Math.random() < wicketChance;
    return { runs: isWicket ? 0 : 4, isWicket, type: 'strength' };
  }

  // WEAKNESS: 0 runs, high wicket chance
  if (baseDel === weakness) {
    const wicketChance = Math.max(0.10, Math.min(0.95, 0.60 - ratingMod));
    const isWicket = Math.random() < wicketChance;
    return { runs: isWicket ? 0 : 0, isWicket, type: 'weakness' };
  }

  // NEUTRAL: 1-3 runs, moderate wicket chance
  // Spin adds extra wicket chance on neutral
  const baseWicket = isSpin ? 0.28 : 0.18;
  const wicketChance = Math.max(0.05, Math.min(0.80, baseWicket - ratingMod));
  const isWicket = Math.random() < wicketChance;
  const runs = isWicket ? 0 : Math.floor(Math.random() * 3) + 1; // 1-3
  return { runs, isWicket, type: isSpin ? 'spin_neutral' : 'neutral' };
}

// ── COMMENTARY ────────────────────────────────────────────────────────────────
const COMMENTARY_LINES = {
  strength: [
    'Timed to perfection! Races to the boundary!',
    'What a shot! Finds the gap beautifully!',
    'Elegant stroke play — four runs!',
    'Textbook shot, right through the covers!',
  ],
  weakness: [
    'Beaten! The stumps are shattered!',
    'Caught at the boundary! Poor shot selection!',
    'Edged and gone! The bowler celebrates!',
    'That delivery was too good — OUT!',
  ],
  lofted_six: [
    'MAXIMUM! That is gone all the way!',
    'Into the stands! What a hit!',
    'SIX! Huge shot over long-on!',
    'Cleared the ropes with ease!',
  ],
  lofted_out: [
    'Caught in the deep! Mistimed the loft!',
    'Skied it and taken! Risky shot costs the wicket!',
    'Tried to go big but found the fielder!',
  ],
  neutral_1: ['Pushed for a single.', 'Quick single taken.', 'Nudged to mid-on, one run.'],
  neutral_2: ['Two runs! Good running between the wickets.', 'Driven for two.'],
  neutral_3: ['Three runs! Excellent running!', 'Driven hard, three runs.'],
  spin_wicket: ['Spun past the bat! Bowled!', 'Turned sharply — OUT! The spinner strikes!', 'Deceived in flight — caught at slip!'],
  dot: ['Dot ball. Tight bowling.', 'Defended solidly.', 'No run. Good line and length.'],
  wicket_generic: ['OUT! Back to the pavilion!', 'WICKET! The crowd erupts!', 'Gone! What a delivery!'],
};

function getCommentary(result, shot, delivery) {
  const { isWicket, runs, type } = result;
  const isSpin = delivery.startsWith('spin_');
  const isLofted = shot.startsWith('lofted_');

  if (isLofted) {
    const pool = isWicket ? COMMENTARY_LINES.lofted_out : COMMENTARY_LINES.lofted_six;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (isWicket) {
    const pool = isSpin ? COMMENTARY_LINES.spin_wicket
      : type === 'weakness' ? COMMENTARY_LINES.weakness
      : COMMENTARY_LINES.wicket_generic;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (type === 'strength') return COMMENTARY_LINES.strength[Math.floor(Math.random() * COMMENTARY_LINES.strength.length)];
  if (runs === 0) return COMMENTARY_LINES.dot[Math.floor(Math.random() * COMMENTARY_LINES.dot.length)];
  if (runs === 1) return COMMENTARY_LINES.neutral_1[Math.floor(Math.random() * COMMENTARY_LINES.neutral_1.length)];
  if (runs === 2) return COMMENTARY_LINES.neutral_2[Math.floor(Math.random() * COMMENTARY_LINES.neutral_2.length)];
  return COMMENTARY_LINES.neutral_3[Math.floor(Math.random() * COMMENTARY_LINES.neutral_3.length)];
}

// ── MILESTONE DETECTION ───────────────────────────────────────────────────────
function checkMilestones(prevRuns, newRuns, bowlerWickets, batterName, bowlerName) {
  const milestones = [];
  if (prevRuns < 50 && newRuns >= 50) milestones.push(`🌟 **FIFTY!** ${batterName} reaches 50 runs!`);
  if (prevRuns < 100 && newRuns >= 100) milestones.push(`💯 **CENTURY!** ${batterName} scores 100 runs!`);
  if (bowlerWickets === 3) milestones.push(`🎳 **HAT-TRICK ALERT!** ${bowlerName} on a roll!`);
  if (bowlerWickets === 5) milestones.push(`🔥 **FIVE-FOR!** ${bowlerName} is unstoppable!`);
  return milestones;
}

// ── DUEL DATA FACTORY ─────────────────────────────────────────────────────────
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
    pendingShot: null, pendingDelivery: null,
    lastBallTime: null,
    status: 'toss',
    winner: null,
    channelId: null,
    batterMsgId: null, bowlerMsgId: null,
  };
}

function createInningsData() {
  return {
    runs: 0, wickets: 0, balls: 0,
    batters: {},   // { cardId: { name, runs, balls, fours, sixes, out, dismissed } }
    bowlers: {},   // { cardId: { name, balls, runs, wickets } }
    bowlerBalls: {},
    battingOrder: [],
    bowlingRotation: [],
    nextBatterIdx: 0,
    ballLog: [],   // last 6 balls display
    currentOver: 0,
    ballsInOver: 0,
  };
}

// ── INNINGS SETUP ─────────────────────────────────────────────────────────────
function setupInnings(duel, inningsNum, battingUserId, bowlingUserId, getSquadFn) {
  const inn = duel.inningsData[inningsNum];
  const battingSquad = getSquadFn(battingUserId);
  const bowlingSquad = getSquadFn(bowlingUserId);

  // Batting order: Batsmen → All-rounders → Wicket-keepers → Bowlers
  const order = ['Batsman', 'All-rounder', 'Wicket-keeper', 'Bowler'];
  inn.battingOrder = order.flatMap(pos => battingSquad.filter(c => c.position === pos));
  if (inn.battingOrder.length === 0) inn.battingOrder = [...battingSquad];

  // Bowling rotation: Bowlers → All-rounders
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

// ── ELIGIBLE PLAYERS ──────────────────────────────────────────────────────────
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
  const maxBalls = Math.floor(duel.overs / 5) * 6; // T20: 4 overs, ODI: 10 overs
  const squad = getSquadFn(userId);
  const eligible = squad.filter(c =>
    (c.position === 'Bowler' || c.position === 'All-rounder') &&
    (inn.bowlerBalls[c.id] || 0) < maxBalls
  );
  return eligible.length > 0 ? eligible : squad.filter(c => c.position === 'Bowler' || c.position === 'All-rounder');
}

// ── RESOLVE ONE BALL ──────────────────────────────────────────────────────────
function resolveDuelBall(duel) {
  const shot     = duel.pendingShot;
  const delivery = duel.pendingDelivery;
  const batterRating = duel.currentBatter?.rating || 80;
  const bowlerRating = duel.currentBowler?.rating || 80;

  const result = calculateOutcome(shot, delivery, batterRating, bowlerRating);
  const { runs, isWicket } = result;

  const inn = duel.inningsData[duel.innings];
  const batterId = duel.currentBatter?.id;
  const bowlerId = duel.currentBowler?.id;

  // Track batter stats
  const prevBatterRuns = batterId && inn.batters[batterId] ? inn.batters[batterId].runs : 0;
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

  // Track bowler stats
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
  if (inn.ballsInOver >= 6) { inn.currentOver++; inn.ballsInOver = 0; }

  // Ball log (last 6 balls)
  const ballSymbol = isWicket ? 'W' : runs === 6 ? '6' : runs === 4 ? '4' : String(runs);
  inn.ballLog.push(ballSymbol);
  if (inn.ballLog.length > 6) inn.ballLog.shift();

  // Commentary & milestones
  const commentary = getCommentary(result, shot, delivery);
  const newBatterRuns = prevBatterRuns + (isWicket ? 0 : runs);
  const bowlerWickets = bowlerId && inn.bowlers[bowlerId] ? inn.bowlers[bowlerId].wickets : 0;
  const milestones = checkMilestones(
    prevBatterRuns, newBatterRuns, bowlerWickets,
    duel.currentBatter?.name || '?', duel.currentBowler?.name || '?'
  );

  // Reset pending
  duel.pendingShot = null;
  duel.pendingDelivery = null;
  duel.lastBallTime = null;

  // Check innings end
  const maxBalls   = duel.overs * 6;
  const inningsOver = inn.balls >= maxBalls || inn.wickets >= Math.min(10, inn.battingOrder.length);
  const chasingWon  = duel.innings === 2 && inn.runs > duel.inningsData[1].runs;

  let inningsSwitched = false;
  let matchOver = false;

  if (chasingWon || inningsOver) {
    if (duel.innings === 1) {
      duel.innings = 2;
      duel.battingTeam  = duel.teamB;
      duel.bowlingTeam  = duel.teamA;
      duel.currentBatter = null;
      duel.currentBowler = null;
      duel.status = 'selecting';
      inningsSwitched = true;
    } else {
      matchOver = true;
      duel.status = 'completed';
      const s1 = duel.inningsData[1].runs;
      const s2 = duel.inningsData[2].runs;
      duel.winner = s2 > s1 ? duel.teamB : s1 > s2 ? duel.teamA : 'tie';
    }
  }

  return {
    success: true, shot, delivery, runs, isWicket,
    commentary, milestones, result,
    inn, inningsSwitched, matchOver,
    batterRating, bowlerRating,
    batterName: duel.currentBatter?.name,
    bowlerName:  duel.currentBowler?.name,
  };
}

// ── SCORECARD FORMATTER ───────────────────────────────────────────────────────
function formatDuelScorecard(duel, inningsNum) {
  const inn = duel.inningsData[inningsNum];
  if (!inn || !inn.battingOrder || inn.battingOrder.length === 0) return 'No data yet.';

  const battingUserId = inningsNum === 1 ? duel.teamA : duel.teamB;
  const bowlingUserId = inningsNum === 1 ? duel.teamB : duel.teamA;
  const battingName   = duel.players[battingUserId]?.username || '?';
  const bowlingName   = duel.players[bowlingUserId]?.username || '?';

  let out = `**${battingName} Batting**\n\`\`\`\n`;
  out += `${'Batter'.padEnd(18)} ${'R'.padStart(3)} ${'B'.padStart(3)} ${'4s'.padStart(3)} ${'6s'.padStart(3)}\n`;
  out += `${'─'.repeat(32)}\n`;
  Object.values(inn.batters).forEach(b => {
    const status = b.out ? 'out' : 'not out';
    out += `${b.name.substring(0,17).padEnd(18)} ${String(b.runs).padStart(3)} ${String(b.balls).padStart(3)} ${String(b.fours).padStart(3)} ${String(b.sixes).padStart(3)}  ${status}\n`;
  });
  out += `${'─'.repeat(32)}\n`;
  out += `Total: ${inn.runs}/${inn.wickets} (${Math.floor(inn.balls/6)}.${inn.balls%6} ov)\n\`\`\`\n`;

  out += `**${bowlingName} Bowling**\n\`\`\`\n`;
  out += `${'Bowler'.padEnd(18)} ${'O'.padStart(5)} ${'R'.padStart(3)} ${'W'.padStart(3)}\n`;
  out += `${'─'.repeat(31)}\n`;
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

module.exports = {
  VALID_SHOTS, VALID_DELIVERIES, BASE_SHOTS, BASE_DELIVERIES,
  SHOT_LABELS, DELIVERY_LABELS, SHOT_STRENGTH, SHOT_WEAKNESS,
  BALL_TIMEOUT_MS,
  calculateOutcome, getCommentary,
  createDuelData, createInningsData,
  setupInnings, getEligibleBatters, getEligibleBowlers,
  resolveDuelBall, formatDuelScorecard, formatDuelScore,
  getRequiredRunRate, isPowerplay,
};
