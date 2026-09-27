import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import blockchainService from "../blockchain/blockchainService";

export default function BlockchainStatusBadge() {
  const [walletInfo, setWalletInfo] = useState({
    isConnected: false,
    address: null,
    networkName: "Localhost Node",
    chainId: 31337
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if MetaMask is already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
      setWalletInfo({
        isConnected: true,
        address: window.ethereum.selectedAddress,
        networkName: "MetaMask",
        chainId: window.ethereum.chainId ? parseInt(window.ethereum.chainId, 16) : 31337
      });
      blockchainService.isMetaMaskConnected = true;
      blockchainService.userAddress = window.ethereum.selectedAddress;
    }
  }, []);

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      setError(null);
      const res = await blockchainService.connectMetaMask();
      setWalletInfo({
        isConnected: true,
        address: res.address,
        networkName: res.name || "MetaMask",
        chainId: res.chainId
      });
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    blockchainService.disconnectMetaMask();
    setWalletInfo({
      isConnected: false,
      address: null,
      networkName: "Localhost Node",
      chainId: 31337
    });
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      color: "#f8fafc",
      padding: "8px 16px",
      borderRadius: "10px",
      fontSize: "0.85rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "10px",
      border: "1px solid #334155",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: "#10b981",
          boxShadow: "0 0 8px #10b981",
          display: "inline-block"
        }} />
        <span style={{ fontWeight: 600 }}>EVM Blockchain Active</span>
        <span style={{ color: "#94a3b8" }}>|</span>
        <span style={{ color: "#38bdf8" }}>Chain ID: {walletInfo.chainId}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link
          to="/blockchain-explorer"
          style={{
            color: "#67e8f9",
            textDecoration: "none",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          ⛓️ Audit Ledger
        </Link>

        {walletInfo.isConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              background: "#334155",
              padding: "4px 8px",
              borderRadius: "6px",
              fontFamily: "monospace",
              color: "#a7f3d0"
            }}>
              {formatAddress(walletInfo.address)}
            </span>
            <button
              onClick={handleDisconnect}
              style={{
                background: "transparent",
                border: "1px solid #64748b",
                color: "#cbd5e1",
                padding: "3px 8px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "0.75rem"
              }}
            >
              Revert Demo
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectWallet}
            disabled={connecting}
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "white",
              border: "none",
              padding: "5px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.8rem",
              transition: "opacity 0.2s"
            }}
          >
            {connecting ? "Connecting..." : "🦊 Connect MetaMask"}
          </button>
        )}
      </div>

      {error && (
        <div style={{ width: "100%", color: "#f87171", fontSize: "0.75rem" }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
