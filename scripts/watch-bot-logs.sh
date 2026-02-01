#!/bin/bash
# Watch bot logs in real-time
# Run with: bash scripts/watch-bot-logs.sh

echo "Watching Telegram bot logs..."
echo "Send a message to James and watch for errors here"
echo "Press Ctrl+C to stop"
echo ""

tail -f /tmp/bot-dev.log | grep --line-buffered -E "(Error|Executing tool|Tool result|AI chat)"
