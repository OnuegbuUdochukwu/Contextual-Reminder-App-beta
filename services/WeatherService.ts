import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export default class WeatherService {
  static async getCurrentWeather(lat: number = 0, lon: number = 0): Promise<string> {
    try {
      const response = await axios.get(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
      return response.data.weather[0].main.toLowerCase();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return '';
    }
  }
}

