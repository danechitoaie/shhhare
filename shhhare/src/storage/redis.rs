use anyhow::bail;
use redis::AsyncCommands as _;
use redis::aio::ConnectionManager;

use crate::storage::Entry;

#[derive(Clone)]
pub struct RedisStorage {
    connection_manager: ConnectionManager,
}

impl RedisStorage {
    pub async fn connect(url: &str) -> anyhow::Result<Self> {
        let client = redis::Client::open(url)?;
        let connection_manager = ConnectionManager::new(client).await?;
        Ok(Self { connection_manager })
    }

    pub async fn put(&self, key: &str, val: &str, bar: bool, ttl: u64) -> anyhow::Result<bool> {
        let val = format!("{}|{}", if bar { "1" } else { "0" }, val);
        let opt = redis::SetOptions::default()
            .conditional_set(redis::ExistenceCheck::NX)
            .with_expiration(redis::SetExpiry::EX(ttl));

        let mut connection_manager = self.connection_manager.clone();
        let res = connection_manager
            .set_options::<_, _, Option<String>>(key, &val, opt)
            .await?;

        Ok(res.is_some())
    }

    pub async fn status(&self, key: &str) -> anyhow::Result<Option<(bool, i64)>> {
        let res = self.get_raw(key).await?;
        Ok(res.map(|(raw, ttl)| (raw.starts_with("1|"), ttl)))
    }

    pub async fn get(&self, key: &str) -> anyhow::Result<Option<Entry>> {
        let (raw, ttl) = match self.get_raw(key).await? {
            Some(res) => res,
            None => return Ok(None),
        };

        let (bar, val) = match raw.split_once('|') {
            Some((bar, val)) => (bar == "1", val.to_string()),
            None => bail!("Failed to parse the secret!"),
        };

        Ok(Some(Entry { val, bar, ttl }))
    }

    pub async fn delete(&self, key: &str) -> anyhow::Result<()> {
        let mut connection_manager = self.connection_manager.clone();
        connection_manager.del::<_, ()>(key).await?;
        Ok(())
    }

    pub async fn ping(&self) -> anyhow::Result<()> {
        let mut connection_manager = self.connection_manager.clone();
        let res: String = redis::cmd("PING")
            .query_async(&mut connection_manager)
            .await?;

        if res != "PONG" {
            bail!("Unexpected PING response");
        }

        Ok(())
    }

    async fn get_raw(&self, key: &str) -> anyhow::Result<Option<(String, i64)>> {
        let mut connection_manager = self.connection_manager.clone();
        let res = redis::pipe()
            .get(key)
            .ttl(key)
            .query_async::<(Option<String>, i64)>(&mut connection_manager)
            .await?;

        Ok(res.0.map(|raw| (raw, res.1)))
    }
}
