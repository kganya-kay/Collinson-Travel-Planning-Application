import { WeatherService } from '../src/modules/weather/weather.service';
import type { OpenMeteoClient } from '../src/clients/openmeteo.client';
import type { ForecastData } from '../src/modules/weather/weather.types';

describe('WeatherService', () => {
  let weatherService: WeatherService;
  let mockClient: jest.Mocked<OpenMeteoClient>;

  const mockForecastData: ForecastData = {
    latitude: -33.9249,
    longitude: 18.4241,
    daily: {
      time: ['2026-02-06', '2026-02-07', '2026-02-08'],
      temperature_2m_max: [26.5, 25.0, 24.5],
      temperature_2m_min: [18.2, 17.5, 16.8],
      precipitation_sum: [0.0, 2.5, 5.0],
      windspeed_10m_max: [22.5, 25.0, 28.5]
    }
  };

  beforeEach(() => {
    mockClient = {
      searchCities: jest.fn(),
      searchCitiesByCoordinates: jest.fn(),
      getForecast: jest.fn().mockResolvedValue(mockForecastData)
    } as any;

    weatherService = new WeatherService(mockClient);
  });

  describe('getForecast', () => {
    it('should return transformed forecast data', async () => {
      const forecast = await weatherService.getForecast(-33.9249, 18.4241);

      expect(forecast).toHaveLength(3);
      expect(forecast[0]!.date).toBe('2026-02-06');
      expect(forecast[0]!.temperatureMax).toBe(26.5);
      expect(forecast[0]!.temperatureMin).toBe(18.2);
      expect(forecast[0]!.precipitation).toBe(0.0);
      expect(forecast[0]!.windSpeedMax).toBe(22.5);
    });

    it('should call client with correct coordinates', async () => {
      await weatherService.getForecast(52.52, 13.405);

      expect(mockClient.getForecast).toHaveBeenCalledWith(52.52, 13.405);
    });

    it('should handle multiple days correctly', async () => {
      const forecast = await weatherService.getForecast(-33.9249, 18.4241);

      expect(forecast).toHaveLength(3);
      expect(forecast[1]!.date).toBe('2026-02-07');
      expect(forecast[2]!.date).toBe('2026-02-08');
    });
  });

  describe('getAverageForecast', () => {
    it('should calculate average weather across forecast days', async () => {
      const avgForecast = await weatherService.getAverageForecast(-33.9249, 18.4241);

      // Average temp max: (26.5 + 25.0 + 24.5) / 3 = 25.33
      expect(avgForecast.temperatureMax).toBeCloseTo(25.33, 1);

      // Average temp min: (18.2 + 17.5 + 16.8) / 3 = 17.5
      expect(avgForecast.temperatureMin).toBeCloseTo(17.5, 1);

      // Average precip: (0.0 + 2.5 + 5.0) / 3 = 2.5
      expect(avgForecast.precipitation).toBeCloseTo(2.5, 1);

      // Average wind: (22.5 + 25.0 + 28.5) / 3 = 25.33
      expect(avgForecast.windSpeedMax).toBeCloseTo(25.33, 1);
    });

    it('should return numbers for all weather metrics', async () => {
      const avgForecast = await weatherService.getAverageForecast(-33.9249, 18.4241);

      expect(typeof avgForecast.temperatureMax).toBe('number');
      expect(typeof avgForecast.temperatureMin).toBe('number');
      expect(typeof avgForecast.precipitation).toBe('number');
      expect(typeof avgForecast.windSpeedMax).toBe('number');
    });

    it('should handle single day forecast', async () => {
      mockClient.getForecast.mockResolvedValue({
        latitude: 0,
        longitude: 0,
        daily: {
          time: ['2026-02-06'],
          temperature_2m_max: [25.0],
          temperature_2m_min: [18.0],
          precipitation_sum: [2.0],
          windspeed_10m_max: [20.0]
        }
      });

      const avgForecast = await weatherService.getAverageForecast(0, 0);

      expect(avgForecast.temperatureMax).toBe(25.0);
      expect(avgForecast.temperatureMin).toBe(18.0);
      expect(avgForecast.precipitation).toBe(2.0);
      expect(avgForecast.windSpeedMax).toBe(20.0);
    });
  });
});
