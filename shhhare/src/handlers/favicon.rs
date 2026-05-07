use poem::http::{Method, StatusCode, header};
use poem::{Error, Request, Response};

use crate::files::Static;

#[poem::handler]
pub async fn favicon_ico(req: &Request) -> Result<Response, Error> {
    if req.method() != Method::GET {
        return Err(StatusCode::METHOD_NOT_ALLOWED.into());
    }

    if let Some(f) = Static::get("favicon.ico") {
        let hash = hex::encode(f.metadata.sha256_hash());
        if req
            .headers()
            .get(header::IF_NONE_MATCH)
            .map(|etag| etag.to_str().unwrap_or("000000").eq(&hash))
            .unwrap_or(false)
        {
            return Err(StatusCode::NOT_MODIFIED.into());
        }

        let body: Vec<u8> = f.data.into();
        return Ok(Response::builder()
            .header(header::CONTENT_TYPE, "image/vnd.microsoft.icon")
            .header(header::ETAG, hash)
            .body(body));
    }

    Err(StatusCode::NOT_FOUND.into())
}

#[poem::handler]
pub async fn favicon_png(req: &Request) -> Result<Response, Error> {
    if req.method() != Method::GET {
        return Err(StatusCode::METHOD_NOT_ALLOWED.into());
    }

    if let Some(f) = Static::get("favicon.png") {
        let hash = hex::encode(f.metadata.sha256_hash());
        if req
            .headers()
            .get(header::IF_NONE_MATCH)
            .map(|etag| etag.to_str().unwrap_or("000000").eq(&hash))
            .unwrap_or(false)
        {
            return Err(StatusCode::NOT_MODIFIED.into());
        }

        let body: Vec<u8> = f.data.into();
        return Ok(Response::builder()
            .header(header::CONTENT_TYPE, "image/png")
            .header(header::ETAG, hash)
            .body(body));
    }

    Err(StatusCode::NOT_FOUND.into())
}
