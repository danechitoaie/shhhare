use bytesize::ByteSize;
use clap::Parser;

#[derive(Debug, Clone, Parser)]
#[clap(author, version, about)]
pub struct Config {
    #[clap(long, env, default_value = "127.0.0.1")]
    pub host: String,

    #[clap(long, env, default_value = "8000")]
    pub port: u16,

    #[clap(long, env)]
    pub redis_url: String,

    #[clap(long, env)]
    /// Case-insensitive with KB/MB/GB treated as decimal (1000-based) and KiB/MiB/GiB as binary (1024-based), per IEC convention
    pub max_size: ByteSize,
}
