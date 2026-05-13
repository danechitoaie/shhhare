use poem_openapi::payload::Json;
use poem_openapi::{ApiResponse, Enum, Object};

#[derive(Enum)]
pub enum SecretTTL {
    H,
    D,
    W,
}

impl SecretTTL {
    pub fn as_seconds(&self) -> u64 {
        match self {
            SecretTTL::H => 60 * 60,
            SecretTTL::D => 60 * 60 * 24,
            SecretTTL::W => 60 * 60 * 24 * 7,
        }
    }
}

#[derive(Object)]
pub struct AddSecretRequest {
    pub val: String,
    pub ttl: SecretTTL,
    pub bar: bool,
}

#[derive(Object)]
pub struct AddSecretResponseOk {
    pub key: String,
}

#[derive(Object)]
pub struct AddSecretResponseError {
    pub message: String,
    pub details: String,
}

#[derive(ApiResponse)]
pub enum AddSecretResponse {
    /// Ok
    #[oai(status = 200)]
    Ok(Json<AddSecretResponseOk>),

    /// Bad Request
    #[oai(status = 400)]
    BadRequest(Json<AddSecretResponseError>),

    /// Conflict
    #[oai(status = 409)]
    Conflict(Json<AddSecretResponseError>),

    /// Internal Server Error
    #[oai(status = 500)]
    InternalServerError(Json<AddSecretResponseError>),
}

impl AddSecretResponse {
    pub fn ok(key: impl Into<String>) -> Self {
        Self::Ok(Json(AddSecretResponseOk { key: key.into() }))
    }

    pub fn bad_request(details: impl Into<String>) -> Self {
        Self::BadRequest(Json(AddSecretResponseError {
            message: String::from("Bad Request"),
            details: details.into(),
        }))
    }

    pub fn conflict(details: impl Into<String>) -> Self {
        Self::Conflict(Json(AddSecretResponseError {
            message: String::from("Conflict"),
            details: details.into(),
        }))
    }

    pub fn internal_server_error(details: impl Into<String>) -> Self {
        Self::InternalServerError(Json(AddSecretResponseError {
            message: String::from("Internal Server Error"),
            details: details.into(),
        }))
    }
}

#[derive(Object)]
pub struct GetStatusResponseOk {
    pub ttl: i64,
    pub bar: bool,
}

#[derive(Object)]
pub struct GetStatusResponseError {
    pub message: String,
    pub details: String,
}

#[derive(ApiResponse)]
pub enum GetStatusResponse {
    /// Ok
    #[oai(status = 200)]
    Ok(Json<GetStatusResponseOk>),

    /// Not Found
    #[oai(status = 404)]
    NotFound(Json<GetStatusResponseError>),

    /// Internal Server Error
    #[oai(status = 500)]
    InternalServerError(Json<GetStatusResponseError>),
}

impl GetStatusResponse {
    pub fn ok(ttl: i64, bar: bool) -> Self {
        Self::Ok(Json(GetStatusResponseOk { ttl, bar }))
    }

    pub fn not_found(details: impl Into<String>) -> Self {
        Self::NotFound(Json(GetStatusResponseError {
            message: String::from("Not Found"),
            details: details.into(),
        }))
    }

    pub fn internal_server_error(details: impl Into<String>) -> Self {
        Self::InternalServerError(Json(GetStatusResponseError {
            message: String::from("Internal Server Error"),
            details: details.into(),
        }))
    }
}

#[derive(Object)]
pub struct GetSecretResponseOk {
    pub val: String,
    pub ttl: i64,
}

#[derive(Object)]
pub struct GetSecretResponseError {
    pub message: String,
    pub details: String,
}

#[derive(ApiResponse)]
pub enum GetSecretResponse {
    /// Ok
    #[oai(status = 200)]
    Ok(Json<GetSecretResponseOk>),

    /// Not Found
    #[oai(status = 404)]
    NotFound(Json<GetSecretResponseError>),

    /// Internal Server Error
    #[oai(status = 500)]
    InternalServerError(Json<GetSecretResponseError>),
}

impl GetSecretResponse {
    pub fn ok(val: impl Into<String>, ttl: i64) -> Self {
        Self::Ok(Json(GetSecretResponseOk {
            val: val.into(),
            ttl,
        }))
    }

    pub fn not_found(details: impl Into<String>) -> Self {
        Self::NotFound(Json(GetSecretResponseError {
            message: String::from("Not Found"),
            details: details.into(),
        }))
    }

    pub fn internal_server_error(details: impl Into<String>) -> Self {
        Self::InternalServerError(Json(GetSecretResponseError {
            message: String::from("Internal Server Error"),
            details: details.into(),
        }))
    }
}
