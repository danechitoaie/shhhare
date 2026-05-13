use poem::web::Data;
use poem_openapi::OpenApi;
use poem_openapi::param::Path;
use poem_openapi::payload::Json;
use redis::AsyncCommands as _;
use redis::aio::ConnectionManager;

use crate::config::Config;
use crate::models::api::ApiTags;
use crate::models::api::secret::AddSecretRequest;
use crate::models::api::secret::AddSecretResponse;
use crate::models::api::secret::GetSecretResponse;
use crate::models::api::secret::GetStatusResponse;

pub struct SecretApi;

#[OpenApi]
impl SecretApi {
    #[oai(path = "/secret", method = "post", tag = ApiTags::Secret)]
    async fn add_secret(
        &self,
        Data(config): Data<&Config>,
        Data(connection_manager): Data<&ConnectionManager>,
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
        let val = format!("{}|{}", if body.bar { "1" } else { "0" }, body.val);
        let ttl = body.ttl.as_seconds();
        let opt = redis::SetOptions::default()
            .conditional_set(redis::ExistenceCheck::NX)
            .with_expiration(redis::SetExpiry::EX(ttl));

        let mut connection_manager = connection_manager.clone();
        let res = match connection_manager
            .set_options::<_, _, Option<String>>(&key, &val, opt)
            .await
        {
            Ok(res) => res,
            Err(err) => {
                tracing::error!("{:?}", err);
                let details = "Failed to store the secret!";
                return AddSecretResponse::internal_server_error(details);
            }
        };

        if res.is_none() {
            let details = "Failed to store the secret!";
            return AddSecretResponse::conflict(details);
        }

        AddSecretResponse::ok(key)
    }

    #[oai(path = "/secret/:key", method = "get", tag = ApiTags::Secret)]
    async fn get_status(
        &self,
        Data(connection_manager): Data<&ConnectionManager>,
        Path(key): Path<String>,
    ) -> GetStatusResponse {
        let mut connection_manager = connection_manager.clone();
        let res = match redis::pipe()
            .get(&key)
            .ttl(&key)
            .query_async::<(Option<String>, i64)>(&mut connection_manager)
            .await
        {
            Ok(res) => res,
            Err(err) => {
                tracing::error!("{:?}", err);
                let details = "Failed to get the secret!";
                return GetStatusResponse::internal_server_error(details);
            }
        };

        let (ttl, bar) = match res {
            (Some(raw), ttl) => (ttl, raw.starts_with("1|")),
            (None, _) => {
                let details = "Secret not found!";
                return GetStatusResponse::not_found(details);
            }
        };

        GetStatusResponse::ok(ttl, bar)
    }

    #[oai(path = "/secret/:key", method = "post", tag = ApiTags::Secret)]
    async fn get_secret(
        &self,
        Data(connection_manager): Data<&ConnectionManager>,
        Path(key): Path<String>,
    ) -> GetSecretResponse {
        let mut connection_manager = connection_manager.clone();
        let res = match redis::pipe()
            .get(&key)
            .ttl(&key)
            .query_async::<(Option<String>, i64)>(&mut connection_manager)
            .await
        {
            Ok(res) => res,
            Err(err) => {
                tracing::error!("{:?}", err);
                let details = "Failed to get the secret!";
                return GetSecretResponse::internal_server_error(details);
            }
        };

        let (raw, ttl) = match res {
            (Some(raw), ttl) => (raw, ttl),
            (None, _) => {
                let details = "Secret not found!";
                return GetSecretResponse::not_found(details);
            }
        };

        let (bar, val) = match raw.split_once('|') {
            Some((bar, val)) => (bar, val),
            None => {
                let details = "Failed to parse the secret!";
                return GetSecretResponse::internal_server_error(details);
            }
        };

        if bar == "1" {
            if let Err(err) = connection_manager.del::<_, ()>(&key).await {
                tracing::error!("{:?}", err);
                let details = "Failed to delete the secret!";
                return GetSecretResponse::internal_server_error(details);
            }

            return GetSecretResponse::ok(val, 0);
        }

        GetSecretResponse::ok(val, ttl)
    }
}
