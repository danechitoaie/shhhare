use std::time::{SystemTime, UNIX_EPOCH};

use async_trait::async_trait;
use reqwest::StatusCode;

use super::{Storage, StoredValue};

/// Cloudflare KV storage backend, talking to the v4 REST API.
///
/// Caveats vs. Redis:
/// - The REST API has no native "set if not exists" primitive, so `set_nx_ex`
///   does a best-effort `GET` then `PUT`. With 256-bit random keys the race
///   window is negligible.
/// - The REST API does not expose remaining TTL on read, so we prefix stored
///   values with `expires_at_unix_secs|` and compute the remaining TTL on
///   retrieval.
/// - Cloudflare KV is eventually consistent; writes may take up to ~60s to
///   propagate globally.
pub struct CloudflareKvStorage {
    http: reqwest::Client,
    base_url: String,
    token: String,
}

impl CloudflareKvStorage {
    pub fn new(account_id: &str, namespace_id: &str, api_token: &str) -> anyhow::Result<Self> {
        let http = reqwest::Client::builder().build()?;
        let base_url = format!(
            "https://api.cloudflare.com/client/v4/accounts/{account_id}/storage/kv/namespaces/{namespace_id}"
        );
        Ok(Self {
            http,
            base_url,
            token: api_token.to_string(),
        })
    }

    fn value_url(&self, key: &str) -> String {
        let encoded = urlencoding_encode(key);
        format!("{}/values/{encoded}", self.base_url)
    }
}

/// Minimal percent-encoder for path segments, avoiding a dependency on the
/// `urlencoding` crate. Encodes anything outside the unreserved set.
fn urlencoding_encode(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    for b in input.as_bytes() {
        match *b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(*b as char);
            }
            _ => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

#[async_trait]
impl Storage for CloudflareKvStorage {
    async fn set_nx_ex(&self, key: &str, value: &[u8], ttl_secs: u64) -> anyhow::Result<bool> {
        // Best-effort NX: check existence first.
        let head = self
            .http
            .get(self.value_url(key))
            .bearer_auth(&self.token)
            .send()
            .await?;
        if head.status().is_success() {
            return Ok(false);
        }
        if head.status() != StatusCode::NOT_FOUND {
            anyhow::bail!("cloudflare kv check failed: {}", head.status());
        }

        // Prefix payload with absolute expiry so we can compute remaining TTL
        // on read (the REST API does not expose it).
        let expires_at = now_secs().saturating_add(ttl_secs);
        let mut body = Vec::with_capacity(value.len() + 16);
        body.extend_from_slice(expires_at.to_string().as_bytes());
        body.push(b'|');
        body.extend_from_slice(value);

        let url = format!("{}?expiration_ttl={ttl_secs}", self.value_url(key));
        let res = self
            .http
            .put(url)
            .bearer_auth(&self.token)
            .header(reqwest::header::CONTENT_TYPE, "application/octet-stream")
            .body(body)
            .send()
            .await?;

        if !res.status().is_success() {
            let status = res.status();
            let text = res.text().await.unwrap_or_default();
            anyhow::bail!("cloudflare kv put failed ({status}): {text}");
        }
        Ok(true)
    }

    async fn get_with_ttl(&self, key: &str) -> anyhow::Result<Option<StoredValue>> {
        let res = self
            .http
            .get(self.value_url(key))
            .bearer_auth(&self.token)
            .send()
            .await?;

        if res.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }
        if !res.status().is_success() {
            let status = res.status();
            let text = res.text().await.unwrap_or_default();
            anyhow::bail!("cloudflare kv get failed ({status}): {text}");
        }

        let raw = res.bytes().await?.to_vec();
        let Some(sep) = raw.iter().position(|b| *b == b'|') else {
            anyhow::bail!("cloudflare kv value missing expires_at prefix");
        };
        let (prefix, rest) = raw.split_at(sep);
        let value = rest[1..].to_vec();

        let expires_at: u64 = std::str::from_utf8(prefix)?.parse()?;
        let ttl_secs = (expires_at as i64).saturating_sub(now_secs() as i64).max(0);

        Ok(Some(StoredValue { value, ttl_secs }))
    }

    async fn delete(&self, key: &str) -> anyhow::Result<()> {
        let res = self
            .http
            .delete(self.value_url(key))
            .bearer_auth(&self.token)
            .send()
            .await?;

        if res.status().is_success() || res.status() == StatusCode::NOT_FOUND {
            return Ok(());
        }
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        anyhow::bail!("cloudflare kv delete failed ({status}): {text}");
    }

    async fn health(&self) -> anyhow::Result<()> {
        let url = format!("{}/keys?limit=1", self.base_url);
        let res = self.http.get(url).bearer_auth(&self.token).send().await?;

        if !res.status().is_success() {
            let status = res.status();
            let text = res.text().await.unwrap_or_default();
            anyhow::bail!("cloudflare kv health failed ({status}): {text}");
        }
        Ok(())
    }
}
