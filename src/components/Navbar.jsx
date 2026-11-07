import { useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, Leaf, LogOut, Wallet } from "lucide-react";

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function Navbar({ wallet, network, chainId, connecting, onConnect, onDisconnect }) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <header className="relative z-20 border-b border-white/[0.07]">
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <a href="#" className="flex items-center gap-3" aria-label="EcoVault home">
          <span className="brand-mark"><Leaf size={19} strokeWidth={2.2} /></span>
          <span className="text-[15px] font-semibold tracking-[-0.03em]">eco<span className="text-mint">vault</span><span className="ml-1.5 text-[10px] font-medium tracking-wide text-zinc-500">WEB3</span></span>
        </a>

        <div className="flex items-center gap-3">
          <div className={`network-pill ${chainId ? "network-connected" : ""}`}>
            <span className="status-dot" />
            <span className="hidden sm:inline">{network}</span>
            <span className="sm:hidden">{chainId ? network.split(" · ")[0] : "No network"}</span>
          </div>
          {wallet ? (
            <div className="relative">
              <button
                type="button"
                className="button button-profile"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
              >
                <span className="profile-dot" />
                <span className="hidden sm:inline">{shortAddress(wallet)}</span>
                <ChevronDown size={14} className="text-zinc-500" />
              </button>
              {menuOpen && (
                <>
                  <button className="fixed inset-0 z-10 cursor-default" aria-label="Close wallet menu" onClick={() => setMenuOpen(false)} />
                  <div className="wallet-menu">
                    <div className="mb-3 border-b border-white/[0.07] px-3 pb-3">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Connected wallet</p>
                      <p className="mt-1.5 font-mono text-xs text-zinc-200">{shortAddress(wallet)}</p>
                    </div>
                    <button className="menu-action" onClick={copyAddress}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy address"}
                    </button>
                    {chainId && (
                      <a className="menu-action" href={`https://chainlist.org/chain/${chainId}`} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} /> Network details
                      </a>
                    )}
                    <button
                      className="menu-action menu-danger"
                      onClick={() => {
                        onDisconnect();
                        setMenuOpen(false);
                      }}
                    >
                      <LogOut size={14} /> Disconnect
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button type="button" className="button button-primary" onClick={onConnect} disabled={connecting}>
              <Wallet size={15} />
              <span>{connecting ? "Connecting..." : "Connect wallet"}</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
