# Feature 023: AI-Assisted Options Trading Tracker

## Overview
A weekly trading check-in system with AI coaching powered by Claude API. Track options trades, get AI guidance on your trading framework, and monitor P&L performance.

## User Story
As a trader, I want to:
- Chat with an AI coach that knows my trading framework
- Get encouragement and guidance on trade decisions
- **Upload screenshots from Tasty Trade or OptionStrat and have AI extract trade details automatically**
- Record options trades with strike prices, premiums, and expirations (auto-filled from screenshots)
- See a live table of all my trades on the same page
- Track per-trade and cumulative P&L
- Stay disciplined with weekly check-ins

## Requirements

### Functional Requirements
1. **AI Chat Interface**
   - Conversational interface with Claude API
   - AI has context of user's trading framework
   - AI can suggest strike prices and trade setups
   - Provides encouragement and accountability
   - Has access to full historical trade data for contextual advice

2. **Trade Recording**
   - Record options trades (calls/puts)
   - Track: ticker, strike price, premium, contracts, expiration date, delta (if available)
   - Support both BUY and SELL actions
   - Add trade rationale and framework notes
   - AI can ask questions to help record trade details
   - **Screenshot upload and analysis**: Upload images from Tasty Trade or OptionStrat (temporary, not stored)
   - **AI vision extraction**: Claude Vision API analyzes screenshot and extracts trade details
   - **Auto-populate form**: Trade form automatically filled with AI-extracted data
   - **User review & edit**: User can verify and adjust AI-extracted details before saving
   - **No storage**: Screenshots are processed in-memory and discarded after extraction

3. **Trade Tracking**
   - Live table displaying all trades
   - Show trade status (OPEN, CLOSED, EXPIRED, ASSIGNED)
   - Update trades with closing information
   - Filter and sort capabilities

4. **P&L Calculations**
   - Per-trade P&L for closed positions
   - Overall cumulative P&L
   - Running total of all trades
   - Visual indicators for profit/loss

5. **Weekly Sessions**
   - Group trades by weekly check-in sessions
   - Session notes and summaries
   - Historical session review

### Technical Requirements
- TypeScript/React for frontend
- Next.js App Router
- Supabase for data storage
- Claude API integration (via API route)
- Real-time UI updates
- Responsive design (mobile + desktop)

## Database Schema

### Tables

#### `trading_sessions`
Weekly check-in sessions for trading activity.

```sql
- id: UUID (PK)
- user_id: UUID
- session_date: DATE
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `options_trades`
Individual options trades with full details.

```sql
- id: UUID (PK)
- session_id: UUID (FK to trading_sessions)
- user_id: UUID
- trade_date: DATE
- ticker_symbol: VARCHAR(10)
- option_type: VARCHAR(4) ('CALL' | 'PUT')
- action: VARCHAR(4) ('BUY' | 'SELL')
- strike_price: DECIMAL(10,2)
- premium_per_contract: DECIMAL(10,2)
- number_of_contracts: INTEGER
- expiration_date: DATE
- delta: DECIMAL(5,4) (nullable) -- Greeks data if available
- status: VARCHAR(20) ('OPEN' | 'CLOSED' | 'EXPIRED' | 'ASSIGNED')
- closing_date: DATE (nullable)
- closing_premium: DECIMAL(10,2) (nullable)
- realized_pl: DECIMAL(10,2) (nullable)
- trade_rationale: TEXT
- framework_notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `trading_chat_messages`
AI conversation history for each session.

```sql
- id: UUID (PK)
- session_id: UUID (FK to trading_sessions)
- user_id: UUID
- role: VARCHAR(10) ('user' | 'assistant')
- content: TEXT
- created_at: TIMESTAMP
```

### Indexes
- `idx_trading_sessions_user_date` on (user_id, session_date DESC)
- `idx_options_trades_session` on (session_id)
- `idx_options_trades_user_date` on (user_id, trade_date DESC)
- `idx_options_trades_status` on (status)
- `idx_chat_messages_session` on (session_id, created_at)

## Architecture

### Services Layer

#### `TradingService`
Handles all trading-related data operations:
- `createSession(userId, date, notes)` - Start new trading session
- `getSessionById(id)` - Get session details
- `getAllSessions(userId)` - Get user's sessions
- `createTrade(tradeData)` - Record new trade
- `updateTrade(id, updates)` - Update existing trade
- `closeTrade(id, closingData)` - Close trade with P&L
- `getTrades(filters)` - Get trades with filtering
- `getTradeById(id)` - Get single trade
- `deleteTrade(id)` - Remove trade
- `calculateSessionPL(sessionId)` - Calculate session P&L
- `calculateTotalPL(userId)` - Calculate cumulative P&L
- `saveChatMessage(sessionId, role, content)` - Save chat message
- `getChatHistory(sessionId)` - Get session chat messages

#### `ClaudeAPIService`
Handles Claude API integration:
- `sendMessage(messages, systemPrompt)` - Send message to Claude
- `buildTradingSystemPrompt(framework, tradeHistory)` - Build context
- `streamResponse(messages, onChunk)` - Stream AI responses (optional)

### Components

#### `ChatInterface`
- Message display (user + AI messages)
- Input field for user messages
- Loading states during API calls
- Auto-scroll to latest message
- Timestamp display

**Props:**
- `sessionId: string`
- `messages: ChatMessage[]`
- `onSendMessage: (content: string) => Promise<void>`
- `isLoading: boolean`

#### `TradeForm`
- Form fields for trade details
- Ticker, option type, action, strike, premium, contracts, delta
- Expiration date picker
- Trade rationale text area
- Framework notes field
- **Screenshot upload area** (drag & drop or file picker, temporary only)
- **AI extraction button** - sends image to Claude Vision API, extracts trade data, fills form
- **Loading state during AI analysis**
- **No screenshot persistence** - images processed and discarded
- Submit and cancel actions

**Props:**
- `sessionId: string`
- `trade?: Trade` (for editing)
- `onSave: (trade: Trade) => void`
- `onCancel: () => void`
- `onScreenshotAnalyze: (file: File) => Promise<TradeData>`

#### `TradeTable`
- Display all trades in table format
- Columns: Date, Ticker, Type, Action, Strike, Premium, Contracts, Delta, Expiration, Status, P&L
- Row actions: Edit, Close, Delete
- Status badges with colors
- Sort by columns
- Filter by status

**Props:**
- `trades: Trade[]`
- `onEdit: (trade: Trade) => void`
- `onClose: (trade: Trade) => void`
- `onDelete: (tradeId: string) => void`

#### `PLSummary`
- Display P&L metrics
- Per-trade breakdown
- Cumulative total
- Win/loss percentage
- Visual indicators (green/red)

**Props:**
- `trades: Trade[]`
- `cumulativePL: number`

### API Routes

#### `POST /api/trading/chat`
Send message to Claude API with trading context.

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "What strike should I sell?"}
  ],
  "sessionId": "uuid",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "message": "Based on your framework and recent trades...",
  "role": "assistant"
}
```

#### `POST /api/trading/extract-screenshot`
Extract trade details from screenshot using Claude Vision API.

**Request:**
```json
{
  "image": "base64-encoded-image-data",
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "tradeData": {
    "ticker": "AAPL",
    "optionType": "CALL",
    "action": "SELL",
    "strikePrice": 175,
    "premiumPerContract": 2.50,
    "numberOfContracts": 1,
    "expirationDate": "2025-12-20",
    "delta": -0.30
  },
  "confidence": "high"
}
```

### Main Page: `/src/app/trading/page.tsx`

**Layout:**
```
+----------------------------------+
|        Trading Tracker           |
|  Weekly Check-in: Nov 28, 2025   |
+----------------------------------+
|                |                 |
|   AI Chat      |  Trade Actions  |
|   Interface    |  + Add Trade    |
|   (left 50%)   |  + Close Trade  |
|                |                 |
|                |  P&L Summary    |
|                |  Total: +$XXX   |
|                |                 |
+----------------+-----------------+
|                                  |
|        Live Trade Table          |
|  All trades with status & P&L    |
|                                  |
+----------------------------------+
```

**Features:**
- Split view: Chat on left, actions/summary on right
- Trade table below (full width)
- Responsive: Stack vertically on mobile
- Real-time updates when trades added/updated
- Session selector dropdown

## Implementation Tasks

### Phase 1: Database & Types
- [ ] Create `scripts/add-trading-schema.sql` with table definitions
- [ ] Add RLS policies (DISABLED for private system - permissive access)
- [ ] Run migration on Supabase
- [ ] Add table constants to `src/lib/supabase.ts`
- [ ] Create TypeScript types in `src/types/database.ts`

### Phase 2: Services
- [ ] Implement `TradingService` in `src/services/TradingService.ts`
- [ ] Test CRUD operations for sessions, trades, messages
- [ ] Implement P&L calculation methods

### Phase 3: Claude API Integration
- [ ] Create API route `src/app/api/trading/chat/route.ts` for text chat
- [ ] Create API route `src/app/api/trading/extract-screenshot/route.ts` for vision extraction
- [ ] Set up Claude API client with vision support
- [ ] Build system prompt with framework context
- [ ] Build vision extraction prompt to parse trading screenshots
- [ ] Test API integration (both text and vision)

### Phase 4: Components
- [ ] Build `ChatInterface` component
- [ ] Build `TradeForm` component with screenshot upload/extraction UI
- [ ] Build `TradeTable` component
- [ ] Build `PLSummary` component
- [ ] Create shared types and utilities

### Phase 5: Main Page
- [ ] Create `src/app/trading/page.tsx`
- [ ] Integrate all components
- [ ] Handle state management
- [ ] Add loading states and error handling
- [ ] Style with Tailwind CSS

### Phase 6: Testing & Refinement
- [ ] Test screenshot extraction with real Tasty Trade/OptionStrat screenshots
- [ ] Test AI chat responses with real trading scenarios
- [ ] Test P&L calculations with various trade scenarios
- [ ] End-to-end testing of full workflow (chat → screenshot → trade → table)
- [ ] Mobile responsiveness testing
- [ ] Polish UI/UX

## Environment Variables

Add to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Trading Framework Context

The AI system prompt should include:
- User's trading strategy/framework
- Risk management rules
- Typical strike selection criteria
- Win/loss history for pattern recognition
- Recent trade performance

Example system prompt structure:
```
You are a trading coach helping a user who follows [FRAMEWORK].

Framework rules:
- [Rule 1]
- [Rule 2]

Recent performance:
- Last 10 trades: X wins, Y losses
- Average P&L per trade: $XXX

When suggesting trades:
- Consider volatility and expiration
- Stay within risk parameters
- Encourage discipline and patience
```

## Success Criteria

1. User can have natural conversations with AI about trades
2. AI provides helpful suggestions based on framework and history
3. Trade recording is quick and intuitive
4. Live table updates immediately when trades are added
5. P&L calculations are accurate
6. Weekly check-ins feel structured but flexible
7. Mobile experience is smooth for on-the-go trading

## Future Enhancements

- [ ] Import trades from broker API
- [ ] Advanced analytics and charts
- [ ] Trade journal with screenshots
- [ ] Risk metrics (Greeks, probability)
- [ ] Performance benchmarking
- [ ] Export trade history to CSV
- [ ] Trading calendar view
- [ ] Push notifications for expirations

## Notes

- Follow existing patterns from `ExpenseService` and budget feature
- **RLS DISABLED**: This is a private system, disable RLS on all trading tables for simplicity
- Ensure Claude API calls are server-side only (via API route)
- Store chat history in database for continuity across sessions
- **Screenshots**: Process in-memory only (convert to base64, send to Claude Vision, extract data, discard image)
- No screenshot storage needed - data extraction is the goal, not image archival
- Consider rate limiting on Claude API calls (vision API can be expensive)
