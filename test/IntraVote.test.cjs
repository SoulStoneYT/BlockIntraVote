const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IntraVote Smart Contract Tests", function () {
  let IntraVote;
  let intraVote;
  let admin, voter1, voter2;

  beforeEach(async function () {
    [admin, voter1, voter2] = await ethers.getSigners();
    IntraVote = await ethers.getContractFactory("IntraVote");
    intraVote = await IntraVote.deploy();
    await intraVote.waitForDeployment();
  });

  describe("Deployment & Initialization", function () {
    it("Should set the deployer as the admin", async function () {
      expect(await intraVote.admin()).to.equal(admin.address);
    });

    it("Should initialize with Active election status", async function () {
      expect(await intraVote.electionStatus()).to.equal(1); // 1 = Active
    });
  });

  describe("Candidate Registration", function () {
    it("Should successfully register a candidate", async function () {
      await expect(intraVote.registerCandidate("cand-1", "Alice Johnson", "pos-president"))
        .to.emit(intraVote, "CandidateRegistered")
        .withArgs("cand-1", "Alice Johnson", "pos-president");

      const candidate = await intraVote.candidates("cand-1");
      expect(candidate.name).to.equal("Alice Johnson");
      expect(candidate.positionId).to.equal("pos-president");
      expect(candidate.voteCount).to.equal(0);
      expect(candidate.exists).to.be.true;
    });
  });

  describe("Ballot Casting & Double-Vote Guard", function () {
    beforeEach(async function () {
      await intraVote.registerCandidate("cand-1", "Alice Johnson", "pos-president");
      await intraVote.registerCandidate("cand-2", "Bob Smith", "pos-president");
      await intraVote.registerCandidate("cand-3", "Charlie Brown", "pos-secretary");
    });

    it("Should cast a vote and record on-chain ledger", async function () {
      // Simulate student UID hash from Firebase: keccak256("student-123")
      const student1Hash = ethers.keccak256(ethers.toUtf8Bytes("student-uid-001"));

      await expect(intraVote.castVote("pos-president", "cand-1", student1Hash))
        .to.emit(intraVote, "VoteCast");

      expect(await intraVote.getCandidateVotes("cand-1")).to.equal(1);
      expect(await intraVote.getTotalVotes()).to.equal(1);
      expect(await intraVote.hasVoterVoted(student1Hash, "pos-president")).to.be.true;
    });

    it("Should REVERT if the same student attempts to vote twice for the same position", async function () {
      const student1Hash = ethers.keccak256(ethers.toUtf8Bytes("student-uid-001"));

      // First vote - should succeed
      await intraVote.castVote("pos-president", "cand-1", student1Hash);

      // Second vote attempt for same position - MUST REVERT
      await expect(
        intraVote.castVote("pos-president", "cand-2", student1Hash)
      ).to.be.revertedWith("EVM Guard: Student has already cast a ballot for this position");

      // Verify vote count didn't increase
      expect(await intraVote.getCandidateVotes("cand-2")).to.equal(0);
      expect(await intraVote.getTotalVotes()).to.equal(1);
    });

    it("Should allow the same student to vote for a DIFFERENT position", async function () {
      const student1Hash = ethers.keccak256(ethers.toUtf8Bytes("student-uid-001"));

      // Vote for president
      await intraVote.castVote("pos-president", "cand-1", student1Hash);

      // Vote for secretary - should succeed
      await expect(
        intraVote.castVote("pos-secretary", "cand-3", student1Hash)
      ).to.emit(intraVote, "VoteCast");

      expect(await intraVote.getTotalVotes()).to.equal(2);
      expect(await intraVote.hasVoterVoted(student1Hash, "pos-secretary")).to.be.true;
    });
  });

  describe("Election Lifecycle Constraints", function () {
    it("Should reject votes when election is paused", async function () {
      const student1Hash = ethers.keccak256(ethers.toUtf8Bytes("student-uid-001"));
      
      // Pause election (2 = Paused)
      await intraVote.setElectionStatus(2);
      expect(await intraVote.electionStatus()).to.equal(2);

      await expect(
        intraVote.castVote("pos-president", "cand-1", student1Hash)
      ).to.be.revertedWith("Election is not currently active");
    });

    it("Should reject votes when election is ended", async function () {
      const student1Hash = ethers.keccak256(ethers.toUtf8Bytes("student-uid-001"));
      
      // End election (3 = Ended)
      await intraVote.setElectionStatus(3);

      await expect(
        intraVote.castVote("pos-president", "cand-1", student1Hash)
      ).to.be.revertedWith("Election is not currently active");
    });
  });

  describe("Audit & Ledger Queries", function () {
    it("Should return recent votes for the blockchain explorer", async function () {
      const student1Hash = ethers.keccak256(ethers.toUtf8Bytes("student-uid-001"));
      const student2Hash = ethers.keccak256(ethers.toUtf8Bytes("student-uid-002"));

      await intraVote.castVote("pos-president", "cand-1", student1Hash);
      await intraVote.castVote("pos-president", "cand-2", student2Hash);

      const recent = await intraVote.getRecentVotes(5);
      expect(recent.length).to.equal(2);
      expect(recent[0].voterHash).to.equal(student2Hash); // Latest first
      expect(recent[1].voterHash).to.equal(student1Hash);
    });
  });
});
