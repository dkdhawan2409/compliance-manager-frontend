// AI Configuration
export const AI_CONFIG = {
  // Environment variable for OpenAI API key
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  
  // Default model settings
  DEFAULT_MODEL: 'gpt-3.5-turbo',
  DEFAULT_MAX_TOKENS: 1000,
  DEFAULT_TEMPERATURE: 0.7,
  
  // Check if environment variable is available
  hasEnvironmentKey: (): boolean => {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  },
  
  // Get API key from environment or return null
  getApiKey: (): string | null => {
    return import.meta.env.VITE_OPENAI_API_KEY || null;
  },
  
  // Get default settings
  getDefaultSettings: () => ({
    model: AI_CONFIG.DEFAULT_MODEL,
    maxTokens: AI_CONFIG.DEFAULT_MAX_TOKENS,
    temperature: AI_CONFIG.DEFAULT_TEMPERATURE
  })
};
