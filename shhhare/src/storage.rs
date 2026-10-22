pub mod cloudflare_kv;
pub mod redis;

use crate::config::StorageConfig;
use crate::storage::cloudflare_kv::CloudflareKvStorage;
use crate::storage::redis::RedisStorage;

pub struct Entry {
    pub val: String,
    pub bar: bool,
    pub ttl: i64,
}

#[derive(Clone)]
pub enum Storage {
    Redis(RedisStorage),
    CloudflareKv(CloudflareKvStorage),
}

impl Storage {
    pub async fn connect(cfg: StorageConfig) -> anyhow::Result<Self> {
        match cfg {
            StorageConfig::Redis { url } => Ok(Self::Redis(RedisStorage::connect(&url).await?)),
            StorageConfig::CloudflareKv {
                account_id,
                namespace_id,
                api_token,
            } => {
                let storage = CloudflareKvStorage::new(&account_id, &namespace_id, &api_token)?;
                storage.ping().await?;
                Ok(Self::CloudflareKv(storage))
            }
        }
    }

    /// Stores a new secret. Returns `false` if the key already exists.
    pub async fn put(&self, key: &str, val: &str, bar: bool, ttl: u64) -> anyhow::Result<bool> {
        match self {
            Self::Redis(s) => s.put(key, val, bar, ttl).await,
            Self::CloudflareKv(s) => s.put(key, val, bar, ttl).await,
        }
    }

    /// Returns `(bar, ttl)` without reading the secret value.
    pub async fn status(&self, key: &str) -> anyhow::Result<Option<(bool, i64)>> {
        match self {
            Self::Redis(s) => s.status(key).await,
            Self::CloudflareKv(s) => s.status(key).await,
        }
    }

    pub async fn get(&self, key: &str) -> anyhow::Result<Option<Entry>> {
        match self {
            Self::Redis(s) => s.get(key).await,
            Self::CloudflareKv(s) => s.get(key).await,
        }
    }

    pub async fn delete(&self, key: &str) -> anyhow::Result<()> {
        match self {
            Self::Redis(s) => s.delete(key).await,
            Self::CloudflareKv(s) => s.delete(key).await,
        }
    }

    pub async fn ping(&self) -> anyhow::Result<()> {
        match self {
            Self::Redis(s) => s.ping().await,
            Self::CloudflareKv(s) => s.ping().await,
        }
    }
}
