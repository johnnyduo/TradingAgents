# TradingAgents - React Version<p align="center">

  <img src="assets/TauricResearch.png" style="width: 60%; height: auto;">

🚀 **Status: Core Implementation Complete (70%)**</p>



Multi-agent AI trading analysis system converted from Python to React/TypeScript with LangChain.js and LangGraph.<div align="center" style="line-height: 1;">

  <a href="https://arxiv.org/abs/2412.20138" target="_blank"><img alt="arXiv" src="https://img.shields.io/badge/arXiv-2412.20138-B31B1B?logo=arxiv"/></a>

## ✅ What's Working  <a href="https://discord.com/invite/hk9PGKShPK" target="_blank"><img alt="Discord" src="https://img.shields.io/badge/Discord-TradingResearch-7289da?logo=discord&logoColor=white&color=7289da"/></a>

  <a href="./assets/wechat.png" target="_blank"><img alt="WeChat" src="https://img.shields.io/badge/WeChat-TauricResearch-brightgreen?logo=wechat&logoColor=white"/></a>

### Backend (Express.js + TypeScript)  <a href="https://x.com/TauricResearch" target="_blank"><img alt="X Follow" src="https://img.shields.io/badge/X-TauricResearch-white?logo=x&logoColor=white"/></a>

- ✅ **7 Stock Data Tools** - Price, historical, SMA, RSI, MACD, fundamentals, news (Alpha Vantage)  <br>

- ✅ **5 Core Agents** - Market Analyst, News Analyst, Fundamentals Analyst, Bull Researcher, Bear Researcher, Trader  <a href="https://github.com/TauricResearch/" target="_blank"><img alt="Community" src="https://img.shields.io/badge/Join_GitHub_Community-TauricResearch-14C290?logo=discourse"/></a>

- ✅ **LangGraph State Machine** - Sequential agent execution pipeline</div>

- ✅ **API Routes** - Analysis, authentication, configuration endpoints

- ✅ **Real-time WebSocket** - Socket.io for live updates<div align="center">

- ✅ **Database** - Prisma + PostgreSQL for user data and analysis results  <!-- Keep these links. Translations will automatically update with the README. -->

- ✅ **Authentication** - JWT-based auth system  <a href="https://www.readme-i18n.com/TauricResearch/TradingAgents?lang=de">Deutsch</a> | 

  <a href="https://www.readme-i18n.com/TauricResearch/TradingAgents?lang=es">Español</a> | 

### Frontend (Next.js 14 + TypeScript)  <a href="https://www.readme-i18n.com/TauricResearch/TradingAgents?lang=fr">français</a> | 

- ✅ **Dashboard** - Stock ticker input and analysis trigger  <a href="https://www.readme-i18n.com/TauricResearch/TradingAgents?lang=ja">日本語</a> | 

- ✅ **Dark Theme** - Modern UI with Tailwind CSS  <a href="https://www.readme-i18n.com/TauricResearch/TradingAgents?lang=ko">한국어</a> | 

- 🚧 **Real-time Updates** - WebSocket client (ready, needs integration)  <a href="https://www.readme-i18n.com/TauricResearch/TradingAgents?lang=pt">Português</a> | 

- 🚧 **Results Display** - Agent reports visualization (pending)  <a href="https://www.readme-i18n.com/TauricResearch/TradingAgents?lang=ru">Русский</a> | 

  <a href="https://www.readme-i18n.com/TauricResearch/TradingAgents?lang=zh">中文</a>

## 🚀 Quick Start</div>



### Prerequisites---

```bash

# Install Node.js 20+, PostgreSQL, Redis# TradingAgents: Multi-Agents LLM Financial Trading Framework 

brew install node postgresql@14 redis

> 🎉 **TradingAgents** officially released! We have received numerous inquiries about the work, and we would like to express our thanks for the enthusiasm in our community.

# Install pnpm>

npm install -g pnpm> So we decided to fully open-source the framework. Looking forward to building impactful projects with you!

```

<div align="center">

### Installation<a href="https://www.star-history.com/#TauricResearch/TradingAgents&Date">

```bash <picture>

# 1. Clone and navigate   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=TauricResearch/TradingAgents&type=Date&theme=dark" />

cd /path/to/TradingAgents   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=TauricResearch/TradingAgents&type=Date" />

   <img alt="TradingAgents Star History" src="https://api.star-history.com/svg?repos=TauricResearch/TradingAgents&type=Date" style="width: 80%; height: auto;" />

# 2. Install dependencies </picture>

pnpm install</a>

</div>

# 3. Set up environment

cp .env.example .env<div align="center">

# Edit .env with your API keys

```🚀 [TradingAgents](#tradingagents-framework) | ⚡ [Installation & CLI](#installation-and-cli) | 🎬 [Demo](https://www.youtube.com/watch?v=90gr5lwjIho) | 📦 [Package Usage](#tradingagents-package) | 🤝 [Contributing](#contributing) | 📄 [Citation](#citation)



### Environment Variables (.env)</div>

```env

# Database## TradingAgents Framework

DATABASE_URL="postgresql://user:password@localhost:5432/tradingagents_dev"

TradingAgents is a multi-agent trading framework that mirrors the dynamics of real-world trading firms. By deploying specialized LLM-powered agents: from fundamental analysts, sentiment experts, and technical analysts, to trader, risk management team, the platform collaboratively evaluates market conditions and informs trading decisions. Moreover, these agents engage in dynamic discussions to pinpoint the optimal strategy.

# Redis

REDIS_URL="redis://localhost:6379"<p align="center">

  <img src="assets/schema.png" style="width: 100%; height: auto;">

# Auth</p>

JWT_SECRET="your-super-secret-jwt-key-change-this"

> TradingAgents framework is designed for research purposes. Trading performance may vary based on many factors, including the chosen backbone language models, model temperature, trading periods, the quality of data, and other non-deterministic factors. [It is not intended as financial, investment, or trading advice.](https://tauric.ai/disclaimer/)

# LLM Provider (at least one required)

OPENAI_API_KEY="sk-..."Our framework decomposes complex trading tasks into specialized roles. This ensures the system achieves a robust, scalable approach to market analysis and decision-making.



# Data Vendor (required for stock data)### Analyst Team

ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"- Fundamentals Analyst: Evaluates company financials and performance metrics, identifying intrinsic values and potential red flags.

- Sentiment Analyst: Analyzes social media and public sentiment using sentiment scoring algorithms to gauge short-term market mood.

# Frontend- News Analyst: Monitors global news and macroeconomic indicators, interpreting the impact of events on market conditions.

FRONTEND_URL="http://localhost:3000"- Technical Analyst: Utilizes technical indicators (like MACD and RSI) to detect trading patterns and forecast price movements.

```

<p align="center">

### Database Setup  <img src="assets/analyst.png" width="100%" style="display: inline-block; margin: 0 2%;">

```bash</p>

# Create database

createdb tradingagents_dev### Researcher Team

- Comprises both bullish and bearish researchers who critically assess the insights provided by the Analyst Team. Through structured debates, they balance potential gains against inherent risks.

# Push Prisma schema

cd apps/api<p align="center">

pnpm prisma db push  <img src="assets/researcher.png" width="70%" style="display: inline-block; margin: 0 2%;">

</p>

# (Optional) Open Prisma Studio to view data

pnpm prisma studio### Trader Agent

```- Composes reports from the analysts and researchers to make informed trading decisions. It determines the timing and magnitude of trades based on comprehensive market insights.



### Run Development Servers<p align="center">

```bash  <img src="assets/trader.png" width="70%" style="display: inline-block; margin: 0 2%;">

# From project root - starts both frontend and backend</p>

pnpm dev

### Risk Management and Portfolio Manager

# Or run individually:- Continuously evaluates portfolio risk by assessing market volatility, liquidity, and other risk factors. The risk management team evaluates and adjusts trading strategies, providing assessment reports to the Portfolio Manager for final decision.

# Backend: cd apps/api && pnpm dev- The Portfolio Manager approves/rejects the transaction proposal. If approved, the order will be sent to the simulated exchange and executed.

# Frontend: cd apps/web && pnpm dev

```<p align="center">

  <img src="assets/risk.png" width="70%" style="display: inline-block; margin: 0 2%;">

### Access the Application</p>

- **Frontend**: http://localhost:3000

- **Backend API**: http://localhost:3001## Installation and CLI

- **Health Check**: http://localhost:3001/health

### Installation

## 📊 How It Works

Clone TradingAgents:

### Agent Workflow```bash

The system runs 6 AI agents sequentially:git clone https://github.com/TauricResearch/TradingAgents.git

cd TradingAgents

1. **Market Analyst** 📊```

   - Fetches current price and historical data

   - Calculates technical indicators (SMA, RSI, MACD)Create a virtual environment in any of your favorite environment managers:

   - Identifies trends and patterns```bash

conda create -n tradingagents python=3.13

2. **News Analyst** 📰conda activate tradingagents

   - Fetches recent news articles```

   - Analyzes sentiment

   - Identifies catalystsInstall dependencies:

```bash

3. **Fundamentals Analyst** 💼pip install -r requirements.txt

   - Retrieves company financials```

   - Evaluates valuation metrics (P/E, PEG, ROE)

   - Assesses business quality### Required APIs



4. **Bull Researcher** 🐂You will need the OpenAI API for all the agents, and [Alpha Vantage API](https://www.alphavantage.co/support/#api-key) for fundamental and news data (default configuration).

   - Builds bullish investment thesis

   - Highlights growth opportunities```bash

export OPENAI_API_KEY=$YOUR_OPENAI_API_KEY

5. **Bear Researcher** 🐻export ALPHA_VANTAGE_API_KEY=$YOUR_ALPHA_VANTAGE_API_KEY

   - Builds bearish counterarguments```

   - Identifies risks and red flags

Alternatively, you can create a `.env` file in the project root with your API keys (see `.env.example` for reference):

6. **Trader** 💰```bash

   - Reviews all analysescp .env.example .env

   - Makes final BUY/SELL/HOLD decision# Edit .env with your actual API keys

```

## 🏗️ Project Structure

**Note:** We are happy to partner with Alpha Vantage to provide robust API support for TradingAgents. You can get a free AlphaVantage API [here](https://www.alphavantage.co/support/#api-key), TradingAgents-sourced requests also have increased rate limits to 60 requests per minute with no daily limits. Typically the quota is sufficient for performing complex tasks with TradingAgents thanks to Alpha Vantage’s open-source support program. If you prefer to use OpenAI for these data sources instead, you can modify the data vendor settings in `tradingagents/default_config.py`.

```

TradingAgents/### CLI Usage

├── apps/

│   ├── api/                    # Express.js backendYou can also try out the CLI directly by running:

│   │   ├── src/```bash

│   │   │   ├── agents/         # 5 trading agentspython -m cli.main

│   │   │   ├── tools/          # Stock data tools```

│   │   │   ├── graph/          # LangGraph state machineYou will see a screen where you can select your desired tickers, date, LLMs, research depth, etc.

│   │   │   ├── routes/         # API endpoints

│   │   │   ├── services/       # Business logic<p align="center">

│   │   │   └── middleware/     # Auth, logging, rate limiting  <img src="assets/cli/cli_init.png" width="100%" style="display: inline-block; margin: 0 2%;">

│   │   └── prisma/             # Database schema</p>

│   │

│   └── web/                    # Next.js frontendAn interface will appear showing results as they load, letting you track the agent's progress as it runs.

│       └── app/                # Next.js 14 App Router

│<p align="center">

├── packages/  <img src="assets/cli/cli_news.png" width="100%" style="display: inline-block; margin: 0 2%;">

│   └── types/                  # Shared TypeScript types</p>

│

└── consolidate/<p align="center">

    └── python-original/        # Original Python code  <img src="assets/cli/cli_transaction.png" width="100%" style="display: inline-block; margin: 0 2%;">

```</p>



## 🛠️ Technology Stack## TradingAgents Package



**Backend**: Express.js, TypeScript, LangChain.js, LangGraph, Prisma, PostgreSQL, Socket.io### Implementation Details

**Frontend**: Next.js 14, React, TypeScript, Tailwind CSS

**Data**: Alpha Vantage APIWe built TradingAgents with LangGraph to ensure flexibility and modularity. We utilize `o1-preview` and `gpt-4o` as our deep thinking and fast thinking LLMs for our experiments. However, for testing purposes, we recommend you use `o4-mini` and `gpt-4.1-mini` to save on costs as our framework makes **lots of** API calls.

**LLM**: OpenAI GPT-4

### Python Usage

## 📝 API Endpoints

To use TradingAgents inside your code, you can import the `tradingagents` module and initialize a `TradingAgentsGraph()` object. The `.propagate()` function will return a decision. You can run `main.py`, here's also a quick example:

- `POST /api/v1/analysis/start` - Start new analysis

- `GET /api/v1/analysis/:id/status` - Get analysis status```python

- `GET /api/v1/analysis/:id/result` - Get full resultfrom tradingagents.graph.trading_graph import TradingAgentsGraph

- `GET /api/v1/analysis/history` - Get historyfrom tradingagents.default_config import DEFAULT_CONFIG

- `POST /api/v1/auth/register` - Register user

- `POST /api/v1/auth/login` - Loginta = TradingAgentsGraph(debug=True, config=DEFAULT_CONFIG.copy())



## 📚 Documentation# forward propagate

_, decision = ta.propagate("NVDA", "2024-05-10")

- [Original Python README](./consolidate/python-original/README.md)print(decision)

- [Conversion Plan](./REACT_CONVERSION_PLAN.md)```

- [Implementation Status](./IMPLEMENTATION_STATUS.md)

You can also adjust the default configuration to set your own choice of LLMs, debate rounds, etc.

## 📄 License

```python

See [LICENSE](./LICENSE) file for details.from tradingagents.graph.trading_graph import TradingAgentsGraph

from tradingagents.default_config import DEFAULT_CONFIG

---

# Create a custom config

**Status**: Core system operational • 70% complete • November 2025config = DEFAULT_CONFIG.copy()

config["deep_think_llm"] = "gpt-4.1-nano"  # Use a different model
config["quick_think_llm"] = "gpt-4.1-nano"  # Use a different model
config["max_debate_rounds"] = 1  # Increase debate rounds

# Configure data vendors (default uses yfinance and Alpha Vantage)
config["data_vendors"] = {
    "core_stock_apis": "yfinance",           # Options: yfinance, alpha_vantage, local
    "technical_indicators": "yfinance",      # Options: yfinance, alpha_vantage, local
    "fundamental_data": "alpha_vantage",     # Options: openai, alpha_vantage, local
    "news_data": "alpha_vantage",            # Options: openai, alpha_vantage, google, local
}

# Initialize with custom config
ta = TradingAgentsGraph(debug=True, config=config)

# forward propagate
_, decision = ta.propagate("NVDA", "2024-05-10")
print(decision)
```

> The default configuration uses yfinance for stock price and technical data, and Alpha Vantage for fundamental and news data. For production use or if you encounter rate limits, consider upgrading to [Alpha Vantage Premium](https://www.alphavantage.co/premium/) for more stable and reliable data access. For offline experimentation, there's a local data vendor option that uses our **Tauric TradingDB**, a curated dataset for backtesting, though this is still in development. We're currently refining this dataset and plan to release it soon alongside our upcoming projects. Stay tuned!

You can view the full list of configurations in `tradingagents/default_config.py`.

## Contributing

We welcome contributions from the community! Whether it's fixing a bug, improving documentation, or suggesting a new feature, your input helps make this project better. If you are interested in this line of research, please consider joining our open-source financial AI research community [Tauric Research](https://tauric.ai/).

## Citation

Please reference our work if you find *TradingAgents* provides you with some help :)

```
@misc{xiao2025tradingagentsmultiagentsllmfinancial,
      title={TradingAgents: Multi-Agents LLM Financial Trading Framework}, 
      author={Yijia Xiao and Edward Sun and Di Luo and Wei Wang},
      year={2025},
      eprint={2412.20138},
      archivePrefix={arXiv},
      primaryClass={q-fin.TR},
      url={https://arxiv.org/abs/2412.20138}, 
}
```
