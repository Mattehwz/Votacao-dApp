"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { connectWallet, getContract, getSavedAccount, saveAccount } from "@/lib/web3";

interface Election {
  id: number;
  title: string;
  isActive: boolean;
  candidatesCount: number;
}

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Recupera conta salva ao carregar a página
  useEffect(() => {
    const saved = getSavedAccount();
    if (saved) {
      setAccount(saved);
    }
  }, []);

  // ✅ Conecta a carteira manualmente com popup
  const handleConnectWallet = async () => {
    const acc = await connectWallet();
    if (acc) {
      setAccount(acc);
      saveAccount(acc);
    }
  };

  // ✅ Desconecta a carteira
  const handleDisconnectWallet = () => {
    setAccount(null);
    localStorage.removeItem("connectedAccount");
  };

  // ✅ Carrega eleições do contrato
  const loadElections = async () => {
    if (!account) return;
    setLoading(true);

    try {
      const contract = await getContract();
      if (!contract) return;

      const count = await contract.electionsCount();
      const list: Election[] = [];

      for (let i = 1; i <= Number(count); i++) {
        const e = await contract.getElection(i);
        list.push({
          id: Number(e[0]),
          title: e[1],
          isActive: e[2],
          candidatesCount: Number(e[3]),
        });
      }

      setElections(list);
    } catch (err) {
      console.error("Erro ao carregar eleições:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Recarrega eleições quando a conta muda
  useEffect(() => {
    if (account) {
      loadElections();
    }
  }, [account]);

  return (
    <>
      <Navbar />
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Sistema de Votação Blockchain</h1>

        {/* ✅ Área de conexão */}
        {!account ? (
          <button
            onClick={handleConnectWallet}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
          >
            Conectar MetaMask
          </button>
        ) : (
          <div className="mb-4">
            <p className="mb-2 text-green-500">
              ✅ Carteira conectada:{" "}
              <span className="font-mono text-gray-300">{account}</span>
            </p>
            <button
              onClick={handleDisconnectWallet}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 cursor-pointer"
            >
              Desconectar
            </button>
          </div>
        )}

        {/* ✅ Lista de eleições */}
        <h2 className="text-2xl font-semibold mb-4">Eleições</h2>

        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : elections.length === 0 ? (
          <p className="text-gray-400">Nenhuma eleição encontrada.</p>
        ) : (
          <ul>
            {elections.map((e) => (
              <li
                key={e.id}
                className="border border-gray-700 p-4 mb-2 rounded-lg flex justify-between items-center bg-gray-800"
              >
                <Link href={`/election/${e.id}`} className="text-blue-400 font-medium hover:underline">
                  {e.title}
                </Link>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    e.isActive ? "bg-green-200 text-green-800" : "bg-gray-300 text-gray-800"
                  }`}
                >
                  {e.isActive ? "Ativa" : "Encerrada"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
