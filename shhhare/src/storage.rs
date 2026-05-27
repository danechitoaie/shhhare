use std::sync::Arc;

use async_trait::async_trait;

use crate::config::StorageConfig;

use self::cloudflare_kv::CloudflareKvStorage;
use self::redis::RedisStorage;

pub mod cloudflare_kv;
pub mod redis;

pub struct StoredValue {
    pub val: Vec<u8>,
    pub ttl: i64,
}

#[async_trait]
pub trait Storage: Send + Sync + 'static {
    async fn set(&self, key: &str, value: &[u8], ttl_secs: u64) -> anyhow::Result<bool>;
    async fn get(&self, key: &str) -> anyhow::Result<Option<StoredValue>>;
    async fn del(&self, key: &str) -> anyhow::Result<()>;
    async fn chk(&self) -> anyhow::Result<()>;
}

pub async fn build(cfg: &StorageConfig) -> anyhow::Result<Arc<dyn Storage>> {
    match cfg {
        StorageConfig::Redis { url } => {
            let storage = RedisStorage::connect(url).await?;
            Ok(Arc::new(storage))
        }

        StorageConfig::CloudflareKv {
            account,
            namespace,
            token,
        } => {
            let storage = CloudflareKvStorage::new(account, namespace, token)?;
            Ok(Arc::new(storage))
        }
    }
}
