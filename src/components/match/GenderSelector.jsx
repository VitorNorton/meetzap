import React from 'react';
import { cn } from "@/lib/utils";
import { User, Users } from 'lucide-react';

export default function GenderSelector({ 
  myGender, 
  lookingFor, 
  onMyGenderChange, 
  onLookingForChange 
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium text-white/90">
          <User className="w-4 h-4" />
          Eu sou
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onMyGenderChange('male')}
            className={cn(
              "h-16 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2",
              myGender === 'male'
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                : "bg-white/10 text-white/80 hover:bg-white/15 border border-white/10"
            )}
          >
            <span className="text-xl">👨</span>
            Homem
          </button>
          <button
            onClick={() => onMyGenderChange('female')}
            className={cn(
              "h-16 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2",
              myGender === 'female'
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 scale-[1.02]"
                : "bg-white/10 text-white/80 hover:bg-white/15 border border-white/10"
            )}
          >
            <span className="text-xl">👩</span>
            Mulher
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium text-white/90">
          <Users className="w-4 h-4" />
          Quero conhecer
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onLookingForChange('male')}
            className={cn(
              "h-14 rounded-2xl font-medium transition-all duration-300 text-sm",
              lookingFor === 'male'
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                : "bg-white/10 text-white/80 hover:bg-white/15 border border-white/10"
            )}
          >
            👨 Homens
          </button>
          <button
            onClick={() => onLookingForChange('female')}
            className={cn(
              "h-14 rounded-2xl font-medium transition-all duration-300 text-sm",
              lookingFor === 'female'
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 scale-[1.02]"
                : "bg-white/10 text-white/80 hover:bg-white/15 border border-white/10"
            )}
          >
            👩 Mulheres
          </button>
          <button
            onClick={() => onLookingForChange('any')}
            className={cn(
              "h-14 rounded-2xl font-medium transition-all duration-300 text-sm",
              lookingFor === 'any'
                ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30 scale-[1.02]"
                : "bg-white/10 text-white/80 hover:bg-white/15 border border-white/10"
            )}
          >
            🌈 Todos
          </button>
        </div>
      </div>
    </div>
  );
}