use std::sync::Arc;

use async_trait::async_trait;

use crate::config::StorageConfig;

pub mod cloudflare_kv;
pub mod redis;

/// Result of a `get_with_ttl` lookup.
///
/// `ttl_secs` is the remaining time-to-live in seconds, or `-1` if unknown /
/// unsupported by the backend (mirrors Redis `TTL` semantics where `-1`
/// indicates "no associated expire").
pub struct StoredValue {
    pub value: Vec<u8>,
    pub ttl_secs: i64,
}

#[async_trait]
pub trait Storage: Send + Sync + 'static {
    /// Atomically set `key` to `value` with a TTL, only if it does not already
    /// exist. Returns `Ok(true)` on success, `Ok(false)` on collision.
    async fn set_nx_ex(&self, key: &str, value: &[u8], ttl_secs: u64) -> anyhow::Result<bool>;

    /// Fetch a value and its remaining TTL.
    async fn get_with_ttl(&self, key: &str) -> anyhow::Result<Option<StoredValue>>;

    /// Delete a key. Missing keys are not an error.
    async fn delete(&self, key: &str) -> anyhow::Result<()>;

    /// Cheap liveness check against the backend.
    async fn health(&self) -> anyhow::Result<()>;
}

pub async fn build(cfg: &StorageConfig) -> anyhow::Result<Arc<dyn Storage>> {
    match cfg {
        StorageConfig::Redis { url } => {
            let store = self::redis::RedisStorage::connect(url).await?;
            Ok(Arc::new(store))
        }
        StorageConfig::CloudflareKv {
            account_id,
            namespace_id,
            api_token,
        } => {
            let store =
                self::cloudflare_kv::CloudflareKvStorage::new(account_id, namespace_id, api_token)?;
            Ok(Arc::new(store))
        }
    }
}
