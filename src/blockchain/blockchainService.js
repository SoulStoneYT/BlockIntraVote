import { ethers } from "ethers";
import defaultContractConfig from "../contracts/contractConfig.json";

// Default Hardhat local RPC URL
const LOCAL_RPC_URL = "http://127.0.0.1:8545";

class BlockchainService {
  constructor() {
    this.contractConfig = defaultContractConfig;
    this.userSigner = null;
    this.userAddress = null;
    this.isMetaMaskConnected = false;
  }

  /**
   * Hashes the Firebase user UID using Keccak-256 to guarantee voter privacy
   * while ensuring that the smart contract can prevent double-voting.
   */
  generateVoterHash(uid) {
    if (!uid) throw new Error("Voter UID is required for cryptographic hashing");
    return ethers.keccak256(ethers.toUtf8Bytes(uid));
  }

  /**
   * Returns an ethers provider.
   * If MetaMask is connected, returns BrowserProvider; otherwise returns JsonRpcProvider for local Hardhat node.
   */
  async getProvider() {
    if (this.isMetaMaskConnected && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return new ethers.JsonRpcProvider(LOCAL_RPC_URL);
  }

  /**
   * Returns an active signer:
   * 1. MetaMask connected account if available.
   * 2. Hardhat Account #0 if running on local node (Viva/Demo mode).
   */
  async getSigner() {
    if (this.isMetaMaskConnected && window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      return await browserProvider.getSigner();
    }

    // Fail-safe / Demo mode: Use local node signer
    const localProvider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
    return await localProvider.getSigner(0);
  }

  /**
   * Connects to MetaMask if available
   */
  async connectMetaMask() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed in this browser. Running in Local Node Demo Mode.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    this.userAddress = await signer.getAddress();
    this.userSigner = signer;
    this.isMetaMaskConnected = true;

    const network = await provider.getNetwork();
    return {
      address: this.userAddress,
      chainId: Number(network.chainId),
      name: network.name
    };
  }

  /**
   * Disconnects MetaMask and reverts to Local Demo Signer
   */
  disconnectMetaMask() {
    this.isMetaMaskConnected = false;
    this.userSigner = null;
    this.userAddress = null;
  }

  /**
   * Returns an instance of the IntraVote contract
   */
  async getContract(readOnly = false) {
    const provider = await this.getProvider();
    if (readOnly) {
      return new ethers.Contract(
        this.contractConfig.address,
        this.contractConfig.abi,
        provider
      );
    }
    const signer = await this.getSigner();
    return new ethers.Contract(
      this.contractConfig.address,
      this.contractConfig.abi,
      signer
    );
  }

  /**
   * Registers a candidate on the blockchain ledger (can be called by admin or synced)
   */
  async registerCandidate(candidateId, name, positionId) {
    try {
      const contract = await this.getContract();
      const tx = await contract.registerCandidate(candidateId, name, positionId);
      const receipt = await tx.wait();
      return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
      console.warn("Blockchain register candidate note:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Core Blockchain Voting Function:
   * Casts a ballot directly into the Ethereum Smart Contract.
   * Enforces 1-vote-per-position rule at EVM bytecode level.
   */
  async castVoteOnChain(positionId, candidateId, voterUid) {
    const voterHash = this.generateVoterHash(voterUid);

    try {
      const contract = await this.getContract();

      // First check if already voted on-chain
      const hasVoted = await contract.hasVoterVoted(voterHash, positionId);
      if (hasVoted) {
        throw new Error("EVM Revert: You have already cast a ballot on-chain for this position.");
      }

      // Execute transaction
      const tx = await contract.castVote(positionId, candidateId, voterHash);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : "N/A",
        voterHash: voterHash,
        positionId,
        candidateId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Smart Contract Voting Error:", error);
      let userMessage = error.message;
      if (error.reason) {
        userMessage = error.reason;
      } else if (error.message.includes("EVM Guard") || error.message.includes("already cast")) {
        userMessage = "Blockchain Guard: You have already voted for this position!";
      } else if (error.message.includes("active")) {
        userMessage = "Blockchain Guard: Election is not currently active on-chain!";
      }
      throw new Error(userMessage);
    }
  }

  /**
   * Verifies if a student has voted on-chain for a specific position
   */
  async hasVotedOnChain(voterUid, positionId) {
    try {
      const voterHash = this.generateVoterHash(voterUid);
      const contract = await this.getContract(true);
      return await contract.hasVoterVoted(voterHash, positionId);
    } catch (error) {
      console.warn("Error checking on-chain vote status:", error);
      return false;
    }
  }

  /**
   * Queries on-chain vote count for a candidate directly from the contract
   */
  async getCandidateVotes(candidateId) {
    try {
      const contract = await this.getContract(true);
      const count = await contract.getCandidateVotes(candidateId);
      return Number(count);
    } catch (error) {
      console.warn(`Error fetching on-chain count for ${candidateId}:`, error);
      return 0;
    }
  }

  /**
   * Total votes across all positions stored on the blockchain
   */
  async getTotalVotes() {
    try {
      const contract = await this.getContract(true);
      const total = await contract.getTotalVotes();
      return Number(total);
    } catch (error) {
      console.warn("Error fetching total on-chain votes:", error);
      return 0;
    }
  }

  /**
   * Fetches latest vote records for the Live Blockchain Explorer & Audit page
   */
  async getRecentAuditVotes(limit = 20) {
    try {
      const contract = await this.getContract(true);
      const rawRecords = await contract.getRecentVotes(limit);
      return rawRecords.map((r) => ({
        voterHash: r.voterHash,
        positionId: r.positionId,
        candidateId: r.candidateId,
        timestamp: Number(r.timestamp) * 1000, // convert sec to ms
        blockNumber: Number(r.blockNumber)
      }));
    } catch (error) {
      console.warn("Error fetching blockchain audit records:", error);
      return [];
    }
  }

  /**
   * Verifies a specific vote receipt against on-chain data
   */
  async verifyVoteReceipt(voterUid, positionId) {
    try {
      const voterHash = this.generateVoterHash(voterUid);
      const contract = await this.getContract(true);
      const hasVoted = await contract.hasVoterVoted(voterHash, positionId);

      if (!hasVoted) {
        return {
          verified: false,
          message: "No ballot record found on-chain for this student and position."
        };
      }

      // Query recent audit logs to find block details
      const recent = await this.getRecentAuditVotes(100);
      const match = recent.find(
        (r) => r.voterHash.toLowerCase() === voterHash.toLowerCase() && r.positionId === positionId
      );

      return {
        verified: true,
        voterHash,
        positionId,
        blockNumber: match ? match.blockNumber : "Confirmed on EVM",
        timestamp: match ? new Date(match.timestamp).toLocaleString() : "Confirmed",
        candidateId: match ? match.candidateId : "Encrypted in Ledger"
      };
    } catch (error) {
      return {
        verified: false,
        message: error.message
      };
    }
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
