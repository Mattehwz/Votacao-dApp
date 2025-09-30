"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { connectWallet, getContract, getSavedAccount, saveAccount } from "@/lib/web3";

export default function CreateElection() {
  const [account, setAccount] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [candidates, setCandidates] = useState([""]);
  const [loading, setLoading] = useState(false);

  // ✅ Recupera conta salva
  useEffect(() => {
    const saved = getSavedAccount();
    if (saved) {
      setAccount(saved);
    }
  }, []);

  // ✅ Conecta MetaMask
  const handleConnectWallet = async () => {
    const acc = await connectWallet();
    if (acc) {
      setAccount(acc);
      saveAccount(acc);
    }
  };

  // ✅ Desconecta
  const handleDisconnectWallet = () => {
    setAccount(null);
    localStorage.removeItem("connectedAccount");
  };

  // ✅ Atualiza lista de candidatos
  const handleCandidateChange = (i: number, value: string) => {
    const list = [...candidates];
    list[i] = value;
    setCandidates(list);
  };

  const addCandidate = () => setCandidates([...candidates, ""]);
  const removeCandidate = (i: number) =>
    setCandidates(candidates.filter((_, index) => index !== i));

  // ✅ Criação da eleição
  const handleCreateElection = async () => {
    if (!account) {
      alert("Conecte sua carteira!");
      return;
    }
    if (!title.trim() || candidates.some((c) => c.trim() === "")) {
      alert("Preencha todos os campos");
      return;
    }
    if (candidates.length < 2) {
      alert("É necessário pelo menos 2 candidatos");
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract();
      if (!contract) return;
      const tx = await contract.createElection(title, candidates);
      await tx.wait();
      alert("✅ Eleição criada com sucesso!");
      setTitle("");
      setCandidates([""]);
    } catch (e) {
      console.error(e);
      alert("Erro ao criar eleição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Criar Nova Eleição</h1>

        {/* Conexão */}
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
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Desconectar
            </button>
          </div>
        )}

        {/* Campos */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Título da Eleição</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-700 bg-gray-900 text-white p-2 w-full rounded"
            placeholder="Ex: Eleição para Representante"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Candidatos</label>
          {candidates.map((c, i) => (
            <div key={i} className="flex mb-2">
              <input
                value={c}
                onChange={(e) => handleCandidateChange(i, e.target.value)}
                className="border border-gray-700 bg-gray-900 text-white p-2 w-full rounded"
                placeholder={`Candidato ${i + 1}`}
              />
              {candidates.length > 1 && (
                <button
                  onClick={() => removeCandidate(i)}
                  className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addCandidate}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Adicionar Candidato
          </button>
        </div>

        {/* Botão Criar */}
        <button
          onClick={handleCreateElection}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Criando..." : "Criar Eleição"}
        </button>
      </div>
    </>
  );
}
