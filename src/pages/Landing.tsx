import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden font-sans">
      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center pt-24 relative z-10 w-full overflow-hidden">
        <h1 className="text-5xl md:text-[3.5rem] font-bold text-center leading-tight mb-8 tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-400 bg-clip-text text-transparent block pb-2">
            全中国最酷的科技活动
          </span>
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-400 bg-clip-text text-transparent block">
            尽在 FluxVerse
          </span>
        </h1>
        
        <p className="text-gray-500 text-lg mt-2 mb-6 tracking-wide font-medium">
          打破信息茧房，让年轻人探索职业发展的多重可能性
        </p>

        <button 
          onClick={() => navigate('/home')}
          className="px-10 py-3 bg-white text-pink-500 font-bold rounded-full shadow-[0_4px_14px_0_rgba(236,72,153,0.2)] hover:shadow-[0_6px_20px_rgba(236,72,153,0.15)] hover:-translate-y-0.5 transition-all border border-pink-100 text-lg"
        >
          参加活动
        </button>

        {/* Floating Cards Mockup */}
        <div className="mt-0 w-full max-w-[80rem] relative h-[30rem] flex justify-center items-end -translate-y-4 overflow-hidden pb-2">
             {/* Card 1 (Left) */}
            <div className="flex-shrink-0 w-[20rem] h-[20rem] bg-gradient-to-b from-[#1e1b4b] to-[#4c1d95] rounded-[2.5rem] transform -rotate-12 translate-y-2 -mr-32 shadow-2xl flex flex-col justify-center items-center text-white p-6 relative z-10 border border-white/10 overflow-hidden group hover:-translate-y-6 hover:-rotate-6 transition-all duration-500">
               {/* Background Elements */}
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 to-transparent"></div>
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl"></div>
               
               <h3 className="text-[3.5rem] font-black mb-0 tracking-tighter bg-gradient-to-b from-blue-200 to-blue-400 bg-clip-text text-transparent leading-none">TEC</h3>
               <span className="text-sm tracking-[0.4em] font-medium text-blue-200/80 mt-2">WORKSHOP</span>
               
               {/* Abstract shapes */}
               <div className="absolute bottom-12 left-6 w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
               <div className="absolute top-20 right-8 w-10 h-10 border-2 border-purple-400/50 rounded-xl transform rotate-45"></div>
            </div>

             {/* Card 2 (Center) */}
            <div className="flex-shrink-0 w-[24rem] h-[24rem] bg-gradient-to-b from-[#f59e0b] to-[#be123c] rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col justify-center items-center text-white p-8 z-20 transform translate-y-6 border border-white/20 overflow-hidden group hover:translate-y-4 transition-transform duration-500 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-300 rounded-full blur-[80px] opacity-60"></div>
               
               <div className="relative z-10 flex flex-col items-center">
                   <h3 className="text-[7rem] font-black leading-none bg-gradient-to-b from-white to-orange-100 bg-clip-text text-transparent drop-shadow-sm">AI</h3>
                   <span className="text-2xl font-bold tracking-[0.25em] mt-3 uppercase">Summit</span>
               </div>
               
               {/* Floating Cubes */}
               <div className="absolute top-16 right-8 w-16 h-16 bg-red-600/80 backdrop-blur-sm rounded-3xl shadow-lg transform rotate-[30deg] border border-red-400/30"></div>
               <div className="absolute bottom-20 left-8 w-12 h-12 bg-orange-600/80 backdrop-blur-sm rounded-2xl shadow-lg transform -rotate-12 border border-orange-400/30"></div>
            </div>

             {/* Card 3 (Right) */}
            <div className="flex-shrink-0 w-[20rem] h-[20rem] bg-gradient-to-b from-[#2dd4bf] to-[#0f766e] rounded-[2.5rem] transform rotate-12 translate-y-2 -ml-32 shadow-2xl flex flex-col justify-center items-center text-white p-6 relative z-10 border border-white/10 overflow-hidden group hover:-translate-y-6 hover:rotate-6 transition-all duration-500">
               <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:0_0,0_0]"></div>
               
               <h3 className="text-[3rem] font-black mb-1 text-center leading-none tracking-tight">STARTUP</h3>
               <span className="text-[4rem] font-black mb-0 leading-none text-teal-100">DEMO</span>
               <span className="text-[4rem] font-black leading-none text-teal-100">DAY</span>
               
               <div className="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-to-t from-teal-900/50 to-transparent"></div>
            </div>
        </div>
      </main>
    </div>
  );
};
