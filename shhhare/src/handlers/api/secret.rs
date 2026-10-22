use poem::web::Data;
use poem_openapi::OpenApi;
use poem_openapi::param::Path;
use poem_openapi::payload::Json;

use crate::config::Config;
use crate::models::api::ApiTags;
use crate::models::api::secret::AddSecretRequest;
use crate::models::api::secret::AddSecretResponse;
use crate::models::api::secret::GetSecretResponse;
use crate::models::api::secret::GetStatusResponse;
use crate::storage::Storage;

pub struct SecretApi;

#[OpenApi]
impl SecretApi {
    #[oai(path = "/secret", method = "post", tag = ApiTags::Secret)]
    async fn add_secret(
        &self,
        Data(config): Data<&Config>,
        Data(storage): Data<&Storage>,
        Json(body): Json<AddSecretRequest>,
    ) -> AddSecretResponse {
        if body.val.len() as u64 > config.max_size.as_u64() {
            let details = format!("Secret exceeds maximum size of {}", config.max_size);
            return AddSecretResponse::bad_request(details);
        }

        let mut bytes = [0u8; 32];
        if let Err(err) = getrandom::fill(&mut bytes) {
            tracing::error!("{:?}", err);
            let details = "Failed to generate secret key!";
            return AddSecretResponse::internal_server_error(details);
        }

        let key = bs58::encode(bytes).into_string();
        let ttl = body.ttl.as_seconds();

        let stored = match storage.put(&key, &body.val, body.bar, ttl).await {
            Ok(stored) => stored,
            Err(err) => {
                tracing::error!("{:?}", err);
                let details = "Failed to store the secret!";
                return AddSecretResponse::internal_server_error(details);
            }
        };

        if !stored {
            let details = "Failed to store the secret!";
            return AddSecretResponse::conflict(details);
        }

        AddSecretResponse::ok(key)
    }

    #[oai(path = "/secret/:key", method = "get", tag = ApiTags::Secret)]
    async fn get_status(
        &self,
        Data(storage): Data<&Storage>,
        Path(key): Path<String>,
    ) -> GetStatusResponse {
        let res = match storage.status(&key).await {
            Ok(res) => res,
            Err(err) => {
                tracing::error!("{:?}", err);
                let details = "Failed to get the secret!";
                return GetStatusResponse::internal_server_error(details);
            }
        };

        let (bar, ttl) = match res {
            Some(res) => res,
            None => {
                let details = "Secret not found!";
                return GetStatusResponse::not_found(details);
            }
        };

        GetStatusResponse::ok(ttl, bar)
    }

    #[oai(path = "/secret/:key", method = "post", tag = ApiTags::Secret)]
    async fn get_secret(
        &self,
        Data(storage): Data<&Storage>,
        Path(key): Path<String>,
    ) -> GetSecretResponse {
        let res = match storage.get(&key).await {
            Ok(res) => res,
            Err(err) => {
                tracing::error!("{:?}", err);
                let details = "Failed to get the secret!";
                return GetSecretResponse::internal_server_error(details);
            }
        };

        let entry = match res {
            Some(entry) => entry,
            None => {
                let details = "Secret not found!";
                return GetSecretResponse::not_found(details);
            }
        };

        if entry.bar {
            if let Err(err) = storage.delete(&key).await {
                tracing::error!("{:?}", err);
                let details = "Failed to delete the secret!";
                return GetSecretResponse::internal_server_error(details);
            }

            return GetSecretResponse::ok(entry.val, 0);
        }

        GetSecretResponse::ok(entry.val, entry.ttl)
    }
}
