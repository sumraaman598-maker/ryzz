const fs = require('fs');
const path = require('path');
const { getRandomPlayers, getPlayerByName, getAllPlayers, getPlayersByTier } = require('./players.js');

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
  if (typeof user.lastDrop !== 'number') user.lastDrop = 0;
  if (!Object.prototype.hasOwnProperty.call(user, 'pendingDrop')) user.pendingDrop = null;
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

// Market value of a card based on rating
function playerValue(card) {
  const r = card.rating;
  if (r >= 95) return 5000;
  if (r >= 90) return 3000;
  if (r >= 85) return 1500;
  if (r >= 80) return 800;
  if (r >= 75) return 400;
  if (r >= 70) return 200;
  return 100;
}

// Cost to buy a card (same scale as playerValue)
function getCardCost(rating) {
  if (rating >= 95) return 5000;
  if (rating >= 90) return 3000;
  if (rating >= 85) return 1500;
  if (rating >= 80) return 800;
  if (rating >= 75) return 400;
  if (rating >= 70) return 200;
  return 100;
}

// Add card to user
function addCard(userId, cardName) {
  const user = getProfile(userId);
  const playerData = getPlayerByName(cardName);
  
  if (!playerData) {
    return null; // Player not found
  }

  const cost = getCardCost(playerData.rating);
  if (user.stats.coins < cost) {
    return { error: 'insufficient_coins', cost, coins: user.stats.coins };
  }

  const card = {
    id: `card_${Date.now()}`,
    name: playerData.name,
    country: playerData.country,
    position: playerData.position,
    role: playerData.role,
    tier: playerData.tier,
    level: 1,
    rating: playerData.rating
  };
  user.stats.coins -= cost;
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

// Debut - Give exactly 11 players: 4 batsmen, 2 all-rounders, 3 bowlers, 1 keeper, 1 elite star
function doDebut(userId) {
  const user = getProfile(userId);
  
  if (user.debuted) {
    return { success: false, message: 'You have already debuted!' };
  }

  const allPlayers = getAllPlayers();

  function pickFiltered(position, minRating, maxRating, count) {
    const pool = allPlayers.filter(p => p.position === position && p.rating >= minRating && p.rating <= maxRating);
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  }

  const batsmen    = pickFiltered('Batsman',        65, 78, 4);
  const allRounders= pickFiltered('All-rounder',    68, 80, 2);
  const bowlers    = pickFiltered('Bowler',         65, 78, 3);
  const keepers    = pickFiltered('Wicket-keeper',  65, 78, 1);
  const elitePool  = allPlayers.filter(p => p.rating >= 88);
  const starSigning= [...elitePool].sort(() => Math.random() - 0.5).slice(0, 1);

  const selectedPlayers = [...batsmen, ...allRounders, ...bowlers, ...keepers, ...starSigning];

  selectedPlayers.forEach(player => {
    const card = {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: player.name,
      country: player.country,
      position: player.position,
      role: player.role,
      tier: player.tier,
      level: 1,
      rating: player.rating
    };
    user.cards.push(card);
    if (user.squad.length < 11) user.squad.push(card);
  });

  user.debuted = true;
  user.stats.coins += 1000; // Debut bonus
  saveData();

  return { 
    success: true, 
    players: selectedPlayers,
    starSigning: starSigning[0] || null,
    message: `Debut successful! You received 11 players (4 batsmen, 2 all-rounders, 3 bowlers, 1 keeper + 1 star signing) and 1000 bonus coins!`
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
  const claimPool = allPlayers.filter(p => p.rating >= 60 && p.rating <= 79);
  const randomPlayer = claimPool[Math.floor(Math.random() * claimPool.length)];

  user.cards.push({
    id: `card_${Date.now()}`,
    name: randomPlayer.name,
    country: randomPlayer.country,
    position: randomPlayer.position,
    role: randomPlayer.role,
    tier: randomPlayer.tier,
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

// Daily - Get 1500 coins + a random bronze player every 24 hours
function dailyReward(userId) {
  const user = getProfile(userId);
  const now = Date.now();
  const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours

  if (user.lastDaily && (now - user.lastDaily) < cooldownMs) {
    const remainingMs = cooldownMs - (now - user.lastDaily);
    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
    return { success: false, message: `Daily reward available in ${remainingHours} hours` };
  }

  user.stats.coins += 1500;
  user.lastDaily = now;

  // Bonus: random bronze player (rating 60-69, or lowest tier available)
  const bronzePool = getAllPlayers().filter(p => p.tier === 'bronze');
  let bonusPlayer = null;
  if (bronzePool.length > 0) {
    const bp = bronzePool[Math.floor(Math.random() * bronzePool.length)];
    bonusPlayer = {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: bp.name,
      country: bp.country,
      position: bp.position,
      role: bp.role,
      tier: bp.tier,
      level: 1,
      rating: bp.rating
    };
    user.cards.push(bonusPlayer);
  }

  saveData();

  return { 
    success: true, 
    coins: 1500,
    bonusPlayer,
    message: `Daily reward claimed! +1500 coins${bonusPlayer ? ` + ${bonusPlayer.name} (bronze)` : ''}`
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

  const sellValue = Math.max(25, Math.round(playerValue(releasedCard) * 0.4));
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
//  1v1 DUEL SYSTEM — Cricket Guru Style
// ─────────────────────────────────────────────
const engine = require('./duel-engine.js');
const {
  VALID_SHOTS, VALID_DELIVERIES, BASE_SHOTS, BASE_DELIVERIES,
  SHOT_LABELS, DELIVERY_LABELS, SHOT_STRENGTH, SHOT_WEAKNESS,
  BALL_TIMEOUT_MS,
  createDuelData, setupInnings,
  getEligibleBowlers, getEligibleBatters,
  resolveDuelBall,
} = engine;

const formatDuelScore    = engine.formatDuelScore;
const getRequiredRunRate = engine.getRequiredRunRate;
const isPowerplay        = engine.isPowerplay;

//  Shots: cover_drive | square_drive | pull | straight_drive (+ lofted_ prefix)
//  Deliveries: yorker | good | full | short (+ spin_ prefix)

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
  cricketData.duels[duelId] = createDuelData(duelId, challengerId, challengerName, opponentId, opponentName, format);
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
    Object.keys(d.players).includes(userId)
  ) || null;
}

function setTossChoice(duelId, choice) {
  const duel = getDuel(duelId);
  if (!duel) return null;
  duel.tossChoice = choice;
  if (choice === 'bat') { duel.teamA = duel.tossWinner; duel.teamB = duel.tossLoser; }
  else                  { duel.teamA = duel.tossLoser;  duel.teamB = duel.tossWinner; }
  duel.battingTeam = duel.teamA;
  duel.bowlingTeam = duel.teamB;
  duel.status = 'selecting';
  // Setup innings 1 batting/bowling orders
  setupInnings(duel, 1, duel.teamA, duel.teamB, uid => getSquad(uid));
  saveData();
  return duel;
}

// Select opening batter (index into eligible batters list)
function selectBatter(duelId, userId, squadIndex) {
  const duel = getDuel(duelId);
  if (!duel) return { success: false, message: 'Duel not found.' };
  if (duel.battingTeam !== userId) return { success: false, message: 'You are not batting right now.' };
  if (duel.status !== 'selecting') return { success: false, message: 'Not in selection phase.' };

  const eligible = getEligibleBatters(duel, userId, uid => getSquad(uid));
  if (squadIndex < 0 || squadIndex >= eligible.length) return { success: false, message: 'Invalid selection.' };

  duel.currentBatter = eligible[squadIndex];
  if (duel.currentBatter && duel.currentBowler) duel.status = 'live';
  saveData();
  return { success: true, card: duel.currentBatter };
}

// Select opening bowler (index into eligible bowlers list)
function selectBowler(duelId, userId, squadIndex) {
  const duel = getDuel(duelId);
  if (!duel) return { success: false, message: 'Duel not found.' };
  if (duel.bowlingTeam !== userId) return { success: false, message: 'You are not bowling right now.' };
  if (duel.status !== 'selecting') return { success: false, message: 'Not in selection phase.' };

  const eligible = getEligibleBowlers(duel, userId, uid => getSquad(uid));
  if (squadIndex < 0 || squadIndex >= eligible.length) return { success: false, message: 'Invalid selection.' };

  duel.currentBowler = eligible[squadIndex];
  if (duel.currentBatter && duel.currentBowler) duel.status = 'live';
  saveData();
  return { success: true, card: duel.currentBowler };
}

function submitShot(duelId, userId, shot) {
  const duel = getDuel(duelId);
  if (!duel) return { success: false, message: 'Duel not found.' };
  if (duel.status !== 'live') return { success: false, message: 'Match is not live yet.' };
  if (duel.battingTeam !== userId) return { success: false, message: 'You are not batting!' };
  if (!VALID_SHOTS.includes(shot)) return { success: false, message: 'Invalid shot.' };
  if (duel.pendingShot) return { success: false, message: 'Shot already locked in! Waiting for bowler.' };

  duel.pendingShot = shot;
  duel.lastBallTime = duel.lastBallTime || Date.now();
  saveData();

  if (duel.pendingDelivery) return _resolveBall(duelId);
  return { success: true, waiting: true };
}

function submitDelivery(duelId, userId, delivery) {
  const duel = getDuel(duelId);
  if (!duel) return { success: false, message: 'Duel not found.' };
  if (duel.status !== 'live') return { success: false, message: 'Match is not live yet.' };
  if (duel.bowlingTeam !== userId) return { success: false, message: 'You are not bowling!' };
  if (!VALID_DELIVERIES.includes(delivery)) return { success: false, message: 'Invalid delivery.' };
  if (duel.pendingDelivery) return { success: false, message: 'Delivery already locked in! Waiting for batter.' };

  duel.pendingDelivery = delivery;
  duel.lastBallTime = duel.lastBallTime || Date.now();
  saveData();

  if (duel.pendingShot) return _resolveBall(duelId);
  return { success: true, waiting: true };
}

function _resolveBall(duelId) {
  const duel = getDuel(duelId);
  const result = resolveDuelBall(duel);

  if (result.matchOver) {
    _updateDuelStats(duel);
  } else if (result.inningsSwitched) {
    // Setup innings 2 batting/bowling orders
    setupInnings(duel, 2, duel.teamB, duel.teamA, uid => getSquad(uid));
  }

  saveData();
  return { ...result, duel };
}

function _updateDuelStats(duel) {
  Object.keys(duel.players).forEach(uid => {
    const user = cricketData.users[uid];
    if (!user) return;
    user.stats.matches++;
    const isTeamA = duel.teamA === uid;
    user.stats.runs += isTeamA ? duel.inningsData[1].runs : duel.inningsData[2].runs;
    if (duel.winner === uid) { user.stats.wins++; user.stats.coins += 200; }
    else if (duel.winner === 'tie') user.stats.coins += 75;
    else user.stats.coins += 50;
  });
}

function autoPlayTimeout(duelId) {
  const duel = getDuel(duelId);
  if (!duel || duel.status !== 'live') return null;
  if (!duel.lastBallTime || Date.now() - duel.lastBallTime < BALL_TIMEOUT_MS) return null;

  const timedOutRole = !duel.pendingShot ? 'batter' : 'bowler';
  if (!duel.pendingShot)     duel.pendingShot     = 'cover_drive';
  if (!duel.pendingDelivery) duel.pendingDelivery = 'full';

  const result = _resolveBall(duelId);
  if (result) result.timedOutRole = timedOutRole;
  return result;
}

function getDuelEligible(userId, role) {
  const duel = getUserActiveDuel(userId);
  if (!duel) return getSquad(userId).filter(c =>
    role === 'bat' ? (c.position === 'Batsman' || c.position === 'All-rounder')
                   : (c.position === 'Bowler'  || c.position === 'All-rounder')
  );
  if (role === 'bat') return getEligibleBatters(duel, userId, uid => getSquad(uid));
  return getEligibleBowlers(duel, userId, uid => getSquad(uid));
}

// Spin Wheel - costs 200 coins, returns coins / silver-gold player / nothing
function spinWheel(userId) {
  const user = getProfile(userId);
  const cost = 200;

  if (user.stats.coins < cost) {
    return { success: false, message: `You need ${cost} coins to spin. You have ${user.stats.coins}.` };
  }

  user.stats.coins -= cost;

  const roll = Math.random();
  let result;

  if (roll < 0.40) {
    // 40% — coins
    const amount = Math.floor(Math.random() * (2000 - 100 + 1)) + 100;
    user.stats.coins += amount;
    result = { type: 'coins', amount };
  } else if (roll < 0.70) {
    // 30% — silver or gold player (rating 70-89)
    const pool = getAllPlayers().filter(p => p.rating >= 70 && p.rating <= 89);
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const card = {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: picked.name,
      country: picked.country,
      position: picked.position,
      role: picked.role,
      tier: picked.tier,
      level: 1,
      rating: picked.rating
    };
    user.cards.push(card);
    result = { type: 'player', player: card };
  } else {
    // 30% — nothing
    result = { type: 'nothing' };
  }

  saveData();
  return { success: true, ...result };
}

// ── DROP SYSTEM (CG-style: hourly player drop, retain or release) ─────────────
function createDrop(userId) {
  const user = getProfile(userId);
  const now = Date.now();
  const cooldownMs = 60 * 60 * 1000; // 1 hour

  if (user.lastDrop && (now - user.lastDrop) < cooldownMs) {
    const remainingMs = cooldownMs - (now - user.lastDrop);
    const remainingMins = Math.ceil(remainingMs / (60 * 1000));
    return { success: false, message: `Drop available in **${remainingMins} minutes**` };
  }

  // Drop pool: any player (weighted toward lower tiers)
  const allPlayers = getAllPlayers();
  const roll = Math.random();
  let pool;
  if (roll < 0.50)      pool = allPlayers.filter(p => p.tier === 'bronze' || p.tier === 'silver');
  else if (roll < 0.80) pool = allPlayers.filter(p => p.tier === 'gold');
  else                  pool = allPlayers.filter(p => p.tier === 'elite');
  if (pool.length === 0) pool = allPlayers;

  const picked = pool[Math.floor(Math.random() * pool.length)];
  const card = {
    id: `drop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: picked.name, country: picked.country,
    position: picked.position, role: picked.role,
    tier: picked.tier, level: 1, rating: picked.rating,
  };

  // Store pending drop (expires in 5 minutes)
  user.pendingDrop = { card, expiresAt: now + 5 * 60 * 1000 };
  user.lastDrop = now;
  saveData();

  return { success: true, card };
}

function retainDrop(userId) {
  const user = getProfile(userId);
  if (!user.pendingDrop) return { success: false, message: 'No pending drop.' };
  if (Date.now() > user.pendingDrop.expiresAt) {
    user.pendingDrop = null;
    saveData();
    return { success: false, message: 'Drop expired!' };
  }
  const card = user.pendingDrop.card;
  user.cards.push(card);
  user.pendingDrop = null;
  saveData();
  return { success: true, card };
}

function releaseDrop(userId) {
  const user = getProfile(userId);
  if (!user.pendingDrop) return { success: false, message: 'No pending drop.' };
  const card = user.pendingDrop.card;
  const coins = Math.round(playerValue(card) * 0.3); // 30% of value for releasing
  user.stats.coins += coins;
  user.pendingDrop = null;
  saveData();
  return { success: true, card, coins };
}

module.exports = {
  loadData,
  saveData,
  initializeUser,
  getProfile,
  addCard,
  getCardCost,
  playerValue,
  getPlayerValue: playerValue,
  createMatch,
  playBall,
  setSoloTossChoice,
  getCurrentMatch,
  getMatchScorecard,
  getLeaderboard,
  doDebut,
  claimPlayer,
  dailyReward,
  spinWheel,
  createDrop,
  retainDrop,
  releaseDrop,
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
  selectBatter,
  selectBowler,
  submitShot,
  submitDelivery,
  autoPlayTimeout,
  getDuelEligible,
  // engine re-exports
  formatScore: formatDuelScore,
  formatDuelScorecard: engine.formatDuelScorecard,
  getRequiredRunRate,
  isPowerplay,
  VALID_SHOTS,
  VALID_DELIVERIES,
  BASE_SHOTS,
  BASE_DELIVERIES,
  SHOT_LABELS,
  DELIVERY_LABELS,
  SHOT_STRENGTH,
  SHOT_WEAKNESS,
};
