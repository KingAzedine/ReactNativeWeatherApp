import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

// Configuration
const API_KEY = 'c518f4a368b7ea107f76bb6a6cfc2ee0'; // Remplace par ta clé API
const WEATHER_API = 'https://api.openweathermap.org/data/2.5';

// Types
type WeatherData = {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: {
    description: string;
    main: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
  dt: number;
};

type ForecastItem = {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: {
    description: string;
    main: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
  dt_txt: string;
};

type ForecastData = {
  list: ForecastItem[];
  city: {
    name: string;
    country: string;
  };
};

const weatherIcons: Record<string, string> = {
  Clear: 'weather-sunny',
  Clouds: 'weather-cloudy',
  Rain: 'weather-rainy',
  Thunderstorm: 'weather-lightning',
  Snow: 'weather-snowy',
  Mist: 'weather-fog',
  Haze: 'weather-fog',
  Fog: 'weather-fog',
  Drizzle: 'weather-rainy'
};

export default function WeatherApp() {
  const [city, setCity] = useState('Paris');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [selectedDay, setSelectedDay] = useState<ForecastItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get(`${WEATHER_API}/weather?q=${city}&units=metric&appid=${API_KEY}&lang=fr`),
        axios.get(`${WEATHER_API}/forecast?q=${city}&units=metric&appid=${API_KEY}&lang=fr&cnt=40`)
      ]);
      
      setWeather(currentResponse.data);
      setForecast(forecastResponse.data);
      setError('');
    } catch (err) {
      setError('Ville non trouvée. Essayez une autre localisation.');
      setWeather(null);
      setForecast(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeather();
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleSearch = () => {
    if (city.trim()) {
      fetchWeather();
    }
  };

  const groupByDay = (data: ForecastData) => {
    if (!data?.list) return [];
    
    const grouped: {[key: string]: ForecastItem[]} = {};
    
    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    
    return Object.values(grouped);
  };

  const formatDay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatHour = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit' });
  };

  const getMinMaxTemp = (day: ForecastItem[]) => {
    const temps = day.map(item => item.main.temp);
    return {
      min: Math.round(Math.min(...temps)),
      max: Math.round(Math.max(...temps))
    };
  };

  const DailyForecast = ({ forecast, onDayPress }: { forecast: ForecastData | null, onDayPress: (day: ForecastItem[]) => void }) => {
    if (!forecast) return null;
    
    const dailyData = groupByDay(forecast);
    
    return (
      <View style={styles.forecastContainer}>
        <Text style={styles.forecastTitle}>Prévisions sur 5 jours</Text>
        {dailyData.slice(0, 5).map((day, index) => {
          const { min, max } = getMinMaxTemp(day);
          return (
            <TouchableOpacity 
              key={index} 
              style={styles.dayCard}
              onPress={() => onDayPress(day)}
            >
              <Text style={styles.dayText}>{formatDay(day[0].dt_txt)}</Text>
              <View style={styles.dayDetails}>
                <MaterialCommunityIcons
                  name={weatherIcons[day[0].weather[0].main] || 'weather-sunny'}
                  size={30}
                  color="white"
                />
                <Text style={styles.dayTemp}>{max}°C / {min}°C</Text>
                <Text style={styles.dayDesc}>
                  {day[0].weather[0].description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Entrez une ville..."
            placeholderTextColor="#ddd"
            value={city}
            onChangeText={setCity}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <MaterialCommunityIcons name="magnify" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="white" />
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="white" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : weather && forecast ? (
          <>
            <View style={styles.weatherContainer}>
              <Text style={styles.city}>{weather.name}</Text>
              <MaterialCommunityIcons
                name={weatherIcons[weather.weather[0].main] || 'weather-sunny'}
                size={120}
                color="white"
                style={styles.weatherIcon}
              />
              <Text style={styles.temperature}>
                {Math.round(weather.main.temp)}°C
              </Text>
              <Text style={styles.description}>
                {weather.weather[0].description}
              </Text>
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="temperature-celsius" size={24} color="white" />
                  <Text style={styles.detailText}>
                    Ressenti: {Math.round(weather.main.feels_like)}°C
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="water" size={24} color="white" />
                  <Text style={styles.detailText}>
                    Humidité: {weather.main.humidity}%
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="weather-windy" size={24} color="white" />
                  <Text style={styles.detailText}>
                    Vent: {Math.round(weather.wind.speed * 3.6)} km/h
                  </Text>
                </View>
              </View>
            </View>

            <DailyForecast 
              forecast={forecast} 
              onDayPress={(day) => setSelectedDay(day)}
            />
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={!!selectedDay}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDay(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedDay(null)}
            >
              <MaterialCommunityIcons name="close" size={28} color="white" />
            </TouchableOpacity>
            
            {selectedDay && (
              <>
                <Text style={styles.modalTitle}>
                  {formatDay(selectedDay[0].dt_txt)}
                </Text>
                
                <View style={styles.modalWeather}>
                  <MaterialCommunityIcons
                    name={weatherIcons[selectedDay[0].weather[0].main] || 'weather-sunny'}
                    size={60}
                    color="white"
                  />
                  <Text style={styles.modalTemp}>
                    {Math.round(selectedDay[0].main.temp)}°C
                  </Text>
                  <Text style={styles.modalDesc}>
                    {selectedDay[0].weather[0].description}
                  </Text>
                </View>
                
                <View style={styles.hourlyContainer}>
                  {selectedDay.slice(0, 8).map((hour, index) => (
                    <View key={index} style={styles.hourlyItem}>
                      <Text style={styles.hourlyText}>{formatHour(hour.dt_txt)}</Text>
                      <MaterialCommunityIcons
                        name={weatherIcons[hour.weather[0].main] || 'weather-sunny'}
                        size={24}
                        color="white"
                      />
                      <Text style={styles.hourlyText}>{Math.round(hour.main.temp)}°C</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.modalDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ressenti:</Text>
                    <Text style={styles.detailValue}>
                      {Math.round(selectedDay[0].main.feels_like)}°C
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Humidité:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDay[0].main.humidity}%
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pression:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDay[0].main.pressure} hPa
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vent:</Text>
                    <Text style={styles.detailValue}>
                      {Math.round(selectedDay[0].wind.speed * 3.6)} km/h
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  weatherContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  city: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weatherIcon: {
    marginVertical: 10,
  },
  temperature: {
    color: 'white',
    fontSize: 72,
    fontWeight: '200',
  },
  description: {
    color: 'white',
    fontSize: 20,
    textTransform: 'capitalize',
    marginBottom: 20,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  detailText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 10,
  },
  forecastContainer: {
    marginTop: 20,
    width: '100%',
  },
  forecastTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  dayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  dayText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  dayDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dayTemp: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
    marginRight: 'auto',
  },
  dayDesc: {
    color: 'white',
    fontSize: 14,
    textTransform: 'capitalize',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#3b5998',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalWeather: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTemp: {
    color: 'white',
    fontSize: 36,
    fontWeight: '200',
    marginVertical: 10,
  },
  modalDesc: {
    color: 'white',
    fontSize: 18,
    textTransform: 'capitalize',
  },
  hourlyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    flexWrap: 'wrap',
  },
  hourlyItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
  },
  hourlyText: {
    color: 'white',
    fontSize: 14,
  },
  modalDetails: {
    marginTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailLabel: {
    color: 'white',
    fontSize: 16,
  },
  detailValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});