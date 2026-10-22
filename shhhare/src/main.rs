use clap::Parser as _;
use dotenvy::dotenv;
use poem::endpoint::EmbeddedFilesEndpoint;
use poem::listener::TcpListener;
use poem::middleware::{CatchPanic, SetHeader};
use poem::{EndpointExt as _, Route, Server, get};
use poem_openapi::OpenApiService;

mod config;
mod files;
mod handlers;
mod middleware;
mod models;
mod storage;
mod template;

use crate::config::{Config, StorageKind};
use crate::files::Static;
use crate::handlers::api::health::HealthApi;
use crate::handlers::api::secret::SecretApi;
use crate::handlers::app::render_app;
use crate::handlers::doc::render_doc;
use crate::handlers::favicon::{favicon_ico, favicon_png, favicon_svg};
use crate::middleware::ErrorHandler;
use crate::storage::Storage;
use crate::template::APP_CSP;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();

    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::ERROR)
        .with_file(true)
        .with_line_number(true)
        .init();

    let cfg = Config::parse();
    let ver = env!("CARGO_PKG_VERSION");
    let rev = option_env!("GIT_HASH").unwrap_or("0000000");

    let storage_cfg = cfg.storage_config();
    let storage_name = match cfg.storage {
        StorageKind::Redis => "Redis",
        StorageKind::CloudflareKv => "Cloudflare KV",
    };

    println!("[ 📦 ] Connecting to {storage_name}...");
    let storage = Storage::connect(storage_cfg).await?;

    let static_path = format!("/static/v{ver}-{rev}");
    let static_ep = {
        let cc_h_key = poem::http::header::CACHE_CONTROL;
        let cc_h_val = "max-age=31536000, immutable";

        let static_ep_middleware = SetHeader::new().overriding(cc_h_key, cc_h_val);
        EmbeddedFilesEndpoint::<Static>::new().with(static_ep_middleware)
    };

    let app_cache_mw = {
        let cc_h_key = poem::http::header::CACHE_CONTROL;
        let cc_h_val = "no-cache, no-store, must-revalidate";
        let csp_h_key = poem::http::header::CONTENT_SECURITY_POLICY;
        SetHeader::new()
            .overriding(cc_h_key, cc_h_val)
            .overriding(csp_h_key, APP_CSP)
    };

    let security_mw = {
        use poem::http::header;
        SetHeader::new()
            .overriding(header::X_CONTENT_TYPE_OPTIONS, "nosniff")
            .overriding(header::REFERRER_POLICY, "no-referrer")
            .overriding(header::X_FRAME_OPTIONS, "DENY")
            .overriding("cross-origin-opener-policy", "same-origin")
    };

    let ico_cache_mw = {
        let cc_h_key = poem::http::header::CACHE_CONTROL;
        let cc_h_val = "max-age=31536000, immutable";
        SetHeader::new().overriding(cc_h_key, cc_h_val)
    };

    let api_endpoints = (SecretApi, HealthApi);
    let api = OpenApiService::new(api_endpoints, "Shhhare!", ver).url_prefix("/api");

    let host = cfg.host.clone();
    let port = cfg.port;
    let bind = format!("{host}:{port}");

    let app = Route::new()
        .at("/", get(render_app).with(&app_cache_mw))
        .at("/s/:secret_key", get(render_app).with(&app_cache_mw))
        .at("/favicon.svg", get(favicon_svg).with(&ico_cache_mw))
        .at("/favicon.png", get(favicon_png).with(&ico_cache_mw))
        .at("/favicon.ico", get(favicon_ico).with(&ico_cache_mw))
        .at("/doc/", get(render_doc))
        .at("/doc/schema.json", get(api.spec_endpoint()))
        .nest("/api", api)
        .nest(static_path, static_ep)
        .data(cfg)
        .data(storage)
        .with(CatchPanic::new())
        .with(ErrorHandler::new())
        .with(security_mw);

    println!("[ 🚀 ] Listening on http://{bind}");
    Server::new(TcpListener::bind(bind)).run(app).await?;

    Ok(())
}
