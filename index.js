const http = require('http');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cricket = require('./cricket-system.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Load cricket data
cricket.loadData();

client.once('ready', () => {
  console.log('🏏 Cricket Guru Bot is online!');
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args[0];
  const userId = message.author.id;

  if (command === 'rchelp') {
    const helpEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('🏏 Cricket Bot Commands')
      .addFields(
        { name: 'rcdebut', value: 'Start your cricket journey (10 low + 1 high rated players)' },
        { name: 'rcclaim', value: 'Claim a random player (1-hour cooldown)' },
        { name: 'rcdaily', value: 'Get daily 2000 coins (24-hour cooldown)' },
        { name: 'rcprofile', value: 'View your stats and cards' },
        { name: 'rccards', value: 'View your cricket cards' },
        { name: 'rclist', value: 'List all your cards with numbers' },
        { name: 'rcsquad', value: 'View your squad' },
        { name: 'rc11', value: 'View starting 11 players' },
        { name: 'rcaddtosquad [num]', value: 'Add player to squad by number' },
        { name: 'rcremovefromsquad [num]', value: 'Remove player from squad by position' },
        { name: 'rcallplayers', value: 'View all real cricket players' },
        { name: 'rcplay [opponent]', value: 'Start a match (T20)' },
        { name: 'rcbat', value: 'Play an aggressive shot' },
        { name: 'rcdefend', value: 'Play defensively' },
        { name: 'rcmatch', value: 'View current match status' },
        { name: 'rcleaderboard', value: 'View top players' },
        { name: 'rcaddcard [name]', value: 'Get a real player card (100 coins)' },
        { name: 'rcinfo', value: 'Bot info' }
      )
      .setFooter({ text: 'Prefix: rc' });
    message.reply({ embeds: [helpEmbed] });
  }

  else if (command === 'rcprofile') {
    cricket.initializeUser(userId, message.author.username);
    const user = cricket.getProfile(userId);
    const profileEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle(`📊 ${user.username}'s Profile`)
      .addFields(
        { name: 'Matches', value: String(user.stats.matches), inline: true },
        { name: 'Wins', value: String(user.stats.wins), inline: true },
        { name: 'Win Rate', value: user.stats.matches > 0 ? `${(user.stats.wins / user.stats.matches * 100).toFixed(1)}%` : 'N/A', inline: true },
        { name: 'Total Runs', value: String(user.stats.runs), inline: true },
        { name: 'Wickets', value: String(user.stats.wickets), inline: true },
        { name: 'Coins', value: String(user.stats.coins), inline: true },
        { name: 'Total Cards', value: String(user.cards.length), inline: true },
        { name: 'Debuted', value: user.debuted ? '✅ Yes' : '❌ No', inline: true }
      );
    message.reply({ embeds: [profileEmbed] });
  }

  else if (command === 'rcdebut') {
    cricket.initializeUser(userId, message.author.username);
    const result = cricket.doDebut(userId);

    if (!result.success) {
      return message.reply(`❌ ${result.message}`);
    }

    let playerList = '🎉 **Debut Successful!**\n\n**Your New Squad:**\n';
    result.players.forEach((player, i) => {
      const isStarPlayer = player.rating >= 90 ? '⭐⭐⭐' : '';
      playerList += `${i + 1}. **${player.name}** (${player.country}) | ${player.position} | ⭐ ${player.rating} ${isStarPlayer}\n`;
    });
    playerList += '\n**Bonus:** +500 Coins';

    if (playerList.length > 1900) {
      const chunks = playerList.match(/[\s\S]{1,1900}/g);
      chunks.forEach(chunk => message.reply(chunk));
    } else {
      message.reply(playerList);
    }
  }

  else if (command === 'rcclaim') {
    cricket.initializeUser(userId, message.author.username);
    const result = cricket.claimPlayer(userId);

    if (!result.success) {
      return message.reply(`⏱️ ${result.message}`);
    }

    const claimEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('🎴 Claimed Player!')
      .addFields(
        { name: 'Name', value: result.player.name },
        { name: 'Country', value: result.player.country, inline: true },
        { name: 'Position', value: result.player.position, inline: true },
        { name: 'Role', value: result.player.role, inline: true },
        { name: 'Rating', value: `⭐ ${result.player.rating}` }
      )
      .setFooter({ text: 'Next claim available in 1 hour' });

    message.reply({ embeds: [claimEmbed] });
  }

  else if (command === 'rcdaily') {
    cricket.initializeUser(userId, message.author.username);
    const result = cricket.dailyReward(userId);

    if (!result.success) {
      return message.reply(`⏱️ ${result.message}`);
    }

    const dailyEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('💰 Daily Reward Claimed!')
      .addFields(
        { name: 'Coins Received', value: `+${result.coins}` },
        { name: 'Message', value: result.message }
      )
      .setFooter({ text: 'Next daily reward available in 24 hours' });

    message.reply({ embeds: [dailyEmbed] });
  }

  else if (command === 'rccards') {
    cricket.initializeUser(userId, message.author.username);
    const user = cricket.getProfile(userId);
    let cardList = `**Your Cricket Cards (${user.cards.length})**\n`;
    user.cards.forEach((card, i) => {
      cardList += `\n${i + 1}. **${card.name}** (${card.country}) | ${card.position} | ${card.role} | ⭐ ${card.rating} | Lvl ${card.level}`;
    });
    message.reply(cardList);
  }

  else if (command === 'rclist') {
    cricket.initializeUser(userId, message.author.username);
    const cards = cricket.getAllCards(userId);
    let cardList = `**📋 Your Cards List (Use numbers with rcaddtosquad)**\n\n`;
    cards.forEach((card, i) => {
      cardList += `${i + 1}. **${card.name}** (${card.country}) | ${card.position} | ⭐ ${card.rating}\n`;
    });
    
    if (cardList.length > 1900) {
      const chunks = cardList.match(/[\s\S]{1,1900}/g);
      chunks.forEach(chunk => message.reply(chunk));
    } else {
      message.reply(cardList);
    }
  }

  else if (command === 'rcsquad') {
    cricket.initializeUser(userId, message.author.username);
    const squad = cricket.getSquad(userId);

    if (squad.length === 0) {
      return message.reply('❌ Your squad is empty! Use `rclist` to see your cards, then `rcaddtosquad [number]` to add them.');
    }

    const squadEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('🏏 Your Squad')
      .addFields(
        { name: 'Squad Size', value: `${squad.length}/11` }
      );

    let squadText = '';
    squad.forEach((player, i) => {
      squadText += `${i + 1}. **${player.name}** (${player.country}) | ${player.position} | ⭐ ${player.rating}\n`;
    });

    squadEmbed.addFields({ name: 'Players', value: squadText || 'No players' });
    message.reply({ embeds: [squadEmbed] });
  }

  else if (command === 'rc11') {
    cricket.initializeUser(userId, message.author.username);
    const squad = cricket.getSquad(userId);

    if (squad.length === 0) {
      return message.reply('❌ Your squad is empty! Build it with `rcaddtosquad`');
    }

    const elevenEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('⚡ Starting 11')
      .addFields(
        { name: 'Total Players', value: `${squad.length}/11` }
      );

    let playersByPosition = {
      'Batsman': [],
      'Bowler': [],
      'All-rounder': []
    };

    squad.forEach(player => {
      if (playersByPosition[player.position]) {
        playersByPosition[player.position].push(player);
      }
    });

    let positionText = '';
    Object.entries(playersByPosition).forEach(([position, players]) => {
      if (players.length > 0) {
        positionText += `\n**${position}s (${players.length})**\n`;
        players.forEach((p, i) => {
          positionText += `  ${i + 1}. ${p.name} (${p.country}) - ⭐ ${p.rating}\n`;
        });
      }
    });

    elevenEmbed.addFields({ name: 'Squad Breakdown', value: positionText || 'Empty' });
    message.reply({ embeds: [elevenEmbed] });
  }

  else if (command === 'rcaddtosquad') {
    cricket.initializeUser(userId, message.author.username);
    const cardNum = parseInt(args[1]);

    if (!cardNum) {
      return message.reply('❌ Usage: `rcaddtosquad [number]`\nExample: `rcaddtosquad 5`\nUse `rclist` to see card numbers.');
    }

    const cards = cricket.getAllCards(userId);
    if (cardNum < 1 || cardNum > cards.length) {
      return message.reply(`❌ Invalid card number! (1-${cards.length})`);
    }

    const selectedCard = cards[cardNum - 1];
    const result = cricket.addToSquad(userId, selectedCard.id);

    if (!result.success) {
      return message.reply(`❌ ${result.message}`);
    }

    const addEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('✅ Player Added to Squad')
      .addFields(
        { name: 'Player', value: result.player.name },
        { name: 'Country', value: result.player.country, inline: true },
        { name: 'Position', value: result.player.position, inline: true },
        { name: 'Rating', value: `⭐ ${result.player.rating}` },
        { name: 'Squad Status', value: `${cricket.getSquad(userId).length}/11` }
      );

    message.reply({ embeds: [addEmbed] });
  }

  else if (command === 'rcremovefromsquad') {
    cricket.initializeUser(userId, message.author.username);
    const squadNum = parseInt(args[1]);

    const squad = cricket.getSquad(userId);
    
    if (!squadNum) {
      return message.reply('❌ Usage: `rcremovefromsquad [position]`\nExample: `rcremovefromsquad 1`\nUse `rcsquad` to see positions.');
    }

    if (squadNum < 1 || squadNum > squad.length) {
      return message.reply(`❌ Invalid squad position! (1-${squad.length})`);
    }

    const playerToRemove = squad[squadNum - 1];
    const result = cricket.removeFromSquad(userId, playerToRemove.id);

    if (!result.success) {
      return message.reply(`❌ ${result.message}`);
    }

    const removeEmbed = new EmbedBuilder()
      .setColor('#dc143c')
      .setTitle('❌ Player Removed from Squad')
      .addFields(
        { name: 'Player', value: result.player.name },
        { name: 'Squad Status', value: `${cricket.getSquad(userId).length}/11` }
      );

    message.reply({ embeds: [removeEmbed] });
  }

  else if (command === 'rcplay') {
    const opponent = args[1] || 'AI Bot';
    cricket.initializeUser(userId, message.author.username);
    const matchId = cricket.createMatch(userId, opponent, 20);
    const matchEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('🏏 Match Started!')
      .addFields(
        { name: 'You vs', value: opponent },
        { name: 'Format', value: 'T20 (20 Overs)' },
        { name: 'Your Score', value: '0/0' },
        { name: 'Commands', value: 'rcbat (hit) or rcdefend (defensive)\nrcmatch (view status)' }
      );
    message.reply({ embeds: [matchEmbed] });
    // Store match ID in user data for reference
    cricket.cricketData.users[userId].currentMatch = matchId;
    cricket.saveData();
  }

  else if (command === 'rcbat' || command === 'rcdefend') {
    cricket.initializeUser(userId, message.author.username);
    const user = cricket.getProfile(userId);
    const matchId = user.currentMatch;

    if (!matchId || !cricket.cricketData.matches[matchId]) {
      return message.reply('❌ No active match! Start one with `rcplay`');
    }

    const action = command === 'rcbat' ? 'hit' : 'defend';
    const result = cricket.playBall(matchId, action);
    const match = result.match;

    const resultText = result.wicket ? '⚠️ WICKET!' : `✅ ${result.runs} Runs!`;
    const statusText = match.status === 'completed' ? '🏁 **MATCH ENDED**' : `Over: ${Math.floor(match.currentOver / 6)}.${match.currentOver % 6}`;

    const ballEmbed = new EmbedBuilder()
      .setColor(result.wicket ? '#dc143c' : '#1f8b4c')
      .setTitle(resultText)
      .addFields(
        { name: 'Your Score', value: `${match.userScore}/${match.userWickets}` },
        { name: 'Opponent', value: `${match.opponentScore}/${match.opponentWickets}` },
        { name: statusText, value: match.status === 'completed' ? (match.userScore > match.opponentScore ? '🎉 **YOU WIN!**' : '😢 **YOU LOSE!**') : 'Continuing...' }
      );

    message.reply({ embeds: [ballEmbed] });
  }

  else if (command === 'rcmatch') {
    cricket.initializeUser(userId, message.author.username);
    const user = cricket.getProfile(userId);
    const matchId = user.currentMatch;

    if (!matchId || !cricket.cricketData.matches[matchId]) {
      return message.reply('❌ No active match!');
    }

    const match = cricket.cricketData.matches[matchId];
    const matchEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('📋 Match Status')
      .addFields(
        { name: 'Your Team', value: `${match.userScore}/${match.userWickets}`, inline: true },
        { name: match.opponent, value: `${match.opponentScore}/${match.opponentWickets}`, inline: true },
        { name: 'Over', value: `${Math.floor(match.currentOver / 6)}.${match.currentOver % 6}/${match.overs}`, inline: true },
        { name: 'Status', value: match.status === 'ongoing' ? 'Live' : 'Completed' }
      );
    message.reply({ embeds: [matchEmbed] });
  }

  else if (command === 'rcleaderboard') {
    const leaderboard = cricket.getLeaderboard();
    let leaderboardText = '🏆 **Top Players**\n';
    leaderboard.forEach((user, i) => {
      leaderboardText += `\n${i + 1}. **${user.username}** - ${user.stats.wins} wins | ${user.stats.runs} runs`;
    });
    message.reply(leaderboardText);
  }

  else if (command === 'rcaddcard') {
    cricket.initializeUser(userId, message.author.username);
    const user = cricket.getProfile(userId);

    if (user.stats.coins < 100) {
      return message.reply('❌ Need 100 coins! (You have ' + user.stats.coins + ')');
    }

    const playerName = args.slice(1).join(' ');
    
    if (!playerName) {
      return message.reply('❌ Usage: `rcaddcard [Player Name]`\nExample: `rcaddcard Virat Kohli`\nUse `rcallplayers` to see all players!');
    }

    const card = cricket.addCard(userId, playerName);

    if (!card) {
      return message.reply(`❌ Player "${playerName}" not found! Use \`rcallplayers\` to see all real cricket players.`);
    }

    user.stats.coins -= 100;
    cricket.saveData();

    message.reply(`🎴 **New Card Acquired!**\n**${card.name}** (${card.country})\n${card.position} | ${card.role}\n⭐ Rating: ${card.rating}`);
  }

  else if (command === 'rcallplayers') {
    const allPlayers = cricket.getAllPlayers();
    
    // Group by country
    const playersByCountry = {};
    allPlayers.forEach(player => {
      if (!playersByCountry[player.country]) {
        playersByCountry[player.country] = [];
      }
      playersByCountry[player.country].push(player);
    });

    let playerList = '🏏 **All Available Cricket Players**\n\n';
    Object.keys(playersByCountry).sort().forEach(country => {
      playerList += `**${country}**\n`;
      playersByCountry[country].forEach(player => {
        playerList += `• ${player.name} | ${player.position} | ⭐ ${player.rating}\n`;
      });
      playerList += '\n';
    });

    // Discord has a 2000 character limit, so we need to split messages if needed
    if (playerList.length > 1900) {
      const chunks = playerList.match(/[\s\S]{1,1900}/g);
      chunks.forEach(chunk => message.reply(chunk));
    } else {
      message.reply(playerList);
    }
  }

  else if (command === 'rcinfo') {
    const infoEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('🏏 Cricket Guru Bot')
      .setDescription('Your ultimate cricket gaming bot!')
      .addFields(
        { name: 'Features', value: '🎮 Match Simulation\n🎴 Cricket Cards\n📊 Player Stats\n🏆 Leaderboards' },
        { name: 'Version', value: '1.0.0' }
      );
    message.reply({ embeds: [infoEmbed] });
  }

  else if (command === 'rccricket') {
    message.reply('🏏 Cricket Guru bot is ready! Use `rchelp` for commands.');
  }
});

const botToken = process.env.BOT_TOKEN;

if (!botToken) {
  console.error('Error: BOT_TOKEN environment variable is not set.');
  process.exit(1);
}

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Cricket Guru Bot is running');
}).listen(port, () => {
  console.log(`Health server listening on port ${port}`);
});

console.log('Attempting to login...');
client.login(botToken);

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

