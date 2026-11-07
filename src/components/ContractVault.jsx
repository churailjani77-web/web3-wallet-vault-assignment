import { useCallback, useEffect, useMemo, useState } from "react";
import { Contract, formatEther, parseEther } from "ethers";
import { ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, Clock3, ExternalLink, RefreshCw, Vault, X } from "lucide-react";

const VAULT_ABI = [
  "function deposit() payable",
  "function withdraw(uint256 amount)",
  "function balanceOf(address account) view returns (uint256)",
];

const CONTRACT_ADDRESS = import.meta.env.VITE_VAULT_ADDRESS;
const EXPLORERS = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  137: "https://polygonscan.com",
  80002: "https://amoy.polygonscan.com",
  42161: "https://arbiscan.io",
  10: "https://optimistic.etherscan.io",
  8453: "https://basescan.org",
};

function historyKey(wallet, chainId) {
  return `ecovault-history:${chainId}:${wallet?.toLowerCase()}`;
}

function readHistory(key) {
  if (!key) return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function fakeHash() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function describeError(error) {
  if (error?.code === 4001 || error?.code === "ACTION_REJECTED") return "Transaction rejected in your wallet.";
  if (error?.code === -32002) return "A wallet request is already pending. Check your wallet.";
  if (error?.code === "INSUFFICIENT_FUNDS") return "Insufficient funds to cover the amount and network fees.";
  return error?.shortMessage || error?.reason || error?.message || "Transaction failed. Please try again.";
}

function statusLabel(status) {
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  return "Success";
}

function ContractVault({ provider, wallet, chainId, nativeBalance, token, notify }) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [vaultBalance, setVaultBalance] = useState("0");
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const isLive = Boolean(CONTRACT_ADDRESS && provider && wallet);
  const key = useMemo(() => historyKey(wallet, chainId), [wallet, chainId]);

  useEffect(() => {
    setHistory(readHistory(key));
    setVaultBalance("0");
  }, [key]);

  useEffect(() => {
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(history.slice(0, 8)));
  }, [history, key]);

  const refresh = useCallback(async () => {
    if (!wallet || !provider) return;
    setRefreshing(true);
    try {
      if (isLive) {
        const contract = new Contract(CONTRACT_ADDRESS, VAULT_ABI, provider);
        const balance = await contract.balanceOf(wallet);
        setVaultBalance(formatEther(balance));
      } else {
        const saved = localStorage.getItem(`ecovault-demo-balance:${chainId}:${wallet.toLowerCase()}`);
        setVaultBalance(saved || "0");
      }
      setError("");
    } catch (cause) {
      setError(describeError(cause));
      notify(describeError(cause), "error");
    } finally {
      setRefreshing(false);
    }
  }, [chainId, isLive, notify, provider, wallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addHistory = (transaction) => {
    setHistory((current) => [transaction, ...current].slice(0, 8));
  };

  const updateHistory = (id, changes) => {
    setHistory((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  };

  const transact = async (action, amount) => {
    setError("");
    if (!wallet || !provider) {
      setError("Connect your wallet before using the vault.");
      return;
    }
    let value;
    try {
      value = parseEther(amount);
      if (value <= 0n) throw new Error("Enter an amount greater than zero.");
      if (action === "deposit" && value > parseEther(nativeBalance || "0")) {
        throw new Error(`Not enough ${token} in your wallet for this deposit. Network fees are additional.`);
      }
      if (action === "withdraw" && value > parseEther(vaultBalance || "0")) {
        throw new Error("The requested amount is greater than your vault balance.");
      }
    } catch (cause) {
      const message = cause?.code === "INVALID_ARGUMENT" || cause?.message?.includes("invalid")
        ? "Enter a valid amount using up to 18 decimal places."
        : cause.message;
      setError(message);
      return;
    }

    setBusy(true);
    const id = `${Date.now()}-${Math.random()}`;
    const transaction = {
      id,
      action,
      amount,
      hash: isLive ? null : fakeHash(),
      status: "pending",
      timestamp: Date.now(),
    };
    addHistory(transaction);
    try {
      if (isLive) {
        const signer = await provider.getSigner(wallet);
        const contract = new Contract(CONTRACT_ADDRESS, VAULT_ABI, signer);
        const response = action === "deposit"
          ? await contract.deposit({ value })
          : await contract.withdraw(value);
        updateHistory(id, { hash: response.hash });
        await response.wait();
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        const current = parseEther(vaultBalance || "0");
        const next = action === "deposit" ? current + value : current - value;
        const nextBalance = formatEther(next);
        setVaultBalance(nextBalance);
        localStorage.setItem(`ecovault-demo-balance:${chainId}:${wallet.toLowerCase()}`, nextBalance);
      }
      if (isLive) await refresh();
      updateHistory(id, { status: "success" });
      if (action === "deposit") setDepositAmount("");
      else setWithdrawAmount("");
      notify(`${action === "deposit" ? "Deposit" : "Withdrawal"} successful.`);
    } catch (cause) {
      const message = describeError(cause);
      updateHistory(id, { status: "failed" });
      setError(message);
      notify(message, "error");
    } finally {
      setBusy(false);
    }
  };

  const displayedBalance = Number(vaultBalance).toFixed(4);

  return (
    <section className="glass-card vault-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-label"><span className="mini-icon"><Vault size={14} /></span> DeFi vault</div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Your vault</h2>
          <p className="mt-1 text-xs text-zinc-500">Deposit and manage your on-chain balance.</p>
        </div>
        <span className={`mode-badge ${isLive ? "mode-live" : ""}`}><span className="status-dot" />{isLive ? "Live contract" : "Demo mode"}</span>
      </div>

      <div className="vault-balance mt-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">Vault balance</p>
          <p className="mt-2 flex items-baseline gap-2"><span className="vault-number">{displayedBalance}</span><span className="text-xs text-zinc-500">{token}</span></p>
        </div>
        <button type="button" className="icon-button" aria-label="Refresh vault balance" onClick={refresh} disabled={!wallet || refreshing}>
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {!isLive && (
        <div className="demo-notice mt-4">
          <span className="demo-indicator" />
          Demo transactions are simulated locally and do not move real funds.
        </div>
      )}
      {!wallet && (
        <div className="mt-4 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3 text-xs text-zinc-400">
          Connect a wallet to start using your vault.
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="deposit-amount" className="mb-2 block text-xs font-medium text-zinc-400">Deposit amount</label>
          <div className="amount-input-wrap">
            <input
              id="deposit-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0.00"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              disabled={!wallet || busy}
            />
            <span>{token}</span>
            <button type="button" className="max-button" onClick={() => setDepositAmount(nativeBalance)} disabled={!wallet || busy}>MAX</button>
          </div>
          <button type="button" className="button button-deposit mt-3 w-full" onClick={() => transact("deposit", depositAmount)} disabled={!wallet || busy || !depositAmount}>
            {busy ? <span className="spinner" /> : <ArrowDownToLine size={15} />}
            Deposit
          </button>
        </div>
        <div>
          <label htmlFor="withdraw-amount" className="mb-2 block text-xs font-medium text-zinc-400">Withdraw amount</label>
          <div className="amount-input-wrap">
            <input
              id="withdraw-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              disabled={!wallet || busy}
            />
            <span>{token}</span>
            <button type="button" className="max-button" onClick={() => setWithdrawAmount(vaultBalance)} disabled={!wallet || busy}>MAX</button>
          </div>
          <button type="button" className="button button-withdraw mt-3 w-full" onClick={() => transact("withdraw", withdrawAmount)} disabled={!wallet || busy || !withdrawAmount}>
            {busy ? <span className="spinner" /> : <ArrowUpFromLine size={15} />}
            Withdraw
          </button>
        </div>
      </div>
      {error && <p id="vault-error" className="mt-3 flex items-start gap-1.5 text-xs text-neutral-300"><X size={14} className="mt-0.5 shrink-0" />{error}</p>}

      <div className="mt-6 border-t border-white/[0.07] pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-300">Recent activity</h3>
          <span className="text-[10px] text-zinc-600">{history.length} transactions</span>
        </div>
        {history.length ? (
          <div className="space-y-1">
            {history.slice(0, 4).map((item) => (
              <div key={item.id} className="history-row">
                <span className={`history-icon ${item.action === "deposit" ? "history-in" : "history-out"}`}>
                  {item.action === "deposit" ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium capitalize text-zinc-300">{item.action} <span className="font-normal text-zinc-500">{item.amount} {token}</span></p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-600">
                    <Clock3 size={10} /> {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {item.hash && <><span>·</span>{isLive && EXPLORERS[chainId] ? <a href={`${EXPLORERS[chainId]}/tx/${item.hash}`} target="_blank" rel="noreferrer" className="history-link">{item.hash.slice(0, 8)}...{item.hash.slice(-4)}<ExternalLink size={9} className="ml-1 inline" /></a> : <span className="font-mono">{item.hash.slice(0, 8)}...{item.hash.slice(-4)}</span>}</>}
                  </p>
                </div>
                <span className={`transaction-status status-${item.status}`}>
                  {item.status === "pending" && <span className="spinner tiny-spinner" />}
                  {statusLabel(item.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-history"><Clock3 size={15} /><span>Your transactions will appear here.</span></div>
        )}
      </div>
      {isLive && (
        <p className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-600">
          Contract <span className="font-mono">{CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</span>
          {EXPLORERS[chainId] && <a href={`${EXPLORERS[chainId]}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" aria-label="View vault contract"><ArrowUpRight size={11} /></a>}
        </p>
      )}
    </section>
  );
}

export default ContractVault;
