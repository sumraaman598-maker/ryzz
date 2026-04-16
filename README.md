# Discord Cricket Bot

A Discord cricket bot with club building, player cards, solo matches, and live 1v1 duels.

## Setup

1. Install Node.js from https://nodejs.org/

2. Clone or download this project.

3. Run `npm install` to install dependencies.

4. Create a Discord bot at https://discord.com/developers/applications

5. Copy `.env.example` to `.env` and set `BOT_TOKEN`

6. Run `npm start` to start the bot

## Commands

- `rchelp` - Show all commands
- `rcguide` - Quick-start guide
- `rcdebut`, `rcclaim`, `rcdaily`, `rcpurse` - Build your club economy
- `rclist`, `rcaddtosquad`, `rcswap`, `rc11`, `rcxi` - Manage your playing XI
- `rcteamname`, `rcprofile`, `rccareer` - Club identity and career stats
- `rcsearch`, `rcaddcard`, `rcrelease`, `rcallplayers` - Scout and manage players
- `rcplay` - Solo AI match
- `rcchallenge`, `rcaccept`, `rctoss`, `rcsetbatter`, `rcsetbowler`, `rcshot`, `rcbowl`, `rcduelstatus` - Live 1v1 match flow

## Future Enhancements

- Integrate with a cricket API for live scores and schedules
- Add seasons, tournaments, and richer player progression
