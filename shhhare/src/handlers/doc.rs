use poem::web::Html;

use crate::template::get_doc_html;

#[poem::handler]
pub async fn render_doc() -> Html<String> {
    Html(get_doc_html(200, "OK"))
}
