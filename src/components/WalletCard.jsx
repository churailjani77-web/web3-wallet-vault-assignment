import { useState } from "react";
import { ArrowUpRight, Check, Copy, ExternalLink, RefreshCw, Wallet } from "lucide-react";

const EXPLORERS = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  137: "https://polygonscan.com",
  80002: "https://amoy.polygonscan.com",
  42161: "https://arbiscan.io",
  10: "https://optimistic.etherscan.io",
  8453: "https://basescan.org",
};

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function WalletCard({ wallet, balance, token, network, chainId, onRefresh, onConnect }) {
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <section className="glass-card wallet-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="section-label"><span className="mini-icon"><Wallet size={14} /></span> Wallet overview</div>
          <h2 className="mt-5 text-sm font-medium text-zinc-300">Native balance</h2>
        </div>
        <button type="button" className="icon-button" aria-label="Refresh wallet balance" onClick={refresh} disabled={!wallet || refreshing}>
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {wallet ? (
        <>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="balance-number">{balance}</span>
            <span className="text-sm font-medium text-zinc-400">{token}</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
            <button className="address-chip" type="button" onClick={copyAddress}>
              <span className="profile-dot" /> <span className="font-mono">{shortAddress(wallet)}</span>
              {copied ? <Check size={13} className="text-mint" /> : <Copy size={13} />}
            </button>
            {EXPLORERS[chainId] && (
              <a className="subtle-link" href={`${EXPLORERS[chainId]}/address/${wallet}`} target="_blank" rel="noreferrer">
                View on explorer <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="status-dot" /> Connected to {network}
          </div>
        </>
      ) : (
        <div className="mt-7 rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center">
          <p className="text-sm text-zinc-300">Your wallet is waiting to connect</p>
          <p className="mt-1 text-xs text-zinc-500">Connect to view your native token balance.</p>
          <button type="button" className="button button-secondary mt-4" onClick={onConnect}>
            Connect wallet <ArrowUpRight size={14} />
          </button>
        </div>
      )}
    </section>
  );
}

export default WalletCard;
