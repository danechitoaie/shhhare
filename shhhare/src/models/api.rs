use poem_openapi::Tags;

pub mod health;
pub mod secret;

#[derive(Tags)]
pub enum ApiTags {
    Secret,
    Health,
}
