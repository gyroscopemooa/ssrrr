CREATE TABLE IF NOT EXISTS auth_users(owner TEXT PRIMARY KEY, google_sub TEXT NOT NULL UNIQUE,email TEXT NOT NULL,display_name TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS auth_sessions(token_hash TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES auth_users(owner),expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at);
CREATE TABLE IF NOT EXISTS auth_flows(state_hash TEXT PRIMARY KEY,verifier TEXT NOT NULL,nonce TEXT NOT NULL,return_to TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS auth_limits(id TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS auth_legacy_links(email TEXT PRIMARY KEY,owner TEXT NOT NULL UNIQUE);
