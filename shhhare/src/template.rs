const HTML_TEMPLATE: &str = r#"
<!doctype html>
<html>

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{:title}</title>
    <link rel="stylesheet" href="{:stylesheet}" />
</head>

<body>
    <div id="root"></div>
    <script id="__DATA__" type="application/json">{:data}</script>
    <script type="module" src="{:script}"></script>
</body>

</html>
"#;

pub fn get_app_html(code: u16, reason: &str, b: u64) -> String {
    let ver = env!("CARGO_PKG_VERSION");
    let stylesheet = format!("/static/v{ver}/app/main.css");
    let script = format!("/static/v{ver}/app/main.js");

    HTML_TEMPLATE
        .replace("{:title}", "Shhhare!")
        .replace("{:stylesheet}", stylesheet.as_str())
        .replace("{:script}", script.as_str())
        .replace(
            "{:data}",
            serde_json::json!({
                "c": code,
                "r": reason,
                "v": ver,
                "b": b,
            })
            .to_string()
            .as_str(),
        )
}

pub fn get_err_html(code: u16, reason: &str) -> String {
    let ver = env!("CARGO_PKG_VERSION");
    let stylesheet = format!("/static/v{ver}/app/main.css");
    let script = format!("/static/v{ver}/app/main.js");

    HTML_TEMPLATE
        .replace("{:title}", "Shhhare!")
        .replace("{:stylesheet}", stylesheet.as_str())
        .replace("{:script}", script.as_str())
        .replace(
            "{:data}",
            serde_json::json!({
                "c": code,
                "r": reason,
                "v": ver,
            })
            .to_string()
            .as_str(),
        )
}

pub fn get_doc_html(code: u16, reason: &str) -> String {
    let ver = env!("CARGO_PKG_VERSION");
    let stylesheet = format!("/static/v{ver}/doc/main.css");
    let script = format!("/static/v{ver}/doc/main.js");

    HTML_TEMPLATE
        .replace("{:title}", "Shhhare! - API Docs")
        .replace("{:stylesheet}", stylesheet.as_str())
        .replace("{:script}", script.as_str())
        .replace(
            "{:data}",
            serde_json::json!({
                "c": code,
                "r": reason,
                "v": ver,
            })
            .to_string()
            .as_str(),
        )
}
