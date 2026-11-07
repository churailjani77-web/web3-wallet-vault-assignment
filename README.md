# EcoVault Web3

A React, Vite, Tailwind CSS, and ethers v6 wallet/vault interface.

## Run locally

```sh
npm install
npm run dev
```

Run `npm run build` to create the production bundle.

## Vault modes

Without `VITE_VAULT_ADDRESS`, the vault runs in **Demo mode**: deposits and withdrawals are simulated locally in the browser and do not send transactions or move funds.

To enable **Live contract** mode, create a `.env` file and set `VITE_VAULT_ADDRESS` to a deployed contract address. The contract is expected to expose these methods:

```solidity
function deposit() external payable;
function withdraw(uint256 amount) external;
function balanceOf(address account) external view returns (uint256);
```

The configured contract must be deployed on the currently connected chain and implement compatible behavior. The interface uses the connected wallet to submit calls; review and approve each transaction in the wallet.
