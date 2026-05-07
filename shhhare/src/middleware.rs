use poem::http::StatusCode;
use poem::http::header::CONTENT_TYPE;
use poem::{Body, IntoResponse, Response};
use poem::{Endpoint, Middleware, Request, Result};
use poem_openapi::error::{
    ContentTypeError, ParseMultipartError, ParseParamError, ParsePathError,
    ParseRequestPayloadError,
};

use crate::template::get_err_html;

pub struct ErrorHandler;

impl ErrorHandler {
    pub fn new() -> Self {
        Self {}
    }
}

impl<E: Endpoint> Middleware<E> for ErrorHandler {
    type Output = ErrorHandlerImpl<E>;

    fn transform(&self, ep: E) -> Self::Output {
        ErrorHandlerImpl { ep }
    }
}

pub struct ErrorHandlerImpl<E> {
    ep: E,
}

impl<E: Endpoint> Endpoint for ErrorHandlerImpl<E> {
    type Output = Response;

    async fn call(&self, req: Request) -> Result<Self::Output> {
        if req.uri().path().starts_with("/api/") {
            match self.ep.call(req).await {
                Ok(ok) => Ok(ok.into_response()),

                Err(err) if err.is::<ParseParamError>() => {
                    Ok(json_response(err.status(), Some(err.to_string())))
                }

                Err(err) if err.is::<ParsePathError>() => {
                    Ok(json_response(err.status(), Some(err.to_string())))
                }

                Err(err) if err.is::<ParseRequestPayloadError>() => {
                    Ok(json_response(err.status(), Some(err.to_string())))
                }

                Err(err) if err.is::<ParseMultipartError>() => {
                    Ok(json_response(err.status(), Some(err.to_string())))
                }

                Err(err) if err.is::<ContentTypeError>() => {
                    Ok(json_response(err.status(), Some(err.to_string())))
                }

                Err(err) => Ok(json_response(err.status(), None)),
            }
        } else {
            match self.ep.call(req).await {
                Ok(ok) => Ok(ok.into_response()),
                Err(err) => Ok(html_response(err.status())),
            }
        }
    }
}

fn html_response(status: StatusCode) -> Response {
    let (status, reason) = match status.canonical_reason() {
        Some(reason) => (status, reason),
        None => (StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error"),
    };

    let body = Body::from(get_err_html(status.as_u16(), reason));

    Response::builder()
        .header(CONTENT_TYPE, "text/html; charset=utf-8")
        .status(status)
        .body(body)
}

fn json_response(status: StatusCode, details: Option<String>) -> Response {
    let (status, reason) = match status.canonical_reason() {
        Some(reason) => (status, reason),
        None => (StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error"),
    };

    let body = if let Some(details) = details {
        Body::from(serde_json::json!({"message": reason, "details": details}).to_string())
    } else {
        Body::from(serde_json::json!({"message": reason}).to_string())
    };

    Response::builder()
        .header(CONTENT_TYPE, "application/json; charset=utf-8")
        .status(status)
        .body(body)
}
