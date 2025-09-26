# Project Turtle - LEAPS Trading System Specification

## Overview
A comprehensive web application for managing multiple LEAPS positions with weekly covered call strategies. The system tracks position health, provides symbol-specific trading recommendations, and monitors P&L across multiple positions with different underlyings.

## Core Architecture

### Database Schema

#### Positions Table
```sql
- id (primary key)
- position_name (e.g., "Tasty IWM LEAPS", "IB SPY LEAPS 1")
- symbol (SPY, IWM, QQQ, etc.)
- leaps_strike
- leaps_expiry
- leaps_cost_basis
- current_value
- current_delta
- contracts (number of contracts)
- status (active, closed, called_away)
- created_at
- updated_at
```

#### Trades Table
```sql
- id
- position_id (foreign key)
- trade_date
- action (sell, buy_to_close, roll_call, assignment)
- strike
- premium (collected for sells, paid for closes)
- expiry
- notes
- created_at
```

#### Market Data Table
```sql
- id
- symbol
- price
- ema21
- ema50
- rsi
- vix (for SPY only)
- timestamp
- last_api_update
```

#### Assignments Table
```sql
- id
- position_id
- trade_id (original short call)
- assignment_date
- assignment_type (stock_assigned, expires_worthless, leaps_called_away)
- spy_price_at_assignment
- pnl_impact
- notes
```

## Key Features

### 1. Multi-Position Dashboard
- **Position Cards**: Each active LEAPS displays in separate card with:
  - Position name and symbol
  - Current LEAPS value vs cost basis
  - Health indicator (traffic light + days to expiry)
  - Active short call details
  - Weekly P&L breakdown
- **Portfolio Summary**: Combined metrics across all positions

### 2. Market Data Management
- **API Integration**: Alpha Vantage for real-time pricing
- **Rate Limiting**: Manual refresh buttons to control API usage
- **Symbol-Specific Data**: Each underlying gets independent market analysis
- **Fallback Data**: Manual entry when API unavailable

### 3. Position Health Monitoring

#### Traffic Light System
- **🟢 Green**: Delta >75%, DTE >120 days, adequate cushion
- **🟡 Yellow**: Delta 70-75%, DTE 90-120 days, or cushion concerns  
- **🔴 Red**: Delta <70%, DTE <90 days, or strike too close to current price

#### Health Metrics Display
```
🟢 144 days to expiry
Delta: 82% ✅
Cushion: $47 ✅
```

### 4. Recommendation Engine

#### Market State Analysis (Per Symbol)
Calculate for each underlying:
- **EMA Positioning**: Price vs EMA21, EMA50
- **RSI Level**: Current RSI (14-period)
- **VIX Level**: For volatility context (SPY only, apply logic to others)
- **Recent Performance**: Up weeks in last 8

#### Strike Recommendation Logic
```javascript
function getStrikeRecommendation(symbol, marketData) {
    const state = analyzeMarketState(symbol, marketData);
    
    switch(state) {
        case "STRONG_BULL": // Price > EMA50, RSI 40-65, recent strength
            return { strike: "2 OTM", reasoning: "Capture upside in trending market" };
            
        case "BULL": // Price > EMA21, mixed signals
            return { strike: "ATM", reasoning: "Balanced approach for steady conditions" };
            
        case "NEUTRAL": // Mixed technical signals
            return { strike: "1 ITM", reasoning: "Slight protection in uncertain conditions" };
            
        case "BEARISH": // Price < EMA21, RSI declining
            return { strike: "2-3 ITM", reasoning: "Protection mode during weakness" };
            
        case "CORRECTION": // Major breakdown
            return { strike: "NO SELL", reasoning: "Wait for stability" };
    }
}
```

### 5. P&L Tracking System

#### Weekly P&L Breakdown
For each position, separate tracking of:
- **Premium Collection**: Net from sells minus buy-to-close
- **LEAPS Value Change**: Current value vs previous week
- **Combined Weekly P&L**: Total position change

#### Position Lifecycle Tracking
- **Opening**: Record initial LEAPS purchase
- **Rolling**: Continuation of same position with new parameters
- **Closing**: Final P&L calculation including all premiums

### 6. Assignment Management

#### Expiry Resolution Workflow
When short call expires, system prompts for outcome:
1. **Stock Assigned**: 
   - Create short stock position record
   - Continue tracking until stock covered
2. **Expires Worthless**:
   - Pure profit, LEAPS remains active
   - Ready for next weekly call
3. **LEAPS Called Away**:
   - Calculate final position P&L
   - Close position record

### 7. Trading Interface

#### Weekly Call Actions
- **Sell Call**: Record new weekly short
- **Buy to Close**: Record premium paid to close
- **Roll Call**: Combined close/sell transaction
- **Let Expire**: Mark for assignment resolution

#### LEAPS Management
- **Roll LEAPS**: Update strike/expiry, continue tracking
- **Update Values**: Manual refresh when API limited
- **Close Position**: Final P&L calculation

## Technical Requirements

### Frontend
- **Responsive Design**: Mobile-first dashboard
- **Real-time Updates**: Live position values when API available
- **Chart Integration**: Basic price/indicator visualization
- **Export Capability**: CSV export for tax reporting

### Backend
- **API Management**: Rate-limited Alpha Vantage integration
- **Database**: PostgreSQL or SQLite for position tracking
- **Authentication**: Simple login for multi-user scenarios
- **Backup**: Regular position data exports

### API Integration
- **Alpha Vantage Endpoints**:
  - `GLOBAL_QUOTE` for current prices
  - `RSI` for momentum indicators  
  - `EMA` for trend analysis
- **Rate Limiting**: Maximum 5 calls per minute
- **Error Handling**: Graceful degradation to manual entry

## User Workflows

### Daily Routine
1. **Morning Check**: Review all position health indicators
2. **Market Analysis**: Check symbol-specific recommendations
3. **Action Items**: Execute suggested weekly calls or LEAPS maintenance

### Weekly Routine
1. **Expiry Management**: Resolve expiring calls
2. **New Call Sales**: Execute weekly recommendations
3. **P&L Review**: Analyze weekly performance by position

### Monthly Routine
1. **Position Health**: Deep review of LEAPS parameters
2. **Performance Analysis**: Month-over-month comparisons
3. **Strategy Adjustments**: Modify based on market regime changes

## Success Metrics

### Position Level
- **Weekly Premium Collection**: Target $300-500 per position
- **LEAPS Health Score**: Maintain >80% of positions in green
- **Assignment Rate**: Track frequency and outcomes

### Portfolio Level
- **Combined Weekly Income**: Sum across all positions
- **Risk-Adjusted Returns**: Premium collection vs LEAPS volatility
- **Capital Efficiency**: Returns per dollar deployed

## Risk Management

### Automated Alerts
- **Health Deterioration**: When positions move to yellow/red
- **Expiry Approach**: 7-day warnings for LEAPS <90 DTE
- **Delta Warnings**: When delta drops below 72%

### Position Limits
- **Maximum Positions**: Practical limit of 5 active LEAPS
- **Symbol Concentration**: No more than 60% in single underlying
- **Capital Deployment**: Track total capital vs available reserves

This specification provides the foundation for a comprehensive turtle trading system that maintains the disciplined, systematic approach while scaling across multiple positions and market conditions.