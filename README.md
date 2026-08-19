# Stock Pulse 📈

A full-stack real-time stock market analytics web application built with **FastAPI** + **React (Vite)**. Track live stock quotes, analyze trends, manage a paper trading portfolio, and learn investing — all in one beautiful dashboard.

![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-19-61dafb.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.100+-009688.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Stock Quote** | Real-time price, change %, volume, 52-week range, and sparkline chart |
| 📊 **Analyze** | Volatility analysis, trend detection, support/resistance, risk level |
| 👁️ **Watchlist** | Live multi-stock watch mode with auto-refresh |
| 💼 **Paper Trading** | Simulated portfolio — buy/sell stocks with virtual cash |
| 📚 **Learn** | Built-in investor education module |
| 🔐 **Auth** | JWT-based user registration & login |
| 🔎 **Autocomplete** | Smart ticker/company name search across 150+ stocks |
| 📈 **Charts** | Interactive sparkline & candlestick charts powered by Recharts |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.8+** | Core language |
| **FastAPI** | REST API framework |
| **Uvicorn** | ASGI server |
| **yfinance** | Yahoo Finance market data |
| **pandas** | Data analysis & rolling calculations |
| **JWT (PyJWT)** | Authentication tokens |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **Recharts** | Interactive stock charts |
| **Axios** | HTTP client |
| **Tailwind CSS** | Utility styling |

---

## 📁 Project Structure

```
stock-pulse/
├── start.ps1                  # One-click Windows starter script
├── main.py                    # Legacy CLI entry point
├── requirements.txt           # Root Python dependencies
│
├── backend/
│   ├── main.py                # FastAPI app & all REST endpoints
│   ├── auth.py                # JWT authentication (register/login/me)
│   ├── portfolio.py           # Paper trading logic (buy/sell/reset)
│   ├── users.json             # Local user store
│   └── portfolio.json         # Local portfolio store
│
├── src/                       # Core Python modules (shared by backend)
│   ├── fetcher.py             # Yahoo Finance API wrapper
│   ├── analyzer.py            # Volatility, trend, market pulse logic
│   ├── charts.py              # ASCII chart utilities (legacy)
│   └── display.py             # Terminal display helpers (legacy)
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx            # Root app, auth gate, tab routing
│       ├── components/
│       │   ├── LoginPage.jsx  # Login / Register UI
│       │   ├── Navbar.jsx     # Top navigation bar
│       │   ├── StockSearch.jsx  # Quote tab
│       │   ├── Analyze.jsx      # Analysis tab
│       │   ├── WatchMode.jsx    # Watchlist tab
│       │   ├── PaperTrading.jsx # Portfolio tab
│       │   ├── Learn.jsx        # Education tab
│       │   ├── SparklineChart.jsx
│       │   ├── BuyModal.jsx
│       │   ├── SellModal.jsx
│       │   ├── Toast.jsx
│       │   └── LoadingSpinner.jsx
│       └── api/               # Axios API helpers
│
└── tests/
    ├── test_fetcher.py
    └── test_charts.py
```

---

## 🚀 How to Run

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 18+** with npm

### Option 1 — One-Click Start (Windows)

```powershell
.\start.ps1
```

This automatically:
1. Installs backend Python dependencies
2. Starts FastAPI backend on `http://localhost:8000`
3. Starts Vite frontend on `http://localhost:5173`
4. Opens your browser

### Option 2 — Manual (Two Terminals)

**Terminal 1 — Backend:**
```bash
pip install fastapi uvicorn[standard] yfinance pandas python-multipart PyJWT
python -m uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### URLs

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost:5173 |
| ⚡ Backend API | http://localhost:8000 |
| 📖 API Docs (Swagger) | http://localhost:8000/docs |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stock/{ticker}` | Full stock data + sparkline |
| `GET` | `/search?q=` | Ticker autocomplete (150+ stocks) |
| `GET` | `/compare?tickers=` | Side-by-side stock comparison |
| `GET` | `/pulse` | Market sentiment overview |
| `GET` | `/watch/{ticker}` | Live price data for watch mode |
| `GET` | `/portfolio` | Current paper trading portfolio |
| `POST` | `/buy` | Buy shares (paper trading) |
| `POST` | `/sell` | Sell shares (paper trading) |
| `POST` | `/reset` | Reset portfolio to cash |
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Login & receive JWT token |
| `GET` | `/auth/me` | Verify token & get user profile |

---

## 🔐 Authentication

Stock Pulse uses **JWT-based authentication**:
- Register/login to get a token stored in `localStorage`
- Protected routes verify the token via `Authorization: Bearer <token>` header
- Sessions persist across page refreshes

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend (Vite)               │
│  LoginPage → Navbar → [Quote|Analyze|Watch|Portfolio|Learn] │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / REST
┌───────────────────────▼─────────────────────────────┐
│              FastAPI Backend (Uvicorn)               │
│  /stock  /compare  /pulse  /watch  /auth  /buy  /sell│
└──────────┬────────────────────────┬─────────────────┘
           │                        │
┌──────────▼──────────┐  ┌─────────▼────────┐
│    src/fetcher.py   │  │ src/analyzer.py  │
│  (Yahoo Finance)    │  │ (Volatility/Trend)│
└─────────────────────┘  └──────────────────┘
```

---

## 🧪 Running Tests

```bash
pytest -v
```

Sample output:
```
tests/test_charts.py::TestASCIIChart::test_sparkline_basic   PASSED
tests/test_charts.py::TestASCIIChart::test_sparkline_empty   PASSED
tests/test_fetcher.py::TestStockFetcher::test_valid_ticker   PASSED
...
24 passed in 15.09s
```

---

## 🗺️ What I'd Improve With More Time

1. **WebSocket live prices** — replace polling with real-time push updates
2. **Redis caching** — cache historical data to reduce yfinance API calls
3. **Async data fetching** — fetch multiple stocks concurrently for faster compare
4. **Technical indicators** — RSI, MACD, Bollinger Bands
5. **News sentiment** — integrate financial news headlines with NLP scoring
6. **PostgreSQL backend** — replace JSON file storage with a real database
7. **Deployment** — Docker + cloud deploy (Render/Vercel)

---

## ⚖️ Trade-offs

| Decision | Benefit | Cost |
|---|---|---|
| JSON file storage | Zero setup, no DB needed | Not production-scalable |
| yfinance | Free, no API key | Rate limits, delayed data |
| Sync fetch | Simple code | Slower for many stocks |
| JWT in localStorage | Easy to implement | Less secure than httpOnly cookies |

---

## 🛡️ Edge Cases Handled

| Scenario | Handling |
|---|---|
| Invalid ticker | Returns 404, UI shows error toast |
| Network failure | Graceful error with retry suggestion |
| NaN/Inf values | Sanitized to 0 before JSON response |
| Missing data fields | Falls back to 0 or `"unknown"` |
| Expired JWT token | Auto-clears session, redirects to login |

---

## 📄 License

MIT License — feel free to use this code for any purpose.

---

## Contributors

- **[Vivek Solanki](https://github.com/vivek23366)** — terminal dashboard, Yahoo Finance
  data layer, analysis modules, Compare/Market Pulse/Learn tabs
- **[Sushant Dagar](https://github.com/Sushant-Dagar)** — FastAPI service and REST
  endpoints, JWT authentication, paper-trading portfolio, environment-based
  configuration

> *"The stock market is a device for transferring money from the impatient to the patient."* — Warren Buffett
