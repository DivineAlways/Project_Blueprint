# 🏛️ Architectural Decision Records (ADR)

This document tracks the *Why* behind the project's engineering decisions. Use it to prevent "Architectural Amnesia."

## DECISION-001: [Title of Decision]
- **Status:** Proposed | Accepted | Deprecated
- **Context:** Brief description of the problem/situation.
- **Decision:** What was chosen and why?
- **Consequences:** What are the trade-offs (Pros/Cons)?

---
*Example Entry:*
## DECISION-002: Decision-Support Only Constraint
- **Status:** Accepted
- **Context:** Trading apps often lead to emotional gambles; we want to prevent this.
- **Decision:** Strictly avoid any buy/sell execution buttons in the primary UI.
- **Consequences:** + Higher trust, + Lower risk, - Slightly lower immediate engagement.
