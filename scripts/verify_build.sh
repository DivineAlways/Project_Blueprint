#!/bin/bash

# Universal Verification Script
# This script runs build checks and generates a report for the AI agent.

REPORT_FILE="VERIFICATION_REPORT.md"
echo "# 🛠 Verification Report" > $REPORT_FILE
echo "Timestamp: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# 1. Linting
echo "## 🔍 Linting" >> $REPORT_FILE
if [ -f "package.json" ]; then
    echo "Running npm run lint..." >> $REPORT_FILE
    npm run lint >> $REPORT_FILE 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Linting passed." >> $REPORT_FILE
    else
        echo "❌ Linting failed." >> $REPORT_FILE
    fi
else
    echo "⚠️ No package.json found, skipping lint." >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 2. Python Checks
echo "## 🐍 Python Logic" >> $REPORT_FILE
if [ -d "agents" ] && [ "$(ls -A agents/*.py 2>/dev/null)" ]; then
    echo "Checking agent syntax..." >> $REPORT_FILE
    for f in agents/*.py; do
        python3 -m py_compile "$f" >> $REPORT_FILE 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ $f: Syntax OK" >> $REPORT_FILE
        else
            echo "❌ $f: Syntax Error" >> $REPORT_FILE
        fi
    done
else
    echo "⚠️ No Python agents found, skipping check." >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# 3. Supabase Checks
echo "## ⚡ Supabase" >> $REPORT_FILE
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
    echo "Checking migrations..." >> $REPORT_FILE
    # Simple syntax check for SQL files
    for f in supabase/migrations/*.sql; do
        if grep -q "ERROR" "$f"; then
            echo "❌ $f: Potential error found" >> $REPORT_FILE
        else
            echo "✅ $f: Checked" >> $REPORT_FILE
        fi
    done
else
    echo "⚠️ No migrations found, skipping check." >> $REPORT_FILE
fi

echo "" >> $REPORT_FILE
echo "---" >> $REPORT_FILE
echo "Report generated at $REPORT_FILE"
