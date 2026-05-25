use bytesize::ByteSize;
use clap::{Parser, ValueEnum};

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
#[clap(rename_all = "kebab-case")]
pub enum StorageKind {
    Redis,
    CloudflareKv,
}

#[derive(Debug, Clone, Parser)]
#[clap(author, version, about)]
pub struct Config {
    /// The host to bind the server to
    #[clap(long, env, default_value = "127.0.0.1")]
    pub host: String,

    /// The port to bind the server to
    #[clap(long, env, default_value = "8000")]
    pub port: u16,

    /// Case-insensitive with KB/MB/GB treated as decimal (1000-based) and KiB/MiB/GiB as binary (1024-based), per IEC convention
    #[clap(long, env, default_value = "256KB")]
    pub max_size: ByteSize,

    /// Which storage backend to use
    #[clap(long, env, value_enum, default_value_t = StorageKind::Redis)]
    pub storage: StorageKind,

    #[clap(long, env, required_if_eq("storage", "redis"))]
    pub redis_url: Option<String>,

    #[clap(long, env, required_if_eq("storage", "cloudflare-kv"))]
    pub cloudflare_account: Option<String>,

    #[clap(long, env, required_if_eq("storage", "cloudflare-kv"))]
    pub cloudflare_token: Option<String>,

    #[clap(long, env, required_if_eq("storage", "cloudflare-kv"))]
    pub cloudflare_kv_namespace: Option<String>,
}

#[derive(Debug, Clone)]
pub enum StorageConfig {
    Redis {
        url: String,
    },

    CloudflareKv {
        account: String,
        token: String,
        namespace: String,
    },
}

impl Config {
    pub fn storage_config(&self) -> anyhow::Result<StorageConfig> {
        match self.storage {
            StorageKind::Redis => {
                let config = StorageConfig::Redis {
                    url: self
                        .redis_url
                        .clone()
                        .ok_or_else(|| anyhow::anyhow!("redis_url is required"))?,
                };

                Ok(config)
            }

            StorageKind::CloudflareKv => {
                let config = StorageConfig::CloudflareKv {
                    account: self
                        .cloudflare_account
                        .clone()
                        .ok_or_else(|| anyhow::anyhow!("cloudflare_account is required"))?,

                    namespace: self
                        .cloudflare_kv_namespace
                        .clone()
                        .ok_or_else(|| anyhow::anyhow!("cloudflare_kv_namespace is required"))?,

                    token: self
                        .cloudflare_token
                        .clone()
                        .ok_or_else(|| anyhow::anyhow!("cloudflare_token is required"))?,
                };

                Ok(config)
            }
        }
    }
}
