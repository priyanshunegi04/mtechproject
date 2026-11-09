import { validateEnv } from '../config/env';

describe('Security Hardening & Environment Credential Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should accept valid production configuration with secure tokens', () => {
    const validConfig = validateEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://prod_user:SecurePass2026@cluster0.prod.mongodb.net/thapar_elective_ai',
      JWT_ACCESS_SECRET: 'a_very_secure_random_production_jwt_access_secret_64_bytes_minimum',
      JWT_REFRESH_SECRET: 'a_very_secure_random_production_jwt_refresh_secret_64_bytes_minimum',
      ML_SERVICE_API_KEY: 'a_very_secure_random_production_ml_service_api_key_64_bytes_min',
      ML_SERVICE_URL: 'https://thapar-elective-ml.onrender.com',
      FRONTEND_ORIGIN: 'https://mtechproject.vercel.app',
    });

    expect(validConfig.NODE_ENV).toBe('production');
    expect(validConfig.JWT_ACCESS_SECRET).toBe('a_very_secure_random_production_jwt_access_secret_64_bytes_minimum');
  });

  it('should reject production startup if JWT_ACCESS_SECRET uses default placeholder', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb+srv://prod_user:SecurePass2026@cluster0.prod.mongodb.net/thapar_elective_ai',
        JWT_ACCESS_SECRET: 'tiet_jwt_access_secret_key_minimum_32_characters_required_prod',
        JWT_REFRESH_SECRET: 'a_very_secure_random_production_jwt_refresh_secret_64_bytes_minimum',
        ML_SERVICE_API_KEY: 'a_very_secure_random_production_ml_service_api_key_64_bytes_min',
      });
    }).toThrow(/Security Hardening Violation.*JWT_ACCESS_SECRET/);
  });

  it('should reject production startup if ML_SERVICE_API_KEY uses default placeholder', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb+srv://prod_user:SecurePass2026@cluster0.prod.mongodb.net/thapar_elective_ai',
        JWT_ACCESS_SECRET: 'a_very_secure_random_production_jwt_access_secret_64_bytes_minimum',
        JWT_REFRESH_SECRET: 'a_very_secure_random_production_jwt_refresh_secret_64_bytes_minimum',
        ML_SERVICE_API_KEY: 'tiet_ml_internal_secret_key_change_in_production_minimum_32_chars',
      });
    }).toThrow(/Security Hardening Violation.*ML_SERVICE_API_KEY/);
  });

  it('should reject production startup if MONGODB_URI contains unconfigured placeholders', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/thapar_elective_ai',
        JWT_ACCESS_SECRET: 'a_very_secure_random_production_jwt_access_secret_64_bytes_minimum',
        JWT_REFRESH_SECRET: 'a_very_secure_random_production_jwt_refresh_secret_64_bytes_minimum',
        ML_SERVICE_API_KEY: 'a_very_secure_random_production_ml_service_api_key_64_bytes_min',
      });
    }).toThrow(/Security Hardening Violation.*MONGODB_URI/);
  });

  it('should allow default tokens in development mode for developer ease-of-use', () => {
    const devConfig = validateEnv({
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb+srv://test_user:test_pass@cluster0.mongodb.net/thapar_elective_ai',
      JWT_ACCESS_SECRET: 'tiet_jwt_access_secret_key_minimum_32_characters_required_prod',
      JWT_REFRESH_SECRET: 'tiet_jwt_refresh_secret_key_minimum_32_characters_required_prod',
      ML_SERVICE_API_KEY: 'tiet_ml_internal_secret_key_change_in_production_minimum_32_chars',
      ML_SERVICE_URL: 'https://thapar-elective-ml.onrender.com',
    });

    expect(devConfig.NODE_ENV).toBe('development');
  });
});
