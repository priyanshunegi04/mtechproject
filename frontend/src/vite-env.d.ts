/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_INSTITUTION_NAME?: string;
  readonly VITE_INSTITUTION_DOMAIN?: string;
  readonly VITE_CURRICULUM_SCHEME_YEAR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

