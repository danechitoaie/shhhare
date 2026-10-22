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
    async fn health(&self, Data(storage): Data<&Storage>) -> HealthResponse {
        if let Err(err) = storage.ping().await {
            tracing::error!("{:?}", err);
            return HealthResponse::service_unavailable();
        }

        HealthResponse::ok()
    }
}
