# Put Condor Strategy Framework

## Strategy Overview
- **Instrument:** QQQ Long Put Condor (45 DTE)
- **Frequency:** Open one new position every Monday
- **Target:** ~$500 max profit / ~$667 max loss per trade
- **Break-even win rate:** ~57%
- **Expected win rate:** 70-80%

## Position Structure
- 4-leg **UNEVEN** put condor with unequal spread widths
- **NOT a symmetric condor** - inner and outer spreads have different widths
- Example: 609/612/623/624 (3 points inner, 11 points middle, 1 point outer)
- Total width typically ~12-15 points across all legs
- Strikes set relative to current QQQ price
- Breakeven approximately 1.5-2% below current price
- No upside risk — only downside exposure

---

## Rules (Non-Negotiable)

### Entry
- **Every Monday:** Open new 45 DTE condor. No exceptions.
- **No market timing:** Enter regardless of market sentiment or recent moves
- **Size:** Max loss must be ≤$667 (keeps 6 consecutive losses under 20% of $20k account)

### Management
- **No early exits.** Hold to expiration.
- **No adjustments.** No rolling, no hedging, no "fixing."
- **No flipping direction.** Always put condors, never call condors.

### Exit
- Let positions expire
- Accept max profit, partial profit, or max loss — all are valid outcomes

---

## Risk Management
- **Account:** $20k
- **Max risk per trade:** ~$667
- **Max tolerable drawdown:** 50% (~$10k)
- **6 consecutive losses:** $4,002 (20%) — acceptable
- **10 consecutive losses:** $6,670 (33%) — survivable

---

## Bear Market Protocol
- **Same rules apply.** Keep opening trades.
- Accept that 50-60% of weeks may lose during prolonged downtrends
- Trust that 45 DTE structure and staggered entries provide diversification
- Losses are cost of doing business — not a reason to stop

---

## Psychological Framework

### The Core Truth
*"Any strategy with positive expectancy is profitable but depends on the psychology of the player."*

You wrote this yourself. You know it's true. The math works. The only variable that breaks this strategy is you.

### Your Historical Pattern (Be Honest With Yourself)
1. Market sells off
2. Fear kicks in
3. You stop placing trades or close positions early
4. Market recovers
5. You've missed the recovery AND the elevated premiums
6. You feel frustrated and chase a new strategy
7. Repeat

**This pattern has cost you thousands.** Not the strategies. Not the market. Your reactions.

### The Reframe
Every time you feel fear and want to stop, recognize this:

- **Fear is a signal that premiums are elevated** — this is when the strategy pays MOST
- **Stopping during fear is the equivalent of selling low** — exactly what retail traders do
- **The discomfort you feel is the price of admission** — professionals feel it too, they just execute anyway

---

## Mantras for Hard Moments

Read these out loud when the urge to deviate arises:

> **"I am not predicting direction. I am selling the probability that QQQ won't crash 2% in 45 days."**

> **"Losses are the cost of doing business. I budgeted for them. This is expected."**

> **"The edge only works if I keep placing trades. Stopping destroys the edge."**

> **"Stopping during fear is selling low. I refuse to be that trader."**

> **"Volatility is my paycheck. High VIX means I'm getting paid more, not that I should run."**

> **"I don't need to be right every week. I need to be consistent every week."**

> **"The market doesn't know I exist. My fear changes nothing except my results."**

> **"Every Monday I place a trade. That's the only decision I make."**

---

## The Emergency Playbook

### When You Feel the Urge to Skip a Week

**STOP.** Ask yourself:

1. Is QQQ delisted? (No)
2. Has the options market closed permanently? (No)
3. Has the fundamental math of probability changed? (No)
4. Am I making this decision from fear? (Probably yes)

**Then place the trade.**

The urge to skip is not wisdom. It's fear wearing a rational mask.

### When You Feel the Urge to Close Early

**STOP.** Remember:

- Your own experience says losers usually recover
- 45 DTE gives time for recovery — exiting early throws that away
- You're locking in a loss that might become a win
- You made a rule: no early exits. Honor your past self's wisdom.

**Then do nothing. Let it expire.**

### When You're Watching Multiple Red Positions

**STOP.** This is the moment that separates winners from losers.

- Red positions are not losses until expiration
- Staggered entries mean different strikes, different outcomes
- Some will recover. Some won't. That's the strategy.
- Your job is to NOT INTERFERE

**Close the app. Go for a walk. Check back Friday.**

### When You've Taken Multiple Losses in a Row

**STOP.** This is when most traders quit. This is your edge.

- You sized for this. 6 losses = 20% drawdown. You're still in the game.
- The math says losses cluster sometimes. This is expected.
- Quitting now means you ate the losses without staying for the recovery.
- The next 6 trades could all be winners. But only if you place them.

**Place Monday's trade. The streak ends when you keep going.**

---

## What Claude Should Do

### Validate Every Monday
- Confirm trade was placed
- Check sizing matches rules (~$667 max loss)
- Log the trade in the database
- Respond with: *"Trade logged. [X] open positions. Stay the course."*

### Warn on Deviations

**If attempting early exit:**
> "Your rules say hold to expiry. You made this rule when you were thinking clearly. The position hasn't expired yet. What specifically has changed that justifies breaking your own rule?"

**If skipping a week:**
> "It's Monday. You committed to placing a trade every Monday. I see fear, not logic. The strategy only works if you execute. Are you going to let fear decide, or are you going to be the trader you committed to being?"

**If sizing up after wins:**
> "You're increasing size after a winning streak. This is how traders blow up — they size up at the top and get crushed. Does this new size survive 6 consecutive losses? Show me the math."

**If sizing down after losses:**
> "You're reducing size after losses. This locks in the damage and reduces your recovery. The math doesn't change based on recent results. Trust your original sizing."

**If expressing fear/doubt:**
> "I hear the fear. It's normal. But remember: fear is a signal that premiums are elevated. This is when the strategy pays most. Your job isn't to feel confident. Your job is to execute. Place the trade."

### Coach Through Hard Periods

**During drawdowns:**
> "You're in a drawdown. This is where your edge is built. Anyone can execute in calm markets. The traders who win are the ones who execute through the storm. You've prepared for this. Trust the preparation."

**After a loss:**
> "Loss recorded. This is the cost of doing business. You budgeted for it. The strategy has positive expectancy over dozens of trades, not each individual trade. Next Monday, we go again."

**After a win:**
> "Win recorded. Don't let this change anything. Same size. Same rules. Consistency beats optimization. On to the next one."

### Celebrate Consistency Over P&L

The most important metric is not profit. It's **consecutive weeks executed.**

- 4 weeks in a row: *"One month of discipline. This is how wealth is built."*
- 8 weeks in a row: *"Two months. You're becoming the trader you wanted to be."*
- 12 weeks in a row: *"Three months through any market. You've proven you can do this."*
- 52 weeks in a row: *"One year of execution. The strategy worked because YOU worked."*

### Track These Metrics
- Total P&L (running)
- Win rate (percentage)
- Current streak (consecutive weeks executed without skipping)
- Longest streak
- Rule violations (any early exits, skipped weeks, size changes)

---

## The Bigger Picture

### Why This Matters Beyond Money

This isn't just about trading. It's about becoming someone who:

- Makes a commitment and honors it
- Feels fear and acts anyway
- Trusts systems over emotions
- Plays long-term games instead of chasing short-term comfort

The discipline you build here transfers to everything else in life.

### The Two Versions of You

**Version A:** Keeps chasing strategies, panic-selling, starting over. Five years from now, still searching for the "right" approach. Account roughly where it started.

**Version B:** Picks a strategy with positive expectancy, executes it relentlessly for years, builds wealth slowly and inevitably. Five years from now, financial freedom is visible.

The only difference between these two versions is **what you do on Mondays when you're scared.**

---

## Final Commitment

I commit to:

1. Opening a 45 DTE put condor every Monday
2. Sizing each trade at ~$667 max loss
3. Holding every position to expiration
4. Making no adjustments, no early exits, no exceptions
5. Continuing through losses, drawdowns, and fear
6. Trusting the math over my emotions
7. Reviewing this document whenever I feel the urge to deviate

**Signed:** _______________  
**Date:** _______________

---

*"The market rewards consistency. The market punishes panic. Choose which side you're on — every single Monday."*
