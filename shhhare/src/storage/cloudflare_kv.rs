use std::time::{SystemTime, UNIX_EPOCH};

use anyhow::{Context as _, bail};
use reqwest::header::{AUTHORIZATION, HeaderMap, HeaderValue};
use reqwest::multipart::Form;
use reqwest::{Client, Response, StatusCode, Url};
use serde::{Deserialize, Serialize};

use crate::storage::Entry;

const API_BASE: &str = "https://api.cloudflare.com/client/v4";

/// Cloudflare API error code for "key not found" in a KV namespace.
const KEY_NOT_FOUND: u32 = 10009;

#[derive(Serialize, Deserialize)]
struct Metadata {
    bar: bool,
    /// Absolute expiration as a Unix timestamp (seconds).
    exp: i64,
}

#[derive(Deserialize)]
struct MetadataResponse {
    result: Metadata,
}

#[derive(Deserialize)]
struct ErrorResponse {
    errors: Vec<ApiError>,
}

#[derive(Deserialize)]
struct ApiError {
    code: u32,
}

#[derive(Clone)]
pub struct CloudflareKvStorage {
    client: Client,
    base: Url,
}

impl CloudflareKvStorage {
    pub fn new(account_id: &str, namespace_id: &str, api_token: &str) -> anyhow::Result<Self> {
        let mut auth = HeaderValue::from_str(&format!("Bearer {api_token}"))
            .context("Invalid Cloudflare API token")?;
        auth.set_sensitive(true);

        let mut headers = HeaderMap::new();
        headers.insert(AUTHORIZATION, auth);

        let client = Client::builder().default_headers(headers).build()?;

        let mut base = Url::parse(API_BASE)?;
        base.path_segments_mut()
            .map_err(|_| anyhow::anyhow!("Invalid Cloudflare API base URL"))?
            .extend([
                "accounts",
                account_id,
                "storage",
                "kv",
                "namespaces",
                namespace_id,
            ]);

        Ok(Self { client, base })
    }

    /// Cloudflare KV has no conditional write, so this never reports a conflict.
    /// Keys are 32 random bytes, which makes a collision practically impossible.
    pub async fn put(&self, key: &str, val: &str, bar: bool, ttl: u64) -> anyhow::Result<bool> {
        let exp = now() + ttl as i64;
        let metadata = serde_json::to_string(&Metadata { bar, exp })?;
        let form = Form::new()
            .text("value", val.to_string())
            .text("metadata", metadata);

        let mut url = self.url(&["values", key])?;
        url.query_pairs_mut()
            .append_pair("expiration_ttl", &ttl.to_string());

        let res = self.client.put(url).multipart(form).send().await?;
        check(res).await?;

        Ok(true)
    }

    pub async fn status(&self, key: &str) -> anyhow::Result<Option<(bool, i64)>> {
        let res = match self.metadata(key).await? {
            Some(metadata) => ttl(metadata.exp).map(|ttl| (metadata.bar, ttl)),
            None => None,
        };

        Ok(res)
    }

    pub async fn get(&self, key: &str) -> anyhow::Result<Option<Entry>> {
        let (val, metadata) = tokio::try_join!(self.value(key), self.metadata(key))?;

        let (val, metadata) = match (val, metadata) {
            (Some(val), Some(metadata)) => (val, metadata),
            _ => return Ok(None),
        };

        let res = ttl(metadata.exp).map(|ttl| Entry {
            val,
            bar: metadata.bar,
            ttl,
        });

        Ok(res)
    }

    pub async fn delete(&self, key: &str) -> anyhow::Result<()> {
        let url = self.url(&["values", key])?;
        let res = self.client.delete(url).send().await?;
        check(res).await?;
        Ok(())
    }

    /// Fetches the namespace details, which verifies both the API token and the namespace.
    pub async fn ping(&self) -> anyhow::Result<()> {
        let res = self.client.get(self.base.clone()).send().await?;
        check(res).await?;
        Ok(())
    }

    async fn value(&self, key: &str) -> anyhow::Result<Option<String>> {
        let url = self.url(&["values", key])?;
        let res = match check_found(self.client.get(url).send().await?).await? {
            Some(res) => res,
            None => return Ok(None),
        };

        Ok(Some(res.text().await?))
    }

    async fn metadata(&self, key: &str) -> anyhow::Result<Option<Metadata>> {
        let url = self.url(&["metadata", key])?;
        let res = match check_found(self.client.get(url).send().await?).await? {
            Some(res) => res,
            None => return Ok(None),
        };

        let body = res.json::<MetadataResponse>().await?;
        Ok(Some(body.result))
    }

    fn url(&self, segments: &[&str]) -> anyhow::Result<Url> {
        let mut url = self.base.clone();
        url.path_segments_mut()
            .map_err(|_| anyhow::anyhow!("Invalid Cloudflare API base URL"))?
            .extend(segments);
        Ok(url)
    }
}

async fn check(res: Response) -> anyhow::Result<Response> {
    let status = res.status();
    if !status.is_success() {
        let body = res.text().await.unwrap_or_default();
        bail!("Cloudflare KV request failed with {status}: {body}");
    }

    Ok(res)
}

/// Like `check`, but maps a missing key to `None`. Cloudflare also answers `404` for an
/// unknown account or namespace, so only the KV "key not found" error code counts as missing.
async fn check_found(res: Response) -> anyhow::Result<Option<Response>> {
    if res.status() != StatusCode::NOT_FOUND {
        return check(res).await.map(Some);
    }

    let body = res.text().await.unwrap_or_default();
    let key_not_found = serde_json::from_str::<ErrorResponse>(&body)
        .is_ok_and(|res| res.errors.iter().any(|err| err.code == KEY_NOT_FOUND));

    if !key_not_found {
        bail!("Cloudflare KV request failed with 404 Not Found: {body}");
    }

    Ok(None)
}

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or_default()
}

/// Remaining TTL in seconds, or `None` if the entry has already expired
/// but Cloudflare has not evicted it yet.
fn ttl(exp: i64) -> Option<i64> {
    let ttl = exp - now();
    (ttl > 0).then_some(ttl)
}
