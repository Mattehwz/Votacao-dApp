// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Election {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct ElectionData {
        uint id;
        string title;
        bool isActive;
        address owner;
        mapping(uint => Candidate) candidates;
        uint candidatesCount;
        mapping(address => bool) hasVoted;
    }

    mapping(uint => ElectionData) public elections;
    uint public electionsCount;
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Apenas o admin pode executar essa acao");
        _;
    }

    modifier onlyOwner(uint _electionId) {
        require(msg.sender == elections[_electionId].owner, "Apenas o criador pode encerrar");
        _;
    }

    // Agora qualquer um pode criar eleições (ou mantenha onlyAdmin se quiser centralizar)
    function createElection(string memory _title, string[] memory _candidates) public {
        electionsCount++;
        ElectionData storage newElection = elections[electionsCount];
        newElection.id = electionsCount;
        newElection.title = _title;
        newElection.isActive = true;
        newElection.owner = msg.sender; // salva o criador

        for (uint i = 0; i < _candidates.length; i++) {
            newElection.candidatesCount++;
            newElection.candidates[newElection.candidatesCount] = Candidate(
                newElection.candidatesCount,
                _candidates[i],
                0
            );
        }
    }

    function vote(uint _electionId, uint _candidateId) public {
        ElectionData storage election = elections[_electionId];
        require(election.isActive, "Eleicao nao esta ativa");
        require(!election.hasVoted[msg.sender], "Ja votou");
        require(_candidateId > 0 && _candidateId <= election.candidatesCount, "Candidato invalido");

        election.hasVoted[msg.sender] = true;
        election.candidates[_candidateId].voteCount++;
    }

    // Somente o criador da eleicao pode encerrar
    function endElection(uint _electionId) public onlyOwner(_electionId) {
        elections[_electionId].isActive = false;
    }

    function getCandidate(uint _electionId, uint _candidateId)
        public
        view
        returns (uint, string memory, uint)
    {
        Candidate storage c = elections[_electionId].candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }

    function getElection(uint _electionId)
        public
        view
        returns (uint, string memory, bool, uint)
    {
        ElectionData storage e = elections[_electionId];
        return (e.id, e.title, e.isActive, e.candidatesCount);
    }

    function getElectionOwner(uint _electionId) public view returns (address) {
        return elections[_electionId].owner;
    }

    function getResults(uint _electionId)
        public
        view
        returns (string[] memory, uint[] memory)
    {
        ElectionData storage e = elections[_electionId];
        uint count = e.candidatesCount;
        string[] memory names = new string[](count);
        uint[] memory votes = new uint[](count);

        for (uint i = 0; i < count; i++) {
            Candidate storage c = e.candidates[i + 1];
            names[i] = c.name;
            votes[i] = c.voteCount;
        }

        return (names, votes);
    }
}
