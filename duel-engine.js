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

//  CALCULATE OUTCOME 

function calculateOutcome(shot, delivery, batterRating = 80, bowlerRating = 80) {
  const ratingMod = (batterRating - bowlerRating) / 100 * 0.12;
  const matchup = getMatchup(shot, delivery);

  // LOFT: 6 or wicket
  if (matchup === 'loft') {
    let baseWicket = 0.45;
    if (delivery === 'yorker' || delivery === 'bouncer') baseWicket = 0.65;
    if (delivery === 'topspin' || delivery === 'slow') baseWicket = 0.55;
    const wicketChance = Math.max(0.05, Math.min(0.95, baseWicket - ratingMod));
    const isWicket = Math.random() < wicketChance;
    return { runs: isWicket ? 0 : 6, isWicket, type: 'loft', matchup };
  }

  // DEFEND: 0-1 runs, 5% wicket
  if (matchup === 'defend') {
    const wicketChance = Math.max(0.01, 0.05 - ratingMod);
    const isWicket = Math.random() < wicketChance;
    const runs = isWicket ? 0 : (Math.random() < 0.2 ? 1 : 0);
    return { runs, isWicket, type: 'defend', matchup };
  }

  // LEAVE: dot ball, 3% wicket
  if (matchup === 'leave') {
    const wicketChance = Math.max(0.005, 0.03 - ratingMod);
    const isWicket = Math.random() < wicketChance;
    return { runs: 0, isWicket, type: 'leave', matchup };
  }

  // STRENGTH: 4 runs, 7% wicket
  if (matchup === 'strength') {
    const wicketChance = Math.max(0.01, 0.07 - ratingMod);
    const isWicket = Math.random() < wicketChance;
    return { runs: isWicket ? 0 : 4, isWicket, type: 'strength', matchup };
  }

  // WEAKNESS: 0 runs, 60% wicket
  if (matchup === 'weakness') {
    const wicketChance = Math.max(0.10, Math.min(0.95, 0.60 - ratingMod));
    const isWicket = Math.random() < wicketChance;
    return { runs: 0, isWicket, type: 'weakness', matchup };
  }

  // NEUTRAL: 1-3 runs, 18% wicket
  const baseWicket = 0.18;
  const wicketChance = Math.max(0.05, Math.min(0.80, baseWicket - ratingMod));
  const isWicket = Math.random() < wicketChance;
  const runs = isWicket ? 0 : Math.floor(Math.random() * 3) + 1;
  return { runs, isWicket, type: 'neutral', matchup };
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

  // BATTERS table
  let battersTable = '```\nBATTERS           R    B    SR\n';
  const activeBatters = Object.values(inn.batters).filter(b => !b.out && b.balls >= 0);
  const displayBatters = activeBatters.slice(0, 2);
  for (const b of displayBatters) {
    const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
    const name = b.name.substring(0, 16).padEnd(17);
    battersTable += `${name} ${String(b.runs).padStart(3)}  ${String(b.balls).padStart(3)}  ${sr}\n`;
  }
  // Non-striker / yet to bat
  const yetToBat = Object.values(inn.batters).find(b => !b.out && b.balls === 0 && !displayBatters.includes(b));
  if (yetToBat) {
    battersTable += `${yetToBat.name.substring(0, 16).padEnd(17)} Yet to Bat\n`;
  }
  battersTable += '```';

  // Partnership
  const striker = displayBatters[0];
  const nonStriker = displayBatters[1];
  let pship = '';
  if (striker && nonStriker) {
    const pRuns = (striker.runs || 0) + (nonStriker.runs || 0);
    const pBalls = (striker.balls || 0) + (nonStriker.balls || 0);
    pship = `P'Ship: ${pRuns}(${pBalls})  CRR: ${crr}  Proj: ${proj}`;
  } else {
    pship = `CRR: ${crr}  Proj: ${proj}`;
  }

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
    nonStriker: null,
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

  const result = calculateOutcome(shot, delivery, batterRating, bowlerRating);
  const { runs, isWicket } = result;

  const inn = duel.inningsData[duel.innings];
  const batterId = duel.currentBatter?.id;
  const bowlerId = duel.currentBowler?.id;

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

  if (bowlerId && inn.bowlers[bowlerId]) {
    inn.bowlers[bowlerId].balls++;
    inn.bowlers[bowlerId].runs += runs;
    if (isWicket) inn.bowlers[bowlerId].wickets++;
    inn.bowlerBalls[bowlerId] = (inn.bowlerBalls[bowlerId] || 0) + 1;
  }

  inn.balls++;
  inn.ballsInOver++;
  if (!isWicket) inn.runs += runs;
  if (isWicket)  inn.wickets++;
  if (inn.ballsInOver >= 6) { inn.currentOver++; inn.ballsInOver = 0; }

  const ballSymbol = isWicket ? 'W' : runs === 6 ? '6' : runs === 4 ? '4' : String(runs);
  inn.ballLog.push(ballSymbol);
  if (inn.ballLog.length > 12) inn.ballLog.shift();

  // CG-style commentary
  const bowlerName = duel.currentBowler?.name || 'Bowler';
  const batterName = duel.currentBatter?.name || 'Batter';
  const commentary = generateCommentary(bowlerName, batterName, shot, delivery);
  const legacyCommentary = getCommentary(result, shot, delivery);

  const newBatterRuns = prevBatterRuns + (isWicket ? 0 : runs);
  const bowlerWickets = bowlerId && inn.bowlers[bowlerId] ? inn.bowlers[bowlerId].wickets : 0;
  const milestones = checkMilestones(prevBatterRuns, newBatterRuns, bowlerWickets, batterName, bowlerName);

  duel.pendingShot = null;
  duel.pendingDelivery = null;
  duel.lastBallTime = null;

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
    commentary, legacyCommentary, milestones, result,
    inn, inningsSwitched, matchOver,
    batterRating, bowlerRating,
    batterName, bowlerName,
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
