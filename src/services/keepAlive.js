// Keep backend alive during active sessions
import api from './api';

class KeepAliveService {
  constructor() {
    this.interval = null;
    this.isActive = false;
    this.activeComponents = new Set();
  }

  start(componentName = 'unknown') {
    this.activeComponents.add(componentName);
    
    if (this.isActive) {
      console.log(`🔄 Keep-alive already running (${this.activeComponents.size} components)`);
      return;
    }
    
    this.isActive = true;
    console.log(`🔄 Keep-alive service started by ${componentName}`);
    
    // Initial ping
    this.ping();
    
    // Ping every 10 minutes
    this.interval = setInterval(() => {
      this.ping();
    }, 10 * 60 * 1000); // 10 minutes
  }

  stop(componentName = 'unknown') {
    this.activeComponents.delete(componentName);
    
    // Only stop if no components are using it
    if (this.activeComponents.size > 0) {
      console.log(`🔄 Keep-alive still needed by ${this.activeComponents.size} components`);
      return;
    }
    
    if (!this.isActive) return;
    
    this.isActive = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log(`⏹️ Keep-alive service stopped (no active components)`);
  }

  async ping() {
    try {
      await api.get('/health');
      console.log(`✅ Keep-alive ping successful at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.warn('⚠️ Keep-alive ping failed:', error.message);
      // If backend is sleeping, this will wake it up for next request
    }
  }

  // Force stop (for cleanup)
  forceStop() {
    this.activeComponents.clear();
    this.stop();
  }
}

export const keepAliveService = new KeepAliveService();