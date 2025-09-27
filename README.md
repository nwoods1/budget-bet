# Budget Bet

Budget Bet is a social savings challenge where friends compete to stay under budget. The stack is:

- **Frontend**: React + Firebase authentication
- **Backend**: FastAPI with MongoDB
- **Bank data**: Plaid API integration point (simulated via stored transactions)

Use it to create groups, propose bets that every member must accept, track everyone’s spending, and automatically crown a winner when the deadline hits.

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB running locally at `mongodb://localhost:27017`

## Getting started

### 1. Start the API

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API is exposed on `http://localhost:8000`. Swagger docs live at `http://localhost:8000/docs`.

### 2. Start the React app

```bash
npm install
npm start
```

Set `REACT_APP_API_BASE_URL` in a `.env` file if the API is not running on the default `http://localhost:8000`.

Firebase authentication is already wired up. Update the configuration under `src/firebase/firebase.js` with your project credentials.

## Key features

- Create groups by inviting friends via username
- Propose, accept, and track bets with a budget cap and deadline
- Log transactions against bets (simulating Plaid activity)
- Dashboard summarising active bets, recent winners, and group activity
- Profile management with Plaid transaction history

## Available scripts

- `npm start` – run the React development server
- `npm test` – launch the CRA test runner
- `npm run build` – production build for the frontend

## Project structure

```
backend/          # FastAPI service
src/api/          # Frontend API client wrappers
src/pages/        # Route-driven React pages
src/hooks/        # Custom hooks (auth + API helpers)
```

## API overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/users/sync` | Upsert a Firebase-authenticated user |
| `GET /api/groups` | List groups for the signed-in user |
| `POST /api/groups` | Create a new group and invite members |
| `POST /api/bets` | Create a bet inside a group |
| `POST /api/bets/{id}/accept` | Accept a pending bet |
| `POST /api/bets/{id}/transactions` | Log spending for a bet |
| `POST /api/bets/{id}/finalize` | Finalise a bet and determine the winner |
| `GET /api/dashboard/{auth_id}` | Aggregated dashboard data |
| `GET /api/plaid/transactions/{auth_id}` | Simulated Plaid feed |

All endpoints return JSON and require only the Firebase auth identifier (provided by the frontend) to relate data.

## Testing

- Frontend: `npm test`
- Backend: use the auto-generated Swagger docs or integrate with your favourite API client.

## Future enhancements

- Connect the transactions endpoint to real Plaid item access tokens
- Add push notifications when bets are created or about to end
- Track recurring budgets and streaks per user

Happy budgeting!
