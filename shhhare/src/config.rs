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
    #[clap(long, env, default_value = "127.0.0.1")]
    pub host: String,

    #[clap(long, env, default_value = "8000")]
    pub port: u16,

    #[clap(long, env, default_value = "256KB")]
    /// Case-insensitive with KB/MB/GB treated as decimal (1000-based) and KiB/MiB/GiB as binary (1024-based), per IEC convention
    pub max_size: ByteSize,

    /// Which storage backend to use.
    #[clap(long, env, value_enum, default_value_t = StorageKind::Redis)]
    pub storage: StorageKind,

    // --- Redis ---
    #[clap(long, env, required_if_eq("storage", "redis"))]
    pub redis_url: Option<String>,

    // --- Cloudflare KV ---
    #[clap(long, env, required_if_eq("storage", "cloudflare-kv"))]
    pub cloudflare_account_id: Option<String>,

    #[clap(long, env, required_if_eq("storage", "cloudflare-kv"))]
    pub cloudflare_kv_namespace_id: Option<String>,

    #[clap(long, env, required_if_eq("storage", "cloudflare-kv"))]
    pub cloudflare_api_token: Option<String>,
}

/// Resolved, validated storage configuration.
#[derive(Debug, Clone)]
pub enum StorageConfig {
    Redis {
        url: String,
    },
    CloudflareKv {
        account_id: String,
        namespace_id: String,
        api_token: String,
    },
}

impl Config {
    pub fn storage_config(&self) -> StorageConfig {
        match self.storage {
            StorageKind::Redis => StorageConfig::Redis {
                url: self
                    .redis_url
                    .clone()
                    .expect("clap required_if_eq guarantees redis_url is set"),
            },
            StorageKind::CloudflareKv => StorageConfig::CloudflareKv {
                account_id: self
                    .cloudflare_account_id
                    .clone()
                    .expect("clap required_if_eq guarantees cloudflare_account_id is set"),
                namespace_id: self
                    .cloudflare_kv_namespace_id
                    .clone()
                    .expect("clap required_if_eq guarantees cloudflare_kv_namespace_id is set"),
                api_token: self
                    .cloudflare_api_token
                    .clone()
                    .expect("clap required_if_eq guarantees cloudflare_api_token is set"),
            },
        }
    }
}
