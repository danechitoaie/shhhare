use std::sync::Arc;

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

fn encode_payload(bar: bool, val: &str) -> Vec<u8> {
    let mut out = Vec::with_capacity(val.len() + 2);
    out.push(if bar { b'1' } else { b'0' });
    out.push(b'|');
    out.extend_from_slice(val.as_bytes());
    out
}

fn decode_payload(raw: &[u8]) -> Option<(bool, String)> {
    let sep = raw.iter().position(|b| *b == b'|')?;
    let (prefix, rest) = raw.split_at(sep);
    let val = std::str::from_utf8(&rest[1..]).ok()?.to_string();
    let bar = prefix == b"1";
    Some((bar, val))
}

#[OpenApi]
impl SecretApi {
    #[oai(path = "/secret", method = "post", tag = ApiTags::Secret)]
    async fn add_secret(
        &self,
        Data(config): Data<&Config>,
        Data(storage): Data<&Arc<dyn Storage>>,
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
        let payload = encode_payload(body.bar, &body.val);
        let ttl = body.ttl.as_seconds();

        let stored = match storage.set(&key, &payload, ttl).await {
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
        Data(storage): Data<&Arc<dyn Storage>>,
        Path(key): Path<String>,
    ) -> GetStatusResponse {
        let entry = match storage.get(&key).await {
            Ok(entry) => entry,
            Err(err) => {
                tracing::error!("{:?}", err);
                let details = "Failed to get the secret!";
                return GetStatusResponse::internal_server_error(details);
            }
        };

        let Some(entry) = entry else {
            let details = "Secret not found!";
            return GetStatusResponse::not_found(details);
        };

        let bar = entry.val.starts_with(b"1|");
        GetStatusResponse::ok(entry.ttl, bar)
    }

    #[oai(path = "/secret/:key", method = "post", tag = ApiTags::Secret)]
    async fn get_secret(
        &self,
        Data(storage): Data<&Arc<dyn Storage>>,
        Path(key): Path<String>,
    ) -> GetSecretResponse {
        let entry = match storage.get(&key).await {
            Ok(entry) => entry,
            Err(err) => {
                tracing::error!("{:?}", err);
                let details = "Failed to get the secret!";
                return GetSecretResponse::internal_server_error(details);
            }
        };

        let Some(entry) = entry else {
            let details = "Secret not found!";
            return GetSecretResponse::not_found(details);
        };

        let Some((bar, val)) = decode_payload(&entry.val) else {
            let details = "Failed to parse the secret!";
            return GetSecretResponse::internal_server_error(details);
        };

        if bar {
            if let Err(err) = storage.del(&key).await {
                tracing::error!("{:?}", err);
                let details = "Failed to delete the secret!";
                return GetSecretResponse::internal_server_error(details);
            }

            return GetSecretResponse::ok(val, 0);
        }

        GetSecretResponse::ok(val, entry.ttl)
    }
}
