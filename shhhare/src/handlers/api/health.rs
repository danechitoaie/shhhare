use poem::web::Data;
use poem_openapi::OpenApi;
use redis::aio::ConnectionManager;

use crate::models::api::ApiTags;
use crate::models::api::health::HealthResponse;

pub struct HealthApi;

#[OpenApi]
impl HealthApi {
    /// Health check
    #[oai(path = "/health", method = "get", tag = ApiTags::Health)]
    async fn health(&self, Data(connection_manager): Data<&ConnectionManager>) -> HealthResponse {
        let mut connection_manager = connection_manager.clone();
        let res: String = match redis::cmd("PING")
            .query_async(&mut connection_manager)
            .await
        {
            Ok(res) => res,
            Err(err) => {
                tracing::error!("{:?}", err);
                return HealthResponse::service_unavailable();
            }
        };

        if res != "PONG" {
            tracing::error!("Unexpected PING response");
            return HealthResponse::service_unavailable();
        }

        HealthResponse::ok()
    }
}
