// Real Cricket Players Database — 200+ players
const cricketPlayers = [
  // ── INDIA (25 players) ──────────────────────────────────────────────────────
  { name: 'Sachin Tendulkar',   country: 'India', position: 'Batsman',        rating: 99, role: 'Right-handed Bat',   tier: 'elite'  },
  { name: 'Virat Kohli',        country: 'India', position: 'Batsman',        rating: 98, role: 'Right-handed Bat',   tier: 'elite'  },
  { name: 'Rohit Sharma',       country: 'India', position: 'Batsman',        rating: 96, role: 'Right-handed Bat',   tier: 'elite'  },
  { name: 'Jasprit Bumrah',     country: 'India', position: 'Bowler',         rating: 95, role: 'Fast Bowler',        tier: 'elite'  },
  { name: 'Suryakumar Yadav',   country: 'India', position: 'Batsman',        rating: 91, role: 'Right-handed Bat',   tier: 'elite'  },
  { name: 'Ravichandran Ashwin',country: 'India', position: 'All-rounder',    rating: 91, role: 'Off-spinner',        tier: 'elite'  },
  { name: 'Hardik Pandya',      country: 'India', position: 'All-rounder',    rating: 91, role: 'All-rounder',        tier: 'elite'  },
  { name: 'Mohammed Shami',     country: 'India', position: 'Bowler',         rating: 88, role: 'Fast Bowler',        tier: 'gold'   },
  { name: 'KL Rahul',           country: 'India', position: 'Batsman',        rating: 88, role: 'Right-handed Bat',   tier: 'gold'   },
  { name: 'Rishabh Pant',       country: 'India', position: 'Wicket-keeper',  rating: 88, role: 'Wicket-keeper Bat',  tier: 'gold'   },
  { name: 'Shubman Gill',       country: 'India', position: 'Batsman',        rating: 87, role: 'Right-handed Bat',   tier: 'gold'   },
  { name: 'Yuzvendra Chahal',   country: 'India', position: 'Bowler',         rating: 86, role: 'Leg Spinner',        tier: 'gold'   },
  { name: 'MS Dhoni',           country: 'India', position: 'Wicket-keeper',  rating: 85, role: 'Wicket-keeper Bat',  tier: 'gold'   },
  { name: 'Bhuvneshwar Kumar',  country: 'India', position: 'Bowler',         rating: 84, role: 'Fast Bowler',        tier: 'gold'   },
  { name: 'Yuvraj Singh',       country: 'India', position: 'All-rounder',    rating: 84, role: 'All-rounder',        tier: 'gold'   },
  { name: 'Shreyas Iyer',       country: 'India', position: 'Batsman',        rating: 83, role: 'Right-handed Bat',   tier: 'gold'   },
  { name: 'Kapil Dev',          country: 'India', position: 'All-rounder',    rating: 83, role: 'All-rounder',        tier: 'gold'   },
  { name: 'Virender Sehwag',    country: 'India', position: 'Batsman',        rating: 83, role: 'Right-handed Bat',   tier: 'gold'   },
  { name: 'Anil Kumble',        country: 'India', position: 'Bowler',         rating: 82, role: 'Leg Spinner',        tier: 'gold'   },
  { name: 'Zaheer Khan',        country: 'India', position: 'Bowler',         rating: 82, role: 'Fast Bowler',        tier: 'gold'   },
  { name: 'Harbhajan Singh',    country: 'India', position: 'Bowler',         rating: 81, role: 'Off-spinner',        tier: 'gold'   },
  { name: 'Rahul Dravid',       country: 'India', position: 'Batsman',        rating: 80, role: 'Right-handed Bat',   tier: 'gold'   },
  { name: 'Sourav Ganguly',     country: 'India', position: 'All-rounder',    rating: 80, role: 'All-rounder',        tier: 'gold'   },
  { name: 'VVS Laxman',         country: 'India', position: 'Batsman',        rating: 79, role: 'Right-handed Bat',   tier: 'silver' },
  { name: 'Ravindra Jadeja',    country: 'India', position: 'All-rounder',    rating: 90, role: 'All-rounder',        tier: 'elite'  },

  // ── AUSTRALIA (20 players) ──────────────────────────────────────────────────
  { name: 'Steve Smith',        country: 'Australia', position: 'Batsman',       rating: 97, role: 'Right-handed Bat',  tier: 'elite'  },
  { name: 'Ricky Ponting',      country: 'Australia', position: 'Batsman',       rating: 95, role: 'Right-handed Bat',  tier: 'elite'  },
  { name: 'David Warner',       country: 'Australia', position: 'Batsman',       rating: 94, role: 'Left-handed Bat',   tier: 'elite'  },
  { name: 'Pat Cummins',        country: 'Australia', position: 'Bowler',        rating: 93, role: 'Fast Bowler',       tier: 'elite'  },
  { name: 'Shane Warne',        country: 'Australia', position: 'Bowler',        rating: 93, role: 'Leg Spinner',       tier: 'elite'  },
  { name: 'Glenn McGrath',      country: 'Australia', position: 'Bowler',        rating: 90, role: 'Fast Bowler',       tier: 'elite'  },
  { name: 'Mitchell Starc',     country: 'Australia', position: 'Bowler',        rating: 90, role: 'Fast Bowler',       tier: 'elite'  },
  { name: 'Josh Hazlewood',     country: 'Australia', position: 'Bowler',        rating: 89, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Glenn Maxwell',      country: 'Australia', position: 'All-rounder',   rating: 88, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Adam Gilchrist',     country: 'Australia', position: 'Wicket-keeper', rating: 88, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'Marnus Labuschagne', country: 'Australia', position: 'Batsman',       rating: 88, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Travis Head',        country: 'Australia', position: 'Batsman',       rating: 87, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Nathan Lyon',        country: 'Australia', position: 'Bowler',        rating: 85, role: 'Off-spinner',       tier: 'gold'   },
  { name: 'Marcus Stoinis',     country: 'Australia', position: 'All-rounder',   rating: 84, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Cameron Green',      country: 'Australia', position: 'All-rounder',   rating: 84, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Michael Clarke',     country: 'Australia', position: 'Batsman',       rating: 84, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Aaron Finch',        country: 'Australia', position: 'Batsman',       rating: 83, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Adam Zampa',         country: 'Australia', position: 'Bowler',        rating: 83, role: 'Leg Spinner',       tier: 'gold'   },
  { name: 'Josh Inglis',        country: 'Australia', position: 'Wicket-keeper', rating: 80, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'Alex Carey',         country: 'Australia', position: 'Wicket-keeper', rating: 82, role: 'Wicket-keeper Bat', tier: 'gold'   },

  // ── ENGLAND (20 players) ────────────────────────────────────────────────────
  { name: 'Joe Root',           country: 'England', position: 'Batsman',       rating: 96, role: 'Right-handed Bat',  tier: 'elite'  },
  { name: 'Ben Stokes',         country: 'England', position: 'All-rounder',   rating: 94, role: 'All-rounder',       tier: 'elite'  },
  { name: 'Jofra Archer',       country: 'England', position: 'Bowler',        rating: 89, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Jos Buttler',        country: 'England', position: 'Wicket-keeper', rating: 89, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'James Anderson',     country: 'England', position: 'Bowler',        rating: 88, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Mark Wood',          country: 'England', position: 'Bowler',        rating: 87, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Kevin Pietersen',    country: 'England', position: 'Batsman',       rating: 86, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Stuart Broad',       country: 'England', position: 'Bowler',        rating: 86, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Jonny Bairstow',     country: 'England', position: 'Batsman',       rating: 86, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Harry Brook',        country: 'England', position: 'Batsman',       rating: 85, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Andrew Flintoff',    country: 'England', position: 'All-rounder',   rating: 83, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Adil Rashid',        country: 'England', position: 'Bowler',        rating: 83, role: 'Leg Spinner',       tier: 'gold'   },
  { name: 'Liam Livingstone',   country: 'England', position: 'All-rounder',   rating: 83, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Chris Woakes',       country: 'England', position: 'All-rounder',   rating: 84, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Moeen Ali',          country: 'England', position: 'All-rounder',   rating: 82, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Sam Curran',         country: 'England', position: 'All-rounder',   rating: 82, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Alastair Cook',      country: 'England', position: 'Batsman',       rating: 82, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Graeme Swann',       country: 'England', position: 'Bowler',        rating: 81, role: 'Off-spinner',       tier: 'gold'   },
  { name: 'Ben Duckett',        country: 'England', position: 'Batsman',       rating: 81, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Phil Salt',          country: 'England', position: 'Batsman',       rating: 80, role: 'Right-handed Bat',  tier: 'gold'   },

  // ── PAKISTAN (20 players) ───────────────────────────────────────────────────
  { name: 'Babar Azam',         country: 'Pakistan', position: 'Batsman',       rating: 97, role: 'Right-handed Bat',  tier: 'elite'  },
  { name: 'Wasim Akram',        country: 'Pakistan', position: 'Bowler',        rating: 92, role: 'Fast Bowler',       tier: 'elite'  },
  { name: 'Muhammad Rizwan',    country: 'Pakistan', position: 'Wicket-keeper', rating: 92, role: 'Wicket-keeper Bat', tier: 'elite'  },
  { name: 'Shaheen Afridi',     country: 'Pakistan', position: 'Bowler',        rating: 91, role: 'Fast Bowler',       tier: 'elite'  },
  { name: 'Waqar Younis',       country: 'Pakistan', position: 'Bowler',        rating: 89, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Shoaib Akhtar',      country: 'Pakistan', position: 'Bowler',        rating: 88, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Naseem Shah',        country: 'Pakistan', position: 'Bowler',        rating: 87, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Hasan Ali',          country: 'Pakistan', position: 'Bowler',        rating: 86, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Shadab Khan',        country: 'Pakistan', position: 'All-rounder',   rating: 85, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Fakhar Zaman',       country: 'Pakistan', position: 'Batsman',       rating: 84, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Younis Khan',        country: 'Pakistan', position: 'Batsman',       rating: 84, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Inzamam-ul-Haq',     country: 'Pakistan', position: 'Batsman',       rating: 83, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Saeed Anwar',        country: 'Pakistan', position: 'Batsman',       rating: 83, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Iftikhar Ahmed',     country: 'Pakistan', position: 'All-rounder',   rating: 82, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Sarfaraz Ahmed',     country: 'Pakistan', position: 'Wicket-keeper', rating: 82, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'Imad Wasim',         country: 'Pakistan', position: 'All-rounder',   rating: 81, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Misbah-ul-Haq',      country: 'Pakistan', position: 'Batsman',       rating: 80, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Umar Gul',           country: 'Pakistan', position: 'Bowler',        rating: 80, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Azhar Ali',          country: 'Pakistan', position: 'Batsman',       rating: 79, role: 'Right-handed Bat',  tier: 'silver' },
  { name: 'Asad Shafiq',        country: 'Pakistan', position: 'Batsman',       rating: 78, role: 'Right-handed Bat',  tier: 'silver' },

  // ── WEST INDIES (15 players) ────────────────────────────────────────────────
  { name: 'Brian Lara',         country: 'West Indies', position: 'Batsman',       rating: 96, role: 'Left-handed Bat',   tier: 'elite'  },
  { name: 'Chris Gayle',        country: 'West Indies', position: 'Batsman',       rating: 91, role: 'Left-handed Bat',   tier: 'elite'  },
  { name: 'Andre Russell',      country: 'West Indies', position: 'All-rounder',   rating: 88, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Curtly Ambrose',     country: 'West Indies', position: 'Bowler',        rating: 88, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Courtney Walsh',     country: 'West Indies', position: 'Bowler',        rating: 87, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Nicholas Pooran',    country: 'West Indies', position: 'Wicket-keeper', rating: 87, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'Sunil Narine',       country: 'West Indies', position: 'All-rounder',   rating: 86, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Kieron Pollard',     country: 'West Indies', position: 'All-rounder',   rating: 84, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Jason Holder',       country: 'West Indies', position: 'All-rounder',   rating: 85, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Shimron Hetmyer',    country: 'West Indies', position: 'Batsman',       rating: 83, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Alzarri Joseph',     country: 'West Indies', position: 'Bowler',        rating: 83, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Shai Hope',          country: 'West Indies', position: 'Wicket-keeper', rating: 82, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'Kemar Roach',        country: 'West Indies', position: 'Bowler',        rating: 82, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Kraigg Brathwaite',  country: 'West Indies', position: 'Batsman',       rating: 80, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Shannon Gabriel',    country: 'West Indies', position: 'Bowler',        rating: 80, role: 'Fast Bowler',       tier: 'gold'   },

  // ── SOUTH AFRICA (15 players) ───────────────────────────────────────────────
  { name: 'AB de Villiers',     country: 'South Africa', position: 'Batsman',       rating: 95, role: 'Right-handed Bat',  tier: 'elite'  },
  { name: 'Jacques Kallis',     country: 'South Africa', position: 'All-rounder',   rating: 93, role: 'All-rounder',       tier: 'elite'  },
  { name: 'Quinton de Kock',    country: 'South Africa', position: 'Wicket-keeper', rating: 93, role: 'Wicket-keeper Bat', tier: 'elite'  },
  { name: 'Dale Steyn',         country: 'South Africa', position: 'Bowler',        rating: 91, role: 'Fast Bowler',       tier: 'elite'  },
  { name: 'Kagiso Rabada',      country: 'South Africa', position: 'Bowler',        rating: 91, role: 'Fast Bowler',       tier: 'elite'  },
  { name: 'Aiden Markram',      country: 'South Africa', position: 'Batsman',       rating: 90, role: 'Right-handed Bat',  tier: 'elite'  },
  { name: 'Morne Morkel',       country: 'South Africa', position: 'Bowler',        rating: 87, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Anrich Nortje',      country: 'South Africa', position: 'Bowler',        rating: 87, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Hashim Amla',        country: 'South Africa', position: 'Batsman',       rating: 88, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'David Miller',       country: 'South Africa', position: 'Batsman',       rating: 86, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Tabraiz Shamsi',     country: 'South Africa', position: 'Bowler',        rating: 85, role: 'Leg Spinner',       tier: 'gold'   },
  { name: 'Keshav Maharaj',     country: 'South Africa', position: 'Bowler',        rating: 83, role: 'Off-spinner',       tier: 'gold'   },
  { name: 'Temba Bavuma',       country: 'South Africa', position: 'Batsman',       rating: 82, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Dean Elgar',         country: 'South Africa', position: 'Batsman',       rating: 81, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Makhaya Ntini',      country: 'South Africa', position: 'Bowler',        rating: 82, role: 'Fast Bowler',       tier: 'gold'   },

  // ── NEW ZEALAND (15 players) ────────────────────────────────────────────────
  { name: 'Kane Williamson',    country: 'New Zealand', position: 'Batsman',       rating: 97, role: 'Right-handed Bat',  tier: 'elite'  },
  { name: 'Martin Guptill',     country: 'New Zealand', position: 'Batsman',       rating: 86, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Brendon McCullum',   country: 'New Zealand', position: 'Wicket-keeper', rating: 86, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'Trent Boult',        country: 'New Zealand', position: 'Bowler',        rating: 88, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Ross Taylor',        country: 'New Zealand', position: 'Batsman',       rating: 85, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Tim Southee',        country: 'New Zealand', position: 'Bowler',        rating: 85, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Devon Conway',       country: 'New Zealand', position: 'Batsman',       rating: 86, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Daniel Vettori',     country: 'New Zealand', position: 'All-rounder',   rating: 84, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Daryl Mitchell',     country: 'New Zealand', position: 'All-rounder',   rating: 83, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Shane Bond',         country: 'New Zealand', position: 'Bowler',        rating: 83, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Tom Latham',         country: 'New Zealand', position: 'Wicket-keeper', rating: 83, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'Lockie Ferguson',    country: 'New Zealand', position: 'Bowler',        rating: 85, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Mitchell Santner',   country: 'New Zealand', position: 'All-rounder',   rating: 81, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Jimmy Neesham',      country: 'New Zealand', position: 'All-rounder',   rating: 82, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Jacob Oram',         country: 'New Zealand', position: 'All-rounder',   rating: 79, role: 'All-rounder',       tier: 'silver' },

  // ── BANGLADESH (10 players) ─────────────────────────────────────────────────
  { name: 'Shakib Al Hasan',    country: 'Bangladesh', position: 'All-rounder',   rating: 90, role: 'All-rounder',       tier: 'elite'  },
  { name: 'Tamim Iqbal',        country: 'Bangladesh', position: 'Batsman',       rating: 84, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Mushfiqur Rahim',    country: 'Bangladesh', position: 'Wicket-keeper', rating: 83, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'Mustafizur Rahman',  country: 'Bangladesh', position: 'Bowler',        rating: 83, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Mehidy Hasan Miraz', country: 'Bangladesh', position: 'All-rounder',   rating: 82, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Liton Das',          country: 'Bangladesh', position: 'Wicket-keeper', rating: 81, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'Mashrafe Mortaza',   country: 'Bangladesh', position: 'Bowler',        rating: 80, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Taskin Ahmed',       country: 'Bangladesh', position: 'Bowler',        rating: 80, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Mahmudullah',        country: 'Bangladesh', position: 'All-rounder',   rating: 79, role: 'All-rounder',       tier: 'silver' },
  { name: 'Soumya Sarkar',      country: 'Bangladesh', position: 'Batsman',       rating: 77, role: 'Left-handed Bat',   tier: 'silver' },

  // ── SRI LANKA (10 players) ──────────────────────────────────────────────────
  { name: 'Muttiah Muralitharan',country: 'Sri Lanka', position: 'Bowler',        rating: 94, role: 'Off-spinner',       tier: 'elite'  },
  { name: 'Kumar Sangakkara',   country: 'Sri Lanka', position: 'Wicket-keeper', rating: 92, role: 'Wicket-keeper Bat', tier: 'elite'  },
  { name: 'Mahela Jayawardene', country: 'Sri Lanka', position: 'Batsman',       rating: 88, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Wanindu Hasaranga',  country: 'Sri Lanka', position: 'All-rounder',   rating: 85, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Angelo Mathews',     country: 'Sri Lanka', position: 'All-rounder',   rating: 85, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Lasith Malinga',     country: 'Sri Lanka', position: 'Bowler',        rating: 84, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Tillakaratne Dilshan',country: 'Sri Lanka', position: 'All-rounder',  rating: 83, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Chaminda Vaas',      country: 'Sri Lanka', position: 'Bowler',        rating: 83, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Kusal Mendis',       country: 'Sri Lanka', position: 'Wicket-keeper', rating: 81, role: 'Wicket-keeper Bat', tier: 'gold'   },
  { name: 'Thisara Perera',     country: 'Sri Lanka', position: 'All-rounder',   rating: 79, role: 'All-rounder',       tier: 'silver' },

  // ── AFGHANISTAN (8 players) ─────────────────────────────────────────────────
  { name: 'Rashid Khan',        country: 'Afghanistan', position: 'Bowler',        rating: 93, role: 'Leg Spinner',       tier: 'elite'  },
  { name: 'Mohammad Nabi',      country: 'Afghanistan', position: 'All-rounder',   rating: 86, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Mujeeb Ur Rahman',   country: 'Afghanistan', position: 'Bowler',        rating: 83, role: 'Off-spinner',       tier: 'gold'   },
  { name: 'Ibrahim Zadran',     country: 'Afghanistan', position: 'Batsman',       rating: 78, role: 'Right-handed Bat',  tier: 'silver' },
  { name: 'Hazratullah Zazai',  country: 'Afghanistan', position: 'Batsman',       rating: 79, role: 'Left-handed Bat',   tier: 'silver' },
  { name: 'Mohammad Shahzad',   country: 'Afghanistan', position: 'Wicket-keeper', rating: 78, role: 'Wicket-keeper Bat', tier: 'silver' },
  { name: 'Gulbadin Naib',      country: 'Afghanistan', position: 'All-rounder',   rating: 77, role: 'All-rounder',       tier: 'silver' },
  { name: 'Asghar Afghan',      country: 'Afghanistan', position: 'Batsman',       rating: 76, role: 'Right-handed Bat',  tier: 'silver' },

  // ── ZIMBABWE (5 players) ────────────────────────────────────────────────────
  { name: 'Sikandar Raza',      country: 'Zimbabwe', position: 'All-rounder',   rating: 80, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Brendan Taylor',     country: 'Zimbabwe', position: 'Wicket-keeper', rating: 78, role: 'Wicket-keeper Bat', tier: 'silver' },
  { name: 'Sean Williams',      country: 'Zimbabwe', position: 'All-rounder',   rating: 77, role: 'All-rounder',       tier: 'silver' },
  { name: 'Blessing Muzarabani',country: 'Zimbabwe', position: 'Bowler',        rating: 76, role: 'Fast Bowler',       tier: 'silver' },
  { name: 'Craig Ervine',       country: 'Zimbabwe', position: 'Batsman',       rating: 75, role: 'Left-handed Bat',   tier: 'silver' },

  // ── IRELAND (5 players) ─────────────────────────────────────────────────────
  { name: 'Paul Stirling',      country: 'Ireland', position: 'Batsman',       rating: 79, role: 'Right-handed Bat',  tier: 'silver' },
  { name: 'Andrew Balbirnie',   country: 'Ireland', position: 'Batsman',       rating: 77, role: 'Right-handed Bat',  tier: 'silver' },
  { name: 'Kevin O\'Brien',     country: 'Ireland', position: 'All-rounder',   rating: 76, role: 'All-rounder',       tier: 'silver' },
  { name: 'Lorcan Tucker',      country: 'Ireland', position: 'Wicket-keeper', rating: 75, role: 'Wicket-keeper Bat', tier: 'silver' },
  { name: 'Boyd Rankin',        country: 'Ireland', position: 'Bowler',        rating: 74, role: 'Fast Bowler',       tier: 'bronze' },

  // ── EXTRA INDIA ──────────────────────────────────────────────────────────────
  { name: 'Shikhar Dhawan',     country: 'India', position: 'Batsman',       rating: 82, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Dinesh Karthik',     country: 'India', position: 'Wicket-keeper', rating: 78, role: 'Wicket-keeper Bat', tier: 'silver' },
  { name: 'Ambati Rayudu',      country: 'India', position: 'Batsman',       rating: 76, role: 'Right-handed Bat',  tier: 'silver' },
  { name: 'Umesh Yadav',        country: 'India', position: 'Bowler',        rating: 78, role: 'Fast Bowler',       tier: 'silver' },
  { name: 'Shardul Thakur',     country: 'India', position: 'All-rounder',   rating: 77, role: 'All-rounder',       tier: 'silver' },
  { name: 'Washington Sundar',  country: 'India', position: 'All-rounder',   rating: 76, role: 'All-rounder',       tier: 'silver' },
  { name: 'Deepak Chahar',      country: 'India', position: 'Bowler',        rating: 77, role: 'Fast Bowler',       tier: 'silver' },
  { name: 'Ishan Kishan',       country: 'India', position: 'Wicket-keeper', rating: 78, role: 'Wicket-keeper Bat', tier: 'silver' },
  { name: 'Sanju Samson',       country: 'India', position: 'Wicket-keeper', rating: 79, role: 'Wicket-keeper Bat', tier: 'silver' },
  { name: 'Kedar Jadhav',       country: 'India', position: 'All-rounder',   rating: 74, role: 'All-rounder',       tier: 'bronze' },

  // ── EXTRA AUSTRALIA ──────────────────────────────────────────────────────────
  { name: 'Matthew Hayden',     country: 'Australia', position: 'Batsman',       rating: 87, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Andrew Symonds',     country: 'Australia', position: 'All-rounder',   rating: 84, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Brett Lee',          country: 'Australia', position: 'Bowler',        rating: 86, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Mitchell Johnson',   country: 'Australia', position: 'Bowler',        rating: 85, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Justin Langer',      country: 'Australia', position: 'Batsman',       rating: 82, role: 'Left-handed Bat',   tier: 'gold'   },

  // ── EXTRA ENGLAND ────────────────────────────────────────────────────────────
  { name: 'Eoin Morgan',        country: 'England', position: 'Batsman',       rating: 84, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Jason Roy',          country: 'England', position: 'Batsman',       rating: 83, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Dawid Malan',        country: 'England', position: 'Batsman',       rating: 82, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Ollie Pope',         country: 'England', position: 'Batsman',       rating: 80, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Zak Crawley',        country: 'England', position: 'Batsman',       rating: 78, role: 'Right-handed Bat',  tier: 'silver' },

  // ── EXTRA PAKISTAN ───────────────────────────────────────────────────────────
  { name: 'Shoaib Malik',       country: 'Pakistan', position: 'All-rounder',   rating: 82, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Mohammad Hafeez',    country: 'Pakistan', position: 'All-rounder',   rating: 81, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Haris Rauf',         country: 'Pakistan', position: 'Bowler',        rating: 82, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Kamran Akmal',       country: 'Pakistan', position: 'Wicket-keeper', rating: 79, role: 'Wicket-keeper Bat', tier: 'silver' },
  { name: 'Fawad Alam',         country: 'Pakistan', position: 'Batsman',       rating: 77, role: 'Left-handed Bat',   tier: 'silver' },

  // ── EXTRA NEW ZEALAND ────────────────────────────────────────────────────────
  { name: 'Kyle Jamieson',      country: 'New Zealand', position: 'Bowler',        rating: 82, role: 'Fast Bowler',       tier: 'gold'   },
  { name: 'Glenn Phillips',     country: 'New Zealand', position: 'Batsman',       rating: 79, role: 'Right-handed Bat',  tier: 'silver' },
  { name: 'Corey Anderson',     country: 'New Zealand', position: 'All-rounder',   rating: 78, role: 'All-rounder',       tier: 'silver' },
  { name: 'Will Young',         country: 'New Zealand', position: 'Batsman',       rating: 75, role: 'Right-handed Bat',  tier: 'silver' },
  { name: 'Grant Elliott',      country: 'New Zealand', position: 'All-rounder',   rating: 76, role: 'All-rounder',       tier: 'silver' },

  // ── EXTRA WEST INDIES ────────────────────────────────────────────────────────
  { name: 'Dwayne Bravo',       country: 'West Indies', position: 'All-rounder',   rating: 83, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Marlon Samuels',     country: 'West Indies', position: 'All-rounder',   rating: 79, role: 'All-rounder',       tier: 'silver' },
  { name: 'Darren Sammy',       country: 'West Indies', position: 'All-rounder',   rating: 77, role: 'All-rounder',       tier: 'silver' },
  { name: 'Fidel Edwards',      country: 'West Indies', position: 'Bowler',        rating: 75, role: 'Fast Bowler',       tier: 'silver' },
  { name: 'Denesh Ramdin',      country: 'West Indies', position: 'Wicket-keeper', rating: 74, role: 'Wicket-keeper Bat', tier: 'bronze' },

  // ── EXTRA SOUTH AFRICA ───────────────────────────────────────────────────────
  { name: 'Faf du Plessis',     country: 'South Africa', position: 'Batsman',       rating: 86, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Shaun Pollock',      country: 'South Africa', position: 'All-rounder',   rating: 87, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Graeme Smith',       country: 'South Africa', position: 'Batsman',       rating: 85, role: 'Left-handed Bat',   tier: 'gold'   },
  { name: 'Lance Klusener',     country: 'South Africa', position: 'All-rounder',   rating: 83, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Jonty Rhodes',       country: 'South Africa', position: 'Batsman',       rating: 80, role: 'Right-handed Bat',  tier: 'gold'   },

  // ── EXTRA SRI LANKA ──────────────────────────────────────────────────────────
  { name: 'Sanath Jayasuriya',  country: 'Sri Lanka', position: 'All-rounder',   rating: 88, role: 'All-rounder',       tier: 'gold'   },
  { name: 'Aravinda de Silva',  country: 'Sri Lanka', position: 'Batsman',       rating: 84, role: 'Right-handed Bat',  tier: 'gold'   },
  { name: 'Dhananjaya de Silva',country: 'Sri Lanka', position: 'All-rounder',   rating: 79, role: 'All-rounder',       tier: 'silver' },
  { name: 'Arjuna Ranatunga',   country: 'Sri Lanka', position: 'Batsman',       rating: 78, role: 'Left-handed Bat',   tier: 'silver' },
  { name: 'Nuwan Kulasekara',   country: 'Sri Lanka', position: 'Bowler',        rating: 76, role: 'Fast Bowler',       tier: 'silver' },

  // ── EXTRA BANGLADESH ─────────────────────────────────────────────────────────
  { name: 'Nazmul Hossain Shanto', country: 'Bangladesh', position: 'Batsman',   rating: 76, role: 'Left-handed Bat',   tier: 'silver' },
  { name: 'Afif Hossain',       country: 'Bangladesh', position: 'All-rounder',   rating: 74, role: 'All-rounder',       tier: 'bronze' },
  { name: 'Shoriful Islam',     country: 'Bangladesh', position: 'Bowler',        rating: 73, role: 'Fast Bowler',       tier: 'bronze' },

  // ── EXTRA AFGHANISTAN ────────────────────────────────────────────────────────
  { name: 'Rahmat Shah',        country: 'Afghanistan', position: 'Batsman',       rating: 75, role: 'Right-handed Bat',  tier: 'silver' },
  { name: 'Najibullah Zadran',  country: 'Afghanistan', position: 'Batsman',       rating: 74, role: 'Left-handed Bat',   tier: 'bronze' },
];

// ── Helper functions ──────────────────────────────────────────────────────────

function getRandomPlayers(count = 5) {
  const shuffled = [...cricketPlayers].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(player => ({
    id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...player,
    level: 1
  }));
}

function getPlayerByName(name) {
  return cricketPlayers.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
}

function getAllPlayers() {
  return cricketPlayers;
}

function getPlayersByTier(tier) {
  return cricketPlayers.filter(p => p.tier === tier);
}

function getPlayersByCountry(country) {
  return cricketPlayers.filter(p => p.country.toLowerCase() === country.toLowerCase());
}

function getPlayersByPosition(position) {
  return cricketPlayers.filter(p => p.position.toLowerCase() === position.toLowerCase());
}

module.exports = {
  cricketPlayers,
  getRandomPlayers,
  getPlayerByName,
  getAllPlayers,
  getPlayersByTier,
  getPlayersByCountry,
  getPlayersByPosition,
};
