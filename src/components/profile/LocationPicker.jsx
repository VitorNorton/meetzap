import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function LocationPicker({ onComplete, formData, setFormData }) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [position, setPosition] = useState(
    formData.latitude && formData.longitude 
      ? [formData.latitude, formData.longitude] 
      : null
  );
  const [mapCenter, setMapCenter] = useState([-23.5505, -46.6333]); // São Paulo default

  useEffect(() => {
    if (position) {
      setFormData(prev => ({
        ...prev,
        latitude: position[0],
        longitude: position[1]
      }));
      reverseGeocode(position[0], position[1]);
    }
  }, [position]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        setFormData(prev => ({
          ...prev,
          address: data.display_name,
          city: data.address?.city || data.address?.town || data.address?.municipality || '',
          country: data.address?.country || ''
        }));
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo seu navegador');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        setMapCenter(newPos);
        setIsLocating(false);
      },
      (err) => {
        setLocationError('Não foi possível obter sua localização. Verifique as permissões.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const isValid = position && formData.address;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Sua Localização</h2>
        <p className="text-white/60 mt-2">Precisamos saber onde você está para encontrar pessoas próximas</p>
      </div>

      <Button
        onClick={getCurrentLocation}
        disabled={isLocating}
        variant="outline"
        className="w-full h-14 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Navigation className="w-5 h-5 mr-2" />
        )}
        {isLocating ? 'Obtendo localização...' : 'Usar minha localização atual'}
      </Button>

      {locationError && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {locationError}
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-white/20" style={{ height: '250px' }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
          <MapController center={position || mapCenter} />
        </MapContainer>
      </div>

      <p className="text-white/40 text-xs text-center">
        Clique no mapa para ajustar sua localização
      </p>

      {formData.address && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">Localização detectada</p>
              <p className="text-white/60 text-xs mt-1">{formData.address}</p>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={onComplete}
        disabled={!isValid}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
      >
        Continuar
      </Button>
    </motion.div>
  );
}