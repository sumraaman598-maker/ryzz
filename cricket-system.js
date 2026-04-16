const fs = require('fs');
const path = require('path');
const { getRandomPlayers, getPlayerByName, getAllPlayers } = require('./players.js');

const dataFile = path.join(__dirname, 'cricket-data.json');

// Initialize data structure
let cricketData = {
  users: {},
  matches: {}
};

function ensureRootDefaults() {
  if (!cricketData.users) cricketData.users = {};
  if (!cricketData.matches) cricketData.matches = {};
  if (!cricketData.challenges) cricketData.challenges = {};
  if (!cricketData.duels) cricketData.duels = {};
}

function ensureUserDefaults(user, username = user.username || 'Player') {
  if (!user.username) user.username = username;
  if (!user.team) user.team = [];
  if (!user.squad) user.squad = [];
  if (!user.stats) user.stats = {};
  if (typeof user.stats.matches !== 'number') user.stats.matches = 0;
  if (typeof user.stats.wins !== 'number') user.stats.wins = 0;
  if (typeof user.stats.runs !== 'number') user.stats.runs = 0;
  if (typeof user.stats.wickets !== 'number') user.stats.wickets = 0;
  if (typeof user.stats.coins !== 'number') user.stats.coins = 1000;
  if (!Array.isArray(user.cards)) user.cards = [];
  if (typeof user.lastClaim !== 'number') user.lastClaim = 0;
  if (typeof user.lastDaily !== 'number') user.lastDaily = 0;
  if (typeof user.debuted !== 'boolean') user.debuted = false;
  if (!user.teamName) user.teamName = `${user.username}'s XI`;
  if (!Object.prototype.hasOwnProperty.call(user, 'currentMatch')) user.currentMatch = null;
}

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const parsedData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      Object.keys(cricketData).forEach(key => delete cricketData[key]);
      Object.assign(cricketData, parsedData);
    }
  } catch (err) {
    console.log('Creating new data file...');
  }
  ensureRootDefaults();
  Object.values(cricketData.users).forEach(user => ensureUserDefaults(user));
}

// Save data to file
function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(cricketData, null, 2));
}

// Initialize user
function initializeUser(userId, username) {
  ensureRootDefaults();
  if (!cricketData.users[userId]) {
    cricketData.users[userId] = {
      username: username,
      team: [],
      squad: [], // New: 11 players squad
      stats: {
        matches: 0,
        wins: 0,
        runs: 0,
        wickets: 0,
        coins: 1000
      },
      cards: generateStarterCards(),
      lastClaim: 0,
      lastDaily: 0,
      debuted: false,
      teamName: `${username}'s XI`,
      currentMatch: null
    };
    saveData();
    return;
  }

  const user = cricketData.users[userId];
  const snapshot = JSON.stringify(user);
  if (username && user.username !== username) {
    user.username = username;
  }
  ensureUserDefaults(user, username);
  if (JSON.stringify(user) !== snapshot) {
    saveData();
  }
}

// Generate starter cricket cards with real players
function generateStarterCards() {
  return getRandomPlayers(5);
}

// Get player profile
function getProfile(userId) {
  initializeUser(userId, 'Player');
  return cricketData.users[userId];
}

function getTeamName(userId) {
  return getProfile(userId).teamName;
}

function setTeamName(userId, teamName) {
  const user = getProfile(userId);
  user.teamName = teamName;
  saveData();
  return user.teamName;
}

// Add card to user
function addCard(userId, cardName) {
  const user = getProfile(userId);
  const playerData = getPlayerByName(cardName);
  
  if (!playerData) {
    return null; // Player not found
  }

  const card = {
    id: `card_${Date.now()}`,
    name: playerData.name,
    country: playerData.country,
    position: playerData.position,
    role: playerData.role,
    level: 1,
    rating: playerData.rating
  };
  user.cards.push(card);
  saveData();
  return card;
}

function cloneCard(card) {
  return {
    id: card.id,
    name: card.name,
    country: card.country,
    position: card.position,
    role: card.role,
    level: card.level || 1,
    rating: card.rating
  };
}

function randomizeCards(cards, count = cards.length) {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(cloneCard);
}

function createAiSquad() {
  return randomizeCards(getAllPlayers().map(player => ({
    id: `ai_${player.name.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).slice(2, 8)}`,
    ...player,
    level: 1
  })), 11);
}

function buildLineup(cards, batting = true) {
  const preferred = cards.filter(card => batting
    ? card.position === 'Batsman' || card.position === 'All-rounder'
    : card.position === 'Bowler' || card.position === 'All-rounder'
  ).sort((a, b) => b.rating - a.rating);

  const fallback = cards
    .filter(card => !preferred.some(preferredCard => preferredCard.id === card.id))
    .sort((a, b) => b.rating - a.rating);

  return [...preferred, ...fallback].map(cloneCard);
}

function initializeScorecard(cards) {
  const scorecard = {};
  cards.forEach(card => {
    scorecard[card.name] = {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      oversBalls: 0,
      runsConceded: 0,
      status: 'did not bat',
    };
  });
  return scorecard;
}

function getCurrentMatch(userId) {
  const user = getProfile(userId);
  if (!user.currentMatch) return null;
  return cricketData.matches[user.currentMatch] || null;
}

function chooseNextBatter(match, side) {
  const innings = match.innings[match.currentInnings];
  const lineup = match.lineups[side].batting;
  const nextIndex = innings.nextBatterIndex[side] || 0;
  const nextCard = lineup[nextIndex] || null;
  if (!nextCard) return null;
  innings.nextBatterIndex[side] = nextIndex + 1;
  innings.currentBatter[side] = cloneCard(nextCard);
  const batterCard = innings.scorecard[side][nextCard.name];
  if (batterCard) batterCard.status = 'batting';
  return innings.currentBatter[side];
}

function chooseCurrentBowler(match, side) {
  const innings = match.innings[match.currentInnings];
  const lineup = match.lineups[side].bowling;
  if (lineup.length === 0) return null;
  const bowlerIndex = innings.balls % lineup.length;
  innings.currentBowler[side] = cloneCard(lineup[bowlerIndex]);
  return innings.currentBowler[side];
}

function ensureSoloActors(match) {
  const innings = match.innings[match.currentInnings];
  const battingSide = innings.battingSide;
  const bowlingSide = battingSide === 'user' ? 'ai' : 'user';

  if (!innings.currentBatter[battingSide]) {
    chooseNextBatter(match, battingSide);
  }

  chooseCurrentBowler(match, bowlingSide);
}

function createMatch(userId, format = 't20') {
  const user = getProfile(userId);
  const squad = getSquad(userId);
  const overs = format === 'odi' ? 50 : 20;

  if (squad.length < 2) {
    return { success: false, message: 'Build your squad first. Add at least 2 players with `rcaddtosquad`.' };
  }

  const battingOptions = squad.filter(card => card.position === 'Batsman' || card.position === 'All-rounder');
  const bowlingOptions = squad.filter(card => card.position === 'Bowler' || card.position === 'All-rounder');
  if (battingOptions.length === 0 || bowlingOptions.length === 0) {
    return { success: false, message: 'You need at least 1 batter/all-rounder and 1 bowler/all-rounder in your squad.' };
  }

  const userTeam = randomizeCards(squad, Math.min(11, squad.length));
  const aiTeam = createAiSquad();
  const tossWinner = Math.random() < 0.5 ? 'user' : 'ai';
  const aiTeamName = ['Thunder Strikers', 'Royal Challengers', 'Coastal Kings', 'Metro Titans', 'Spin Wizards'][Math.floor(Math.random() * 5)];
  const matchId = `match_${Date.now()}`;

  cricketData.matches[matchId] = {
    matchId,
    userId,
    format,
    overs,
    status: 'toss',
    opponent: aiTeamName,
    tossWinner,
    tossChoice: null,
    userTeamName: user.teamName,
    aiTeamName,
    lineups: {
      user: {
        batting: buildLineup(userTeam, true),
        bowling: buildLineup(userTeam, false),
      },
      ai: {
        batting: buildLineup(aiTeam, true),
        bowling: buildLineup(aiTeam, false),
      }
    },
    currentInnings: 1,
    innings: {
      1: {
        battingSide: null,
        balls: 0,
        runs: { user: 0, ai: 0 },
        wickets: { user: 0, ai: 0 },
        scorecard: {
          user: initializeScorecard(userTeam),
          ai: initializeScorecard(aiTeam),
        },
        timeline: [],
        nextBatterIndex: { user: 0, ai: 0 },
        currentBatter: { user: null, ai: null },
        currentBowler: { user: null, ai: null },
      },
      2: {
        battingSide: null,
        balls: 0,
        runs: { user: 0, ai: 0 },
        wickets: { user: 0, ai: 0 },
        scorecard: {
          user: initializeScorecard(userTeam),
          ai: initializeScorecard(aiTeam),
        },
        timeline: [],
        nextBatterIndex: { user: 0, ai: 0 },
        currentBatter: { user: null, ai: null },
        currentBowler: { user: null, ai: null },
      }
    },
    winner: null,
  };

  if (tossWinner === 'ai') {
    const aiChoice = Math.random() < 0.5 ? 'bat' : 'bowl';
    setSoloTossChoice(matchId, aiChoice);
  }

  user.currentMatch = matchId;
  saveData();

  return {
    success: true,
    matchId,
    match: cricketData.matches[matchId],
  };
}

function setSoloTossChoice(matchId, choice) {
  const match = cricketData.matches[matchId];
  if (!match || match.status !== 'toss') return { success: false, message: 'No toss pending.' };

  match.tossChoice = choice;
  const userBatsFirst = (match.tossWinner === 'user' && choice === 'bat') || (match.tossWinner === 'ai' && choice === 'bowl');
  match.innings[1].battingSide = userBatsFirst ? 'user' : 'ai';
  match.innings[2].battingSide = userBatsFirst ? 'ai' : 'user';
  match.status = 'live';
  ensureSoloActors(match);
  saveData();
  return { success: true, match };
}

function chooseAiShot(card) {
  if (!card) return VALID_SHOTS[Math.floor(Math.random() * VALID_SHOTS.length)];
  if (card.rating >= 92) return ['aggressive', 'loft', 'sweep', 'defensive'][Math.floor(Math.random() * 4)];
  if (card.rating >= 85) return ['aggressive', 'defensive', 'sweep'][Math.floor(Math.random() * 3)];
  return ['defensive', 'aggressive', 'sweep'][Math.floor(Math.random() * 3)];
}

function chooseAiDelivery(card) {
  if (!card) return VALID_DELIVERIES[Math.floor(Math.random() * VALID_DELIVERIES.length)];
  if (card.position === 'Bowler' && card.rating >= 90) return ['yorker', 'fast', 'spin', 'bouncer'][Math.floor(Math.random() * 4)];
  return VALID_DELIVERIES[Math.floor(Math.random() * VALID_DELIVERIES.length)];
}

function updateSoloScorecard(match, innings, battingSide, bowlingSide, batter, bowler, runs, isWicket) {
  const batterStats = innings.scorecard[battingSide][batter.name];
  const bowlerStats = innings.scorecard[bowlingSide][bowler.name];

  batterStats.balls += 1;
  bowlerStats.oversBalls += 1;
  bowlerStats.runsConceded += runs;

  if (isWicket) {
    batterStats.status = 'out';
    bowlerStats.wickets += 1;
  } else {
    batterStats.runs += runs;
    if (runs === 4) batterStats.fours += 1;
    if (runs === 6) batterStats.sixes += 1;
  }
}

function finalizeSoloMatch(match) {
  const user = cricketData.users[match.userId];
  if (!user) return;

  const userRuns = match.innings[1].runs.user + match.innings[2].runs.user;
  const aiRuns = match.innings[1].runs.ai + match.innings[2].runs.ai;
  const userWickets = match.innings[1].wickets.user + match.innings[2].wickets.user;
  const aiWickets = match.innings[1].wickets.ai + match.innings[2].wickets.ai;

  user.stats.matches += 1;
  user.stats.runs += userRuns;
  user.stats.wickets += aiWickets;

  if (userRuns > aiRuns) {
    user.stats.wins += 1;
    user.stats.coins += 150;
    match.winner = 'user';
  } else if (aiRuns > userRuns) {
    user.stats.coins += 40;
    match.winner = 'ai';
  } else {
    user.stats.coins += 75;
    match.winner = 'tie';
  }

}

function playBall(matchId, action) {
  const match = cricketData.matches[matchId];
  if (!match || match.status !== 'live') return null;

  const innings = match.innings[match.currentInnings];
  const battingSide = innings.battingSide;
  const bowlingSide = battingSide === 'user' ? 'ai' : 'user';
  const userBatting = battingSide === 'user';

  if (userBatting && !['hit', 'defend'].includes(action)) {
    return { success: false, message: 'Use `rcbat` or `rcdefend` while batting.' };
  }
  if (!userBatting && !VALID_DELIVERIES.includes(action)) {
    return { success: false, message: `Choose a delivery: ${VALID_DELIVERIES.join(', ')}` };
  }

  ensureSoloActors(match);
  const batter = innings.currentBatter[battingSide];
  const bowler = innings.currentBowler[bowlingSide];
  if (!batter || !bowler) {
    return { success: false, message: 'Unable to select active players for this innings.' };
  }

  const shot = userBatting ? (action === 'hit' ? 'aggressive' : 'defensive') : chooseAiShot(batter);
  const delivery = userBatting ? chooseAiDelivery(bowler) : action;
  const outcome = OUTCOME_MATRIX[shot][delivery];
  const ratingDiff = ((batter.rating || 80) - (bowler.rating || 80)) / 100;
  const adjustedWicketChance = Math.max(0.02, Math.min(0.95, outcome.wicketChance - ratingDiff * 0.10));
  const isWicket = Math.random() < adjustedWicketChance;
  const runs = isWicket ? 0 : Math.floor(Math.random() * (outcome.maxRuns - outcome.minRuns + 1)) + outcome.minRuns;

  innings.balls += 1;
  innings.runs[battingSide] += runs;
  if (isWicket) innings.wickets[battingSide] += 1;
  innings.timeline.push({ over: `${Math.floor((innings.balls - 1) / 6)}.${(innings.balls - 1) % 6}`, batter: batter.name, bowler: bowler.name, shot, delivery, runs, isWicket });
  updateSoloScorecard(match, innings, battingSide, bowlingSide, batter, bowler, runs, isWicket);

  if (isWicket) {
    innings.currentBatter[battingSide] = null;
    chooseNextBatter(match, battingSide);
  } else {
    innings.currentBatter[battingSide] = cloneCard(batter);
    innings.scorecard[battingSide][batter.name].status = 'batting';
  }

  chooseCurrentBowler(match, bowlingSide);

  const maxBalls = match.overs * 6;
  const firstInningsTarget = match.innings[1].runs.user + match.innings[1].runs.ai;
  const chasingSide = match.innings[2].battingSide;
  const chasingScore = match.innings[2].runs[chasingSide];
  const chasingWon = match.currentInnings === 2 && chasingScore > firstInningsTarget;
  const inningsOver = innings.balls >= maxBalls || innings.wickets[battingSide] >= Math.min(10, match.lineups[battingSide].batting.length);

  let inningsSwitched = false;
  let matchOver = false;

  if (inningsOver || chasingWon) {
    if (match.currentInnings === 1) {
      match.currentInnings = 2;
      match.innings[2].battingSide = match.innings[1].battingSide === 'user' ? 'ai' : 'user';
      ensureSoloActors(match);
      inningsSwitched = true;
    } else {
      match.status = 'completed';
      finalizeSoloMatch(match);
      matchOver = true;
    }
  }

  saveData();
  return {
    success: true,
    shot,
    delivery,
    runs,
    wicket: isWicket,
    isWicket,
    match,
    batter,
    bowler,
    battingSide,
    bowlingSide,
    inningsSwitched,
    matchOver,
  };
}

function formatRunsWickets(runs, wickets, balls) {
  return `${runs}/${wickets} (${Math.floor(balls / 6)}.${balls % 6} ov)`;
}

function getMatchScorecard(matchId) {
  const match = cricketData.matches[matchId];
  if (!match) return null;

  return {
    match,
    innings1: {
      battingSide: match.innings[1].battingSide,
      user: formatRunsWickets(match.innings[1].runs.user, match.innings[1].wickets.user, match.innings[1].balls),
      ai: formatRunsWickets(match.innings[1].runs.ai, match.innings[1].wickets.ai, match.innings[1].balls),
      timeline: match.innings[1].timeline.slice(-6),
    },
    innings2: {
      battingSide: match.innings[2].battingSide,
      user: formatRunsWickets(match.innings[2].runs.user, match.innings[2].wickets.user, match.innings[2].balls),
      ai: formatRunsWickets(match.innings[2].runs.ai, match.innings[2].wickets.ai, match.innings[2].balls),
      timeline: match.innings[2].timeline.slice(-6),
    }
  };
}

// Get leaderboard
function getLeaderboard() {
  const users = Object.values(cricketData.users).sort((a, b) => b.stats.wins - a.stats.wins);
  return users.slice(0, 10);
}

// Debut - Get 10 low rating + 1 high rating players
function doDebut(userId) {
  const user = getProfile(userId);
  
  if (user.debuted) {
    return { success: false, message: 'You have already debuted!' };
  }

  // Get low rating players (ratings 60-75)
  const lowRatingPlayers = getAllPlayers().filter(p => p.rating >= 60 && p.rating <= 75);
  const highRatingPlayers = getAllPlayers().filter(p => p.rating >= 90);

  // Shuffle and pick 10 low + 1 high
  const shuffledLow = lowRatingPlayers.sort(() => Math.random() - 0.5).slice(0, 10);
  const shuffledHigh = highRatingPlayers.sort(() => Math.random() - 0.5).slice(0, 1);
  const selectedPlayers = [...shuffledLow, ...shuffledHigh];

  selectedPlayers.forEach(player => {
    user.cards.push({
      id: `card_${Date.now()}_${Math.random()}`,
      name: player.name,
      country: player.country,
      position: player.position,
      role: player.role,
      level: 1,
      rating: player.rating
    });
  });

  user.debuted = true;
  user.stats.coins += 500; // Bonus coins for debuting
  saveData();

  return { 
    success: true, 
    players: selectedPlayers,
    message: 'Debut successful! You received 10 low-rated + 1 high-rated player + 500 bonus coins!'
  };
}

// Claim - Get random player every 1 hour
function claimPlayer(userId) {
  const user = getProfile(userId);
  const now = Date.now();
  const cooldownMs = 60 * 60 * 1000; // 1 hour

  if (user.lastClaim && (now - user.lastClaim) < cooldownMs) {
    const remainingMs = cooldownMs - (now - user.lastClaim);
    const remainingMins = Math.ceil(remainingMs / (60 * 1000));
    return { success: false, message: `Claim available in ${remainingMins} minutes` };
  }

  const allPlayers = getAllPlayers();
  const randomPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];

  user.cards.push({
    id: `card_${Date.now()}`,
    name: randomPlayer.name,
    country: randomPlayer.country,
    position: randomPlayer.position,
    role: randomPlayer.role,
    level: 1,
    rating: randomPlayer.rating
  });

  user.lastClaim = now;
  saveData();

  return { 
    success: true, 
    player: randomPlayer,
    message: 'Claimed a new player!'
  };
}

// Daily - Get 2000 coins every 24 hours
function dailyReward(userId) {
  const user = getProfile(userId);
  const now = Date.now();
  const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours

  if (user.lastDaily && (now - user.lastDaily) < cooldownMs) {
    const remainingMs = cooldownMs - (now - user.lastDaily);
    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
    return { success: false, message: `Daily reward available in ${remainingHours} hours` };
  }

  user.stats.coins += 2000;
  user.lastDaily = now;
  saveData();

  return { 
    success: true, 
    coins: 2000,
    message: 'Daily reward claimed! +2000 coins'
  };
}

// Add player to squad
function addToSquad(userId, playerCardId) {
  const user = getProfile(userId);

  if (user.squad.length >= 11) {
    return { success: false, message: 'Squad is full! Remove a player first.' };
  }

  const playerIndex = user.cards.findIndex(c => c.id === playerCardId);
  if (playerIndex === -1) {
    return { success: false, message: 'Player card not found!' };
  }

  const player = user.cards[playerIndex];
  
  if (user.squad.find(p => p.id === playerCardId)) {
    return { success: false, message: 'Player already in squad!' };
  }

  user.squad.push(player);
  saveData();

  return { 
    success: true, 
    message: `${player.name} added to squad!`,
    player: player
  };
}

// Remove player from squad
function removeFromSquad(userId, playerCardId) {
  const user = getProfile(userId);

  const squadIndex = user.squad.findIndex(p => p.id === playerCardId);
  if (squadIndex === -1) {
    return { success: false, message: 'Player not in squad!' };
  }

  const removedPlayer = user.squad[squadIndex];
  user.squad.splice(squadIndex, 1);
  saveData();

  return { 
    success: true, 
    message: `${removedPlayer.name} removed from squad!`,
    player: removedPlayer
  };
}

// Get squad
function getSquad(userId) {
  const user = getProfile(userId);
  if (!user.squad) {
    user.squad = [];
    saveData();
  }
  return user.squad;
}

// View user's all cards with ID for selection
function getAllCards(userId) {
  const user = getProfile(userId);
  return user.cards;
}

function searchPlayers(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return getAllPlayers().filter(player =>
    player.name.toLowerCase().includes(normalized) ||
    player.country.toLowerCase().includes(normalized) ||
    player.position.toLowerCase().includes(normalized) ||
    player.role.toLowerCase().includes(normalized)
  );
}

function releaseCard(userId, cardId) {
  const user = getProfile(userId);
  const cardIndex = user.cards.findIndex(card => card.id === cardId);
  if (cardIndex === -1) {
    return { success: false, message: 'Player card not found.' };
  }

  const activeDuel = getUserActiveDuel(userId);
  if (activeDuel) {
    const activeCardIds = [activeDuel.currentBatter?.id, activeDuel.currentBowler?.id].filter(Boolean);
    if (activeCardIds.includes(cardId)) {
      return { success: false, message: 'You cannot release a player currently active in a live duel.' };
    }
  }

  const [releasedCard] = user.cards.splice(cardIndex, 1);
  user.squad = user.squad.filter(card => card.id !== cardId);

  const sellValue = Math.max(25, Math.round(releasedCard.rating * 1.5));
  user.stats.coins += sellValue;
  saveData();

  return {
    success: true,
    card: releasedCard,
    coins: sellValue,
  };
}

function swapSquadPlayer(userId, squadIndex, cardId) {
  const user = getProfile(userId);
  if (squadIndex < 0 || squadIndex >= user.squad.length) {
    return { success: false, message: 'Invalid squad position.' };
  }

  const incomingCard = user.cards.find(card => card.id === cardId);
  if (!incomingCard) {
    return { success: false, message: 'Player card not found.' };
  }

  if (user.squad.some(card => card.id === cardId)) {
    return { success: false, message: 'That player is already in your squad.' };
  }

  const outgoingCard = user.squad[squadIndex];
  user.squad[squadIndex] = incomingCard;
  saveData();

  return {
    success: true,
    incomingCard,
    outgoingCard,
  };
}

// ─────────────────────────────────────────────
//  1v1 DUEL SYSTEM
// ─────────────────────────────────────────────

// Shot vs Delivery outcome matrix
// Each entry: { minRuns, maxRuns, wicketChance }
const OUTCOME_MATRIX = {
  aggressive: {
    fast:    { minRuns: 4, maxRuns: 6, wicketChance: 0.20 },
    spin:    { minRuns: 1, maxRuns: 3, wicketChance: 0.15 },
    yorker:  { minRuns: 0, maxRuns: 2, wicketChance: 0.35 },
    bouncer: { minRuns: 4, maxRuns: 6, wicketChance: 0.25 },
  },
  defensive: {
    fast:    { minRuns: 1, maxRuns: 2, wicketChance: 0.05 },
    spin:    { minRuns: 1, maxRuns: 3, wicketChance: 0.10 },
    yorker:  { minRuns: 1, maxRuns: 2, wicketChance: 0.08 },
    bouncer: { minRuns: 0, maxRuns: 1, wicketChance: 0.30 },
  },
  loft: {
    fast:    { minRuns: 4, maxRuns: 6, wicketChance: 0.25 },
    spin:    { minRuns: 6, maxRuns: 6, wicketChance: 0.20 },
    yorker:  { minRuns: 0, maxRuns: 0, wicketChance: 0.50 },
    bouncer: { minRuns: 4, maxRuns: 6, wicketChance: 0.20 },
  },
  sweep: {
    fast:    { minRuns: 2, maxRuns: 4, wicketChance: 0.15 },
    spin:    { minRuns: 4, maxRuns: 6, wicketChance: 0.10 },
    yorker:  { minRuns: 1, maxRuns: 2, wicketChance: 0.20 },
    bouncer: { minRuns: 0, maxRuns: 0, wicketChance: 0.40 },
  },
};

const VALID_SHOTS = ['aggressive', 'defensive', 'loft', 'sweep'];
const VALID_DELIVERIES = ['fast', 'spin', 'yorker', 'bouncer'];
const BALL_TIMEOUT_MS = 60 * 1000; // 60 seconds

function createChallenge(challengerId, challengerName, opponentId, format) {
  cricketData.challenges[opponentId] = {
    challengerId,
    challengerName,
    opponentId,
    format,
    timestamp: Date.now(),
  };
  saveData();
}

function getChallenge(opponentId) {
  if (!cricketData.challenges) return null;
  const c = cricketData.challenges[opponentId];
  if (!c) return null;
  // expire after 2 minutes
  if (Date.now() - c.timestamp > 2 * 60 * 1000) {
    delete cricketData.challenges[opponentId];
    saveData();
    return null;
  }
  return c;
}

function removeChallenge(opponentId) {
  if (cricketData.challenges) delete cricketData.challenges[opponentId];
  saveData();
}

function createDuel(challengerId, challengerName, opponentId, opponentName, format) {
  if (!cricketData.duels) cricketData.duels = {};
  const duelId = `duel_${Date.now()}`;
  const overs = format === 'odi' ? 50 : 20;

  // Coin toss
  const tossWinner = Math.random() < 0.5 ? challengerId : opponentId;
  const tossLoser  = tossWinner === challengerId ? opponentId : challengerId;

  cricketData.duels[duelId] = {
    duelId,
    format,
    overs,
    // team A bats first (decided after toss choice)
    teamA: null, // userId of batting team first innings
    teamB: null,
    tossWinner,
    tossLoser,
    tossChoice: null, // 'bat' or 'bowl' — set when toss winner responds
    players: {
      [challengerId]: { userId: challengerId, username: challengerName },
      [opponentId]:   { userId: opponentId,   username: opponentName  },
    },
    // innings state
    innings: 1,
    scores: { 1: { runs: 0, wickets: 0, balls: 0 }, 2: { runs: 0, wickets: 0, balls: 0 } },
    // current ball state
    battingTeam: null,
    bowlingTeam: null,
    currentBatter: null,   // card object
    currentBowler: null,   // card object
    pendingShot: null,
    pendingDelivery: null,
    lastBallTime: null,
    status: 'toss', // toss -> selecting -> live -> completed
    winner: null,
    channelId: null,
  };

  saveData();
  return cricketData.duels[duelId];
}

function getDuel(duelId) {
  return cricketData.duels ? cricketData.duels[duelId] : null;
}

function getUserActiveDuel(userId) {
  if (!cricketData.duels) return null;
  return Object.values(cricketData.duels).find(d =>
    d.status !== 'completed' &&
    d.players &&
    (Object.keys(d.players).includes(userId))
  ) || null;
}

function setTossChoice(duelId, choice) {
  const duel = getDuel(duelId);
  if (!duel) return null;
  duel.tossChoice = choice;

  if (choice === 'bat') {
    duel.teamA = duel.tossWinner;
    duel.teamB = duel.tossLoser;
  } else {
    duel.teamA = duel.tossLoser;
    duel.teamB = duel.tossWinner;
  }

  duel.battingTeam = duel.teamA;
  duel.bowlingTeam = duel.teamB;
  duel.status = 'selecting';
  saveData();
  return duel;
}

function setActiveBatter(duelId, userId, cardId) {
  const duel = getDuel(duelId);
  if (!duel || duel.battingTeam !== userId) return { success: false, message: 'You are not batting right now.' };

  const user = getProfile(userId);
  const squad = user.squad || [];
  const card = squad.find(c => c.id === cardId);
  if (!card) return { success: false, message: 'Player not found in your squad.' };

  const validPositions = ['Batsman', 'All-rounder'];
  if (!validPositions.includes(card.position)) {
    return { success: false, message: `${card.name} is a ${card.position}, not a batter!` };
  }

  duel.currentBatter = card;
  if (duel.currentBatter && duel.currentBowler) duel.status = 'live';
  saveData();
  return { success: true, card };
}

function setActiveBowler(duelId, userId, cardId) {
  const duel = getDuel(duelId);
  if (!duel || duel.bowlingTeam !== userId) return { success: false, message: 'You are not bowling right now.' };

  const user = getProfile(userId);
  const squad = user.squad || [];
  const card = squad.find(c => c.id === cardId);
  if (!card) return { success: false, message: 'Player not found in your squad.' };

  const validPositions = ['Bowler', 'All-rounder'];
  if (!validPositions.includes(card.position)) {
    return { success: false, message: `${card.name} is a ${card.position}, not a bowler!` };
  }

  duel.currentBowler = card;
  if (duel.currentBatter && duel.currentBowler) duel.status = 'live';
  saveData();
  return { success: true, card };
}

function submitShot(duelId, userId, shot) {
  const duel = getDuel(duelId);
  if (!duel) return { success: false, message: 'Duel not found.' };
  if (duel.status !== 'live') return { success: false, message: 'Match is not live yet.' };
  if (duel.battingTeam !== userId) return { success: false, message: 'You are not batting!' };
  if (!VALID_SHOTS.includes(shot)) return { success: false, message: `Invalid shot. Choose: ${VALID_SHOTS.join(', ')}` };
  if (duel.pendingShot) return { success: false, message: 'You already submitted a shot! Waiting for bowler.' };

  duel.pendingShot = shot;
  duel.lastBallTime = Date.now();
  saveData();

  if (duel.pendingDelivery) return resolveBall(duelId);
  return { success: true, waiting: true };
}

function submitDelivery(duelId, userId, delivery) {
  const duel = getDuel(duelId);
  if (!duel) return { success: false, message: 'Duel not found.' };
  if (duel.status !== 'live') return { success: false, message: 'Match is not live yet.' };
  if (duel.bowlingTeam !== userId) return { success: false, message: 'You are not bowling!' };
  if (!VALID_DELIVERIES.includes(delivery)) return { success: false, message: `Invalid delivery. Choose: ${VALID_DELIVERIES.join(', ')}` };
  if (duel.pendingDelivery) return { success: false, message: 'You already submitted a delivery! Waiting for batter.' };

  duel.pendingDelivery = delivery;
  duel.lastBallTime = Date.now();
  saveData();

  if (duel.pendingShot) return resolveBall(duelId);
  return { success: true, waiting: true };
}

function autoPlayTimeout(duelId) {
  const duel = getDuel(duelId);
  if (!duel || duel.status !== 'live') return null;
  if (!duel.lastBallTime || Date.now() - duel.lastBallTime < BALL_TIMEOUT_MS) return null;

  let timedOutRole = null;
  if (!duel.pendingShot) timedOutRole = 'batter';
  else if (!duel.pendingDelivery) timedOutRole = 'bowler';

  // Auto-fill missing choices
  if (!duel.pendingShot) duel.pendingShot = 'defensive';
  if (!duel.pendingDelivery) duel.pendingDelivery = 'fast';

  const result = resolveBall(duelId);
  if (result) result.timedOutRole = timedOutRole;
  return result;
}

function resolveBall(duelId) {
  const duel = getDuel(duelId);
  const shot = duel.pendingShot;
  const delivery = duel.pendingDelivery;

  const outcome = OUTCOME_MATRIX[shot][delivery];

  // Rating modifier: batter rating vs bowler rating shifts wicket chance ±10%
  const batterRating = duel.currentBatter ? duel.currentBatter.rating : 80;
  const bowlerRating = duel.currentBowler ? duel.currentBowler.rating : 80;
  const ratingDiff = (batterRating - bowlerRating) / 100; // -1 to +1 range
  const adjustedWicketChance = Math.max(0.02, Math.min(0.95, outcome.wicketChance - ratingDiff * 0.10));

  const isWicket = Math.random() < adjustedWicketChance;
  const runs = isWicket ? 0 : Math.floor(Math.random() * (outcome.maxRuns - outcome.minRuns + 1)) + outcome.minRuns;

  const inningsData = duel.scores[duel.innings];
  inningsData.balls++;
  if (isWicket) {
    inningsData.wickets++;
  } else {
    inningsData.runs += runs;
  }

  // Reset pending
  duel.pendingShot = null;
  duel.pendingDelivery = null;
  duel.lastBallTime = null;

  // Check innings end: all overs bowled OR 10 wickets
  const maxBalls = duel.overs * 6;
  const inningsOver = inningsData.balls >= maxBalls || inningsData.wickets >= 10;

  // Check if chasing team has already won (second innings)
  const chasingWon = duel.innings === 2 && inningsData.runs > duel.scores[1].runs;

  let inningsSwitched = false;
  let matchOver = false;

  if (chasingWon || inningsOver) {
    if (duel.innings === 1) {
      // Switch to second innings
      duel.innings = 2;
      duel.battingTeam = duel.teamB;
      duel.bowlingTeam = duel.teamA;
      duel.currentBatter = null;
      duel.currentBowler = null;
      duel.status = 'selecting';
      inningsSwitched = true;
    } else {
      // Match over
      matchOver = true;
      duel.status = 'completed';
      const score1 = duel.scores[1].runs;
      const score2 = duel.scores[2].runs;
      if (score2 > score1) {
        duel.winner = duel.teamB;
      } else if (score1 > score2) {
        duel.winner = duel.teamA;
      } else {
        duel.winner = 'tie';
      }
      updateDuelStats(duel);
    }
  }

  saveData();

  return {
    success: true,
    shot,
    delivery,
    runs,
    isWicket,
    inningsData,
    inningsSwitched,
    matchOver,
    duel,
    batterRating,
    bowlerRating,
  };
}

function updateDuelStats(duel) {
  const players = Object.keys(duel.players);
  players.forEach(uid => {
    const user = cricketData.users[uid];
    if (!user) return;
    user.stats.matches++;
    const isTeamA = duel.teamA === uid;
    user.stats.runs += isTeamA ? duel.scores[1].runs : duel.scores[2].runs;
    if (duel.winner === uid) {
      user.stats.wins++;
      user.stats.coins += 200;
    } else if (duel.winner === 'tie') {
      user.stats.coins += 75;
    } else {
      user.stats.coins += 50;
    }
  });
  saveData();
}

function formatScore(duel, inningsNum) {
  const s = duel.scores[inningsNum];
  const overs = Math.floor(s.balls / 6);
  const balls = s.balls % 6;
  return `${s.runs}/${s.wickets} (${overs}.${balls} ov)`;
}

module.exports = {
  loadData,
  saveData,
  initializeUser,
  getProfile,
  addCard,
  createMatch,
  playBall,
  setSoloTossChoice,
  getCurrentMatch,
  getMatchScorecard,
  getLeaderboard,
  doDebut,
  claimPlayer,
  dailyReward,
  addToSquad,
  removeFromSquad,
  getSquad,
  getAllCards,
  getTeamName,
  setTeamName,
  searchPlayers,
  releaseCard,
  swapSquadPlayer,
  cricketData,
  getAllPlayers,
  getPlayerByName,
  getRandomPlayers,
  // 1v1 duel
  createChallenge,
  getChallenge,
  removeChallenge,
  createDuel,
  getDuel,
  getUserActiveDuel,
  setTossChoice,
  setActiveBatter,
  setActiveBowler,
  submitShot,
  submitDelivery,
  autoPlayTimeout,
  formatScore,
  VALID_SHOTS,
  VALID_DELIVERIES,
};
