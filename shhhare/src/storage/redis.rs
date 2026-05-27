use async_trait::async_trait;
use redis::AsyncCommands as _;
use redis::aio::ConnectionManager;

use super::{Storage, StoredValue};

pub struct RedisStorage {
    cm: ConnectionManager,
}

impl RedisStorage {
    pub async fn connect(url: &str) -> anyhow::Result<Self> {
        let cl = redis::Client::open(url)?;
        let cm = ConnectionManager::new(cl).await?;
        Ok(Self { cm })
    }
}

#[async_trait]
impl Storage for RedisStorage {
    async fn set(&self, key: &str, value: &[u8], ttl_secs: u64) -> anyhow::Result<bool> {
        let mut cm = self.cm.clone();
        let opt = redis::SetOptions::default()
            .conditional_set(redis::ExistenceCheck::NX)
            .with_expiration(redis::SetExpiry::EX(ttl_secs));

        let res: Option<String> = cm.set_options(key, value, opt).await?;
        Ok(res.is_some())
    }

    async fn get(&self, key: &str) -> anyhow::Result<Option<StoredValue>> {
        let mut cm = self.cm.clone();
        let (val, ttl): (Option<Vec<u8>>, i64) =
            redis::pipe().get(key).ttl(key).query_async(&mut cm).await?;

        Ok(val.map(|val| StoredValue { val, ttl }))
    }

    async fn del(&self, key: &str) -> anyhow::Result<()> {
        let mut cm = self.cm.clone();
        cm.del::<_, ()>(key).await?;
        Ok(())
    }

    async fn chk(&self) -> anyhow::Result<()> {
        let mut cm = self.cm.clone();
        let res: String = redis::cmd("PING").query_async(&mut cm).await?;
        if res != "PONG" {
            anyhow::bail!("unexpected PING response: {res}");
        }
        Ok(())
    }
}
