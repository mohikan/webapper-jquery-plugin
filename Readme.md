## Webapper - Jquery Web Application Plugin For Ajax Based Web Applications

### What is it

I feel myself so comfortable with jquery, also I don't like write a lots of codes for frontend side so much, for every page and for different conditions.

If you think like me, you can feel free yourself with my plugin.

### Why Need Use This

Acctually there are a lots of famous javascript framework to develope single page web applications.
I know and heart most of them, and acctually as a backend developer, long time I used differents, but I feel myself more comfortable with my plugin, focusing only backend with the plugin, maybe it can help people like me.

### How Is Working

Webapper plugin working on html tags and attributes.
And responses can be html or json.

When the response is **JSON**, it is a **command list** (`redirect`, toast, modal message, form errors, `load`, `render`, `update`...) and the plugin executes them. When the response is **not** JSON (plain HTML 200), it is treated as a fragment and injected into the `content` area.

### What Need Extra

* [Jquery](https://jquery.com/) — required
* **AdminAlert** (`alert/alert.js` + `alert/alert.css` — included in this repo) — optional: modal / offcanvas / confirm / toast. Without it toasts fall back to `console.log`, confirm falls back to `window.confirm`, modal & offcanvas do not work.
* [Bootstrap](https://getbootstrap.com/) 5 — **CSS only, optional** — only if your own markup uses Bootstrap classes. The plugin and the AdminAlert dialogs do **not** need Bootstrap (dialog styles are scoped inside `alert/alert.css` and never touch your global `.btn`).
* [Select2](https://select2.github.io/), [Input Mask](http://github.com/RobinHerbots/jquery.inputmask), tableDnD — only needed if you use the `.select2` / `.masked` / `.table_sortable` classes (started automatically after each load)

### Setup

Page skeleton — the plugin needs a wrapper element (clicks/submits are delegated on it) and a content area where fragments are injected:

```html
<body id="app">
  <div id="page-content"><!-- ajax fragments land here --></div>
</body>
```

Include javascript libraries

```html
<!-- optional: AdminAlert for modal/offcanvas/confirm/toast -->
<link rel="stylesheet" href="alert/alert.css">
<script src="jquery.min.js"></script>
<script src="webapper/jquery.webapper.js"></script>
<script src="alert/alert.js"></script>
<script>
$(function () {
    $("#app").webapper({
        content: '#page-content',   // area where non-JSON HTML responses are injected
        debug: true
    });
});
</script>
```

`alert/alert.css` defines fallback values for the CSS variables it needs — load it **before** your own theme stylesheet so your theme wins. Dialog icons use [Material Symbols Outlined](https://fonts.google.com/icons):

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=block">
```

Double initialization is guarded (`webapper-initialized`).

### Server side

Every request from the plugin carries `X-Requested-With: XMLHttpRequest` (link GETs, form POSTs, `load` GETs). Your backend decides the response type:

| Request | Response |
|---|---|
| Action (form submit / command link) | **JSON command list** (`redirect` / `notification` / `load` / `render` / `form_errors` ...) |
| `load` GET and non-JSON link GET | **HTML fragment only** — no full layout, injected into `content` |
| `target="modal"` / `target="overlay"` fragment | HTML containing `#modal-form` (or `#offcanvas-form`) |
| Normal browser request (no header) | full page (normal multi-page rendering) |

If the body parses as JSON (see quirks) it is executed as commands; otherwise it is treated as HTML.

### Options

| Default | Description |
|---|---|
| `content: '#content'` | selector for non-JSON GET/HTML fragment responses |
| `loadingbar: true` | 5px ajax progress bar on top |
| `loadingbar_color: '#CC0000'` | progress bar color |
| `history: true` | `pushState` + `popstate` (back/forward) support |
| `live: '/dashboard/live'`, `live_timer: 30` | periodic GET (0 = disabled) |
| `debug: true` | `console.log` output (set `false` in production) |

### Link Behaves

> Any Regular Link Call Ajax Request

```html
<a href="/link_path">link text</a>
```

> Link without ajax

```html
<a href="/link_path" target="main">link text</a>
```

> Load Ajax Response to Modal Window (AdminAlert.form — response must contain `#modal-form`)

```html
<a href="/link_path" target="modal" title="Window title">link text</a>
```

> Load Ajax Response to Overlay Window (AdminAlert.offcanvas — response must contain `#offcanvas-form`)

```html
<a href="/link_path" target="overlay" title="Window title">link text</a>
```

> Submit the closest form

```html
<a href="/form_action" target="form">submit</a>
```

> Confirm before GET (AdminAlert.confirm)

```html
<a href="/link_path" target="confirm" data-title="Delete" data-confirm="Are you sure?">delete</a>
```

> Open in new tab (plugin does not touch it)

```html
<a href="/link_path" target="_blank">link text</a>
```

> Any Element has link behaves

```html
<button href="/link_path" class="link">link text</button>
```

> Trigger GET on change (reads `href`)

```html
<select class="onchange" href="/list?filter=1"> .. </select>
```

> Active link state inside a `.ap-links` group (click moves `.active` in the group)

```html
<div class="ap-links">
  <a class="ap-link" href="/page/1">One</a>
  <a class="ap-link" href="/page/2">Two</a>
</div>
```

### Form Behaves

> Any Regular Form Call Ajax Request — serialized as `FormData` **POST**, fields are disabled while sending, previous error marks are cleared.

> Form nosubmit

```html
<form action="/form_action" rel="nosubmit"> .. </form>
```

> Confirm form before submit

```html
<form action="/form_action" rel="confirm" data-message="Are you sure ?"> .. </form>
```

> `input[type=file]` fields are appended to FormData manually (empty files skipped)

> On a validation error response the form **stays open** and the fields are marked (see `form_errors` below).

### Json Responses

```json
{
  "redirect": "to_url"
}
```

```json
{
  "load": "load_to_content_url"
}
```

```json
{
  "type": "Warning",
  "title": "Title of Message",
  "message": "Some message with alert "
}
```

```json
{
  "type": "success",
  "notification": "Some message with toast notification "
}
```

```json
{
  "form_errors": { "email": "E-mail is required" }
}
```

```json
{
  "update": { "#counter": { "text": "12" } }
}
```

```json
{
  "load": {
    "#sidebar": ["/fragments/sidebar", "replace"],
    "#feed": ["/fragments/feed", "end"]
  }
}
```

`load` as an object: each key is a selector, the value is a URL (or `[url, mode]`).
Mode is `replace` (default) / `begin` / `end` — only that element is updated, the page content stays.

```json
{
  "print": "/report.pdf"
}
```

```json
{
  "csrf_name": "csrf_test_name",
  "csrf_hash": "abc123"
}
```

#### Render (build HTML from template + data)

No extra request needed — the server sends a template and rows, the plugin builds the HTML and injects it:

```json
{
  "type": "success",
  "notification": "Row added",
  "render": {
    "#users tbody": {
      "method": "end",
      "template": "<tr><td>{firstname}</td><td>{surname}</td></tr>",
      "data": [
        { "firstname": "Ayşe", "surname": "Yılmaz" },
        { "firstname": "Mehmet", "surname": "Demir" }
      ]
    }
  }
}
```

| Field | Description |
|---|---|
| `method` | `end` = append, `begin` = prepend, `replace` = replace content (default). Case-insensitive, invalid values fall back to `replace` |
| `template` | HTML string; `{key}` placeholders are filled once per `data` row |
| `data` | array of rows (one render per row) **or** a single object; empty → no HTML produced |

* Placeholder **values are HTML-escaped** (`& < > " '`) — template itself can contain any HTML, data never injects raw markup.
* Unknown placeholders (`{nope}`) are **left as-is** (not blanked).
* Missing selector is silently skipped (`debug` mode logs it).
* Works together with `load` / `update` / `notification` in the same response.

PHP example (before `json_encode`):

```php
$response['render']['#users tbody'] = [
    'method'   => 'end',
    'template' => '<tr><td>{firstname}</td><td>{surname}</td></tr>',
    'data'     => $rows,   // [['firstname' => 'Ayşe', 'surname' => 'Yılmaz'], ...]
];
```

## Example Multiple Actions in Response

```json
{
  "type": "success",
  "notification": "Your profile updated successfuly :)",
  "update": {
    "#avatar": { "src": "new_image_path" }
  },
  "load": "load_new_page_url"
}
```

### Settings

See **Options** above. Example:

```javascript
$("#app").webapper({
  content: '#page-content',
  history: true,
  loadingbar: true,
  debug: false
});
```

### AdminAlert contract (optional)

AdminAlert ships with this repo (`alert/alert.js` + `alert/alert.css`). The plugin calls these when `window.AdminAlert` exists:

```javascript
AdminAlert[type]('', message)                 // success | error | warning | info — toast
AdminAlert.confirm({ title, message, type, showCancel, onConfirm, onCancel })
AdminAlert.form({ title, url, onLoad, onSubmit(data, formData, action) })   // modal
AdminAlert.offcanvas({ title, url, onLoad, onSubmit(data, formData, action) })
```

Everything except modal/offcanvas works without AdminAlert.

### Behaviors

* **Single active request**: clicking again while a navigation is in flight queues the click; when the current request finishes the **last clicked** runs (form submits are not queued, they are dropped).
* **History**: `pushState` on GET; back/forward (`popstate`) re-loads `pathname+search` without a full page draw.
* **Active link**: after each completed request, `.active` is synced on `.sidebar-nav .ap-link` only.
* **CSRF**: on POST the `csrf_cookie_name` cookie value is appended to FormData as `csrf_test_name` (CodeIgniter 3 pattern). Adjust this block for other backends.
* **Activate page**: after new content loads, `.select2` / `.masked` / `.table_sortable` are initialized — these libraries must be on the page or it will throw; simply don't use those classes if you don't need them.

### Known quirks

* A response body that **looks like** JSON is parsed as JSON (try/catch) — don't start your HTML fragments with `{"...`.
* `#anchor` links are swallowed; use `target="main"` or leave the link native (`target="_blank"` is fine too).
* Form submits do not wait for GET navigation; the queue is navigation-only.

## About

Jquery Web Application Plugin For Ajax Based Applications
