import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, FileText, Sun, Moon, Wallet, AlertTriangle } from "lucide-react";
import blockchainService from "../blockchain/blockchainService";
import { useTheme } from "../hooks/useTheme";

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
      backgroundColor: "var(--bg-surface)",
      border: "1px solid var(--border-color)",
      borderRadius: "var(--radius-default)",
      padding: "8px 14px",
      fontSize: "0.8125rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "10px",
      boxShadow: "none"
    }}>
      {/* Left: Chain Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{
          width: "6px",
          height: "6px",
          borderRadius: "var(--radius-full)",
          backgroundColor: "#22C55E",
          boxShadow: "0 0 6px #22C55E",
          display: "inline-block"
        }} />
        <span style={{
          fontFamily: "var(--font-headline)",
          fontSize: "1rem",
          letterSpacing: "0.04em",
          color: "var(--text-primary)"
        }}>
          EVM ACTIVE
        </span>
        <span style={{ color: "var(--border-color)" }}>|</span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--accent-secondary)",
          fontWeight: 600
        }}>
          CHAIN #{walletInfo.chainId}
        </span>
      </div>

      {/* Right: Actions, Theme Switcher & Wallet */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <Link
          to="/blockchain-explorer"
          style={{
            color: "var(--accent-secondary)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 10px",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-default)",
            background: "var(--bg-elevated)"
          }}
        >
          <FileText size={13} />
          <span>Audit Ledger</span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
            padding: "5px 10px",
            borderRadius: "var(--radius-default)",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            minHeight: "32px"
          }}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

        {walletInfo.isConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-color)",
              padding: "4px 8px",
              borderRadius: "var(--radius-xs)",
              fontFamily: "var(--font-mono)",
              color: "#4ADE80",
              fontSize: "0.75rem",
              fontWeight: 600
            }}>
              {formatAddress(walletInfo.address)}
            </span>
            <button
              onClick={handleDisconnect}
              style={{
                background: "transparent",
                border: "1px solid var(--border-color)",
                color: "var(--text-muted)",
                padding: "4px 8px",
                borderRadius: "var(--radius-default)",
                cursor: "pointer",
                fontSize: "0.75rem",
                minHeight: "30px"
              }}
            >
              Revert
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectWallet}
            disabled={connecting}
            className="btn btn-primary"
            style={{
              minHeight: "32px",
              padding: "4px 10px",
              fontSize: "0.75rem"
            }}
          >
            <Wallet size={13} />
            <span>{connecting ? "Connecting..." : "Connect MetaMask"}</span>
          </button>
        )}
      </div>

      {error && (
        <div style={{
          width: "100%",
          color: "var(--accent-error)",
          fontSize: "0.75rem",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "4px"
        }}>
          <AlertTriangle size={13} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
