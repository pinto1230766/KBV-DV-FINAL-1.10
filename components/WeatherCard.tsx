import React, { useState, useEffect } from 'react';
import { WeatherData } from '../types';

interface WeatherCardProps {
  date: string; // YYYY-MM-DD
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  date,
  city,
  latitude,
  longitude,
  className = ''
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
  }, [date, city, latitude, longitude]);

  const fetchWeather = async () => {
    if (!city && (!latitude || !longitude)) {
      setError('Aucune information de localisation disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Geolocation API to get weather if coordinates are provided
      // Otherwise use city name
      const location = latitude && longitude
        ? `${latitude},${longitude}`
        : city;

      if (!location) {
        throw new Error('Localisation non disponible');
      }

      // For demo purposes, we'll create mock weather data
      // In a real implementation, you would call a weather API
      const mockWeather: WeatherData = {
        date: date,
        location: city || 'Localisation inconnue',
        temperature: Math.round(15 + Math.random() * 20), // 15-35°C
        condition: ['Soleil', 'Nuageux', 'Pluie', 'Tempête'][Math.floor(Math.random() * 4)],
        humidity: Math.round(40 + Math.random() * 40), // 40-80%
        windSpeed: Math.round(5 + Math.random() * 20), // 5-25 km/h
        precipitationChance: Math.round(Math.random() * 70) // 0-70%
      };

      setWeather(mockWeather);
    } catch (err) {
      setError('Erreur lors de la récupération des données météo');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'soleil':
        return '☀️';
      case 'nuageux':
        return '☁️';
      case 'pluie':
        return '🌧️';
      case 'tempête':
        return '⛈️';
      default:
        return '🌤️';
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 10) return 'text-blue-600';
    if (temp < 20) return 'text-gray-600';
    if (temp < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (error) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <span className="text-2xl mr-3">❓</span>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Météo indisponible
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Chargement météo...
          </p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="text-3xl mr-3">
              {getWeatherIcon(weather.condition)}
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {weather.location}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(weather.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <span className={`text-2xl font-bold ${getTemperatureColor(weather.temperature)}`}>
                {weather.temperature}°C
              </span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {weather.condition}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400 mr-2">💧</span>
                <span className="text-gray-700 dark:text-white">{weather.humidity}%</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400 mr-2">💨</span>
                <span className="text-gray-700 dark:text-white">{weather.windSpeed} km/h</span>
              </div>
            </div>
          </div>

          {weather.precipitationChance > 20 && (
            <div className="mt-3 flex items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400 mr-2">🌧️</span>
              <span className="text-gray-700 dark:text-white">
                Risque de pluie: {weather.precipitationChance}%
              </span>
            </div>
          )}
        </div>

        <button
          onClick={fetchWeather}
          className="ml-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Actualiser"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

