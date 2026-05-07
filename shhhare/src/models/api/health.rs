use poem_openapi::payload::Json;
use poem_openapi::{ApiResponse, Object};

#[derive(Object)]
pub struct HealthResponseOk {
    pub message: String,
}

#[derive(Object)]
pub struct HealthResponseError {
    pub message: String,
}

#[derive(ApiResponse)]
pub enum HealthResponse {
    /// Ok
    #[oai(status = 200)]
    Ok(Json<HealthResponseOk>),

    /// Service Unavailable
    #[oai(status = 503)]
    ServiceUnavailable(Json<HealthResponseError>),
}

impl HealthResponse {
    pub fn ok() -> Self {
        Self::Ok(Json(HealthResponseOk {
            message: String::from("Ok"),
        }))
    }

    pub fn service_unavailable() -> Self {
        Self::ServiceUnavailable(Json(HealthResponseError {
            message: String::from("Service Unavailable"),
        }))
    }
}
