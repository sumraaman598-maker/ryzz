// Real Cricket Players Database
const cricketPlayers = [
  // Indian Players
  { name: 'Virat Kohli', country: 'India', position: 'Batsman', rating: 98, role: 'Right-handed Bat' },
  { name: 'Rohit Sharma', country: 'India', position: 'Batsman', rating: 96, role: 'Right-handed Bat' },
  { name: 'Jasprit Bumrah', country: 'India', position: 'Bowler', rating: 94, role: 'Fast Bowler' },
  { name: 'Hardik Pandya', country: 'India', position: 'All-rounder', rating: 92, role: 'All-rounder' },
  { name: 'Suryakumar Yadav', country: 'India', position: 'Batsman', rating: 90, role: 'Right-handed Bat' },
  { name: 'KL Rahul', country: 'India', position: 'Batsman', rating: 89, role: 'Right-handed Bat' },
  { name: 'Yuzvendra Chahal', country: 'India', position: 'Bowler', rating: 87, role: 'Leg Spinner' },
  { name: 'Mohammed Shami', country: 'India', position: 'Bowler', rating: 88, role: 'Fast Bowler' },
  { name: 'Bhuvneshwar Kumar', country: 'India', position: 'Bowler', rating: 86, role: 'Fast Bowler' },
  { name: 'Axar Patel', country: 'India', position: 'All-rounder', rating: 85, role: 'All-rounder' },
  { name: 'Ravichandran Ashwin', country: 'India', position: 'All-rounder', rating: 91, role: 'Off-spinner' },

  // Australian Players
  { name: 'Steve Smith', country: 'Australia', position: 'Batsman', rating: 97, role: 'Right-handed Bat' },
  { name: 'David Warner', country: 'Australia', position: 'Batsman', rating: 95, role: 'Left-handed Bat' },
  { name: 'Pat Cummins', country: 'Australia', position: 'Bowler', rating: 93, role: 'Fast Bowler' },
  { name: 'Josh Hazlewood', country: 'Australia', position: 'Bowler', rating: 89, role: 'Fast Bowler' },
  { name: 'Glenn Maxwell', country: 'Australia', position: 'All-rounder', rating: 88, role: 'All-rounder' },
  { name: 'Marcus Stoinis', country: 'Australia', position: 'All-rounder', rating: 85, role: 'All-rounder' },

  // England Players
  { name: 'Joe Root', country: 'England', position: 'Batsman', rating: 96, role: 'Right-handed Bat' },
  { name: 'Ben Stokes', country: 'England', position: 'All-rounder', rating: 94, role: 'All-rounder' },
  { name: 'Jofra Archer', country: 'England', position: 'Bowler', rating: 90, role: 'Fast Bowler' },
  { name: 'Mark Wood', country: 'England', position: 'Bowler', rating: 88, role: 'Fast Bowler' },
  { name: 'Jonny Bairstow', country: 'England', position: 'Batsman', rating: 87, role: 'Right-handed Bat' },
  { name: 'Liam Livingstone', country: 'England', position: 'All-rounder', rating: 84, role: 'All-rounder' },

  // Pakistan Players
  { name: 'Babar Azam', country: 'Pakistan', position: 'Batsman', rating: 97, role: 'Right-handed Bat' },
  { name: 'Muhammad Rizwan', country: 'Pakistan', position: 'Batsman', rating: 93, role: 'Wicket-keeper Bat' },
  { name: 'Shaheen Afridi', country: 'Pakistan', position: 'Bowler', rating: 91, role: 'Fast Bowler' },
  { name: 'Hasan Ali', country: 'Pakistan', position: 'Bowler', rating: 87, role: 'Fast Bowler' },
  { name: 'Fakhar Zaman', country: 'Pakistan', position: 'Batsman', rating: 85, role: 'Left-handed Bat' },
  { name: 'Iftikhar Ahmed', country: 'Pakistan', position: 'All-rounder', rating: 83, role: 'All-rounder' },

  // West Indies Players
  { name: 'Chris Gayle', country: 'West Indies', position: 'Batsman', rating: 92, role: 'Left-handed Bat' },
  { name: 'Nicholas Pooran', country: 'West Indies', position: 'Batsman', rating: 88, role: 'Left-handed Bat' },
  { name: 'Reece Topley', country: 'West Indies', position: 'Bowler', rating: 86, role: 'Fast Bowler' },
  { name: 'Alzarri Joseph', country: 'West Indies', position: 'Bowler', rating: 84, role: 'Fast Bowler' },

  // South Africa Players
  { name: 'Quinton de Kock', country: 'South Africa', position: 'Batsman', rating: 94, role: 'Wicket-keeper Bat' },
  { name: 'Aiden Markram', country: 'South Africa', position: 'Batsman', rating: 91, role: 'Right-handed Bat' },
  { name: 'Kagiso Rabada', country: 'South Africa', position: 'Bowler', rating: 90, role: 'Fast Bowler' },
  { name: 'Tabraiz Shamsi', country: 'South Africa', position: 'Bowler', rating: 86, role: 'Leg Spinner' },

  // New Zealand Players
  { name: 'Kane Williamson', country: 'New Zealand', position: 'Batsman', rating: 98, role: 'Right-handed Bat' },
  { name: 'Martin Guptill', country: 'New Zealand', position: 'Batsman', rating: 87, role: 'Right-handed Bat' },
  { name: 'Trent Boult', country: 'New Zealand', position: 'Bowler', rating: 89, role: 'Fast Bowler' },
  { name: 'Lockie Ferguson', country: 'New Zealand', position: 'Bowler', rating: 86, role: 'Fast Bowler' },

  // Bangladesh Players
  { name: 'Shakib Al Hasan', country: 'Bangladesh', position: 'All-rounder', rating: 90, role: 'All-rounder' },
  { name: 'Mashrafe Mortaza', country: 'Bangladesh', position: 'Bowler', rating: 82, role: 'Fast Bowler' },
  { name: 'Tamim Iqbal', country: 'Bangladesh', position: 'Batsman', rating: 85, role: 'Left-handed Bat' },

  // Sri Lanka Players
  { name: 'Angelo Mathews', country: 'Sri Lanka', position: 'All-rounder', rating: 86, role: 'All-rounder' },
  { name: 'Wanindu Hasaranga', country: 'Sri Lanka', position: 'All-rounder', rating: 84, role: 'All-rounder' },
  { name: 'Lasith Malinga', country: 'Sri Lanka', position: 'Bowler', rating: 85, role: 'Fast Bowler' },

  // Afghanistan Players
  { name: 'Rashid Khan', country: 'Afghanistan', position: 'Bowler', rating: 92, role: 'Leg Spinner' },
  { name: 'Mohammad Nabi', country: 'Afghanistan', position: 'All-rounder', rating: 87, role: 'All-rounder' },
  { name: 'Mujeeb Ur Rahman', country: 'Afghanistan', position: 'Bowler', rating: 84, role: 'Off-spinner' },
];

function getRandomPlayers(count = 5) {
  const shuffled = cricketPlayers.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(player => ({
    id: `card_${Date.now()}_${Math.random()}`,
    ...player,
    level: 1
  }));
}

function getPlayerByName(name) {
  return cricketPlayers.find(p => p.name.toLowerCase() === name.toLowerCase());
}

function getAllPlayers() {
  return cricketPlayers;
}

module.exports = {
  cricketPlayers,
  getRandomPlayers,
  getPlayerByName,
  getAllPlayers
};
