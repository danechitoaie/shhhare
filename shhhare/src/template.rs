const APP_HTML_TEMPLATE: &str = r#"
<!doctype html>
<html>

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>{:title}</title>

    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-cyrillic-ext-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-greek-ext-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-greek-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-latin-ext-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-vietnamese-wght-normal.woff2" as="font" type="font/woff2" crossorigin>

    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="stylesheet" href="/static/v{:ver}-{:rev}/app/main.css">
</head>

<body>
    <div id="root"></div>
    <script id="__DATA__" type="application/json">{:data}</script>
    <script type="module" src="/static/v{:ver}-{:rev}/app/main.js"></script>
</body>

</html>
"#;

pub fn get_app_html(code: u16, reason: &str, b: u64) -> String {
    let ver = env!("CARGO_PKG_VERSION");
    let rev = option_env!("GIT_HASH").unwrap_or("0000000");

    APP_HTML_TEMPLATE
        .replace("{:title}", "Shhhare!")
        .replace("{:ver}", ver)
        .replace("{:rev}", rev)
        .replace(
            "{:data}",
            serde_json::json!({
                "c": code,
                "r": reason,
                "v": ver,
                "h": rev,
                "b": b,
            })
            .to_string()
            .as_str(),
        )
}

const ERR_HTML_TEMPLATE: &str = r#"
<!doctype html>
<html>

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>{:title}</title>

    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-cyrillic-ext-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-greek-ext-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-greek-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-latin-ext-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/static/v{:ver}-{:rev}/app/inter-vietnamese-wght-normal.woff2" as="font" type="font/woff2" crossorigin>

    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="stylesheet" href="/static/v{:ver}-{:rev}/app/main.css">
</head>

<body>
    <div id="root"></div>
    <script id="__DATA__" type="application/json">{:data}</script>
    <script type="module" src="/static/v{:ver}-{:rev}/app/main.js"></script>
</body>

</html>
"#;

pub fn get_err_html(code: u16, reason: &str) -> String {
    let ver = env!("CARGO_PKG_VERSION");
    let rev = option_env!("GIT_HASH").unwrap_or("0000000");

    ERR_HTML_TEMPLATE
        .replace("{:title}", "Shhhare!")
        .replace("{:ver}", ver)
        .replace("{:rev}", rev)
        .replace(
            "{:data}",
            serde_json::json!({
                "c": code,
                "r": reason,
                "h": rev,
                "v": ver,
            })
            .to_string()
            .as_str(),
        )
}

const DOC_HTML_TEMPLATE: &str = r#"
<!doctype html>
<html>

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>{:title}</title>

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="/static/v{:ver}-{:rev}/doc/main.css">
</head>

<body>
    <div id="root"></div>
    <script id="__DATA__" type="application/json">{:data}</script>
    <script type="module" src="/static/v{:ver}-{:rev}/doc/main.js"></script>
</body>

</html>
"#;

pub fn get_doc_html(code: u16, reason: &str) -> String {
    let ver = env!("CARGO_PKG_VERSION");
    let rev = option_env!("GIT_HASH").unwrap_or("0000000");

    DOC_HTML_TEMPLATE
        .replace("{:title}", "Shhhare! - API Docs")
        .replace("{:ver}", ver)
        .replace("{:rev}", rev)
        .replace(
            "{:data}",
            serde_json::json!({
                "c": code,
                "r": reason,
                "h": rev,
                "v": ver,
            })
            .to_string()
            .as_str(),
        )
}
