# AI-PM Workflow: The "One System" Loop

This document outlines how to use the Universal AI-PM Dashboard to build and manage any project with Antigravity agents.

## 1. Setup the Command Center
Use the **Notion AI Prompt** in [Implementation Plan](file:///home/lpch/.gemini/antigravity/brain/207eb754-bf25-4051-8903-e857bc59f092/implementation_plan.md) to set up your Notion databases.

## 2. Idea Initiation
Create a new entry in the **Project Master** database.
- Use the **New Project Blueprint** template in Notion (or reference [this file](file:///home/lpch/doc-ai/trading_agent_icc/docs/blueprints/new_project_blueprint.md)).
- Fill in the **Mission, Schema, and Logic**.

## 3. Autonomous Sync
Run the sync script to bridge your idea to the development environment.
```bash
npx ts-node scripts/workflow/sync_notion_to_github.ts
```
This creates a GitHub Issue that contains all project meta-data (Tech Stack, Priority, DoD).

## 4. Agentic Execution
The AI agent (me) picks up the GitHub Issue and:
1.  **Drafts** an `implementation_plan.md`.
2.  **Implements** the code (SQL, Python, React).
3.  **Verifies** the build using `bash scripts/verify_build.sh`.

## 5. Self-Correction Loop
If errors are found:
- The `agents/project_manager_agent.py` analyzes the `VERIFICATION_REPORT.md`.
- It identifies failing files and attempts to fix them automatically.
- It re-runs the verification until the build passes.

## 6. Deployment
Once verified, the AI agent updates the "Done" status and prepares the walkthrough.
