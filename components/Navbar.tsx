import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      {/* Links on the Left */}
      <div className="space-x-5">
        {/*
          Applied Tailwind classes for hover effect:
          - transition-colors: Enables smooth color changes.
          - duration-200: Sets the transition speed to 200ms.
          - hover:text-indigo-400: Changes the text color to a light blue/purple on hover.
        */}
        <Link 
          href="/" 
          className="transition-colors duration-200 hover:text-indigo-400"
        >
          Home
        </Link>
        <Link 
          href="/create" 
          className="transition-colors duration-200 hover:text-indigo-400"
        >
          Criar Eleição
        </Link>
      </div>
      
      {/* Title on the Right */}
      <div className="text-xl font-bold">
        Voting DApp
      </div>
    </nav>
  );
}