# UX4G Civic & Blockchain Voting UX Patterns

This reference specifies user interaction patterns designed for digital voting, student council elections, and public cryptographic verification systems.

---

## 1. Election Lifecycle States

Elections transition through distinct phases. The UX must communicate the current status clearly:

| Phase | Visual Indicator | Primary User Action | Accessibility Announcement |
| :--- | :--- | :--- | :--- |
| **Upcoming / Staged** | Blue Outline Badge | "View Candidate Manifestos" (Vote button disabled with countdown) | "Election scheduled to open on [Date]" |
| **Active / Live** | Green Pulsing Badge (`#107E3E`) | "Cast Ballot" | "Election is live. Voting closes at [Time]" |
| **Voted / Completed by User** | Green Check Badge | "View Cryptographic Ballot Receipt" | "You have cast your vote. Receipt hash generated." |
| **Concluded / Counting** | Amber Badge | "Live Auditing & Blockchain Sync" | "Polls closed. Tallying smart contract results." |
| **Declared Results** | Purple / Indigo Badge | "View Certified Election Audit & Winners" | "Final results published and verified on chain." |

---

## 2. Ballot Casting Flow (3-Step Assurance Pattern)

To avoid accidental votes and ensure transparency, follow the 3-step voting pattern:

```
[1. Ballot Selection] ────► [2. Review & Confirm Modal] ────► [3. Cryptographic Receipt]
• Candidate profile         • Candidate photo & name         • Transaction hash
• Department / PRN          • Irreversibility disclaimer      • Block timestamp
• Select radio button       • Explicit "Confirm" CTA         • Downloadable / Copyable
```

### 2.1 Review & Confirmation Modal
Before submitting a blockchain transaction:
1. Announce the modal using `role="dialog"` and `aria-labelledby="confirm-vote-title"`.
2. Present a concise summary of the choice.
3. Explicit warning: "Blockchain transactions cannot be reversed once confirmed."
4. Provide two clear actions:
   - Primary: "Confirm & Sign Ballot" (Triggers wallet or smart contract transaction)
   - Secondary: "Go Back & Edit" (Dismisses dialog, returns focus to ballot list)

### 2.2 Digital Receipt & Audit Trail
Once mined on the blockchain:
- Present a voter receipt containing:
  - **Transaction Reference Hash**: Displayed in monospace with a 1-click "Copy Hash" button.
  - **Block Number & Timestamp**: Verifiable on the local node or testnet block explorer.
  - **Anonymity Guarantee Note**: Explain that the ballot choice is stored cryptographically without exposing the voter's student identity.

---

## 3. Real-Time Results & Data Visualizations

- Display live results with accessible bar charts or tabular alternatives.
- Recharts or SVGs must have an associated summary table (`<table>`) for screen reader users or assistive technologies.
- Percentage indicators must be rounded to 1 decimal place with total votes cast clearly shown.
