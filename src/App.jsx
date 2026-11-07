import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { ArrowDownLeft, ArrowUpRight, CircleHelp, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "./components/Navbar.jsx";
import WalletCard from "./components/WalletCard.jsx";
import ContractVault from "./components/ContractVault.jsx";
import Toast from "./components/Toast.jsx";

const NETWORKS = {
  1: { name: "Ethereum", token: "ETH" },
  5: { name: "Goerli", token: "ETH" },
  11155111: { name: "Sepolia", token: "ETH" },
  137: { name: "Polygon", token: "MATIC" },
  80002: { name: "Amoy", token: "POL" },
  42161: { name: "Arbitrum One", token: "ETH" },
  10: { name: "Optimism", token: "ETH" },
  8453: { name: "Base", token: "ETH" },
};

function getProvider() {
  if (!window.ethereum) return null;
  return new BrowserProvider(window.ethereum, "any");
}

function describeError(error) {
  if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
    return "Request cancelled in your wallet.";
  }
  if (error?.code === -32002) {
    return "A wallet request is already open. Check MetaMask to continue.";
  }
  if (error?.code === "INSUFFICIENT_FUNDS") {
    return "Your wallet balance is too low to cover this amount and network fees.";
  }
  return error?.shortMessage || error?.reason || error?.message || "Something went wrong. Please try again.";
}

function App() {
  const [provider, setProvider] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [nativeBalance, setNativeBalance] = useState("0.0000");
  const [network, setNetwork] = useState({ name: "Not connected", token: "ETH", chainId: null });
  const [toast, setToast] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const refreshWallet = useCallback(async (activeProvider, address) => {
    const [balance, chain] = await Promise.all([
      activeProvider.getBalance(address),
      activeProvider.getNetwork(),
    ]);
    const chainId = Number(chain.chainId);
    const details = NETWORKS[chainId] || { name: "Unknown network", token: "ETH" };
    setNativeBalance(Number(formatEther(balance)).toFixed(4));
    setNetwork({ ...details, chainId });
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setNativeBalance("0.0000");
    setNetwork({ name: "Not connected", token: "ETH", chainId: null });
  }, []);

  useEffect(() => {
    if (!window.ethereum?.on) return undefined;
    const handleAccountsChanged = async (accounts) => {
      if (!accounts.length) {
        disconnect();
        return;
      }
      const activeProvider = getProvider();
      setProvider(activeProvider);
      setWallet(accounts[0]);
      try {
        await refreshWallet(activeProvider, accounts[0]);
      } catch (error) {
        notify(describeError(error), "error");
      }
    };
    const handleChainChanged = async () => {
      const activeProvider = getProvider();
      setProvider(activeProvider);
      if (wallet && activeProvider) {
        try {
          await refreshWallet(activeProvider, wallet);
        } catch (error) {
          notify(describeError(error), "error");
        }
      } else {
        const chain = await activeProvider.getNetwork();
        const chainId = Number(chain.chainId);
        const details = NETWORKS[chainId] || { name: "Unknown network", token: "ETH" };
        setNetwork({ ...details, chainId });
      }
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [disconnect, notify, refreshWallet, wallet]);

  const connect = async () => {
    if (!window.ethereum) {
      notify("Install MetaMask to connect a wallet.", "error");
      return;
    }
    setConnecting(true);
    try {
      const activeProvider = getProvider();
      const accounts = await activeProvider.send("eth_requestAccounts", []);
      if (!accounts.length) return;
      setProvider(activeProvider);
      setWallet(accounts[0]);
      await refreshWallet(activeProvider, accounts[0]);
      notify("Wallet connected successfully.");
    } catch (error) {
      notify(describeError(error), "error");
    } finally {
      setConnecting(false);
    }
  };

  const refreshBalance = async () => {
    if (!wallet || !provider) return;
    try {
      await refreshWallet(provider, wallet);
    } catch (error) {
      notify(describeError(error), "error");
    }
  };

  const networkLabel = network.chainId
    ? `${network.name} · ${network.chainId}`
    : network.name;

  return (
    <div className="app-shell min-h-screen overflow-hidden text-white">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <Navbar
        wallet={wallet}
        network={networkLabel}
        chainId={network.chainId}
        connecting={connecting}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      <main className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 lg:px-10 lg:pt-16">
        <section className="hero-grid mb-12 items-end gap-8 lg:mb-14">
          <div className="max-w-2xl">
            <div className="eyebrow mb-5">
              <span className="eyebrow-dot" />
              A clearer way to grow on-chain
            </div>
            <h1 className="hero-title">
              Your assets,
              <br />
              <span>in good hands.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-400 sm:text-base">
              A calm, transparent home for your Web3 wallet and vault. Connect to get started.
            </p>
            <div className="mt-7 flex flex-wrap gap-5 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-mint" /> Self-custody first</span>
              <span className="inline-flex items-center gap-2"><Sparkles size={15} className="text-mint" /> Built for clarity</span>
            </div>
          </div>
          <div className="hero-note hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 lg:block">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-200">
              <Leaf size={16} className="text-mint" /> Your keys, your control
            </div>
            <p className="max-w-xs text-xs leading-6 text-zinc-500">
              EcoVault never holds your assets. Every wallet action is approved directly in your wallet.
            </p>
          </div>
        </section>

        {!window.ethereum && (
          <div className="wallet-required-notice mb-6 flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-[#121212]/90 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="wallet-required-title">A wallet is needed to continue</p>
              <p className="wallet-required-description">Install MetaMask to connect and interact with the vault.</p>
            </div>
            <a className="button button-secondary shrink-0" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
              Get MetaMask <ArrowUpRight size={15} />
            </a>
          </div>
        )}

        <div className="content-grid gap-5 lg:gap-6">
          <div className="space-y-5 lg:space-y-6">
            <WalletCard
              wallet={wallet}
              balance={nativeBalance}
              token={network.token}
              network={network.name}
              chainId={network.chainId}
              onRefresh={refreshBalance}
              onConnect={connect}
            />
            <div className="feature-strip grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="feature-item"><ShieldCheck size={17} /><span>Non-custodial by design</span></div>
              <div className="feature-item"><CircleHelp size={17} /><span>Clear transaction states</span></div>
            </div>
            <section className="ecosystem-card" aria-label="Decorative token showcase">
              <div className="ecosystem-copy">
                <span className="ecosystem-kicker">THE ON-CHAIN ECOSYSTEM</span>
                <h2>Assets in motion.</h2>
                <p>A little orbit of the tokens that make Web3 move.</p>
              </div>
              <div className="coin-orbit" aria-hidden="true">
                <span className="orbit-ring orbit-ring-one" />
                <span className="orbit-ring orbit-ring-two" />
                <span className="coin coin-eth"><span className="eth-mark">◆</span><span className="coin-label">ETH</span></span>
                <span className="coin coin-usdc"><span className="usdc-mark">$</span><span className="coin-label">USDC</span></span>
                <span className="coin coin-pol"><span className="pol-mark">⬡</span><span className="coin-label">POL</span></span>
                <span className="orbit-core"><Leaf size={18} /></span>
              </div>
              <span className="ecosystem-footnote">Decorative showcase · no live prices</span>
            </section>
          </div>
          <ContractVault
            provider={provider}
            wallet={wallet}
            chainId={network.chainId}
            nativeBalance={nativeBalance}
            token={network.token}
            notify={notify}
          />
        </div>
        <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-5 text-[11px] text-zinc-600 sm:flex-row">
          <span>© 2025 EcoVault. A thoughtful interface for Web3.</span>
          <span className="inline-flex items-center gap-2"><ArrowDownLeft size={13} /> Always verify transactions in your wallet.</span>
        </footer>
      </main>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
