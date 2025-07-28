/**
 * Feature flags for gradual rollout of clean architecture
 */

export const USE_CLEAN_ARCHITECTURE = process.env.USE_CLEAN_ARCHITECTURE === 'true'

export function isCleanArchitectureEnabled(): boolean {
  return USE_CLEAN_ARCHITECTURE
}