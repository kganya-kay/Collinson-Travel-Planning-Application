import type { ActivityType, ActivityScore, WeatherData } from '../modules/activity/activity.types.js';

/**
 * ActivityRanker implements a deterministic scoring algorithm for recommending activities.
 * 
 * Design Rationale:
 * - Each activity has specific weather requirements based on real-world conditions
 * - Scoring is transparent with reasons provided for each score
 * - This allows users to understand why an activity is recommended
 * - Deterministic scoring ensures consistent recommendations for the same weather
 * 
 * Scoring Approach:
 * Rather than using ML/blackbox models, we use explicit rules that are:
 * - Easy to test and verify
 * - Transparent to users and auditors
 * - Simple to iterate on based on feedback
 * - Domain-driven: rules are based on actual activity requirements
 */
export class ActivityRanker {
  /**
   * Score surfing based on wind energy and water temperature.
   * 
   * Wind is the primary factor for surfing quality. We prioritize:
   * - Wind speed 25+ km/h (strong, rideable swells)
   * - Low precipitation (clearer visibility, safer conditions)
   * - Warm temperature 18°C+ (comfort and water temperature)
   */
  private scoreSurfing(weather: WeatherData): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Primary factor: wind drives wave formation
    if (weather.windSpeedMax >= 25) {
      score += 30;
      reasons.push('Strong wind creates rideable swells');
    }

    // Secondary: visibility and safety
    if (weather.precipitation < 2) {
      score += 20;
      reasons.push('Good visibility, minimal rain');
    }

    // Tertiary: comfort factor
    if (weather.temperatureMax > 18) {
      score += 20;
      reasons.push('Warm enough for extended water time');
    }

    return { score, reasons: reasons.length > 0 ? reasons : ['Conditions unfavorable: low wind speed'] };
  }

  /**
   * Score skiing based on snow conditions and temperature.
   * 
   * Temperature is critical for skiing. Optimal conditions:
   * - Temperature below 5°C (preserves snow quality)
   * - Precipitation above 2mm (fresh snow cover)
   * 
   * Note: We avoid scoring based solely on weather for cold climates
   * since infrastructure (lifts, grooming) isn't modeled here.
   */
  private scoreSkiing(weather: WeatherData): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Primary factor: snow preservation and formation
    if (weather.temperatureMax < 5) {
      score += 40;
      reasons.push('Below freezing - excellent snow conditions');
    }

    // Secondary: fresh powder availability
    if (weather.precipitation > 2) {
      score += 20;
      reasons.push('Fresh snow accumulation expected');
    }

    return { score, reasons: reasons.length > 0 ? reasons : ['Too warm for quality snow conditions'] };
  }

  /**
   * Score outdoor sightseeing based on visibility and comfort.
   * 
   * Outdoor sightseeing prioritizes:
   * - Dry conditions (visibility, comfort)
   * - Comfortable temperature range (18-28°C)
   * 
   * This activity is most sensitive to precipitation since rain 
   * directly impacts touring experience and photo quality.
   */
  private scoreOutdoorSightseeing(weather: WeatherData): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Primary: visibility and dry conditions
    if (weather.precipitation < 1) {
      score += 40;
      reasons.push('Clear, dry skies perfect for sightseeing');
    }

    // Secondary: comfort range for prolonged outdoor exposure
    if (weather.temperatureMax >= 18 && weather.temperatureMax <= 28) {
      score += 30;
      reasons.push('Comfortable temperature for walking tours');
    }

    return { score, reasons: reasons.length > 0 ? reasons : ['Weather conditions limit outdoor touring'] };
  }

  /**
   * Score indoor sightseeing as complement to outdoor activities.
   * 
   * Unlike other activities, indoor sightseeing benefits from poor weather:
   * - Heavy rain/strong wind discourage outdoor alternatives
   * - Bad weather is actually a sign to pursue indoor attractions
   * 
   * This demonstrates that different activities have different weather preferences,
   * which is intentional in the ranking system.
   */
  private scoreIndoorSightseeing(weather: WeatherData): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Primary: avoid outdoor activities
    if (weather.precipitation > 4) {
      score += 40;
      reasons.push('Heavy rain makes indoor activities ideal');
    }

    // Secondary: strong wind also limits outdoor options
    if (weather.windSpeedMax > 30) {
      score += 20;
      reasons.push('Strong wind suggests indoor entertainment');
    }

    return { score, reasons: reasons.length > 0 ? reasons : ['Outdoor conditions are favorable'] };
  }

  /**
   * Rank all activities for given weather conditions
   */
  public rankActivities(weather: WeatherData): ActivityScore[] {
    const surfing = this.scoreSurfing(weather);
    const skiing = this.scoreSkiing(weather);
    const outdoorSightseeing = this.scoreOutdoorSightseeing(weather);
    const indoorSightseeing = this.scoreIndoorSightseeing(weather);

    const activities: ActivityScore[] = [
      {
        activity: 'SURFING',
        score: surfing.score,
        reason: surfing.reasons.join(' and ')
      },
      {
        activity: 'SKIING',
        score: skiing.score,
        reason: skiing.reasons.join(' and ')
      },
      {
        activity: 'OUTDOOR_SIGHTSEEING',
        score: outdoorSightseeing.score,
        reason: outdoorSightseeing.reasons.join(' and ')
      },
      {
        activity: 'INDOOR_SIGHTSEEING',
        score: indoorSightseeing.score,
        reason: indoorSightseeing.reasons.join(' and ')
      }
    ];

    // Sort by score descending
    return activities.sort((a, b) => b.score - a.score);
  }

  /**
   * Get the single best recommended activity
   */
  public getRecommendedActivity(weather: WeatherData): ActivityType {
    const ranked = this.rankActivities(weather);
    return ranked[0]!.activity;
  }
}
