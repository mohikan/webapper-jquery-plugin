/*
 * Webapper
 * Authors: Mohikan
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * Project: https://github.com/mohikan/webapper-jquery-plugin
 */

(function($){

$.fn.webapper = function(options) {

    var webapper = this;
    var current_action = "";
    var pending_nav = null;
    var action_target = "";
    var current_form = null;

    // toast notifications via AdminAlert
    var notify = function(type, message){
        var t = String(type || 'info').toLowerCase();
        if(t == 'danger'){ t = 'error'; }
        if(window.AdminAlert && typeof AdminAlert[t] === 'function'){
            AdminAlert[t]('', message);
        } else if(window.console){
            console.log('[webapper] ' + message);
        }
    }

    webapper.init = function(){
    
        webapper.settings = $.extend({
            content         : '#content',           // dynamic content area
            last_content    : '',                   // last loaded content
            loadingbar      : true,                 // ajax loading bar
            loadingbar_color: '#CC0000',            // ajax loading bar color
            history         : true,                 // keep navigation history
            live            : '/dashboard/live',    // listen periodictly
            live_timer      : 30,                   // live check every seconds
            debug           : true                  // console debug
        }, options );

        // links
        webapper.on('click', 'a, .link', function(e){
            // new-tab links keep native browser behaviour (preventDefault oncesi)
            if($(this).attr('target') === '_blank'){
                return;
            }
            e.preventDefault();
            logger('link clicked');
            action_target = webapper.settings.content;
            current_form = null;

            // active link state (ap-links group)
            if($(this).hasClass('ap-link')){
                var group = $(this).closest('.ap-links');
                if(group.length){
                    group.find('.ap-link').removeClass('active');
                    $(this).addClass('active');
                }
            }

            path = $(this).attr('href');
            target = $(this).attr('target');
            if(target != undefined){
                // main link
                if(target == 'main'){
                    location.href = path;
                }
                // modal link
                if(target == 'modal'){
                    action_target = '.modal-overlay';
                    ajaxModal($(this).attr('title'), path);
                }
                // overlay link
                if(target == 'overlay'){
                    action_target = '.offcanvas';
                    overlayWindow($(this).attr('title'), path);
                }
                // form submit
                if(target == 'form'){
                    $(this).closest('form').submit();
                }
                // confirm
                if(target == 'confirm'){
                    confirmModal($(this).data('title') || 'Confirm', $(this).data('confirm'), 'link', path);
                }
                //
            } else {
                if(path != undefined && path.substring(0, 1) != '#'){ 
                    jsonResponse(path);
                }
            }
        });

        // forms
        webapper.on('submit', 'form', function(e){

            // nosubmit forms are not handled by webapper, keep native submit behaviour
            if($(this).attr("rel") == "nosubmit"){
                return;
            }

            e.preventDefault();

            action_target = webapper.settings.content;
            current_form = $(this);

            var rel_value = $(this).attr("rel");
            var confirmed = false;
            if($(this).data('webapper-confirmed')){
                confirmed = true;
                $(this).removeData('webapper-confirmed');
            }

            if(rel_value == "confirm" && !confirmed){
                confirmModal('Confirm', $(this).data("message"), 'form', $(this));
            } else if(rel_value == undefined || confirmed){
                current_form.find('.form-control').removeClass('is-invalid').closest(".form-group").removeClass("has-error");
                current_form.find('.invalid-feedback-js').remove();
                form_action = $(this).attr('action');
                form_data = new FormData(this);
                current_form.find('input[type="file"]').each(function(){
                    if($(this).attr('name') != undefined && $(this).val()){
                        form_data.append($(this).attr('name'), this);
                    }
                });
                activateForm(false);
                jsonResponse(form_action, form_data);
            }

        });

        // on change 
        webapper.on('change', '.onchange', function(e){
            logger('changed');
            path = $(this).attr('href');
            jsonResponse(path);
        });

        // printbox
        $('#printbox').on('load', function(){
            window.frames["printbox"].focus();
            window.frames["printbox"].print();
        });

        // enable history
        if(webapper.settings.history === true){
            // enable history
            if(window.history && window.history.pushState){
                $(window).on('popstate', function() {
                    jsonResponse(window.location.pathname + window.location.search, false);
                });
            }
        }

        // ajax loading bar
        if(webapper.settings.loadingbar === true){
            
            webapper.append('<div id="loadingbar" style="display:block;position:absolute;top:0px;left:0px;height:5px;width:0px;background:'+webapper.settings.loadingbar_color+';z-index:99999;"></div>');

            $(document).ajaxStart(function(){
                if(webapper.settings.loadingbar){
                    $('#loadingbar').width('0px').show().width('10%');
                }
            }).ajaxSend(function(){
                if(webapper.settings.loadingbar){
                    $('#loadingbar').delay(600).width('33%');
                }
            }).ajaxComplete(function(){
                if(webapper.settings.loadingbar){
                    $('#loadingbar').width('100%').delay(600).fadeOut(300);
                } else {
                    webapper.settings.loadingbar = true;
                }
            });
        
        }

        // activate page 
        activatePage();

        // live feed
        if(webapper.settings.live_timer > 0){
            liveFeed(webapper.settings.live, webapper.settings.live_timer);
        }

        // status
        logger('webapper loaded');

    }

    // load json response
    var jsonResponse = function(url, post_data, history){
        if(current_action == ""){
            
            if(post_data != undefined){
                method = 'POST';
                current_action = "form_process";
                // csrf token (CI3 yalnizca $_POST okur; cookie'den body'ye ekle)
                if(window.FormData && post_data instanceof FormData){
                    var _csrf = (document.cookie.match(/(?:^|;\s*)csrf_cookie_name=([^;]*)/) || [])[1];
                    if(_csrf && !post_data.has('csrf_test_name')){
                        post_data.append('csrf_test_name', decodeURIComponent(_csrf));
                    }
                }
            } else {
                method = 'GET';
                current_action = "process";
                if(history != false){
                    historyAdd(url);
                } else {
                    webapper.settings.loadingbar = false;
                }
            }
            
            $.ajax({
                method: method,
                type: method,
                url: url,
                data: post_data,
                cache: false,
                processData: false,
                contentType: false,
                complete:function(jqXHR){

                    current_action = "";
                    
                    if(jqXHR.status == 200){

                        try
                        {
                            var jsonObject = jQuery.parseJSON(jqXHR.responseText);
                            doWorks(jsonObject);
                        }
                        catch(e)
                        {
                            $(webapper.settings.content).html(jqXHR.responseText);
                            activatePage();
                        }

                        if(history != false || current_form){
                            activateForm(true);
                        }

                    } else {
                        if(jqXHR.status == 503){
                            window.location.href = "/";
                        } else {
                            notify('error', 'error : ' + jqXHR.status);
                            activateForm(true);
                        }
                    }

                    current_form = null;

                    if(pending_nav){
                        var queued_nav = pending_nav;
                        pending_nav = null;
                        jsonResponse(queued_nav.url, undefined, queued_nav.history);
                    } else {
                        syncActiveLink();
                    }

                }
            });
        } else if(post_data == undefined){
            // hizli arka arkaya tiklamalarda navigasyonu beklet, sonrakini iptal et
            pending_nav = { url: url, history: history };
            logger('busy -> navigasyon beklemeye alindi: ' + url);
        }
    }

    // do works
    var doWorks = function(data){
        logger(data);
        // form modal: hata yoksa kapat (redirect navigasyonu zaten tumunu atar)
        if(data.form_errors == undefined){
            $('.modal-overlay').has('#modal-form').remove();
        }
        // redirect
        if(data.redirect != undefined){
            location.href = data.redirect;
        }
        // modal message
        if(data.message != undefined){
            alertModal(data.title, data.message, data.type);
        }
        // notificaitons
        if(data.notification != undefined){
            notify(data.type, data.notification);
        }
        // form errors (sadece gonderilen formun uzerinde)
        if(data.form_errors != undefined){
            var errorScope = (current_form && current_form.length) ? current_form : $();
            if(!errorScope.length){
                logger('form_errors: gonderilen form bulunamadi, isaret atlandi');
            }
            errorScope.find('.form-control').removeClass('is-invalid').closest(".form-group").removeClass("has-error");
            errorScope.find('.invalid-feedback-js').remove();
            for(error in data.form_errors){
                logger('form error :' + error + " -> " + data.form_errors[error]);
                var errField = errorScope.find(".form-control[name='"+error+"']");
                errField.addClass('is-invalid').closest(".form-group").addClass("has-error");
                errField.siblings('.invalid-feedback-js').remove();
                errField.after('<small class="text-danger invalid-feedback-js">' + data.form_errors[error] + '</small>');
            }
        }
        // update
        if(data.update != undefined){
            htmlUpdate(data.update);
        }
        // print
        if(data.print != undefined){
            $('#printbox').attr('src', data.print);
        }
        // load
        if(data.load != undefined){
            if(typeof data.load === 'string'){
                jsonResponse(data.load);
            } else {
                for(sel in data.load){
                    loadFragment(sel, data.load[sel]);
                }
            }
        }
        // render: sabit template + data ile html uret
        if(data.render != undefined){
            renderHtml(data.render);
        }
        // set csrf
        if(data.csrf_name != undefined){
            $('input:hidden[name='+data.csrf_name+']').val(data.csrf_hash);
        }
        // end
    }

    // load fragment: GET yanitini sadece hedef elemana yukle
    // load: { "#selector": "/url" }  veya  { "#selector": ["/url", "begin|end|replace"] }
    // mod (varsayilan replace): replace = icerigi degistir, begin = basina ekle, end = sonuna ekle
    var loadFragment = function(sel, spec){
        var url = Array.isArray(spec) ? spec[0] : spec;
        var mode = (Array.isArray(spec) && spec[1]) ? spec[1] : 'replace';
        if(typeof url !== 'string'){
            logger('load: eleman hedefi url degil -> ' + sel);
            return;
        }
        var $el = $(sel);
        if(!$el.length){
            logger('load: eleman bulunamadi -> ' + sel);
            return;
        }
        $.ajax({
            url: url,
            method: 'GET',
            cache: false,
            success: function(html){
                if(mode === 'begin'){
                    $el.prepend(html);
                } else if(mode === 'end'){
                    $el.append(html);
                } else {
                    $el.html(html);
                }
                activatePage();
            },
            error: function(xhr){
                notify('error', 'load : ' + xhr.status + ' -> ' + url);
            }
        });
    };

    // html escape (render degerleri icin)
    var escapeHtml = function(str){
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    // render: { "#selector": { method, template, data } }
    // method: end = append, begin = prepend, replace = html (default)
    // template: {key} placeholderlari; data: satir dizisi (veya tek object)
    // degerler html-escape edilir; bilinmeyen placeholder aynen kalir
    var renderHtml = function(specs){
        if(typeof specs !== 'object' || specs === null || Array.isArray(specs)){
            logger('render: gecersiz yanit (selector objesi bekleniyor)');
            return;
        }
        for(sel in specs){
            var spec = specs[sel];
            if(!spec || typeof spec.template !== 'string'){
                logger('render: template yok -> ' + sel);
                continue;
            }
            var method = String(spec.method || 'replace').toLowerCase();
            if(method !== 'begin' && method !== 'end'){
                method = 'replace';
            }
            var rows = Array.isArray(spec.data) ? spec.data
                     : (spec.data != null && typeof spec.data === 'object' ? [spec.data] : []);
            var html = '';
            for(var i = 0; i < rows.length; i++){
                var row = rows[i];
                html += spec.template.replace(/\{([^{}]+)\}/g, function(m, key){
                    key = String(key).replace(/^\s+|\s+$/g, '');
                    if(row && typeof row === 'object' && Object.prototype.hasOwnProperty.call(row, key)){
                        var v = row[key];
                        return escapeHtml(v == null ? '' : v);
                    }
                    return m;
                });
            }
            var $el = $(sel);
            if(!$el.length){
                logger('render: eleman bulunamadi -> ' + sel);
                continue;
            }
            if(method === 'begin'){
                $el.prepend(html);
            } else if(method === 'end'){
                $el.append(html);
            } else {
                $el.html(html);
            }
            logger('render: ' + method + ' -> ' + sel + ' (' + rows.length + ' satir)');
        }
        activatePage();
    };

    // update
    var htmlUpdate = function(elements){
        for(element in elements){
            for(foo in elements[element]){
                if(typeof(elements[element][foo]) === 'object'){
                    for(bar in elements[element][foo]){
                        $(element)[foo](bar, elements[element][foo][bar]);
                    }
                } else {
                    $(element)[foo](elements[element][foo]);
                }
            }
        }
    }

    // add history
    var historyAdd = function(path){
        if(path != webapper.settings.last_content || webapper.settings.history === false){
            webapper.settings.last_content = path;
            if(webapper.settings.history != false){
                window.history.pushState(null, null, path);
            }
        }
    }

    // sidebar aktif linkini mevcut url ile esle (sadece sidebar-nav — toolbar'daki ap-links gruplari server render ile gelir)
    var syncActiveLink = function(){
        var path = window.location.pathname.replace(/\/+$/, '') || '/';
        $('.sidebar-nav .ap-link').each(function(){
            var href = ($(this).attr('href') || '#').replace(/\/+$/, '');
            var match = (href === '/panel')
                ? (path === href)
                : (path === href || path.indexOf(href + '/') === 0);
            $(this).toggleClass('active', match);
        });
    }

    // enable/disable form (sadece gonderilen form, yoksa action_target alani)
    var activateForm = function(status){
        var scope = (current_form && current_form.length) ? current_form : $(action_target);
        var elements = scope.find('input, textarea, button, select');
        if(status === false){
            elements.prop("disabled", true);
        } else {
            elements.not('.disabled').prop("disabled", false);
        }
    }

    // activate page
    var activatePage = function(){
        // disabled elements
        if($(action_target + ' form').attr('type') == 'edit'){
            $('.notedit').removeClass('notedit').addClass('disabled').prop('disabled', true);
        }
        // select2
        if($(action_target + ' .select2').length){
            $(action_target + ' .select2').select2({ allowClear: true, width: '100%' }).removeAttr("rel");
        }
        // input mask
        if($(action_target + ' .masked').length){
            $(action_target + ' .masked').inputmask();
        }
        // table sort
        if($(action_target + ' .table_sortable').length){
           table_sortable(action_target);
        }
    }

    // live feed
    var liveFeed = function(url, timer){
        window.setInterval(function(){
            jsonResponse(url, undefined, false);
        }, (timer * 1000));
    }

    // window box functions (AdminAlert)

    // map server message level to AdminAlert type
    var alertType = function(level){
        var t = String(level || 'info').toLowerCase();
        if(t == 'error' || t == 'danger'){ return 'danger'; }
        if(t == 'success'){ return 'success'; }
        if(t == 'warning'){ return 'warning'; }
        return 'info';
    }

    // alert box (single button)
    var alertModal = function(title, message, level){
        if(window.AdminAlert && typeof AdminAlert.confirm === 'function'){
            AdminAlert.confirm({
                title: title || 'Notice',
                message: message,
                type: alertType(level),
                showCancel: false
            });
        } else {
            logger('alert: ' + title + ' -> ' + message);
        }
    }

    // confirm box
    var confirmModal = function(title, message, type, target){
        var proceed = function(){
            if(type == 'link'){ jsonResponse(target); }
            if(type == 'form'){
                target.data('webapper-confirmed', true);
                target.submit();
            }
        };
        if(window.AdminAlert && typeof AdminAlert.confirm === 'function'){
            AdminAlert.confirm({
                title: title || 'Confirm',
                message: message,
                type: 'warning',
                onConfirm: proceed,
                onCancel: function(){ current_form = null; }
            });
        } else if(window.confirm(message)){
            proceed();
        }
    }

    // ajax content in modal window
    var ajaxModal = function(title, url){
        if(!window.AdminAlert || typeof AdminAlert.form !== 'function'){ return; }
        AdminAlert.form({
            title: title || '',
            url: url,
            onLoad: activatePage,
            onSubmit: function(data, formData, action){
                current_form = $('.modal-overlay #modal-form');
                jsonResponse(action || url, formData);
            }
        });
    }

    // ajax content in offcanvas window
    var overlayWindow = function(title, url){
        if(!window.AdminAlert || typeof AdminAlert.offcanvas !== 'function'){ return; }
        AdminAlert.offcanvas({
            title: title || '',
            url: url,
            onLoad: activatePage,
            onSubmit: function(data, formData, action){
                current_form = $('.offcanvas #offcanvas-form');
                jsonResponse(action || url, formData);
            }
        });
    }

    var table_sortable = function(target){
        $(target + ' .table_sortable').each(function(i, rows){
            current_orders = "";
            $(rows).find('tr').each(function(j, row){
                current_orders += $(row).attr('id') + "-" + $(row).data('ord') + ":";
            });
            $(rows).data('current_orders', current_orders);
            $(rows).tableDnD({
                onDrop: function(rows, row){
                    new_orders = "";
                    $(rows).find('tr').each(function(j, row){
                        new_orders += $(row).attr('id') + "-" + $(row).data('ord') + ":";
                    });
                    $(rows).data('new_orders', new_orders);
                    form_data = new FormData();
                    form_data.append('current_orders', current_orders);
                    form_data.append('new_orders', new_orders);
                    jsonResponse($(target + ' .table_sortable').data('sort'), form_data, false);
                }
            });
        });
    }

    // logger
    var logger = function(log){
        if(webapper.settings.debug === true){
            console.log(log);
        }
    }

    // init webapper (guard against double initialization)
    if(webapper.data('webapper-initialized')){
        return;
    }
    webapper.data('webapper-initialized', true);
    webapper.init();

};

}(jQuery));
