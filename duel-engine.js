// ─────────────────────────────────────────────────────────────────────────────
//  DUEL ENGINE  —  Full Cricket Feel
//  Handles 1v1 matches with full batting orders, bowler rotation, scorecards,
//  milestones, commentary, powerplay, required run rate, and more.
// ─────────────────────────────────────────────────────────────────────────────

// ── SHOT / DELIVERY MATRIX ────────────────────────────────────────────────────
// Each shot has a STRENGTH delivery (guaranteed boundary, low wicket chance),
// a WEAKNESS delivery (high wicket chance, 0 runs), and NEUTRAL deliveries.
// Loft is always high-risk/high-reward regardless of delivery.
//
//  Shots:      cover_drive | pull | sweep | loft
//  Deliveries: yorker | bouncer | full | short

const OUTCOME_MATRIX = {
  cover_drive: {
    full:    { minRuns: 4, maxRuns: 4, wicketChance: 0.07 },  // strength
    short:   { minRuns: 0, maxRuns: 0, wicketChance: 0.58 },  // weakness
    yorker:  { minRuns: 1, maxRuns: 3, wicketChance: 0.22 },  // neutral
    bouncer: { minRuns: 1, maxRuns: 3, wicketChance: 0.18 },  // neutral
  },
  pull: {
    short:   { minRuns: 4, maxRuns: 4, wicketChance: 0.07 },  // strength
    yorker:  { minRuns: 0, maxRuns: 0, wicketChance: 0.58 },  // weakness
    full:    { minRuns: 1, maxRuns: 3, wicketChance: 0.18 },  // neutral
    bouncer: { minRuns: 1, maxRuns: 3, wicketChance: 0.22 },  // neutral
  },
  sweep: {
    yorker:  { minRuns: 4, maxRuns: 4, wicketChance: 0.07 },  // strength
    bouncer: { minRuns: 0, maxRuns: 0, wicketChance: 0.58 },  // weakness
    full:    { minRuns: 1, maxRuns: 3, wicketChance: 0.18 },  // neutral
    short:   { minRuns: 1, maxRuns: 3, wicketChance: 0.22 },  // neutral
  },
  loft: {
    full:    { minRuns: 6, maxRuns: 6, wicketChance: 0.42 },
    short:   { minRuns: 6, maxRuns: 6, wicketChance: 0.42 },
    yorker:  { minRuns: 6, maxRuns: 6, wicketChance: 0.62 },  // hardest to loft
    bouncer: { minRuns: 6, maxRuns: 6, wicketChance: 0.38 },
  },
};

const VALID_SHOTS     = ['cover_drive', 'pull', 'sweep', 'loft'];
const VALID_DELIVERIES = ['yorker', 'bouncer', 'full', 'short'];
const BALL_TIMEOUT_MS  = 60 * 1000;

const SHOT_LABELS     = { cover_drive: 'Cover Drive', pull: 'Pull', sweep: 'Sweep', loft: 'Loft 🚀' };
const DELIVERY_LABELS = { yorker: 'Yorker', bouncer: 'Bouncer', full: 'Full Toss', short: 'Short Ball' };

// ── COMMENTARY TEMPLATES ──────────────────────────────────────────────────────
const COMMENTARY = {
  six:     ['🚀 MAXIMUM! That\'s gone all the way!', '💥 SIX! Into the stands!', '🏏 Huge hit! Six runs!', '🌟 Massive six over long-on!'],
  four:    ['🏏 FOUR! Races to the boundary!', '⚡ Cracking shot, four runs!', '🎯 Perfectly timed, four!', '💨 Whipped away for four!'],
  wicket:  ['💀 WICKET! Back to the pavilion!', '🔴 OUT! What a delivery!', '😱 Gone! The stumps are shattered!', '🎳 Bowled him! Clean as a whistle!', '🪤 Caught! Brilliant catch!'],
  dot:     ['🛡️ Dot ball. Good bowling.', '🔒 Defended solidly.', '⚫ No run. Tight bowling.', '🧱 Blocked away.'],
  one:     ['🏃 Quick single taken.', '✅ 1 run, good running.', '🏃 Pushed for a single.'],
  two:     ['🏃🏃 Two runs! Good running between the wickets.', '✅ 2 runs, well run!'],
  three:   ['🏃🏃🏃 Three runs! Excellent running!', '✅ 3 runs, great effort!'],
};

function getCommentary(runs, isWicket) {
  if (isWicket) return COMMENTARY.wicket[Math.floor(Math.random() * COMMENTARY.wicket.length)];
  if (runs === 6) return COMMENTARY.six[Math.floor(Math.random() * COMMENTARY.six.length)];
  if (runs === 4) return COMMENTARY.four[Math.floor(Math.random() * COMMENTARY.four.length)];
  if (runs === 0) return COMMENTARY.dot[Math.floor(Math.random() * COMMENTARY.dot.length)];
  if (runs === 1) return COMMENTARY.one[Math.floor(Math.random() * COMMENTARY.one.length)];
  if (runs === 2) return COMMENTARY.two[Math.floor(Math.random() * COMMENTARY.two.length)];
  return COMMENTARY.three[Math.floor(Math.random() * COMMENTARY.three.length)];
}

// ── MILESTONE DETECTION ───────────────────────────────────────────────────────
function checkMilestones(batterStats, bowlerStats, runs, isWicket, prevBatterRuns) {
  const milestones = [];
  if (!isWicket) {
    const newRuns = prevBatterRuns + runs;
    if (prevBatterRuns < 50 && newRuns >= 50) milestones.push(`🌟 **FIFTY!** ${batterStats.name} reaches 50 runs!`);
    if (prevBatterRuns < 100 && newRuns >= 100) milestones.push(`💯 **CENTURY!** ${batterStats.name} scores 100 runs!`);
  }
  if (isWicket && bowlerStats.wickets >= 5) {
    milestones.push(`🎳 **FIVE-WICKET HAUL!** ${bowlerStats.name} is on fire!`);
  }
  return milestones;
}

// ── DUEL DATA FACTORY ─────────────────────────────────────────────────────────
function createDuelData(duelId, challengerId, challengerName, opponentId, opponentName, format) {
  const overs = format === 'odi' ? 50 : 20;
  const tossWinner = Math.random() < 0.5 ? challengerId : opponentId;
  const tossLoser  = tossWinner === challengerId ? opponentId : challengerId;

  return {
    duelId,
    format,
    overs,
    teamA: null,
    teamB: null,
    tossWinner,
    tossLoser,
    tossChoice: null,
    players: {
      [challengerId]: { userId: challengerId, username: challengerName },
      [opponentId]:   { userId: opponentId,   username: opponentName  },
    },
    innings: 1,
    // Full innings data for both innings
    inningsData: {
      1: createInningsData(),
      2: createInningsData(),
    },
    battingTeam:  null,
    bowlingTeam:  null,
    // Current active players
    currentBatter: null,
    currentBowler: null,
    // Pending choices this ball
    pendingShot:     null,
    pendingDelivery: null,
    lastBallTime:    null,
    status: 'toss',   // toss → selecting → live → completed
    winner: null,
    channelId: null,
    batterMsgId: null,
    bowlerMsgId: null,
    scoreMsgId:  null,
  };
}

function createInningsData() {
  return {
    runs:    0,
    wickets: 0,
    balls:   0,
    extras:  0,
    // Per-batter stats: { name, runs, balls, fours, sixes, out, dismissed }
    batters: {},
    // Per-bowler stats: { name, overs, balls, runs, wickets, maidens }
    bowlers: {},
    // Ball-by-ball log: [{ over, ball, batter, bowler, shot, delivery, runs, isWicket, commentary }]
    ballLog: [],
    // Batting order: array of card objects (set when innings starts)
    battingOrder: [],
    // Bowling rotation: array of card objects (set when innings starts)
    bowlingRotation: [],
    // Index of next batter to come in
    nextBatterIdx: 0,
    // Overs bowled per bowler: { cardId: balls }
    bowlerBalls: {},
    // Current over number (0-indexed)
    currentOver: 0,
    // Balls in current over
    ballsInOver: 0,
  };
}

// ── INNINGS SETUP ─────────────────────────────────────────────────────────────
function setupInnings(duel, inningsNum, battingUserId, bowlingUserId, getSquadFn) {
  const inn = duel.inningsData[inningsNum];
  const battingSquad = getSquadFn(battingUserId);
  const bowlingSquad = getSquadFn(bowlingUserId);

  // Batting order: batters first, then all-rounders, then bowlers
  const batters     = battingSquad.filter(c => c.position === 'Batsman');
  const allrounders = battingSquad.filter(c => c.position === 'All-rounder');
  const bowlers     = battingSquad.filter(c => c.position === 'Bowler');
  inn.battingOrder  = [...batters, ...allrounders, ...bowlers];

  // Bowling rotation: bowlers first, then all-rounders
  const bwlrs       = bowlingSquad.filter(c => c.position === 'Bowler');
  const arBowlers   = bowlingSquad.filter(c => c.position === 'All-rounder');
  inn.bowlingRotation = [...bwlrs, ...arBowlers];

  // Init batter stats
  inn.battingOrder.forEach(c => {
    inn.batters[c.id] = { name: c.name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissed: '' };
  });

  // Init bowler stats
  inn.bowlingRotation.forEach(c => {
    inn.bowlers[c.id] = { name: c.name, overs: 0, balls: 0, runs: 0, wickets: 0 };
    inn.bowlerBalls[c.id] = 0;
  });

  inn.nextBatterIdx = 0;
}

// ── ELIGIBLE BOWLERS (respects over limit) ────────────────────────────────────
function getEligibleBowlers(duel, bowlingUserId, getSquadFn) {
  const inn = duel.inningsData[duel.innings];
  const maxBowlerBalls = Math.floor(duel.overs / 5) * 6; // T20: 4 overs, ODI: 10 overs
  const squad = getSquadFn(bowlingUserId);
  const eligible = squad.filter(c =>
    (c.position === 'Bowler' || c.position === 'All-rounder') &&
    (inn.bowlerBalls[c.id] || 0) < maxBowlerBalls
  );
  return eligible.length > 0 ? eligible : squad.filter(c => c.position === 'Bowler' || c.position === 'All-rounder');
}

// ── ELIGIBLE BATTERS (not yet out) ────────────────────────────────────────────
function getEligibleBatters(duel, battingUserId, getSquadFn) {
  const inn = duel.inningsData[duel.innings];
  const squad = getSquadFn(battingUserId);
  return squad.filter(c => {
    const stats = inn.batters[c.id];
    return stats && !stats.out;
  });
}

// ── RESOLVE ONE BALL ──────────────────────────────────────────────────────────
function resolveDuelBall(duel) {
  const shot     = duel.pendingShot;
  const delivery = duel.pendingDelivery;
  const outcome  = OUTCOME_MATRIX[shot][delivery];

  const batterRating = duel.currentBatter ? duel.currentBatter.rating : 80;
  const bowlerRating = duel.currentBowler ? duel.currentBowler.rating : 80;
  const ratingDiff   = (batterRating - bowlerRating) / 100;
  const adjWicket    = Math.max(0.02, Math.min(0.95, outcome.wicketChance - ratingDiff * 0.12));

  const isWicket = Math.random() < adjWicket;
  const runs     = isWicket ? 0 : Math.floor(Math.random() * (outcome.maxRuns - outcome.minRuns + 1)) + outcome.minRuns;

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
    inn.bowlers[bowlerId].overs = Math.floor(inn.bowlerBalls[bowlerId] / 6);
  }

  // Update innings totals
  inn.balls++;
  inn.ballsInOver++;
  if (!isWicket) inn.runs += runs;
  if (isWicket)  inn.wickets++;

  // Over tracking
  if (inn.ballsInOver >= 6) {
    inn.currentOver++;
    inn.ballsInOver = 0;
  }

  // Commentary
  const commentary = getCommentary(runs, isWicket);

  // Milestones
  const milestones = batterId && inn.batters[batterId]
    ? checkMilestones(
        { ...inn.batters[batterId], name: duel.currentBatter?.name },
        bowlerId && inn.bowlers[bowlerId] ? { ...inn.bowlers[bowlerId], name: duel.currentBowler?.name } : {},
        runs, isWicket, prevBatterRuns
      )
    : [];

  // Ball log
  const overStr = `${inn.currentOver}.${inn.ballsInOver === 0 ? 6 : inn.ballsInOver}`;
  inn.ballLog.push({
    over: overStr,
    batter: duel.currentBatter?.name || '?',
    bowler: duel.currentBowler?.name || '?',
    shot, delivery, runs, isWicket, commentary,
  });

  // Reset pending
  duel.pendingShot     = null;
  duel.pendingDelivery = null;
  duel.lastBallTime    = null;

  // Check innings end
  const maxBalls   = duel.overs * 6;
  const inningsOver = inn.balls >= maxBalls || inn.wickets >= Math.min(10, inn.battingOrder.length);
  const chasingWon  = duel.innings === 2 && inn.runs > duel.inningsData[1].runs;

  let inningsSwitched = false;
  let matchOver       = false;

  if (chasingWon || inningsOver) {
    if (duel.innings === 1) {
      duel.innings      = 2;
      duel.battingTeam  = duel.teamB;
      duel.bowlingTeam  = duel.teamA;
      duel.currentBatter = null;
      duel.currentBowler = null;
      duel.status       = 'selecting';
      inningsSwitched   = true;
    } else {
      matchOver    = true;
      duel.status  = 'completed';
      const s1 = duel.inningsData[1].runs;
      const s2 = duel.inningsData[2].runs;
      duel.winner = s2 > s1 ? duel.teamB : s1 > s2 ? duel.teamA : 'tie';
    }
  }

  return {
    success: true,
    shot, delivery, runs, isWicket,
    commentary, milestones,
    inn,
    inningsSwitched, matchOver,
    batterRating, bowlerRating,
    batterName: duel.currentBatter?.name,
    bowlerName:  duel.currentBowler?.name,
  };
}

// ── SCORECARD FORMATTER ───────────────────────────────────────────────────────
function formatDuelScorecard(duel, inningsNum) {
  const inn = duel.inningsData[inningsNum];
  if (!inn) return 'No data';

  const battingUserId  = inningsNum === 1 ? duel.teamA : duel.teamB;
  const bowlingUserId  = inningsNum === 1 ? duel.teamB : duel.teamA;
  const battingName    = duel.players[battingUserId]?.username || '?';
  const bowlingName    = duel.players[bowlingUserId]?.username || '?';

  // Batting table
  let batting = `**${battingName} Batting**\n\`\`\`\n`;
  batting += `${'Batter'.padEnd(20)} ${'R'.padStart(4)} ${'B'.padStart(4)} ${'4s'.padStart(3)} ${'6s'.padStart(3)}\n`;
  batting += `${'─'.repeat(36)}\n`;
  Object.values(inn.batters).forEach(b => {
    const status = b.out ? `out` : `not out`;
    batting += `${b.name.substring(0,19).padEnd(20)} ${String(b.runs).padStart(4)} ${String(b.balls).padStart(4)} ${String(b.fours).padStart(3)} ${String(b.sixes).padStart(3)}  ${status}\n`;
  });
  batting += `${'─'.repeat(36)}\n`;
  batting += `Total: ${inn.runs}/${inn.wickets} (${Math.floor(inn.balls/6)}.${inn.balls%6} ov)\n\`\`\``;

  // Bowling table
  let bowling = `**${bowlingName} Bowling**\n\`\`\`\n`;
  bowling += `${'Bowler'.padEnd(20)} ${'O'.padStart(4)} ${'R'.padStart(4)} ${'W'.padStart(3)}\n`;
  bowling += `${'─'.repeat(33)}\n`;
  Object.values(inn.bowlers).forEach(b => {
    const overs = `${Math.floor(b.balls/6)}.${b.balls%6}`;
    bowling += `${b.name.substring(0,19).padEnd(20)} ${overs.padStart(4)} ${String(b.runs).padStart(4)} ${String(b.wickets).padStart(3)}\n`;
  });
  bowling += `\`\`\``;

  return batting + '\n' + bowling;
}

function formatDuelScore(duel, inningsNum) {
  const inn = duel.inningsData[inningsNum];
  return `${inn.runs}/${inn.wickets} (${Math.floor(inn.balls/6)}.${inn.balls%6} ov)`;
}

function getRequiredRunRate(duel) {
  if (duel.innings !== 2) return null;
  const inn1 = duel.inningsData[1];
  const inn2 = duel.inningsData[2];
  const target = inn1.runs + 1;
  const needed = target - inn2.runs;
  const ballsLeft = duel.overs * 6 - inn2.balls;
  if (ballsLeft <= 0 || needed <= 0) return null;
  const rrr = ((needed / ballsLeft) * 6).toFixed(2);
  return { needed, ballsLeft, rrr, target };
}

function isPowerplay(duel) {
  const inn = duel.inningsData[duel.innings];
  return inn.balls < 36; // first 6 overs
}

module.exports = {
  OUTCOME_MATRIX,
  VALID_SHOTS,
  VALID_DELIVERIES,
  BALL_TIMEOUT_MS,
  SHOT_LABELS,
  DELIVERY_LABELS,
  createDuelData,
  createInningsData,
  setupInnings,
  getEligibleBowlers,
  getEligibleBatters,
  resolveDuelBall,
  formatDuelScorecard,
  formatDuelScore,
  getRequiredRunRate,
  isPowerplay,
  getCommentary,
};
