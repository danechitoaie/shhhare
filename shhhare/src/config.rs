use bytesize::ByteSize;
use clap::error::ErrorKind;
use clap::{CommandFactory as _, Parser, ValueEnum};

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
    /// Exits with a clap usage error if a value required by the selected backend is missing.
    /// clap's `required_if_eq` does not fire when `storage` comes from its default value,
    /// so it can't be relied on for the default (Redis) backend.
    pub fn storage_config(&self) -> StorageConfig {
        match self.storage {
            StorageKind::Redis => StorageConfig::Redis {
                url: required(&self.redis_url, "--redis-url <REDIS_URL>"),
            },
            StorageKind::CloudflareKv => StorageConfig::CloudflareKv {
                account_id: required(
                    &self.cloudflare_account_id,
                    "--cloudflare-account-id <CLOUDFLARE_ACCOUNT_ID>",
                ),
                namespace_id: required(
                    &self.cloudflare_kv_namespace_id,
                    "--cloudflare-kv-namespace-id <CLOUDFLARE_KV_NAMESPACE_ID>",
                ),
                api_token: required(
                    &self.cloudflare_api_token,
                    "--cloudflare-api-token <CLOUDFLARE_API_TOKEN>",
                ),
            },
        }
    }
}

fn required(value: &Option<String>, arg: &str) -> String {
    match value {
        Some(value) => value.clone(),
        None => Config::command()
            .error(
                ErrorKind::MissingRequiredArgument,
                format!("the following required argument was not provided: {arg}"),
            )
            .exit(),
    }
}
