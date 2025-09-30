import { ethers, Contract } from "ethers";
import { contractABI } from "../abi/ElectionABI";

const contractAddress = "0x9384f68ba2f2b43a31a76addd540c3226ea9d013"; // 🔹 Endereço do contrato na Sepolia

// --- Tipagem global ---
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

/**
 * Conecta a carteira (MetaMask) e força o popup de escolha de conta.
 * Retorna o endereço da conta selecionada.
 */
export const connectWallet = async (): Promise<string | null> => {
  if (!window.ethereum) {
    alert("Instale o MetaMask para continuar!");
    return null;
  }

  try {
    // 🔸 Força o MetaMask a abrir o popup de permissão novamente
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });

    // 🔹 Solicita a lista de contas (depois que o usuário escolher)
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    const account = accounts[0];
    console.log("Carteira conectada:", account);
    return account;
  } catch (error) {
    console.error("Erro ao conectar a carteira:", error);
    return null;
  }
};

/**
 * Retorna o objeto ethers.Contract para interagir com o contrato.
 */
export const getContract = async (): Promise<Contract | null> => {
  if (!window.ethereum) {
    console.error("MetaMask não encontrada!");
    return null;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};

/**
 * Salva a conta conectada no localStorage
 */
export const saveAccount = (account: string) => {
  localStorage.setItem("connectedAccount", account);
};

/**
 * Recupera a conta salva (se existir)
 */
export const getSavedAccount = (): string | null => {
  return localStorage.getItem("connectedAccount");
};
