# 🌾 KrishiOS — AI Agricultural Operating System

## Quick Start (VS Code)

### Option 1: Live Server (Recommended)
1. Open this folder in VS Code
2. Install **Live Server** extension (by Ritwick Dey)
3. Right-click `index.html` → **Open with Live Server**
4. App opens at `http://localhost:5500`

### Option 2: Direct Open
- Just double-click `index.html` in File Explorer

---

## 🤖 Enable AI Features (OpenRouter API Key)

1. Go to **https://openrouter.ai/** and sign up (free)
2. Get your API key from dashboard
3. Open `app.js` (line 3) and replace:
   ```
   const OPENROUTER_API_KEY = 'YOUR_OPENROUTER_API_KEY';
   ```
   with your actual key:
   ```
   const OPENROUTER_API_KEY = 'sk-or-v1-xxxxxxxxxxxx';
   ```

**Free models available on OpenRouter:**
- `meta-llama/llama-3.1-8b-instruct:free` (default, used in app)
- `mistralai/mistral-7b-instruct:free`
- `google/gemma-2-9b-it:free`

---

## 📁 File Structure (6 Files)

```
agri-os/
├── index.html      ← Main HTML, layout, navigation
├── style.css       ← All styling (dark green farm theme)
├── data.js         ← Crop database, market prices, static data
├── app.js          ← All 16 page logic + AI integration
└── README.md       ← This file
```

---

## 🚀 All 40 Features Included

| # | Feature | Page |
|---|---------|------|
| 1 | Farmer Registration | Registration |
| 2 | Buyer Registration | Registration |
| 3 | Crop Planning | Crop Planning |
| 4 | Soil Analysis | Soil Analysis |
| 5 | Crop Recommendation | Soil Analysis (AI) |
| 6 | Crop Growth Tracking | Growth Tracking |
| 7 | Satellite Monitoring | Growth Tracking |
| 8 | Yield Prediction | Crop Planning (AI) |
| 9 | Disease Detection | Disease & Pest |
| 10 | Pest Detection | Disease & Pest |
| 11 | Crop Quality Grading | AI Quality Grader |
| 12 | Crop Library with Images | Crop Library |
| 13 | Direct Marketplace | Marketplace |
| 14 | Buyer Matching | Marketplace |
| 15 | Auction System | Auction |
| 16 | Bulk Order Management | Marketplace |
| 17 | Crop Aggregation | Marketplace |
| 18 | Fair Price Prediction | Market Intelligence |
| 19 | Seasonal Market Intelligence | Market Intelligence |
| 20 | Sell Now vs Store Later | Marketplace |
| 21 | Warehouse Discovery | Storage & Logistics |
| 22 | Community Storage | Storage & Logistics |
| 23 | Warehouse Financing | Finance & Schemes |
| 24 | Logistics Platform | Storage & Logistics |
| 25 | Demand Forecasting | Market Intelligence |
| 26 | Price Alerts | Dashboard |
| 27 | Weather Intelligence | Weather |
| 28 | Water Management | Weather |
| 29 | Fertilizer Recommendations | Soil Analysis |
| 30 | Government Schemes | Finance & Schemes |
| 31 | Crop Insurance | Finance & Schemes |
| 32 | Equipment Rental | Finance & Schemes |
| 33 | Farmer Community | Community |
| 34 | Expert Consultation | Community |
| 35 | Voice Assistant | Community (AI Chat) |
| 36 | Financial Planner | Finance & Schemes |
| 37 | Knowledge Hub | Community |
| 38 | Export Opportunities | Market Intelligence |
| 39 | Supply Chain Tracking | Admin Dashboard |
| 40 | Admin Dashboard | Admin |

---

## 🌾 Special Crop Library
- 12 major Indian crops with Wikipedia images
- Scientific names, seasons, water requirements
- Market demand, MSP, price history charts
- Click any crop for detailed modal view

## 🤖 AI Features (need API key)
- **Quality Grader**: Upload photo → Grade A/B/C + market value
- **Disease Detection**: Symptoms → diagnosis + treatment
- **Crop Planning**: AI yield prediction + activity schedule
- **Soil Analysis**: NPK → crop recommendations
- **Farm Chat**: Ask anything in English or Hindi
- **Price Forecast**: 30-day market prediction
- **Weather Advice**: Personalized farm actions

## 📱 Responsive
Works on mobile, tablet, and desktop.

---

Built with vanilla HTML, CSS, JavaScript — no frameworks needed.