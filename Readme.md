## Webapper - Jquery Web Application Plugin For Ajax Based Web Applications

### What is it

I feel myself so comfortable with jquery, also I don't like write a lots of codes for frontend side so much, for every page and for different conditions. 

If you think like me, you can feel free yourself with my plugin.

### Why Need Use This

Acctually there are a lots of famous javascript framework to develope single page web applications.
I know and heart most of them, and acctually as a backend developer, long time I used differents, but I feel myself more comfortable with my plugin, focusing only backend with the plugin, maybe it can help people like me.

### How Is Working

Webapper plugin working on html tags and attributes.
And responses can be html or json

### What Need Extra

* [Jquery](https://jquery.com/)
* [Bootstrap](http://getbootstrap.com/)
* [Input Mask](http://github.com/RobinHerbots/jquery.inputmask)
* [Toaster](https://github.com/CodeSeven/toastr)
* [Select2](https://select2.github.io/)
* [Daterangepicker](http://www.daterangepicker.com/)

### Setup

Include javascript libraries


### Usage

```html
<body id="app">'
```

```javascript

$("#app").webapper({ debug: true, .... });

```

### Link Behaves

> Any Regular Link Call Ajax Request

```html
<a href="/link_path">link text</a>
```

> Link without ajax

```html
<a href="/link_path" target="main">link text</a>
```

> Load Ajax Response to Modal Window

```html
<a href="/link_path" target="modal">link text</a>
```

> Load Ajax Response to Overlay Window

```html
<a href="/link_path" target="overlay">link text</a>
```

> Any Element has link behaves

```html
<button href="/link_path" class="link">link text</button>
```

### Form Behaves

> Any Regular Form Call Ajax Request

> Form nosubmit

```html
<form action="/form_action" rel="nosubmit"> .. </form>
```

> Confirm form before submit

```html
<form action="/form_action" rel="confirm" data-message="Are you sure ?"> .. </form>
```

### Form Validation



### Json Responses



### Settings



