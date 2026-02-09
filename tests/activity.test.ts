import { ActivityRanker } from '../src/utils/activityRanker';

describe('ActivityRanker', () => {
  let ranker: ActivityRanker;

  beforeEach(() => {
    ranker = new ActivityRanker();
  });

  describe('rankActivities', () => {
    it('should rank surfing highest with strong wind and low precipitation', () => {
      const weather = {
        temperatureMax: 22,
        temperatureMin: 18,
        precipitation: 0.5,
        windSpeedMax: 30
      };

      const scores = ranker.rankActivities(weather);
      const surfing = scores.find((s) => s.activity === 'SURFING');

      expect(surfing).toBeDefined();
      expect(surfing!.score).toBe(70); // 30 (wind) + 20 (precip) + 20 (temp)
    });

    it('should rank skiing highest with cold temperature', () => {
      const weather = {
        temperatureMax: 2,
        temperatureMin: -5,
        precipitation: 5,
        windSpeedMax: 15
      };

      const scores = ranker.rankActivities(weather);
      const skiing = scores.find((s) => s.activity === 'SKIING');

      expect(skiing).toBeDefined();
      expect(skiing!.score).toBe(60); // 40 (temp) + 20 (precip)
    });

    it('should rank outdoor sightseeing highest with clear, warm weather', () => {
      const weather = {
        temperatureMax: 24,
        temperatureMin: 18,
        precipitation: 0.2,
        windSpeedMax: 10
      };

      const scores = ranker.rankActivities(weather);
      const outdoor = scores.find((s) => s.activity === 'OUTDOOR_SIGHTSEEING');

      expect(outdoor).toBeDefined();
      expect(outdoor!.score).toBe(70); // 40 (precip) + 30 (temp)
    });

    it('should rank indoor sightseeing highest with heavy rain', () => {
      const weather = {
        temperatureMax: 15,
        temperatureMin: 10,
        precipitation: 8,
        windSpeedMax: 35
      };

      const scores = ranker.rankActivities(weather);
      const indoor = scores.find((s) => s.activity === 'INDOOR_SIGHTSEEING');

      expect(indoor).toBeDefined();
      expect(indoor!.score).toBe(60); // 40 (precip) + 20 (wind)
    });

    it('should return all activities in ranked order', () => {
      const weather = {
        temperatureMax: 20,
        temperatureMin: 15,
        precipitation: 2,
        windSpeedMax: 20
      };

      const scores = ranker.rankActivities(weather);

      expect(scores).toHaveLength(4);
      expect(scores.every((s) => s.score >= 0)).toBe(true);
      expect(scores[0]!.score >= scores[1]!.score).toBe(true);
    });
  });

  describe('getRecommendedActivity', () => {
    it('should return the highest-scoring activity', () => {
      const weather = {
        temperatureMax: 2,
        temperatureMin: -5,
        precipitation: 5,
        windSpeedMax: 15
      };

      const recommended = ranker.getRecommendedActivity(weather);
      expect(recommended).toBe('SKIING');
    });

    it('should handle zero-score activities', () => {
      const weather = {
        temperatureMax: 35,
        temperatureMin: 28,
        precipitation: 0,
        windSpeedMax: 5
      };

      const recommended = ranker.getRecommendedActivity(weather);
      expect(['SKIING', 'SURFING', 'INDOOR_SIGHTSEEING', 'OUTDOOR_SIGHTSEEING']).toContain(recommended);
    });
  });

  describe('scoring reasons', () => {
    it('should include reason text in activity scores', () => {
      const weather = {
        temperatureMax: 25,
        temperatureMin: 20,
        precipitation: 0.1,
        windSpeedMax: 28
      };

      const scores = ranker.rankActivities(weather);
      const surfing = scores.find((s) => s.activity === 'SURFING');

      expect(surfing!.reason).toContain('wind');
      expect(surfing!.reason.length > 0).toBe(true);
    });
  });
});
