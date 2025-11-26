<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0 (initial creation)
Modified principles: N/A (initial creation)
Added sections:
  - Project Identity
  - Core Principles (5 principles)
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md: pending creation
  - .specify/templates/spec-template.md: pending creation
  - .specify/templates/tasks-template.md: pending creation
Follow-up TODOs: None
-->

# ScrumKit Constitution

## Project Identity

**Name:** ScrumKit
**Purpose:** A suite of tools that help Scrum teams conduct effective Scrum events
**Core Features:**
- Planning Poker - for sprint planning estimation sessions
- Retro Board - for retrospective meetings

**Tech Stack:** Vue 3, TypeScript, Vite

## Core Principles

### Principle 1: Team-First Design

All features MUST prioritize team collaboration over individual use. Tools are designed
for real-time, multi-participant sessions where every team member's input matters equally.

**Rationale:** Scrum ceremonies are fundamentally collaborative. A tool that doesn't
facilitate equal participation undermines the Scrum framework.

### Principle 2: Session Simplicity

Starting a Scrum session MUST require no more than 2 clicks for the facilitator and
1 click for participants to join. No account creation required for basic functionality.

**Rationale:** Ceremony time is limited. Setup friction steals valuable discussion time
and discourages tool adoption.

### Principle 3: Real-Time Synchronization

All participant actions MUST reflect across all connected clients within 500ms under
normal network conditions. State MUST remain consistent even with intermittent
connectivity.

**Rationale:** Planning poker reveals and retro voting lose their purpose if participants
see stale data or out-of-sync state.

### Principle 4: Iteration-First Development

Every code change MUST be easy to modify, extend, or remove without cascading effects.
Prefer small, incremental changes over large rewrites. Avoid tight coupling.

**Rationale:** Product requirements evolve rapidly. The codebase must support fast
iteration cycles.

### Principle 5: Minimal Viable Complexity

Features MUST NOT include configuration options, abstractions, or extensibility until
concrete use cases demand them. Delete unused code immediately.

**Rationale:** Scrum tools should be intuitive. Over-engineering creates maintenance
burden and confuses users.

## Governance

### Amendment Procedure

1. Propose changes via PR with rationale in description
2. At least one team member review required
3. Update version according to semantic versioning rules below
4. Update dependent templates if principles change

### Versioning Policy

- **MAJOR:** Backward-incompatible principle removals or fundamental redefinitions
- **MINOR:** New principle added or existing principle materially expanded
- **PATCH:** Clarifications, wording improvements, non-semantic refinements

### Compliance Review

Before merging any feature PR, verify alignment with Core Principles. Document any
intentional deviations with justification.

---

**Constitution Version:** 1.0.0
**Ratification Date:** 2025-11-26
**Last Amended Date:** 2025-11-26
