use poem::web::{Data, Html};

use crate::config::Config;
use crate::template::get_app_html;

#[poem::handler]
pub async fn render_app(Data(config): Data<&Config>) -> Html<String> {
    let b = config.max_size.as_u64();
    Html(get_app_html(200, "OK", b))
}
