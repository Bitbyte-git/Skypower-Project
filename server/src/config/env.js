import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/switchgear_erp',
  JWT_SECRET: process.env.JWT_SECRET || 'switchgear_erp_jwt_secure_key_2026_super_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

