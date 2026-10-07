declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
declare namespace Cloudflare { interface Env { ADMIN_EMAIL?: string; METRICS_SALT?: string; } }
declare namespace Cloudflare { interface Env { WORKER_TOKEN?: string; MCP_INGEST_TOKEN?: string; SITE_NAME?: string; SITE_URL?: string; } }
declare namespace Cloudflare { interface Env { MIGRATION_EXPORT_TOKEN?: string; } }
declare namespace Cloudflare {interface Env {GOOGLE_CLIENT_ID?:string;GOOGLE_CLIENT_SECRET?:string;}}
