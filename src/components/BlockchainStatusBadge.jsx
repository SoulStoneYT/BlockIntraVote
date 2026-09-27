import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import blockchainService from "../blockchain/blockchainService";
import { useTheme } from "../context/ThemeContext";

export default function BlockchainStatusBadge() {
  const { theme, toggleTheme } = useTheme();

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
      background: theme === "dark" 
        ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" 
        : "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
      color: "var(--text-primary)",
      padding: "8px 16px",
      borderRadius: "12px",
      fontSize: "0.85rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "12px",
      border: "1px solid var(--border-color)",
      boxShadow: "var(--card-shadow)",
      transition: "background 0.3s ease, border-color 0.3s ease, color 0.3s ease"
    }}>
      {/* Left: Chain Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: "#10b981",
          boxShadow: "0 0 8px #10b981",
          display: "inline-block"
        }} />
        <span style={{ fontWeight: 600 }}>EVM Blockchain Active</span>
        <span style={{ color: "var(--text-muted)" }}>|</span>
        <span style={{ color: "#38bdf8", fontWeight: 500 }}>Chain ID: {walletInfo.chainId}</span>
      </div>

      {/* Right: Actions, Theme Switcher & Wallet */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <Link
          to="/blockchain-explorer"
          style={{
            color: theme === "dark" ? "#67e8f9" : "#0284c7",
            textDecoration: "none",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          ⛓️ Audit Ledger
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            background: theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
            padding: "5px 12px",
            borderRadius: "999px",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "none",
            transition: "all 0.2s ease"
          }}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {walletInfo.isConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              background: theme === "dark" ? "#334155" : "#e2e8f0",
              padding: "4px 8px",
              borderRadius: "6px",
              fontFamily: "monospace",
              color: theme === "dark" ? "#a7f3d0" : "#065f46",
              fontWeight: 600
            }}>
              {formatAddress(walletInfo.address)}
            </span>
            <button
              onClick={handleDisconnect}
              style={{
                background: "transparent",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                padding: "3px 8px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "0.75rem",
                boxShadow: "none"
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
              fontWeight: 600,
              fontSize: "0.8rem",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)"
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
