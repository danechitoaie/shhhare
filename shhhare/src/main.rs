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
mod template;

use crate::config::Config;
use crate::files::Static;
use crate::handlers::api::health::HealthApi;
use crate::handlers::api::secret::SecretApi;
use crate::handlers::app::render_app;
use crate::handlers::doc::render_doc;
use crate::handlers::favicon::{favicon_ico, favicon_png};
use crate::middleware::ErrorHandler;

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
    let rev = option_env!("GIT_HASH").unwrap_or("dev");

    println!("[ 📦 ] Connecting to Redis...");
    let client = redis::Client::open(cfg.redis_url.clone())?;
    let connection_manager = redis::aio::ConnectionManager::new(client).await?;

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
        SetHeader::new().overriding(cc_h_key, cc_h_val)
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
        .at("/favicon.ico", get(favicon_ico).with(&ico_cache_mw))
        .at("/favicon.png", get(favicon_png).with(&ico_cache_mw))
        .at("/doc/", get(render_doc))
        .at("/doc/schema.json", get(api.spec_endpoint()))
        .nest("/api", api)
        .nest(static_path, static_ep)
        .data(cfg)
        .data(connection_manager)
        .with(CatchPanic::new())
        .with(ErrorHandler::new());

    println!("[ 🚀 ] Listening on http://{bind}");
    Server::new(TcpListener::bind(bind)).run(app).await?;

    Ok(())
}
