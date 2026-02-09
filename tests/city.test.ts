import { CityService } from '../src/modules/city/city.service';
import type { OpenMeteoClient } from '../src/clients/openmeteo.client';
import { CityNotFoundError } from '../src/utils/errors';

describe('CityService', () => {
  let cityService: CityService;
  let mockClient: jest.Mocked<OpenMeteoClient>;

  beforeEach(() => {
    mockClient = {
      searchCities: jest.fn(),
      searchCitiesByCoordinates: jest.fn(),
      getForecast: jest.fn()
    } as any;

    cityService = new CityService(mockClient);
  });

  describe('searchCities', () => {
    it('should return city suggestions from client', async () => {
      mockClient.searchCities.mockResolvedValue([
        {
          id: 3369157,
          name: 'Cape Town',
          country: 'South Africa',
          latitude: -33.9249,
          longitude: 18.4241
        },
        {
          id: 3374330,
          name: 'Capetown',
          country: 'South Africa',
          latitude: -33.925,
          longitude: 18.424
        }
      ]);

      const results = await cityService.searchCities('cap');

      expect(results).toHaveLength(2);
      expect(results[0]!.name).toBe('Cape Town');
      expect(results[0]!.country).toBe('South Africa');
      expect(mockClient.searchCities).toHaveBeenCalledWith('cap');
    });

    it('should throw CityNotFoundError when no results', async () => {
      mockClient.searchCities.mockResolvedValue([]);

      await expect(cityService.searchCities('xyz123')).rejects.toThrow(CityNotFoundError);
    });

    it('should throw error for empty query', async () => {
      await expect(cityService.searchCities('')).rejects.toThrow(CityNotFoundError);
    });

    it('should transform coordinates to numbers', async () => {
      mockClient.searchCities.mockResolvedValue([
        {
          id: 1,
          name: 'Test City',
          country: 'Test Country',
          latitude: 52.52,
          longitude: 13.405
        }
      ]);

      const results = await cityService.searchCities('test');

      expect(typeof results[0]!.latitude).toBe('number');
      expect(typeof results[0]!.longitude).toBe('number');
    });

    it('should convert city ID to string', async () => {
      mockClient.searchCities.mockResolvedValue([
        {
          id: 123456,
          name: 'City',
          country: 'Country',
          latitude: 0,
          longitude: 0
        }
      ]);

      const results = await cityService.searchCities('city');

      expect(typeof results[0]!.id).toBe('string');
      expect(results[0]!.id).toBe('123456');
    });
  });
});
