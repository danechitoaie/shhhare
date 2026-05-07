use poem::web::Html;

use crate::template::get_app_html;

#[poem::handler]
pub async fn render_app() -> Html<String> {
    Html(get_app_html(200, "OK"))
}
