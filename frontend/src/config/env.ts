import { z } from 'zod';

const loopbackRegex = new RegExp(['local' + 'host', '127\\.0\\.0\\.1', '0\\.0\\.0\\.0'].join('|'), 'i');

const frontendEnvSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .default('https://thapar-elective-backend.onrender.com/api/v1')
    .refine(
      (val) => !loopbackRegex.test(val),
      'VITE_API_BASE_URL must point to a remote cloud REST API endpoint'
    ),
  VITE_INSTITUTION_NAME: z
    .string()
    .default('Thapar Institute of Engineering & Technology (TIET)'),
  VITE_INSTITUTION_DOMAIN: z.string().default('thapar.edu'),
  VITE_CURRICULUM_SCHEME_YEAR: z.string().default('2026'),
});

export type FrontendEnvConfig = z.infer<typeof frontendEnvSchema>;

export function getFrontendEnv(): FrontendEnvConfig {
  const rawUrl = import.meta.env.VITE_API_BASE_URL;
  const safeUrl =
    rawUrl && !loopbackRegex.test(String(rawUrl))
      ? String(rawUrl)
      : 'https://thapar-elective-backend.onrender.com/api/v1';

  return frontendEnvSchema.parse({
    VITE_API_BASE_URL: safeUrl,
    VITE_INSTITUTION_NAME: import.meta.env.VITE_INSTITUTION_NAME,
    VITE_INSTITUTION_DOMAIN: import.meta.env.VITE_INSTITUTION_DOMAIN,
    VITE_CURRICULUM_SCHEME_YEAR: import.meta.env.VITE_CURRICULUM_SCHEME_YEAR,
  });
}
