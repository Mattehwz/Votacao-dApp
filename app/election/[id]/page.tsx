"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { connectWallet, getContract, getSavedAccount, saveAccount } from "@/lib/web3";

interface Candidate {
  id: number;
  name: string;
  votes: number;
}

export default function ElectionPage() {
  const { id } = useParams();
  const [account, setAccount] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [results, setResults] = useState<{ names: string[]; votes: number[] } | null>(null);

  // Recupera conta salva
  useEffect(() => {
    const saved = getSavedAccount();
    if (saved) {
      setAccount(saved);
    }
  }, []);

  // Conecta carteira manualmente (popup)
  const handleConnectWallet = async () => {
    const acc = await connectWallet();
    if (acc) {
      setAccount(acc);
      saveAccount(acc);
    }
  };

  // Desconecta carteira
  const handleDisconnectWallet = () => {
    setAccount(null);
    localStorage.removeItem("connectedAccount");
  };

  // Carrega eleição do contrato
  const loadElection = async (electionId: string) => {
    setLoading(true);
    try {
      const contract = await getContract();
      if (!contract) {
        alert("Contrato não inicializado. Verifique o MetaMask.");
        return;
      }
      const e = await contract.getElection(Number(electionId));
      setTitle(e[1]);
      setIsActive(e[2]);
      const candidateCount = Number(e[3]);

      // Verifica se o usuário é o dono da eleição
      let owner = null;
      try {
        owner = await contract.getElectionOwner(Number(electionId));
        setIsOwner(account?.toLowerCase() === owner.toLowerCase());
      } catch (err) {
        console.error("Erro ao obter dono da eleição:", err);
        setIsOwner(false); // Fallback para falso se a função falhar
      }

      const list: Candidate[] = [];
      for (let i = 1; i <= candidateCount; i++) {
        const c = await contract.getCandidate(Number(electionId), i);
        list.push({ id: Number(c[0]), name: c[1], votes: Number(c[2]) });
      }
      setCandidates(list);

      // Carrega resultados se a eleição não estiver ativa
      if (!e[2]) {
        const res = await contract.getResults(Number(electionId));
        setResults({ names: res[0], votes: res[1] });
      }
    } catch (err) {
      console.error("Erro ao carregar eleição:", err);
      alert("Erro ao carregar os dados da eleição: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Carrega eleição quando o ID ou account muda
  useEffect(() => {
    if (typeof id === "string" && id && account) {
      loadElection(id);
    }
  }, [id, account]);

  // Função de voto
  const handleVote = async (candidateId: number) => {
    if (!account) {
      alert("Conecte sua carteira!");
      return;
    }
    if (!isActive) {
      alert("Eleição encerrada");
      return;
    }
    setVoting(true);
    try {
      const contract = await getContract();
      if (!contract) return;
      const tx = await contract.vote(Number(id), candidateId);
      await tx.wait();
      alert("✅ Voto registrado com sucesso!");
      loadElection(id as string);
    } catch (e) {
      console.error("Erro ao votar:", e);
      alert("Erro ao votar: " + (e as Error).message);
    } finally {
      setVoting(false);
    }
  };

  // Função para encerrar eleição
  const handleEndElection = async () => {
    if (!account) {
      alert("Conecte sua carteira!");
      return;
    }
    if (!isOwner) {
      alert("Apenas o criador da eleição pode encerrá-la!");
      return;
    }
    setEnding(true);
    try {
      const contract = await getContract();
      if (!contract) return;
      const tx = await contract.endElection(Number(id));
      await tx.wait();
      alert("✅ Eleição encerrada com sucesso!");
      loadElection(id as string);
    } catch (e) {
      console.error("Erro ao encerrar eleição:", e);
      alert("Erro ao encerrar eleição: " + (e as Error).message);
    } finally {
      setEnding(false);
    }
  };

  if (!id) {
    return (
      <>
        <Navbar />
        <div className="p-8 max-w-3xl mx-auto">
          <p>Carregando ID da eleição...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{title || "Carregando..."}</h1>

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
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 cursor-pointer"
            >
              Desconectar
            </button>
          </div>
        )}

        {/* Botão para encerrar eleição (apenas para o dono) */}
        {isOwner && isActive && (
          <div className="mb-4">
            <button
              onClick={handleEndElection}
              disabled={ending}
              className={`px-4 py-2 rounded text-white ${
                ending ? "bg-gray-500 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {ending ? "Encerrando..." : "Encerrar Eleição"}
            </button>
          </div>
        )}

        {/* Status da eleição */}
        <p className="mb-4 text-lg">
          Status: {isActive ? "🟢 Ativa" : "🔴 Encerrada"}
        </p>

        {/* Candidatos */}
        {loading ? (
          <p className="text-gray-400">Carregando candidatos...</p>
        ) : candidates.length === 0 ? (
          <p className="text-gray-400">Nenhum candidato cadastrado.</p>
        ) : (
          <ul>
            {candidates.map((c) => (
              <li
                key={c.id}
                className="border border-gray-700 p-4 mb-2 rounded flex justify-between items-center bg-gray-800"
              >
                <span>
                  {c.name} — <strong>{c.votes}</strong> votos
                </span>
                <button
                  disabled={!isActive || voting}
                  onClick={() => handleVote(c.id)}
                  className={`px-3 py-1 rounded text-white ${
                    isActive && !voting
                      ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                      : "bg-gray-500 cursor-not-allowed"
                  }`}
                >
                  {voting ? "Votando..." : "Votar"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Resultados (mostrado apenas quando a eleição está encerrada) */}
        {!isActive && results && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Resultados da Eleição</h2>
            <ul>
              {results.names.map((name, index) => (
                <li
                  key={index}
                  className="border border-gray-700 p-4 mb-2 rounded bg-gray-800"
                >
                  {name}: <strong>{results.votes[index]}</strong> votos
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}