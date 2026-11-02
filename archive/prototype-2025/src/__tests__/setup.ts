// Test setup file for Jest
import '@testing-library/jest-dom'

// Mock window.localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.alert
Object.defineProperty(window, 'alert', {
  value: jest.fn()
})

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }

beforeEach(() => {
  // Reset localStorage before each test
  localStorage.clear()
  
  // Mock console methods
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  // Restore console methods
  jest.restoreAllMocks()
})

// Mock fetch globally
global.fetch = jest.fn()

// Mock process.env
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = originalEnv
})

// Mock Date for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z')

beforeAll(() => {
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)
  Date.now = jest.fn(() => mockDate.getTime())
})

afterAll(() => {
  jest.restoreAllMocks()
})