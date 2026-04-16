const http = require('http');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

function buildSoloMatchButtons(match) {
  if (match.status === 'completed') {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('solo:scorecard').setLabel('Scorecard').setStyle(ButtonStyle.Secondary)
      )
    ];
  }

  if (match.status === 'toss' && match.tossWinner === 'user') {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('solo:toss:bat').setLabel('Bat First').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('solo:toss:bowl').setLabel('Bowl First').setStyle(ButtonStyle.Secondary)
      )
    ];
  }

  const innings = match.innings[match.currentInnings];
  const rows = [];

  if (innings.battingSide === 'user') {
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('solo:bat:hit').setLabel('Attack').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('solo:bat:defend').setLabel('Defend').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('solo:scorecard').setLabel('Scorecard').setStyle(ButtonStyle.Secondary)
    ));
  } else {
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('solo:bowl:fast').setLabel('Fast').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('solo:bowl:spin').setLabel('Spin').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('solo:bowl:yorker').setLabel('Yorker').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('solo:bowl:bouncer').setLabel('Bouncer').setStyle(ButtonStyle.Danger)
    ));
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('solo:scorecard').setLabel('Scorecard').setStyle(ButtonStyle.Secondary)
    ));
  }

  return rows;
}

function buildSoloMatchPayload(match, title = 'Match Status') {
  if (match.status === 'toss') {
    const tossEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle(title)
      .addFields(
        { name: 'Match', value: `${match.userTeamName} vs ${match.aiTeamName}` },
        { name: 'Format', value: `${match.format.toUpperCase()} (${match.overs} overs)`, inline: true },
        { name: 'Toss Winner', value: match.tossWinner === 'user' ? match.userTeamName : match.aiTeamName, inline: true },
        {
          name: 'Next Step',
          value: match.tossWinner === 'user'
            ? 'Choose to bat or bowl first.'
            : `${match.aiTeamName} is deciding the toss outcome.`
        }
      );
    return { embeds: [tossEmbed], components: buildSoloMatchButtons(match) };
  }

  const innings = match.innings[match.currentInnings];
  const battingSide = innings.battingSide;
  const bowlingSide = battingSide === 'user' ? 'ai' : 'user';
  const battingName = battingSide === 'user' ? match.userTeamName : match.aiTeamName;
  const bowlingName = bowlingSide === 'user' ? match.userTeamName : match.aiTeamName;
  const battingRuns = innings.runs[battingSide];
  const battingWickets = innings.wickets[battingSide];
  const currentBatter = innings.currentBatter[battingSide];
  const currentBowler = innings.currentBowler[bowlingSide];
  const target = match.currentInnings === 2 ? match.innings[1].runs[match.innings[1].battingSide] + 1 : null;

  const embed = new EmbedBuilder()
    .setColor(match.status === 'completed' ? '#FFD700' : '#1f8b4c')
    .setTitle(title)
    .addFields(
      { name: 'Match', value: `${match.userTeamName} vs ${match.aiTeamName}`, inline: false },
      { name: 'Innings', value: String(match.currentInnings), inline: true },
      { name: 'Batting', value: battingName, inline: true },
      { name: 'Bowling', value: bowlingName, inline: true },
      { name: 'Score', value: `${battingRuns}/${battingWickets}`, inline: true },
      { name: 'Over', value: `${Math.floor(innings.balls / 6)}.${innings.balls % 6}/${match.overs}`, inline: true },
      { name: 'Target', value: target ? String(target) : 'Set a strong total', inline: true },
      { name: 'Active Batter', value: currentBatter ? `${currentBatter.name} (${currentBatter.rating})` : 'TBD', inline: false },
      { name: 'Current Bowler', value: currentBowler ? `${currentBowler.name} (${currentBowler.rating})` : 'TBD', inline: false }
    );

  if (match.status === 'completed') {
    embed.addFields({
      name: 'Result',
      value: match.winner === 'user' ? `${match.userTeamName} won.` : match.winner === 'ai' ? `${match.aiTeamName} won.` : 'Match tied.'
    });
  }

  return { embeds: [embed], components: buildSoloMatchButtons(match) };
}

function buildSoloBallPayload(result) {
  const match = result.match;
  const inningsNumber = match.currentInnings === 2 && result.inningsSwitched ? 1 : match.currentInnings;
  const innings = match.innings[inningsNumber];
  const battingSide = innings.battingSide;
  const battingRuns = innings.runs[battingSide];
  const battingWickets = innings.wickets[battingSide];

  const embed = new EmbedBuilder()
    .setColor(result.isWicket ? '#dc143c' : result.runs >= 4 ? '#1f8b4c' : '#4a90d9')
    .setTitle(result.isWicket ? 'Wicket' : `${result.runs} Runs`)
    .addFields(
      { name: 'Shot', value: result.shot, inline: true },
      { name: 'Delivery', value: result.delivery, inline: true },
      { name: 'Batter', value: `${result.batter.name} (${result.batter.rating})`, inline: false },
      { name: 'Bowler', value: `${result.bowler.name} (${result.bowler.rating})`, inline: false },
      { name: 'Score', value: `${battingRuns}/${battingWickets}`, inline: true },
      {
        name: 'Status',
        value: result.matchOver
          ? (match.winner === 'user' ? 'You won the match.' : match.winner === 'ai' ? 'AI won the match.' : 'Match tied.')
          : result.inningsSwitched
            ? 'Innings break. The chase is about to begin.'
            : 'Next ball ready.'
      }
    );

  return { embeds: [embed], components: buildSoloMatchButtons(match) };
}

function buildSoloScorecardPayload(match) {
  const scorecard = cricket.getMatchScorecard(match.matchId);
  const inn1Batting = scorecard.innings1.battingSide === 'user' ? match.userTeamName : match.aiTeamName;
  const inn2Batting = scorecard.innings2.battingSide === 'user' ? match.userTeamName : match.aiTeamName;

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('Match Scorecard')
    .addFields(
      { name: `Innings 1 - ${inn1Batting}`, value: scorecard.innings1.battingSide === 'user' ? scorecard.innings1.user : scorecard.innings1.ai, inline: false },
      { name: 'Recent Balls', value: scorecard.innings1.timeline.length ? scorecard.innings1.timeline.map(ball => `${ball.over}: ${ball.batter} vs ${ball.bowler} - ${ball.isWicket ? 'W' : ball.runs}`).join('\n') : 'No balls yet', inline: false },
      { name: `Innings 2 - ${inn2Batting}`, value: scorecard.innings2.battingSide === 'user' ? scorecard.innings2.user : scorecard.innings2.ai, inline: false },
      { name: 'Recent Balls', value: scorecard.innings2.timeline.length ? scorecard.innings2.timeline.map(ball => `${ball.over}: ${ball.batter} vs ${ball.bowler} - ${ball.isWicket ? 'W' : ball.runs}`).join('\n') : 'No balls yet', inline: false }
    );

  return { embeds: [embed], components: buildSoloMatchButtons(match) };
}

// Helper: render ball result embed and handle innings switch / match end
async function handleBallResult(message, result, duelId) {
  const { shot, delivery, runs, isWicket, inningsData, inningsSwitched, matchOver, duel, batterRating, bowlerRating } = result;

  const shotEmoji = { aggressive: '💥', defensive: '🛡️', loft: '🚀', sweep: '🌀' };
  const deliveryEmoji = { fast: '⚡', spin: '🌪️', yorker: '🎯', bouncer: '💢' };

  const ballEmbed = new EmbedBuilder()
    .setColor(isWicket ? '#dc143c' : runs >= 6 ? '#FFD700' : runs >= 4 ? '#1f8b4c' : '#4a90d9')
    .setTitle(isWicket ? '🔴 WICKET!' : runs === 6 ? '🏏 SIX!' : runs === 4 ? '🏏 FOUR!' : `✅ ${runs} Run${runs !== 1 ? 's' : ''}`)
    .addFields(
      { name: `${shotEmoji[shot] || '🏏'} Shot`, value: shot.charAt(0).toUpperCase() + shot.slice(1), inline: true },
      { name: `${deliveryEmoji[delivery] || '🎳'} Delivery`, value: delivery.charAt(0).toUpperCase() + delivery.slice(1), inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: '🏏 Batter Rating', value: `⭐ ${batterRating}`, inline: true },
      { name: '🎳 Bowler Rating', value: `⭐ ${bowlerRating}`, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: 'Score', value: `${inningsData.runs}/${inningsData.wickets} (${Math.floor(inningsData.balls / 6)}.${inningsData.balls % 6} ov)` }
    );

  if (inningsSwitched) {
    const freshDuel = cricket.getDuel(duelId);
    const battingName = freshDuel.players[freshDuel.battingTeam].username;
    const bowlingName = freshDuel.players[freshDuel.bowlingTeam].username;
    const target = freshDuel.scores[1].runs + 1;
    ballEmbed.addFields(
      { name: '🔄 Innings Over!', value: `**Innings 2 begins!**\nTarget: **${target} runs**` },
      { name: '🏏 Now Batting', value: battingName },
      { name: '🎳 Now Bowling', value: bowlingName },
      { name: 'Next Step', value: `${battingName}: \`rcsetbatter [num]\`\n${bowlingName}: \`rcsetbowler [num]\`` }
    );
  } else if (matchOver) {
    const freshDuel = cricket.getDuel(duelId);
    const winnerName = freshDuel.winner === 'tie' ? null : freshDuel.players[freshDuel.winner].username;
    const s1 = cricket.formatScore(freshDuel, 1);
    const s2 = cricket.formatScore(freshDuel, 2);
    const p1name = freshDuel.players[freshDuel.teamA].username;
    const p2name = freshDuel.players[freshDuel.teamB].username;
    ballEmbed.addFields(
      { name: '🏁 MATCH OVER', value: freshDuel.winner === 'tie' ? "🤝 It's a Tie!" : `🏆 **${winnerName}** wins!` },
      { name: `${p1name} (Inn 1)`, value: s1, inline: true },
      { name: `${p2name} (Inn 2)`, value: s2, inline: true },
      { name: 'Rewards', value: winnerName ? `**${winnerName}** +200 coins | Loser +50 coins` : 'Both players +75 coins (tie)' }
    );
  } else {
    ballEmbed.addFields({
      name: 'Next Ball',
      value: `🏏 Batter: \`rcshot [aggressive/defensive/loft/sweep]\`\n🎳 Bowler: \`rcbowl [fast/spin/yorker/bouncer]\``
    });
  }

  await message.reply({ embeds: [ballEmbed] });
}

// Timeout checker — auto-play if a player goes AFK (runs every 30s)
setInterval(() => {
  if (!cricket.cricketData.duels) return;
  Object.values(cricket.cricketData.duels).forEach(async duel => {
    if (duel.status !== 'live') return;
    if (!duel.lastBallTime) return;
    if (Date.now() - duel.lastBallTime < 60000) return;

    const result = cricket.autoPlayTimeout(duel.duelId);
    if (!result || !result.success) return;

    // Find the channel to post in
    if (!duel.channelId) return;
    const channel = client.channels.cache.get(duel.channelId);
    if (!channel) return;

    const timedOutSide = result.timedOutRole === 'bowler'
      ? duel.players[duel.bowlingTeam].username
      : duel.players[duel.battingTeam].username;
    await channel.send(`⏱️ **${timedOutSide}** took too long — auto-played!`);

    // Build a fake message-like object to reuse handleBallResult
    const fakeMsg = { reply: (opts) => channel.send(opts) };
    await handleBallResult(fakeMsg, result, duel.duelId);
  });
}, 30000);

client.once('ready', () => {
  console.log('🏏 Cricket Guru Bot is online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args[0];
  const userId = message.author.id;

  if (command === 'rchelp') {
    const helpEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('🏏 Cricket Bot Commands')
      .addFields(
        { name: '── Collection ──', value: '\u200b' },
        { name: 'rcguide', value: 'Quick-start guide for building your club and winning matches' },
        { name: 'rcdebut', value: 'Start your cricket journey (10 low + 1 high rated players)' },
        { name: 'rcclaim', value: 'Claim a random player (1-hour cooldown)' },
        { name: 'rcdaily', value: 'Get daily 2000 coins (24-hour cooldown)' },
        { name: 'rcpurse', value: 'Check your coin balance and reward progress' },
        { name: 'rcaddcard [name]', value: 'Buy a specific player card (100 coins)' },
        { name: 'rcrelease [num]', value: 'Release a card for coins' },
        { name: 'rcsearch [name/country/role]', value: 'Search the global player pool' },
        { name: '── Squad ──', value: '\u200b' },
        { name: 'rcprofile', value: 'View your club profile and stats' },
        { name: 'rccareer', value: 'Detailed career summary' },
        { name: 'rccards', value: 'View your cricket cards' },
        { name: 'rclist', value: 'List all your cards with numbers' },
        { name: 'rcsquad', value: 'View your squad' },
        { name: 'rc11 / rcxi', value: 'View your playing XI' },
        { name: 'rcteamname [name]', value: 'Rename your club/team' },
        { name: 'rcaddtosquad [num]', value: 'Add player to squad by number' },
        { name: 'rcremovefromsquad [num]', value: 'Remove player from squad by position' },
        { name: 'rcswap [squadPos] [cardNum]', value: 'Swap a squad player with a card from your collection' },
        { name: 'rcallplayers', value: 'View all real cricket players' },
        { name: '── 1v1 Match ──', value: '\u200b' },
        { name: 'rcchallenge @user [t20/odi]', value: 'Challenge another player to a match' },
        { name: 'rcaccept', value: 'Accept an incoming challenge' },
        { name: 'rcdecline', value: 'Decline an incoming challenge' },
        { name: 'rctoss [bat/bowl]', value: 'Choose bat or bowl after winning toss' },
        { name: 'rcsetbatter [num]', value: 'Set your active batter from squad' },
        { name: 'rcsetbowler [num]', value: 'Set your active bowler from squad' },
        { name: 'rcshot [aggressive/defensive/loft/sweep]', value: 'Play a shot (batting team)' },
        { name: 'rcbowl [fast/spin/yorker/bouncer]', value: 'Bowl a delivery (bowling team)' },
        { name: 'rcduelstatus', value: 'View current 1v1 match status' },
        { name: '── Other ──', value: '\u200b' },
        { name: 'rcplay [t20/odi]', value: 'Start a button-based solo match vs AI' },
        { name: 'rcscorecard', value: 'View the current solo match scorecard' },
        { name: 'rcleaderboard', value: 'View top players' },
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
        { name: 'Team Name', value: cricket.getTeamName(userId), inline: false },
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

  else if (command === 'rcguide') {
    const guideEmbed = new EmbedBuilder()
      .setColor('#4a90d9')
      .setTitle('ðŸ“˜ Cricket Guru Guide')
      .setDescription('Build your club, grow your squad, then take on AI or real players.')
      .addFields(
        { name: '1. Start Strong', value: '`rcdebut` for your starter club, then `rcdaily` and `rcclaim` for economy.' },
        { name: '2. Build Your XI', value: 'Use `rclist`, `rcaddtosquad`, `rcswap`, and `rcxi` to shape your best lineup.' },
        { name: '3. Scout Talent', value: '`rcsearch` to find players and `rcaddcard [name]` to buy specific stars.' },
        { name: '4. Manage Your Club', value: '`rcteamname`, `rcprofile`, `rccareer`, and `rcpurse` keep your club identity clear.' },
        { name: '5. Compete', value: '`rcplay` for solo matches or `rcchallenge @user [t20/odi]` for live duels.' }
      );
    message.reply({ embeds: [guideEmbed] });
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

  else if (command === 'rcpurse') {
    cricket.initializeUser(userId, message.author.username);
    const user = cricket.getProfile(userId);
    const purseEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('ðŸ’° Club Purse')
      .addFields(
        { name: 'Team', value: cricket.getTeamName(userId), inline: false },
        { name: 'Coins', value: String(user.stats.coins), inline: true },
        { name: 'Cards Owned', value: String(user.cards.length), inline: true },
        { name: 'Squad Size', value: `${cricket.getSquad(userId).length}/11`, inline: true },
        { name: 'Income Tips', value: '`rcdaily`, `rcclaim`, duel wins, and `rcrelease` all help grow your purse.' }
      );
    message.reply({ embeds: [purseEmbed] });
  }

  else if (command === 'rccareer') {
    cricket.initializeUser(userId, message.author.username);
    const user = cricket.getProfile(userId);
    const winRate = user.stats.matches > 0 ? `${(user.stats.wins / user.stats.matches * 100).toFixed(1)}%` : 'N/A';
    const careerEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle(`ðŸ† ${user.username}'s Career`)
      .addFields(
        { name: 'Club', value: cricket.getTeamName(userId), inline: false },
        { name: 'Matches', value: String(user.stats.matches), inline: true },
        { name: 'Wins', value: String(user.stats.wins), inline: true },
        { name: 'Win Rate', value: winRate, inline: true },
        { name: 'Runs', value: String(user.stats.runs), inline: true },
        { name: 'Wickets', value: String(user.stats.wickets), inline: true },
        { name: 'Coins', value: String(user.stats.coins), inline: true },
        { name: 'Collection', value: `${user.cards.length} cards | ${cricket.getSquad(userId).length}/11 in squad`, inline: false }
      );
    message.reply({ embeds: [careerEmbed] });
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

  else if (command === 'rcsearch') {
    const query = args.slice(1).join(' ').trim();
    if (!query) {
      return message.reply('âŒ Usage: `rcsearch [name/country/role]`\nExample: `rcsearch india`');
    }

    const results = cricket.searchPlayers(query);
    if (results.length === 0) {
      return message.reply(`âŒ No players matched "${query}".`);
    }

    let resultText = `ðŸ” **Player Search: ${query}**\n\n`;
    results.slice(0, 15).forEach((player, i) => {
      resultText += `${i + 1}. **${player.name}** (${player.country}) | ${player.position} | ${player.role} | â­ ${player.rating}\n`;
    });
    if (results.length > 15) {
      resultText += `\n...and ${results.length - 15} more results. Narrow your search for a shorter list.`;
    }
    message.reply(resultText);
  }

  else if (command === 'rcsquad') {
    cricket.initializeUser(userId, message.author.username);
    const squad = cricket.getSquad(userId);

    if (squad.length === 0) {
      return message.reply('❌ Your squad is empty! Use `rclist` to see your cards, then `rcaddtosquad [number]` to add them.');
    }

    const squadEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle(`🏏 ${cricket.getTeamName(userId)}`)
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

  else if (command === 'rc11' || command === 'rcxi') {
    cricket.initializeUser(userId, message.author.username);
    const squad = cricket.getSquad(userId);

    if (squad.length === 0) {
      return message.reply('❌ Your squad is empty! Build it with `rcaddtosquad`');
    }

    const elevenEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`${cricket.getTeamName(userId)} Playing XI`)
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

  else if (command === 'rcteamname') {
    cricket.initializeUser(userId, message.author.username);
    const newName = args.slice(1).join(' ').trim();

    if (!newName) {
      return message.reply(`🏏 Your current team name is **${cricket.getTeamName(userId)}**.\nUsage: \`rcteamname [new name]\``);
    }

    if (newName.length > 40) {
      return message.reply('❌ Team name must be 40 characters or fewer.');
    }

    const teamName = cricket.setTeamName(userId, newName);
    message.reply(`✅ Your club is now called **${teamName}**.`);
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

  else if (command === 'rcswap') {
    cricket.initializeUser(userId, message.author.username);
    const squadPos = parseInt(args[1]);
    const cardNum = parseInt(args[2]);
    const squad = cricket.getSquad(userId);
    const cards = cricket.getAllCards(userId);

    if (!squadPos || !cardNum) {
      return message.reply('❌ Usage: `rcswap [squad position] [card number]`\nExample: `rcswap 2 14`');
    }

    if (squadPos < 1 || squadPos > squad.length) {
      return message.reply(`❌ Invalid squad position! (1-${squad.length})`);
    }

    if (cardNum < 1 || cardNum > cards.length) {
      return message.reply(`❌ Invalid card number! (1-${cards.length})`);
    }

    const result = cricket.swapSquadPlayer(userId, squadPos - 1, cards[cardNum - 1].id);
    if (!result.success) {
      return message.reply(`❌ ${result.message}`);
    }

    message.reply(`✅ Swapped **${result.outgoingCard.name}** out for **${result.incomingCard.name}** in your squad.`);
  }

  else if (command === 'rcplay') {
    cricket.initializeUser(userId, message.author.username);
    const format = ['t20', 'odi'].includes((args[1] || '').toLowerCase()) ? args[1].toLowerCase() : 't20';
    const result = cricket.createMatch(userId, format);
    if (!result.success) {
      return message.reply(`❌ ${result.message}`);
    }
    return message.reply(buildSoloMatchPayload(result.match, '🏏 Cricket Guru Match'));

    const match = result.match;
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
    const activeMatch = cricket.getCurrentMatch(userId);
    if (activeMatch) {
      if (activeMatch.status === 'completed') {
        return message.reply(buildSoloScorecardPayload(activeMatch));
      }
      const activeInnings = activeMatch.innings[activeMatch.currentInnings];
      if (activeMatch.status === 'toss') {
        return message.reply('❌ Toss is pending. Use the toss buttons or `rctoss bat|bowl`.');
      }
      if (activeInnings.battingSide !== 'user') {
        return message.reply('❌ You are bowling this innings. Use the bowling buttons or `rcbowl [type]`.');
      }

      const action = command === 'rcbat' ? 'hit' : 'defend';
      const soloResult = cricket.playBall(activeMatch.matchId, action);
      if (!soloResult || !soloResult.success) {
        return message.reply(`❌ ${soloResult?.message || 'This match is no longer active. Start a new one with `rcplay`.'}`);
      }

      return message.reply(buildSoloBallPayload(soloResult));
    }

    const user = cricket.getProfile(userId);
    const matchId = user.currentMatch;

    if (!matchId || !cricket.cricketData.matches[matchId]) {
      return message.reply('❌ No active match! Start one with `rcplay`');
    }

    if (cricket.cricketData.matches[matchId].status !== 'ongoing') {
      user.currentMatch = null;
      cricket.saveData();
      return message.reply('❌ Your previous match has already ended. Start a new one with `rcplay`.');
    }

    const action = command === 'rcbat' ? 'hit' : 'defend';
    const result = cricket.playBall(matchId, action);
    if (!result) {
      user.currentMatch = null;
      cricket.saveData();
      return message.reply('❌ This match is no longer active. Start a new one with `rcplay`.');
    }
    const match = result.match;

    if (match.status === 'completed') {
      user.currentMatch = null;
      cricket.saveData();
    }

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
    const activeMatch = cricket.getCurrentMatch(userId);
    if (activeMatch) {
      return message.reply(buildSoloMatchPayload(activeMatch, '📋 Match Status'));
    }

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

  else if (command === 'rcscorecard') {
    cricket.initializeUser(userId, message.author.username);
    const activeMatch = cricket.getCurrentMatch(userId);

    if (!activeMatch) {
      return message.reply('❌ No active match!');
    }

    return message.reply(buildSoloScorecardPayload(activeMatch));
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

  else if (command === 'rcrelease') {
    cricket.initializeUser(userId, message.author.username);
    const cardNum = parseInt(args[1]);
    const cards = cricket.getAllCards(userId);

    if (!cardNum) {
      return message.reply('❌ Usage: `rcrelease [card number]`\nUse `rclist` to see your card numbers.');
    }

    if (cardNum < 1 || cardNum > cards.length) {
      return message.reply(`❌ Invalid card number! (1-${cards.length})`);
    }

    const result = cricket.releaseCard(userId, cards[cardNum - 1].id);
    if (!result.success) {
      return message.reply(`❌ ${result.message}`);
    }

    message.reply(`💸 Released **${result.card.name}** for **${result.coins}** coins.`);
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

  // ── 1v1 DUEL COMMANDS ──────────────────────────────────────────

  else if (command === 'rcchallenge') {
    cricket.initializeUser(userId, message.author.username);

    const mentioned = message.mentions.users.first();
    if (!mentioned) return message.reply('❌ Usage: `rcchallenge @user [t20/odi]`');
    if (mentioned.id === userId) return message.reply('❌ You cannot challenge yourself!');
    if (mentioned.bot) return message.reply('❌ You cannot challenge a bot!');

    const format = (args[2] || 't20').toLowerCase();
    if (!['t20', 'odi'].includes(format)) return message.reply('❌ Format must be `t20` or `odi`.');

    // Check squad requirements
    const squad = cricket.getSquad(userId);
    const batters = squad.filter(p => p.position === 'Batsman' || p.position === 'All-rounder');
    const bowlers = squad.filter(p => p.position === 'Bowler' || p.position === 'All-rounder');
    if (batters.length === 0) return message.reply('❌ You need at least 1 batter/all-rounder in your squad! Use `rcaddtosquad`.');
    if (bowlers.length === 0) return message.reply('❌ You need at least 1 bowler/all-rounder in your squad! Use `rcaddtosquad`.');

    // Check if either player is already in a duel
    if (cricket.getUserActiveDuel(userId)) return message.reply('❌ You are already in an active match! Use `rcduelstatus`.');
    if (cricket.getUserActiveDuel(mentioned.id)) return message.reply(`❌ ${mentioned.username} is already in an active match!`);

    cricket.createChallenge(userId, message.author.username, mentioned.id, format);

    const challengeEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('⚔️ Cricket Challenge!')
      .setDescription(`${mentioned}, you have been challenged to a **${format.toUpperCase()}** match by **${message.author.username}**!`)
      .addFields(
        { name: 'Format', value: format.toUpperCase(), inline: true },
        { name: 'Overs', value: format === 'odi' ? '50' : '20', inline: true },
        { name: 'How to respond', value: '`rcaccept` to accept\n`rcdecline` to decline' },
        { name: 'Expires', value: 'In 2 minutes' }
      );
    message.reply({ embeds: [challengeEmbed] });
  }

  else if (command === 'rcaccept') {
    cricket.initializeUser(userId, message.author.username);

    const challenge = cricket.getChallenge(userId);
    if (!challenge) return message.reply('❌ No pending challenge for you! Ask someone to `rcchallenge` you.');

    // Check squad requirements for acceptor
    const squad = cricket.getSquad(userId);
    const batters = squad.filter(p => p.position === 'Batsman' || p.position === 'All-rounder');
    const bowlers = squad.filter(p => p.position === 'Bowler' || p.position === 'All-rounder');
    if (batters.length === 0) return message.reply('❌ You need at least 1 batter/all-rounder in your squad before accepting!');
    if (bowlers.length === 0) return message.reply('❌ You need at least 1 bowler/all-rounder in your squad before accepting!');

    cricket.initializeUser(challenge.challengerId, challenge.challengerName);
    cricket.removeChallenge(userId);

    const duel = cricket.createDuel(
      challenge.challengerId, challenge.challengerName,
      userId, message.author.username,
      challenge.format
    );

    duel.channelId = message.channelId;
    cricket.saveData();

    const tossWinnerName = duel.players[duel.tossWinner].username;
    const tossEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('🏏 Match Accepted! Coin Toss')
      .addFields(
        { name: 'Match', value: `${challenge.challengerName} vs ${message.author.username}` },
        { name: 'Format', value: `${challenge.format.toUpperCase()} (${duel.overs} overs)` },
        { name: '🪙 Toss Result', value: `**${tossWinnerName}** won the toss!` },
        { name: 'Next Step', value: `${tossWinnerName}, use \`rctoss bat\` or \`rctoss bowl\`` }
      );
    message.reply({ embeds: [tossEmbed] });
  }

  else if (command === 'rcdecline') {
    const challenge = cricket.getChallenge(userId);
    if (!challenge) return message.reply('❌ No pending challenge to decline.');
    cricket.removeChallenge(userId);
    message.reply(`❌ Challenge from **${challenge.challengerName}** declined.`);
  }

  else if (command === 'rctoss') {
    cricket.initializeUser(userId, message.author.username);
    const soloMatch = cricket.getCurrentMatch(userId);
    if (soloMatch && soloMatch.status === 'toss') {
      const choice = (args[1] || '').toLowerCase();
      if (soloMatch.tossWinner !== 'user') {
        return message.reply(`❌ ${soloMatch.aiTeamName} won the toss, so you cannot choose here.`);
      }
      if (!['bat', 'bowl'].includes(choice)) {
        return message.reply('❌ Choose `rctoss bat` or `rctoss bowl`.');
      }

      const result = cricket.setSoloTossChoice(soloMatch.matchId, choice);
      if (!result.success) {
        return message.reply(`❌ ${result.message}`);
      }

      return message.reply(buildSoloMatchPayload(result.match, 'Toss Complete'));
    }

    const duel = cricket.getUserActiveDuel(userId);
    if (!duel) return message.reply('❌ No active match! Start one with `rcchallenge @user`.');
    if (duel.status !== 'toss') return message.reply('❌ Toss already done.');
    if (duel.tossWinner !== userId) {
      return message.reply(`❌ You didn't win the toss! Wait for **${duel.players[duel.tossWinner].username}** to choose.`);
    }

    const choice = (args[1] || '').toLowerCase();
    if (!['bat', 'bowl'].includes(choice)) return message.reply('❌ Choose `rctoss bat` or `rctoss bowl`.');

    const updated = cricket.setTossChoice(duel.duelId, choice);
    const battingUser = updated.players[updated.battingTeam].username;
    const bowlingUser = updated.players[updated.bowlingTeam].username;

    const selectEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('🏏 Innings 1 — Player Selection')
      .addFields(
        { name: '🏏 Batting', value: battingUser },
        { name: '🎳 Bowling', value: bowlingUser },
        { name: `${battingUser}`, value: 'Use `rcsetbatter [squad number]` to pick your batter' },
        { name: `${bowlingUser}`, value: 'Use `rcsetbowler [squad number]` to pick your bowler' }
      );
    message.reply({ embeds: [selectEmbed] });
  }

  else if (command === 'rcsetbatter') {
    cricket.initializeUser(userId, message.author.username);
    const duel = cricket.getUserActiveDuel(userId);
    if (!duel) return message.reply('❌ No active match!');
    if (duel.battingTeam !== userId) return message.reply('❌ You are not batting right now.');

    const num = parseInt(args[1]);
    const squad = cricket.getSquad(userId);
    const batters = squad.filter(p => p.position === 'Batsman' || p.position === 'All-rounder');

    if (!num || num < 1 || num > batters.length) {
      let list = `**Your Batters/All-rounders:**\n`;
      batters.forEach((p, i) => { list += `${i + 1}. **${p.name}** (${p.country}) | ⭐ ${p.rating}\n`; });
      return message.reply(list + '\nUsage: `rcsetbatter [number]`');
    }

    const result = cricket.setActiveBatter(duel.duelId, userId, batters[num - 1].id);
    if (!result.success) return message.reply(`❌ ${result.message}`);

    message.reply(`✅ **${result.card.name}** (⭐ ${result.card.rating}) is now your active batter!${duel.currentBowler ? '\n\n⚡ Both players ready — match is LIVE! Use `rcshot [aggressive/defensive/loft/sweep]`' : '\nWaiting for bowler to be set...'}`);
  }

  else if (command === 'rcsetbowler') {
    cricket.initializeUser(userId, message.author.username);
    const duel = cricket.getUserActiveDuel(userId);
    if (!duel) return message.reply('❌ No active match!');
    if (duel.bowlingTeam !== userId) return message.reply('❌ You are not bowling right now.');

    const num = parseInt(args[1]);
    const squad = cricket.getSquad(userId);
    const bowlers = squad.filter(p => p.position === 'Bowler' || p.position === 'All-rounder');

    if (!num || num < 1 || num > bowlers.length) {
      let list = `**Your Bowlers/All-rounders:**\n`;
      bowlers.forEach((p, i) => { list += `${i + 1}. **${p.name}** (${p.country}) | ⭐ ${p.rating}\n`; });
      return message.reply(list + '\nUsage: `rcsetbowler [number]`');
    }

    const result = cricket.setActiveBowler(duel.duelId, userId, bowlers[num - 1].id);
    if (!result.success) return message.reply(`❌ ${result.message}`);

    message.reply(`✅ **${result.card.name}** (⭐ ${result.card.rating}) is now your active bowler!${duel.currentBatter ? '\n\n⚡ Both players ready — match is LIVE! Use `rcbowl [fast/spin/yorker/bouncer]`' : '\nWaiting for batter to be set...'}`);
  }

  else if (command === 'rcshot') {
    cricket.initializeUser(userId, message.author.username);
    const duel = cricket.getUserActiveDuel(userId);
    if (!duel) return message.reply('❌ No active match!');

    const shot = (args[1] || '').toLowerCase();
    const result = cricket.submitShot(duel.duelId, userId, shot);

    if (!result.success) return message.reply(`❌ ${result.message}`);

    if (result.waiting) {
      return message.reply(`🏏 Shot locked in: **${shot}**! Waiting for bowler's delivery...`);
    }

    // Ball resolved
    await handleBallResult(message, result, duel.duelId);
  }

  else if (command === 'rcbowl') {
    cricket.initializeUser(userId, message.author.username);
    const soloMatch = cricket.getCurrentMatch(userId);
    if (soloMatch && soloMatch.status === 'live') {
      const soloInnings = soloMatch.innings[soloMatch.currentInnings];
      if (soloInnings.battingSide !== 'ai') {
        return message.reply('❌ You are batting this innings. Use the batting buttons or `rcbat` / `rcdefend`.');
      }

      const delivery = (args[1] || '').toLowerCase();
      const result = cricket.playBall(soloMatch.matchId, delivery);
      if (!result || !result.success) {
        return message.reply(`❌ ${result?.message || 'This match is no longer active. Start a new one with `rcplay`.'}`);
      }

      return message.reply(buildSoloBallPayload(result));
    }
    if (soloMatch && soloMatch.status === 'completed') {
      return message.reply(buildSoloScorecardPayload(soloMatch));
    }

    const duel = cricket.getUserActiveDuel(userId);
    if (!duel) return message.reply('❌ No active match!');

    const delivery = (args[1] || '').toLowerCase();
    const result = cricket.submitDelivery(duel.duelId, userId, delivery);

    if (!result.success) return message.reply(`❌ ${result.message}`);

    if (result.waiting) {
      return message.reply(`🎳 Delivery locked in: **${delivery}**! Waiting for batter's shot...`);
    }

    // Ball resolved
    await handleBallResult(message, result, duel.duelId);
  }

  else if (command === 'rcduelstatus') {
    cricket.initializeUser(userId, message.author.username);
    const duel = cricket.getUserActiveDuel(userId);
    if (!duel) return message.reply('❌ No active 1v1 match!');

    const p1 = duel.teamA ? duel.players[duel.teamA] : duel.players[duel.tossWinner];
    const p2 = duel.teamB ? duel.players[duel.teamB] : duel.players[duel.tossLoser];
    const battingName = duel.battingTeam ? duel.players[duel.battingTeam].username : 'TBD';
    const bowlingName = duel.bowlingTeam ? duel.players[duel.bowlingTeam].username : 'TBD';

    const statusEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('📋 1v1 Match Status')
      .addFields(
        { name: 'Match', value: `${p1.username} vs ${p2.username}`, inline: false },
        { name: 'Format', value: `${duel.format.toUpperCase()} (${duel.overs} overs)`, inline: true },
        { name: 'Status', value: duel.status.charAt(0).toUpperCase() + duel.status.slice(1), inline: true },
        { name: `Innings 1 — ${p1.username}`, value: cricket.formatScore(duel, 1), inline: true },
        { name: `Innings 2 — ${p2.username}`, value: duel.innings === 2 ? cricket.formatScore(duel, 2) : 'Not started', inline: true },
        { name: '🏏 Batting', value: `${battingName}${duel.currentBatter ? ` — ${duel.currentBatter.name} (⭐${duel.currentBatter.rating})` : ' — not set'}`, inline: false },
        { name: '🎳 Bowling', value: `${bowlingName}${duel.currentBowler ? ` — ${duel.currentBowler.name} (⭐${duel.currentBowler.rating})` : ' — not set'}`, inline: false },
      );

    if (duel.status === 'completed') {
      const winnerName = duel.winner === 'tie' ? 'Tie!' : duel.players[duel.winner].username;
      statusEmbed.addFields({ name: '🏆 Result', value: duel.winner === 'tie' ? "It's a tie!" : `**${winnerName}** won!` });
    }

    message.reply({ embeds: [statusEmbed] });
  }

  // ── END 1v1 DUEL COMMANDS ──────────────────────────────────────

  else if (command === 'rcinfo') {
    const infoEmbed = new EmbedBuilder()
      .setColor('#1f8b4c')
      .setTitle('🏏 Cricket Guru Bot')
      .setDescription('Your ultimate cricket gaming bot!')
      .addFields(
        { name: 'Features', value: '🎮 Match Simulation\n🎴 Cricket Cards\n📊 Player Stats\n🏆 Leaderboards' },
        { name: 'Version', value: '1.5.0' }
      );
    message.reply({ embeds: [infoEmbed] });
  }

  else if (command === 'rccricket') {
    message.reply('🏏 Cricket Guru bot is ready! Use `rchelp` for commands.');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [scope, action, value] = interaction.customId.split(':');
  if (scope !== 'solo') return;

  cricket.initializeUser(interaction.user.id, interaction.user.username);
  const match = cricket.getCurrentMatch(interaction.user.id);
  if (!match) {
    return interaction.reply({ content: 'No active solo match found. Start one with `rcplay`.', ephemeral: true });
  }

  if (action === 'scorecard') {
    return interaction.update(buildSoloScorecardPayload(match));
  }

  if (action === 'toss') {
    if (match.status !== 'toss') {
      return interaction.reply({ content: 'The toss is already complete.', ephemeral: true });
    }
    if (match.tossWinner !== 'user') {
      return interaction.reply({ content: 'You did not win this toss.', ephemeral: true });
    }

    const tossResult = cricket.setSoloTossChoice(match.matchId, value);
    if (!tossResult.success) {
      return interaction.reply({ content: tossResult.message, ephemeral: true });
    }

    return interaction.update(buildSoloMatchPayload(tossResult.match, 'Toss Complete'));
  }

  if (action === 'bat') {
    const innings = match.innings[match.currentInnings];
    if (match.status !== 'live' || innings.battingSide !== 'user') {
      return interaction.reply({ content: 'You are not batting right now.', ephemeral: true });
    }

    const ballResult = cricket.playBall(match.matchId, value);
    if (!ballResult || !ballResult.success) {
      return interaction.reply({ content: ballResult?.message || 'Unable to play that ball.', ephemeral: true });
    }

    return interaction.update(buildSoloBallPayload(ballResult));
  }

  if (action === 'bowl') {
    const innings = match.innings[match.currentInnings];
    if (match.status !== 'live' || innings.battingSide !== 'ai') {
      return interaction.reply({ content: 'You are not bowling right now.', ephemeral: true });
    }

    const ballResult = cricket.playBall(match.matchId, value);
    if (!ballResult || !ballResult.success) {
      return interaction.reply({ content: ballResult?.message || 'Unable to bowl that ball.', ephemeral: true });
    }

    return interaction.update(buildSoloBallPayload(ballResult));
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

