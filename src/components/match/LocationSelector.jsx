import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Building2 } from 'lucide-react';

const countriesData = {
  "Brasil": ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Salvador", "Brasília", "Curitiba", "Fortaleza", "Recife", "Porto Alegre", "Manaus"],
  "Portugal": ["Lisboa", "Porto", "Braga", "Coimbra", "Faro", "Funchal"],
  "Estados Unidos": ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "San Francisco", "Seattle", "Boston"],
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata"],
  "México": ["Cidade do México", "Guadalajara", "Monterrey", "Cancún", "Tijuana"],
  "Espanha": ["Madrid", "Barcelona", "Valencia", "Sevilha", "Bilbao"],
  "França": ["Paris", "Marselha", "Lyon", "Nice", "Toulouse"],
  "Itália": ["Roma", "Milão", "Nápoles", "Florença", "Veneza"],
  "Alemanha": ["Berlim", "Munique", "Frankfurt", "Hamburgo", "Colônia"],
  "Reino Unido": ["Londres", "Manchester", "Birmingham", "Liverpool", "Glasgow"]
};

export default function LocationSelector({ country, city, onCountryChange, onCityChange }) {
  // Derive cities directly from selected country
  const cities = country && countriesData[country] ? countriesData[country] : [];

  // Validate city when country changes
  useEffect(() => {
    if (country && city && !cities.includes(city)) {
      onCityChange('');
    }
  }, [country, city, cities, onCityChange]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-white/90">
          <MapPin className="w-4 h-4" />
          País
        </label>
        <Select value={country} onValueChange={onCountryChange}>
          <SelectTrigger className="h-14 bg-white/10 border-white/20 text-white rounded-2xl backdrop-blur-sm hover:bg-white/15 transition-all">
            <SelectValue placeholder="Selecione seu país" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900/95 border-white/10 backdrop-blur-xl rounded-xl">
            {Object.keys(countriesData).map((c) => (
              <SelectItem 
                key={c} 
                value={c}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-lg"
              >
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-white/90">
          <Building2 className="w-4 h-4" />
          Cidade
        </label>
        <Select value={city} onValueChange={onCityChange} disabled={!country}>
          <SelectTrigger className="h-14 bg-white/10 border-white/20 text-white rounded-2xl backdrop-blur-sm hover:bg-white/15 transition-all disabled:opacity-50">
            <SelectValue placeholder={country ? "Selecione sua cidade" : "Primeiro selecione um país"} />
          </SelectTrigger>
          <SelectContent className="bg-gray-900/95 border-white/10 backdrop-blur-xl rounded-xl">
            {cities.map((c) => (
              <SelectItem 
                key={c} 
                value={c}
                className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-lg"
              >
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}