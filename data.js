// ===================== CROP LIBRARY DATA =====================
const CROPS = [
  {
    id: 'wheat', name: 'Wheat', emoji: '🌾',
    scientific: 'Triticum aestivum', season: 'Rabi (Oct–Mar)',
    water: '450–650 mm', demand: 'Very High', msp: 2275,
    price: [1900,2100,2050,2200,2275,2300,2400,2350],
    states: ['Punjab','Haryana','UP','MP'],
    desc: 'India\'s staple food grain, grown across the Indo-Gangetic plains.',
    soil: 'Loamy clay', temp: '10–25°C',
    image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTP2LYFs80kYNjJKA0kekZUApNitD1J6L83MA&s',
    grade:'A', tags:['Rabi','Staple','Export']
  },
  {
    id: 'rice', name: 'Rice', emoji: '🍚',
    scientific: 'Oryza sativa', season: 'Kharif (Jun–Nov)',
    water: '1000–2000 mm', demand: 'Very High', msp: 2183,
    price: [1800,1950,2000,2050,2183,2200,2280,2100],
    states: ['WB','UP','Andhra','Punjab'],
    desc: 'Primary food crop of India, grown in flooded paddy fields.',
    soil: 'Clayey', temp: '20–35°C',
    image:'https://img.jagranjosh.com/images/2025/09/12/article/image/scientific-name-of-rice-1757656335124.jpg',
    grade:'A', tags:['Kharif','Staple','Export']
  },
  {
    id: 'cotton', name: 'Cotton', emoji: '🫧',
    scientific: 'Gossypium hirsutum', season: 'Kharif (Apr–Nov)',
    water: '700–1200 mm', demand: 'High', msp: 7020,
    price: [5500,5800,6200,6500,7020,7100,6800,6600],
    states: ['Gujarat','Maharashtra','Telangana','AP'],
    desc: 'White gold of India, major cash crop for textile industry.',
    soil: 'Black alluvial', temp: '21–30°C',
    image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVS1VmZ-OH53cTaVUkfzhdEliXRFQBi85FAQ&s',
    grade:'B', tags:['Cash Crop','Kharif','Industrial']
  },
  {
    id: 'sugarcane', name: 'Sugarcane', emoji: '🎋',
    scientific: 'Saccharum officinarum', season: 'Year-round',
    water: '1500–2500 mm', demand: 'High', msp: 315,
    price: [280,285,290,295,305,310,315,320],
    states: ['UP','Maharashtra','Karnataka','TN'],
    desc: 'Sweet cash crop, backbone of India\'s sugar & ethanol industry.',
    soil: 'Deep loamy', temp: '20–32°C',
    image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgKHp9McIWhPTAw6VB1mUcjmDmUKQbAEERgA&s',
    grade:'A', tags:['Cash Crop','Perennial','Agro-industry']
  },
  {
    id: 'soybean', name: 'Soybean', emoji: '🫘',
    scientific: 'Glycine max', season: 'Kharif (Jun–Oct)',
    water: '450–700 mm', demand: 'High', msp: 4600,
    price: [3800,4000,4200,4400,4600,4700,4650,4500],
    states: ['MP','Maharashtra','Rajasthan'],
    desc: 'Protein-rich oilseed with growing industrial demand.',
    soil: 'Well-drained loam', temp: '20–30°C',
    image:'https://assets.tractorjunction.com/tractor-junction/assets/images/crop-categories/soybean-174530430271.webp',
    grade:'B', tags:['Oilseed','Kharif','Protein']
  },
  {
    id: 'maize', name: 'Maize', emoji: '🌽',
    scientific: 'Zea mays', season: 'Kharif & Rabi',
    water: '500–800 mm', demand: 'Very High', msp: 2090,
    price: [1600,1700,1800,1900,2000,2090,2100,2050],
    states: ['Karnataka','Andhra','Rajasthan','UP'],
    desc: 'Versatile crop used for food, feed, starch and ethanol.',
    soil: 'Well-drained loam', temp: '18–27°C',
    image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7o9ODPkTiDc2KeOZaZetn_7r_lhAQdkeVnQ&s',
    grade:'A', tags:['Food','Feed','Industrial']
  },
  {
    id: 'tomato', name: 'Tomato', emoji: '🍅',
    scientific: 'Solanum lycopersicum', season: 'Year-round',
    water: '400–600 mm', demand: 'Very High', msp: null,
    price: [1200,1500,1800,2200,2800,1600,1200,900],
    states: ['AP','Karnataka','Maharashtra','UP'],
    desc: 'Highly volatile vegetable with peak price swings each season.',
    soil: 'Sandy loam', temp: '18–27°C',
    image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPJTYEC-GmAOfZPVtiYXsS1McSJ7OvlFUlYw&s',
    grade:'B', tags:['Vegetable','Horticulture','Volatile']
  },
  {
    id: 'onion', name: 'Onion', emoji: '🧅',
    scientific: 'Allium cepa', season: 'Rabi & Kharif',
    water: '350–550 mm', demand: 'Very High', msp: null,
    price: [800,1000,1200,1500,1800,2200,1400,900],
    states: ['Maharashtra','Karnataka','MP','Gujarat'],
    desc: 'India\'s most politically sensitive vegetable with massive export demand.',
    soil: 'Sandy loam', temp: '13–24°C',
    image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuvt5tbxSlVBZyF4y6h04wFuDoxu-qw26y9Q&s',
    grade:'A', tags:['Vegetable','Export','Storage']
  },
  {
    id: 'turmeric', name: 'Turmeric', emoji: '🟡',
    scientific: 'Curcuma longa', season: 'Jul–Feb',
    water: '1000–2000 mm', demand: 'High', msp: null,
    price: [6000,6500,7000,8000,9000,10000,11000,12000],
    states: ['Telangana','Andhra','Tamil Nadu','Odisha'],
    desc: 'Golden spice with rising global demand for health products.',
    soil: 'Loamy', temp: '20–30°C',
    image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuaDkCoOodqAF2XjZdXIVgt2_2BVgdMiwmLA&s',
    grade:'A', tags:['Spice','Export','Medicinal']
  },
  {
    id: 'chilli', name: 'Chilli', emoji: '🌶️',
    scientific: 'Capsicum annuum', season: 'Kharif (Jun–Dec)',
    water: '600–1250 mm', demand: 'High', msp: null,
    price: [8000,8500,9000,9500,10000,11000,12000,11500],
    states: ['AP','Karnataka','Maharashtra','Rajasthan'],
    desc: 'India is world\'s largest producer and exporter of chillies.',
    soil: 'Sandy loam', temp: '20–30°C',
    image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYgR5bjAzglSC530HmpI8dt8aScBkYO_gRog&s',
    grade:'B', tags:['Spice','Export','Kharif']
  },
  {
    id: 'mustard', name: 'Mustard', emoji: '💛',
    scientific: 'Brassica juncea', season: 'Rabi (Oct–Feb)',
    water: '250–400 mm', demand: 'High', msp: 5650,
    price: [4500,4800,5000,5200,5450,5650,5700,5600],
    states: ['Rajasthan','UP','Haryana','MP'],
    desc: 'Major oilseed crop; India leads in mustard oil production.',
    soil: 'Sandy loam to loam', temp: '10–25°C',
    image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWk4dcSUnqZ8Kj2l785r9Nv9ZMKYSof_poGg&s',
    grade:'A', tags:['Oilseed','Rabi','Edible Oil']
  },
  {
    id: 'banana', name: 'Banana', emoji: '🍌',
    scientific: 'Musa acuminata', season: 'Year-round',
    water: '1200–2200 mm', demand: 'Very High', msp: null,
    price: [1200,1300,1400,1500,1600,1700,1600,1500],
    states: ['Tamil Nadu','Maharashtra','Karnataka','Gujarat'],
    desc: 'India is world\'s largest banana producer with year-round yield.',
    soil: 'Rich loam', temp: '15–35°C',
    image:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwUqDb6dUxGsR-UKFumWxUbD3qoL-Jx-7SPQ&s',
    grade:'A', tags:['Fruit','Perennial','Export']
  }
];

// ===================== MARKET PRICES =====================
const MARKET_PRICES = [
  { crop:'Wheat',     mandi:'Indore',     price:2310, change:+40,  trend:'up'   },
  { crop:'Soybean',   mandi:'Nagpur',     price:4620, change:-80,  trend:'down' },
  { crop:'Onion',     mandi:'Nashik',     price:2100, change:+350, trend:'up'   },
  { crop:'Cotton',    mandi:'Kadi',       price:7050, change:+30,  trend:'up'   },
  { crop:'Rice',      mandi:'Ludhiana',   price:2200, change:+20,  trend:'up'   },
  { crop:'Turmeric',  mandi:'Nizamabad',  price:11200,change:+200, trend:'up'   },
  { crop:'Maize',     mandi:'Davangere',  price:2080, change:-10,  trend:'down' },
  { crop:'Mustard',   mandi:'Alwar',      price:5720, change:+70,  trend:'up'   },
];

// ===================== FARMERS =====================
const FARMERS = [
  { id:1, name:'Ramesh Patil',   village:'Hingoli',  state:'Maharashtra', crops:['Soybean','Cotton'], land:'5.2 ac', rating:4.8, badge:'Premium',  sales:142000 },
  { id:2, name:'Suresh Kumar',   village:'Ludhiana', state:'Punjab',      crops:['Wheat','Maize'],    land:'8.0 ac', rating:4.5, badge:'Verified', sales:98000  },
  { id:3, name:'Lakshmi Devi',   village:'Nellore',  state:'Andhra',      crops:['Rice','Chilli'],    land:'3.5 ac', rating:4.9, badge:'Premium',  sales:187000 },
  { id:4, name:'Gopal Yadav',    village:'Etawah',   state:'UP',          crops:['Wheat','Sugarcane'],land:'6.0 ac', rating:4.3, badge:'Verified', sales:76000  },
];

// ===================== AUCTIONS =====================
const AUCTIONS = [
  { id:'A001', crop:'Soybean',  qty:'50 Quintal',  startPrice:4400, currentBid:4620, bids:12, farmer:'Ramesh Patil', grade:'A',  endsIn:7200,  image:'🫘' },
  { id:'A002', crop:'Turmeric', qty:'20 Quintal',  startPrice:10000,currentBid:11200,bids:8,  farmer:'Lakshmi Devi', grade:'A+', endsIn:14400, image:'🟡' },
  { id:'A003', crop:'Onion',    qty:'100 Quintal', startPrice:1800, currentBid:2100, bids:22, farmer:'Gopal Yadav',  grade:'B',  endsIn:3600,  image:'🧅' },
];

// ===================== WAREHOUSES =====================
const WAREHOUSES = [
  { name:'NAFED Warehouse',  city:'Nagpur',   dist:'12 km', capacity:'5000 MT', avail:'1200 MT', rate:'₹8/qtl/day',  cold:true  },
  { name:'State Agri WH',    city:'Wardha',   dist:'28 km', capacity:'3000 MT', avail:'800 MT',  rate:'₹6/qtl/day',  cold:false },
  { name:'Private CWC',      city:'Amravati', dist:'45 km', capacity:'8000 MT', avail:'3500 MT', rate:'₹9/qtl/day',  cold:true  },
];

// ===================== GOVERNMENT SCHEMES =====================
const SCHEMES = [
  { name:'PM-KISAN',              desc:'₹6000/year direct income support to farmers in 3 installments',                    deadline:'Ongoing',        badge:'Financial' },
  { name:'PM Fasal Bima Yojana',  desc:'Subsidized crop insurance covering losses from natural disasters',                  deadline:'Before sowing',  badge:'Insurance' },
  { name:'Kisan Credit Card',     desc:'Short-term crop loans at 4% interest for input costs',                             deadline:'Anytime',        badge:'Credit'    },
  { name:'Soil Health Card Scheme',desc:'Free soil testing and fertility recommendation card every 2 years',               deadline:'Ongoing',        badge:'Soil'      },
  { name:'E-NAM',                 desc:'National Agriculture Market — direct access to 1000+ mandis online',              deadline:'Ongoing',        badge:'Market'    },
  { name:'PMKSY',                 desc:'Micro-irrigation subsidy — drip & sprinkler up to 90% for small farmers',         deadline:'Apply by Sep',   badge:'Water'     },
];

// ===================== DISEASES =====================
const DISEASES = [
  { name:'Wheat Rust',      crop:'Wheat',      severity:'High',      symptom:'Reddish-brown pustules on leaves',      treatment:'Propiconazole fungicide 25 EC @0.1%',  prevention:'Use resistant varieties'            },
  { name:'Blast (Rice)',    crop:'Rice',       severity:'Very High', symptom:'Diamond-shaped lesions on leaves',      treatment:'Tricyclazole 75 WP @0.06%',            prevention:'Balanced nitrogen, avoid dense planting' },
  { name:'Cotton Bollworm', crop:'Cotton',     severity:'High',      symptom:'Holes in bolls, webbing',               treatment:'Spinosad 45 SC @0.01%',               prevention:'Install pheromone traps'            },
  { name:'Powdery Mildew',  crop:'Vegetables', severity:'Medium',    symptom:'White powdery coating on leaves',       treatment:'Sulphur 80 WP spray',                 prevention:'Improve air circulation'            },
];

// ===================== WEATHER DATA =====================
const WEATHER = {
  current: { temp:32, humidity:68, wind:12, rain:0, uv:7, condition:'Partly Cloudy', icon:'⛅' },
  forecast: [
    { day:'Today',     icon:'⛅',  high:32, low:24, rain:10 },
    { day:'Tomorrow',  icon:'🌧️', high:28, low:22, rain:70 },
    { day:'Wed',       icon:'🌦️', high:29, low:23, rain:45 },
    { day:'Thu',       icon:'☀️',  high:34, low:25, rain:5  },
    { day:'Fri',       icon:'☀️',  high:36, low:26, rain:0  },
    { day:'Sat',       icon:'⛅',  high:33, low:24, rain:15 },
    { day:'Sun',       icon:'🌧️', high:27, low:21, rain:80 },
  ],
  advisory: 'High humidity expected mid-week. Avoid fungicide spray on Wednesday. Harvest operations possible Thursday–Saturday.'
};