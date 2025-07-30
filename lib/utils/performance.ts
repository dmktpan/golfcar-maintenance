// lib/utils/performance.ts
interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: Date
  success: boolean
  error?: string
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000 // เก็บ metrics ล่าสุด 1000 รายการ

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  async measureOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now()
    const timestamp = new Date()
    
    try {
      const result = await operation()
      const duration = Date.now() - startTime
      
      this.addMetric({
        operation: operationName,
        duration,
        timestamp,
        success: true
      })
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`🐌 Slow operation: ${operationName} took ${duration}ms`)
      } else if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.log(`⏱️ ${operationName}: ${duration}ms`)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.addMetric({
        operation: operationName,
        duration,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      console.error(`❌ Failed operation: ${operationName} (${duration}ms)`, error)
      throw error
    }
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // เก็บเฉพาะ metrics ล่าสุด
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  getMetrics(limit = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit)
  }

  getSlowOperations(threshold = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold)
  }

  getFailedOperations(): PerformanceMetric[] {
    return this.metrics.filter(m => !m.success)
  }

  getAverageTime(operationName?: string): number {
    const relevantMetrics = operationName 
      ? this.metrics.filter(m => m.operation === operationName && m.success)
      : this.metrics.filter(m => m.success)
    
    if (relevantMetrics.length === 0) return 0
    
    const totalTime = relevantMetrics.reduce((sum, m) => sum + m.duration, 0)
    return Math.round(totalTime / relevantMetrics.length)
  }

  getStats() {
    const total = this.metrics.length
    const successful = this.metrics.filter(m => m.success).length
    const failed = total - successful
    const avgTime = this.getAverageTime()
    const slowOps = this.getSlowOperations().length
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      averageTime: avgTime,
      slowOperations: slowOps,
      recentMetrics: this.getMetrics(10)
    }
  }

  clearMetrics(): void {
    this.metrics = []
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// Helper function สำหรับใช้งานง่าย
export const measurePerformance = <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  return performanceMonitor.measureOperation(operation, operationName)
}