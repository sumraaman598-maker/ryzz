const http = require('http');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
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

// Helper: render ball result embed and handle innings switch / match end — LEGACY (solo only, kept for reference)
// Solo match uses buildSoloBallPayload instead

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
        { name: 'rcdebut', value: 'Start your journey — get 11 players (4 bat, 2 AR, 3 bowl, 1 WK + 1 star) + 1000 coins' },
        { name: 'rcclaim', value: 'Claim a free bronze/silver player (1-hour cooldown)' },
        { name: 'rcdrop', value: 'Get a random player drop every hour — retain or release for coins' },
        { name: 'rcdaily', value: 'Get 1500 coins + a bonus bronze card (24-hour cooldown)' },
        { name: 'rcpurse', value: 'Check your coin balance and squad value' },
        { name: 'rcaddcard [name]', value: 'Sign a player — cost based on rating (100–5000 coins)' },
        { name: 'rcrelease [num]', value: 'Release a card for 40% of market value' },
        { name: 'rcwheel', value: 'Spin the wheel for coins or a player (200 coins)' },
        { name: 'rcsearch [name/country/role]', value: 'Search the global player pool (218 players)' },
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
        { name: 'rcchallenge @user [t20/odi]', value: 'Challenge another player — buttons handle everything from there' },
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
        { name: '5. Compete', value: '`rcplay` for solo matches or `rcchallenge @user [t20/odi]` for live duels.' },
        { name: '6. Shot System', value: '**Strengths:** Cover Drive→Full | Square Drive→Yorker | Pull→Short | Straight Drive→Good\n**Lofted** = 6 or out | **Spin** = extra wicket on neutral' }
      );
    message.reply({ embeds: [guideEmbed] });
  }

  else if (command === 'rcdebut') {
    cricket.initializeUser(userId, message.author.username);
    const result = cricket.doDebut(userId);

    if (!result.success) {
      return message.reply(`❌ ${result.message}`);
    }

    const star = result.starSigning;
    let playerList = `🎉 **Debut Successful! Welcome to Cricket Guru!**\n\n`;
    playerList += `**Your Starting XI:**\n`;
    result.players.forEach((player, i) => {
      const isStar = star && player.name === star.name;
      const tierEmoji = { elite: '🌟', gold: '🥇', silver: '🥈', bronze: '🥉' }[player.tier] || '⭐';
      playerList += `${i + 1}. ${tierEmoji} **${player.name}** (${player.country}) | ${player.position} | ⭐ ${player.rating}${isStar ? ' ← ⚡ STAR SIGNING!' : ''}\n`;
    });
    playerList += `\n💰 **Debut Bonus:** +1000 Coins\n`;
    playerList += `\n✅ All 11 players auto-added to your squad! Use \`rcplay\` to start a match.`;

    if (playerList.length > 1900) {
      const chunks = playerList.match(/[\s\S]{1,1900}/g);
      for (const chunk of chunks) await message.reply(chunk);
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
        { name: 'Coins', value: `+${result.coins} 🪙`, inline: true },
        { name: 'Bonus Card', value: result.bonusPlayer ? `🥉 **${result.bonusPlayer.name}** (${result.bonusPlayer.country}) ⭐${result.bonusPlayer.rating}` : 'None today', inline: true }
      )
      .setFooter({ text: 'Next daily reward available in 24 hours' });

    message.reply({ embeds: [dailyEmbed] });
  }

  else if (command === 'rcpurse') {
    cricket.initializeUser(userId, message.author.username);
    const user = cricket.getProfile(userId);
    const squad = cricket.getSquad(userId);
    const squadValue = squad.reduce((sum, c) => sum + cricket.getPlayerValue(c), 0);
    const collectionValue = user.cards.reduce((sum, c) => sum + cricket.getPlayerValue(c), 0);
    const purseEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('Club Purse')
      .addFields(
        { name: 'Team', value: cricket.getTeamName(userId), inline: false },
        { name: 'Coins', value: String(user.stats.coins), inline: true },
        { name: 'Cards', value: String(user.cards.length), inline: true },
        { name: 'Squad', value: `/11`, inline: true },
        { name: 'Squad Value', value: ` coins`, inline: true },
        { name: 'Collection Value', value: ` coins`, inline: true },
        { name: 'Earn More', value: '`rcdaily` +1500 coins | `rcclaim` free player | `rcwheel` spin | win matches' }
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
    const playerName = args.slice(1).join(' ');

    if (!playerName) {
      return message.reply('❌ Usage: `rcaddcard [Player Name]`\nExample: `rcaddcard Virat Kohli`\nUse `rcallplayers` or `rcsearch` to find players!');
    }

    const playerData = cricket.getPlayerByName(playerName);
    if (!playerData) {
      return message.reply(`❌ Player "${playerName}" not found! Use \`rcsearch ${playerName}\` to search.`);
    }

    const cost = cricket.getCardCost(playerData.rating);
    if (user.stats.coins < cost) {
      return message.reply(`❌ Need **${cost} coins** to sign **${playerData.name}** (⭐${playerData.rating}). You have **${user.stats.coins}** coins.`);
    }

    const card = cricket.addCard(userId, playerName);
    if (!card || card.error) {
      return message.reply(`❌ Could not sign player. You have ${user.stats.coins} coins.`);
    }

    const tierEmoji = { elite: '🌟', gold: '🥇', silver: '🥈', bronze: '🥉' }[card.tier] || '⭐';
    message.reply(`${tierEmoji} **Signed!** **${card.name}** (${card.country})\n${card.position} | ${card.role} | ⭐ ${card.rating}\n💰 Cost: **${cost} coins** | Balance: **${user.stats.coins} coins**`);
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
    const playersByCountry = {};
    allPlayers.forEach(player => {
      if (!playersByCountry[player.country]) playersByCountry[player.country] = [];
      playersByCountry[player.country].push(player);
    });

    const tierEmojis = { elite: '🌟', gold: '🥇', silver: '🥈', bronze: '🥉' };
    let playerList = `🏏 **All Cricket Players (${allPlayers.length} total)**\n\n`;
    Object.keys(playersByCountry).sort().forEach(country => {
      playerList += `**${country}**\n`;
      playersByCountry[country].sort((a,b) => b.rating - a.rating).forEach(player => {
        const te = tierEmojis[player.tier] || '⭐';
        playerList += `${te} ${player.name} | ${player.position} | ⭐${player.rating} | 💰${cricket.getCardCost(player.rating)}\n`;
      });
      playerList += '\n';
    });

    if (playerList.length > 1900) {
      const chunks = playerList.match(/[\s\S]{1,1900}/g);
      for (const chunk of chunks) message.reply(chunk);
    } else {
      message.reply(playerList);
    }
  }

  else if (command === 'rcdrop') {
    cricket.initializeUser(userId, message.author.username);
    const result = cricket.createDrop(userId);

    if (!result.success) return message.reply(`⏱️ ${result.message}`);

    const card = result.card;
    const tierEmoji = { elite: '🌟', gold: '🥇', silver: '🥈', bronze: '🥉' }[card.tier] || '⭐';
    const releaseCoins = Math.round(cricket.playerValue(card) * 0.3);

    const dropEmbed = new EmbedBuilder()
      .setColor('#4a90d9')
      .setTitle('🎴 Player Drop!')
      .setDescription(`A player has dropped for you! You have **5 minutes** to decide.`)
      .addFields(
        { name: `${tierEmoji} ${card.name}`, value: `${card.country} | ${card.position} | ⭐ ${card.rating}` },
        { name: 'Retain', value: 'Add to your collection for free', inline: true },
        { name: 'Release', value: `Get **${releaseCoins} coins** instead`, inline: true },
      )
      .setFooter({ text: 'Drops available every hour' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`drop:retain:${userId}`).setLabel('✅ Retain').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`drop:release:${userId}`).setLabel('💰 Release').setStyle(ButtonStyle.Secondary),
    );

    message.reply({ embeds: [dropEmbed], components: [row] });
  }

  else if (command === 'rcwheel' || command === 'rcslots') {
    cricket.initializeUser(userId, message.author.username);
    const result = cricket.spinWheel(userId);

    if (!result.success) return message.reply(`❌ ${result.message}`);

    const wheelEmbed = new EmbedBuilder().setTitle('🎰 Spin Wheel!');

    if (result.type === 'coins') {
      wheelEmbed.setColor('#FFD700')
        .setDescription(`🎉 **You won ${result.amount} coins!**`)
        .addFields({ name: 'Winnings', value: `+${result.amount} 🪙`, inline: true });
    } else if (result.type === 'player') {
      const te = { elite: '🌟', gold: '🥇', silver: '🥈', bronze: '🥉' }[result.player.tier] || '⭐';
      wheelEmbed.setColor('#1f8b4c')
        .setDescription(`${te} **You won a player card!**`)
        .addFields(
          { name: 'Player', value: `**${result.player.name}** (${result.player.country})`, inline: true },
          { name: 'Rating', value: `⭐ ${result.player.rating}`, inline: true }
        );
    } else {
      wheelEmbed.setColor('#888888').setDescription('😔 Better luck next time! No prize this spin.');
    }

    wheelEmbed.setFooter({ text: 'Cost: 200 coins per spin' });
    message.reply({ embeds: [wheelEmbed] });
  }

  // ── 1v1 DUEL COMMANDS ──────────────────────────────────────────

  else if (command === 'rcchallenge') {
    cricket.initializeUser(userId, message.author.username);
    const mentioned = message.mentions.users.first();
    if (!mentioned) return message.reply('❌ Usage: `rcchallenge @user [t20/odi]`');
    if (mentioned.id === userId) return message.reply('❌ You cannot challenge yourself!');
    if (mentioned.bot) return message.reply('❌ You cannot challenge a bot!');

    const format = (['t20','odi'].includes((args[2]||'').toLowerCase())) ? args[2].toLowerCase() : 't20';

    const squad = cricket.getSquad(userId);
    if (!squad.some(p => p.position === 'Batsman' || p.position === 'All-rounder'))
      return message.reply('❌ You need at least 1 batter/all-rounder in your squad!');
    if (!squad.some(p => p.position === 'Bowler' || p.position === 'All-rounder'))
      return message.reply('❌ You need at least 1 bowler/all-rounder in your squad!');
    if (cricket.getUserActiveDuel(userId)) return message.reply('❌ You are already in an active match! Use `rcend` to forfeit it first.');
    if (cricket.getUserActiveDuel(mentioned.id)) return message.reply(`❌ ${mentioned.username} is already in an active match!`);

    cricket.createChallenge(userId, message.author.username, mentioned.id, format);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`duel:accept:${userId}`).setLabel('✅ Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`duel:decline:${userId}`).setLabel('❌ Decline').setStyle(ButtonStyle.Danger)
    );

    const lobbyEmbed = buildMatchLobbyEmbed(message.author.username, mentioned.username, format);
    lobbyEmbed.setDescription(`${mentioned}, **${message.author.username}** challenges you to a **${format.toUpperCase()}** match!\nPress ✅ to accept or ❌ to decline.`);
    message.reply({ embeds: [lobbyEmbed], components: [row] });
  }

  // ── END 1v1 DUEL COMMANDS ──────────────────────────────────────

  else if (command === 'rcend') {
    cricket.initializeUser(userId, message.author.username);

    // Check 1v1 duel first
    const activeDuel = cricket.getUserActiveDuel(userId);
    if (activeDuel) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`end:duel:${userId}`).setLabel('Yes, forfeit match').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`end:cancel:${userId}`).setLabel('No, keep playing').setStyle(ButtonStyle.Secondary),
      );
      return message.reply({
        content: `⚠️ Are you sure you want to **forfeit** your 1v1 match? Your opponent will win and you'll lose coins.`,
        components: [row],
      });
    }

    // Check solo match
    const soloMatch = cricket.getCurrentMatch(userId);
    if (soloMatch && soloMatch.status !== 'completed') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`end:solo:${userId}`).setLabel('Yes, end match').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`end:cancel:${userId}`).setLabel('No, keep playing').setStyle(ButtonStyle.Secondary),
      );
      return message.reply({
        content: `⚠️ Are you sure you want to **end** your solo match?`,
        components: [row],
      });
    }

    message.reply('❌ You have no active match to end.');
  }

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

  // ── COOLDOWNS COMMAND ──────────────────────────────────────────

  else if (command === 'rccooldowns' || command === 'rccd') {
    cricket.initializeUser(userId, message.author.username);
    const user = cricket.getProfile(userId);
    const now = Date.now();

    function timeLeft(lastTime, cooldownMs) {
      if (!lastTime) return 'Ready ✅';
      const diff = cooldownMs - (now - lastTime);
      if (diff <= 0) return 'Ready ✅';
      const mins = Math.floor(diff / 60000);
      const hrs  = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      if (days > 0) return `in ${days}d ${hrs % 24}h`;
      if (hrs > 0)  return `in ${hrs}h ${mins % 60}m`;
      return `in ${mins}m`;
    }

    const cd = user.cooldowns || {};
    const lines = [
      `⏳ **COOLDOWNS**`,
      `Drop    : ${timeLeft(cd.drop,    60 * 60 * 1000)}`,
      `Daily   : ${timeLeft(cd.daily,   24 * 60 * 60 * 1000)}`,
      `Claim   : ${timeLeft(cd.claim,   60 * 60 * 1000)}`,
      `Wheel   : ${timeLeft(cd.wheel,   10 * 60 * 1000)}`,
    ];
    message.reply({ content: '```\n' + lines.join('\n') + '\n```' });
  }

  // ── PENDING MATCH COMMAND ──────────────────────────────────────

  else if (command === 'rcpm') {
    cricket.initializeUser(userId, message.author.username);
    const activeDuel = cricket.getUserActiveDuel(userId);
    if (!activeDuel) return message.reply('❌ You have no active match. Use `rcchallenge @user` to start one.');
    const embed = buildMatchLobbyEmbed(
      activeDuel.players[activeDuel.teamA || Object.keys(activeDuel.players)[0]]?.username || '?',
      activeDuel.players[activeDuel.teamB || Object.keys(activeDuel.players)[1]]?.username || '?',
      activeDuel.format
    );
    embed.addFields({ name: 'Status', value: activeDuel.status, inline: true });
    message.reply({ embeds: [embed] });
  }
});

// ── STADIUMS / UMPIRES / WEATHER ────────────────────────────────────────────

const STADIUMS = [
  { name: 'Narendra Modi Stadium', city: 'Ahmedabad', capacity: '132,000' },
  { name: 'Eden Gardens', city: 'Kolkata', capacity: '66,000' },
  { name: 'Wankhede Stadium', city: 'Mumbai', capacity: '33,108' },
  { name: "Lord's Cricket Ground", city: 'London', capacity: '30,000' },
  { name: 'MCG', city: 'Melbourne', capacity: '100,024' },
  { name: 'The Oval', city: 'London', capacity: '25,500' },
  { name: 'SCG', city: 'Sydney', capacity: '48,000' },
  { name: 'Headingley', city: 'Leeds', capacity: '20,000' },
  { name: 'Gaddafi Stadium', city: 'Lahore', capacity: '27,000' },
  { name: 'National Stadium', city: 'Karachi', capacity: '34,228' },
];
const UMPIRES = ['Chris Gaffaney', 'Kumar Dharmasena', 'Marais Erasmus', 'Richard Illingworth', 'Rod Tucker', 'Paul Reiffel', 'Nitin Menon', 'Anil Chaudhary'];
const WEATHER_OPTIONS = ['Dry', 'Overcast', 'Humid', 'Windy', 'Partly Cloudy'];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildMatchLobbyEmbed(challengerName, opponentName, format) {
  const stadium = randomFrom(STADIUMS);
  const umpire = randomFrom(UMPIRES);
  const weather = randomFrom(WEATHER_OPTIONS);
  const temp = Math.floor(Math.random() * 18) + 25; // 25-42°C
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('🏏 Match Lobby')
    .addFields(
      { name: 'Match', value: `**${challengerName}** vs **${opponentName || '.........'}**`, inline: false },
      { name: 'Format', value: format.toUpperCase(), inline: true },
      { name: 'Stadium', value: `${stadium.name}, ${stadium.city}`, inline: true },
      { name: 'Capacity', value: stadium.capacity, inline: true },
      { name: 'Weather', value: weather, inline: true },
      { name: 'Temperature', value: `${temp}°C`, inline: true },
      { name: 'Umpire', value: umpire, inline: true },
    );
}

// ── DUEL BUTTON BUILDERS ────────────────────────────────────────

function buildPlayerSelectButtons(duelId, action, players) {
  const options = players.slice(0, 25).map(p => {
    const tierEmoji = { elite: '🌟', gold: '🥇', silver: '🥈', bronze: '🥉' }[p.tier] || '⭐';
    return new StringSelectMenuOptionBuilder()
      .setLabel(`${p.name} (⭐${p.rating})`)
      .setDescription(`${p.country} | ${p.position}`)
      .setEmoji(tierEmoji)
      .setValue(p.id);
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`duel:${action}:${duelId}`)
    .setPlaceholder('Select a player...')
    .addOptions(options);

  return [new ActionRowBuilder().addComponents(menu)];
}

function buildShotButtons(duelId) {
  // Row 1: Drive | Loft | Defend | Sweep
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`duel:shot:${duelId}:drive`).setLabel('Drive').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`duel:shot:${duelId}:loft`).setLabel('Loft').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`duel:shot:${duelId}:defend`).setLabel('Defend').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`duel:shot:${duelId}:sweep`).setLabel('Sweep').setStyle(ButtonStyle.Primary),
  );
  // Row 2: Cut | Leave | Pull | Scoop
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`duel:shot:${duelId}:cut`).setLabel('Cut').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`duel:shot:${duelId}:leave`).setLabel('Leave').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`duel:shot:${duelId}:pull`).setLabel('Pull').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`duel:shot:${duelId}:scoop`).setLabel('Scoop').setStyle(ButtonStyle.Success),
  );
  return [row1, row2];
}

function buildDeliveryButtons(duelId, bowlerCard) {
  const spinBowler = cricket.isSpin(bowlerCard);
  if (spinBowler) {
    // Spin bowler: 6 buttons, 2 rows
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:offspin`).setLabel('Offspin').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:carrom`).setLabel('Carrom').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:arm_ball`).setLabel('Arm Ball').setStyle(ButtonStyle.Success),
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:doosra`).setLabel('Doosra').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:topspin`).setLabel('Topspin').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:mystery`).setLabel('Mystery').setStyle(ButtonStyle.Danger),
    );
    return [row1, row2];
  }
  // Fast bowler: 8 buttons, 2 rows
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:inswing`).setLabel('Inswing').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:outswing`).setLabel('Outswing').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:slow`).setLabel('Slow').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:fast`).setLabel('Fast').setStyle(ButtonStyle.Danger),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:bouncer`).setLabel('Bouncer').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:good`).setLabel('Good').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:full`).setLabel('Full').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:yorker`).setLabel('Yorker').setStyle(ButtonStyle.Danger),
  );
  return [row1, row2];
}

function buildDisabledShotButtons(duelId, chosen) {
  const allShots = [
    ['drive','Drive'], ['loft','Loft'], ['defend','Defend'], ['sweep','Sweep'],
    ['cut','Cut'], ['leave','Leave'], ['pull','Pull'], ['scoop','Scoop'],
  ];
  const rows = [];
  for (let i = 0; i < allShots.length; i += 4) {
    rows.push(new ActionRowBuilder().addComponents(
      allShots.slice(i, i + 4).map(([id, label]) =>
        new ButtonBuilder().setCustomId(`duel:shot:${duelId}:${id}`)
          .setLabel(label)
          .setStyle(id === chosen ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(true)
      )
    ));
  }
  return rows;
}

function buildDisabledDeliveryButtons(duelId, chosen, bowlerCard) {
  const spinBowler = cricket.isSpin(bowlerCard);
  const allDels = spinBowler
    ? [['offspin','Offspin'], ['carrom','Carrom'], ['arm_ball','Arm Ball'], ['doosra','Doosra'], ['topspin','Topspin'], ['mystery','Mystery']]
    : [['inswing','Inswing'], ['outswing','Outswing'], ['slow','Slow'], ['fast','Fast'], ['bouncer','Bouncer'], ['good','Good'], ['full','Full'], ['yorker','Yorker']];
  const chunkSize = spinBowler ? 3 : 4;
  const rows = [];
  for (let i = 0; i < allDels.length; i += chunkSize) {
    rows.push(new ActionRowBuilder().addComponents(
      allDels.slice(i, i + chunkSize).map(([id, label]) =>
        new ButtonBuilder().setCustomId(`duel:delivery:${duelId}:${id}`)
          .setLabel(label)
          .setStyle(id === chosen ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(true)
      )
    ));
  }
  return rows;
}

async function postLiveBallMessage(channel, duel) {
  const batterId = duel.battingTeam;
  const bowlerId = duel.bowlingTeam;
  const bowler   = duel.currentBowler;

  // Build the scorecard embed
  const embed = cricket.buildMatchEmbed(duel, duel.innings);

  // Post/edit the main match message with embed + batter shot buttons
  const batterMsg = await channel.send({
    content: `<@${batterId}> — choose your shot:`,
    embeds: [embed],
    components: buildShotButtons(duel.duelId),
  });

  // Separate message for bowler delivery buttons
  const bowlerMsg = await channel.send({
    content: `<@${batterId}> has chosen. <@${bowlerId}> — choose your delivery:`,
    components: buildDeliveryButtons(duel.duelId, bowler),
  });

  duel.batterMsgId = batterMsg.id;
  duel.bowlerMsgId = bowlerMsg.id;
  cricket.saveData();
}

async function postBallResult(channel, result, duelId) {
  const { shot, delivery, runs, isWicket, commentary, milestones, inn, inningsSwitched, matchOver } = result;
  const fd = cricket.getDuel(duelId);

  // CG-style commentary as plain text above embed
  const { deliveryLine, actionLine } = commentary;
  const commentaryText = `${deliveryLine}\n${actionLine}`;

  // Updated scorecard embed
  const embed = cricket.buildMatchEmbed(fd, fd.innings === 2 && inningsSwitched ? 1 : fd.innings);

  if (matchOver) {
    const winnerName = fd.winner === 'tie' ? null : fd.players[fd.winner].username;
    const resultLine = fd.winner === 'tie' ? "🤝 It's a Tie!" : `🏆 **${winnerName}** wins the match!`;
    await channel.send({
      content: `${commentaryText}\n\n${resultLine}`,
      embeds: [embed],
    });
    // Full scorecard
    const sc1 = cricket.formatDuelScorecard(fd, 1);
    const sc2 = cricket.formatDuelScorecard(fd, 2);
    const chunks = (`**📋 FULL SCORECARD**\n\n${sc1}\n\n${sc2}`).match(/[\s\S]{1,1900}/g) || [];
    for (const chunk of chunks) await channel.send(chunk);

  } else if (inningsSwitched) {
    const target = fd.inningsData[1].runs + 1;
    await channel.send({
      content: `${commentaryText}\n\n🔄 **INNINGS BREAK!** Target: **${target} runs** in ${fd.overs} overs`,
      embeds: [embed],
    });
    const sc1 = cricket.formatDuelScorecard(fd, 1);
    const chunks = (`**📋 Innings 1 Scorecard**\n\n${sc1}`).match(/[\s\S]{1,1900}/g) || [];
    for (const chunk of chunks) await channel.send(chunk);

    const bMsg = await channel.send({ content: `<@${fd.battingTeam}> — **Select your opening batter for Innings 2:**`, components: buildPlayerSelectButtons(fd.duelId, 'selbat', cricket.getDuelEligible(fd.battingTeam, 'bat')) });
    const wMsg = await channel.send({ content: `<@${fd.bowlingTeam}> — **Select your opening bowler for Innings 2:**`, components: buildPlayerSelectButtons(fd.duelId, 'selbowl', cricket.getDuelEligible(fd.bowlingTeam, 'bowl')) });
    fd.batterMsgId = bMsg.id; fd.bowlerMsgId = wMsg.id;
    cricket.saveData();

  } else {
    // Post commentary + updated embed
    await channel.send({
      content: commentaryText,
      embeds: [embed],
    });

    if (isWicket) {
      const eligible = cricket.getDuelEligible(fd.battingTeam, 'bat');
      if (eligible.length > 0) {
        const bMsg = await channel.send({ content: `<@${fd.battingTeam}> — **🏏 Select your next batter:**`, components: buildPlayerSelectButtons(fd.duelId, 'selbat', eligible) });
        fd.batterMsgId = bMsg.id; cricket.saveData();
        return;
      }
    }

    const justCompletedOver = fd.inningsData[fd.innings].balls % 6 === 0 && fd.inningsData[fd.innings].balls > 0;
    if (justCompletedOver) {
      const eligible = cricket.getDuelEligible(fd.bowlingTeam, 'bowl');
      const wMsg = await channel.send({ content: `<@${fd.bowlingTeam}> — **🎳 Select your bowler for the next over:**`, components: buildPlayerSelectButtons(fd.duelId, 'selbowl', eligible) });
      fd.bowlerMsgId = wMsg.id; cricket.saveData();
      return;
    }

    await postLiveBallMessage(channel, fd);
  }
}

// Timeout checker — auto-play if a player goes AFK (runs every 30s)
setInterval(async () => {
  if (!cricket.cricketData.duels) return;
  for (const duel of Object.values(cricket.cricketData.duels)) {
    if (duel.status !== 'live') continue;
    if (!duel.lastBallTime) continue;
    if (Date.now() - duel.lastBallTime < 60000) continue;

    const result = cricket.autoPlayTimeout(duel.duelId);
    if (!result || !result.success) continue;

    if (!duel.channelId) continue;
    const channel = client.channels.cache.get(duel.channelId);
    if (!channel) continue;

    const timedOutId = result.timedOutRole === 'bowler' ? duel.bowlingTeam : duel.battingTeam;
    await channel.send(`⏱️ <@${timedOutId}> took too long — auto-played!`);
    await postBallResult(channel, result, duel.duelId);
  }
}, 30000);

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  const parts = interaction.customId.split(':');
  const scope = parts[0];

  // ── END MATCH BUTTONS ───────────────────────────────────────────────────────
  if (scope === 'end') {
    const action  = parts[1]; // solo | duel | cancel
    const ownerId = parts[2];
    if (interaction.user.id !== ownerId)
      return interaction.reply({ content: '❌ This is not your confirmation.', ephemeral: true });

    cricket.initializeUser(interaction.user.id, interaction.user.username);

    if (action === 'cancel') {
      return interaction.update({ content: '✅ Match continues!', components: [] });
    }

    if (action === 'solo') {
      const result = cricket.endMatch(interaction.user.id);
      if (!result.success) return interaction.update({ content: `❌ ${result.message}`, components: [] });
      return interaction.update({ content: '🏳️ Solo match ended. You can start a new one with `rcplay`.', components: [] });
    }

    if (action === 'duel') {
      const result = cricket.endDuel(interaction.user.id);
      if (!result.success) return interaction.update({ content: `❌ ${result.message}`, components: [] });
      const opponentName = result.duel?.players[result.opponentId]?.username || 'Opponent';
      // Notify channel
      if (result.duel?.channelId) {
        const ch = client.channels.cache.get(result.duel.channelId);
        if (ch) ch.send(`🏳️ **${interaction.user.username}** forfeited the match. **${opponentName}** wins! (+200 🪙)`);
      }
      return interaction.update({ content: `🏳️ You forfeited. **${opponentName}** wins.`, components: [] });
    }
    return;
  }

  // ── DROP BUTTONS ────────────────────────────────────────────────────────────
  if (scope === 'drop') {
    const action  = parts[1];
    const ownerId = parts[2];
    if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ This drop is not yours!', ephemeral: true });
    cricket.initializeUser(interaction.user.id, interaction.user.username);
    if (action === 'retain') {
      const result = cricket.retainDrop(interaction.user.id);
      if (!result.success) return interaction.update({ content: `❌ ${result.message}`, embeds: [], components: [] });
      const te = { elite: '🌟', gold: '🥇', silver: '🥈', bronze: '🥉' }[result.card.tier] || '⭐';
      return interaction.update({ content: `${te} **${result.card.name}** retained and added to your collection!`, embeds: [], components: [] });
    }
    if (action === 'release') {
      const result = cricket.releaseDrop(interaction.user.id);
      if (!result.success) return interaction.update({ content: `❌ ${result.message}`, embeds: [], components: [] });
      return interaction.update({ content: `💰 Released **${result.card.name}** for **${result.coins} coins**!`, embeds: [], components: [] });
    }
    return;
  }

  // ── SOLO MATCH BUTTONS ──────────────────────────────────────
  if (scope === 'solo') {
    const [, action, value] = parts;
    cricket.initializeUser(interaction.user.id, interaction.user.username);
    const match = cricket.getCurrentMatch(interaction.user.id);
    if (!match) return interaction.reply({ content: 'No active solo match. Start one with `rcplay`.', ephemeral: true });

    if (action === 'scorecard') return interaction.update(buildSoloScorecardPayload(match));

    if (action === 'toss') {
      if (match.status !== 'toss') return interaction.reply({ content: 'Toss already done.', ephemeral: true });
      if (match.tossWinner !== 'user') return interaction.reply({ content: 'You did not win the toss.', ephemeral: true });
      const r = cricket.setSoloTossChoice(match.matchId, value);
      if (!r.success) return interaction.reply({ content: r.message, ephemeral: true });
      return interaction.update(buildSoloMatchPayload(r.match, 'Toss Complete'));
    }

    if (action === 'bat') {
      const inn = match.innings[match.currentInnings];
      if (match.status !== 'live' || inn.battingSide !== 'user')
        return interaction.reply({ content: 'You are not batting right now.', ephemeral: true });
      const r = cricket.playBall(match.matchId, value);
      if (!r || !r.success) return interaction.reply({ content: r?.message || 'Error.', ephemeral: true });
      return interaction.update(buildSoloBallPayload(r));
    }

    if (action === 'bowl') {
      const inn = match.innings[match.currentInnings];
      if (match.status !== 'live' || inn.battingSide !== 'ai')
        return interaction.reply({ content: 'You are not bowling right now.', ephemeral: true });
      const r = cricket.playBall(match.matchId, value);
      if (!r || !r.success) return interaction.reply({ content: r?.message || 'Error.', ephemeral: true });
      return interaction.update(buildSoloBallPayload(r));
    }
    return;
  }

  // ── 1v1 DUEL BUTTONS ────────────────────────────────────────
  if (scope === 'duel') {
    const action = parts[1];
    const extra  = parts[2]; // challengerId or duelId depending on action
    const userId = interaction.user.id;
    cricket.initializeUser(userId, interaction.user.username);

    // ── Accept / Decline challenge ──
    if (action === 'accept') {
      const challengerId = extra;
      const challenge = cricket.getChallenge(userId);
      if (!challenge || challenge.challengerId !== challengerId)
        return interaction.reply({ content: '❌ This challenge is no longer valid.', ephemeral: true });
      if (userId === challengerId)
        return interaction.reply({ content: '❌ You cannot accept your own challenge.', ephemeral: true });

      const squad = cricket.getSquad(userId);
      if (!squad.some(p => p.position === 'Batsman' || p.position === 'All-rounder'))
        return interaction.reply({ content: '❌ You need at least 1 batter/all-rounder in your squad!', ephemeral: true });
      if (!squad.some(p => p.position === 'Bowler' || p.position === 'All-rounder'))
        return interaction.reply({ content: '❌ You need at least 1 bowler/all-rounder in your squad!', ephemeral: true });
      if (cricket.getUserActiveDuel(userId))
        return interaction.reply({ content: '❌ You are already in an active match!', ephemeral: true });

      cricket.initializeUser(challenge.challengerId, challenge.challengerName);
      cricket.removeChallenge(userId);
      const duel = cricket.createDuel(challenge.challengerId, challenge.challengerName, userId, interaction.user.username, challenge.format);
      duel.channelId = interaction.channelId;
      cricket.saveData();

      const tossWinnerName = duel.players[duel.tossWinner].username;
      const tossLoserId = duel.tossLoser;
      const tossWinnerId = duel.tossWinner;

      const tossRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`duel:toss:${duel.duelId}:bat`).setLabel('🏏 Bat First').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`duel:toss:${duel.duelId}:bowl`).setLabel('🎳 Bowl First').setStyle(ButtonStyle.Secondary)
      );

      const tossEmbed = new EmbedBuilder()
        .setColor('#1f8b4c')
        .setTitle('🪙 Coin Toss!')
        .addFields(
          { name: 'Match', value: `${challenge.challengerName} vs ${interaction.user.username}` },
          { name: 'Format', value: `${challenge.format.toUpperCase()} (${duel.overs} overs)` },
          { name: 'Toss Winner', value: `🎉 **${tossWinnerName}** won the toss!` },
          { name: 'Next', value: `<@${tossWinnerId}>, choose to bat or bowl first.` }
        );

      await interaction.update({ embeds: [tossEmbed], components: [tossRow] });
      return;
    }

    if (action === 'decline') {
      const challengerId = extra;
      const challenge = cricket.getChallenge(userId);
      if (!challenge || challenge.challengerId !== challengerId)
        return interaction.reply({ content: '❌ Challenge already expired.', ephemeral: true });
      cricket.removeChallenge(userId);
      const declineEmbed = new EmbedBuilder().setColor('#dc143c').setTitle('❌ Challenge Declined')
        .setDescription(`**${interaction.user.username}** declined the challenge.`);
      return interaction.update({ embeds: [declineEmbed], components: [] });
    }

    // ── Toss choice ──
    if (action === 'toss') {
      const duelId = extra;
      const choice = parts[3]; // bat or bowl
      const duel = cricket.getDuel(duelId);
      if (!duel) return interaction.reply({ content: '❌ Match not found.', ephemeral: true });
      if (duel.tossWinner !== userId) return interaction.reply({ content: '❌ You did not win the toss!', ephemeral: true });
      if (duel.status !== 'toss') return interaction.reply({ content: '❌ Toss already done.', ephemeral: true });

      cricket.setTossChoice(duelId, choice);
      const batterId = duel.battingTeam;
      const bowlerId = duel.bowlingTeam;
      const batterName = duel.players[batterId].username;
      const bowlerName = duel.players[bowlerId].username;

      // Build batter selection buttons (up to 5 per row)
      const batterEligible = cricket.getDuelEligible(batterId, 'bat');
      const bowlerEligible = cricket.getDuelEligible(bowlerId, 'bowl');

      const batterRows = buildPlayerSelectButtons(duelId, 'selbat', batterEligible);
      const bowlerRows = buildPlayerSelectButtons(duelId, 'selbowl', bowlerEligible);

      const selEmbed = new EmbedBuilder()
        .setColor('#1f8b4c')
        .setTitle('🏏 Player Selection')
        .addFields(
          { name: '🏏 Batting', value: `<@${batterId}> — pick your opening batter below` },
          { name: '🎳 Bowling', value: `<@${bowlerId}> — pick your opening bowler below` },
          { name: 'Innings 1 Target', value: `${duel.overs} overs` }
        );

      // Send two separate ephemeral-style messages for each player, but post publicly
      await interaction.update({ embeds: [selEmbed], components: [] });

      // Post batter selection for batting team
      const batterMsg = await interaction.channel.send({
        content: `<@${batterId}> — **Select your batter:**`,
        components: batterRows
      });
      // Post bowler selection for bowling team
      const bowlerMsg = await interaction.channel.send({
        content: `<@${bowlerId}> — **Select your bowler:**`,
        components: bowlerRows
      });

      duel.batterMsgId = batterMsg.id;
      duel.bowlerMsgId = bowlerMsg.id;
      cricket.saveData();
      return;
    }

    // ── Batter selection (dropdown) ──
    if (action === 'selbat') {
      const duelId = extra;
      // Support both select menu (values[0]) and legacy button (parts[3] as index)
      const cardId = interaction.isStringSelectMenu() ? interaction.values[0] : null;
      const duel = cricket.getDuel(duelId);
      if (!duel) return interaction.reply({ content: '❌ Match not found.', ephemeral: true });
      if (duel.battingTeam !== userId) return interaction.reply({ content: '❌ Only the batting team can pick a batter.', ephemeral: true });
      if (!cardId) return interaction.reply({ content: '❌ No player selected.', ephemeral: true });

      const result = cricket.selectBatter(duelId, userId, cardId);
      if (!result.success) return interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });

      // If no non-striker yet, ask for non-striker
      if (!duel.nonStriker) {
        const eligible = cricket.getDuelEligible(userId, 'bat').filter(c => c.id !== duel.currentBatter?.id);
        await interaction.update({
          content: `✅ **${result.card.name}** set as striker. Now select the **non-striker**:`,
          components: buildPlayerSelectButtons(duelId, 'selbat', eligible),
        });
        return;
      }

      await interaction.update({
        content: `✅ **${result.card.name}** is now at the crease!`,
        components: [],
      });

      if (duel.status === 'live') {
        await postLiveBallMessage(interaction.channel, duel);
      }
      return;
    }

    // ── Bowler selection (dropdown) ──
    if (action === 'selbowl') {
      const duelId = extra;
      const cardId = interaction.isStringSelectMenu() ? interaction.values[0] : null;
      const duel = cricket.getDuel(duelId);
      if (!duel) return interaction.reply({ content: '❌ Match not found.', ephemeral: true });
      if (duel.bowlingTeam !== userId) return interaction.reply({ content: '❌ Only the bowling team can pick a bowler.', ephemeral: true });
      if (!cardId) return interaction.reply({ content: '❌ No player selected.', ephemeral: true });

      const result = cricket.selectBowler(duelId, userId, cardId);
      if (!result.success) return interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });

      await interaction.update({
        content: `✅ **${result.card.name}** (⭐ ${result.card.rating}) is bowling!`,
        components: [],
      });

      if (duel.status === 'live') {
        await postLiveBallMessage(interaction.channel, duel);
      }
      return;
    }

    // ── Shot selection (batter) ──
    if (action === 'shot') {
      const duelId = extra;
      const shot = parts[3];
      const duel = cricket.getDuel(duelId);
      if (!duel) return interaction.reply({ content: '❌ Match not found.', ephemeral: true });
      if (duel.battingTeam !== userId) return interaction.reply({ content: '❌ You are not batting!', ephemeral: true });
      if (duel.pendingShot) return interaction.reply({ content: '⏳ Shot already locked in! Waiting for bowler.', ephemeral: true });

      const result = cricket.submitShot(duelId, userId, shot);
      if (!result.success) return interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });

      // Disable the shot buttons to show locked in
      await interaction.update({
        content: `🏏 **${cricket.SHOT_LABELS[shot] || shot}** locked in! Waiting for bowler...`,
        components: buildDisabledShotButtons(duelId, shot)
      });

      if (!result.waiting) {
        // Both submitted — resolve and post result
        await postBallResult(interaction.channel, result, duelId);
      }
      return;
    }

    // ── Delivery selection (bowler) ──
    if (action === 'delivery') {
      const duelId = extra;
      const delivery = parts[3];
      const duel = cricket.getDuel(duelId);
      if (!duel) return interaction.reply({ content: '❌ Match not found.', ephemeral: true });
      if (duel.bowlingTeam !== userId) return interaction.reply({ content: '❌ You are not bowling!', ephemeral: true });
      if (duel.pendingDelivery) return interaction.reply({ content: '⏳ Delivery already locked in! Waiting for batter.', ephemeral: true });

      const result = cricket.submitDelivery(duelId, userId, delivery);
      if (!result.success) return interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });

      await interaction.update({
        content: `🎳 **${cricket.DELIVERY_LABELS[delivery] || delivery}** locked in! Waiting for batter...`,
        components: buildDisabledDeliveryButtons(duelId, delivery, duel.currentBowler)
      });

      if (!result.waiting) {
        await postBallResult(interaction.channel, result, duelId);
      }
      return;
    }
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

