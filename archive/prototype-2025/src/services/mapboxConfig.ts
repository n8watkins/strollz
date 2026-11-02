// Mapbox Configuration and Token Management
// Handles environment-specific tokens and provides centralized access control

export type MapboxEnvironment = 'development' | 'staging' | 'production'

export interface MapboxTokenConfig {
  token: string
  environment: MapboxEnvironment
  restrictedUrls: string[]
  description: string
  usageRestrictions?: {
    maxDailyRequests?: number
    allowedServices?: string[]
  }
}

export interface MapboxServiceConfig {
  webMapsEnabled: boolean
  geocodingEnabled: boolean
  directionsEnabled: boolean
  staticImagesEnabled: boolean
  rateLimitingEnabled: boolean
}

class MapboxConfigService {
  private tokenConfig: MapboxTokenConfig | null = null
  private serviceConfig: MapboxServiceConfig
  
  constructor() {
    this.serviceConfig = {
      webMapsEnabled: true,
      geocodingEnabled: true,
      directionsEnabled: true,
      staticImagesEnabled: false,
      rateLimitingEnabled: true
    }
    
    this.initializeConfig()
  }

  private initializeConfig(): void {
    const token = this.getEnvironmentToken()
    const environment = this.getCurrentEnvironment()
    
    if (token && token !== 'your_mapbox_token_here') {
      this.tokenConfig = {
        token,
        environment,
        restrictedUrls: this.getRestrictedUrls(environment),
        description: this.getTokenDescription(environment),
        usageRestrictions: this.getUsageRestrictions(environment)
      }
    }
  }

  private getCurrentEnvironment(): MapboxEnvironment {
    const nodeEnv = process.env.NODE_ENV
    const vercelEnv = process.env.VERCEL_ENV
    
    // Check for explicit environment variables first
    if (process.env.NEXT_PUBLIC_MAPBOX_ENVIRONMENT) {
      return process.env.NEXT_PUBLIC_MAPBOX_ENVIRONMENT as MapboxEnvironment
    }
    
    // Infer from standard environment variables
    if (vercelEnv === 'production') return 'production'
    if (vercelEnv === 'preview') return 'staging'
    if (nodeEnv === 'production') return 'production'
    if (nodeEnv === 'development') return 'development'
    
    // Default to development for local development
    return 'development'
  }

  private getEnvironmentToken(): string | undefined {
    const environment = this.getCurrentEnvironment()
    
    // Try environment-specific token first
    switch (environment) {
      case 'production':
        return process.env.NEXT_PUBLIC_MAPBOX_TOKEN_PROD || 
               process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      case 'staging':
        return process.env.NEXT_PUBLIC_MAPBOX_TOKEN_STAGING || 
               process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      case 'development':
      default:
        return process.env.NEXT_PUBLIC_MAPBOX_TOKEN_DEV || 
               process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    }
  }

  private getRestrictedUrls(environment: MapboxEnvironment): string[] {
    switch (environment) {
      case 'production':
        return [
          'strollvibe.com',
          '*.strollvibe.com'
        ]
      case 'staging':
        return [
          '*.vercel.app',
          'staging.strollvibe.com',
          'localhost:3000'
        ]
      case 'development':
      default:
        return [
          'localhost:3000',
          'localhost:3001',
          '127.0.0.1:3000',
          '*.ngrok.io'
        ]
    }
  }

  private getTokenDescription(environment: MapboxEnvironment): string {
    switch (environment) {
      case 'production':
        return 'Production token for StrollVibe web application'
      case 'staging':
        return 'Staging/Preview token for StrollVibe testing'
      case 'development':
      default:
        return 'Development token for local StrollVibe development'
    }
  }

  private getUsageRestrictions(environment: MapboxEnvironment): MapboxTokenConfig['usageRestrictions'] {
    switch (environment) {
      case 'production':
        return {
          maxDailyRequests: 10000,
          allowedServices: ['maps', 'geocoding', 'directions']
        }
      case 'staging':
        return {
          maxDailyRequests: 1000,
          allowedServices: ['maps', 'geocoding', 'directions']
        }
      case 'development':
      default:
        return {
          maxDailyRequests: 500,
          allowedServices: ['maps', 'geocoding', 'directions']
        }
    }
  }

  // Public methods
  getToken(): string | null {
    return this.tokenConfig?.token || null
  }

  getEnvironment(): MapboxEnvironment {
    return this.tokenConfig?.environment || 'development'
  }

  getTokenConfig(): MapboxTokenConfig | null {
    return this.tokenConfig ? { ...this.tokenConfig } : null
  }

  getServiceConfig(): MapboxServiceConfig {
    return { ...this.serviceConfig }
  }

  isTokenValid(): boolean {
    const token = this.getToken()
    return !!(token && token !== 'your_mapbox_token_here' && token.startsWith('pk.'))
  }

  isServiceEnabled(service: keyof MapboxServiceConfig): boolean {
    return this.serviceConfig[service] && this.isTokenValid()
  }

  canMakeRequest(serviceType: 'maps' | 'geocoding' | 'directions' | 'static'): boolean {
    if (!this.isTokenValid()) return false
    
    const restrictions = this.tokenConfig?.usageRestrictions
    if (!restrictions) return true
    
    const allowedServices = restrictions.allowedServices
    if (!allowedServices) return true
    
    const serviceMap: Record<string, string> = {
      maps: 'maps',
      geocoding: 'geocoding', 
      directions: 'directions',
      static: 'static'
    }
    
    return allowedServices.includes(serviceMap[serviceType])
  }

  getTokenValidationInfo(): {
    isValid: boolean
    environment: MapboxEnvironment
    restrictions: string[]
    warnings: string[]
  } {
    const token = this.getToken()
    const warnings: string[] = []
    const restrictions: string[] = []
    
    if (!token) {
      return {
        isValid: false,
        environment: this.getCurrentEnvironment(),
        restrictions: ['No token configured'],
        warnings: ['Mapbox token not found in environment variables']
      }
    }
    
    if (token === 'your_mapbox_token_here') {
      warnings.push('Using placeholder token - replace with actual Mapbox token')
    }
    
    if (!token.startsWith('pk.')) {
      warnings.push('Token does not appear to be a valid Mapbox public token')
    }
    
    const config = this.getTokenConfig()
    if (config?.usageRestrictions?.maxDailyRequests) {
      restrictions.push(`Max daily requests: ${config.usageRestrictions.maxDailyRequests}`)
    }
    
    if (config?.restrictedUrls?.length) {
      restrictions.push(`URL restrictions: ${config.restrictedUrls.join(', ')}`)
    }
    
    return {
      isValid: this.isTokenValid(),
      environment: this.getEnvironment(),
      restrictions,
      warnings
    }
  }

  // Get recommended environment variable names for current setup
  getRecommendedEnvVars(): Record<string, string> {
    const environment = this.getCurrentEnvironment()
    
    return {
      'Current Environment Token': `NEXT_PUBLIC_MAPBOX_TOKEN_${environment.toUpperCase()}`,
      'Fallback Token': 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN',
      'Environment Override': 'NEXT_PUBLIC_MAPBOX_ENVIRONMENT',
      'Development Token': 'NEXT_PUBLIC_MAPBOX_TOKEN_DEV',
      'Staging Token': 'NEXT_PUBLIC_MAPBOX_TOKEN_STAGING',
      'Production Token': 'NEXT_PUBLIC_MAPBOX_TOKEN_PROD'
    }
  }

  // Update service configuration
  updateServiceConfig(config: Partial<MapboxServiceConfig>): void {
    this.serviceConfig = { ...this.serviceConfig, ...config }
  }

  // Force reinitialize (useful for testing or when env vars change)
  reinitialize(): void {
    this.initializeConfig()
  }

  // Get setup instructions for current environment
  getSetupInstructions(): {
    environment: MapboxEnvironment
    steps: string[]
    environmentVariables: Record<string, string>
  } {
    const environment = this.getCurrentEnvironment()
    const envVars = this.getRecommendedEnvVars()
    
    const steps = [
      '1. Get a Mapbox access token from https://account.mapbox.com/access-tokens/',
      '2. Create a new token with the following scopes: Web Maps, Geocoding, Directions',
      `3. Set URL restrictions for ${environment} environment`,
      `4. Add the token to your .env.local file as ${envVars['Current Environment Token']}`,
      '5. Restart your development server',
      '6. Verify the token is working by checking the browser console'
    ]
    
    const environmentVariables: Record<string, string> = {}
    
    switch (environment) {
      case 'development':
        environmentVariables[envVars['Development Token']] = 'pk.your_development_token_here'
        environmentVariables['NEXT_PUBLIC_MAPBOX_ENVIRONMENT'] = 'development'
        break
      case 'staging':
        environmentVariables[envVars['Staging Token']] = 'pk.your_staging_token_here'
        environmentVariables['NEXT_PUBLIC_MAPBOX_ENVIRONMENT'] = 'staging'
        break
      case 'production':
        environmentVariables[envVars['Production Token']] = 'pk.your_production_token_here'
        environmentVariables['NEXT_PUBLIC_MAPBOX_ENVIRONMENT'] = 'production'
        break
    }
    
    return {
      environment,
      steps,
      environmentVariables
    }
  }
}

// Export singleton instance
export const mapboxConfig = new MapboxConfigService()

// React hook for easier component integration
export function useMapboxConfig() {
  const [config, setConfig] = React.useState(mapboxConfig.getTokenConfig())
  
  React.useEffect(() => {
    // Re-check config on mount (useful if env vars changed)
    mapboxConfig.reinitialize()
    setConfig(mapboxConfig.getTokenConfig())
  }, [])
  
  return {
    token: mapboxConfig.getToken(),
    environment: mapboxConfig.getEnvironment(),
    config: config,
    serviceConfig: mapboxConfig.getServiceConfig(),
    isValid: mapboxConfig.isTokenValid(),
    canMakeRequest: mapboxConfig.canMakeRequest.bind(mapboxConfig),
    validation: mapboxConfig.getTokenValidationInfo(),
    setupInstructions: mapboxConfig.getSetupInstructions(),
    recommendedEnvVars: mapboxConfig.getRecommendedEnvVars()
  }
}

// Import React for the hook
import React from 'react'