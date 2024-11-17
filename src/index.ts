import { config } from 'dotenv';
import winston from 'winston';
import { VERSION } from './version';

// Load environment variables
config();

// Setup logger
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Export core components
export { Branch } from './core/session';

// Export types and interfaces
export * from './types/configs';
export * from './core/types';

// Export utilities
export * from './utils/id';

// Export constants and settings
export { Settings } from './constants/system';
export { VERSION };

// Set default log level
logger.level = 'info';
