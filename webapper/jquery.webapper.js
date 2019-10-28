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
    var user_request = false;
    var action_target = "";

    webapper.init = function(){
    
        webapper.settings = $.extend({
            content         : '#content',           // dynamic content area
            last_content    : '',                   // last loaded content
            loadingbar      : true,                 // ajax loading bar
            loadingbar_color: '#CC0000',            // ajax loading bar color
            history         : true,                 // keep navigation history
            keyup_timer     : 1500,                 // input timer
            reflex_time     : 300,                  // animations reflex time
            live            : '/dashboard/live',    // listen periodictly
            live_timer      : 30,                   // live check every seconds
            translate       : '',                   // translate laguages end point or 
            language        : '',                   // default language for translate
            debug           : true,                 // console debug
            action          : ''
        }, options );

        // links
        webapper.on('click', 'a, .link', function(e){
            e.preventDefault();
            logger('link clicked');
            action_target = webapper.settings.content;
            path = $(this).attr('href');
            target = $(this).attr('target');
            if(target != undefined){
                // main link
                if(target == 'main'){
                    location.href = path;
                }
                // modal link
                if(target == 'modal'){
                    action_target = '#modals';
                    ajaxModal($(this).attr('title'), path);
                }
                // modal link
                if(target == 'overlay'){
                    action_target = '#overlay';
                    overlayWindow($(this).attr('title'), path);
                }
                // form submit
                if(target == 'form'){
                    $('form').submit();
                }
                // confirm
                if(target == 'confirm'){
                    confirmModal('Confirm', $(this).data('confirm'), 'link', path);
                }
                // confirmit
                if(target == 'confirmer'){
                    $('#modal-message').modal('hide');
                    // confirm link
                    if(confirmType == "link"){
                        jsonResponse(confirmTarget);
                    }
                    // confirm form
                    if(confirmType == "form"){
                        $('form').submit();
                    }
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
            
            e.preventDefault();

            if($(this).attr("rel") != undefined){
                // no submit
                if($(this).attr("rel") == "nosubmit"){
                    // do not submit
                }
                // confirm
                if($(this).attr("rel") == "confirm"){
                    confirmModal('Confirm', $(this).data("message"), 'form', $(this));
                }
                //
            } else {
                form_action = $(this).attr('action');
                form_data = new FormData(this);
                $.each($('input[type="file"]'), function(){
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
            jsonResponse(path, undefined, false);
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
                    jsonResponse(window.location.pathname, false);
                });
            }
        }

        // set toastr
        toastr.options = {
            "timeOut": "3000",
            "positionClass": "toast-top-right"
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

        // load scripts

        // add modal boxes
        $('#modals').html('<div class="modal fade small-modal" tabindex="-1" id="modal-message" role="dialog"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title" id="myModalLabel"></h4></div><div class="modal-body"><div class="modal-message text-c"></div></div><div class="modal-footer"><button type="button" class="btn btn-small btn-default" data-dismiss="modal">Cancel</button><button type="button" class="btn btn-small btn-success link" target="confirmer">Confirm</button></div></div></div></div><div class="modal fade" id="modal-ajaxContent" role="dialog"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title" id="myModalLabel"></h4></div><div class="modal-body"><div class="modal-ajaxContent text-c"></div></div></div></div></div>');

        // on modal closed
        $('#modal-ajaxContent').on('hidden.bs.modal', function () {
            $('#modal-ajaxContent .modal-ajaxContent').html('');
        });

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

                        if(history != false){
                            activateForm(true);
                        }

                    } else {
                        if(jqXHR.status == 503){
                            window.location.href = "/";
                        } else {
                            toastr['error']('error : ' + jqXHR.status);
                            activateForm(true);
                        }
                    }

                }
            });
        }
    }

    // do works
    var doWorks = function(data){
        logger(data);
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
            toastr[data.type](data.notification);
        }
        // form errors
        if(data.form_errors != undefined){
            for(error in data.form_errors){
                logger('form error :' + error + " -> " + data.form_errors[error]);
                $(".form-control[name='"+error+"']").closest(".form-group").addClass("has-error");
            }
        }
        // table
        if(data.table != undefined){
            /* update table */
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
            jsonResponse(data.load);
        }
        // set csrf
        if(data.csrf_name != undefined){
            $('input:hidden[name='+data.csrf_name+']').val(data.csrf_hash);
        }
        // end
    }

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
        /*
        for(key in elements){
            if(elements.hasOwnProperty(key)){
                if(typeof(elements[key]) === 'object'){
                    logger(key + ' -> object ');
                    htmlUpdate(key, elements[key]);
                } else {
                    logger(key + ' ->' + elements[key]);
                }
            }
        }
        */
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

    // enable/disable form
    var activateForm = function(status){
        if(status === false){
            $(action_target + ' input, textarea, button, select').prop("disabled", true);
        } else {
            $(action_target + ' input, textarea, button, select').not('.disabled').prop("disabled", false);
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
        //$('[rel=datepicker]').daterangepicker({ opens: 'left', singleDatePicker: true, locale: {"format": "DD/MM/YYYY", "applyLabel": "Tamam", "cancelLabel": "Vazgeç", "fromLabel": "", "toLabel": "kadar", "customRangeLabel": "Özel", "daysOfWeek": ["Pz","Pt","Sa","Çr","Pr","Cm","Ct"], "monthNames": ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"] } }).removeAttr("rel");
        //$('[rel=datetimepicker]').daterangepicker({ opens: 'left', singleDatePicker: true,  timePicker: true, timePicker24Hour: true, pick12HourFormat: false, locale: {"format": "DD/MM/YYYY HH:mm", "applyLabel": "Tamam", "cancelLabel": "Vazgeç", "fromLabel": "", "toLabel": "kadar", "customRangeLabel": "Özel", "daysOfWeek": ["Pz","Pt","Sa","Çr","Pr","Cm","Ct"], "monthNames": ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"] } }).removeAttr("rel");
        //$('[rel=daterangepicker]').daterangepicker({ opens: 'left', alwaysShowCalendars: true, locale: {"format": "DD/MM/YYYY", "applyLabel": "Tamam", "cancelLabel": "Vazgeç", "fromLabel": "", "toLabel": "kadar", "customRangeLabel": "Özel", "daysOfWeek": ["Pz","Pt","Sa","Çr","Pr","Cm","Ct"], "monthNames": ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"] }, ranges: { 'Bugün': [moment(), moment()], 'Dün': [moment().subtract(1, 'days'), moment().subtract(1, 'days')], 'Bu Ay': [moment().startOf('month'), moment().endOf('month')], 'Geçen Ay': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')] } }).removeAttr("rel");
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

    // modal box functions 
    var fixModal = function(){
        $('#modal-message .modal-dialog').removeClass('wide-modal');
        $('#modal-message .modal-body').removeClass('ajax-modal');
        $('#modal-message .modal-header').attr('class','modal-header');
        $('#modal-message .modal-title').html('');
        $('#modal-message .modal-message').html('');
        $('#modal-message .modal-footer').hide();
    }

    var alertModal = function(title, message, level){
        fixModal();
        if(level != undefined){ $('#modal-message .modal-header').addClass(level); }
        $('#modal-message .modal-title').html(title);
        $('#modal-message .modal-message').html(message);
        $('#modal-message').modal('show');
    }

    var confirmModal = function(title, message, type, target){
        fixModal();
        
        confirmTarget = target;
        confirmType = type;
        confirm = '';

        $('#modal-message .modal-title').html(title);
        $('#modal-message .modal-message').html(message);
        $('#modal-message .modal-footer').show();
        $('#modal-message').modal('show');
    }

    var ajaxModal = function(title, url){
        $('#modal-ajaxContent .modal-dialog').addClass('modal-lg');
        $('#modal-ajaxContent .modal-body').addClass('ajax-modal');
        $('#modal-ajaxContent .modal-title').html(title);
        $('#modal-ajaxContent').modal('show');
        $('#modal-ajaxContent .modal-ajaxContent').load(url, undefined, activatePage);
    }

    var overlayWindow = function(title, url){
        // overlay window
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

    // init webapper
    webapper.init();

};

}(jQuery));
