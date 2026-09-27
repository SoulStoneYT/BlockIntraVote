# ⛓️ IntraVote — Blockchain-Powered Inter-College Voting System

> **Department of Computer Science and Design — 7th Semester Blockchain Technology Project**  
> A decentralized, cryptographically verifiable, and tamper-proof electronic voting application built on **Ethereum EVM Smart Contracts**, **Solidity**, **Hardhat**, **ethers.js**, and **React**.

---

## 📌 1. Project Abstract & Motivation

Traditional electronic voting systems and web databases rely on centralized servers (e.g., standard SQL/NoSQL databases). In high-stakes institutional or inter-college student council elections, centralized databases pose significant security risks:
- Database administrators or attackers can alter or insert vote counts retroactively.
- Lack of cryptographic auditability for students to independently verify that their ballots were accurately recorded.
- Vulnerability to single-point-of-failure or unauthorized admin resets.

**IntraVote** solves this by establishing a **Decentralized Ballot Ledger**:
1. **Immutable Smart Contract**: Once a ballot is cast into a block, it is cryptographically permanent and cannot be modified, reordered, or deleted by anyone.
2. **EVM Rule Enforcement**: Double-voting is strictly prevented at the Ethereum Virtual Machine bytecode level.
3. **Secret Ballot & Voter Anonymity**: Student identifiable information (PII) is kept strictly off-chain, while the ballot records a one-way `keccak256` cryptographic hash of the student's authenticated ID.
4. **Live Verification Portal**: Every voter receives a transaction receipt (Tx Hash and Block Number) and can verify on-chain that their ballot exists in the ledger.

---

## 🏛️ 2. System Architecture

IntraVote employs an **Industry-Standard Hybrid Web3 Architecture**:

```
+---------------------------------------------------------------------------------+
|                               STUDENT / ADMIN UI                                |
|                         (React 19 + Vite + Ethers.js v6)                        |
+---------------------------------------------------------------------------------+
                         /                               \
       [Off-Chain Identity]                        [On-Chain Trust]
                        /                                   \
+-------------------------------+                   +-------------------------------+
|     FIREBASE AUTHENTICATION   |                   |    ETHEREUM SMART CONTRACT    |
|-------------------------------|                   |-------------------------------|
| • Student College Login       |                   | • IntraVote.sol (Solidity)    |
| • Role Management (Voter/Admin|                   | • EVM Double-Voting Guard     |
| • Candidate Profiles & Photos |                   | • Immutable Ballot Records    |
| • Session Countdown Timers    |                   | • On-Chain Candidate Tally    |
+-------------------------------+                   | • Block Events (VoteCast)     |
                                                    +-------------------------------+
                                                                    |
                                                    +-------------------------------+
                                                    |  BLOCKCHAIN EXPLORER PORTAL   |
                                                    | • Block # & Gas Audits        |
                                                    | • Voter Hash Verification     |
                                                    +-------------------------------+
```

### Why this Separation of Concerns?
- **Identity Off-Chain (Firebase)**: College student credentials, roll numbers, and emails must never be published on a public distributed ledger (protects student privacy).
- **Governance On-Chain (Ethereum Smart Contract)**: Only the anonymized voter hash, candidate ID, and position ID are sent to the blockchain, ensuring a **100% secret ballot** while mathematically proving single-vote integrity.

---

## 📜 3. Smart Contract Design (`contracts/IntraVote.sol`)

- **Language**: Solidity `^0.8.20`
- **Compiler Optimization**: 200 runs
- **Key Functions**:
  - `castVote(string positionId, string candidateId, bytes32 voterHash)`: Verifies election status, checks EVM mapping `_hasVoted[voterHash][positionId]`, increments tally, and appends to the immutable block ledger.
  - `hasVoterVoted(bytes32 voterHash, string positionId)`: Public constant view function allowing instant double-vote checks.
  - `getCandidateVotes(string candidateId)`: Queries immutable on-chain tally.
  - `getRecentVotes(uint256 limit)`: Supplies recent blocks and transactions to the built-in Blockchain Explorer.
  - `verifyVote(bytes32 voterHash, string positionId)`: Verifies cryptographic inclusion.

---

## 🚀 4. Step-by-Step Setup & Execution Guide

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Launch Local Ethereum Blockchain Node
In a dedicated terminal, run:
```bash
npx hardhat node
```
*This starts a local Ethereum JSON-RPC node on `http://127.0.0.1:8545` pre-funded with 20 test accounts (10,000 ETH each).*

### Step 3: Deploy Smart Contract
In a second terminal, deploy `IntraVote.sol` to the local blockchain:
```bash
npm run deploy
```
*This compiles the Solidity code, deploys the contract to the local node, and automatically exports the contract address and ABI into `src/contracts/contractConfig.json`.*

### Step 4: Launch the Frontend Application
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 5. Automated Smart Contract Verification Tests

To run the automated Solidity test suite demonstrating contract security and double-voting prevention:
```bash
npm run test:contract
```

### Expected Output:
```
  IntraVote Smart Contract Tests
    Deployment & Initialization
      ✔ Should set the deployer as the admin
      ✔ Should initialize with Active election status
    Candidate Registration
      ✔ Should successfully register a candidate
    Ballot Casting & Double-Vote Guard
      ✔ Should cast a vote and record on-chain ledger
      ✔ Should REVERT if the same student attempts to vote twice for the same position
      ✔ Should allow the same student to vote for a DIFFERENT position
    Election Lifecycle Constraints
      ✔ Should reject votes when election is paused
      ✔ Should reject votes when election is ended
    Audit & Ledger Queries
      ✔ Should return recent votes for the blockchain explorer

  9 passing (786ms)
```

---

## 🦊 6. Dual-Mode Web3 Demonstration (Viva / College Presentation)

1. **MetaMask Mode**:
   - Install the MetaMask browser extension.
   - Add Network: RPC URL `http://127.0.0.1:8545`, Chain ID `31337`, Currency `ETH`.
   - Click **🦊 Connect MetaMask** in the top navigation bar.
2. **Demo / Relayer Mode (Fail-Safe)**:
   - If presenting on a college lab computer without MetaMask, the application automatically uses Hardhat Node Account #0 as a local signer.
   - Transactions execute seamlessly without any browser extension requirements!

---

## 📤 7. Pushing to a New GitHub Repository

This workspace is an independent Git repository completely decoupled from the original project:

1. Create a new repository on your GitHub account (e.g., `Blockchain-IntraVote`).
2. Run the following commands in this directory:
```bash
git add .
git commit -m "feat: complete blockchain-enabled voting system with EVM smart contracts"
git remote add origin https://github.com/<your-username>/<your-new-repo-name>.git
git branch -M main
git push -u origin main
```

---

## 👥 Authors & Academic Credits
- **Project**: IntraVote - Blockchain-Enabled Inter-College Voting System
- **Discipline**: Computer Science and Design
- **Semester**: 7th Semester
- **Subject**: Blockchain Technology
