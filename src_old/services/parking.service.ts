import { apiClient } from './api';
import type { ParkingSession, ParkingMeter, ParkingZone } from '../types';

export const parkingService = {
  /**
   * Get available parking zones
   */
  async getZones() {
    return await apiClient.get<ParkingZone[]>('/parking/zones');
  },

  /**
   * Get parking meters in a zone
   */
  async getMeters(zoneId: string) {
    return await apiClient.get<ParkingMeter[]>(`/parking/zones/${zoneId}/meters`);
  },

  /**
   * Get nearby meters based on location
   */
  async getNearbyMeters(lat: number, lng: number, radius: number = 500) {
    return await apiClient.get<ParkingMeter[]>('/parking/meters/nearby', {
      lat,
      lng,
      radius,
    });
  },

  /**
   * Start a parking session
   */
  async startSession(data: {
    userId: string;
    vehicleId: string;
    meterId: string;
    duration: number;
  }) {
    return await apiClient.post<ParkingSession>('/parking/sessions/start', data);
  },

  /**
   * End a parking session
   */
  async endSession(sessionId: string) {
    return await apiClient.post<ParkingSession>(`/parking/sessions/${sessionId}/end`);
  },

  /**
   * Extend parking session
   */
  async extendSession(sessionId: string, additionalMinutes: number) {
    return await apiClient.post<ParkingSession>(`/parking/sessions/${sessionId}/extend`, {
      additionalMinutes,
    });
  },

  /**
   * Get active session for user
   */
  async getActiveSession(userId: string) {
    return await apiClient.get<ParkingSession>(`/users/${userId}/parking/active`);
  },

  /**
   * Get parking session history
   */
  async getSessionHistory(
    userId: string,
    params?: {
      page?: number;
      pageSize?: number;
      startDate?: string;
      endDate?: string;
    }
  ) {
    return await apiClient.get<ParkingSession[]>(`/users/${userId}/parking/history`, params);
  },

  /**
   * Calculate parking cost
   */
  async calculateCost(meterId: string, duration: number) {
    return await apiClient.get<{ cost: number; currency: string }>('/parking/calculate-cost', {
      meterId,
      duration,
    });
  },
};
