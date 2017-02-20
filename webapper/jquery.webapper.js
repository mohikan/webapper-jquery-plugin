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

    webapper.init = function(){
    
        webapper.settings = $.extend({
            content         : '#content',       // dynamic content area
            last_content    : '',               // last loaded content
            loadingbar      : true,             // ajax loading bar
            loadingbar_color: '#CC0000',        // ajax loading bar color
            history         : true,             // keep navigation history
            keyup_timer     : 1500,             // input timer
            reflex_time     : 300,              // animations reflex time
            live            : '/live',          // listen periodictly
            live_timer      : 0,                // live check every seconds
            debug           : false,            // console debug
            action          : ''
        }, options );


        // links
        webapper.on('click', 'a, .link', function(e){
            e.preventDefault();
            logger('link clicked');
            path = $(this).attr('href');
            target = $(this).attr('target');
            if(target != undefined){
                // main link
                if(target == 'main'){
                    location.href = path;
                }
                // modal link
                if(target == 'modal'){
                    ajaxModal($(this).attr('title'), path);
                }
                // form submit
                if(target == 'form'){
                    $('form').submit();
                }
                // confirm
                if(target == 'confirm'){
                    confirmModal('Confirm', $(this).data('confirm'), 'link', path);
                }
                // 
            } else {
                if(path.substring(0, 1) != '#'){ 
                    jsonResponse(path);
                }
            }

        });

        // forms
        webapper.on('submit', 'form', function(e){
            
            e.preventDefault();
            logger('form submited');

            $("div.has-error").removeClass("has-error");

            // required fields
            check_requireds = 0;
            $(this).find('.required').each(function(i, e){
                if($(e).val() == ""){
                    $(e).parent("div").addClass("has-error");
                    check_requireds ++;
                }
            });

            if(check_requireds == 0){

                if($(this).attr("rel") != undefined){
                    // no submit
                    if($(this).attr("rel") == "nosubmit"){
                        // do nothing
                    }
                    // confirm
                    if($(this).attr("rel") == "confirm"){
                        confirmModal('Confirm', $(this).data("message"), 'form', $(this));
                    }
                    //
                } else {
                    form_action = $(this).attr('action');
                    form_data = new FormData(this);
                    jsonResponse(form_action, form_data);
                }

            }

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
                if(loadingbar){
                    $('#loadingbar').width('0px').show().width('10%');
                }
            }).ajaxSend(function(){
                if(loadingbar){
                    $('#loadingbar').delay(600).width('33%');
                }
            }).ajaxComplete(function(){
                if(loadingbar){
                    $('#loadingbar').width('100%').delay(600).fadeOut(300);
                } else {
                    loadingbar = true;
                }
            });
        }

        // add modal boxes
        webapper.append('<div class="modal fade small-modal" id="modal-message" tabindex="-1" role="dialog" aria-labelledby="myModalLabel"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title" id="myModalLabel"></h4></div><div class="modal-body"><div class="modal-message text-c"></div></div><div class="modal-footer"><button type="button" class="btn btn-small btn-default" data-dismiss="modal">Cancel</button><button type="button" class="btn btn-small btn-success" onClick="confirmIt()">Confirm</button></div></div></div></div><div class="modal fade small-modal" id="modal-ajaxContent" tabindex="-1" role="dialog" aria-labelledby="myModalLabel"><div class="modal-dialog" role="document"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title" id="myModalLabel"></h4></div><div class="modal-body"><div class="modal-ajaxContent text-c"></div></div><div class="modal-footer"><button type="button" class="btn btn-small btn-default" data-dismiss="modal">Cancel</button><button type="button" class="btn btn-small btn-success" onClick="confirmIt()">Confirm</button></div></div></div></div>');

        // activate page 
        activatePage();

        // status
        logger('webapper loaded');

    }

    // load json response
    var jsonResponse = function(url, post_data){
        if(current_action == ""){
            
            if(post_data != undefined){
                method = 'POST';
                current_action = "form_process";
            } else {
                method = 'GET';
                current_action = "process";
                historyAdd(url);
            }

            console.log("url : " + url);
            console.log("current : " + current_action);
            
            $.ajax({
                type: method,
                url: url,
                data: post_data,
                cache: false,
                dataType: "json",
                processData: false,
                contentType: false,
                success: function(data){
                    doWorks(data);
                    current_action = "";
                },
                error: function(data) {
                    $(webapper.settings.content).html(data.responseText);
                    current_action = "";
                    activatePage();
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
                console.log('form error :' + error + " -> " + data.form_errors[error]);
                $(".form-control[name="+error+"]").parent(".form-group").addClass("has-error");
            }
        }
        // table
        if(data.table != undefined){
            /* update table */
        }
        // update
        if(data.update != undefined){
            for(element in data.update){
                for(foo in data.update[element]){
                    if(typeof(data.update[element][foo]) === 'object'){
                        for(bar in data.update[element][foo]){
                            $(element)[foo](bar, data.update[element][foo][bar]);
                        }
                    } else {
                        $(element)[foo](data.update[element][foo]);
                    }
                }
            }
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

    // add history
    var historyAdd = function(path){
        if(path != webapper.settings.last_content || webapper.settings.history === false){
            webapper.settings.last_content = path;
            if(webapper.settings.history != false){
                window.history.pushState(null, null, path);
            }
        }
    }

    // activate page
    var activatePage = function(){
        $('[rel=select2]').select2({ width: '100%' });
        $(':input').inputmask();
        $('.focusme').focus();
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
        $('#modal-ajaxContent .modal-dialog').addClass('wide-modal');
        $('#modal-ajaxContent .modal-body').addClass('ajax-modal');
        $('#modal-ajaxContent .modal-title').html(title);
        $('#modal-ajaxContent').modal('show');
        $('#modal-ajaxContent .modal-ajaxContent').load(url);
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
