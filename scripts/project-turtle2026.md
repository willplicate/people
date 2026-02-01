# Project Turtle 2026: VIX-Based Trading Rulebook
## For CRM Trading Coach Implementation

---

## Daily Assessment Protocol

### Monday Morning Checklist (Coach asks these questions)

**1. Current Market Data**
```
Q: What is current SPY price? $______
Q: What is current VIX level? ______
Q: What was VIX level last Monday? ______ (calculate trend)
Q: What is VIX 4-week high? ______ (identify if declining from peak)
```

**2. Position Status**
```
Q: Current LEAPS delta? ______ (from broker)
Q: LEAPS DTE remaining? ______ days
Q: Strike price of LEAPS? $______
Q: Current cash reserves available? $______
```

**3. VIX Trend Calculation**
```
VIX Change = Current VIX - Last Week VIX
VIX Trend: [RISING / FLAT / DECLINING]

Peak Analysis:
Has VIX declined 10+ points from 4-week high? [YES / NO]
If YES → Recovery mode may be activating
```

---

## Phase Determination (Coach classifies current state)

### Phase Classification Matrix

| VIX Level | VIX Trend | Phase | Color Code |
|-----------|-----------|-------|------------|
| <20 | Any | NORMAL | 🟢 Green |
| 20-30 | Rising | ELEVATED STRESS | 🟡 Yellow |
| 20-30 | Declining | NORMALIZING | 🟢 Green |
| 30-40 | Rising | CRISIS DEVELOPING | 🟠 Orange |
| 30-40 | Declining >10pts from peak | RECOVERY BEGINNING | 🔵 Blue |
| 40-50 | Rising | PANIC | 🔴 Red |
| >50 | Rising | EXTREME PANIC | ⚫ Black |
| >40 | Declining >10pts from peak | RECOVERY MODE | 🔵 Blue |

**Coach Output:**
```
PHASE: [Phase Name]
STATUS: [Color Code]
RECOMMENDATION: See Phase-Specific Actions Below
```

---

## Phase-Specific Trading Rules

### 🟢 PHASE: NORMAL (VIX <20)

**Conditions:**
- VIX below 20
- Market operating normally
- Low institutional stress

**Actions:**
```
✅ SELL WEEKLY CALL
   Strike: $10 OTM from current SPY price
   DTE: 5-7 days (Friday expiration)
   Expected Premium: $180-250

✅ DELTA CHECK
   If delta <0.72 → ROLL REQUIRED
   If delta 0.72-0.80 → ROLL RECOMMENDED
   If delta >0.80 → Continue normally

✅ POSITION SIZE
   Normal deployment: 40-50% of capital
   No scaling needed
```

**Coach Questions:**
```
1. "Current SPY is $___. Your strike should be $___. Confirm you're selling the [strike] call?"
2. "What premium did you collect? $____"
3. "Current LEAPS delta is ___. [GREEN/YELLOW/RED based on >0.80/0.72-0.80/<0.72]"
```

---

### 🟡 PHASE: ELEVATED STRESS (VIX 20-30, Rising)

**Conditions:**
- VIX climbing from normal levels
- Market stress developing
- Premiums beginning to elevate

**Actions:**
```
✅ SELL WEEKLY CALL (Adjusted Strike)
   VIX 20-25: Sell $5-7 OTM
   VIX 25-30: Sell $2-5 OTM
   Expected Premium: $300-450

✅ ROLLING PROTOCOL ACTIVE
   Monitor delta closely
   If delta <0.72:
      - Check cash reserves: $____
      - If reserves >$3,000 → ROLL DOWN
      - If reserves <$3,000 → ALERT: Low reserves
   
   Roll Target: Restore delta to 0.85+
   Expected Cost: $2,000-3,500

✅ RESERVE MANAGEMENT
   Track rolls executed this month: ___
   Remaining rolling capacity: $____
   Alert if <$6,000 (only 2 rolls left)
```

**Coach Questions:**
```
1. "VIX is at ___. Recommended strike: $___  [X] OTM. Confirm?"
2. "Premium collected: $____"
3. "LEAPS delta check: ___"
   IF <0.72:
      "Cash reserves: $_____"
      "Roll cost estimate: $2,500. Proceed with roll? [YES/NO]"
      IF YES: "Log roll - Old strike: $___ → New strike: $___, Cost: $___"
4. "Rolling capacity remaining: $_____"
```

---

### 🟠 PHASE: CRISIS DEVELOPING (VIX 30-40, Rising)

**Conditions:**
- VIX persistently above 30 and climbing
- Market in crisis mode
- Institutional panic building
- SPY likely down 20-35%

**Actions:**
```
✅ SELL ITM CALLS (Protection Mode)
   VIX 30-35: Sell ATM to 2 ITM
   VIX 35-40: Sell 2-5 ITM
   Expected Premium: $500-700

⚠️ ROLLING CAPACITY CHECK
   IF cash reserves >$5,000:
      → Continue rolling protocol when delta <0.72
   
   IF cash reserves <$5,000:
      → ALERT: "Low rolling capacity"
      → Consider stopping rolls, accept lower delta
      → Focus on ITM call protection

✅ PREMIUM HARVEST MODE
   This is maximum income opportunity
   ITM calls will expire worthless during continued decline
   Protection is paramount over opportunity cost

⚠️ WATCH FOR VIX REVERSAL
   Track VIX daily
   If VIX declines >5 points from recent high → Review phase
```

**Coach Questions:**
```
1. "⚠️ CRISIS MODE ACTIVE ⚠️"
2. "VIX at ___. Sell [X] ITM call at strike $___ [X points ITM]"
3. "Expected premium: $500-700. Actual collected: $____"
4. "Cash reserves status: $____"
   IF <$5,000:
      "⚠️ LOW RESERVES - Consider accepting current delta"
5. "Current LEAPS delta: ___"
   IF <0.65:
      "⚠️ Delta degraded. Can you afford $3,000 roll? [YES/NO]"
      IF NO: "Accepting lower delta. ITM selling now critical for protection."
6. "Track VIX for reversal. Yesterday: ___, Today: ___, Change: ___"
```

---

### 🔴 PHASE: PANIC (VIX 40-50, Rising)

**Conditions:**
- Extreme fear
- VIX above 40 and rising
- Market potentially down 30-45%
- Rare event (2-3% of trading days)

**Actions:**
```
⚠️ CRITICAL: CHECK VIX DIRECTION FIRST

IF VIX STILL RISING:
   ✅ SELL DEEP ITM CALLS
      Sell 5-10 ITM
      Premium: $800-1,200
      Maximum protection mode
      Accept all opportunity cost
   
   ⚠️ ROLLING LIKELY EXHAUSTED
      If you still have cash: Roll when needed
      If cash depleted: Hold position, rely on ITM protection
   
   ✅ DAILY VIX MONITORING
      This phase doesn't last long
      Watch for VIX peak

IF VIX DECLINING FROM PEAK (>10 points down):
   🔵 SWITCH TO RECOVERY MODE (see below)
   This is critical transition point
```

**Coach Questions:**
```
1. "🔴 EXTREME PANIC ACTIVE 🔴"
2. "VIX current: ___, 4-week high: ___, Decline from peak: ___ points"
3. "VIX trend: [RISING / DECLINING]"

IF RISING:
   4a. "Sell ___ ITM call at strike $___"
   5a. "Expected premium $800-1,200. Actual: $____"
   6a. "Cash reserves: $____"
   7a. "LEAPS delta: ___. [ACCEPT CURRENT LEVEL if can't roll]"
   8a. "Continue deep ITM selling until VIX reverses"

IF DECLINING >10 points:
   4b. "⚠️ VIX REVERSAL DETECTED ⚠️"
   5b. "Switch to RECOVERY MODE - see blue protocol"
```

---

### 🔵 PHASE: RECOVERY MODE (VIX Declining 10+ Points from Peak)

**Conditions:**
- VIX has peaked and is declining
- VIX down 10+ points from 4-week high
- Market may still be down 30-40% but fear subsiding
- Recovery rally imminent or beginning

**Actions:**
```
🛑 STOP SELLING CALLS IMMEDIATELY

Critical Reasoning:
- Recovery rallies from bottoms are VIOLENT
- Your delta is likely compromised (0.55-0.70 range)
- Short calls will cost more than LEAPS gains
- You NEED uncovered exposure to recover LEAPS value

✅ GO NAKED
   - Let existing short call expire (if any)
   - DO NOT open new short positions
   - Accept extrinsic decay cost ($60-70/week)
   - This is temporary (2-6 weeks typically)

✅ MONITOR RECOVERY PROGRESS
   Track weekly:
   - LEAPS value recovery
   - VIX continued decline
   - SPY recovery percentage
   - LEAPS delta improvement

⏱️ RESUMPTION CRITERIA
   When VIX drops below 30:
      → Begin gradual resumption (see Normalizing phase)
```

**Coach Questions:**
```
1. "🔵 RECOVERY MODE ACTIVE 🔵"
2. "VIX peaked at ___, now at ___, declined ___ points"
3. "⚠️ DO NOT SELL CALLS THIS WEEK ⚠️"
4. "Confirm you are going NAKED: [YES/NO]"
   IF NO: "⚠️ WARNING: This violates recovery protocol. Reason?"
5. "Current LEAPS value: $____"
6. "Weekly extrinsic decay: ~$70. Accepted cost for recovery exposure."
7. "Monitor for resumption: VIX ___ (target: below 30 to resume)"
8. "Estimated recovery duration: 2-6 weeks"
```

---

### 🟢 PHASE: NORMALIZING (VIX 20-30, Declining)

**Conditions:**
- VIX declining from elevated levels
- Market stabilizing
- Fear subsiding
- Transition back to normal operations

**Actions:**
```
✅ GRADUAL RESUMPTION OF SELLING

VIX 25-30 (early normalization):
   - Sell $15-20 OTM (very wide)
   - Premium: $250-400
   - Goal: Ease back in, avoid whipsaw

VIX 20-25 (mid normalization):
   - Sell $10-15 OTM
   - Premium: $200-300
   - Standard cushion returning

VIX <20 (normalized):
   - Return to full normal protocol
   - Sell $10 OTM
   - Switch to GREEN phase

✅ DELTA RESTORATION
   As SPY recovers, delta should improve
   If delta >0.80: Resume normal operations fully
   If delta still <0.75: Continue conservative (wider OTM)
```

**Coach Questions:**
```
1. "🟢 NORMALIZATION IN PROGRESS"
2. "VIX at ___. [Declining from ___ high]"
3. "Recommended strike: $___ ([X] OTM based on VIX level)"
4. "Expected premium: $___-$___. Actual collected: $____"
5. "LEAPS delta: ___"
   IF >0.80: "✅ Delta restored. Return to normal $10 OTM next week."
   IF <0.75: "⚠️ Delta still recovering. Continue conservative OTM."
6. "Track VIX for full normalization (target <20)"
```

---

## Special Protocols

### ROLLING PROTOCOL

**When to Roll:**
```
IF delta <0.72 AND cash_reserves >$3,000:
   → ROLL REQUIRED

IF delta 0.72-0.80 AND cash_reserves >$5,000:
   → ROLL RECOMMENDED (optimize positioning)

IF delta >0.80:
   → NO ROLL NEEDED
```

**How to Execute Roll:**
```
1. Current position:
   Strike: $___
   Delta: ___
   Value: $___

2. Roll target:
   New strike: $___ (aim for 12-15% ITM)
   Target delta: 0.85+
   DTE: Same expiration or extend if <150 DTE

3. Cost calculation:
   Sell current: $___
   Buy new: $___
   Net cost: $___
   
4. Confirm cash available: $___
   
5. Execute if approved
```

**Coach Roll Questions:**
```
1. "Roll trigger: Delta at ___ (<0.72)"
2. "Cash reserves: $___ (need $3,000+ to proceed)"
3. "Current LEAPS: $___ strike, $___ value"
4. "Recommended new strike: $___ (will restore delta to 0.85)"
5. "Estimated roll cost: $2,500-3,500"
6. "Approve roll? [YES/NO]"
   IF YES:
      "Log roll execution:"
      "- Old position: $___ strike, sold for $___"
      "- New position: $___ strike, bought for $___"
      "- Net cost: $___"
      "- Cash reserves after: $___"
```

---

## Capital Reserve Tracking

### Reserve Structure (Per Contract)

```
Total Capital per Contract: $24,000
├── LEAPS Deployment: $12,000
├── Rolling Reserve: $10,000 (for delta maintenance)
└── Safety Buffer: $2,000 (absolute minimum)
```

**Reserve Alerts:**
```
IF rolling_reserve >$8,000: 🟢 "Healthy reserves"
IF rolling_reserve $5,000-8,000: 🟡 "Moderate reserves - 2-3 rolls left"
IF rolling_reserve $3,000-5,000: 🟠 "Low reserves - 1-2 rolls left"
IF rolling_reserve <$3,000: 🔴 "Critical - Cannot roll. Must accept lower delta"
```

**Coach Reserve Questions (Weekly):**
```
1. "Current cash reserves: $____"
2. "Rolls executed this month: ___"
3. "Reserve status: [GREEN/YELLOW/ORANGE/RED]"
4. "Estimated rolls available: ___ (at $3,000 each)"
```

---

## Emergency Protocols

### CIRCUIT BREAKER: LEAPS DTE <90 Days

```
⚠️ CRITICAL ALERT ⚠️
LEAPS expiring in ___ days (<90 threshold)

Required Action:
1. Evaluate current position:
   - Net premium collected to date: $___
   - Current LEAPS value: $___
   - Total position P&L: $___

2. Decision tree:
   IF total_PnL >0 AND delta <0.60:
      → CLOSE POSITION, preserve gains
   
   IF total_PnL >0 AND delta >0.70:
      → ROLL to new LEAPS (240-300 DTE)
   
   IF total_PnL <0 AND delta >0.65:
      → HOLD, attempt recovery, consider roll if cash available
   
   IF total_PnL <0 AND delta <0.60:
      → EVALUATE: Is recovery possible in remaining time?
         IF unlikely: Close and preserve capital
         IF possible: Hold to expiry
```

---

### CIRCUIT BREAKER: VIX >70 (Black Swan)

```
⚫ BLACK SWAN EVENT ⚫
VIX above 70 (March 2020 territory)

Actions:
1. 🛑 STOP ALL NEW SELLING immediately
2. 📊 Calculate total position:
   - All premiums collected: $___
   - Current LEAPS value: $___
   - Net position: $___

3. Decision:
   IF net_positive:
      → Consider closing entire position, preserve gains
   
   IF net_negative BUT small (<10%):
      → HOLD naked, wait for VIX peak
   
   IF net_catastrophic (>30% loss):
      → Evaluate if recovery possible with remaining DTE
      → If DTE >180: HOLD
      → If DTE <180: Consider exit

4. NO NEW POSITIONS until VIX <50
```

---

## Data Logging Requirements

### Monday Execution Log

```
Date: ____-__-__
SPY Price: $____
VIX Level: ____
VIX Trend: [RISING / FLAT / DECLINING]
VIX Peak (4-week): ____
Phase: [Name]

LEAPS Status:
- Strike: $____
- Delta: ____
- DTE: ___ days
- Value: $____

Action Taken:
- [ ] Sold call at $____ strike ([X] ITM/ATM/OTM)
- [ ] Premium collected: $____
- [ ] Rolled LEAPS (old: $___, new: $___, cost: $___)
- [ ] NO ACTION (Recovery mode)
- [ ] Other: __________

Cash Reserves: $____
Compliance: [GREEN / YELLOW / RED]
Notes: __________
```

---

### Monthly Review Template

```
Month: ______ Year: ______

Performance:
- Weeks traded: ___
- Total premium collected: $____
- Roll costs incurred: $____
- Net premium (collected - costs): $____
- LEAPS value change: $____ → $____ (Change: $____)
- Total account P&L: $____

VIX Summary:
- Average VIX: ____
- Highest VIX: ____
- Lowest VIX: ____
- Phases encountered: __________

Rule Compliance:
- Violations: ___
- If any, details: __________

Lessons Learned:
- What worked: __________
- What needs improvement: __________
- Adjustments for next month: __________
```

---

## Coach Decision Tree (Flowchart Logic)

```
START: Monday Morning
│
├─ Collect Data
│  ├─ SPY price
│  ├─ VIX current & trend
│  ├─ LEAPS delta & DTE
│  └─ Cash reserves
│
├─ Determine Phase
│  ├─ Calculate VIX classification
│  ├─ Check VIX trend direction
│  └─ Assign phase & color code
│
├─ Execute Phase Protocol
│  ├─ Display phase-specific rules
│  ├─ Calculate recommended strike
│  ├─ Check special conditions
│  │  ├─ Delta <0.72? → Roll protocol
│  │  ├─ DTE <90? → Emergency protocol
│  │  └─ VIX >70? → Black swan protocol
│  │
│  └─ Present recommendation
│
├─ User Execution
│  ├─ Confirm action taken
│  ├─ Log actual strike & premium
│  └─ Update reserve tracking
│
├─ Compliance Check
│  ├─ Did action match recommendation?
│  ├─ If deviation: Log reason
│  └─ Alert if pattern of violations
│
└─ Log & Close
   ├─ Save to database
   ├─ Update monthly tracking
   └─ Schedule next Monday check
```

---

## Integration Notes for CRM

**Required Database Fields:**
```sql
-- Market Data
vix_current DECIMAL
vix_last_week DECIMAL
vix_peak_4week DECIMAL
spy_price DECIMAL
market_phase VARCHAR(50)
phase_color VARCHAR(10)

-- Position Data
leaps_strike DECIMAL
leaps_delta DECIMAL
leaps_dte INTEGER
leaps_value DECIMAL
cash_reserves DECIMAL

-- Weekly Trade
trade_date DATE
action_type VARCHAR(50)
call_strike DECIMAL
call_premium DECIMAL
otm_distance DECIMAL

-- Compliance
rule_followed BOOLEAN
deviation_reason TEXT
```

**Coach Triggers:**
```javascript
// Monday morning notification
if (today.dayOfWeek === 1 && time === '09:00') {
  triggerCoachSession('weekly_execution');
}

// VIX spike alert
if (vix_change > 5 in single day) {
  triggerAlert('vix_spike', 'Review phase classification');
}

// Delta degradation
if (leaps_delta < 0.72) {
  triggerAlert('roll_required', 'Delta below threshold');
}

// DTE warning
if (leaps_dte < 120) {
  triggerAlert('dte_warning', 'Consider rolling LEAPS');
}