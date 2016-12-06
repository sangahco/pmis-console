/*
 * Functions.js
 *
 * Copyright (c) Sangah Management Consulting
 * This file ONLY for Java project team in Solution

 * Code Conventions for the JavaScript Programming Language  
 * http://javascript.crockford.com/code.html
 * 
 * Self-Executing Anonymous Function - http://markdalgleish.com/2011/03/self-executing-anonymous-functions/
 * http://stackoverflow.com/questions/592396/what-is-the-purpose-of-a-self-executing-function-in-javascript
 * http://stackoverflow.com/questions/10371539/why-define-anonymous-function-and-pass-jquery-as-the-argument/10372429#10372429
 * Strict Mode - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
 */
(function($) {
"use strict";
	
	/* PMIS functions START */
	var pmis = pmis || {};
	$.extend(pmis, {
		url: function(url, parameters) {
			var queryStr = "";
			if( typeof parameters !== "undefined" ) { 
				if( parameters.elements || typeof parameters === "string" ) {
					queryStr = $(parameters).serialize();
				} else if( $.isPlainObject(parameters) ) {
					$.each(parameters, function(key, value){
						if (typeof value === "undefined" || value === null){
							delete parameters[key];
						}
					});
					queryStr = $.param(parameters);
				} else if( $.isArray(parameters) ) {
					for(var i=0; i < parameters.length; i++){
						if(typeof parameters[i].value === "undefined" || parameters[i].value === null ){
							parameters.splice(i, 1);
						}
					}
					queryStr = $.param(parameters);
				} else {
					if(console && console.log) {
						console.log("Impossible to create a serialized representation of parameters; check parameters object.");
					}
				}
			}
			if(console && console.log) {
				console.log(url + "?" + queryStr);
			}
			return url + "?" + queryStr;
		},
		
		action: function(action, parameters) {
			return pmis.url( action + ".action", parameters );	
		},
		
		forward: function(url, params) {
			if( storageAvailable("localStorage") ) {
				localStorage.setItem( "location::parameters", JSON.stringify(params) );
				localStorage.setItem( "location::url", url );
			}
			location.href = pmis.url( url, params );
		},
		
		trigger: function(type, data) {
			/**********************************************************************
			Execute all handlers attached to the document for the given type.
			
			IN:
				type: A string containing the event name to be triggered.
				data: Additional parameters to pass along to the event handler.
			**********************************************************************/
			//console.log("triggering event: " + type );
			var win = window;
			data = data || {};
			$.extend( data, {
				_ID_: win._ID_
				//,_WIN_: win // generate a loop
			});
			win.$.event.trigger({type: type}, data );
			while (win !== top) {
				win = win.parent;
				try{
					win.$.event.trigger({type: type}, data );
				}
				catch(err) {
					console.log(err);  // we hide cross-origin error
				}
			}
		},
		
		on: function( event, namespace, fn ) {
			/**********************************************************************
			Attach an event handler function for one or more events to the selected elements.
			A more convenient function of jQuery.on if namespace is used. 
			Please note that 'fn' is not the real handler that will be used, instead a new handler function will be created.
			
			IN:
				event - the event which the handler will listen to.
				namespace - event namespace that simplify removing or triggering the event.
				fn - function to execute when the event is triggered.
			OUT:
				handler - A handler function that will be attached to the event(s)
			EXAMPLE:
				pmis.on('item/selected', 'doclist', function(data){ ... });
				pmis.off('doclist');
				
				Using jquery: 
				jQuery.on('item/selected.doclist', function(e, data){ ... })
				jQuery.off('.doclist');
			**********************************************************************/
			if( typeof event !== "string" ) { return; }
			if( typeof namespace === "function" ) {
				fn = namespace;
				namespace = undefined;
			}
			if( typeof fn !== "function" ) { return; }
			
			var _this = this;
			var handler = function(e, args){
				console.log('Executing handler: ' + e.type );
				fn.call( _this, args );
			}
			
			event = event.split();
			$.each( event, function(idx, e){
				if( typeof namespace === "string" ) {
					e += "." + namespace;
				}
				$( document ).on( e, handler );
			});
			
			return handler;
		},
		
		off: function( namespace, handler ) {
			/**********************************************************************
			Remove event handlers attached to the dom object passing a namespace.
			If namespace is not used jQuery.off have to be used instead.  
			
			IN:
				namespace - event namespace.
				handler - A handler function previously attached for the event(s)
			**********************************************************************/
			namespace = namespace.replace( /^\./, '' );
			$( document ).off( "." + namespace, handler );
			$( window ).off( "." + namespace, handler );
		},
		
		successMessage: function(message){
			this._messagebox(message,"success");
		},
		
		infoMessage: function(message){
			this._messagebox(message,"info");
		},
		
		errorMessage: function(message){
			this._messagebox(message,"error");
		},
		
		warningMessage: function(message){
			this._messagebox(message,"warning");
		},
		
		_messagebox: function(message, type){
			var msgbox = $("<div class='pmismsgbox'><p></p></div>").addClass(type).css({top:-46}).appendTo("body").fadeIn()
			.stop().animate({"top": -2}, 500, 'easeOutExpo');
			msgbox.find('p').html(message);
			var fadeout = function(){ msgbox.animate({"top": -46}, 300, 'easeOutExpo', function(){ $(this).remove(); }); }
			msgbox.on('mouseover', function(){
				fadeout();
			});
			setTimeout(function() {
				fadeout();
			}, 5000);
		},
		
		openDialog: function(data){
			/**********************************************************************
			IN:
				data.url - required
				data.param - required
				data.id - required for closing the dialog by id with pmis.closeDialog
			OUT:
				DOM Object - Dialog DOM element
			**********************************************************************/
			var dialog = $(
					"<div style=\"display: none\"><div class=\"dialog-data\" >" +
					"<iframe name='dialogFrame' frameborder=\"0\" scrolling=\"yes\" style=\"height: 100%; width: 100%; border: 0; overflow: hidden;\"></iframe>" +
					"</div></div>").appendTo("body");
			
			dialog.attr("id", data.id);
			$(".dialog-data", dialog)
				//.css("padding-bottom", 3) // scrollbar fix
				//.css("overflow", "auto")
				.css("height", data.height)
				.css("max-height", data.maxHeight);
			
			dialog.dialog(
				$.extend(
					{ // default values
						autoOpen: false,
						closeOnEscape: true,
						modal: true,
						resizable: false,
						mainPage: false,
						noiframe: false
						//,dialogClass: "no-padding"
					}, 
					data,
					{ // fixed values
						height: "auto",
						maxHeight: "auto",
						open: function() {
							$(document.body).addClass('noscroll');
						},
						close: function(args){
							if( typeof data.close === "function" ){
								data.close.apply(this, args);
							}
							//$(this).dialog("destroy");
							$("iframe", this).remove();
				            $(this).remove();
				            $(document.body).removeClass('noscroll');
						}
					}
				)
			);
			
			if( data.content ){
				$(".dialog-data", dialog).html(data.content);
				dialog.trigger("ready");
				$.extend( window, {
					_ID_: Math.round(Math.random()*100000000),
					_DLG_: dialog[0],
					getID: function(){ return window._ID_; },
					getDialog: function(){ return window._DLG_; }
				});
			}
			else if( data.url && data.noiframe ){
				dialog.find('.dialog-data').load( data.url, $.extend(data.param, {"popDiv": "1"}), function (){
					$.extend( window, {
						_ID_: Math.round(Math.random()*100000000),
						_DLG_: dialog[0],
						getID: function(){ return window._ID_; },
						getDialog: function(){ return window._DLG_; }
					});
					dialog.trigger("ready");
				});
			}
			else if( data.url ) {
				var ifr = dialog.find("iframe").load(function(){
					var w = this.contentWindow;
					$.extend( w, {
						_ID_: Math.round(Math.random()*100000000),
						_DLG_: dialog[0],
						getID: function(){ return w._ID_; },
						getDialog: function(){ return w._DLG_; }
					});
					dialog.trigger("ready");
				});
				if( data.mainPage ){ 
					ifr.get(0).src = pmis.url( data.url, data.param ); 
				}
				else{ 
					ifr.get(0).src = pmis._createDialogUrl(data.url, data.param); 
				}
			}
			
			dialog.dialog("open");
			
			return dialog;
		},
		
		closeDialog: function(selector){
			/**********************************************************************
			IN:
				selector - a valid css selector or dom object
			**********************************************************************/
			if( $(selector).length == 0 ) { console.warn("Dialog not found. Check the selector!"); return;}
			setTimeout(function(){ // fix for ie
				$(selector).data("closing", 1);
				$(selector).dialog("close");
			},1);
		},
		
		_createDialogUrl: function(url, params) {
			if( params && params.constructor == String ) {
				var c_param = params;
			}
			else if( $.isPlainObject(params) || $.isArray(params) ) {
				var c_param = $.param(params, false).replace(/&/g, "||");
			}
			
			return pmis.url( "/pmis/STND_PMIS/common/popup/CommonPopDialog.jsp", {
				"txtModule": url,
				"txtParam": c_param
			});
		},
		
		formatNumber: function(num,decimalNum,bolLeadingZero,bolParens,bolCommas) { 
			/**********************************************************************
			IN:
				NUM - the number to format
				decimalNum - the number of decimal places to format the number to ( if -1 disabled ).
				bolLeadingZero - true / false - display a leading zero for numbers between -1 and 1
				bolParens - true / false - use parenthesis around negative numbers
				bolCommas - put commas as number separators.
	
			RETVAL:
				The formatted number!
				"NaN" if the number is not valid.
			**********************************************************************/
			if( num+"" == "0") return "0";
			if( !num ) return "";
			if( isNaN( parseInt( new Number(num) ) ) ) return "NaN";
	
			var tmpNum = num;
			var iSign = num < 0 ? -1 : 1;		// Get sign of number
			
			// Adjust number so only the specified number of numbers after
			// the decimal point are shown.
			if( decimalNum && decimalNum != -1 ) {
				tmpNum *= Math.pow(10,decimalNum);
				tmpNum = Math.round(Math.abs(tmpNum))
				tmpNum /= Math.pow(10,decimalNum);
				tmpNum *= iSign;					// Readjust for sign
			}
			
			// Create a string object to do our formatting on
			var tmpNumStr = new String(tmpNum);
	
			// See if we need to strip out the leading zero or not.
			if (!bolLeadingZero && num < 1 && num > -1 && num != 0)
				if (num > 0)
					tmpNumStr = tmpNumStr.substring(1,tmpNumStr.length);
				else
					tmpNumStr = "-" + tmpNumStr.substring(2,tmpNumStr.length);
				
			// See if we need to put in the commas
			if (bolCommas && (num >= 1000 || num <= -1000)) {
				var iStart = tmpNumStr.indexOf(".");
				if (iStart < 0)
					iStart = tmpNumStr.length;
	
				iStart -= 3;
				while (iStart >= 1) {
					tmpNumStr = tmpNumStr.substring(0,iStart) + "," + tmpNumStr.substring(iStart,tmpNumStr.length)
					iStart -= 3;
				}		
			}
	
			// See if we need to use parenthesis
			if (bolParens && num < 0)
				tmpNumStr = "(" + tmpNumStr.substring(1,tmpNumStr.length) + ")";
	
			return tmpNumStr.valueOf();		// Return our formatted string!
		},
		
	    // Escapes special characters and returns a valid jQuery selector
	    escapeSelector: function(str) {
	    	/**********************************************************************
	    	IN:
	    		str - string to escape
	    	EXAMPLE:
		    	afterInsertRow: function(rowid, rowdata, rowelem){
		            $('tr#' + pmis.escapeSelector(rowid) + ' td', this).css("font-weight", "700");
		        }
	        **********************************************************************/
	    	return str.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
	    },
	    
	    escapeHtml: function(str){
	    	var entityMap = {
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': '&quot;',
				"'": '&#39;',
				"/": '&#x2F;'
			};
			
			return String(str||"").replace(/[&<>"'\/]/g, function (s) {
				return entityMap[s];
			});
	    },
	    
	    wait: function( runnable ) {
	    	/**********************************************************************
	    	IN:
			    delay - default 500ms
			    timeout - default -1
			    condition - default false
			EVENT:
			    onWait
			    onTimeout
			    onExecute
			    onCancel
	    	EXAMPLE:
			    var params = {
			        delay: 1000,
			        timeout: 10000,
			        onWait: function(){ console.log('ciao', this._elapsed); },
			        onTimeout: function(){ console.log('CIAO!!!'); },
			        onCancel: function(){ console.log('WHY???'); }
			    };
			    wait( params );
			 
			    //params.cancelled = true;
	    	**********************************************************************/
	    	if( !runnable.delay ) {
	    		runnable.delay = 500;
	    	}
	
	    	if( !runnable.timeout ) {
	    		runnable.timeout = -1;
	    	}
	    	
	    	if( !runnable.condition ) {
	    		runnable.condition = function(){ return false; };
	    	}
	    	
	    	runnable._elapsed = 0;
	
	    	runnable.run = function() {
	    		this._elapsed += this.delay;
	
	    		if( !this.cancelled ) {
	    			if( this.condition() ) {
	    				if( typeof this.onExecute == "function" ) this.onExecute();
	    			} else {
	    				if( this.timeout >0 && this._elapsed >= this.timeout ) {
	    					if( typeof this.onTimeout == "function" ) this.onTimeout();
	    				} else {
	    					if( typeof this.onWait == "function" ) this.onWait();
	    					setTimeout( this.run.bind(this), this.delay )
	    				}
	    			}
	    		} else {
	    			if( typeof this.onCancel == "function" ) {
	    				this.onCancel();
	    			}
	    		}
	    	}
	    	
	    	runnable.cancel = function() {
	    		this.cancelled = true;
	    	}
	    	
	    	setTimeout( runnable.run.bind(runnable), 1 );
	    	return runnable;
	    },
	    
	    isDateInputSupported: function() {
	    	// @deprecated
	    	// Modernizr.inputtypes.date should be used instead
	    	var elem = document.createElement('input');
	    	elem.setAttribute('type', 'date');
	    	elem.value = 'foo';
	    	return (elem.type == 'date' && elem.value != 'foo');
	    },
	    
	    disableArea: function( selector ){
	    	var $t = $(selector);
	    	if( !$t.hasClass('pmis-disabled-wrapper') ) {
	    		$t.addClass('pmis-disabled-wrapper').append('<div class="pmis-disabled"></div>');
	    	}
	    },
	    
	    enableArea: function( selector ){
	    	$(selector).removeClass('pmis-disabled-wrapper').find('.pmis-disabled').remove();
	    },
	    
	    when: function(){
	    	/**********************************************************************
	    	Will execute in sequence the ajax functions provided to the funcion.
	    	Only after the return of an ajax function will be executed the next one.
	    	
	    	IN:
			    ajax functions - ajax functions provided as arguments. ( simple functions are valid arguments )
	    	EXAMPLE:
	    		var aj1 = function(){ return $.ajax(...); };
	    		var aj2 = function(){ return $.ajax(...); };
	    		var aj3 = function(){ return $.ajax(...); };
	    	
	    		pmis.when(aj1, aj2, aj3);
	    		
	    		equivalent to:
	    		
	    		aj1().done( function(){
	    			aj2().done( function(){
	    				aj3()
	    			});
	    		});
	    		
	    	**********************************************************************/
	    	var _this = this;
	    	var args = Array.prototype.slice.call(arguments);
	    	// Add a Deferred object at the end of the arguments list if a Deferred object is not present
	    	if( !args.length || !args[args.length-1] || !args[args.length-1].resolve ) {
	    		var defer = $.Deferred();
	    		args.push( defer );
	    	}
	    	if( args.length == 1 && args[0].resolve ){
	    		args[0].resolve();
	    	}
	    	else if( args.length ) {
	    		$.when( typeof args[0] === "function" ? args[0].call(_this) : "" )
	    		.done(function( data ){
	    			if( data && data.error ){
	    				/* Stop the call chain if error arise and reject the Deferred object */
	    				args[args.length-1].reject();
	    				return;
	    			}
    				args.splice(0,1);
    				_this.when.apply(_this, args);
	    		})
	    		.fail(function(){
	    			args[args.length-1].reject();
	    		});
	    	}
	    	return args[args.length-1].promise();
	    },
	    
	    qtip: function( content, params ){
	    	if( !$('#qtip-growl-container').length ) {
	    		$("<div id='qtip-growl-container' />").appendTo("body");
	    	}
    		$('<div/>').qtip( $.extend( true, {
    	        content: content,
    	        position: {
    	            target: [0, 0],
    	            container: $('#qtip-growl-container')
    	        },
    	        show: {
    	            event: false,
    	            ready: true,
    	            effect: function () {
    	                $(this).stop(0, 1).animate({
    	                    height: 'toggle'
    	                }, 400, 'swing');
    	            },
    	            delay: 0
    	            //,persistent: true
    	        },
    	        hide: {
    	            event: false,
    	            effect: function (api) {
    	                $(this).stop(0, 1).animate({
    	                    height: 'toggle'
    	                }, 400, 'swing');
    	            }
    	        },
    	        style: {
    	            //width: 250,
    	            classes: 'jgrowl qtip-light qtip-shadow qtip-rounded',
    	            tip: false
    	        },
    	        events: {
    	            render: function (event, api) {
    	                if (!api.options.show.persistent) {
    	                    $(this).bind('mouseover mouseout', function (e) {
    	                        var lifespan = 5000;

    	                        clearTimeout(api.timer);
    	                        if (e.type !== 'mouseover') {
    	                            api.timer = setTimeout(function () {
    	                                api.hide(e)
    	                            }, lifespan);
    	                        }
    	                    })
    	                        .triggerHandler('mouseout');
    	                }
    	            }
    	        }
    	    }, params ));
	    },
	    
	    confirm: function( param ){
	    	/**********************************************************************
	    	This is a  customizable confirm dialog
	    	
	    	IN:
	    		title - The title of the dialog
			    alert - The alert message
			    content - The content of the dialog
			    
			    confirmLabel - The label for confirm button
			    cancelLabel - The label for cancel button
			    
			    onConfirm - event fired after confirm button click
			    onCancel - event fired after cancel button click
	    	EXAMPLE:
	    	**********************************************************************/
	    	param = $.extend(
	    		{
					resizable: false,
					onConfirm: function(){},
					onCancel: function(){},
					modal: true,
					width: 400
	    		},
    			param,
    			{
	    			closeOnEscape: true,
	    			autoOpen: true,
	    			dialogClass: "ui-confirm-dialog",
    				open: function(){
    				},
    				create: function(){
    					var el = $(this);
    					$('.btn_confirm', el )
    					.click(function(){
    						var fun = el.dialog('option', 'onConfirm');
    						if( typeof fun === "function" )
    							fun.call();
    						el.data('_CONFIRMED_', true).dialog('close');
    					});

    					$('.btn_cancel', el )
    					.click(function(){
    						var fun = el.dialog('option', 'onCancel');
    						if( typeof fun === "function" )
    							fun.call();
    						el.dialog('close');
    					});

    					if( el.dialog('option', 'cancel') === false ) {
    						$('.btn_cancel').hide();
    					}
    					if( el.dialog('option', 'confirmLabel') ){
    						$('.btn_confirm', el ).text( el.dialog('option', 'confirmLabel') );
    					}
    					if( el.dialog('option', 'cancelLabel') ){
    						$('.btn_cancel', el ).text( el.dialog('option', 'cancelLabel') );
    					}
    					if( el.dialog('option', 'cTitle') ){
    						$('.dialog-title', el).html( el.dialog('option', 'cTitle') );
    					}
    					if( el.dialog('option', 'content') ){
    						$('.dialog-content', el).html( el.dialog('option', 'content') );
    					}
    					if( el.dialog('option', 'alert') ){
    						$('.dialog-alert', el).html( el.dialog('option', 'alert') );
    					}
    				},
    				close: function(){
    					$(this).remove();
    				}
    			}
	    	);
	    	param.cTitle = param.title||param.cTitle;
	    	param.title = null;
	    	
	    	$('<div style="display:none;">').appendTo('body').load("/pmis/STND_PMIS/common/popup/ConfirmDialog.jsp", function(){
	    		$(this).dialog(param);
	    	})
	    },
	    
	    html2pdf: function( content, filename, landscape ){
	    	/**********************************************************************
	    	Convert HTML content ( Well formed HTML content ) into PDF.
	    	
	    	IN:
	    		content - String ( well formed html content ) or PlainObject*
	    		filename - the name of the file ( not required )
	    		landscape - true if landscape required, leave empty otherwise ( not required )
	    	EXAMPLE:
	    		html2pdf( "<!DOCTYPE HTML><html>...</html>" );
	    		html2pdf( "<!DOCTYPE HTML><html>...</html>", true );
	    		html2pdf( "<!DOCTYPE HTML><html>...</html>", "filename" );
	    		html2pdf( "<!DOCTYPE HTML><html>...</html>", "filename", true );
	    		html2pdf( { content: "...", filename: "...", landscape: "...", header: "server file path", footer: "server file path" } )
	    	
	    	*set of key/value pairs available:
				- content
				- filename
				- landscape
				- header
				- footer
				- mleft
				- mright
				- mtop
				- mbottom
				
	    	**********************************************************************/
	    	if( !content ){ throw Error( "content required" ); }
	    	
	    	if( typeof content === "object" ){}
	    	else if( typeof content === "string" ){
	    		content = { 
	    			"content": content,
	    			"filename": filename,
	    			"landscape": landscape
	    		}
	    		
	    		if( typeof filename === "boolean" ){
		    		content.landscape = filename;
		    		content.filename = null;
		    	}
	    	}
	    	
	    	if( content.beforeStart && typeof content.beforeStart === "function" ){
	    		content.beforeStart.call( content );
	    	}
	    	
			return $.ajax({
				url: "/Common/HtmlAsPdf.action",
				data: {
					"temporary": "1",
					"fileForm.contents": content.content,
					"filename": content.filename,
					"landscape": content.landscape,
					"footer": content.footer,
					"header": content.header,
					"mleft": content.mleft,
					"mright": content.mright,
					"mtop": content.mtop,
					"mbottom": content.mbottom
				},
				type: "POST",
				dataType: "json"
			}).done(function(data){
				location.href = pmis.action("/Common/TemporaryFile/download", {
					fileId: data.fileId,
					contentType: "application/octet-stream;charset=UTF-8",
					fileName: ( content.filename || "html2pdf" ) + ".pdf"
				});
			}).fail(function( jqXHR, textStatus ) {
				alert( "Request failed: " + textStatus );
			}).always(function(){
				if( content.afterComplete && typeof content.afterComplete === "function" ){
		    		content.afterComplete.call( content );
		    	}
			});
		},
	    
	    html2doc: function( content, filename, landscape ) {
	    	/**********************************************************************
	    	Convert XHTML content ( Well formed XHTML content ) into DOCX
	    	
	    	IN:
	    		content - well formed html content
	    		filename - the name of the file ( not required )
	    		landscape - true for landscape, leave empty otherwise ( not required )
	    	EXAMPLE:
	    		html2doc( "<!DOCTYPE HTML><html>...</html>" );
	    		html2doc( "<!DOCTYPE HTML><html>...</html>", true );
	    		html2doc( "<!DOCTYPE HTML><html>...</html>", "filename" );
	    		html2doc( "<!DOCTYPE HTML><html>...</html>", "filename", true );
	    	**********************************************************************/
	    	if( !content ){ throw Error( "content required" ); }
	    	if( typeof filename === "boolean" ){
	    		landscape = filename;
	    		filename = null;
	    	}
	    	
			return $.ajax({
				url: "/Common/HtmlAsDoc.action",
				data: {
					"content": content,
					"landscape": landscape,
					"temporary": "1"
				},
				type: "POST",
				dataType: "json" // default 'json'
			}).done(function(data){
				if( !data.error ){
					location.href = pmis.action("/Common/TemporaryFile/download", {
						fileId: data.fileId,
						contentType: "application/octet-stream;charset=UTF-8",
						fileName: ( filename || "html2doc" ) + ".docx"
					});
				}
			});
	    },
	    
	    addInputHelper: function( doc ){
	    	doc = doc || window.document;
	    	  $('input,textarea,select', doc).each(function () {
	    	    var p = $(this).parent();
	    	    p.find('.input_helper').remove();
	    	    var t = $('<span class="input_helper" style="color:red;"></span>').append('(').append($(this).attr('name')).append(')');
	    	    p.append(t);
	    	  });
	    	  
	    	  $('iframe', doc).each(function () {
	    	    pmis.addInputHelper($(this) [0].contentWindow.document);
	    	  });
	    },

    	removeInputHelper: function( doc ){
    		  doc = doc || window.document;
    		  $('.input_helper', doc).remove();
    		  
    		  $('iframe', doc).each(function () {
    			  pmis.removeInputHelper($(this) [0].contentWindow.document);
    		  });
    	},
    	
    	version: function(){
    		var script = 'from pmis.common.xml import Xml' + String.fromCharCode(13) + String.fromCharCode(10) +
    		'res = sql("select major,minor,type,to_char(applied,\'YYYY-MM-DD HH24:MI:SS\')applied from db_version where rownum=1 order by major desc,minor desc;")' + String.fromCharCode(13) + String.fromCharCode(10) +
    		'print \'{"major":"\' + str(res[0][\'MAJOR\']) + \'","minor":"\' + str(res[0][\'MINOR\']) + \'","applied":"\' + str(res[0][\'APPLIED\']) + \'"}\'';
    		
    		$.ajax({
    			url: "/Test/Console/execute.action",
    			data: {
    				"script.body": script
    			},
    			type: "POST"
    		}).done(function( res ){
    			var data = JSON.parse( res.log );
    			pmis.qtip({
        			text: data.major + "." + data.minor + " (" + data.applied + ")",
        			title: {
        				text: "Current DB Revision",
        				button: true
        			}
        		}, {
        			show: {
        				persistent: true
        			}
        		});
    		});
    	},
    	
    	dbinfo: function(){
    		var script = 'from pmis.common.xml import Xml' + String.fromCharCode(13) + String.fromCharCode(10) +
    		'from pmis.common.util import PmisConfig' + String.fromCharCode(13) + String.fromCharCode(10) + 
    		'res = sql("select major,minor,type,to_char(applied,\'YYYY-MM-DD HH24:MI:SS\')applied from db_version where rownum=1 order by major desc,minor desc;")' + String.fromCharCode(13) + String.fromCharCode(10) +
    		'print "DB VERSION: " + str(res[0]["MAJOR"]) + "." + str(res[0]["MINOR"]) + " (" + str(res[0]["APPLIED"]) + ")"' + String.fromCharCode(13) + String.fromCharCode(10) +
    		'print "DB SERVER: " + PmisConfig.get("db.Url")' + String.fromCharCode(13) + String.fromCharCode(10) +
    		'print "DB DRIVER: " + PmisConfig.get("db.DriverClassName")' + String.fromCharCode(13) + String.fromCharCode(10) +
    		'print "DB SCHEMA: " + PmisConfig.get("db.Username")';

    		$.ajax({
    			url: "/Test/Console/execute.action",
    			data: {
    				"script.body": script
    			},
    			type: "POST"
    		}).done(function( res ){
    			pmis.qtip({
        			text: '<pre>' + res.log + '</pre>',
        			title: {
        				text: "Current DB Info",
        				button: true
        			}
        		}, {
        			show: {
        				persistent: true
        			}
        		});
    		});
    	},
    	
    	dlgID: function(dlg){
    		if( dlg ) {
    			var ifr = $( 'iframe', dlg );
    			if( ifr.length ) {
    				return ifr[0].contentWindow.getID();
    			}
    		}
    		if( typeof window.getID === "function" ) {
    			return window.getID();
    		}
    		return null;
    	},
    	
    	appendStyleSheet: function( cssFileUrl ) {
			if ( document.createStyleSheet )
				document.createStyleSheet( cssFileUrl );
			else {
				var link = document.createElement( 'link' );
				link.rel = 'stylesheet';
				link.type = 'text/css';
				link.href = cssFileUrl;

				if(!document.head){
					var head = document.createElement( 'head' );
					document.insertBefore( head, document.documentElement.firstChild );
				}
				document.head.appendChild( link );
			}
		},
		
		cleanEditorDoc: function(doc){
			// remove special class and id from reference document
			$( '*[id^="tmp_"], *[id^="stnd_"]', doc.body ).removeAttr("id");
			$( '*[class~="input_field"]', doc.body ).removeClass('input_field');
			$( 'div[contenteditable]', doc.body ).removeAttr( 'contenteditable' );
			
			$( '*', doc.body )
			.removeClasses("dbdata_")
			.removeClasses("tmp_")
			.removeClasses("stnd_");
			
			// disable custom field in daum editor
			$( '.radio_field, .check_field, .commcode_search, .date_field, .workobs_search', doc.body ).addClass('disabled');
		},
		
		ckeditor: {
			
			/**
			 * @param element The DOM element (textarea), its ID, or name.
			 * @param config The specific configuration to apply to this editor instance
			 */
			basic: function(element, config){
				CKEDITOR.replace(element, $.extend({
					plugins: "dialogui,dialog,basicstyles,clipboard,button,toolbar,enterkey,entities,floatingspace,wysiwygarea,indent,indentlist,fakeobjects,link,list,undo,maximize",
					toolbarGroups: [
						{ name: 'document',    groups: [ 'mode', 'document', 'doctools' ] },
						{ name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
						{ name: 'editing',     groups: [ 'find', 'selection', 'spellchecker' ] },
						{ name: 'forms' },
						{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
						{ name: 'paragraph',   groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
						{ name: 'links' },
						{ name: 'insert' },
						{ name: 'styles' },
						{ name: 'colors' },
						{ name: 'tools' },
						{ name: 'others' }
					]
					,removeButtons: 'Cut,Copy,Paste,Undo,Redo,Anchor,Underline,Strike,Subscript,Superscript'
				}, config));
			}
		},
		
		resize: (function () {
			//var self = pmis.resize;
			var funcs = [];
			var ids = [];

			funcs.push(function () {
				$('[resize]', window.document).each(function (){
					// @see https://learn.jquery.com/events/triggering-event-handlers/
					$(this).triggerHandler('resize::resize');
				});
			});

			$(window).resize(function () {
				for (var i = 0; i < ids.length; i++) {
					clearTimeout(ids[i]);
				}
				ids = [];
				for (var i = 0; i < funcs.length; i++) {
					var f = funcs[i];
					if (!funcs[i].el || $.contains(document.documentElement, f.el)) {
						ids.push(setTimeout(f, 200));
					}
				}
			});

			var ret = function (fn, el) {
				if(!fn) throw Error('Parameters missing');
				fn.el = el;
				funcs.push(fn);
			};
			ret.funcs = funcs;

			return ret;
		})(),
		
	    test: {
	    	when: function(){
	    		var aj1 = function(){
	    			console.log('aj1 start');
	    			var d = $.Deferred();
	    			setTimeout(function(){
	    				d.resolve();
	    			}, 1000);
	    			
	    			return d.promise().done(function(){ 
	    				console.log('aj1 done'); 
	    			});
	    		}
	    		var aj2 = function(){
	    			console.log('aj2 start');
	    			var d = $.Deferred();
	    			setTimeout(function(){
	    				d.resolve();
	    			}, 300);
	    			return d.promise().done(function(){ 
	    				console.log('aj2 done'); 
	    			});
	    		}
	    		var aj3 = function(){
	    			console.log('aj3 start');
	    			var d = $.Deferred();
	    			setTimeout(function(){
	    				d.resolve();
	    			}, 100);
	    			return d.promise().done(function(){ 
	    				console.log('aj3 done'); 
	    			});
	    		}
	    		    		
	    		pmis.when( aj1, aj2, aj3 ).done(function(){
	    			console.log('all done');
	    		});
	    	},
	    	
	    	qtip: function(){
	    		pmis.qtip({
	    			text: "We will preforming Maintenance on the server in 5 minutes",
	    			title: {
	    				text: "System Message",
	    				button: true
	    			}
	    		});
	    	},
	    	
	    	wait: function(){
	    		var params = {
			        delay: 1000,
			        timeout: 10000,
			        onWait: function(){ console.log('wait', this._elapsed); },
			        onTimeout: function(){ console.log('timeout'); },
			        onCancel: function(){ console.log('canceled'); }
			    };
			    pmis.wait( params );
			    //params.cancelled = true;
	    	}
	    }
	});
	// Expose pmis to the global object
	window.pmis = pmis;
	
	// only for retro compatibility
	window.commonPopDialogUrl = pmis._createDialogUrl;
	window.formatNumber = pmis.formatNumber;
	/* PMIS functions END */

	/* AJAX CUSTOM SETUP
	 * 
	 * preventErrorPopup: if true, in case of exception, NO alert popup will be displayed ( used mainly for handle custom exceptions )
	 * if preventErrorPopup is set to true, exceptions should be handled in the done function!
	 * ex:
	 * .done( function( data ){
	 *     if( data.error && data.error.message == "handled exception message" ){
	 *         // do what you want ( show a custom alert with a custom message if you want )
	 *     } else if( data.error ) {
	 *         // always show the alert popup for not handled exception
	 *         alert( data.error.message );
	 *     }
	 * })
	 * .fail(function(){
	 *     // if the fail event is thrown, there are errors in the code! ( the result is not what expected )
	 * })
	 *  
	 */
	$.ajaxSetup({ cache: false, dataType: "json", preventErrorPopup: false });
	$.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
		if( options.async == false && !options.asyncAlertOff ) { 
			//console.warn("Request %s sent synchronously. Please check 'async' parameter!", options.url ); 
		}
		
		if( options.data && $.isFunction(options.data.indexOf) && options.data.indexOf("__RESPONSE_TYPE__") != -1 ) {
			// do nothing
		} 
		else if( !options.data ) 
		{
			options.data = "__RESPONSE_TYPE__=" + options.dataType;
		} 
		else if( options.data && options.data.constructor == String )
		{
			if( options.data.match(/jsonrpc/) ){}
			else options.data += "&__RESPONSE_TYPE__=" + options.dataType;
		}
		else if( $.isPlainObject(options.data) ) 
		{
			$.extend(options.data, {
				"__RESPONSE_TYPE__" : options.dataType
			});
		} 
		else if( $.isArray(options.data) ) 
		{
			options.data.push = { name: "__RESPONSE_TYPE__", value: options.dataType };
		}
		
		if( !options.success ){
			options.success = [];
		} else if(options.success && $.isFunction(options.success) ){
			options.success = [ options.success ];
		}
		options.success.push(
			function(data){
				// Error handler
				if( data && data.error && !options.preventErrorPopup ) {
					if( this.errorMessage ) {
						alert(this.errorMessage);
					} else {
						alert(data.error.message || "Houston, we have a problem.");
					}
				}
			}
		);
	});
	
	if($.datepicker){
		$.datepicker.setDefaults({
			dateFormat: 'yy-mm-dd',
			showOn: "button",
			buttonImage: "/ext/style/COMMON/image/button_ml/btn_calendar_16.png",
			buttonImageOnly: true,
			changeMonth: true,
			changeYear: true,
			showOtherMonths: true,
			selectOtherMonths: true
		});
		
		var setDateFromField = $.datepicker._setDateFromField;
		$.datepicker._setDateFromField = function(inst, noDefault){
			inst.input.val( unformatDate( inst.input.val() ) );
			setDateFromField.call(this, inst, noDefault);
		}
	}
	
	/*
	 * function to use in case of div loading after html coding ( no iframe ).
	 * You should make a script at the bottom of the page and call this function!
	 */ 
	function functions_init(obj) {
		if( typeof Modernizr !== 'undefined' && $.fn.datepicker ) {
			if (!Modernizr.touch || !Modernizr.inputtypes.date) {
				$("input[type='date']", obj || window.document).each(function () {
					/* NO DATEPICKER FOR CHROME */
					/*if( !pmis.isDateInputSupported() ) {
						$(this).datepicker();
					}*/

					$(this)
					.attr('type', 'text')
					.datepicker();

				});
			}

			if (!Modernizr.touch || !Modernizr.inputtypes.month) {
				$('input[type=month]')
				.attr('type', 'text')
				.datepicker( {
					changeMonth: true,
					changeYear: true,
					showButtonPanel: true,
					dateFormat: 'yy-mm',
					onClose: function(dateText, inst) {
						$(this).datepicker('setDate', new Date(inst.selectedYear, inst.selectedMonth, 1));
					},
					beforeShow: function(input, inst){
						$(inst.dpDiv).addClass('month-picker');
					}
				});
			}
		}
	};
	// make function global
	window.functions_init = functions_init;
	
	$(function(){
		// call the function onready
		functions_init();
	});
	
	// 문자열 교체(by 중용)
	if (typeof String.prototype.replaceAll != 'function') {
		String.prototype.replaceAll = function(strValue1, strValue2){
			var strTemp = this;
			strTemp = strTemp.replace(new RegExp(strValue1, "g"), strValue2);
			return strTemp;
		};
	}
	
	/* 공백제거 */
	if (typeof String.prototype.trim != 'function') {
		String.prototype.trim = function()
		{
		    return this.replace(/(^\s*)|(\s*$)/gi, "");
		}
	}
	
	if (typeof String.prototype.startsWith != 'function') {
		String.prototype.startsWith = function(str) {
			return this.substring(0, str.length) === str
		};
	}
	
	if (typeof String.prototype.hashCode != 'function') {
		String.prototype.hashCode = function() {
		  var hash = 0, i, chr, len;
		  if (this.length == 0) return hash;
		  for (i = 0, len = this.length; i < len; i++) {
		    chr   = this.charCodeAt(i);
		    hash  = ((hash << 5) - hash) + chr;
		    hash |= 0; // Convert to 32bit integer
		  }
		  return hash;
		};
	}
	
	if (typeof String.prototype.byteLength != 'function'){
		String.prototype.byteLength = function(){
			if ( typeof this == 'undefined' ) return 0;
			// Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
			var m = encodeURIComponent(this).match(/%[89ABab]/g);
			return this.length + (m ? m.length : 0);
		};
	}
	
	if (typeof String.prototype.includes != 'function') {
	  String.prototype.includes = function() {'use strict';
	    return String.prototype.indexOf.apply(this, arguments) !== -1;
	  };
	}
	
	if (typeof Array.prototype.indexOf != 'function') {
	    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
	        "use strict";
	        if (this == null) {
	            throw new TypeError();
	        }
	        var t = Object(this);
	        var len = t.length >>> 0;
	        if (len === 0) {
	            return -1;
	        }
	        var n = 0;
	        if (arguments.length > 1) {
	            n = Number(arguments[1]);
	            if (n != n) { // shortcut for verifying if it's NaN
	                n = 0;
	            } else if (n != 0 && n != Infinity && n != -Infinity) {
	                n = (n > 0 || -1) * Math.floor(Math.abs(n));
	            }
	        }
	        if (n >= len) {
	            return -1;
	        }
	        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
	        for (; k < len; k++) {
	            if (k in t && t[k] === searchElement) {
	                return k;
	            }
	        }
	        return -1;
	    }
	}
	
	//@see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
	if (!Function.prototype.bind) {
		Function.prototype.bind = function(oThis) {
			if (typeof this !== "function") {
				// closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError(
						"Function.prototype.bind - what is trying to be bound is not callable");
			}

			var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function() {
			}, fBound = function() {
				return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
						aArgs.concat(Array.prototype.slice.call(arguments)));
			};

			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		};
	}
	
	//@see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener
	if (!Event.prototype.preventDefault) {
        Event.prototype.preventDefault = function () {
            this.returnValue = false;
        };
    }
    if (!Event.prototype.stopPropagation) {
        Event.prototype.stopPropagation = function () {
            this.cancelBubble = true;
        };
    }
    if (!Element.prototype.addEventListener) {
    	var eventListeners = [];
    	
        var addEventListener = function (type, listener /*, useCapture (will be ignored) */ ) {
            var self = this;
            var wrapper = function (e) {
                e.target = e.srcElement;
                e.currentTarget = self;
                try{
	                if ( listener && listener.handleEvent ) {
	                    listener.handleEvent(e);
	                } else if( listener ){
	                    listener.call(self, e);
	                }
                } catch(e) {
                	console.error(e);
                }
            };
            if (type == "DOMContentLoaded") {
                var wrapper2 = function (e) {
                    if (document.readyState == "complete") {
                        wrapper(e);
                    }
                };
                document.attachEvent("onreadystatechange", wrapper2);
                eventListeners.push({
                    object: this,
                    type: type,
                    listener: listener,
                    wrapper: wrapper2
                });

                if (document.readyState == "complete") {
                	try{
                		var e = new Event();
                		e.srcElement = window;
                        wrapper2(e);
                	} catch(e) {
                		console.error(e);
                	}
                }
            } else {
                this.attachEvent("on" + type, wrapper);
                eventListeners.push({
                    object: this,
                    type: type,
                    listener: listener,
                    wrapper: wrapper
                });
            }
        };
        var removeEventListener = function (type, listener /*, useCapture (will be ignored) */ ) {
            var counter = 0;
            while (counter < eventListeners.length) {
                var eventListener = eventListeners[counter];
                if (eventListener.object == this && eventListener.type == type && eventListener.listener == listener) {
                    if (type == "DOMContentLoaded") {
                        this.detachEvent("onreadystatechange", eventListener.wrapper);
                    } else {
                        this.detachEvent("on" + type, eventListener.wrapper);
                    }
                    break;
                }
                ++counter;
            }
        };
        Element.prototype.addEventListener = addEventListener;
        Element.prototype.removeEventListener = removeEventListener;
        if (HTMLDocument) {
            HTMLDocument.prototype.addEventListener = addEventListener;
            HTMLDocument.prototype.removeEventListener = removeEventListener;
        }
        if (Window) {
            Window.prototype.addEventListener = addEventListener;
            Window.prototype.removeEventListener = removeEventListener;
        }
    }
    
    // Production steps of ECMA-262, Edition 5, 15.4.4.19
    // Reference: http://es5.github.com/#x15.4.4.19
    if (!Array.prototype.map) {

        Array.prototype.map = function (callback, thisArg) {

            var T, A, k;

            if (this == null) {
                throw new TypeError(" this is null or not defined");
            }

            // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If IsCallable(callback) is false, throw a TypeError exception.
            // See: http://es5.github.com/#x9.11
            if (typeof callback !== "function") {
                throw new TypeError(callback + " is not a function");
            }

            // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (arguments.length > 1) {
                T = thisArg;
            }

            // 6. Let A be a new array created as if by the expression new Array( len) where Array is
            // the standard built-in constructor with that name and len is the value of len.
            A = new Array(len);

            // 7. Let k be 0
            k = 0;

            // 8. Repeat, while k < len
            while (k < len) {

                var kValue, mappedValue;

                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                if (k in O) {

                    // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                    kValue = O[k];

                    // ii. Let mappedValue be the result of calling the Call internal method of callback
                    // with T as the this value and argument list containing kValue, k, and O.
                    mappedValue = callback.call(T, kValue, k, O);

                    // iii. Call the DefineOwnProperty internal method of A with arguments
                    // Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},
                    // and false.

                    // In browsers that support Object.defineProperty, use the following:
                    // Object.defineProperty( A, k, { value: mappedValue, writable: true, enumerable: true, configurable: true });

                    // For best browser support, use the following:
                    A[k] = mappedValue;
                }
                // d. Increase k by 1.
                k++;
            }

            // 9. return A
            return A;
        };
    }

    //Production steps of ECMA-262, Edition 5, 15.4.4.18
    //Reference: http://es5.github.com/#x15.4.4.18
    if (!Array.prototype.forEach) {

        Array.prototype.forEach = function (callback, thisArg) {

            var T, k;

            if (this == null) {
                throw new TypeError(" this is null or not defined");
            }

            // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If IsCallable(callback) is false, throw a TypeError exception.
            // See: http://es5.github.com/#x9.11
            if (typeof callback !== "function") {
                throw new TypeError(callback + " is not a function");
            }

            // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (arguments.length > 1) {
                T = thisArg;
            }

            // 6. Let k be 0
            k = 0;

            // 7. Repeat, while k < len
            while (k < len) {

                var kValue;

                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                if (k in O) {

                    // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                    kValue = O[k];

                    // ii. Call the Call internal method of callback with T as the this value and
                    // argument list containing kValue, k, and O.
                    callback.call(T, kValue, k, O);
                }
                // d. Increase k by 1.
                k++;
            }
            // 8. return undefined
        };
    }
    
    if (!Array.prototype.filter) {
	  Array.prototype.filter = function(fun/*, thisArg*/) {
	    'use strict';

	    if (this === void 0 || this === null) {
	      throw new TypeError();
	    }

	    var t = Object(this);
	    var len = t.length >>> 0;
	    if (typeof fun !== 'function') {
	      throw new TypeError();
	    }

	    var res = [];
	    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
	    for (var i = 0; i < len; i++) {
	      if (i in t) {
	        var val = t[i];

	        // NOTE: Technically this should Object.defineProperty at
	        //       the next index, as push can be affected by
	        //       properties on Object.prototype and Array.prototype.
	        //       But that method's new, and collisions should be
	        //       rare, so use the more-compatible alternative.
	        if (fun.call(thisArg, val, i, t)) {
	          res.push(val);
	        }
	      }
	    }

	    return res;
	  };
	}
    
    if (typeof Number.prototype.fileSize != 'function') {
    	Number.prototype.fileSize = function(a,b,c,d){
	    	 return (a=a?[1024,'K','iB']:[1e3,'k','B'],b=Math,c=b.log,
	    	 d=c(this)/c(a[0])|0,this/b.pow(a[0],d)).toFixed(2)
	    	 +' '+(d?(a[1]+'MGTPEZY')[--d]+a[2]:'Bytes');
	    };
    }
	
})(jQuery);

/*
 * 입력값에 특정 문자(chars)가 있는지 체크
 * 특정 문자를 허용하지 않으려 할 때 사용
 * ex) if (containsChars(form.name,"!,*&^%$#@~;")) {
 *		 alert("이름 필드에는 특수 문자를 사용할 수 없습니다.");
 *	   }
 */
function containsChars(formNm, chars)
{
	for (var inx=0; inx<formNm.value.length; inx++)
		if (chars.indexOf(formNm.value.charAt(inx)) != -1) return true;

	return false;
}


/*
 * 입력값이 특정 문자(chars)만으로 되어있는지 체크
 * 특정 문자만 허용하려 할 때 사용
 * ex) if (!containsCharsOnly(form.blood,"ABO")) {
 *		 alert("혈액형 필드에는 A,B,O 문자만 사용할 수 있습니다.");
 *     }
 */
function containsCharsOnly(formNm, chars)
{
	for (var inx=0; inx<formNm.value.length; inx++)
	   if (chars.indexOf(formNm.value.charAt(inx)) == -1) return false;

	return true;
}

function containsCharsOnly2(strValue, chars)
{
	for (var inx=0; inx<strValue.length; inx++)
	   if (chars.indexOf(strValue.charAt(inx)) == -1) return false;

	return true;
}


/*
 * 입력값이 알파벳인지 체크
 * 아래 isAlphabet() 부터 isNumComma()까지의 메소드가
 * 자주 쓰이는 경우에는 var chars 변수를 
 * global 변수로 선언하고 사용하도록 한다.
 * ex) var uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
 *	 var lowercase = "abcdefghijklmnopqrstuvwxyz"; 
 *	 var number	= "0123456789";
 *	 function isAlphaNum(formNm) {
 *		 var chars = uppercase + lowercase + number;
 *		 return containsCharsOnly(formNm,chars);
 *	 }
 */
function isAlphabet(formNm)
{
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	return containsCharsOnly(formNm, chars);
}


/*
 * 입력값이 알파벳 대문자인지 체크
 */
function isUpperCase(formNm)
{
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	return containsCharsOnly(formNm, chars);
}


/*
 * 입력값이 알파벳 소문자인지 체크
 */
function isLowerCase(formNm)
{
	var chars = "abcdefghijklmnopqrstuvwxyz";
	return containsCharsOnly(formNm, chars);
}


/*
 * 입력값에 숫자만 있는지 체크
 */
function isNumber(formNm)
{
	var chars = "0123456789,.";
	return containsCharsOnly(formNm, chars);
}

function isNumber2(strValue)
{
	var chars = "0123456789,.";
	return containsCharsOnly2(strValue, chars);
}



/*
 * 입력값이 알파벳,숫자로 되어있는지 체크
 */
function isAlphaNum(formNm)
{
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	return containsCharsOnly(formNm, chars);
}


/*
 * 입력값이 사용자가 정의한 포맷 형식인지 체크
 * 자세한 format 형식은 자바스크립트의 'regular expression'을 참조
 */
function isValidFormat(formNm, format)
{
	return (formNm.value.search(format) != -1) ? true : false;
}


function isNull(formNm)
{
    return ((formNm.value == null) || (formNm.value == "")) ? true : false;
}


// null 체크
function bIsNull(formNm)
{
	return ((formNm.value == null) || (formNm.value == "") || (formNm.value == "NaN")) ? true : false;
}


/*
 * 입력값이 이메일 형식인지 체크
 */
function isValidEmail(formNm)
{
	var format = /^((\w|[\-\.])+)@((\w|[\-\.])+)\.([A-Za-z]+)$/;
	return (bIsNull(formNm) ? true : isValidFormat(formNm,format));
}


/*
 * 입력값이 전화번호 형식(숫자-숫자-숫자)인지 체크
 */
function isValidPhone(formNm)
{
	var format = /^(\d+)-(\d+)-(\d+)$/;
	return (bIsNull(formNm) ? true : isValidFormat(formNm,format));
}


/*
 * 입력값의 길이가 len 이하인지 체크
 */
function isValidLength(formNm, len)
{
	return ((formNm.length > len) ? false : true);
}

// DEPRECATED! Use setValidLength2
function setValidLength(formNm, len)
{
	var sumlength = 0;
	var restr = "";
	var chlen = 0;

	formNm.value = formNm.value.replace(/'/g, "`");
	
	for (var i=0; i<formNm.value.length; i++) {
		if (escape(formNm.value.charAt(i)).length > 3) chlen = 2;
		else chlen = 1;
		
		if (len < (sumlength + chlen)) break;
		sumlength += chlen;
		restr += formNm.value.charAt(i);
	}
	formNm.value = restr;
}

/*
 * 폼 submit 전에, 무조건 문자열의 길이를 len 이하로 자름
 */
function setValidLength2(value, len){
	if( !value || !len ) return value;
	return minimizeString( value, len );
}

function minimizeString( string, len ) {
	if( !string || !len ){
		throw new Error("Illegal argument exception");
	}
	if ( lengthInUtf8Bytes(string) <= len ) {
		return string;
	}
	return minimizeString( string.substring( 0, string.length - 1 ), len );
}


/*
 * escape함수에서 null값으로 전송되는 %, +, 기호를 강제로 ASCII코드화처리

 * ASCII코드를 URL엔코딩하기 위한 사전작업....
 */
function getEscape(str)
{
	var d1, d2;
	d1 = str.replace(/\%/gi, "%25");
	d2 = d1.replace(/\+/gi, "%2B");
	return escape(d2);
}


/*
 * bean 에서 variable 혹은 textbox/textarea 로의 값 전송시 특수문자 디코딩

 */
function setDecode(formNm)
{
	formNm = formNm || "";
	return formNm.replace(/&amp;/g, "&")
						.replace(/&lt;/g, "<")
						.replace(/&gt;/g, ">")
						.replace(/&quot;/g, "\"")
						.replace(/&#039;/g, "`"); // ' 는 `로 대체

}

function setDecode2(formNm)
{
	formNm = formNm || "";
    return formNm.replace(/&amp;/g, "&")
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&quot;/g, "\"")
                        .replace(/&#039;/g, "`")
                        .replace(/&#034;/g, "\"");
}

function setDecode3(formNm)
{
	formNm = formNm || "";
    return setDecode2(formNm);
}

function setChartDecode(formNm)
{
	formNm = formNm || "";
	return formNm.replace(/&amp;/g, "&")
						.replace(/&lt;/g, "<")
						.replace(/&gt;/g, ">")
						.replace(/&quot;/g, "\"")
						.replace(/&#039;/g, "'"); 

}



// DEPRECATED!
function getByteLength(formNm)
{
	var byteLength = 0;
	for (var inx = 0; inx < formNm.value.length; inx++) {
		var oneChar = escape(formNm.value.charAt(inx));
		if (oneChar.length == 1) byteLength++;
		else if (oneChar.indexOf("%u") != -1) byteLength += 2;
		else if (oneChar.indexOf("%") != -1) byteLength += oneChar.length/3;
	}
	return byteLength;
}

/*
 * 입력값의 바이트 길이를 리턴
 */
function getByteLength2(value) {
	return lengthInUtf8Bytes(value);
}

function lengthInUtf8Bytes(str) {
	if ( typeof str == 'undefined' ) return 0;
	// Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
	var m = encodeURIComponent(str).match(/%[89ABab]/g);
	return str.length + (m ? m.length : 0);
}


/* 레이어 보이기 */
function LyOpen(tag)
{
	//tag.filters.blendTrans.apply();
	tag.style.display = "inline";
	//tag.filters.blendTrans.play(); 
}


/* 레이어 닫기 */
function LyClose(tag)
{
	//tag.filters.blendTrans.apply();
	tag.style.display = "none";
	//tag.filters.blendTrans.play(); 
}


/* 레이어 닫기 2006.2.28 중용수정(취소하였기때문에 input file을 초기화) */
function LyCancel(inpDiv, tag)
{
	//tag.filters.blendTrans.apply();
	tag.style.display = "none";
	//tag.filters.blendTrans.play(); 
	
	document.all[inpDiv].select();
	document.selection.clear();
	
	return false;	
}


/*
 * 배열내에 매치되는 스트링이 있는지의 여부 체크
 */
function isInArray(arrList, strValue)
{
	var bResult = false;
	var classes = strValue.split(" ");
	for (var i=0; i<arrList.length; i++) {
		for ( var j=0; j<classes.length; j++ ) {
		 if (( classes[j].toUpperCase() == arrList[i].toUpperCase() ) && (classes[j].length == arrList[i].length)) return true;
		}
	}
	
	return false;
}


/*
 * 세자리마다 콤마 찍어주는 함수
 */
function addComma(str) {
	// ( num, decimalNum, bolLeadingZero, bolParens, bolCommas )
	return pmis.formatNumber( str, -1 /* disabled */, true, false, true );
}







function sDelHyphen(data)
{
	var sBuf = ""+data;
	if (sBuf.length < 1) return 0;
	var sum_data = "";
	for (i=0; i<sBuf.length; i++) if (sBuf.substring(i, i+1) != "-") sum_data += sBuf.substring(i, i+1);
	return sum_data;
}


/*
 * 주민번호 체크
 */
function isValidJumin(strValue)
{
	var pattern = /^([0-9]{6})-?([0-9]{7})$/; 
	var num = strValue;
	if (!pattern.test(num)) return false; 
	num = RegExp.$1 + RegExp.$2;

	var sum = 0;
	var last = num.charCodeAt(12) - 0x30;
	var bases = "234567892345";
	for (i=0; i<12; i++) {
		if (isNaN(num.substring(i,i+1))) return false;
		sum += (num.charCodeAt(i) - 0x30) * (bases.charCodeAt(i) - 0x30);
	}
	var mod = sum % 11;
	return ((11 - mod) % 10 == last) ? true : false;
}




/* 사업번호 체크 */
function isValidBizNo(strValue)
{ 
	var pattern = /([0-9]{3})-?([0-9]{2})-?([0-9]{5})/; 
	var num = strValue;
	if (!pattern.test(num)) return false;
	num = RegExp.$1 + RegExp.$2 + RegExp.$3;
	var cVal = 0; 
	for (var i=0; i<8; i++) { 
		var cKeyNum = parseInt(((_tmp = i % 3) == 0) ? 1 : ( _tmp  == 1 ) ? 3 : 7); 
		cVal += (parseFloat(num.substring(i,i+1)) * cKeyNum) % 10; 
	} 
	var li_temp = parseFloat(num.substring(i,i+1)) * 5 + '0'; 
	cVal += parseFloat(li_temp.substring(0,1)) + parseFloat(li_temp.substring(1,2)); 
	return (parseInt(num.substring(9,10)) == 10-(cVal % 10)%10) ? true : false;
}

/*
 * 날짜 형식 체크
 */
function chkFileName(sValue)
{
	if ((sValue == null) || (sValue == "")) return true;
	
	sValue = sValue.replace(/\//g, "／");
	
	return sValue;	
}

/*
 입력날짜 기준으로 해당하는 일만큼 계산함수(by 중용)
 fnAddDay('2006-05-05',-4) 2006-05-01 리턴
*/
function fnAddDay(strTargetDate , strAmount)
{
	var strAmount = Number(strAmount);
	var strTargetDate = sDelHypn(strTargetDate);
	var strPhoneTime = new Date(strTargetDate.substring(0,4),
								strTargetDate.substring(4,6) - 1,
								strTargetDate.substring(6,8),0, 0, 0, 0);
	var strIDay = strPhoneTime.getTime() + 24*3600*1000*strAmount;
	var strDay = new Date();

	strDay.setTime(strIDay);

	var strYear = strDay.getFullYear();
	var strMonth = strDay.getMonth()+1;
	var strDay = strDay.getDate();

	if(strMonth < 10) strMonth = "0" + strMonth;
	if(strDay < 10) strDay = "0" + strDay;

	return strYear.toString()+"-"+strMonth.toString()+"-"+strDay.toString();
}


// 날짜에 들어간 하이픈("-") 지우기(by 중용)
function sDelHypn(strDate)
{
	var sBuf = ""+strDate; /* 숫자로 인자가 넘어올 수 있기때문에 문자열처리 */
	if (sBuf.length < 1) return 0;
	var sum_data = "";
	for (i=0; i<sBuf.length; i++) if (sBuf.substring(i, i+1) != "-") sum_data += sBuf.substring(i, i+1);
	return sum_data;
}

// 공통팝업관련 Obj Layer 찾기
function MM_findObj(n, d) { //v4.01
  var p,i,x;  if(!d) d=document; if((p=n.indexOf("?"))>0&&parent.frames.length) {
    d=parent.frames[n.substring(p+1)].document; n=n.substring(0,p);}
  if(!(x=d[n])&&d.all) x=d.all[n]; for (i=0;!x&&i<d.forms.length;i++) x=d.forms[i][n];
  for(i=0;!x&&d.layers&&i<d.layers.length;i++) x=MM_findObj(n,d.layers[i].document);
  if(!x && d.getElementById) x=d.getElementById(n); return x;
}


// 공통팝업관련 Obj Layer 보이기
function MM_showHideLayers() { //v6.0
  var obj, args=MM_showHideLayers.arguments;
  for (i=0; i<args.length; i++) {
    obj=MM_findObj(args[i]);
    if (i==0) {
    
        if (obj.style.display=='inline')
        	LyClose(obj);
        else
        	LyOpen(obj);
        	
    } else {
    	LyClose(obj);
    }
  }
}

function cmdCommonPopOrganList(strTitle, strPopDiv, strWidth, strHeight, obj)
{
	console.warn("DEPRECATED FUNCTION!");
}

function cmdCommonPopOrganList2(strTitle, strPopDiv, strWidth, strHeight, obj)
{
	console.warn("DEPRECATED FUNCTION!");
}

function cmdCommonPopCore(strTitle, strPopDiv, strModule, strParam, strWidth, strHeight, obj)
{
	console.warn("DEPRECATED FUNCTION!");
}

//공통 POPUP
function cmdCommonPop(strTitle, strPopDiv, strModule, strParam, strWidth, strHeight, obj)
{
	console.warn("DEPRECATED FUNCTION!");
}

//공통 POPUP no session
function cmdCommonPopNoS(strTitle, strPopDiv, strModule, strParam, strWidth, strHeight, obj)
{
	console.warn("DEPRECATED FUNCTION!");
}

// 공통팝업관련  laverNm : 레이어 name /  ifrmNm : iFrame name / tabGubun : arg(구분자)
function cmdLoadTab(layerNm, ifrmNm, tabGubun, params)
{
	console.warn("DEPRECATED FUNCTION!");
}


function cmdLoadTabType2(layerNm, ifrmNm, tabGubun, params, pInit, div)
{
	console.warn("DEPRECATED FUNCTION!");
}


// round 함수 ( val = 값, precision= 소숫점 자릿수)
function round(val,precision)
{
  val = val * Math.pow(10,precision);
  val = Math.round(val);
  return val/Math.pow(10,precision);
}


// 공통팝업관련 팝업실행후 실행될 함수명
function setFncName(fValue)
{
	document.forms[0].tabFnc.value= fValue;
}


/*
 * Active X 컨트롤 활성화

 * IE 설계변경에 따른 ActiveX 태그를 활성화시키는 함수
 */
function setActiveX(id)
{
	document.write(id.innerHTML.replace("<!--", "").replace("-->" , ""));
	id.id = "";
}


function chkNumericCheck(strValue, intSize, intMaxSize)
{
}


function writeStr(s)
{
document.write(s);
}

/*
rpad(newValue, len, ch)
newValue라는 문자열의 len길이까지의 공백값들을 ch로 채워준다.
*/
function rpad(val, len, ch)
{
    //////////////////////////////////////////
    //  오른쪽에 ch문자로 채우기
	val = new String( val );
    var strlen = ( val.trim()).length;
    var ret = "";
    var alen = len - strlen;
    var astr = ""; 
     
    //부족한 숫자만큼  len 크기로 ch 문자로 채우기
    for (s=0; s<alen; ++s) {
        astr = astr + ch;
    }

    ret = val.trim() + astr; //뒤에서 채우기
    return ret;
}


/*
lpad(newValue, len, ch)
newValue라는 문자열의 len길이까지의 공백값들을 ch로 채워준다.
*/
function lpad(val, len, ch)
{
    //////////////////////////////////////////
    //  오른쪽에 ch문자로 채우기
	val = new String( val );
    var strlen = ( val.trim()).length;
    var ret = "";
    var alen = len - strlen;
    var astr = ""; 
     
    //부족한 숫자만큼  len 크기로 ch 문자로 채우기
    for (s=0; s<alen; ++s) {
        astr = astr + ch;
    }

    ret = astr + val.trim(); //뒤에서 채우기
    return ret;
}


//---------------------------------------------------------------------
// Function name : getFormattedVal 
// Description   : 숫자를 포멧이 갖추어진 문자열로 바꿈
//                 ###3 <= 숫자3은 세자리마다 ,를 찍겠다는 말
//                 .##### <= .(소수점)뒤로 5자리까지 표현하겠다는 말
// Parameter     : value  : 검사할 값
//                 format : 변환할 형태
// Return        :  변환된 값 리턴
// -------------------------------------------------------------------- 
// Usage         : getFormattedVal(value , "###3.#####")
//---------------------------------------------------------------------
function getFormattedVal(value,format)
{
    value = ""+value;

    if(!format)
        return value;

    var sp = parseInt(format.charAt(3));

    if(!sp)
        return value;
        
    var pos = 0;
    var ret = "";
    var vSplit = value.split('.');
    var fSplit = format.split('.');
    var fp = fSplit[1];
    var fv = vSplit[1];
    var lv = vSplit[0];
    var len = lv.length;
    
    for(var i = len % sp; i < len; i += sp){
        if(i == 0 || lv.charAt(i-1) == '-')
            ret += lv.substring(pos,i);
        else
            ret += lv.substring(pos,i)+',';
        pos = i;
    }

    ret += lv.substring(pos,len);

    if(!fv)
        fv = "";
    if(!fp)
        fp = "";
    
    var len1 = fp.length;
    var len2 = fv.length;

    if(len1)
        ret += '.' + fv.substring(0,len1) + fp.substring(len1,len2);
    return ret;
}



/*
 * 날짜를 계산하는 함수 모음 (by plusjin)
 */
function getTodayDate(format)
{
	format = format || 'yyyy-MM-dd';
	var sDate = new Date();
	
	return sDate.format(format);
}

function getMonthDur(pDate1, pDate2)  // 두 기간 사이의 월차기간을 구하는 함수
{
	strYearDur = parseInt(pDate2.substr(0,4)) - parseInt(pDate1.substr(0,4));
	strTotMon  = strYearDur * 12;
	strMonDur  = pDate2.substr(5,2) - pDate1.substr(5,2);
	strTotMon  = strTotMon + strMonDur;
	return(strTotMon);
}


function getDateAddMonth(pDate1,pAddMonth)
{
	strYear    = pDate1.substr(0,4);
    strMonth   = pDate1.substr(5,2);
	if(strMonth.substr(0,1) == "0") strMonth = strMonth.substr(1,1);
	strTotMon  = parseInt(strMonth) + parseInt(pAddMonth);
	strAddYear = parseInt(strTotMon / 12);
	strMonth   = strTotMon % 12;
	if(parseInt(strAddYear) > 0 && parseInt(strMonth) == 0) {
	    strAddYear = parseInt(strAddYear) - 1;
	    strMonth   = 12;
	}
	if(parseInt(strMonth) < 10) {
	    strMonth   = "0" + parseInt(strMonth);
	}
	strYear    = parseInt(strYear) + parseInt(strAddYear);
	strDate    = strYear.toString() + "-" + strMonth.toString();
	return(strDate);
}

function getDateAddMonth2(pDate1,pAddMonth)
{
	strYear    = pDate1.substr(0,4);
    strMonth   = pDate1.substr(4,2);
    
    
    if(strMonth.substr(0,1) == "0") strMonth = strMonth.substr(1,1);
	strTotMon  = parseInt(strMonth) + parseInt(pAddMonth);
	strAddYear = parseInt(strTotMon / 12);
	strMonth   = strTotMon % 12;
	if(parseInt(strAddYear) > 0 && parseInt(strMonth) == 0) {
	    strAddYear = parseInt(strAddYear) - 1;
	    strMonth   = 12;
	}
	if(parseInt(strMonth) < 10) {
	    strMonth   = "0" + parseInt(strMonth);
	}
	strYear    = parseInt(strYear) + parseInt(strAddYear);
	strDate    = strYear.toString() + "-" + strMonth.toString();
	return(strDate);
}

function getDateSubtracMonth(pDate1,pSubtracMonth)
{
	strYear     = pDate1.substr(0,4);
    strMonth    = pDate1.substr(5,2);
    strDay      = pDate1.substr(8,2);
	strAddYear  = parseInt(pSubtracMonth / 12);
	strYear     = parseInt(strYear) - parseInt(strAddYear+1);
	strAddMonth = pSubtracMonth % 12;
	strAddMonth = 12 - strAddMonth
	strDate     = strYear.toString() + "-" + strMonth.toString() + "-" + strDay.toString();
	strDate     = getDateAddMonth(strDate, strAddMonth);
	return(strDate);
}


function isValidDay(strDate)
{
	// 날짜형식이 YYYY-MM-DD 로 되어있어야 한다 (chkDate 함수를 한번 거친 후 사용)
	var yyyy = strDate.substr(0, 4);
	var mm = strDate.substr(5, 2);
	var dd = strDate.substr(8, 2);
	var m = parseInt(mm, 10) - 1;
	var d = parseInt(dd,10);
	var end = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
	if (((yyyy % 4 == 0) && (yyyy % 100 != 0)) || (yyyy % 400 == 0)) end[1] = 29;
	
	if ((d >= 1) && (d <= end[m])) return true;
	else {
		return false;
	}
}


function isLastDay(y, m) {
	switch (m) {
	case "02":
		if ((y % 4 != 0) || (y % 100 == 0) && (y % 400 != 0)) // 2월의 경우 당해가
																// 윤년인지를 확인
			return "28";
		else
			return "29";
		break;
	case "04":
	case "06":
	case "09":
	case "11":
		return "30";
	}
	// 큰 달의 경우
	return "31";
}

/*
 * 사례: 	fireEvent( fm.elements['coopFirmForm.addr1'], "change" );
 * 설명: 	onreadystatechange 이벤트를 영장을 안 받을 것입니다
 * 			value 놓은 후에 이 고드 써면 ( fm.elements['coopFirmForm.addr1'].value   = arrValue[1]; )
 * 			onreadystatechange 이벤트를 영장을 받을 것입니다
 */
function fireEvent(element,event){
    if (document.createEventObject){
        // dispatch for IE
        var evt = document.createEventObject();
        return element.fireEvent('on'+event,evt)
    }
    else{
        // dispatch for firefox + others
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true ); // event type,bubbling,cancelable
        return !element.dispatchEvent(evt);
    }
}
function fireEventMB(element, event) {
	return fireEvent(element,event);
}

function addDate(pInterval, pAddVal, pYyyymmdd, pDelimiter)
{
	var yyyy;
	var mm;
	var dd;
	var cDate;
	var oDate;
	var cYear, cMonth, cDay;
	
	if (pDelimiter != "") {
		pYyyymmdd = pYyyymmdd.replace(eval("/\\" + pDelimiter + "/g"), "");
	}
	
	yyyy = pYyyymmdd.substr(0, 4);
	mm  = pYyyymmdd.substr(4, 2);
	dd  = pYyyymmdd.substr(6, 2);
	
	if (pInterval == "yyyy") {
		yyyy = (yyyy * 1) + (pAddVal * 1);
	} else if (pInterval == "m") {
		mm  = (mm * 1) + (pAddVal * 1);
	} else if (pInterval == "d") {
		dd  = (dd * 1) + (pAddVal * 1);
	}
	
	cDate = new Date(yyyy, mm - 1, dd) // 12월, 31일을 초과하는 입력값에 대해 자동으로 계산된 날짜가 만들어짐.
	cYear = cDate.getFullYear();
	cMonth = cDate.getMonth() + 1;
	cDay = cDate.getDate();
	
	cMonth = cMonth < 10 ? "0" + cMonth : cMonth;
	cDay = cDay < 10 ? "0" + cDay : cDay;
	
	if (pDelimiter != "") {
		return cYear + pDelimiter + cMonth + pDelimiter + cDay;
	} else {
		return cYear + cMonth + cDay;
	}
}

function strToDate(date) {
	if (date.length < 8){
		strDate = date;
	}
	else {
		strDate = date.substr(0, 4) + "-" + date.substr(4, 2) + "-" + date.substr(6, 2);
	}
	
	return(strDate);
}

function roundNum( value, decimals ) {
	if ( value == null || value === "" ) {
		return "";
	}
	return String(Math.round(value * Math.pow(10, decimals))  / Math.pow(10, decimals));
}

/**
 * Looooooooooooooooong running for import/export
 * 
 * @param task.delay Should be more than execAndWait delay set in xml!
 * @param task
 */
function longrunning( task ) {
	task.content = task.content?task.content:{};
	task.content['__RESPONSE_TYPE__'] = "json";
	
	if( task.onUpdate ) {
		task.onUpdate({
			progress: 0,
			maximum: 1
		});
	}

	task.status = "wait";
	if( !task.delay ) {
		task.delay = 5000;
	}

	task.condition = function() {
		return this.status != "wait";
	};

	task.onWait = function() {
		jQuery.ajax({
			url: pmis.url(this.url, this.form),
			data: this.content,
			dataType: 'json',
			type: "POST"
		}).done( 
			function( data ){
		    	this.status = "done";
	        	if( data.wait ) {
	        		this.status = "wait";
	        		if( this.onUpdate ) {
		        		this.onUpdate ( data.wait );
	        		}
	        	} else if( data.cancel ) {
	        		if( this.onCancel ) {
	        			this.onCancel( data );
	        		}
	        	} else if( data.error ) {
	        		if( this.onCancel ) {
	        			if( data.error.message ) {
	        				data.message = data.error.message;
	        			}
	        			this.onCancel( data );
	        		}
	        	} else {
	        		if( this.onUpdate ){
			        	this.onUpdate({
				        	progress: data.maximum || 100,
				        	maximum: data.maximum || 100
			        	});
	        		}
		        	if( this.onSuccess ) {
		        		this.onSuccess( data );
		        	}
	        	}
			}.bind(this)
		);
	}
	
	pmis.wait( task );
}

function exportXls(task) {
	var defer = $.Deferred();
	
	task.url = "/Common/ExcelAction/exportXls.action";
	task.onSuccess = function(data) {
		$.fileDownload( pmis.url("/Common/ExcelAction/downloadXls.action", {
			"fileId" : data.fileId,
			"fileName": data.fileName,
			"excelExt": task.content ? task.content.excelExt : null
		}) );
		
		defer.resolve();
	}
	longrunning(task);
	
	return defer.promise();
}

function cancelXls() {
	jQuery.ajax({
		url: '/Common/ExcelAction/cancelXls.action'
	});
}

function addCommas(nStr)
{
	return addComma(nStr);
}

function getUniqueTime() {
	var time = new Date().getTime();
	while (time == new Date().getTime())
		;
	return new Date().getTime();
}

//lcale에 따른 일자 format변경 함수
function formatDate(date)
{
	if(!date) { return ""; }
	
	var strDate = date;
	if( date.length == 8 ) {
		strDate = date.substr(0, 4) + "/" + date.substr(4, 2) + "/" + date.substr(6, 2);
	}
	else if( date.length == 6 ) {
		strDate = date.substr(0, 4) + "/" + date.substr(4, 2);
	}
	
	var bTime = "24mode";
	
	strDate = strDate.replaceAll("-", "/");
	if (strDate.indexOf("오전") != -1) {
		bTime = 0;
	}
	else if (strDate.indexOf("오후") != -1) {
		bTime = 12;
	}
	
	if (bTime != "24mode") { 
		strDate = strDate.replace("오전 ", "").replace("오후 ", "");
	}
	
	// check if is a good date
	if ( isNaN( Date.parse(strDate) ) ) {
		return date;
	}
	var dDate = new Date(strDate);
	if (bTime != "24mode") {
		dDate.setHours( dDate.getHours() + bTime );
	}
	
	/*if ( __LOCALE__ == "en_US" ) {
		if ( strDate.length == 10) { // ORCL FORMAT: YYYY-MM-DD
			return dDate.format("dd-MMM-yyyy");
		}
		else if (strDate.length == '19') { // ORCL FORMAT: YYYY-MM-DD HH24:MI:SS
			if (bTime === "24mode") {
				return dDate.format("dd-MMM-yy HH:mm:ss");
			}
			return dDate.format("dd-MMM-yy t hh:mm:ss");
		}
		else if (strDate.length == '16') { // ORCL FORMAT: YYYY-MM-DD HH24:MI
			if (bTime === "24mode") {
				return dDate.format("dd-MMM-yy HH:mm");
			}
			return dDate.format("dd-MMM-yy t hh:mm");
		}
		else if (strDate.length == '7') { // ORCL FORMAT: YYYY-MM
			strDate += "/01";
			var dDate = new Date(strDate);
			return dDate.format("MMM-yyyy");
		}
	}*/

	return dDate.format("yyyy-MM-dd");
	//return date;
}

function unformatDate(date)
{
	if(!date) { return ""; }
	
	var strDate = "";
	
	if ( __LOCALE__ == "en_US" ) {
		// 10 Jul 2013
		if (date.length == '11') {
			strDate = date.substr(7, 4) + "/" +
					  date.substr(3, 3) + "/" +
					  date.substr(0, 2);
			var dDate = new Date(strDate);
			if( dDate ) {
				return dDate.format("yyyy-MM-dd");
			}
		}
		// 10Jul2013
		else if (date.length == '9') {
			strDate = date.substr(5, 4) + "/" +
					  date.substr(2, 3) + "/" +
					  date.substr(0, 2);
			var dDate = new Date(strDate);
			if( dDate ) {
				return dDate.format("yyyy-MM-dd");
			}
		}
		// Jul 2013
		else if (date.length == '8') {
			strDate = date.substr(4, 4) + "/" +
					  date.substr(0, 3) + "/" + 
					  "01";
			var dDate = new Date(strDate);
			if( dDate ) {
				return dDate.format("yyyy-MM");
			}
		}
	}
	return date;
}
//override function
unformatDate = function( date ){
	if(!date) { return ""; }
	return date; 
}

function fnDateStr(date)
{
	if(date == null)
		date = new Date();
	var strYear = date.getFullYear();
	var strMonth = date.getMonth()+1;
	var strDay = date.getDate();
	var strHour = date.getUTCHours();
	var strMin = date.getUTCMinutes();
	var strSec = date.getUTCSeconds();
	var mm = "";
	
	if(strMonth < 10) strMonth = "0" + strMonth;
	if(strDay < 10) strDay = "0" + strDay;
	
	if (strHour >= 12) {
		strHour = (strHour == 12) ? 12 : strHour - 12; mm = " 오후";
	}
	else {
		strHour = (strHour == 0) ? 12 : strHour; mm = " 오전";
	}
	
	if(strHour < 10) strHour = "0" + strHour;
	if(strMin < 10) strMin = "0" + strMin;
	if(strSec < 10) strSec = "0" + strSec;

	return strYear.toString()+"-"+strMonth.toString()+"-"+strDay.toString() +" "+mm+" "+strHour+":"+strMin+":"+strSec;
}

/**
 * Return the doctype of the document
 * 
 * @param document
 * @returns
 */
function getDocTypeAsString(document) { 
	var doc = document?document:window.document;
    var node = doc.doctype;
    return node ? "<!DOCTYPE "
         + node.name
         + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
         + (!node.publicId && node.systemId ? ' SYSTEM' : '') 
         + (node.systemId ? ' "' + node.systemId + '"' : '')
         + '>\n' : '';
}

// get iframe document
function getIDoc( iframeEl ) {
    return iframeEl.contentDocument || iframeEl.contentWindow.document;
}

/**
 * jqGrid 실시간 검색 함수
 * 
 * @param obj 객체
 * @param col 검색할 컬럼
 * @param value 검색어
 */
function jqGridSearch(obj, col, value) {
	
	if( !value ) return false;
	//console.log("jqGridSearch(", obj, col, value, ")");
	if( obj && obj.constructor == String ) {
		var obj = $(obj);
	}
	else if( obj && !obj.jquery ) {
		var obj = null;
	}
	
	if(!obj || !col ){
		throw new Error("Illegal argument exception");
	}
	
	obj.jqGrid('saveEditingCell');
	
	var ids = obj.jqGrid('getDataIDs');

	var start_row = 0;
	for ( var i = 0; i < ids.length; i++) {
		if (obj.jqGrid('getGridParam', 'selrow') == ids[i]) {
			start_row = i;
		}
	}
	for ( var i = start_row + 1; i < ids.length; i++) {
		var ret = obj.jqGrid( "getRowData", ids[i] );
		var t_name = ret[col];
		if ( t_name && t_name.toUpperCase().indexOf(value.toUpperCase()) != -1) {
			// 트리형 그리드이경우
			if(obj.jqGrid('getGridParam', 'treeGrid')){
				expandTree(obj, ids[i]);
				obj.closest(".ui-jqgrid-bdiv").scrollTop(obj.css("height").replace(/px/g, ""));
			}
			obj.jqGrid('resetSelection');
			obj.jqGrid('setSelection', ids[i], true);
			return true;
		}
	}
	for ( var i = 0; i < start_row; i++) {
		var ret = obj.jqGrid( "getRowData", ids[i] );
		var t_name = ret[col];
		if ( t_name && t_name.toUpperCase().indexOf(value.toUpperCase()) != -1) {
			// 트리형 그리드이경우
			if(obj.jqGrid('getGridParam', 'treeGrid')){
				expandTree(obj, ids[i]);
				obj.closest(".ui-jqgrid-bdiv").scrollTop(obj.css("height").replace(/px/g, ""));
			}
			obj.jqGrid('resetSelection');
			obj.jqGrid('setSelection', ids[i], true);
			return true;
		}
	}
	
	return false;
	
	// [NOTE] getCell 쓰면 -> td 안에 있는 갑시 나올것이다 (<div>asdasdasd...</div>)
}

function expandTree(obj, selId){
	// @deprecated
	// $.fn.jqGrid.expandGridRows should be used instead.
	var ret = obj.jqGrid("getLocalRow", selId.trim());
	
	 if(ret != false){
	 
	 	// level_field 이 lvl일경우
		while(true){

			// 최상위가되면 빠져나옴.	
			if(ret.lvl == "1"){
				break;
			}
			var p_Ids = obj.jqGrid("getNodeParent", ret);

			// 상위부모가 없는경우
			if(p_Ids == null )
				break;
						
			obj.jqGrid('expandNode', p_Ids);
			obj.jqGrid('expandRow', p_Ids);
			ret = p_Ids;
		}
	}
}

function cmdCellEditClose(obj, tRow, tCol){
    var sIDs = $(obj).jqGrid('getDataIDs');
	var iRow = null;
	for(var i=0; i< sIDs.length; i++){
		if(sIDs[i] == tRow){
			iRow = i;
		}
	}

	if(iRow != null && iRow+1 > 0){
		$(obj).jqGrid("saveCell", iRow+1, tCol ); // save cell before request call
	}
}

function fadeOut(elem) {
	if( $(elem).css('opacity') <= 0 ) return;
	var op = parseFloat( $(elem).css('opacity') ) - 0.10;
	$(elem).css('opacity', op  );
	window.setTimeout(function () {
		fadeOut(elem);
	}, 40);
}

function fadeIn(elem) {
	if( $(elem).css('opacity') >= 1 ) return;
	var op = parseFloat( $(elem).css('opacity') ) + 0.10;
	$(elem).css('opacity', op  );
	window.setTimeout(function () {
		fadeIn(elem);
	}, 30);
}

/**
 * Show a pretty loading icon in full HD!
 * 
 * @param bFlag
 */
function cmdDoingView(bFlag)
{
	if (bFlag == true) {
		if( $('.pmis-proc-loading').length ) return;
		
		var loading = $('<div class="pmis-proc-loading" ></div>')
		if( typeof Spinner !== 'undefined' ){
			var opts = {
			  lines: 12, // The number of lines to draw
			  length: 10, // The length of each line
			  width: 5, // The line thickness
			  radius: 10, // The radius of the inner circle
			  color: '#222', // #rgb or #rrggbb
			  speed: 1, // Rounds per second
			  trail: 30, // Afterglow percentage
			  shadow: false // Whether to render a shadow
			};
			var spinner = new Spinner(opts).spin();
			loading.append(spinner.el);
		}
		$("body").append(loading);
		//$('<i class="tmp-loading-icon fa fa-cog fa-spin fa-4x fa-fw" style="width: 42px;height: 48px;top: 50%;left: 50%;position: fixed;display: block;opacity: 1;z-index: 200;margin-left: -20px;margin-top: -24px;"></i>').appendTo('body');
	}
	else {
		$('.pmis-proc-loading').remove();
	}
}

function zeroPad(num, numZeros) {
	var n = Math.abs(num);
	var zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
	var zeroString = Math.pow(10,zeros).toString().substr(1);
	if( num < 0 ) {
		zeroString = '-' + zeroString;
	}

	return zeroString+n;
}

/**
 * Fill a select with common code items given the dom object and the code cd (NOT comm id!)
 * 
 * @param el
 * @param ccCode
 */
function loadCCSelect(el, ccCode) {
	return $.ajax({
		url: '/Core/CoreList.action',
		data: {
			'com-cd1': ccCode,
			'user-forward': '/pmis/STND_PMIS/common/def/cc.json.jsp'
		},
		type: 'POST'
	}).done(function(data) {
		var $el = $(el);
		if (data.list1) {
			$.each(data.list1, function(idx, val) {
				var opt = $('<option>').attr('value', val.id).text(val.name);
				$el.append(opt);
			});
		}
	});
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode
 */
function toggleFullScreen(domel) {
	
	if (!document.fullscreenElement && // alternative standard method
		!document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
		if (domel.requestFullscreen) {
			domel.requestFullscreen();
		} else if (domel.msRequestFullscreen) {
			domel.msRequestFullscreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			domel.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullscreen) {
			domel.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}
}

/**
 * Load dynamically the Galleria library.
 * Should be use in the page where the library is required instead of script tag in the main page.
 * 
 * @param onload function to execute after the library is loaded
 * @returns
 */
function loadGalleria(onload){
	var _this = this;
	var defer = $.Deferred();
	defer.done(function(){
		if( typeof onload === "function" ){
			onload.call(_this);
		}
	});
	
	if( typeof Galleria === 'undefined' ){
		// load the library only one time!
		PmisJsLoader.load('/ext/galleria/galleria.min.js', function(){
			defer.resolve(); 
		});
	} else {
		defer.resolve();
	}
	
	return defer.promise();
}

/**
 * Detects whether localStorage is both supported and available
 * 
 * @param type
 * @returns {Boolean}
 */
function storageAvailable(type) {
	type = type || "localStorage";
	try {
		var storage = window[type],
			x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	}
	catch(e) {
		return false;
	}
}