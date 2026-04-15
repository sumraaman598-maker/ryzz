const fs = require('fs');
const path = require('path');
const { getRandomPlayers, getPlayerByName, getAllPlayers } = require('./players.js');

const dataFile = path.join(__dirname, 'cricket-data.json');

// Initialize data structure
let cricketData = {
  users: {},
  matches: {}
};

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      cricketData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
  } catch (err) {
    console.log('Creating new data file...');
  }
}

// Save data to file
function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(cricketData, null, 2));
}

// Initialize user
function initializeUser(userId, username) {
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
      debuted: false
    };
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

// Create match
function createMatch(userId, opponent, overs = 20) {
  const matchId = `match_${Date.now()}`;
  cricketData.matches[matchId] = {
    userId: userId,
    opponent: opponent,
    overs: overs,
    userScore: 0,
    userWickets: 0,
    opponentScore: 0,
    opponentWickets: 0,
    currentInning: 'user', // user or opponent
    currentOver: 0,
    status: 'ongoing'
  };
  saveData();
  return matchId;
}

// Simulate match ball
function playBall(matchId, action) {
  const match = cricketData.matches[matchId];
  if (!match || match.status !== 'ongoing') return null;

  let runs = 0;
  let wicket = false;

  if (action === 'hit') {
    runs = Math.floor(Math.random() * 6) + 1; // 1-6 runs
    if (Math.random() > 0.8) {
      wicket = true;
      runs = 0;
    }
  } else if (action === 'defend') {
    runs = Math.floor(Math.random() * 3); // 0-2 runs
    if (Math.random() > 0.9) {
      wicket = true;
    }
  }

  if (match.currentInning === 'user') {
    match.userScore += runs;
    if (wicket) match.userWickets++;
  } else {
    match.opponentScore += runs;
    if (wicket) match.opponentWickets++;
  }

  match.currentOver++;
  if (match.currentOver >= match.overs * 6) {
    // Switch inning or end match
    if (match.currentInning === 'user') {
      match.currentInning = 'opponent';
      match.currentOver = 0;
    } else {
      match.status = 'completed';
      updateStats(match);
    }
  }

  saveData();
  return { runs, wicket, match };
}

// Update user stats after match
function updateStats(match) {
  const user = cricketData.users[match.userId];
  if (!user) return;

  user.stats.matches++;
  user.stats.runs += match.userScore;
  user.stats.wickets += 10 - match.userWickets; // Bowled wickets (simplified)

  if (match.userScore > match.opponentScore) {
    user.stats.wins++;
    user.stats.coins += 100; // Reward for winning
  } else {
    user.stats.coins += 25; // Consolation
  }

  saveData();
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

// Get leaderboard
function getLeaderboard() {
  const users = Object.values(cricketData.users).sort((a, b) => b.stats.wins - a.stats.wins);
  return users.slice(0, 10);
}

module.exports = {
  loadData,
  saveData,
  initializeUser,
  getProfile,
  addCard,
  createMatch,
  playBall,
  getLeaderboard,
  doDebut,
  claimPlayer,
  dailyReward,
  addToSquad,
  removeFromSquad,
  getSquad,
  getAllCards,
  cricketData,
  getAllPlayers: getAllPlayers,
  getPlayerByName: getPlayerByName,
  getRandomPlayers: getRandomPlayers
};
