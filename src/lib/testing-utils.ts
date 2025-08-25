// Testing Utilities and Framework for App Studio
// Provides comprehensive testing capabilities for components, utilities, and integrations

export interface TestCase {
  id: string
  name: string
  description: string
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'accessibility'
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  setup?: () => Promise<void> | void
  teardown?: () => Promise<void> | void
  test: () => Promise<void> | void
  timeout?: number
  retries?: number
  skip?: boolean
  only?: boolean
}

export interface TestSuite {
  id: string
  name: string
  description: string
  tests: TestCase[]
  beforeAll?: () => Promise<void> | void
  afterAll?: () => Promise<void> | void
  beforeEach?: () => Promise<void> | void
  afterEach?: () => Promise<void> | void
}

export interface TestResult {
  testId: string
  testName: string
  status: 'passed' | 'failed' | 'skipped' | 'timeout'
  duration: number
  error?: Error
  logs: string[]
  assertions: AssertionResult[]
  coverage?: CoverageInfo
}

export interface AssertionResult {
  type: string
  expected: any
  actual: any
  passed: boolean
  message: string
}

export interface CoverageInfo {
  statements: { covered: number; total: number }
  branches: { covered: number; total: number }
  functions: { covered: number; total: number }
  lines: { covered: number; total: number }
}

export interface TestReport {
  suiteId: string
  suiteName: string
  startTime: Date
  endTime: Date
  duration: number
  results: TestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
    coverage?: CoverageInfo
  }
}

export interface MockFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>
  mockReturnValue: (value: ReturnType<T>) => MockFunction<T>
  mockResolvedValue: (value: Awaited<ReturnType<T>>) => MockFunction<T>
  mockRejectedValue: (error: any) => MockFunction<T>
  mockImplementation: (fn: T) => MockFunction<T>
  mockClear: () => void
  mockReset: () => void
  calls: Parameters<T>[]
  results: Array<{ type: 'return' | 'throw'; value: any }>
}

/**
 * Test Runner class
 */
export class TestRunner {
  private suites: Map<string, TestSuite> = new Map()
  private results: Map<string, TestReport> = new Map()
  private mocks: Map<string, MockFunction<any>> = new Map()
  private globalSetup?: () => Promise<void> | void
  private globalTeardown?: () => Promise<void> | void

  /**
   * Register a test suite
   */
  suite(suite: TestSuite): void {
    this.suites.set(suite.id, suite)
  }

  /**
   * Register a single test
   */
  test(test: TestCase): void {
    const suiteId = 'default'
    let suite = this.suites.get(suiteId)
    
    if (!suite) {
      suite = {
        id: suiteId,
        name: 'Default Suite',
        description: 'Default test suite',
        tests: []
      }
      this.suites.set(suiteId, suite)
    }
    
    suite.tests.push(test)
  }

  /**
   * Run all test suites
   */
  async runAll(): Promise<TestReport[]> {
    const reports: TestReport[] = []
    
    if (this.globalSetup) {
      await this.globalSetup()
    }
    
    try {
      for (const suite of Array.from(this.suites.values())) {
        const report = await this.runSuite(suite)
        reports.push(report)
        this.results.set(suite.id, report)
      }
    } finally {
      if (this.globalTeardown) {
        await this.globalTeardown()
      }
    }
    
    return reports
  }

  /**
   * Run a specific test suite
   */
  async runSuite(suite: TestSuite): Promise<TestReport> {
    const startTime = new Date()
    const results: TestResult[] = []
    
    console.log(`Running test suite: ${suite.name}`)
    
    if (suite.beforeAll) {
      await suite.beforeAll()
    }
    
    try {
      for (const test of suite.tests) {
        if (test.skip) {
          results.push({
            testId: test.id,
            testName: test.name,
            status: 'skipped',
            duration: 0,
            logs: [],
            assertions: []
          })
          continue
        }
        
        const result = await this.runTest(test, suite)
        results.push(result)
      }
    } finally {
      if (suite.afterAll) {
        await suite.afterAll()
      }
    }
    
    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()
    
    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length
    }
    
    return {
      suiteId: suite.id,
      suiteName: suite.name,
      startTime,
      endTime,
      duration,
      results,
      summary
    }
  }

  /**
   * Run a single test
   */
  async runTest(test: TestCase, suite: TestSuite): Promise<TestResult> {
    const startTime = Date.now()
    const logs: string[] = []
    const assertions: AssertionResult[] = []
    
    // Capture console logs
    const originalLog = console.log
    console.log = (...args) => {
      logs.push(args.join(' '))
      originalLog(...args)
    }
    
    try {
      console.log(`  Running test: ${test.name}`)
      
      if (suite.beforeEach) {
        await suite.beforeEach()
      }
      
      if (test.setup) {
        await test.setup()
      }
      
      // Set up test timeout
      const timeout = test.timeout || 5000
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      })
      
      // Run the test
      await Promise.race([test.test(), timeoutPromise])
      
      if (test.teardown) {
        await test.teardown()
      }
      
      if (suite.afterEach) {
        await suite.afterEach()
      }
      
      const duration = Date.now() - startTime
      console.log(`    ✓ ${test.name} (${duration}ms)`)
      
      return {
        testId: test.id,
        testName: test.name,
        status: 'passed',
        duration,
        logs,
        assertions
      }
      
    } catch (error) {
      const duration = Date.now() - startTime
      const status = error instanceof Error && error.message === 'Test timeout' ? 'timeout' : 'failed'
      
      console.log(`    ✗ ${test.name} (${duration}ms)`)
      console.log(`      ${error}`)
      
      return {
        testId: test.id,
        testName: test.name,
        status,
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
        logs,
        assertions
      }
    } finally {
      console.log = originalLog
    }
  }

  /**
   * Create a mock function
   */
  mock<T extends (...args: any[]) => any>(name?: string): MockFunction<T> {
    const calls: Parameters<T>[] = []
    const results: Array<{ type: 'return' | 'throw'; value: any }> = []
    let implementation: T | undefined
    let returnValue: ReturnType<T> | undefined
    let resolvedValue: Awaited<ReturnType<T>> | undefined
    let rejectedValue: any
    
    const mockFn = ((...args: Parameters<T>): ReturnType<T> => {
      calls.push(args)
      
      try {
        let result: ReturnType<T>
        
        if (implementation) {
          result = implementation(...args)
        } else if (resolvedValue !== undefined) {
          result = Promise.resolve(resolvedValue) as ReturnType<T>
        } else if (rejectedValue !== undefined) {
          result = Promise.reject(rejectedValue) as ReturnType<T>
        } else if (returnValue !== undefined) {
          result = returnValue
        } else {
          result = undefined as ReturnType<T>
        }
        
        results.push({ type: 'return', value: result })
        return result
      } catch (error) {
        results.push({ type: 'throw', value: error })
        throw error
      }
    }) as MockFunction<T>
    
    mockFn.mockReturnValue = (value: ReturnType<T>) => {
      returnValue = value
      return mockFn
    }
    
    mockFn.mockResolvedValue = (value: Awaited<ReturnType<T>>) => {
      resolvedValue = value
      return mockFn
    }
    
    mockFn.mockRejectedValue = (error: any) => {
      rejectedValue = error
      return mockFn
    }
    
    mockFn.mockImplementation = (fn: T) => {
      implementation = fn
      return mockFn
    }
    
    mockFn.mockClear = () => {
      calls.length = 0
      results.length = 0
    }
    
    mockFn.mockReset = () => {
      calls.length = 0
      results.length = 0
      implementation = undefined
      returnValue = undefined
      resolvedValue = undefined
      rejectedValue = undefined
    }
    
    mockFn.calls = calls
    mockFn.results = results
    
    if (name) {
      this.mocks.set(name, mockFn)
    }
    
    return mockFn
  }

  /**
   * Get a named mock
   */
  getMock<T extends (...args: any[]) => any>(name: string): MockFunction<T> | undefined {
    return this.mocks.get(name)
  }

  /**
   * Clear all mocks
   */
  clearAllMocks(): void {
    this.mocks.forEach(mock => mock.mockClear())
  }

  /**
   * Reset all mocks
   */
  resetAllMocks(): void {
    this.mocks.forEach(mock => mock.mockReset())
  }

  /**
   * Set global setup and teardown
   */
  setGlobalHooks(setup?: () => Promise<void> | void, teardown?: () => Promise<void> | void): void {
    this.globalSetup = setup
    this.globalTeardown = teardown
  }

  /**
   * Get test results
   */
  getResults(): TestReport[] {
    return Array.from(this.results.values())
  }

  /**
   * Generate test report
   */
  generateReport(): string {
    const reports = this.getResults()
    let output = '\n=== Test Report ===\n\n'
    
    let totalTests = 0
    let totalPassed = 0
    let totalFailed = 0
    let totalSkipped = 0
    let totalDuration = 0
    
    reports.forEach(report => {
      output += `Suite: ${report.suiteName}\n`
      output += `Duration: ${report.duration}ms\n`
      output += `Tests: ${report.summary.total} (${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.skipped} skipped)\n\n`
      
      report.results.forEach(result => {
        const status = result.status === 'passed' ? '✓' : result.status === 'failed' ? '✗' : '○'
        output += `  ${status} ${result.testName} (${result.duration}ms)\n`
        
        if (result.error) {
          output += `    Error: ${result.error.message}\n`
        }
      })
      
      output += '\n'
      
      totalTests += report.summary.total
      totalPassed += report.summary.passed
      totalFailed += report.summary.failed
      totalSkipped += report.summary.skipped
      totalDuration += report.duration
    })
    
    output += `=== Summary ===\n`
    output += `Total Tests: ${totalTests}\n`
    output += `Passed: ${totalPassed}\n`
    output += `Failed: ${totalFailed}\n`
    output += `Skipped: ${totalSkipped}\n`
    output += `Total Duration: ${totalDuration}ms\n`
    output += `Success Rate: ${totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%\n`
    
    return output
  }
}

/**
 * Assertion utilities
 */
export class Expect {
  constructor(private actual: any) {}

  toBe(expected: any): void {
    if (this.actual !== expected) {
      throw new Error(`Expected ${this.actual} to be ${expected}`)
    }
  }

  toEqual(expected: any): void {
    if (!this.deepEqual(this.actual, expected)) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`)
    }
  }

  toBeTruthy(): void {
    if (!this.actual) {
      throw new Error(`Expected ${this.actual} to be truthy`)
    }
  }

  toBeFalsy(): void {
    if (this.actual) {
      throw new Error(`Expected ${this.actual} to be falsy`)
    }
  }

  toBeNull(): void {
    if (this.actual !== null) {
      throw new Error(`Expected ${this.actual} to be null`)
    }
  }

  toBeUndefined(): void {
    if (this.actual !== undefined) {
      throw new Error(`Expected ${this.actual} to be undefined`)
    }
  }

  toContain(expected: any): void {
    if (Array.isArray(this.actual)) {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected array to contain ${expected}`)
      }
    } else if (typeof this.actual === 'string') {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected string to contain ${expected}`)
      }
    } else {
      throw new Error(`Expected ${this.actual} to be an array or string`)
    }
  }

  toHaveLength(expected: number): void {
    if (!this.actual || typeof this.actual.length !== 'number') {
      throw new Error(`Expected ${this.actual} to have a length property`)
    }
    if (this.actual.length !== expected) {
      throw new Error(`Expected length ${this.actual.length} to be ${expected}`)
    }
  }

  toThrow(expectedError?: string | RegExp): void {
    if (typeof this.actual !== 'function') {
      throw new Error(`Expected ${this.actual} to be a function`)
    }

    let threwError = false
    let actualError: Error | undefined

    try {
      this.actual()
    } catch (error) {
      threwError = true
      actualError = error instanceof Error ? error : new Error(String(error))
    }

    if (!threwError) {
      throw new Error('Expected function to throw an error')
    }

    if (expectedError && actualError) {
      if (typeof expectedError === 'string') {
        if (!actualError.message.includes(expectedError)) {
          throw new Error(`Expected error message to contain "${expectedError}", but got "${actualError.message}"`)
        }
      } else if (expectedError instanceof RegExp) {
        if (!expectedError.test(actualError.message)) {
          throw new Error(`Expected error message to match ${expectedError}, but got "${actualError.message}"`)
        }
      }
    }
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true
    
    if (a == null || b == null) return a === b
    
    if (typeof a !== typeof b) return false
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false
      
      const keysA = Object.keys(a)
      const keysB = Object.keys(b)
      
      if (keysA.length !== keysB.length) return false
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false
        if (!this.deepEqual(a[key], b[key])) return false
      }
      
      return true
    }
    
    return false
  }
}

/**
 * Global test utilities
 */
export const testRunner = new TestRunner()

export function expect(actual: any): Expect {
  return new Expect(actual)
}

export function describe(name: string, fn: () => void): void {
  const suite: TestSuite = {
    id: `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: name,
    tests: []
  }
  
  // Temporarily store current suite context
  const currentSuite = suite
  
  // Override global test function to add to current suite
  const originalTest = (globalThis as any).test
  ;(globalThis as any).test = (name: string, fn: () => Promise<void> | void) => {
    currentSuite.tests.push({
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: name,
      category: 'unit',
      priority: 'medium',
      tags: [],
      test: fn
    })
  }
  
  fn()
  
  // Restore original test function
  ;(globalThis as any).test = originalTest
  
  testRunner.suite(suite)
}

export function it(name: string, fn: () => Promise<void> | void): void {
  testRunner.test({
    id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: name,
    category: 'unit',
    priority: 'medium',
    tags: [],
    test: fn
  })
}

export function test(name: string, fn: () => Promise<void> | void): void {
  it(name, fn)
}

export function beforeAll(fn: () => Promise<void> | void): void {
  // This would be implemented to work with the current suite context
}

export function afterAll(fn: () => Promise<void> | void): void {
  // This would be implemented to work with the current suite context
}

export function beforeEach(fn: () => Promise<void> | void): void {
  // This would be implemented to work with the current suite context
}

export function afterEach(fn: () => Promise<void> | void): void {
  // This would be implemented to work with the current suite context
}

/**
 * DOM testing utilities
 */
export class DOMTestUtils {
  static createElement(tag: string, attributes: Record<string, string> = {}): HTMLElement {
    const element = document.createElement(tag)
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
    return element
  }

  static fireEvent(element: HTMLElement, eventType: string, eventInit?: EventInit): void {
    const event = new Event(eventType, eventInit)
    element.dispatchEvent(event)
  }

  static fireClickEvent(element: HTMLElement): void {
    this.fireEvent(element, 'click', { bubbles: true })
  }

  static fireChangeEvent(element: HTMLInputElement, value: string): void {
    element.value = value
    this.fireEvent(element, 'change', { bubbles: true })
  }

  static queryByTestId(testId: string): HTMLElement | null {
    return document.querySelector(`[data-testid="${testId}"]`)
  }

  static queryAllByTestId(testId: string): NodeListOf<HTMLElement> {
    return document.querySelectorAll(`[data-testid="${testId}"]`)
  }

  static waitFor(condition: () => boolean, timeout: number = 1000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const check = () => {
        if (condition()) {
          resolve()
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'))
        } else {
          setTimeout(check, 10)
        }
      }
      
      check()
    })
  }
}

// Export DOM utilities
export const dom = DOMTestUtils

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  static async measureTime<T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
    const start = globalThis.performance.now()
    const result = await fn()
    const duration = globalThis.performance.now() - start
    return { result, duration }
  }

  static async measureMemory<T>(fn: () => Promise<T> | T): Promise<{ result: T; memoryUsed: number }> {
    if (!('memory' in globalThis.performance)) {
      throw new Error('Memory measurement not supported in this environment')
    }

    const startMemory = (globalThis.performance as any).memory.usedJSHeapSize
    const result = await fn()
    const endMemory = (globalThis.performance as any).memory.usedJSHeapSize
    const memoryUsed = endMemory - startMemory

    return { result, memoryUsed }
  }

  static expectPerformance(duration: number, maxDuration: number): void {
    if (duration > maxDuration) {
      throw new Error(`Performance test failed: ${duration}ms > ${maxDuration}ms`)
    }
  }
}

// Export performance utilities
export const performanceUtils = PerformanceTestUtils