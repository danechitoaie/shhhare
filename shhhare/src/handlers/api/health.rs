use std::sync::Arc;

use poem::web::Data;
use poem_openapi::OpenApi;

use crate::models::api::ApiTags;
use crate::models::api::health::HealthResponse;
use crate::storage::Storage;

pub struct HealthApi;

#[OpenApi]
impl HealthApi {
    /// Health check
    #[oai(path = "/health", method = "get", tag = ApiTags::Health)]
    async fn health(&self, Data(storage): Data<&Arc<dyn Storage>>) -> HealthResponse {
        match storage.health().await {
            Ok(()) => HealthResponse::ok(),
            Err(err) => {
                tracing::error!("{:?}", err);
                HealthResponse::service_unavailable()
            }
        }
    }
}
