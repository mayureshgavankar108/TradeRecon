# TradeRecon — Trade Reconciliation Platform

TradeRecon is a full-stack web application that automates trade reconciliation by comparing internal trade records against custodian records. It identifies discrepancies, highlights unmatched trades, and stores reconciliation results for future review.

Built using React, Node.js, Express, and SQLite, the project demonstrates REST API development, data processing, relational database integration, and automated testing.

## Features

- **CSV Upload:** Upload internal and custodian trade records.
- **Automated Reconciliation:** Compare trades using unique trade IDs.
- **Discrepancy Detection:** Identify missing trades, quantity mismatches, and price mismatches.
- **Price Tolerance:** Detect price differences that exceed the configured tolerance.
- **Interactive Dashboard:** View internal trades, custodian trades, matched trades, and total discrepancies.
- **Break Filtering:** Filter discrepancies by their type.
- **Reconciliation History:** Review previously completed reconciliation runs.
- **Persistent Storage:** Save reconciliation summaries and discrepancy records in SQLite.
- **Automated Tests:** Test reconciliation logic and API behavior using Jest and Supertest.

## Tech Stack

| Category | Technology |
|---|---|
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | SQLite |
| Database Driver | better-sqlite3 |
| CSV Parsing | csv-parse |
| File Uploads | Multer |
| HTTP Client | Axios |
| Web Server / Reverse Proxy | Nginx |
| Containerization | Docker, Docker Compose |
| Testing | Jest, Supertest |
| API Testing | Postman |
| Version Control | Git, GitHub |

## Application Preview

![TradeRecon Dashboard](screenshots/dashboard.png?v=2)

TradeRecon provides a unified dashboard for uploading trade records, reviewing reconciliation history, and investigating discrepancies between internal and custodian records.

## How It Works

1. Upload the internal trades CSV file.
2. Upload the custodian trades CSV file.
3. The backend parses and validates the uploaded records.
4. The reconciliation algorithm compares trades using their trade IDs.
5. Discrepancies are categorized by type.
6. The reconciliation summary and discrepancy records are stored in SQLite.
7. The dashboard displays the results and provides access to reconciliation history.

## Discrepancy Types

| Break Type | Description |
|---|---|
| `MISSING_IN_CUSTODIAN` | A trade exists in the internal records but not in the custodian records. |
| `MISSING_IN_INTERNAL` | A trade exists in the custodian records but not in the internal records. |
| `QUANTITY_MISMATCH` | The quantities recorded by the two sources differ. |
| `PRICE_MISMATCH` | The recorded prices differ beyond the configured tolerance. |

## Project Structure

```text
TradeRecon/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   └── recon.js
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── reconcile.js
│   │   └── server.js
│   ├── tests/
│   │   ├── reconcile.test.js
│   │   └── recon.api.test.js
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
├── screenshots/
│   └── dashboard.png
├── docker-compose.yaml
├── .gitignore
├── package.json
└── README.md
```

## Running with Docker

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- Git installed.

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/mayureshgavankar108/TradeRecon.git
   cd TradeRecon
   ```

2. Build and start the application:

   ```bash
   docker compose up --build
   ```

3. Open the application in your browser:

   `http://localhost:8080`

Docker Compose builds and starts the React frontend served by Nginx and the Node.js/Express backend.

### Stopping the Application

Press `Ctrl + C` in the terminal, then run:

```bash
docker compose down
```

### Database Persistence

Reconciliation history is stored in SQLite using a named Docker volume. This allows the data to persist when containers are stopped, removed, and recreated.

**Note:** The backend also has local development instructions below. Use the Docker instructions if you want to run the containerized application.

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/mayureshgavankar108/TradeRecon
cd TradeRecon
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Start the backend

For normal execution:

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

The backend is expected to run on port `4000`, based on the current server configuration.

### 4. Install frontend dependencies

Open a second terminal from the project root:

```bash
cd client
npm install
```

### 5. Start the frontend

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal. It is typically `http://localhost:5173`.

Keep both the frontend and backend running while using the application.

## Running Tests

Open a terminal in the backend directory:

```bash
cd server
npm test
```

The test suite covers the reconciliation algorithm and API behavior.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/recon` | Upload both CSV files and run reconciliation. |
| `GET` | `/api/recon` | Retrieve reconciliation history. |
| `GET` | `/api/recon/:id` | Retrieve a specific reconciliation run and its results. |
| `GET` | `/api/recon/breaks` | Retrieve discrepancies filtered by break type. |
| `GET` | `/api/recon/:id/breaks` | Retrieve discrepancies for a specific run, optionally filtered by type. |

### Upload Request

The `POST /api/recon` endpoint accepts `multipart/form-data` with these fields:

- `internalFile` — internal trades CSV file.
- `custodianFile` — custodian trades CSV file.

## Sample CSV Format

The CSV files should contain the required trade fields:

```csv
trade_id,symbol,side,quantity,price,trade_date
T101,AAPL,BUY,10,150.00,2026-10-28
T102,MSFT,BUY,20,400.00,2026-10-28
T103,NVDA,SELL,5,120.00,2026-10-28
```

The application validates trade IDs, quantities, and prices before processing the records.

## Future Improvements

- Export discrepancies to CSV.
- Add pagination and search to reconciliation history.
- Improve CSV validation and error reporting.
- Introduce user authentication and role-based access control.
- Benchmark reconciliation performance on larger datasets.
- Deploy the application for public access.

## Author

**Mayuresh Gavankar**

Developed as a full-stack project exploring financial data reconciliation, data processing, REST API development, relational databases, and automated testing.