(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function () {
    "use strict";
    require('./modules/config.js');
    require('./modules/ui.js');
    require('./modules/builder.js');
    require('./modules/utils.js');
    require('./modules/canvasElement.js');
    require('./modules/styleeditor.js');
    require('./modules/content.js');
    require('./modules/export.js');
    require('./modules/preview.js');
}());
},{"./modules/builder.js":2,"./modules/canvasElement.js":3,"./modules/config.js":4,"./modules/content.js":5,"./modules/export.js":6,"./modules/preview.js":7,"./modules/styleeditor.js":8,"./modules/ui.js":9,"./modules/utils.js":10}],2:[function(require,module,exports){
(function () {
    "use strict";

    var siteBuilderUtils = require('./utils.js');
    var bConfig = require('./config.js');
    var appUI = require('./ui.js').appUI;

     /* Basic Builder UI initialisation */
    var builderUI = {
        allBlocks: {},                                              //holds all blocks loaded from the server
        menuWrapper: document.getElementById('menu'),
        primarySideMenuWrapper: document.getElementById('main'),
        buttonBack: document.getElementById('backButton'),
        buttonBackConfirm: document.getElementById('leavePageButton'),
        siteBuilderModes: document.getElementById('siteBuilderModes'),
        aceEditors: {},
        frameContents: '',                                      //holds frame contents
        templateID: 0,                                          //holds the template ID for a page (???)
        radioBlockMode: document.getElementById('modeBlock'),
        modalDeleteBlock: document.getElementById('deleteBlock'),
        modalResetBlock: document.getElementById('resetBlock'),
        modalDeletePage: document.getElementById('deletePage'),
        buttonDeletePageConfirm: document.getElementById('deletePageConfirm'),
        dropdownPageLinks: document.getElementById('internalLinksDropdown'),
        tempFrame: {},
        init: function(){
            //load blocks
            $.getJSON('elements.json?v=12345678', function(data){ builderUI.allBlocks = data; builderUI.implementBlocks(); });
            
            //sitebar hover animation action
            $(this.menuWrapper).on('mouseenter', function(){
                $(this).stop().animate({'left': '0px'}, 500);
                
            }).on('mouseleave', function(){
                $(this).stop().animate({'left': '-220px'}, 500);
                $('#menu #main a').removeClass('active');
                $('.menu .second').stop().animate({
                    width: 0
                }, 500, function(){
                    $('#menu #second').hide();
                });
            }).animate({'left': '-220x'}, 500);
            /// LEADGEN BUILDER Added Below Code ///
            var page = $('#pageTitle').text();
            $.jStorage.deleteKey(page);
            localStorage.removeItem('tz_seo_'+page);

            /// End LEADGEN BUILDER Code ///
            
            //prevent click event on ancors in the block section of the sidebar
            $(this.primarySideMenuWrapper).on('click', 'a:not(.actionButtons)', function(e){e.preventDefault();});
            $(this.buttonBack).on('click', this.backButton);
            $(this.buttonBackConfirm).on('click', this.backButtonConfirm);
            
            //notify the user of pending chnages when clicking the back button
            $(window).bind('beforeunload', function(){
                if( site.pendingChanges === true ) {
                    return 'Your site contains changed which haven\'t been saved yet. Are you sure you want to leave?';
                }
            });
            //make sure we start in block mode
            $(this.radioBlockMode).radiocheck('check').on('click', this.activateBlockMode);
        },
        
        /*
            builds the blocks into the site bar
        */
        implementBlocks: function() {
            var newItem, loaderFunction;
            for( var key in this.allBlocks.elements ) {
                var niceKey = key.toLowerCase().replace(" ", "_");
                $('<li><a href="" id="'+niceKey+'">'+key+'</a></li>').appendTo('#menu #main ul#elementCats');
                for( var x = 0; x < this.allBlocks.elements[key].length; x++ ) {
                    if( this.allBlocks.elements[key][x].thumbnail === null ) {//we'll need an iframe
                        //build us some iframes!
                        if( this.allBlocks.elements[key][x].sandbox ) {
                            if( this.allBlocks.elements[key][x].loaderFunction ) {
                                loaderFunction = 'data-loaderfunction="'+this.allBlocks.elements[key][x].loaderFunction+'"';
                            }
                            newItem = $('<li class="element '+niceKey+'"><iframe src="'+this.allBlocks.elements[key][x].url+'" scrolling="no" sandbox="allow-same-origin"></iframe></li>');
                        } else {
                            newItem = $('<li class="element '+niceKey+'"><iframe src="about:blank" scrolling="no"></iframe></li>');
                        }
                        
                        newItem.find('iframe').uniqueId();
                        newItem.find('iframe').attr('src', this.allBlocks.elements[key][x].url);
                    
                    } else {//we've got a thumbnail
                        if( this.allBlocks.elements[key][x].sandbox ) {
                            if( this.allBlocks.elements[key][x].loaderFunction ) {
                                loaderFunction = 'data-loaderfunction="'+this.allBlocks.elements[key][x].loaderFunction+'"';
                            }
                            newItem = $('<li class="element '+niceKey+'"><img src="'+this.allBlocks.elements[key][x].thumbnail+'" data-srcc="'+this.allBlocks.elements[key][x].url+'" data-height="'+this.allBlocks.elements[key][x].height+'" data-sandbox="" '+loaderFunction+'></li>');
                        } else {
                            newItem = $('<li class="element '+niceKey+'"><img src="'+this.allBlocks.elements[key][x].thumbnail+'" data-srcc="'+this.allBlocks.elements[key][x].url+'" data-height="'+this.allBlocks.elements[key][x].height+'"></li>');
                        }
                    }
                    
                    newItem.appendTo('#menu #second ul#elements');
                    //zoomer works
                    var theHeight;
                    if( this.allBlocks.elements[key][x].height ) {
                        theHeight = this.allBlocks.elements[key][x].height*0.25;
                    } else {
                        theHeight = 'auto';
                    }
                    newItem.find('iframe').zoomer({
                        zoom: 0.25,
                        width: 270,
                        height: theHeight,
                        message: "Drag&Drop Me!"
                    });
                }
            }
            //draggables
            builderUI.makeDraggable();
        },
        
        /*
            event handler for when the back link is clicked
        */
        backButton: function() {
            if( site.pendingChanges === true ) {
                $('#backModal').modal('show');
                return false;
            }
        },
        
        /*
            button for confirming leaving the page
        */
        backButtonConfirm: function() {
            site.pendingChanges = false;//prevent the JS alert after confirming user wants to leave
        },
        
        /*
            activates block mode
        */
        activateBlockMode: function() {
            site.activePage.toggleFrameCovers('On');
            //trigger custom event
            $('body').trigger('modeBlocks');
        },
       
        /*
            makes the blocks and templates in the sidebar draggable onto the canvas
        */
        makeDraggable: function() {
            $('#elements li, #templates li').each(function(){
                $(this).draggable({
                    helper: function() {
                        return $('<div style="height: 100px; width: 300px; background: #F9FAFA; box-shadow: 5px 5px 1px rgba(0,0,0,0.1); text-align: center; line-height: 100px; font-size: 28px; color: #16A085"><span class="fui-list"></span></div>');
                    },
                    revert: 'invalid',
                    appendTo: 'body',
                    connectToSortable: '#pageList > ul',
                    start: function(){
                        //switch to block mode
                        $('input:radio[name=mode]').parent().addClass('disabled');
                        $('input:radio[name=mode]#modeBlock').radiocheck('check');
                    }
                }); 
            });
            
            $('#elements li a').each(function(){
                $(this).unbind('click').bind('click', function(e){
                    e.preventDefault();
                });
            });
        },

        /*
            Implements the site on the canvas, called from the Site object when the siteData has completed loading
        */
        populateCanvas: function() {
            
            var i;
            //if we have any blocks at all, activate the modes
            if( Object.keys(site.pages).length > 0 ) {
                var modes = builderUI.siteBuilderModes.querySelectorAll('input[type="radio"]');
                for( i = 0; i < modes.length; i++ ) {
                    modes[i].removeAttribute('disabled'); 
                }
            }
            var counter = 1;
            //loop through the pages
            for( i in site.pages ) {
                var newPage = new Page(i, site.pages[i], counter);
                counter++;
            }
            //activate the first page
            if(site.sitePages.length > 0) {
                site.sitePages[0].selectPage();
            }
            site.isEmpty();
        }
    };

    /// LEADGEN BUILDER CUSTOM CODE ///

    $(document).ready(function () {
        $('.scrollbar-inner').niceScroll({
            cursorcolor: "#546779",
            cursoropacitymin: 0,
            cursoropacitymax: 0.7,
            cursorborder: "none",
            scrollspeed: 70,
            cursorborderradius: "4px",
            cursorwidth: "4px",
            mousescrollstep: 70,
            autohidemode: "leave",
            railpadding: { top: 10, right: 2, left: 0, bottom: 10 }
        });
    });

    /// SEO Save And Edit ///
    
    $(document).on('click', '#seoButton', function (event) {
        $('#tz_seo_page_Title').val("");
        $('#tz_seo_metaDescription').val("");
        $('#tz_seo_metaKeywords').val("");
        $('#tz_seo_header').val("");
        $('#tz_seo_title').text($('#pageTitle').text()+".html");
        var page = $('#pageTitle').text();
        var seo_value = $.jStorage.get('tz_seo_'+page);
        if(seo_value)
        {
           $('#tz_seo_page_Title').val(seo_value[0]);
           $('#tz_seo_metaDescription').val(seo_value[1]);
           $('#tz_seo_metaKeywords').val(seo_value[2]);
           $('#tz_seo_header').val(seo_value[3]); 
        }
    }); 

    
    $(document).on('click', '#seoSubmittButton', function (event) {
        var tz_seo = [$('#tz_seo_page_Title').val(), 
                      $('#tz_seo_metaDescription').val(), 
                      $('#tz_seo_metaKeywords').val(), 
                      $('#tz_seo_header').val(), 
                    ];
        var page = $('#pageTitle').text();
        var set_storage = $.jStorage.set('tz_seo_'+page,tz_seo,'');
        localStorage['tz_seo_'+page] = JSON.stringify(tz_seo);
    });

    /// End SEO Save And Edit ///

    /// Export Api Value ///

    $(document).on('click', '#exportPage', function (event) {
        $('#tz_email').val("");
        $('#tz_email_from').val("");
        $('#tz_subject').val("");
        $('#mailchimp_api_key').val("");
        $('#mailchimp_api_listid').val("");
        $('#cm_api_key').val("");
        $('#cm_list_id').val("");
        $('#getresponse_api_key').val("");
        $('#getresponse_campaign_token').val("");
        $('#aweber_list_name').val("");
        $('#ac_api_url').val("");
        $('#ac_api_key').val("");
        $('#ac_api_listid').val("");
        $('#ml_api_key').val("");
        $('#ml_groupid').val("");
        $('#g-recaptcha').val("");
        var tz_api_values = $.jStorage.get('tz_api_values');
        var tz_export_values = $.jStorage.get('tz_export');
        var tz_favicon_src = $.jStorage.get('tz_favicon_src');

        if(tz_favicon_src)
        {
            $("#imgArea>img").prop('src',tz_favicon_src); 
        }
        if(tz_export_values)
        {
           $('#export_type').val(tz_export_values);
           $('.export-content').find('.export_change_type').removeClass('active');
           $('.export-content').find('.export_change_type').css('display','none');
           $('.export-content').find('#'+tz_export_values).addClass('active');
           $('.export-content').find('#'+tz_export_values).css('display','block');
        }else{
           var tz_export_values = 'tz_aweber';
           $('#export_type').val(tz_export_values);
           $('.export-content').find('.export_change_type').removeClass('active');
           $('.export-content').find('.export_change_type').css('display','none');
           $('.export-content').find('#'+tz_export_values).addClass('active');
           $('.export-content').find('#'+tz_export_values).css('display','block');
        }
        if(tz_api_values)
        {
            $('#tz_email').val(tz_api_values[0]);
            $('#tz_email_from').val(tz_api_values[1]);
            $('#tz_subject').val(tz_api_values[2]);
            $('#mailchimp_api_key').val(tz_api_values[3]);
            $('#mailchimp_api_listid').val(tz_api_values[4]);
            $('#cm_api_key').val(tz_api_values[5]);
            $('#cm_list_id').val(tz_api_values[6]);
            $('#getresponse_api_key').val(tz_api_values[7]);
            $('#getresponse_campaign_token').val(tz_api_values[8]);
            $('#aweber_list_name').val(tz_api_values[9]);
            $('#ac_api_url').val(tz_api_values[10]);
            $('#ac_api_key').val(tz_api_values[11]);
            $('#ac_api_listid').val(tz_api_values[12]);
            $('#ml_api_key').val(tz_api_values[13]);
            $('#ml_groupid').val(tz_api_values[14]);
            $('#g-recaptcha').val(tz_api_values[15]);
        }
    }); 

    $(document).on('click', '#exportSave', function (event) {
        var export_type = $('#export_type').val();
        var tz_api_keys = [$('#tz_email').val(),
                           $('#tz_email_from').val(), 
                           $('#tz_subject').val(), 
                           $('#mailchimp_api_key').val(), 
                           $('#mailchimp_api_listid').val(),
                           $('#cm_api_key').val(), 
                           $('#cm_list_id').val(),
                           $('#getresponse_api_key').val(),
                           $('#getresponse_campaign_token').val(),
                           $('#aweber_list_name').val(),
                           $('#ac_api_url').val(),
                           $('#ac_api_key').val(),
                           $('#ac_api_listid').val(),
                           $('#ml_api_key').val(),
                           $('#ml_groupid').val(),
                           $('#g-recaptcha').val()  
                        ];
        var tz_favicon = $('#upload-favicon').attr('src');
        var api_set_storage = $.jStorage.set('tz_api_values',tz_api_keys,'');
        var set_export_type = $.jStorage.set('tz_export',export_type,'');
        var tz_set_favicon = $.jStorage.set('tz_favicon_src',tz_favicon,'');
        localStorage['tz_api_values'] = JSON.stringify(tz_api_keys);
        localStorage['tz_export_values'] = JSON.stringify(export_type);
        localStorage['tz_favicon_src'] = JSON.stringify(tz_favicon);
    });

    /// End Export Api Value ///

    $('#export_type').change(function () 
    {
        var active_export = $(this).val();
        $('.export-content').find('.export_change_type').removeClass('active');
        $('.export-content').find('.export_change_type').css('display','none');
        $('.export-content').find('#'+active_export).addClass('active');
        $('.export-content').find('#'+active_export).css('display','block');
    });


    /// Save And Import Functional ///

    $(document).on('click', '#savefile', function (event) {
        var pages = {}, theSite;
        if( site.sitePages[0].blocks.length !== 0 ) {
            for( var x = 0; x < site.sitePages.length; x++ ) {
                if( site.sitePages[x].blocks.length !== 0 ) {
                    pages[site.sitePages[x].name] = site.sitePages[x].prepForSave();
                } else {
                    pages[site.sitePages[x].name] = 'empty';
                }
            }
            theSite = {
                pages: pages
            };

        } else {
            theSite = {
                delete: true
            };
        }
        $("#tz-save").val(JSON.stringify(theSite));
    });

    $(document).on('change', '#image_upload_file', function () 
    {
        var progressBar = $('.progressBar'), bar = $('.progressBar .bar'), percent = $('.progressBar .percent');
        var file = $('#image_upload_file')[0].files[0];
        var formData = new FormData();
        formData.append('formData', file);
            $.ajax({
                url : '_favicon.php', 
                data: formData,
                dataType: 'json',
                contentType: false,       
                cache: false,
                processData:false, 
                type: "POST",
                beforeSend: function() {
                   progressBar.fadeIn();
                   var percentVal = '0%';
                   bar.width(percentVal)
                   percent.html(percentVal);
                },
                onprogress: function(event, position, total, percentComplete) {
                    var percentVal = percentComplete + '%';
                    bar.width(percentVal)
                    percent.html(percentVal);
                },
                success: function(data) {
                    if(data.status){
                        var percentVal = '100%';
                        bar.width(percentVal);
                        percent.html(percentVal);
                        $("#imgArea>img").prop('src','./elements/'+data.favicon_icon);
                        $("#tz_favicon_icon").val('./elements/'+data.favicon_icon); 
                    }else{
                        alert(data.error);
                    }
                    
                },
                error: function(data) { // if error occured
                    alert(data.error);
                },
                complete: function() {
                    progressBar.fadeOut();
                },       
                
            });
    });

    $(document).on('click', '.browse', function(){
          var file = $(this).parent().parent().parent().find('.file-upload');
          file.trigger('click');
    });
    $('#file').change(function() {
        var file_val = $(this).val();
        $('#file-name').val(file_val);
    });

    $(document).on('click', '#expPage', function (event) {
        $('#file-name').val('');
        $('#file').val('');
    }); 

    $('#import-site').on('click',function(event)
    {
        event.preventDefault();
        event.stopPropagation();
        var file_val = $('#file').val();
        $('#file-name').val(file_val);
        var file_ext = file_val.substr(file_val.lastIndexOf('.') + 1);
        if(file_ext != 'json') 
        {
            alert('You can only Import JSON file which is saved from builder.');   
        }else{

            var form = $('form#import-form');
            var formdata = false;
            if (window.FormData){
                formdata = new FormData(form[0]);
            }

            var formAction = form.attr('action');
            $.ajax({
                    url : formAction,
                    data : formdata ? formdata : form.serialize(),
                    cache : false,
                    contentType : false,
                    processData : false,
                    type : 'POST',
            }).done(function(response)
            {   
                site.setPendingChanges(false);
                $('body').removeClass('modal-open').attr('style','');
                $.jStorage.set('site-flag',1,'');
                location.reload();
            });
        } 
    });

    /// End Save And Import Functional ///

    /// LEADGEN BUILDER CUSTOM CODE END ///
    
    /*
        Page constructor
    */
    function Page (pageName, page, counter) {
    
        this.name = pageName || "";
        this.pageID = page.pages_id || 0;
        this.blocks = [];
        this.parentUL = {}; //parent UL on the canvas
        this.status = '';//'', 'new' or 'changed'
        this.scripts = [];//tracks script URLs used on this page
        
        this.pageSettings = {
            title: page.pages_title || '',
            meta_description: page.meta_description || '',
            meta_keywords: page.meta_keywords || '',
            header_includes: page.header_includes || '',
            page_css: page.page_css || ''
        };
        this.pageMenuTemplate = '<a href="" class="menuItemLink">page</a><span class="pageButtons"><a href="" class="fileEdit fui-new"></a><a href="" class="fileDel fui-cross"><a class="btn btn-xs btn-primary btn-embossed fileSave fui-check" href="#"></a></span></a></span>';
        this.menuItem = {};//reference to the pages menu item for this page instance
        this.linksDropdownItem = {};//reference to the links dropdown item for this page instance
        this.parentUL = document.createElement('UL');
        this.parentUL.setAttribute('id', "page"+counter);               
        /*
            makes the clicked page active
        */
        this.selectPage = function() {
          
            //mark the menu item as active
            site.deActivateAll();
            $(this.menuItem).addClass('active');
            //let Site know which page is currently active
            site.setActive(this);
            //display the name of the active page on the canvas
            site.pageTitle.innerHTML = this.name;
            //load the page settings into the page settings modal
            /*site.inputPageSettingsTitle.value = this.pageSettings.title;
            site.inputPageSettingsMetaDescription.value = this.pageSettings.meta_description;
            site.inputPageSettingsMetaKeywords.value = this.pageSettings.meta_keywords;
            site.inputPageSettingsIncludes.value = this.pageSettings.header_includes;
            site.inputPageSettingsPageCss.value = this.pageSettings.page_css;*/ 
                          
            //trigger custom event
            $('body').trigger('changePage');
            //reset the heights for the blocks on the current page
            for( var i in this.blocks ) {
                if( Object.keys(this.blocks[i].frameDocument).length > 0 ){
                    this.blocks[i].heightAdjustment();
                }
            }
            //show the empty message?
            this.isEmpty();
        };
        
        /*
            changed the location/order of a block within a page
        */
        this.setPosition = function(frameID, newPos) {
            //we'll need the block object connected to iframe with frameID
            for(var i in this.blocks) {
                if( this.blocks[i].frame.getAttribute('id') === frameID ) {            
                    //change the position of this block in the blocks array
                    this.blocks.splice(newPos, 0, this.blocks.splice(i, 1)[0]);
                }
            }
        };
        
        /*
            delete block from blocks array
        */
        this.deleteBlock = function(block) {
            //remove from blocks array
            for( var i in this.blocks ) {
                if( this.blocks[i] === block ) {
                    //found it, remove from blocks array
                    this.blocks.splice(i, 1);
                }
            }
            site.setPendingChanges(true);
        };
        
        /*
            toggles all block frameCovers on this page
        */
        this.toggleFrameCovers = function(onOrOff) {
            for( var i in this.blocks ) {
                this.blocks[i].toggleCover(onOrOff);
            }
        };
        
        /*
            setup for editing a page name
        */
        this.editPageName = function() {
            if( !this.menuItem.classList.contains('edit') ) {
                //hide the link
                // comment by LEADGEN BUILDER //
                    ///this.menuItem.querySelector('a.menuItemLink').style.display = 'none';
              
                // Add below code by LEADGEN BUILDER //
                    this.menuItem.querySelector('a.menuItemLink').setAttribute('style','display:none');
                //insert the input field
                var newInput = document.createElement('input');
                newInput.type = 'text';
                newInput.setAttribute('name', 'page');
                newInput.setAttribute('value', this.name);
                this.menuItem.insertBefore(newInput, this.menuItem.firstChild);
                newInput.focus();
                var tmpStr = newInput.getAttribute('value');
                newInput.setAttribute('value', '');
                newInput.setAttribute('value', tmpStr);
                this.menuItem.classList.add('edit');
            }
        };
        
        /*
            Updates this page's name (event handler for the save button)
        */
        this.updatePageNameEvent = function(el) {
            if( this.menuItem.classList.contains('edit') ) {
                //el is the clicked button, we'll need access to the input
                var theInput = this.menuItem.querySelector('input[name="page"]');
                //make sure the page's name is OK
                if( site.checkPageName(theInput.value) ) {
                    this.name = site.prepPageName( theInput.value );
                    // comment by LEADGEN BUILDER //
                        ///this.menuItem.querySelector('input[name="page"]').remove();
                    // End comment LEADGEN BUILDER //

                    // Add below code by LEADGEN BUILDER //
                        theInput.parentNode.removeChild(theInput);
                    // End code by LEADGEN BUILDER //

                    this.menuItem.querySelector('a.menuItemLink').innerHTML = this.name;
                    // comment by LEADGEN BUILDER //
                        //this.menuItem.querySelector('a.menuItemLink').style.display = 'block';
                    // End comment LEADGEN BUILDER //

                    // Add below code by LEADGEN BUILDER //
                        this.menuItem.querySelector('a.menuItemLink').setAttribute('style','display:block');
                    // End code by LEADGEN BUILDER //
                    this.menuItem.classList.remove('edit');
                    //update the links dropdown item
                    this.linksDropdownItem.text = this.name;
                    this.linksDropdownItem.setAttribute('value', this.name+".html");
                    //update the page name on the canvas
                    site.pageTitle.innerHTML = this.name;
                    //changed page title, we've got pending changes
                    site.setPendingChanges(true);
                                        
                } else {
                    alert(site.pageNameError);
                }
            }
        };
        
        /*
            deletes this entire page
        */
        this.delete = function() {
                        
            //delete from the Site
            for( var i in site.sitePages ) {
                if( site.sitePages[i] === this ) {//got a match!
                    //delete from site.sitePages
                    site.sitePages.splice(i, 1);
                    //delete from canvas
                    this.parentUL.remove();
                    //add to deleted pages
                    site.pagesToDelete.push(this.name);
                    //delete the page's menu item
                    this.menuItem.remove();    
                    //delet the pages link dropdown item
                    this.linksDropdownItem.remove();
                    //activate the first page
                    site.sitePages[0].selectPage();
                    //page was deleted, so we've got pending changes
                    site.setPendingChanges(true);
                }
            }
        };
        
        /*
            checks if the page is empty, if so show the 'empty' message
        */
        this.isEmpty = function() {
            if( this.blocks.length === 0 ) {
                // comment by LEADGEN BUILDER //
                    //site.messageStart.style.display = 'block';
                // End comment by LEADGEN BUILDER //
                
                // Add below code by LEADGEN BUILDER //
                    site.messageStart.setAttribute('style','display:block');
                // End code by LEADGEN BUILDER //
                site.divFrameWrapper.classList.add('empty');
            }else{
                // comment by LEADGEN BUILDER //
                    //site.messageStart.style.display = 'none';
                // End comment by LEADGEN BUILDER //

                // Add below code by LEADGEN BUILDER //
                    site.messageStart.setAttribute('style','display:none');
                // End code by LEADGEN BUILDER //
                site.divFrameWrapper.classList.remove('empty');
            }
        };
            
        /*
            preps/strips this page data for a pending ajax request
        */
        this.prepForSave = function() {
            var page = {};
            page.blocks = [];
            //process the blocks
            for( var x = 0; x < this.blocks.length; x++ ) {
                var block = {};
                if( this.blocks[x].sandbox ) {
                    ///comment by LEADGEN BUILDER ///
                        ///block.frames_content = "<html>" + $('#sandboxes #' + this.blocks[x].sandbox).contents().find('html').html() + "</html>";
                    /// End comment LEADGEN BUILDER ///
                    ///Add below code by LEADGEN BUILDER ///
                    block.frames_content = $('#sandboxes #'+this.blocks[x].sandbox).contents().find(bConfig.pageContainer).html();
                    /// End code by LEADGEN BUILDER ///
                    block.frames_sandbox = this.blocks[x].sandbox;
                    block.frames_loaderFunction = this.blocks[x].sandbox_loader;
                } else {
                    ///comment by LEADGEN BUILDER ///                                    
                        ///block.frames_content = this.blocks[x].frameDocument.documentElement.querySelector( '#page' ).outerHTML;
                    /// End comment LEADGEN BUILDER ///

                    ///Add below code by LEADGEN BUILDER ///
                    block.frames_content = this.blocks[x].frameDocument.documentElement.querySelector( '#page' ).innerHTML;
                    /// End code by LEADGEN BUILDER ///
                    block.frames_sandbox = '';
                    block.frames_loaderFunction = '';
                }
                block.frames_height = this.blocks[x].frameHeight;
                block.frames_original_url = this.blocks[x].originalUrl;
                page.blocks.push(block);
            }
            return page;
        };
            
        /*
            generates the full page, using skeleton.html
        */
        this.fullPage = function() {
            var page = this;//reference to self for later
            page.scripts = [];//make sure it's empty, we'll store script URLs in there later
            var newDocMainParent = $('iframe#skeleton').contents().find( bConfig.pageContainer );
            //empty out the skeleton first
            $('iframe#skeleton').contents().find( bConfig.pageContainer ).html('');

            //remove old script tags  Comment by LEADGEN BUILDER - because skeleton and Other Pages have Same Script ///
            /*$('iframe#skeleton').contents().find( 'script' ).each(function(){
                $(this).remove();
            });*/
            var theContents;
            for( var i in this.blocks ) {
                //grab the block content
                if (this.blocks[i].sandbox !== false) {
                    theContents = $('#sandboxes #'+this.blocks[i].sandbox).contents().find( bConfig.pageContainer ).clone();
                } else {
                    theContents = $(this.blocks[i].frameDocument.body).find( bConfig.pageContainer ).clone();
                }
                //remove video frameCovers
                theContents.find('.frameCover').each(function () {
                    $(this).remove();
                });
                
                //remove video frameWrappers
                theContents.find('.videoWrapper').each(function(){                
                    var cnt = $(this).contents();
                    $(this).replaceWith(cnt);
                });
                
                //remove style leftovers from the style editor
                for( var key in bConfig.editableItems ) {
                                                                
                    theContents.find( key ).each(function(){
                        $(this).removeAttr('data-selector');
                        $(this).css('outline', '');
                        $(this).css('outline-offset', '');
                        $(this).css('cursor', '');
                        if($(this).attr('style') === '' ) {
                            $(this).removeAttr('style');
                        }
                    });
                }
                
                //remove style leftovers from the content editor
                for ( var x = 0; x < bConfig.editableContent.length; ++x) {
                    theContents.find( bConfig.editableContent[x] ).each(function(){
                        $(this).removeAttr('data-selector');
                    });
                }
                
                //append to DOM in the skeleton
                newDocMainParent.append( $(theContents.html()) );
                //do we need to inject any scripts?
                var scripts = $(this.blocks[i].frameDocument.body).find('script');
                var theIframe = document.getElementById("skeleton");
                if( scripts.size() > 0 ) {
                    scripts.each(function(){
                        var script;
                        if( $(this).text() !== '' ) {//script tags with content
                            script = theIframe.contentWindow.document.createElement("script");
                            script.type = 'text/javascript';
                            script.innerHTML = $(this).text();

                            // Commnent By LEADGEN BUILDER - We have already Scripts in HTML Pages so No Need To Add Script ///
                            //theIframe.contentWindow.document.body.appendChild(script);
                        } else if( $(this).attr('src') !== null && page.scripts.indexOf($(this).attr('src')) === -1 ) {

                            //use indexOf to make sure each script only appears on the produced page once
                            script = theIframe.contentWindow.document.createElement("script");
                            script.type = 'text/javascript';
                            script.src = $(this).attr('src');
                            // Commnent By LEADGEN BUILDER - We have already Scripts in HTML Pages so No Need To Add Script ///                 
                            //theIframe.contentWindow.document.body.appendChild(script);
                            //page.scripts.push($(this).attr('src'));
                        }
                    });
                }
            }
            
            ///console.log(this.scripts);
        };
            
        /*
            clear out this page
        */
        this.clear = function() {
            var block = this.blocks.pop();
            while( block !== undefined ) {
                block.delete();
                block = this.blocks.pop();
            }
        };
         
        //loop through the frames/blocks
        
        if( page.hasOwnProperty('blocks') ) {
            for( var x = 0; x < page.blocks.length; x++ ) {
                //create new Block
                var newBlock = new Block();    
                page.blocks[x].src = page.blocks[x].frames_original_url;

                ///comment by LEADGEN BUILDER ///
                    // if( page.blocks[x].frames_sandbox === '1') {
                    //     newBlock.sandbox = true;
                    //     newBlock.sandbox_loader = page.blocks[x].frames_loaderfunction;
                    // }
                /// End comment LEADGEN BUILDER ///

                ///Add below code by LEADGEN BUILDER ///
                
                //sandboxed block?
                if(page.blocks[x].frames_sandbox != '') 
                {
                    newBlock.sandbox = page.blocks[x].frames_sandbox;
                    newBlock.sandbox_loader = page.blocks[x].frames_loaderFunction;
                }
                /// End code by LEADGEN BUILDER ///
                newBlock.frameID = page.blocks[x].frames_id;
                newBlock.createParentLI(page.blocks[x].frames_height);
                newBlock.createFrame(page.blocks[x]);
                newBlock.createFrameCover();
                newBlock.insertBlockIntoDom(this.parentUL);
                newBlock.contentAfterLoad = page.blocks[x].frames_content;
                //add the block to the new page
                this.blocks.push(newBlock);
            }
        }
        
        //add this page to the site object
        site.sitePages.push( this );
        //plant the new UL in the DOM (on the canvas)
        site.divCanvas.appendChild(this.parentUL);
        //make the blocks/frames in each page sortable
        var thePage = this;
        
        $(this.parentUL).sortable({
           
            revert: true,
            placeholder: "drop-hover",
            stop: function () {
                site.setPendingChanges(true);
            },
            beforeStop: function(event, ui){
                //template or regular block?
                var attr = ui.item.attr('data-frames');
                var newBlock;
                if (typeof attr !== typeof undefined && attr !== false) {//template, build it
                 
                    $('#start').hide();
                    //clear out all blocks on this page    
                    thePage.clear();
                                            
                    //create the new frames
                    var frameIDs = ui.item.attr('data-frames').split('-');
                    var heights = ui.item.attr('data-heights').split('-');
                    var urls = ui.item.attr('data-originalurls').split('-');
                       
                    for( var x = 0; x < frameIDs.length; x++) {
                          
                        newBlock = new Block();
                        newBlock.createParentLI(heights[x]);
                        var frameData = {};
                        frameData.src = 'sites/getframe/'+frameIDs[x];
                        frameData.frames_original_url = 'sites/getframe/'+frameIDs[x];
                        frameData.frames_height = heights[x];
                        newBlock.createFrame( frameData );
                        newBlock.createFrameCover();
                        newBlock.insertBlockIntoDom(thePage.parentUL);
                        //add the block to the new page
                        thePage.blocks.push(newBlock);
                        //dropped element, so we've got pending changes
                        site.setPendingChanges(true);
                    }
                    //set the tempateID
                    builderUI.templateID = ui.item.attr('data-pageid');
                    //make sure nothing gets dropped in the lsit
                    ui.item.html(null);
                    //delete drag place holder
                    $('body .ui-sortable-helper').remove();
                    
                } else {//regular block
                
                    //are we dealing with a new block being dropped onto the canvas, or a reordering og blocks already on the canvas?
                    if( ui.item.find('.frameCover > button').size() > 0 ) {//re-ordering of blocks on canvas
                        //no need to create a new block object, we simply need to make sure the position of the existing block in the Site object
                        //is changed to reflect the new position of the block on th canvas
                        var frameID = ui.item.find('iframe').attr('id');
                        var newPos = ui.item.index();
                        site.activePage.setPosition(frameID, newPos);
                    } else {//new block on canvas
                        //new block                    
                        newBlock = new Block();
                        newBlock.placeOnCanvas(ui);
                    }
                }
            },
            start: function(event, ui){
                if( ui.item.find('.frameCover').size() !== 0 ) {
                    builderUI.frameContents = ui.item.find('iframe').contents().find( bConfig.pageContainer ).html();
                }
            },
            over: function(){
                $('#start').hide();
            }
        });
        
        //add to the pages menu
        this.menuItem = document.createElement('LI');
        this.menuItem.innerHTML = this.pageMenuTemplate;
        $(this.menuItem).find('a:first').text(pageName).attr('href', '#page'+counter);
        var theLink = $(this.menuItem).find('a:first').get(0);
        //bind some events
        this.menuItem.addEventListener('click', this, false);
        this.menuItem.querySelector('a.fileEdit').addEventListener('click', this, false);
        this.menuItem.querySelector('a.fileSave').addEventListener('click', this, false);
        this.menuItem.querySelector('a.fileDel').addEventListener('click', this, false);
        //no del button for the index page
            ///comment by LEADGEN BUILDER ///
                //if( counter === 1 ) this.menuItem.querySelector('a.fileDel').remove();
            /// End comment LEADGEN BUILDER ///

            ///Add below code by LEADGEN BUILDER ///
                var fileDel = this.menuItem.querySelector('a.fileDel');
                if( counter === 1 ) fileDel.parentNode.removeChild(fileDel);
            /// End code by LEADGEN BUILDER ///
        
        //add to the page link dropdown
        this.linksDropdownItem = document.createElement('OPTION');
        this.linksDropdownItem.setAttribute('value', pageName+".html");
        this.linksDropdownItem.text = pageName;
        builderUI.dropdownPageLinks.appendChild( this.linksDropdownItem );
        site.pagesMenu.appendChild(this.menuItem);
    }
    
    Page.prototype.handleEvent = function(event) {
        switch (event.type) {
            case "click": 
                                
                if( event.target.classList.contains('fileEdit') ) {
                    this.editPageName();
                } else if( event.target.classList.contains('fileSave') ) {
                    this.updatePageNameEvent(event.target);
                } else if( event.target.classList.contains('fileDel') ) {
                    var thePage = this;
                    $(builderUI.modalDeletePage).modal('show');
                    $(builderUI.modalDeletePage).off('click', '#deletePageConfirm').on('click', '#deletePageConfirm', function() {
                        thePage.delete();
                        $(builderUI.modalDeletePage).modal('hide');
                    });
                } else {
                    this.selectPage();
                }
        }
    };
    /*
        Block constructor
    */
    function Block () {
        
        this.frameID = 0;
        this.sandbox = false;
        this.sandbox_loader = '';
        this.status = '';//'', 'changed' or 'new'
        this.originalUrl = '';
        this.parentLI = {};
        this.frameCover = {};
        this.frame = {};
        this.frameDocument = {};
        this.frameHeight = 0;
        this.annot = {};
        this.annotTimeout = {};
        this.contentAfterLoad = '';
        
        /*
            creates the parent container (LI)
        */
        this.createParentLI = function(height) {
            this.parentLI = document.createElement('LI');
            this.parentLI.setAttribute('class', 'element');
            ///this.parentLI.setAttribute('style', 'height: '+height+'px');
        };
        
        /*
            creates the iframe on the canvas
        */
        this.createFrame = function(frame) {
            this.frame = document.createElement('IFRAME');
            this.frame.setAttribute('frameborder', 0);
            this.frame.setAttribute('scrolling', 0);
            this.frame.setAttribute('src', frame.src);
            this.frame.setAttribute('data-originalurl', frame.frames_original_url);
            this.originalUrl = frame.frames_original_url;
            //this.frame.setAttribute('data-height', frame.frames_height);
            //this.frameHeight = frame.frames_height;
            this.frame.setAttribute('style', 'background: '+"#ffffff url('images/loading.gif') 50% 50% no-repeat");
            $(this.frame).uniqueId();
            
            //sandbox?
            if( this.sandbox !== false ) {
                this.frame.setAttribute('data-loaderfunction', this.sandbox_loader);
                this.frame.setAttribute('data-sandbox', this.sandbox);
                //recreate the sandboxed iframe elsewhere
                var sandboxedFrame = $('<iframe src="'+frame.src+'" id="'+this.sandbox+'" sandbox="allow-same-origin"></iframe>');
                $('#sandboxes').append( sandboxedFrame );
            }
        };
            
        /*
            insert the iframe into the DOM on the canvas
        */
        this.insertBlockIntoDom = function(theUL) {
            this.parentLI.appendChild(this.frame);
            theUL.appendChild( this.parentLI );
            this.frame.addEventListener('load', this, false);
        };
            
        /*
            sets the frame document for the block's iframe
        */
        this.setFrameDocument = function() {
            //set the frame document as well
            if( this.frame.contentDocument ) {
                this.frameDocument = this.frame.contentDocument;   
            } else {
                this.frameDocument = this.frame.contentWindow.document;
            }

            /// LEADGEN BUILDER Added Below Code ///
                $("iframe").contents().find("html").addClass('html-overflow');
            /// End LEADGEN BUILDER Code ///
            ///this.heightAdjustment();
        };
        
        /*
            creates the frame cover and block action button
        */
        this.createFrameCover = function() {
            
            //build the frame cover and block action buttons
            this.frameCover = document.createElement('DIV');
            this.frameCover.classList.add('frameCover');
            this.frameCover.classList.add('fresh');
            this.frameCover.style.height = this.frameHeight+"px";
            var delButton = document.createElement('BUTTON');
            delButton.setAttribute('class', 'btn btn-danger deleteBlock');
            delButton.setAttribute('type', 'button');
            delButton.innerHTML = '<span class="fui-trash"></span> remove';
            delButton.addEventListener('click', this, false);
            var resetButton = document.createElement('BUTTON');
            resetButton.setAttribute('class', 'btn btn-warning resetBlock');
            resetButton.setAttribute('type', 'button');
            resetButton.innerHTML = '<i class="fa fa-refresh"></i> reset';
            resetButton.addEventListener('click', this, false);
            var htmlButton = document.createElement('BUTTON');
            htmlButton.setAttribute('class', 'btn btn-inverse htmlBlock');
            htmlButton.setAttribute('type', 'button');
            htmlButton.innerHTML = '<i class="fa fa-code htmlBlock"></i> source';
            htmlButton.addEventListener('click', this, false);
            this.frameCover.appendChild(delButton);
            this.frameCover.appendChild(resetButton);
            this.frameCover.appendChild(htmlButton);
            this.parentLI.appendChild(this.frameCover);
        };
            
        /*
            automatically corrects the height of the block's iframe depending on its content
        */
        this.heightAdjustment = function() {
            var pageContainer = this.frameDocument.body;
            var _this = this;
            setTimeout(function(){ 
                var height = pageContainer.offsetHeight;
                _this.frame.style.height = height+"px";
                _this.parentLI.style.height = height+"px";
                _this.frameCover.style.height = height+"px";
                _this.frameHeight = height;
            }, 500);
        };
            
        /*
            deletes a block
        */
        this.delete = function() {
            //remove from DOM/canvas with a nice animation
            $(this.frame.parentNode).fadeOut(500, function(){
                this.remove();
                site.activePage.isEmpty();
            });
        
            //remove from blocks array in the active page
            site.activePage.deleteBlock(this);
            //sanbox
            if( this.sanbdox ) {
                document.getElementById( this.sandbox ).remove();   
            }
            //element was deleted, so we've got pending change
            site.setPendingChanges(true);
        };
            
        /*
            resets a block to it's orignal state
        */
        this.reset = function() {    
            //reset frame by reloading it
            this.frame.contentWindow.location.reload();
            //sandbox?
            if( this.sandbox ) {
                var sandboxFrame = document.getElementById(this.sandbox).contentWindow.location.reload();  
            }
            //element was deleted, so we've got pending changes
            site.setPendingChanges(true);
        };
            
        /*
            launches the source code editor
        */
        this.source = function() {
            //hide the iframe
            // comment by LEADGEN BUILDER //
                //this.frame.style.display = 'none';
            // End comment by LEADGEN BUILDER //

            // Add below code by LEADGEN BUILDER //
                this.frame.setAttribute('style','display:none');
            // End code by LEADGEN BUILDER //
            
            //disable sortable on the parentLI
            $(this.parentLI.parentNode).sortable('disable');
            //built editor element
            var theEditor = document.createElement('DIV');
            theEditor.classList.add('aceEditor');
            $(theEditor).uniqueId();
            var li_height = this.parentLI.style.height;
            var li_res = li_height.split("px");
            if(li_res[0] < 350){
                this.parentLI.setAttribute('style','height:350px');
            }
            
            this.parentLI.appendChild(theEditor);
            //build and append error drawer
            var newLI = document.createElement('LI');
            var errorDrawer = document.createElement('DIV');
            errorDrawer.classList.add('errorDrawer');
            errorDrawer.setAttribute('id', 'div_errorDrawer');
            errorDrawer.innerHTML = '<button type="button" class="btn btn-xs btn-embossed btn-default button_clearErrorDrawer" id="button_clearErrorDrawer">CLEAR</button>';
            newLI.appendChild(errorDrawer);
            errorDrawer.querySelector('button').addEventListener('click', this, false);
            this.parentLI.parentNode.insertBefore(newLI, this.parentLI.nextSibling);
            var theId = theEditor.getAttribute('id');
            var editor = ace.edit( theId );
            var pageContainer = this.frameDocument.querySelector( bConfig.pageContainer );

            // Add below code by LEADGEN BUILDER //
            var iframe_attr = this.frame.getAttribute('data-sandbox');
            var iframe_attr_loader = this.frame.getAttribute('data-loaderfunction');
            if(typeof iframe_attr !== typeof null && this.frame.getAttribute('data-loaderfunction') === 'startSlideshow')
            {
                var theHTML = $('#sandboxes #'+iframe_attr).contents().find(bConfig.pageContainer).html();

            }else{
                var theHTML = pageContainer.innerHTML;
            }
            // End code by LEADGEN BUILDER ///
            editor.setValue( theHTML );
            editor.setTheme("ace/theme/twilight");
            editor.getSession().setMode("ace/mode/html");
            var block = this;
                
            editor.getSession().on("changeAnnotation", function(){
                block.annot = editor.getSession().getAnnotations();
                clearTimeout(block.annotTimeout);
                var timeoutCount;
                if( $('#div_errorDrawer p').size() === 0 ) {
                    timeoutCount = bConfig.sourceCodeEditSyntaxDelay;
                } else {
                    timeoutCount = 100;
                }
                block.annotTimeout = setTimeout(function(){
                    for (var key in block.annot){
                        if (block.annot.hasOwnProperty(key)) {
                            if( block.annot[key].text !== "Start tag seen without seeing a doctype first. Expected e.g. <!DOCTYPE html>." ) {
                                var newLine = $('<p></p>');
                                var newKey = $('<b>'+block.annot[key].type+': </b>');
                                var newInfo = $('<span> '+block.annot[key].text + "on line " + " <b>" + block.annot[key].row+'</b></span>');
                                newLine.append( newKey );
                                newLine.append( newInfo );
                                $('#div_errorDrawer').append( newLine );
                            }
                        }
                    }
                    if( $('#div_errorDrawer').css('display') === 'none' && $('#div_errorDrawer').find('p').size() > 0 ) {
                        $('#div_errorDrawer').slideDown();
                    }
                        
                }, timeoutCount);
            });
            editor.session.selection.clearSelection();
            //buttons
            var cancelButton = document.createElement('BUTTON');
            cancelButton.setAttribute('type', 'button');
            cancelButton.classList.add('btn');
            cancelButton.classList.add('btn-danger');
            cancelButton.classList.add('editCancelButton');
            cancelButton.classList.add('btn-wide');
            cancelButton.innerHTML = '<span class="fui-cross editCancelButton"></span> Cancel';
            cancelButton.addEventListener('click', this, false);
            var saveButton = document.createElement('BUTTON');
            saveButton.setAttribute('type', 'button');
            saveButton.classList.add('btn');
            saveButton.classList.add('btn-primary');
            saveButton.classList.add('editSaveButton');
            saveButton.classList.add('btn-wide');
            saveButton.innerHTML = '<span class="fui-check editSaveButton"></span> Save';
            saveButton.addEventListener('click', this, false);
            
            var buttonWrapper = document.createElement('DIV');
            buttonWrapper.classList.add('editorButtons');
            buttonWrapper.appendChild( cancelButton );
            buttonWrapper.appendChild( saveButton );
            this.parentLI.appendChild( buttonWrapper );
            builderUI.aceEditors[ theId ] = editor;
        };
            
        /*
            cancels the block source code editor
        */
        this.cancelSourceBlock = function() {
            //enable draggable on the LI
            $(this.parentLI.parentNode).sortable('enable');
            //delete the errorDrawer
            $(this.parentLI.nextSibling).remove();
            //delete the editor
            this.parentLI.querySelector('.aceEditor').remove();
            $(this.frame).fadeIn(500);
            $(this.parentLI.querySelector('.editorButtons')).fadeOut(500, function(){
                $(this).remove();
            });
            // Add below code by LEADGEN BUILDER //
            //adjust height of the frame
            this.heightAdjustment();
            if(this.frameDocument.querySelector('section'))
            {
                var section_id = this.frameDocument.querySelector('section').getAttribute('id');
                if(section_id != undefined)
                {
                    var res_counter = section_id.substring(0,7);
                    var iframeId = this.frame.id;
                    if(res_counter == 'counter')
                    {
                        document.getElementById(iframeId).contentWindow.LoadCounter();
                    }else{

                        if(typeof this.frame.getAttribute('data-sandbox') !== typeof null && this.frame.getAttribute('data-loaderfunction') === 'startSlideshow') 
                        {   
                            document.getElementById(iframeId).contentWindow.LoadOwlSlider();
                            document.getElementById(iframeId).contentWindow.LoadIsotope();
                            document.getElementById(iframeId).contentWindow.LoadLightboxGallery();
                        }
                    }
                }
            }
            // End code by LEADGEN BUILDER ///
        };
            
        /*
            updates the blocks source code
        */
        this.saveSourceBlock = function() {
           //enable draggable on the LI
            $(this.parentLI.parentNode).sortable('enable');
            var theId = this.parentLI.querySelector('.aceEditor').getAttribute('id');
            var theContent = builderUI.aceEditors[theId].getValue();
           //delete the errorDrawer
            document.getElementById('div_errorDrawer').parentNode.remove();
            //delete the editor
            this.parentLI.querySelector('.aceEditor').remove();
            //update the frame's content
            this.frameDocument.querySelector( bConfig.pageContainer ).innerHTML = theContent;
            // comment by LEADGEN BUILDER //

            ///this.frame.style.display = 'block';
            //sandboxed?
            // if( this.sandbox ) {
                
            //     var sandboxFrame = document.getElementById( this.sandbox );
            //     var sandboxFrameDocument = sandboxFrame.contentDocument || sandboxFrame.contentWindow.document;
                
            //     builderUI.tempFrame = sandboxFrame;
                
            //     sandboxFrameDocument.querySelector( bConfig.pageContainer ).innerHTML = theContent;
                                
            //     //do we need to execute a loader function?
            //     if( this.sandbox_loader !== '' ) {
            //         // var codeToExecute = "sandboxFrame.contentWindow."+this.sandbox_loader+"()";
            //         // var tmpFunc = new Function(codeToExecute);
            //         // tmpFunc();
            //     }
            // }

            //  End comment by LEADGEN BUILDER //

            // Add below code by LEADGEN BUILDER //

            this.frame.setAttribute('style','display:block');
            var sand_attr = this.frame.getAttribute('data-sandbox');
            if(typeof sand_attr !== typeof null && this.frame.getAttribute('data-loaderfunction') === 'startSlideshow') 
            {
                $('#sandboxes #'+sand_attr).contents().find(bConfig.pageContainer).html( theContent );
            } 
            // End code by LEADGEN BUILDER ///
            $(this.parentLI.querySelector('.editorButtons')).fadeOut(500, function(){
                $(this).remove();
            });
            //adjust height of the frame
            this.heightAdjustment();
            //new page added, we've got pending changes
            site.setPendingChanges(true);
            //block has changed
            this.status = 'changed';
            // Add below code by LEADGEN BUILDER // 
            if(this.frameDocument.querySelector('section'))
            {
                var section_id = this.frameDocument.querySelector('section').getAttribute('id');
                if(section_id != undefined)
                {
                    var res_counter = section_id.substring(0,7);
                    var iframeId = this.frame.id;
                    if(res_counter == 'counter')
                    {
                        document.getElementById(iframeId).contentWindow.LoadCounter();
                    }else{

                        if(typeof sand_attr !== typeof null && this.frame.getAttribute('data-loaderfunction') === 'startSlideshow') 
                        {
                            document.getElementById(iframeId).contentWindow.LoadOwlSlider();
                            document.getElementById(iframeId).contentWindow.LoadIsotope();
                            document.getElementById(iframeId).contentWindow.LoadLightboxGallery();
                        }
                    }
                }
            }
            
            // End code by LEADGEN BUILDER ///
        };
            
        /*
            clears out the error drawer
        */
        this.clearErrorDrawer = function() {
            var ps = this.parentLI.nextSibling.querySelectorAll('p');
            for( var i = 0; i < ps.length; i++ ) {
                ps[i].remove();  
            }
        };
            
        /*
            toggles the visibility of this block's frameCover
        */
        
        this.toggleCover = function(onOrOff) {
            if( onOrOff === 'On' ) {
                // comment by LEADGEN BUILDER //              
                    ///this.parentLI.querySelector('.frameCover').style.display = 'block';
                // End comment by LEADGEN BUILDER //

                // Add below code By LEADGEN BUILDER //
                    this.parentLI.querySelector('.frameCover').setAttribute('style','display:block');
                // End code By LEADGEN BUILDER //
                
            } else if( onOrOff === 'Off' ) {

                // comment by LEADGEN BUILDER //
                    ///this.parentLI.querySelector('.frameCover').style.display = 'none';
                // End comment by LEADGEN BUILDER //

                // Add below code By LEADGEN BUILDER //
                    this.parentLI.querySelector('.frameCover').setAttribute('style','display:none');
                // End code By LEADGEN BUILDER //
            }
        };
            
        /*
            returns the full source code of the block's frame
        */
        this.getSource = function() {
            var source = "<html>";
            source += this.frameDocument.head.outerHTML;
            source += this.frameDocument.body.outerHTML;
            return source;
        };

        /*
            sets the source code for this block's frame
        */
        this.setSource = function (content) {


            // Add Below Code by LEADGEN BUILDER //
            var sandbox_val = $(this.frame).attr('data-sandbox');
            if(sandbox_val != '')
            {
                $(this.frame).each(function () {
                    
                    var iframeContent = $(this).contents().find('#page').html(content);
                    var iframeId = $(this).attr('id');
                    var iframeSrc = $(this).attr('src');
                    document.getElementById(iframeId).contentWindow.LoadOwlSlider();
                    document.getElementById(iframeId).contentWindow.LoadIsotope();
                    document.getElementById(iframeId).contentWindow.LoadLightboxGallery();
                    document.getElementById(iframeId).contentWindow.animatecounters();
                    document.getElementById(iframeId).contentWindow.LoadCounter();
                    $('#sandboxes').find('iframe').each(function(){
                        $('#sandboxes #'+sandbox_val).contents().find('#page').html(content);
                        
                    });
                });

            }else{
                $(this.frame).contents().find('#page').html(content);

            }

            // End Code by LEADGEN BUILDER //   

            // comment by LEADGEN BUILDER //
            ///$(this.frame).contents().find('body').html(content);
            // End comment LEADGEN BUILDER //
        };
            
        /*
            places a dragged/dropped block from the left sidebar onto the canvas
        */
        this.placeOnCanvas = function(ui) {
            
            //frame data, we'll need this before messing with the item's content HTML
            var frameData = {}, attr;
            if( ui.item.find('iframe').size() > 0 ) {//iframe thumbnail
                frameData.src = ui.item.find('iframe').attr('src');
                frameData.frames_original_url = ui.item.find('iframe').attr('src');
                frameData.frames_height = ui.item.height();
                //sandboxed block?
                attr = ui.item.find('iframe').attr('sandbox');
                if (typeof attr !== typeof undefined && attr !== false) {
                    this.sandbox = siteBuilderUtils.getRandomArbitrary(10000, 1000000000);
                    this.sandbox_loader = ui.item.find('iframe').attr('data-loaderfunction');
                }
            } else {//image thumbnail
                frameData.src = ui.item.find('img').attr('data-srcc');
                frameData.frames_original_url = ui.item.find('img').attr('data-srcc');
                frameData.frames_height = ui.item.find('img').attr('data-height');
                //sandboxed block?
                attr = ui.item.find('img').attr('data-sandbox');
                                
                if (typeof attr !== typeof undefined && attr !== false) {
                    this.sandbox = siteBuilderUtils.getRandomArbitrary(10000, 1000000000);
                    this.sandbox_loader = ui.item.find('img').attr('data-loaderfunction');
                }
            }                
                                
            //create the new block object
            this.frameID = 0;
            this.parentLI = ui.item.get(0);
            this.parentLI.innerHTML = '';
            this.status = 'new';
            this.createFrame(frameData);
            this.parentLI.style.height = this.frameHeight+"px";
            this.createFrameCover();
            this.frame.addEventListener('load', this);
            //insert the created iframe
            ui.item.append($(this.frame));
            //add the block to the current page
            site.activePage.blocks.splice(ui.item.index(), 0, this);
            //custom event
            ui.item.find('iframe').trigger('canvasupdated');
            //dropped element, so we've got pending changes
            site.setPendingChanges(true);
        };
    }
    
    Block.prototype.handleEvent = function(event) {
        switch (event.type) {
            case "load": 
                this.setFrameDocument();
                this.heightAdjustment();
                if( this.contentAfterLoad !== '' ) this.setSource(this.contentAfterLoad);
                    $(this.frameCover).removeClass('fresh', 500);
            break;
            case "click":
                var theBlock = this;
                //figure out what to do next
                if( event.target.classList.contains('deleteBlock') ) {//delete this block
                    
                    $(builderUI.modalDeleteBlock).modal('show');                    
                    $(builderUI.modalDeleteBlock).off('click', '#deleteBlockConfirm').on('click', '#deleteBlockConfirm', function(){
                        theBlock.delete(event);
                        $(builderUI.modalDeleteBlock).modal('hide');
                    });
                    
                } else if( event.target.classList.contains('resetBlock') ) {//reset the block
                    $(builderUI.modalResetBlock).modal('show'); 
                    $(builderUI.modalResetBlock).off('click', '#resetBlockConfirm').on('click', '#resetBlockConfirm', function(){
                        theBlock.reset();
                        $(builderUI.modalResetBlock).modal('hide');
                    });
                } else if( event.target.classList.contains('htmlBlock') ) {//source code editor
                    theBlock.source();
                } else if( event.target.classList.contains('editCancelButton') ) {//cancel source code editor
                    theBlock.cancelSourceBlock();
                } else if( event.target.classList.contains('editSaveButton') ) {//save source code
                    theBlock.saveSourceBlock();
                } else if( event.target.classList.contains('button_clearErrorDrawer') ) {//clear error drawer
                    theBlock.clearErrorDrawer();
                }
        }
    };
    /*
        Site object literal
    */
    /*jshint -W003 */
    var site = {
        
        pendingChanges: false,      //pending changes or no?
        pages: {},                  //array containing all pages, including the child frames, loaded from the server on page load
        is_admin: 0,                //0 for non-admin, 1 for admin
        data: {},                   //container for ajax loaded site data
        pagesToDelete: [],          //contains pages to be deleted
        sitePages: [],              //this is the only var containing the recent canvas contents
        sitePagesReadyForServer: {},     //contains the site data ready to be sent to the server
        activePage: {},             //holds a reference to the page currently open on the canvas
        pageTitle: document.getElementById('pageTitle'),//holds the page title of the current page on the canvas
        divCanvas: document.getElementById('pageList'),//DIV containing all pages on the canvas
        pagesMenu: document.getElementById('pages'), //UL containing the pages menu in the sidebar
        buttonNewPage: document.getElementById('addPage'),
        liNewPage: document.getElementById('newPageLI'),
        inputPageSettingsTitle: document.getElementById('pageData_title'),
        inputPageSettingsMetaDescription: document.getElementById('pageData_metaDescription'),
        inputPageSettingsMetaKeywords: document.getElementById('pageData_metaKeywords'),
        inputPageSettingsIncludes: document.getElementById('pageData_headerIncludes'),
        inputPageSettingsPageCss: document.getElementById('pageData_headerCss'),
        buttonSubmitPageSettings: document.getElementById('pageSettingsSubmittButton'),
        modalPageSettings: document.getElementById('pageSettingsModal'),
        buttonSave: document.getElementById('savePage'),
        messageStart: document.getElementById('start'),
        divFrameWrapper: document.getElementById('frameWrapper'),
        skeleton: document.getElementById('skeleton'),
        buttonEmptyPage: document.getElementById('clearScreen'),
        actionButtons: document.querySelectorAll('.actionButtons'),
        autoSaveTimer: {},
        init: function() {

            // Add Below Code by LEADGEN BUILDER //
            var imp_flag = $.jStorage.get('site-flag');
            if(imp_flag == 1)
            {
                var file_json = 'builder.json?nocache='+ (new Date()).getTime();
            }else{  
                var file_json = 'site.json?nocache='+ (new Date()).getTime();
            }
            // End Code by LEADGEN BUILDER //   
            $.getJSON(file_json, function (data) {
                
                if( data.pages !== undefined ) {
                    site.pages = data.pages;
                } else {
                    site.pages = {index: {
                        blocks: [],
                        page_id: 1,
                        pages_title: '',
                        meta_description: '',
                        meta_keywords: '',
                        header_includes: '',
                        page_css: ''
                    }};
                }

                //fire custom event
                $('body').trigger('siteDataLoaded');
                builderUI.populateCanvas();
                if(imp_flag == 1)
                {
                    $.jStorage.deleteKey('site-flag');
                }
            });
            $(this.buttonNewPage).on('click', site.newPage);
            $(this.modalPageSettings).on('show.bs.modal', site.loadPageSettings);
            $(this.buttonSubmitPageSettings).on('click', site.updatePageSettings);
            $(this.buttonSave).on('click', function(){site.save(true);});
            $(this.buttonEmptyPage).on('click', site.emptyPage);
            //auto save time 
            this.autoSaveTimer = setTimeout(site.autoSave, bConfig.autoSaveTimeout);
                            
        },
        
   //      autoSave: function(){
                                    
   //          if(site.pendingChanges) {
   //              site.save(false);
   //          }
            
            // window.clearInterval(this.autoSaveTimer);
   //          this.autoSaveTimer = setTimeout(site.autoSave, bConfig.autoSaveTimeout);
        
   //      },
                
        setPendingChanges: function(value) {
            this.pendingChanges = value;
            this.isEmpty();
            if( value === true ) {
                //reset timer
                window.clearInterval(this.autoSaveTimer);
                this.autoSaveTimer = setTimeout(site.autoSave, bConfig.autoSaveTimeout);
                $('#savePage .bLabel').text("Save now (!)");

                if( site.activePage.status !== 'new' ) {
                    site.activePage.status = 'changed';
                }
            } else {
                $('#savePage .bLabel').text("Nothing to save");
                site.updatePageStatus('');
            }
        },
                   
        save: function(showConfirmModal) {
            //disable button
            $("a#savePage").addClass('disabled');
            var originalText = $('a#savePage').find('.bLabel').text();
            var altText = $('a#savePage').find('.bLabel').attr('data-alt-text');
            $('a#savePage').find('.bLabel').text(altText);
            $('a#savePage').addClass('disabled');
            var pages = {}, theSite;
            if( site.sitePages[0].blocks.length !== 0 ) {
                for( var x = 0; x < site.sitePages.length; x++ ) {
                    if( site.sitePages[x].blocks.length !== 0 ) {
                        pages[site.sitePages[x].name] = site.sitePages[x].prepForSave();
                    } else {                
                        pages[site.sitePages[x].name] = 'empty';
                    }
                }

                theSite = {
                    pages: pages
                };

            } else {
                theSite = {
                    delete: true
                };
            }

            //remove old alerts
            $('#errorModal .modal-body > *, #successModal .modal-body > *').each(function(){
                $(this).remove();
            });

            $.ajax({
                url: '_save.php',
                method: 'POST',
                data: {data: theSite},
                dataType: "json"
            }).done(function (res) {
                //enable button
                $("a#savePage").removeClass('disabled');
                if( res.responseCode === 0 ) {
                    if( showConfirmModal ) {
                        $('#errorModal .modal-body').html( res.responseHTML );
                        $('#errorModal').modal('show');
                    }
                } else if( res.responseCode === 1 ) {
                    //no more pending changes
                    site.setPendingChanges(false);
                    $('body').trigger('changePage');
                }

            });
        },
        
        /*
            preps the site data before sending it to the server
        */
        prepForSave: function(template) {
            this.sitePagesReadyForServer = {};
            if( template ) {//saving template, only the activePage is needed
                this.sitePagesReadyForServer[this.activePage.name] = this.activePage.prepForSave();
                this.activePage.fullPage();
            } else {//regular save
                //find the pages which need to be send to the server
                for( var i = 0; i < this.sitePages.length; i++ ) {
                    if( this.sitePages[i].status !== '' ) {
                        this.sitePagesReadyForServer[this.sitePages[i].name] = this.sitePages[i].prepForSave();
                    }
                }
            }
        },
        
        /*
            sets a page as the active one
        */
        setActive: function(page) {
            
            //reference to the active page
            this.activePage = page;
            //hide other pages
            for(var i in this.sitePages) {
                // comment by LEADGEN BUILDER //
                    ///this.sitePages[i].parentUL.style.display = 'none';
                // End comment LEADGEN BUILDER //

                // Add Below Code by LEADGEN BUILDER //
                    this.sitePages[i].parentUL.setAttribute('style','display:none');
                // End Code by LEADGEN BUILDER //   
            }
            //display active one
            // comment by LEADGEN BUILDER //
                ///this.activePage.parentUL.style.display = 'block';
            // End comment LEADGEN BUILDER //

            // Add Below Code by LEADGEN BUILDER //
            var UL_id = this.activePage.parentUL.id;
            $('#'+UL_id).css('display','block');
            // End Code by LEADGEN BUILDER //
        },
        /*
            de-active all page menu items
        */
        deActivateAll: function() {
            var pages = this.pagesMenu.querySelectorAll('li');
            for( var i = 0; i < pages.length; i++ ) {
                pages[i].classList.remove('active');
            }
        },
        /*
            adds a new page to the site
        */
        newPage: function() {
            
            site.deActivateAll();
            //create the new page instance
            var pageData = [];
            var temp = {
                pages_id: 0
            };
            pageData[0] = temp;
            var newPageName = 'page'+(site.sitePages.length+1);
            var newPage = new Page(newPageName, pageData, site.sitePages.length+1);
            newPage.status = 'new';
            newPage.selectPage();
            newPage.editPageName();
            newPage.isEmpty();
            site.setPendingChanges(true);
        },
        
        /*
            checks if the name of a page is allowed
        */
        checkPageName: function(pageName) {
            //make sure the name is unique
            for( var i in this.sitePages ) {
                if( this.sitePages[i].name === pageName && this.activePage !== this.sitePages[i] ) {
                    this.pageNameError = "The page name must be unique.";
                    return false;
                }   
            }
            return true;
        },
        
        /*
            removes unallowed characters from the page name
        */
        prepPageName: function(pageName) {
            pageName = pageName.replace(' ', '');
            pageName = pageName.replace(/[?*!.|&#;$%@"<>()+,]/g, "");
            return pageName;
        },
        
        /*
            save page settings for the current page
        */
        updatePageSettings: function() {
             
            site.activePage.pageSettings.title = site.inputPageSettingsTitle.value;
            site.activePage.pageSettings.meta_description = site.inputPageSettingsMetaDescription.value;
            site.activePage.pageSettings.meta_keywords = site.inputPageSettingsMetaKeywords.value;
            site.activePage.pageSettings.header_includes = site.inputPageSettingsIncludes.value;
            site.activePage.pageSettings.page_css = site.inputPageSettingsPageCss.value;
            site.setPendingChanges(true);
            $(site.modalPageSettings).modal('hide');
        },
        
        /*
            update page statuses
        */
        updatePageStatus: function(status) {
            for( var i in this.sitePages ) {
                this.sitePages[i].status = status;   
            }
        },
        /*
            Clears all the blocks on the current page
        */
        emptyPage: function () {
            site.activePage.clear();
        },
        /*
            Checks if the entire page is empty, if so, disable action buttons
        */
        isEmpty: function () {
            var x = 0;
            if(this.sitePages.length === 1 && this.activePage.blocks.length === 0) {
                for( x = 0; x < this.actionButtons.length; x++ ) {
                    this.actionButtons[x].classList.add('disabled');
                }
            } else {
                for( x = 0; x < this.actionButtons.length; x++ ) {
                    this.actionButtons[x].classList.remove('disabled');
                }
            }
        }
    };

    builderUI.init(); site.init();
    //**** EXPORTS
    module.exports.site = site;
    module.exports.builderUI = builderUI;

}());
},{"./config.js":4,"./ui.js":9,"./utils.js":10}],3:[function(require,module,exports){
(function () {
    "use strict";

    var siteBuilder = require('./builder.js');

    /*
        constructor function for Element
    */
    module.exports.Element = function (el) {
                
        this.element = el;
        this.sandbox = false;
        this.parentFrame = {};
        this.parentBlock = {};//reference to the parent block element
        //make current element active/open (being worked on)
        this.setOpen = function() {
            $(this.element).off('mouseenter mouseleave click');
            if( $(this.element).closest('body').width() !== $(this.element).width() ) {
                $(this.element).css({'outline': '2px dotted #f72727', 'cursor': 'pointer'});
            } else {
                $(this.element).css({'outline': '2px dotted #f72727', 'outline-offset':'-3px',  'cursor': 'pointer'});
            }
        };
        
        //sets up hover and click events, making the element active on the canvas
        this.activate = function() {
            var element = this;
            $(this.element).css({'outline': '', 'cursor': ''});
            $(this.element).on('mouseenter', function() {
                if( $(this).closest('body').width() !== $(this).width() ) {
                    $(this).css({'outline': '2px dotted #f72727', 'cursor': 'pointer'});
                } else {
                    $(this).css({'outline': '2px dotted #f72727', 'outline-offset': '-3px', 'cursor': 'pointer'});
                }
            
            }).on('mouseleave', function() {
                $(this).css({'outline': '', 'cursor': '', 'outline-offset': ''});
            }).on('click', function(e) {
                                                                
                e.preventDefault();
                e.stopPropagation();
                element.clickHandler(this);
            });
        };
        
        this.deactivate = function() {
            $(this.element).off('mouseenter mouseleave click');
            $(this.element).css({'outline': '', 'cursor': ''});
        };
        
        //removes the elements outline
        this.removeOutline = function() {
            $(this.element).css({'outline': '', 'cursor': ''});
        };
        
        //sets the parent iframe
        this.setParentFrame = function() {
            
            var doc = this.element.ownerDocument;
            var w = doc.defaultView || doc.parentWindow;
            var frames = w.parent.document.getElementsByTagName('iframe');
            for (var i= frames.length; i-->0;) {
                var frame= frames[i];
                try {
                    var d = frame.contentDocument || frame.contentWindow.document;
                    if (d===doc)
                        this.parentFrame = frame;
                } catch(e) {}
            }
        };
        
        //sets this element's parent block reference
        this.setParentBlock = function() {
            //loop through all the blocks on the canvas
            for( var i = 0; i < siteBuilder.site.sitePages.length; i++ ) {
                for( var x = 0; x < siteBuilder.site.sitePages[i].blocks.length; x++ ) {
                    //if the block's frame matches this element's parent frame
                    if( siteBuilder.site.sitePages[i].blocks[x].frame === this.parentFrame ) {
                        //create a reference to that block and store it in this.parentBlock
                        this.parentBlock = siteBuilder.site.sitePages[i].blocks[x];
                    }
                }
            }
        };
        this.setParentFrame();
        
        /*
            is this block sandboxed?
        */
        
        if( this.parentFrame.getAttribute('data-sandbox') ) {
            this.sandbox = this.parentFrame.getAttribute('data-sandbox');   
        }
                
    };

}());
},{"./builder.js":2}],4:[function(require,module,exports){
(function () {
    "use strict";
        
    module.exports.pageContainer = "#page";
    
    module.exports.editableItems = {
        'span.fa': ['color', 'font-size'],
        '.bg.bg1': ['background-color'],
        '.builder-bg':['background-color','padding-top','padding-bottom','padding-left','padding-right','border-color'],
        '.tz-background-color':['background-color','padding-top','padding-bottom','padding-left','padding-right'],
        '.tz-header-bg':['background-color','border-color'],
        'nav a': ['color','background-color','border-color','font-size','font-weight','font-family','text-transform'],
        ///'h1, h2, h3, h4, h5, p': ['color','background-color','font-size','font-weight','font-family'],
        'a.btn, button.btn': ['color','background-color','border-color','font-size','font-weight','font-family','text-transform','border-radius'],
        '.tz-text' : ['color','background-color','font-size','font-weight','font-family','text-transform','border-radius'],
        '.tz-border' : ['border-color'],
        '.tz-icon-color' : ['color','font-size','background-color'],
        'img': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius', 'border-color', 'border-style', 'border-width'],
        'hr.dashed': ['border-color','border-width'],
        '.divider > span': ['color','font-size'],
        'hr.shadowDown': ['margin-top','margin-bottom'],
        '.footer a': ['color'],
        '.bg.bg1, .bg.bg2, .header10, .header11': ['background-image', 'background-color'],
        '.tz-builder-bg-image': ['background-image','padding-top', 'padding-bottom'],
        '.frameCover': []
    };
    
    module.exports.editableItemOptions = {
        'nav a : font-weight': ['400', '700'],
        'a.btn : border-radius': ['0px', '4px', '10px'],
        'img : border-style': ['none', 'dotted', 'dashed', 'solid'],
        'img : border-width': ['1px', '2px', '3px', '4px'],
        'h1, h2, h3, h4, h5, p: font-family': ['default', 'Lato', 'Helvetica', 'Arial', 'Times New Roman'],
        'tz-text :font-family': ['default', 'Lato', 'Helvetica', 'Arial', 'Times New Roman'],
        'h2 : font-family': ['default', 'Lato', 'Helvetica', 'Arial', 'Times New Roman'],
        'h3 : font-family': ['default', 'Lato', 'Helvetica', 'Arial', 'Times New Roman'],
        'p : font-family': ['default', 'Lato', 'Helvetica', 'Arial', 'Times New Roman']
    };

    module.exports.editableContent = ['.editContent','.tz-text','button','.nav a','.footer a:not(.fa)', '.tableWrapper', 'h1'];

    module.exports.autoSaveTimeout = 60000;
    
    module.exports.sourceCodeEditSyntaxDelay = 10000;
                    
}());
},{}],5:[function(require,module,exports){
(function () {
    "use strict";

    var canvasElement = require('./canvasElement.js').Element;
    var bConfig = require('./config');
    var siteBuilder = require('./builder.js');

    var contenteditor = {
        
        labelContentMode: document.getElementById('modeContentLabel'),
        radioContent: document.getElementById('modeContent'),
        buttonUpdateContent: document.getElementById('updateContentInFrameSubmit'),
        activeElement: {},
        allContentItemsOnCanvas: [],
        modalEditContent: document.getElementById('editContentModal'),
    
        init: function() {
            //display content mode label
            $(this.labelContentMode).show();
            $(this.radioContent).on('click', this.activateContentMode);
            $(this.buttonUpdateContent).on('click', this.updateElementContent);
            $(this.modalEditContent).on('hidden.bs.modal', this.editContentModalCloseEvent);
            $(document).on('modeDetails modeBlocks', 'body', this.deActivateMode);
            
            //listen for the beforeSave event, removes outlines before saving
            $('body').on('beforeSave', function () {
                if( Object.keys( contenteditor.activeElement ).length > 0 ) {
                    contenteditor.activeElement.removeOutline();
                }
            });
        },
        
        /*
            Activates content mode
        */
        activateContentMode: function() {
            //Element object extention
            canvasElement.prototype.clickHandler = function(el) {
                contenteditor.contentClick(el);
            };
            //trigger custom event
            $('body').trigger('modeContent');
            //disable frameCovers
            for( var i = 0; i < siteBuilder.site.sitePages.length; i++ ) {
                siteBuilder.site.sitePages[i].toggleFrameCovers('Off');
            }
            
            //create an object for every editable element on the canvas and setup it's events
            $('#pageList ul li iframe').each(function(){
                for( var key in bConfig.editableContent ) {
                    $(this).contents().find( bConfig.pageContainer + ' '+ bConfig.editableContent[key] ).each(function(){
                        var newElement = new canvasElement(this);
                        newElement.activate();
                        //store in array
                        contenteditor.allContentItemsOnCanvas.push( newElement );
                                                                                                
                    });
                }
            });
        },
        /*
            Opens up the content editor
        */
        contentClick: function(el) {

            //if we have an active element, make it unactive
            if( Object.keys(this.activeElement).length !== 0) {
                this.activeElement.activate();
            }
            
            //set the active element
            var activeElement = new canvasElement(el);
            activeElement.setParentBlock();
            contenteditor.activeElement = activeElement;
                        
            //unbind hover and click events and make this item active
            contenteditor.activeElement.setOpen();
            $('#editContentModal').modal('show');
                        
            //for the elements below, we'll use a simplyfied editor, only direct text can be done through this one
            if( el.tagName === 'SMALL' || el.tagName === 'A'  || el.tagName === 'LI' || el.tagName === 'SPAN' || el.tagName === 'B' || el.tagName === 'I' || el.tagName === 'TT' || el.tageName === 'CODE' || el.tagName === 'EM' || el.tagName === 'STRONG' || el.tagName === 'SUB' || el.tagName === 'BUTTON' || el.tagName === 'LABEL' || el.tagName === 'P' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4' || el.tagName === 'H5' || el.tagName === 'H6' ) {
                    $('#contentToEdit').summernote({
                    toolbar: [
                    // [groupName, [list of button]]
                    ['codeview', ['codeview']],
                    ['fontstyle', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
                    ['help', ['undo', 'redo']]
                  ]
                });
                            
            } else if( el.tagName === 'DIV' && $(el).hasClass('tableWrapper') ) {
                
                $('#contentToEdit').summernote({
                    toolbar: [
                    ['codeview', ['codeview']],
                    ['fontstyle', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
                    ['help', ['undo', 'redo']]
                  ]
                });
                            
            } else {
                          
                $('#contentToEdit').summernote({
                    toolbar: [
                    ['codeview', ['codeview']],
                    ['fontstyle', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
                    ['help', ['undo', 'redo']]
                  ]
                });
            }

            $('#contentToEdit').summernote('code', $(el).html());
        },
        
        /*
            updates the content of an element
        */
        updateElementContent: function() {
            
            $(contenteditor.activeElement.element).html( $('#editContentModal #contentToEdit').summernote('code').replace(/<br\/?>/gi, "\n") ).css({'outline': '', 'cursor':''});
            /* SANDBOX */
            if( contenteditor.activeElement.sandbox ) {
                var elementID = $(contenteditor.activeElement.element).attr('id');
                $('#'+contenteditor.activeElement.sandbox).contents().find('#'+elementID).html( $('#editContentModal #contentToEdit').summernote('code').replace(/<br\/?>/gi, "\n") );
            }
            
            /* END SANDBOX */
            $('#editContentModal #contentToEdit').summernote('code', '');
            $('#editContentModal #contentToEdit').summernote('destroy');            
            $('#editContentModal').modal('hide');
            $(this).closest('body').removeClass('modal-open').attr('style', '');
            //reset iframe height
            contenteditor.activeElement.parentBlock.heightAdjustment();
            //content was updated, so we've got pending change
            siteBuilder.site.setPendingChanges(true);
            //reactivate element
            contenteditor.activeElement.activate();
            /// LEADGEN BUILDER Added Below Code ///
            var equalize_height = $(contenteditor.activeElement.element).parents('.equalize').length;
            if(equalize_height > 0)
            {
                var iframeId = $(contenteditor.activeElement.parentFrame).attr('id');
                document.getElementById(iframeId).contentWindow.LoadEqualize();
            }
            /// End LEADGEN BUILDER Code ///
        },
        
        /*
            event handler for when the edit content modal is closed
        */
        editContentModalCloseEvent: function() {
            $('#editContentModal #contentToEdit').summernote('destroy');
            //re-activate element
            contenteditor.activeElement.activate();
        },
        
        /*
            Event handler for when mode gets deactivated
        */
        deActivateMode: function() {                        
            if( Object.keys( contenteditor.activeElement ).length > 0 ) {
                contenteditor.activeElement.removeOutline();
            }
            
            //deactivate all content blocks
            for( var i = 0; i < contenteditor.allContentItemsOnCanvas.length; i++ ) {
                contenteditor.allContentItemsOnCanvas[i].deactivate();   
            }
        }
    };
    contenteditor.init();

}());
},{"./builder.js":2,"./canvasElement.js":3,"./config":4}],6:[function(require,module,exports){
(function () {
    "use strict";

    var bConfig = require('./config.js');
    var publisher = require('../vendor/publisher');
    var bexport = {
        
        modalExport: document.getElementById('exportModal'),
        buttonExport: document.getElementById('exportPage'),
        init: function() {
            $(this.modalExport).on('show.bs.modal', this.doExportModal);
            $(this.modalExport).on('shown.bs.modal', this.prepExport);
            $(this.modalExport).find('form').on('submit', this.exportFormSubmit);
            //reveal export button
            $(this.buttonExport).show();
        },
        
        doExportModal: function() {
            /// LEADGEN BUILDER Added Below Code ///
            var host_name = $(location).attr('hostname');
            if(host_name == 'www.themezaa.com')
            {
                $('#exportModal > form #buy-full-version').show('');
                $('#exportModal > form #exportSubmit').hide('');   
            }else{
                $('#exportModal > form #exportSubmit').show('');
                $('#exportModal > form #buy-full-version').hide('');
            }
            $('#exportModal > form #exportCancel').text('Cancel & Close');
            /// End LEADGEN BUILDER Code ///
        },
        
        
        /*
            prepares the export data
        */
        prepExport: function(e) {
            publisher.publish('closeStyleEditor');
            //delete older hidden fields
            $('#exportModal form input[type="hidden"].pages').remove();
            //loop through all pages
            $('#pageList > ul').each(function(){
                var theContents;
                //grab the skeleton markup
                var newDocMainParent = $('iframe#skeleton').contents().find( bConfig.pageContainer );
                //empty out the skeleto
                newDocMainParent.find('*').remove();
                //loop through page iframes and grab the body stuff
                $(this).find('iframe').each(function(){
                    var attr = $(this).attr('data-sandbox');
                    var attr_id = $(this).attr('id');
                    if (typeof attr !== typeof undefined && attr !== false) {
                        theContents = $('#sandboxes #'+attr).contents().find( bConfig.pageContainer );
                    } else {
                        theContents = $(this).contents().find( bConfig.pageContainer ).clone();
                    }
                    theContents.find('.frameCover').each(function(){
                        $(this).remove();
                    });
                    /// LEADGEN BUILDER Added Below Code ///
                    //remove height from equalize children elements
                    if(theContents.find('.equalize').children().length > 0)
                    {
                        theContents.find('.equalize').children().css('height','');
                    }
                    /// End LEADGEN BUILDER Code ///
                    //remove inline styling leftovers
                    for( var key in bConfig.editableItems ) {
                        
                        theContents.find( key ).each(function(){
                            /// LEADGEN BUILDER Added Below Code ///
                            $(this).removeAttr('data-selector');
                            $(this).css('outline', '');
                            $(this).css('outline-offset', '');
                            $(this).css('cursor', '');
                            /// End LEADGEN BUILDER Code ///
                            if( $(this).attr('style') === '' ) {
                                $(this).removeAttr('style');
                            }
                        });
                    }
                
                    for ( var i = 0; i < bConfig.editableContent.length; ++i) {
                        theContents.find( bConfig.editableContent[i] ).each(function(){
                            $(this).removeAttr('data-selector');
                        });
                    }
            
                    var toAdd = theContents.html();
                
                    //grab scripts
                    var scripts = $(this).contents().find( bConfig.pageContainer ).find('script');
                    
                    if( scripts.size() > 0 ) {
                
                        var theIframe = document.getElementById("skeleton"), script;
                        scripts.each(function(){
                            if( $(this).text() !== '' ) {//script tags with content
                                script = theIframe.contentWindow.document.createElement("script");
                                script.type = 'text/javascript';
                                script.innerHTML = $(this).text();
                                theIframe.contentWindow.document.getElementById( bConfig.pageContainer.substring(1) ).appendChild(script);
                            } else if( $(this).attr('src') !== null ) {
                                script = theIframe.contentWindow.document.createElement("script");
                                script.type = 'text/javascript';
                                script.src = $(this).attr('src');
                                theIframe.contentWindow.document.getElementById( bConfig.pageContainer.substring(1) ).appendChild(script);
                            }
                        });
                    }
                    newDocMainParent.append( $(toAdd) );
                });
                
                var newInput = $('<input type="hidden" name="pages['+$('#pages li:eq('+($(this).index()+1)+') a:first').text()+']" class="pages" value="">');

                /// LEADGEN BUILDER Added Below Code ///
                var page = $('#pageTitle').text();
                var seo_str = $.jStorage.get('tz_seo_'+ page);
                var tz_fav_icon = $('#imgArea>img').attr('src');
                $('#tz_seo_'+page+'').remove();
                $('#tz_favicon_icon').remove();
                var tz_seo_Input = document.createElement("input");
                tz_seo_Input.setAttribute('type', 'hidden');
                tz_seo_Input.setAttribute('name', 'tz_seo['+page+']');
                tz_seo_Input.setAttribute('id', 'tz_seo_'+page+'');
                if(seo_str)
                {
                    tz_seo_Input.setAttribute('value', seo_str[0]+'1_@_2_@'+seo_str[1]+'1_@_2_@'+seo_str[2]+'1_@_2_@'+seo_str[3]);
                }else{
                    tz_seo_Input.setAttribute('value','');
                }
                var tz_favicon_Input = document.createElement("input");
                tz_favicon_Input.setAttribute('type', 'hidden');
                tz_favicon_Input.setAttribute('name', 'tz_favicon_icon');
                tz_favicon_Input.setAttribute('id', 'tz_favicon_icon');
                if(tz_fav_icon)
                {
                    tz_favicon_Input.setAttribute('value', tz_fav_icon);
                }
                $('#exportModal form').prepend(tz_favicon_Input);
                $('#exportModal form').prepend(tz_seo_Input);
                /// End LEADGEN BUILDER Code ///
                $('#exportModal form').prepend(newInput);
                newInput.val($('iframe#skeleton').contents().find('body').html());
            });
        },
        /*
            event handler for the export from submit
        */
        exportFormSubmit: function() {
            $('#exportModal > form #exportSubmit').hide('');
            $('#exportModal > form #exportCancel').text('Close Window');
        }
    
    };
    bexport.init();

}());
},{"../vendor/publisher":11,"./config.js":4}],7:[function(require,module,exports){
(function () {
    "use strict";

    var bConfig = require('./config.js');
    var siteBuilder = require('./builder.js');
    var preview = {
        modalPreview: document.getElementById('previewModal'),
        buttonPreview: document.getElementById('buttonPreview'),
        init: function() {
            //events
            $(this.modalPreview).on('shown.bs.modal', this.prepPreview);
            $(this.modalPreview).on('show.bs.modal', this.prepPreviewLink);
            //reveal preview button
            $(this.buttonPreview).show();
        },
        /*
            prepares the preview data
        */
        prepPreview: function() {

            $('#previewModal form input[type="hidden"]').remove();

            //build the page
            siteBuilder.site.activePage.fullPage();
            var newInput;
            //markup
            newInput = $('<input type="hidden" name="page" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( "<html>"+$('iframe#skeleton').contents().find('html').html()+"</html>" );
            //page title
            newInput = $('<input type="hidden" name="meta_title" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.activePage.pageSettings.title );
            //alert(JSON.stringify(siteBuilder.site.activePage.pageSettings));
            //page meta description
            newInput = $('<input type="hidden" name="meta_description" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.activePage.pageSettings.meta_description );
            //page meta keywords
            newInput = $('<input type="hidden" name="meta_keywords" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.activePage.pageSettings.meta_keywords );
            //page header includes
            newInput = $('<input type="hidden" name="header_includes" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.activePage.pageSettings.header_includes );
            //page css
            newInput = $('<input type="hidden" name="page_css" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.activePage.pageSettings.page_css );
            //site ID
            newInput = $('<input type="hidden" name="siteID" value="">');
            $('#previewModal form').prepend( newInput );
            newInput.val( siteBuilder.site.data.sites_id );
        },
        /*
            prepares the actual preview link
        */
        prepPreviewLink: function() {
            $('#pagePreviewLink').attr( 'href', $('#pagePreviewLink').attr('data-defurl')+$('#pages li.active a').text() );
        }
    };
    preview.init();

}());
},{"./builder.js":2,"./config.js":4}],8:[function(require,module,exports){
(function (){
    "use strict";

    var canvasElement = require('./canvasElement.js').Element;
    var bConfig = require('./config.js');
    var siteBuilder = require('./builder.js');
    var publisher = require('../vendor/publisher');

    var styleeditor = {
        radioStyle: document.getElementById('modeStyle'),
        labelStyleMode: document.getElementById('modeStyleLabel'),
        buttonSaveChanges: document.getElementById('saveStyling'),
        activeElement: {}, //holds the element currenty being edited
        allStyleItemsOnCanvas: [],
        _oldIcon: [],
        _oldBGLG: [],
        _oldStyle: [],
        styleEditor: document.getElementById('styleEditor'),
        formStyle: document.getElementById('stylingForm'),
        buttonRemoveElement: document.getElementById('deleteElementConfirm'),
        buttonCloneElement: document.getElementById('cloneElementButton'),
        buttonResetElement: document.getElementById('resetStyleButton'),
        selectLinksInernal: document.getElementById('internalLinksDropdown'),
        selectLinksPages: document.getElementById('pageLinksDropdown'),
        videoInputYoutube: document.getElementById('youtubeID'),
        videoInputVimeo: document.getElementById('vimeoID'),
        inputCustomLink: document.getElementById('internalLinksCustom'),
        selectIcons: document.getElementById('icons'),
        buttonDetailsAppliedHide: document.getElementById('detailsAppliedMessageHide'),
        buttonCloseStyleEditor: document.querySelector('#styleEditor > a.close'),
        ulPageList: document.getElementById('pageList'),

        init: function() {
            publisher.subscribe('closeStyleEditor', function () {
                styleeditor.closeStyleEditor();
            });

            //events
            $(this.radioStyle).on('click', this.activateStyleMode);
            $(this.buttonSaveChanges).on('click', this.updateStyling);
            $(this.formStyle).on('focus', 'input', this.animateStyleInputIn).on('blur', 'input', this.animateStyleInputOut);
            $(this.buttonRemoveElement).on('click', this.deleteElement);
            $(this.buttonCloneElement).on('click', this.cloneElement);
            $(this.buttonResetElement).on('click', this.resetElement);
            $(this.selectLinksInernal).on('change', this.resetSelectLinksInternal);
            $(this.selectLinksPages).on('change', this.resetSelectLinksPages);
            $(this.videoInputYoutube).on('focus', function(){ $(styleeditor.videoInputVimeo).val(''); });
            $(this.videoInputVimeo).on('focus', function(){ $(styleeditor.videoInputYoutube).val(''); });
            $(this.inputCustomLink).on('focus', this.resetSelectAllLinks);
            $(this.buttonDetailsAppliedHide).on('click', function(){$(this).parent().fadeOut(500);});
            $(this.buttonCloseStyleEditor).on('click', this.closeStyleEditor);
            $(document).on('modeContent modeBlocks', 'body', this.deActivateMode);

            //chosen font-awesome dropdown
            var choosen = $(this.selectIcons).chosen({'search_contains': true});
            /// LEADGEN BUILDER Added Below Code ///        
            $('#icons').on('change', function(evt, params) {
                var icon_val = $(this).val();
                var res = icon_val.substring(0,3);
                if(res == 'ti-')
                {
                    $('.chosen-container-single .chosen-single span').removeClass('font-awesome');
                    $('.chosen-container-single .chosen-single span').addClass('themify');
                }else{
                    $('.chosen-container-single .chosen-single span').removeClass('themify');
                    $('.chosen-container-single .chosen-single span').addClass('font-awesome');
                }
            });
            /// End LEADGEN BUILDER Code ///

            //check if formData is supported
            if (!window.FormData){
                this.hideFileUploads();
            }
            //show the style mode radio button
            $(this.labelStyleMode).show();
            //listen for the beforeSave event
            $('body').on('beforeSave', this.closeStyleEditor);
        },
        /*
            Activates style editor mode
        */
        activateStyleMode: function() {
           var i;
            //Element object extention
            canvasElement.prototype.clickHandler = function(el) {
                styleeditor.styleClick(el);
            };

            // Remove overlay span from portfolio
            for(i = 1; i <= $("ul#page1 li").length; i++){
                var id = "#ui-id-" + i;
                $(id).contents().find(".overlay").remove();
            }
            //trigger custom event
            $('body').trigger('modeDetails');

            //disable frameCovers
            for( i = 0; i < siteBuilder.site.sitePages.length; i++ ) {
                siteBuilder.site.sitePages[i].toggleFrameCovers('Off');
            }
            //create an object for every editable element on the canvas and setup it's events

            for( i = 0; i < siteBuilder.site.sitePages.length; i++ ) {
                for( var x = 0; x < siteBuilder.site.sitePages[i].blocks.length; x++ ) {
                    for( var key in bConfig.editableItems ) {
                        $(siteBuilder.site.sitePages[i].blocks[x].frame).contents().find( bConfig.pageContainer + ' '+ key ).each(function(){
                            var newElement = new canvasElement(this);
                            newElement.activate();
                            styleeditor.allStyleItemsOnCanvas.push( newElement );
                            $(this).attr('data-selector', key);
                        });
                    }
                }
            }

            /*$('#pageList ul li iframe').each(function(){

                for( var key in bConfig.editableItems ) {

                    $(this).contents().find( bConfig.pageContainer + ' '+ key ).each(function(){

                        var newElement = new canvasElement(this);

                        newElement.activate();

                        styleeditor.allStyleItemsOnCanvas.push( newElement );

                        $(this).attr('data-selector', key);

                    });

                }

            });*/
        },
        /*
            Event handler for when the style editor is envoked on an item
        */
        styleClick: function(el) {

            //if we have an active element, make it unactive
            if( Object.keys(this.activeElement).length !== 0) {
                this.activeElement.activate();
            }
            //set the active element
            var activeElement = new canvasElement(el);
            activeElement.setParentBlock();
            this.activeElement = activeElement;

            //unbind hover and click events and make this item active
            this.activeElement.setOpen();
            var theSelector = $(this.activeElement.element).attr('data-selector');
            $('#editingElement').text( theSelector );
            //activate first tab
            $('#detailTabs a:first').click();
            //hide all by default
            $('ul#detailTabs li:gt(0)').hide();
            //what are we dealing with?
            if( $(this.activeElement.element).prop('tagName') === 'A' || $(this.activeElement.element).parent().prop('tagName') === 'A' ) { 
                this.editLink(this.activeElement.element);
            }
            
            //LEADGEN BUILDER - added below code //
            if( $(this.activeElement.element).prop('tagName') === 'IMG' || $(this.activeElement.element).attr('data-selector') === '.tz-builder-bg-image')
            {
                this.editImage(this.activeElement.element);
                $('#recommended-size').text('');
                var img_size = $(el).attr('data-img-size');
                $('#recommended-size').text(img_size);
            }
            /// End LEADGEN BUILDER Code ///

            if( $(this.activeElement.element).attr('data-type') === 'video' ) {
                this.editVideo(this.activeElement.element);
            }

            if( $(this.activeElement.element).hasClass('fa') ) {
                this.editIcon(this.activeElement.element);
            }

            //load the attributes
            this.buildeStyleElements(theSelector);
            //open side panel
            this.toggleSidePanel('open');
        },
        
        /*
            dynamically generates the form fields for editing an elements style attributes
        */
        buildeStyleElements: function(theSelector) {
            //delete the old ones first
            $('#styleElements > *:not(#styleElTemplate)').each(function(){
                $(this).remove();
            });

            for( var x=0; x<bConfig.editableItems[theSelector].length; x++ ) {

                //create style elements
                var newStyleEl = $('#styleElTemplate').clone();
                newStyleEl.attr('id', '');
                newStyleEl.find('.control-label').text( bConfig.editableItems[theSelector][x]+":" );
                if( theSelector + " : " + bConfig.editableItems[theSelector][x] in bConfig.editableItemOptions) {//we've got a dropdown instead of open text input
                    newStyleEl.find('input').remove();
                    var newDropDown = $('<select class="form-control select select-primary btn-block select-sm"></select>');
                    newDropDown.attr('name', bConfig.editableItems[theSelector][x]);
                    for( var z=0; z<bConfig.editableItemOptions[ theSelector+" : "+bConfig.editableItems[theSelector][x] ].length; z++ ) {
                        var newOption = $('<option value="'+bConfig.editableItemOptions[theSelector+" : "+bConfig.editableItems[theSelector][x]][z]+'">'+bConfig.editableItemOptions[theSelector+" : "+bConfig.editableItems[theSelector][x]][z]+'</option>');
                        if( bConfig.editableItemOptions[theSelector+" : "+bConfig.editableItems[theSelector][x]][z] === $(styleeditor.activeElement.element).css('border-top-style') || bConfig.editableItemOptions[theSelector+" : "+bConfig.editableItems[theSelector][x]][z] === $(styleeditor.activeElement.element).css( bConfig.editableItems[theSelector][x] ) || bConfig.editableItemOptions[theSelector+" : "+bConfig.editableItems[theSelector][x]][z] === $(styleeditor.activeElement.element).css('border-left-width')) {
                            //current value, marked as selected
                            newOption.prop('selected',true);
                        }
                        newDropDown.append( newOption );
                    }
                    newStyleEl.append( newDropDown );
                    newDropDown.select2();

                } else {
                    newStyleEl.find('input').val( $(styleeditor.activeElement.element).css( bConfig.editableItems[theSelector][x] ) ).attr('name', bConfig.editableItems[theSelector][x]);
                    if( bConfig.editableItems[theSelector][x] === 'background-image' ) {
                            newStyleEl.find('input').bind('focus', function(){
                            var theInput = $(this);
                            $('#imageModal').modal('show');
                            $('#imageModal .image button.useImage').unbind('click');
                            $('#imageModal').on('click', '.image button.useImage', function(){  
                                $(styleeditor.activeElement.element).css('background-image',  'url("'+$(this).attr('data-url')+'")');
                                //update live image
                                theInput.val( 'url("'+$(this).attr('data-url')+'")' );
                                //hide modal
                                $('#imageModal').modal('hide');
                                //we've got pending changes
                                siteBuilder.site.setPendingChanges(true);
                            });
                        });

                    } else if( bConfig.editableItems[theSelector][x].indexOf("color") > -1 ) {
                        if( $(styleeditor.activeElement.element).css( bConfig.editableItems[theSelector][x] ) !== 'transparent' && $(styleeditor.activeElement.element).css( bConfig.editableItems[theSelector][x] ) !== 'none' && $(styleeditor.activeElement.element).css( bConfig.editableItems[theSelector][x] ) !== '' ) {
                            newStyleEl.val( $(styleeditor.activeElement.element).css( bConfig.editableItems[theSelector][x] ) );   
                        }

                        newStyleEl.find('input').spectrum({
                            preferredFormat: "hex",
                            showPalette: true,
                            allowEmpty: true,
                            showInput: true,
                            palette: [
                                ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
                                ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
                                ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
                                ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
                                ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
                                ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
                                ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
                                ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
                            ]
                        });
                    }

                }

                newStyleEl.css('display', 'block');
                $('#styleElements').append( newStyleEl );
                $('#styleEditor form#stylingForm').height('auto');
            }
        },
        /*
            Applies updated styling to the canvas
        */
        updateStyling: function() {
            
            var elementID;
            //LEADGEN BUILDER - added below one line
            var style_obj="";
            var elementStyles = [];
            $('#styleEditor #tab1 .form-group:not(#styleElTemplate) input, #styleEditor #tab1 .form-group:not(#styleElTemplate) select').each(function(){
                
                if( $(this).attr('name') !== undefined ) {
                    //LEADGEN BUILDER - added below code
                    var property = $(this).attr('name');
                    var value = $(this).val();
                    var oldStoredValue = "";
                    if(styleeditor._oldStyle[$(styleeditor.activeElement.element).attr('id')] !== undefined)
                    {
                        oldStoredValue = styleeditor._oldStyle[$(styleeditor.activeElement.element).attr('id')][property];
                    }
                    var oldValue = $(styleeditor.activeElement.element).css(property);
                    if(oldStoredValue)
                    {
                        oldValue = oldStoredValue;
                    }
                    var newValue = value;
                    
                    if(oldValue !==  newValue)
                        style_obj = style_obj + property + ':' + value +' !important;';
                    else
                        style_obj = style_obj + property + ':' + value+ ';';
                    
                    elementStyles[property] = oldValue; 

                    // End LEADGEN BUILDER code //

                    //LEADGEN BUILDER - commented below one line
                    ///$(styleeditor.activeElement.element).css($(this).attr('name'),$(this).val());
                }
                
                //commented by LEADGEN BUILDER

                /* SANDBOX */
                // if( styleeditor.activeElement.sandbox ) {
                //     elementID = $(styleeditor.activeElement.element).attr('id');
                //     if($(this).attr('name') !== undefined ){
                //         $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).css($(this).attr('name'), $(this).val());
                //     }
                // }

                /* END SANDBOX */

                //End commented by LEADGEN BUILDER

            });
           
            //LEADGEN BUILDER - added below code //
            if(style_obj !== "") 
            {
                $(styleeditor.activeElement.element).uniqueId();
                if(styleeditor._oldStyle[$(styleeditor.activeElement.element).attr('id')] === undefined)
                {
                    styleeditor._oldStyle[$(styleeditor.activeElement.element).attr('id')] = elementStyles;
                }
                $(styleeditor.activeElement.element).attr("style",style_obj);
                $(styleeditor.activeElement.element).css({'outline': '2px dotted #f72727', 'cursor': 'pointer'});

                 /* SANDBOX */

                if( styleeditor.activeElement.sandbox ) {
                    elementID = $(styleeditor.activeElement.element).attr('id');
                    $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr("style",style_obj);
                }

                /* END SANDBOX */
            }
            // End LEADGEN BUILDER code //
            //links
             
            if( $(styleeditor.activeElement.element).prop('tagName') === 'A' ) {
                //change the href prop?
                if( $('select#internalLinksDropdown').val() !== '#' ) {
                    $(styleeditor.activeElement.element).attr('href', $('select#internalLinksDropdown').val());
                } else if( $('select#pageLinksDropdown').val() !== '#' ) {
                    $(styleeditor.activeElement.element).attr('href', $('select#pageLinksDropdown').val() );
                } else if( $('input#internalLinksCustom').val() !== '' ) {
                    $(styleeditor.activeElement.element).attr('href', $('input#internalLinksCustom').val());
                }

                /* SANDBOX */

                if( styleeditor.activeElement.sandbox ) {
                    elementID = $(styleeditor.activeElement.element).attr('id');
                    if( $('select#internalLinksDropdown').val() !== '#' ) {
                        $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('href', $('select#internalLinksDropdown').val());
                    } else if( $('select#pageLinksDropdown').val() !== '#' ) {
                        $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('href', $('select#pageLinksDropdown').val() );
                    } else if( $('input#internalLinksCustom').val() !== '' ) {  
                        $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('href', $('input#internalLinksCustom').val());
                    }
                }

                /* END SANDBOX */
            }

            if( $(styleeditor.activeElement.element).parent().prop('tagName') === 'A' ) {
                    //change the href prop?
                    if( $('select#internalLinksDropdown').val() !== '#' ) {
                        $(styleeditor.activeElement.element).parent().attr('href', $('select#internalLinksDropdown').val());
                    } else if( $('select#pageLinksDropdown').val() !== '#' ) {
                        $(styleeditor.activeElement.element).parent().attr('href', $('select#pageLinksDropdown').val() );   
                    } else if( $('input#internalLinksCustom').val() !== '' ) {
                        //LEADGEN BUILDER - added below code //
                        var port_id = $(styleeditor.activeElement.element).parents().find('section').attr('id');
                        if(port_id != undefined)
                        {
                            var res_port = port_id.substring(0,10);
                            var ImgSrc = $('input#internalLinksCustom').val();
                            if(res_port == 'portfolios')
                            {
                                var img_ext = ImgSrc.substr(ImgSrc.lastIndexOf('.') + 1);
                                if(img_ext === 'jpeg' || img_ext === 'jpg' || img_ext === 'png' || img_ext === 'gif' || ImgSrc === '' || ImgSrc === '#')
                                {
                                    $(styleeditor.activeElement.element).closest('a').attr('href',ImgSrc);
                                }else{
                                    $(styleeditor.activeElement.element).parent().parent().removeClass('lightbox-gallery');
                                    $(styleeditor.activeElement.element).parent().attr('href',ImgSrc);
                                    $(styleeditor.activeElement.element).parent().attr('target', '_blank');
                                }
                            }else{
                                $(styleeditor.activeElement.element).parent().attr('href',ImgSrc);
                            }
                        }
                        //LEADGEN BUILDER - End code //
                    }

                /* SANDBOX */
                if( styleeditor.activeElement.sandbox ) {
                    elementID = $(styleeditor.activeElement.element).attr('id');
                    if( $('select#internalLinksDropdown').val() !== '#' ) {
                        $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).parent().attr('href', $('select#internalLinksDropdown').val());
                    } else if( $('select#pageLinksDropdown').val() !== '#' ) {
                        $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).parent().attr('href', $('select#pageLinksDropdown').val() );
                    } else if($('input#internalLinksCustom').val() !== '' ) {
                        //LEADGEN BUILDER - added below code //
                        if(res_port == 'portfolios')
                        {
                            if($('#detailTabs li.active').find('a').attr('href') == '#link_Tab')
                            {
                                var ImgSrc = $('input#internalLinksCustom').val();
                                var img_ext = ImgSrc.substr(ImgSrc.lastIndexOf('.') + 1);
                                if(img_ext === 'jpeg' || img_ext === 'jpg' || img_ext === 'png' || img_ext === 'gif' || ImgSrc === '' || ImgSrc === '#')
                                {
                                   $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).closest('a').attr('href',ImgSrc);
                                }else{
                                    $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).parent().parent().removeClass('lightbox-gallery');
                                    $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).parent().attr('href',ImgSrc);
                                    $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).parent().attr('target', '_blank');
                                }
                            }else{
                                $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).closest('a').attr('href', $('input#imageURL').val());
                            }
                            
                        }else{
                            $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).parent().attr('href', $('input#internalLinksCustom').val());
                        }
                        //LEADGEN BUILDER - End code //
                    }
                }

                /* END SANDBOX */
            }

            //do we need to upload an image?
            
            if( $('a#img_Link').css('display') === 'block' && $('input#imageFileField').val() !== '' ) {
            //if( $('a#img_Link').css('display') === 'block' ) {
                
                var form = $('form#imageUploadForm');
                var formdata = false;
                if (window.FormData){
                    formdata = new FormData(form[0]);
                }
                var formAction = form.attr('action');
                $.ajax({
                    url : formAction,
                    data : formdata ? formdata : form.serialize(),
                    cache : false,
                    contentType : false,
                    processData : false,
                    dataType: "json",
                    type : 'POST',
                }).done(function(response){
                    
                    if( response.code === 1 ) {//success
                        
                        $('input#imageURL').val( response.response );
                        //LEADGEN BUILDER - added below code //
                        if( $(styleeditor.activeElement.element).attr('data-selector') === '.tz-builder-bg-image' && !styleeditor.activeElement.sandbox)
                        {
                            var img_input_val = $(styleeditor.activeElement.element).css('background-image');
                            var img_bg_val = img_input_val.toString().split('url');
                            if(img_bg_val[0] != "")
                            {
                                var org_img = img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                                var tz_org_url = img_bg_val[0] + 'url("'+org_img[1]+'")'; 
                                var tz_url = img_bg_val[0]+ 'url("'+response.response+'")';
                            }else{
                                var org_img = img_bg_val[0].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                                var tz_org_url = "url('"+org_img[1]+"')"; 
                                var tz_url = 'url("'+response.response+'")';
                            }
                            $(styleeditor.activeElement.element).css('background-image', '');
                            $(styleeditor.activeElement.element).css('background-image', 'url("' + response.response +'")').promise().done(function () {
                                setTimeout(function () { $(styleeditor.activeElement.element).css('background-image', tz_url); }, 100);
                            });
                            $('#styleElements').find("input[name='background-image']").val(tz_url);
                            if( img_input_val != '') 
                            {
                                $(styleeditor.activeElement.element).uniqueId();
                                styleeditor._oldBGLG[$(styleeditor.activeElement.element).attr('id')] = tz_org_url;
                            }
                            
                        }else if(!styleeditor.activeElement.sandbox && $(styleeditor.activeElement.element).prop('tagName') === 'IMG'){
                            $(styleeditor.activeElement.element).attr('src', response.response);  
                        }
                        //LEADGEN BUILDER - End code ///
                        
                        //reset the file upload
                        $('.imageFileTab').find('a.fileinput-exists').click();
                        /* SANDBOX */
                        
                        //LEADGEN BUILDER - added below code //   
                        if($(styleeditor.activeElement.element).attr('data-selector') === '.tz-builder-bg-image' && styleeditor.activeElement.sandbox) {
                            
                            var img_input_val = $(styleeditor.activeElement.element).css('background-image');
                            var img_bg_val = img_input_val.toString().split('url');
                            if(img_bg_val[0] != "")
                            {
                                var org_img = img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                                var tz_org_url = img_bg_val[0] + "url('"+org_img[1]+"')"; 
                                var tz_url = img_bg_val[0]+ "url('"+response.response+"')";
                            }else{
                                var org_img = img_bg_val[0].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                                var tz_org_url = "url('"+org_img[1]+"')"; 
                                var tz_url = "url('"+response.response+"')";
                            }
                            var elementID = $(styleeditor.activeElement.element).attr('id');
                            $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('style','background-image:'+tz_url+'');
                            $(styleeditor.activeElement.element).css('background-image', '');
                            $(styleeditor.activeElement.element).css('background-image', 'url("' + response.response + '")').promise().done(function () {
                                setTimeout(function () { $(styleeditor.activeElement.element).css('background-image', tz_url); }, 100);
                            });
                            $('#styleElements').find("input[name='background-image']").val(tz_url);
                            if( img_input_val != '') {
                                styleeditor._oldBGLG[elementID] = tz_org_url;
                            }
                        }else if(res_port == 'portfolios' && styleeditor.activeElement.sandbox){
                            $(styleeditor.activeElement.element).attr('src', response.response);
                            $(styleeditor.activeElement.element).closest('a').attr('href', response.response);
                            $('input#internalLinksCustom').val(response.response);
                            var elementID = $(styleeditor.activeElement.element).attr('id');
                            $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('src', response.response);
                            $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).closest('a').attr('href', response.response);

                        }else if(styleeditor.activeElement.sandbox && res_port != 'portfolios' && $(styleeditor.activeElement.element).prop('tagName') === 'IMG'){
                            $(styleeditor.activeElement.element).attr('src', response.response);
                            var elementID = $(styleeditor.activeElement.element).attr('id');
                            $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('src', response.response);
                        }

                        // End LEADGEN BUILDER code //
                
                        /* END SANDBOX */
                    
                    } else if( response.code === 0 ) {//error
                    
                        alert('Something went wrong: '+response.response);
                    }
                
                });
                
                        
            } else if( $('a#img_Link').css('display') === 'block' ) {
            
                //no image to upload, just a SRC change
                if( $('input#imageURL').val() !== '' && $('input#imageURL').val() !== $(styleeditor.activeElement.element).attr('src') ) {

                    //LEADGEN BUILDER - added below code //
                    if($(styleeditor.activeElement.element).attr('data-selector') === '.tz-builder-bg-image' && !styleeditor.activeElement.sandbox && $('input#imageURL').val() !== '' && $('input#imageURL').val() !== $(styleeditor.activeElement.element).attr('src'))
                    {
                        var img_input_val = $('#imageBgOld').val();
                        var img_bg_val = img_input_val.toString().split('url');
                        var ch_img_val = $(styleeditor.activeElement.element).css('background-image');
                        var ch_img_bg_val = ch_img_val.toString().split('url');
                        if(ch_img_bg_val[0] != "")
                        {
                            if(img_bg_val[1].match(/elements/g))
                            {
                                var org_img = img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                                var org_name = org_img[1].substr(org_img[1].lastIndexOf('/') + 1);
                            }else{
                                var org_img = img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','');
                                var org_name = org_img.substr(org_img.lastIndexOf('/') + 1);
                            }
                            
                            if(ch_img_bg_val[1].match(/elements/g))
                            {
                                var ch_org_img = ch_img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                                var org_img_name = ch_org_img[1].substr(ch_org_img[1].lastIndexOf('/') + 1);
                            }else{
                                var ch_org_img = ch_img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','');
                                var org_img_name = ch_org_img.substr(ch_org_img.lastIndexOf('/') + 1);
                            }

                            if(img_bg_val[0] != ch_img_bg_val[0] && org_name != org_img_name)
                            {
                                var tz_org_url = img_bg_val[0] + 'url("'+$('input#imageURL').val()+'")';
                                var tz_url = ch_img_bg_val[0]+ 'url("'+ch_org_img[1]+'")';
                                var tz_old_url = ch_img_bg_val[0]+ 'url("'+ch_org_img[1]+'")';
                                $('input#imageURL').val(ch_org_img[1]);
                                
                            }else if(img_bg_val[0] != ch_img_bg_val[0] && org_name == org_img_name){
                                
                                var tz_org_url = img_bg_val[0] + 'url("'+$('input#imageURL').val()+'")';
                                var tz_url = ch_img_bg_val[0]+ 'url("'+org_img[1]+'")';
                                var tz_old_url = ch_img_bg_val[0]+ 'url("'+org_img[1]+'")';
                                $('input#imageURL').val(org_img[1]);
                                
                            }else if(img_bg_val[0] == ch_img_bg_val[0] && org_name != org_img_name){
                               
                                var tz_org_url = img_bg_val[0] + 'url("'+$('input#imageURL').val()+'")';
                                var tz_url = img_bg_val[0]+ 'url("'+ch_org_img[1]+'")';
                                var tz_old_url = img_bg_val[0]+ 'url("'+$('input#imageURL').val()+'")';
                                $('input#imageURL').val(ch_org_img[1]);
                                
                            }else if(img_bg_val[0] == ch_img_bg_val[0] && org_name != $('input#imageURL').val()){
                                
                                var tz_org_url = img_bg_val[0] + 'url("'+org_img[1]+'")'; 
                                var tz_url = img_bg_val[0]+ 'url("'+$('input#imageURL').val()+'")';
                                var tz_old_url = img_bg_val[0]+ 'url("'+org_img[1]+'")';
                                $('input#imageURL').val($('input#imageURL').val());
                                $('#styleElements').find("input[name='background-image']").val(tz_url);
                            }

                        }else{
                            if(img_bg_val[1].match(/elements/g))
                            {
                                var org_img = img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                            }else{
                                var org_img = img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','');
                            }
                            var tz_org_url = "url('"+$('input#imageURL').val()+"')"; 
                            var tz_url = "url('"+org_img[1]+"')";
                            var tz_old_url = "url('"+org_img[1]+"')";
                        }
                        $('#imageBgOld').val(tz_old_url);

                        if( img_input_val != ''){
                            $(styleeditor.activeElement.element).uniqueId();
                            styleeditor._oldBGLG[$(styleeditor.activeElement.element).attr('id')] = tz_org_url;
                        }
                        
                    }else{
                        
                        if($(styleeditor.activeElement.element).prop('tagName') === 'IMG')
                        {
                            $(styleeditor.activeElement.element).attr('src', $('input#imageURL').val());
                        }
                    }

                    /* SANDBOX */
                    if( styleeditor.activeElement.sandbox && $(styleeditor.activeElement.element).attr('data-selector') === '.tz-builder-bg-image') {
                        
                        var img_input_val = $('#imageBgOld').val();
                        var img_bg_val = img_input_val.toString().split('url');
                        var ch_img_val = $(styleeditor.activeElement.element).css('background-image');
                        var ch_img_bg_val = ch_img_val.toString().split('url');
                        if(ch_img_bg_val[0] != "")
                        {
                            if(img_bg_val[1].match(/elements/g)){
                                var org_img = img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                                var org_name = org_img[1].substr(org_img[1].lastIndexOf('/') + 1);
                               
                            }else{
                                var org_img  = img_bg_val[1].toString().replace(/"/g,'').replace(')','').split('(');
                                var org_name = org_img[1].substr(org_img[1].lastIndexOf('/') + 1);
                            }
                            
                            if(ch_img_bg_val[1].match(/elements/g)){
                                var ch_org_img = ch_img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                                var org_img_name = ch_org_img[1].substr(ch_org_img[1].lastIndexOf('/') + 1);
                            }else{
                                var ch_org_img = ch_org_img[1] = ch_img_bg_val[1].toString().replace(/"/g,'').replace(')','').split('(');
                                var org_img_name = ch_org_img[1].substr(ch_org_img[1].lastIndexOf('/') + 1);
                            }
                            
                            if(img_bg_val[0] != ch_img_bg_val[0] && org_name != org_img_name){

                                var tz_org_url = img_bg_val[0] + 'url("'+$('input#imageURL').val()+'")';
                                var tz_url = ch_img_bg_val[0]+ 'url("'+ch_org_img[1]+'")';
                                var tz_old_url = ch_img_bg_val[0]+ 'url("'+ch_org_img[1]+'")';
                                $('input#imageURL').val(ch_org_img[1]);
                                
                            }else if(img_bg_val[0] != ch_img_bg_val[0] && org_name == org_img_name){
                                
                                var tz_org_url = img_bg_val[0] + 'url("'+$('input#imageURL').val()+'")';
                                var tz_url = ch_img_bg_val[0]+ 'url("'+org_img[1]+'")';
                                var tz_old_url = ch_img_bg_val[0]+ 'url("'+org_img[1]+'")';
                                $('input#imageURL').val(org_img[1]);
                                
                            }else if(img_bg_val[0] == ch_img_bg_val[0] && org_name != org_img_name){
                               
                                var tz_org_url = img_bg_val[0] + 'url("'+$('input#imageURL').val()+'")';
                                var tz_url = img_bg_val[0]+ 'url("'+ch_org_img[1]+'")';
                                var tz_old_url = img_bg_val[0]+ 'url("'+$('input#imageURL').val()+'")';
                                $('input#imageURL').val(ch_org_img[1]);
                                
                            }else if(img_bg_val[0] == ch_img_bg_val[0] && org_name != $('input#imageURL').val()){
                                
                                var tz_org_url = img_bg_val[0] + 'url("'+org_img[1]+'")'; 
                                var tz_url = img_bg_val[0]+ 'url("'+$('input#imageURL').val()+'")';
                                var tz_old_url = img_bg_val[0]+ 'url("'+org_img[1]+'")';
                                $('input#imageURL').val($('input#imageURL').val());
                                $('#styleElements').find("input[name='background-image']").val(tz_url);
                            }
                             
                        }else{

                            if(img_bg_val[1].match(/elements/g)){
                                var org_img = img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                            }else{
                                var org_img = img_bg_val[1].toString().replace(/"/g,'').replace('(','').replace(')','');
                            }
                            var tz_org_url = "url('"+$('input#imageURL').val()+"')"; 
                            var tz_url = "url('"+org_img[1]+"')";
                            var tz_old_url = "url('"+org_img[1]+"')";
                        }
                        $('#imageBgOld').val(tz_old_url);
                        var elementID = $(styleeditor.activeElement.element).attr('id');
                        $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('style','background-image:'+tz_url+'');
                        $(styleeditor.activeElement.element).css('background-image', '');
                        $(styleeditor.activeElement.element).css('background-image', 'url("' + ch_org_img[1] + '")').promise().done(function () {
                            setTimeout(function () { $(styleeditor.activeElement.element).css('background-image', tz_url); }, 100);
                        });

                        if( img_input_val != ''){
                            styleeditor._oldBGLG[elementID] = tz_org_url;
                        }
                
                    }else if(styleeditor.activeElement.sandbox && $(styleeditor.activeElement.element).prop('tagName') === 'IMG'){
                        
                        var port_id = $(styleeditor.activeElement.element).parents().find('section').attr('id');
                        if(port_id != undefined)
                        {
                            var res_port = port_id.substring(0,10);
                        }
                        if(res_port == 'portfolios')
                        {
                            var ImgSrc = $('input#imageURL').val();
                            $(styleeditor.activeElement.element).attr('src', ImgSrc);
                            var elementID = $(styleeditor.activeElement.element).attr('id');
                            $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('src', ImgSrc);
                            $('input#internalLinksCustom').val(ImgSrc);

                        }else{

                            $(styleeditor.activeElement.element).attr('src', $('input#imageURL').val());
                            elementID = $(styleeditor.activeElement.element).attr('id');
                            $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('src', $('input#imageURL').val());
                        }
                    }
                    /* END SANDBOX */
                }else{
                    var port_id = $(styleeditor.activeElement.element).parents().find('section').attr('id');
                    if(port_id != undefined)
                    {
                        var res_port = port_id.substring(0,10);
                        if(res_port == 'portfolios'){
                            var ImgSrc = $('input#internalLinksCustom').val();
                            var img_ext = ImgSrc.substr(ImgSrc.lastIndexOf('.') + 1);
                            if(img_ext === 'jpeg' || img_ext === 'jpg' || img_ext === 'png' || img_ext === 'gif' || ImgSrc == '')
                            {
                                var elementID = $(styleeditor.activeElement.element).attr('id');
                                $(styleeditor.activeElement.element).attr('src',ImgSrc);
                                $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('src', ImgSrc);
                                $('input#imageURL').val(ImgSrc);
                            }
                        }
                    }
                }

                //LEADGEN BUILDER - End code ///
            }
            //icons
            if( $(styleeditor.activeElement.element).hasClass('fa') ) {

                //out with the old, in with the new :)
                //get icon class name, starting with fa-
                var get = $.grep(styleeditor.activeElement.element.className.split(" "), function(v, i){
                    return v.indexOf('fa-') === 0;
                }).join();

                /// LEADGEN BUILDER Added Below Four Code ///
                var themify_get = $.grep(styleeditor.activeElement.element.className.split(" "), function(v, i){
                    return v.indexOf('ti-') === 0;
                }).join();
                //if the icons is being changed, save the old one so we can reset it if needed

                if( get != $('select#icons').val() && (get != '')) {
                    $(styleeditor.activeElement.element).uniqueId();
                    styleeditor._oldIcon[$(styleeditor.activeElement.element).attr('id')] = get;
                }
                    
                if( themify_get != $('select#icons').val() && (themify_get != '')) 
                {
                    $(styleeditor.activeElement.element).uniqueId();
                    styleeditor._oldIcon[$(styleeditor.activeElement.element).attr('id')] = themify_get;
                }
               
               //LEADGEN BUILDER - End code ///
                    
                $(styleeditor.activeElement.element).removeClass( get ).addClass( $('select#icons').val() );
                /// LEADGEN BUILDER Added Below One Line ///                
                $(styleeditor.activeElement.element).removeClass( themify_get ).addClass( $('select#icons').val() );
                /* SANDBOX */
                if( styleeditor.activeElement.sandbox ) 
                {
                    $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).removeClass( get ).addClass( $('select#icons').val() );
                    /// LEADGEN BUILDER Added Below One Line ///
                    $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).removeClass( themify_get ).addClass( $('select#icons').val() );
                }
                /* END SANDBOX */
            }

            //video URL
            if( $(styleeditor.activeElement.element).attr('data-type') === 'video' ) {
                if( $('input#youtubeID').val() !== '' ) {
                    $(styleeditor.activeElement.element).prev().attr('src', "//www.youtube.com/embed/"+$('#video_Tab input#youtubeID').val());
                } else if( $('input#vimeoID').val() !== '' ) {
                    $(styleeditor.activeElement.element).prev().attr('src', "//player.vimeo.com/video/"+$('#video_Tab input#vimeoID').val()+"?title=0&amp;byline=0&amp;portrait=0");
                }

                /* SANDBOX */
                if( styleeditor.activeElement.sandbox ) {
                    elementID = $(styleeditor.activeElement.element).attr('id');
                    if( $('input#youtubeID').val() !== '' ) {
                        $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).prev().attr('src', "//www.youtube.com/embed/"+$('#video_Tab input#youtubeID').val());
                    } else if( $('input#vimeoID').val() !== '' ) {
                        $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).prev().attr('src', "//player.vimeo.com/video/"+$('#video_Tab input#vimeoID').val()+"?title=0&amp;byline=0&amp;portrait=0");
                    }
                }
                /* END SANDBOX */
            }

            $('#detailsAppliedMessage').fadeIn(600, function(){
                setTimeout(function(){ $('#detailsAppliedMessage').fadeOut(1000); }, 3000);
            });

            //adjust frame height
            styleeditor.activeElement.parentBlock.heightAdjustment();
            //we've got pending changes
            siteBuilder.site.setPendingChanges(true);
            /// LEADGEN BUILDER Added Below Four Code ///
            var equalize_height = $(styleeditor.activeElement.element).parents('.equalize').length;
            var iframeId = $(styleeditor.activeElement.parentFrame).attr('id');
            if(equalize_height > 0)
            {
                document.getElementById(iframeId).contentWindow.LoadEqualize();
            }
            //LEADGEN BUILDER - End code ///
        },

        /*
            on focus, we'll make the input fields wider
        */
        animateStyleInputIn: function() {
            $(this).css('position', 'absolute');
            $(this).css('right', '0px');
            $(this).animate({'width': '100%'}, 500);
            $(this).focus(function(){
                this.select();
            });
        },
        /*
            on blur, we'll revert the input fields to their original size
        */
        animateStyleInputOut: function() {
            $(this).animate({'width': '42%'}, 500, function(){
                $(this).css('position', 'relative');
                $(this).css('right', 'auto');
            });
        },

        /*
            when the clicked element is an anchor tag (or has a parent anchor tag)
        */
        editLink: function(el) {

            $('a#link_Link').parent().show();
            var theHref;
            if( $(el).prop('tagName') === 'A' ) {
                theHref = $(el).attr('href');
            } else if( $(el).parent().prop('tagName') === 'A' ) {
                theHref = $(el).parent().attr('href');
            }
            var zIndex = 0;
            var pageLink = false;

            //the actual select
            $('select#internalLinksDropdown').prop('selectedIndex', 0);
            //set the correct item to "selected"
            $('select#internalLinksDropdown option').each(function(){
                if( $(this).attr('value') === theHref ) {
                    $(this).attr('selected', true);
                    zIndex = $(this).index();
                    pageLink = true;
                }
            });
            //the pretty dropdown
            $('.link_Tab .btn-group.select .dropdown-menu li').removeClass('selected');
            $('.link_Tab .btn-group.select .dropdown-menu li:eq('+zIndex+')').addClass('selected');
            $('.link_Tab .btn-group.select:eq(0) .filter-option').text( $('select#internalLinksDropdown option:selected').text() );
            $('.link_Tab .btn-group.select:eq(1) .filter-option').text( $('select#pageLinksDropdown option:selected').text() );
            if( pageLink === true ) {
                $('input#internalLinksCustom').val('');
            } else {
                if( $(el).prop('tagName') === 'A' ) {
                    if( $(el).attr('href')[0] !== '#' ) {
                        $('input#internalLinksCustom').val( $(el).attr('href') );
                    } else {
                        $('input#internalLinksCustom').val( '' );
                    }

                } else if( $(el).parent().prop('tagName') === 'A' ) 
                {
                    if( $(el).parent().attr('href')[0] !== '#' ) {
                        $('input#internalLinksCustom').val( $(el).parent().attr('href') );
                    } else {
                        $('input#internalLinksCustom').val( '' );
                    }
                }
            }

            //list available blocks on this page, remove old ones first

            $('select#pageLinksDropdown option:not(:first)').remove();
            $('#pageList ul:visible iframe').each(function(){

                if( $(this).contents().find( bConfig.pageContainer + " > *:first" ).attr('id') !== undefined ) {
                    var newOption;
                    if( $(el).attr('href') === '#'+$(this).contents().find( bConfig.pageContainer + " > *:first" ).attr('id') ) {
                        newOption = '<option selected value=#'+$(this).contents().find( bConfig.pageContainer + " > *:first" ).attr('id')+'>#'+$(this).contents().find( bConfig.pageContainer + " > *:first" ).attr('id')+'</option>';
                    } else {
                        newOption = '<option value=#'+$(this).contents().find( bConfig.pageContainer + " > *:first" ).attr('id')+'>#'+$(this).contents().find( bConfig.pageContainer + " > *:first" ).attr('id')+'</option>';
                    }
                    $('select#pageLinksDropdown').append( newOption );
                }
            });

            //if there aren't any blocks to list, hide the dropdown
            if( $('select#pageLinksDropdown option').size() === 1 ) {
                $('select#pageLinksDropdown').next().hide();
                $('select#pageLinksDropdown').next().next().hide();
            } else {
                $('select#pageLinksDropdown').next().show();
                $('select#pageLinksDropdown').next().next().show();
            }
        },


        /*
            when the clicked element is an image
        */
        editImage: function(el) {
             
            $('a#img_Link').parent().show();
            //set the current SRC

            /// LEADGEN BUILDER Added Below Code ///

            if($(el).attr('data-selector') === '.tz-builder-bg-image')
            {
                var bg_url = $(el).css('background-image');
                $('#imageBgOld').val(bg_url);
                if(bg_url != 'none' || bg_url != '')
                {
                    var img_val = bg_url.split('url');
                    if(img_val != 'none' || img_val != '' )
                    {   
                        var bg_url = img_val[1].toString().replace(/"/g,'').replace('(','').replace(')','').split('elements/');
                        $('.imageFileTab').find('input#imageURL').val(bg_url[1]);
                    }
                }

            }else{

                $('.imageFileTab').find('input#imageURL').val($(el).attr('src'));
            }
            
            /// End LEADGEN BUILDER Code ///
            //reset the file upload
            $('.imageFileTab').find('a.fileinput-exists').click();
        },


        /*
            when the clicked element is a video element
        */
        editVideo: function(el) {
            
            var matchResults;
            $('a#video_Link').parent().show();
            $('a#video_Link').click();

            //inject current video ID,check if we're dealing with Youtube or Vimeo

            if( $(el).prev().attr('src').indexOf("vimeo.com") > -1 ) {//vimeo

                matchResults = $(el).prev().attr('src').match(/player\.vimeo\.com\/video\/([0-9]*)/);
                $('#video_Tab input#vimeoID').val( matchResults[matchResults.length-1] );
                $('#video_Tab input#youtubeID').val('');

            } else {//youtube

                //temp = $(el).prev().attr('src').split('/');
                var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
                matchResults = $(el).prev().attr('src').match(regExp);
                $('#video_Tab input#youtubeID').val( matchResults[1] );
                $('#video_Tab input#vimeoID').val('');
            }
        },
        /*
            when the clicked element is an fa icon
        */
        editIcon: function() {

            $('a#icon_Link').parent().show();
                //get icon class name, starting with fa-
                var get = $.grep(this.activeElement.element.className.split(" "), function(v, i){
                    return v.indexOf('fa-') === 0;
                }).join();

                /// LEADGEN BUILDER Added Below Code ///

                var themify_get = $.grep(this.activeElement.element.className.split(" "), function(v, i){
                    return v.indexOf('ti-') === 0;
                }).join();

                $('select#icons option').each(function(){
                    if( $(this).val() === get || $(this).val() === themify_get ) 
                    {
                        if( styleeditor.activeElement.sandbox ) 
                        {
                            var elementID = $(styleeditor.activeElement.element).attr('id');
                        }
                        var icon_val = $(this).val();
                        var res = icon_val.substring(0,3);
                        if(res == 'ti-')
                        {
                            if( styleeditor.activeElement.sandbox ) 
                            {
                                $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).removeClass(themify_get).addClass($(this).val());
                            }
                            $('.chosen-container-single .chosen-single span').removeClass('font-awesome');
                            $('.chosen-container-single .chosen-single span').addClass('themify');
                            
                        }else{

                            if( styleeditor.activeElement.sandbox ) 
                            {
                                $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).removeClass(get).addClass($(this).val());
                            }
                            $('.chosen-container-single .chosen-single span').removeClass('themify');
                            $('.chosen-container-single .chosen-single span').addClass('font-awesome');
                        }

                        $(this).prop('selected', true);
                        $('#icons').trigger('chosen:updated');
                    }
                });
            /// End LEADGEN BUILDER Code ///
        },
        /*
            delete selected element
        */
        deleteElement: function() {

            var toDel;
            // LEADGEN BUILDER - added below code // 
            var port_sec_id = $(styleeditor.activeElement.element).parents().find('section').attr('id');
            if(port_sec_id != undefined)
            {
                var res_port_name = port_sec_id.substring(0,10);
                var owl_sec = $(styleeditor.activeElement.element).parents('.owl-theme').length;
            }
            // End LEADGEN BUILDER code //

            //determine what to delete
            if( $(styleeditor.activeElement.element).prop('tagName') === 'A' ) {//ancor
                if( $(styleeditor.activeElement.element).parent().prop('tagName') ==='LI' ) {//clone the LI
                    toDel = $(styleeditor.activeElement.element).parent();
                } else {
                    toDel = $(styleeditor.activeElement.element);
                }
            } else if( $(styleeditor.activeElement.element).prop('tagName') === 'IMG' ) {//image

                if( $(styleeditor.activeElement.element).parent().prop('tagName') === 'A' ) {//clone the A
                    // LEADGEN BUILDER - added below code // 
                    if(res_port_name == 'portfolios' && owl_sec == '0')
                    {
                        toDel = $(styleeditor.activeElement.element).parents('li');
                    }else{
                       toDel = $(styleeditor.activeElement.element).parent();
                    }
                    // End LEADGEN BUILDER code //
                } else {
                    // LEADGEN BUILDER - added below code // 
                    if(res_port_name == 'portfolios' && owl_sec == '0')
                    {
                        toDel = $(styleeditor.activeElement.element).parents('li');
                    }else{
                        toDel = $(styleeditor.activeElement.element);
                    }
                    // End LEADGEN BUILDER code //
                }

            } else {//everything else
                toDel = $(styleeditor.activeElement.element);
            }

            toDel.fadeOut(500, function(){
                var randomEl = $(this).closest('body').find('*:first');
                toDel.remove();
                /* SANDBOX */
                var elementID = $(styleeditor.activeElement.element).attr('id');
                if(res_port_name == 'portfolios' && owl_sec == '0')
                {
                    $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).parents('li').remove();
                }else{
                    $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).remove();
                }
                /* END SANDBOX */
                styleeditor.activeElement.parentBlock.heightAdjustment();
                //we've got pending changes
                siteBuilder.site.setPendingChanges(true);
            });
            $('#deleteElement').modal('hide');
            styleeditor.closeStyleEditor();

            // LEADGEN BUILDER - added below code // 
            var iframeId = $(styleeditor.activeElement.parentFrame).attr('id');
            if(res_port_name == 'portfolios' && owl_sec == '0' && $(styleeditor.activeElement.element).prop('tagName') === 'IMG')
            {
                document.getElementById(iframeId).contentWindow.LoadIsotope();
                document.getElementById(iframeId).contentWindow.LoadLightboxGallery();
            }
            var equalize_height = $(styleeditor.activeElement.element).parents('.equalize').length;
            if(equalize_height > 0)
            {
                document.getElementById(iframeId).contentWindow.LoadEqualize();
            }
            // End LEADGEN BUILDER code //
        },
        /*
            clones the selected element
        */
        cloneElement: function() {

            var theClone, theClone2, theOne, cloned, cloneParent, elementID;

            // LEADGEN BUILDER - added below code //
            var portfolio_id = $(styleeditor.activeElement.element).parents().find('section').attr('id');
            
            if(portfolio_id != undefined)
            {
                var result_portfolio = portfolio_id.substring(0,10);
                var owl_sec = $(styleeditor.activeElement.element).parents('.owl-theme').length;

            }
            
            // End LEADGEN BUILDER code // 
            if( $(styleeditor.activeElement.element).parent().hasClass('propClone') ) {//clone the parent element
                theClone = $(styleeditor.activeElement.element).parent().clone(true,true);
                //theClone.find( $(styleeditor.activeElement.element).prop('tagName') ).attr('style', '');
                theClone2 = $(styleeditor.activeElement.element).parent().clone(true,true);
                //theClone2.find( $(styleeditor.activeElement.element).prop('tagName') ).attr('style', '');
                theOne = theClone.find( $(styleeditor.activeElement.element).prop('tagName') );
                cloned = $(styleeditor.activeElement.element).parent();
                cloneParent = $(styleeditor.activeElement.element).parent().parent();

            } else {//clone the element itself

                //LEADGEN BUILDER - added below code
                if(result_portfolio == 'portfolios' && $(styleeditor.activeElement.element).prop('tagName') === 'IMG')
                {
                    theClone = $(styleeditor.activeElement.element).parents('li').clone(true,true);
                    //theClone.attr('style','');
                    theClone2 = $(styleeditor.activeElement.element).parents('li').clone(true,true);
                    ///theClone2.attr('style','');
                    theOne = theClone.find('img');
                    cloned = $(styleeditor.activeElement.element).parents('li');
                    cloneParent = $(styleeditor.activeElement.element).parents('li').parent();
                }else if($(styleeditor.activeElement.element).parent().prop('tagName') === 'A' && $(styleeditor.activeElement.element).prop('tagName') === 'IMG' && owl_sec == 0){
                    
                    theClone = $(styleeditor.activeElement.element).parent().clone(true,true);
                    ///theClone.attr('style', '');
                    theClone2 = $(styleeditor.activeElement.element).parent().clone(true,true);
                    ///theClone2.attr('style', '');
                    theOne = theClone.find('img');
                    cloned = $(styleeditor.activeElement.element).parent();
                    cloneParent = $(styleeditor.activeElement.element).parent().parent();
                }else if($(styleeditor.activeElement.element).attr('data-selector') === '.tz-builder-bg-image' && owl_sec != 0 || $(styleeditor.activeElement.element).prop('tagName') === 'IMG' && owl_sec != 0 ){ 
                    alert('You cannot generate clone of slider, please add new slider from elements.');
                    return false;

                }else{ 
                    var owl_child_sec = $(styleeditor.activeElement.element).children().find('.owl-theme').length;
                    if($(styleeditor.activeElement.element).attr('data-selector') === '.tz-builder-bg-image' && owl_child_sec != 0 || $(styleeditor.activeElement.element).attr('data-selector') === '.builder-bg' && owl_child_sec != 0)
                    {
                        alert('You cannot generate clone of slider, please add new slider from elements.');
                        return false;
                    }else{
                        theClone = $(styleeditor.activeElement.element).clone(true,true);
                        ///theClone.attr('style', '');
                        theClone2 = $(styleeditor.activeElement.element).clone(true,true);
                        ///theClone2.attr('style', '');
                        theOne = theClone;
                        cloned = $(styleeditor.activeElement.element);
                        cloneParent = $(styleeditor.activeElement.element).parent();
                    }
                }
                // End LEADGEN BUILDER code //
            }

            cloned.after( theClone );
            /* SANDBOX */
            if( styleeditor.activeElement.sandbox ) {
                elementID = $(styleeditor.activeElement.element).attr('id');
                $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).after( theClone2 );
            }
            /* END SANDBOX */
            
            //make sure the new element gets the proper events set on it
            var newElement = new canvasElement(theOne.get(0));
            newElement.activate();
            //possible height adjustments
            styleeditor.activeElement.parentBlock.heightAdjustment();
            //we've got pending changes
            siteBuilder.site.setPendingChanges(true);
            // LEADGEN BUILDER - added below code // 
           if(result_portfolio == 'portfolios' && owl_sec == '0' && $(styleeditor.activeElement.element).prop('tagName') === 'IMG')
            {
                var iframeId = $(styleeditor.activeElement.parentFrame).attr('id');
                document.getElementById(iframeId).contentWindow.LoadIsotope();
                document.getElementById(iframeId).contentWindow.LoadLightboxGallery();
            }
            // End LEADGEN BUILDER code //
        },
        /*
            resets the active element
        */
        resetElement: function() {
            if( $(styleeditor.activeElement.element).closest('body').width() !== $(styleeditor.activeElement.element).width() ) {
                if($(styleeditor.activeElement.element).attr('data-selector') === '.tz-builder-bg-image' && !styleeditor.activeElement.sandbox)
                {   
                    var OldBG = styleeditor._oldBGLG[$(styleeditor.activeElement.element).attr('id')];
                    var style_img = OldBG.toString().split('url');
                    if(style_img[0] != '')
                    {
                        if(style_img[1].match(/elements/g))
                        {
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','').split('elements/');
                            var imgPath = bg_style[1];
                        }else{
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','');
                            var imgPath = bg_style;
                        }
                    }else{
                        if(style_img[1].match(/elements/g))
                        {
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','').split('elements/');
                            var imgPath = bg_style[1];
                        }else{
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','');
                            var imgPath = bg_style;
                        }
                    }
                    $(styleeditor.activeElement.element).css('background-image', '');
                    $(styleeditor.activeElement.element).css('background-image', imgPath).promise().done(function () {
                        setTimeout(function () { $(styleeditor.activeElement.element).css('background-image', OldBG); }, 100);
                    });
                    $(styleeditor.activeElement.element).css({'outline': '2px dotted #f72727', 'cursor': 'pointer'});
                    if(bg_style)
                    {
                        $('.imageFileTab').find('input#imageURL').val(bg_style);
                    }
                }else{
                    $(styleeditor.activeElement.element).attr('style', '');
                    $(styleeditor.activeElement.element).css({'outline': '2px dotted #f72727', 'cursor': 'pointer'});
                }

            } else {
                if($(styleeditor.activeElement.element).attr('data-selector') === '.tz-builder-bg-image' && !styleeditor.activeElement.sandbox)
                {
                    var OldBG = styleeditor._oldBGLG[$(styleeditor.activeElement.element).attr('id')];
                    var style_img = OldBG.toString().split('url');
                    if(style_img[0] != '')
                    {
                        if(style_img[1].match(/elements/g))
                        {
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','').split('elements/');
                            var imgPath = bg_style[1];
                        }else{
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','');
                            var imgPath = bg_style;
                        }
                        
                    }else{

                        if(style_img[1].match(/elements/g))
                        {
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','').split('elements/');
                            var imgPath = bg_style[1];
                        }else{
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','');
                            var imgPath = bg_style;
                        }
                    }
                    $(styleeditor.activeElement.element).css('background-image', '');
                    $(styleeditor.activeElement.element).css('background-image', imgPath).promise().done(function () {
                        setTimeout(function () { $(styleeditor.activeElement.element).css('background-image', OldBG); }, 100);
                    });
                    $(styleeditor.activeElement.element).css({'outline': '2px dotted #f72727', 'outline-offset':'-3px', 'cursor': 'pointer'});
                    if(bg_style)
                    {
                        $('.imageFileTab').find('input#imageURL').val(bg_style);
                    }
                }else{
                    $(styleeditor.activeElement.element).attr('style', '');
                    $(styleeditor.activeElement.element).css({'outline': '2px dotted #f72727', 'outline-offset':'-3px', 'cursor': 'pointer'});
                }
            }

            /* SANDBOX */

            if( styleeditor.activeElement.sandbox ) {

                var elementID = $(styleeditor.activeElement.element).attr('id');
                if($(styleeditor.activeElement.element).attr('data-selector') === '.tz-builder-bg-image')
                {
                    var OldBG = styleeditor._oldBGLG[$(styleeditor.activeElement.element).attr('id')];
                    var style_img = OldBG.toString().split('url');
                    if(style_img[0] != '')
                    {
                        if(style_img[1].match(/elements/g))
                        {
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','').split('elements/');
                            var imgPath = bg_style[1];
                        }else{
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','');
                            var imgPath = bg_style;
                        }

                    }else{

                        if(style_img[1].match(/elements/g))
                        {
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','').split('elements/');
                            var imgPath = bg_style[1];
                        }else{
                            var bg_style = style_img[1].toString().replace(/'/g,'').replace('(','').replace(')','');
                            var imgPath = bg_style;
                        }
                    }
                    $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('style','background-image:'+OldBG);
                    $(styleeditor.activeElement.element).css('background-image', '');
                    $(styleeditor.activeElement.element).css('background-image', imgPath).promise().done(function () {
                        setTimeout(function () { $(styleeditor.activeElement.element).css('background-image', OldBG); }, 100);
                    });
                    if(imgPath)
                    {
                        $('.imageFileTab').find('input#imageURL').val(imgPath);
                    }
                    
                }else{
                    $('#'+styleeditor.activeElement.sandbox).contents().find('#'+elementID).attr('style', '');
                }
            }

            /* END SANDBOX */
            $('#styleEditor form#stylingForm').height( $('#styleEditor form#stylingForm').height()+"px" );
            $('#styleEditor form#stylingForm .form-group:not(#styleElTemplate)').fadeOut(500, function(){
                $(this).remove();
            });

            //reset icon
            
            if( styleeditor._oldIcon[$(styleeditor.activeElement.element).attr('id')] !== undefined ) {
                
                var get = $.grep(styleeditor.activeElement.element.className.split(" "), function(v, i){
                    return v.indexOf('fa-') === 0;
                }).join();
                // LEADGEN BUILDER - added below code // 

                var themify_get = $.grep(styleeditor.activeElement.element.className.split(" "), function(v, i){
                    return v.indexOf('ti-') === 0;
                }).join();
                // End LEADGEN BUILDER code //
                $(styleeditor.activeElement.element).removeClass( get ).addClass( styleeditor._oldIcon[$(styleeditor.activeElement.element).attr('id')] );
                $(styleeditor.activeElement.element).removeClass( themify_get ).addClass( styleeditor._oldIcon[$(styleeditor.activeElement.element).attr('id')] );
                // LEADGEN BUILDER - added below code //

                if( styleeditor.activeElement.sandbox ) {
                    $(styleeditor.activeElement.element).removeClass( get ).addClass( styleeditor._oldIcon[$(styleeditor.activeElement.element).attr('id')] );
                    $(styleeditor.activeElement.element).removeClass( themify_get ).addClass( styleeditor._oldIcon[$(styleeditor.activeElement.element).attr('id')] );
                }
                // End LEADGEN BUILDER code //

                $('select#icons option').each(function(){
                    if( $(this).val() === styleeditor._oldIcon[$(styleeditor.activeElement.element).attr('id')] ) {
                        $(this).prop('selected', true);
                        $('#icons').trigger('chosen:updated');
                    }
                });
            }
            setTimeout( function(){styleeditor.buildeStyleElements( $(styleeditor.activeElement.element).attr('data-selector') );}, 550);
            siteBuilder.site.setPendingChanges(true);
        },


        resetSelectLinksPages: function() {
            $('#internalLinksDropdown').select2('val', '#');
        },

        resetSelectLinksInternal: function() {
            $('#pageLinksDropdown').select2('val', '#');
        },

        resetSelectAllLinks: function() {
            $('#internalLinksDropdown').select2('val', '#');
            $('#pageLinksDropdown').select2('val', '#');
            this.select();
        },

        /*
            hides file upload forms
        */
        hideFileUploads: function() {
            $('form#imageUploadForm').hide();
            $('#imageModal #uploadTabLI').hide();

        },


        /*
            closes the style editor
        */
        closeStyleEditor: function(){
            $('header').removeData('affix-top').addClass('affix');
           if( Object.keys(styleeditor.activeElement).length > 0 ) {
                styleeditor.activeElement.removeOutline();
                styleeditor.activeElement.activate();
            }
            if( $('#styleEditor').css('left') === '0px' ) {
                styleeditor.toggleSidePanel('close');
            }
        },
        /*
            toggles the side panel
        */
        toggleSidePanel: function(val) {

            if( val === 'open' && $('#styleEditor').css('left') === '-300px' ) {
                $('#styleEditor').animate({'left': '0px'}, 250);
            } else if( val === 'close' && $('#styleEditor').css('left') === '0px' ) {
                $('#styleEditor').animate({'left': '-300px'}, 250);
            }
        },
        /*
            Event handler for when this mode gets deactivated
        */
        deActivateMode: function() {

            if( Object.keys( styleeditor.activeElement ).length > 0 ) {
                styleeditor.closeStyleEditor();
            }

            //deactivate all style items on the canvas
            for( var i =0; i < styleeditor.allStyleItemsOnCanvas.length; i++ ) {
                styleeditor.allStyleItemsOnCanvas[i].deactivate();
            }

            //Add overlay again
            // for(var i = 1; i <= $("ul#page1 li").length; i++){
            //     var id = "#ui-id-" + i;
            //     alert(id);
            //     // overlay = $('<span class="overlay"><span class="fui-eye"></span></span>');
            //     // $(id).contents().find('a.over').append( overlay );
            // }
        }

    };

    styleeditor.init();
    exports.styleeditor = styleeditor;

}());
},{"../vendor/publisher":11,"./builder.js":2,"./canvasElement.js":3,"./config.js":4}],9:[function(require,module,exports){
(function () {

/* globals siteUrl:false, baseUrl:false */
    "use strict";
        
    var appUI = {
        
        firstMenuWidth: 220,
        secondMenuWidth: 300,
        loaderAnimation: document.getElementById('loader'),
        secondMenuTriggerContainers: $('#menu #main #elementCats, #menu #main #templatesUl'),
        siteUrl: siteUrl,
        baseUrl: baseUrl,
        setup: function(){
            
            // Fade the loader animation
            $(appUI.loaderAnimation).fadeOut(function(){
                $('#menu').animate({'left': -appUI.firstMenuWidth}, 1000);
            });
           // Tabs
            $(".nav-tabs a").on('click', function (e) {
                e.preventDefault();
                $(this).tab("show");
            });
            
            $("select.select").select2();
            $(':radio, :checkbox').radiocheck();
            // Tooltips
            $("[data-toggle=tooltip]").tooltip("hide");
            // Table: Toggle all checkboxes
            $('.table .toggle-all :checkbox').on('click', function () {
                var $this = $(this);
                var ch = $this.prop('checked');
                $this.closest('.table').find('tbody :checkbox').radiocheck(!ch ? 'uncheck' : 'check');
            });
            // Add style class name to a tooltips
            $(".tooltip").addClass(function() {
                if ($(this).prev().attr("data-tooltip-style")) {
                    return "tooltip-" + $(this).prev().attr("data-tooltip-style");
                }
            });
            $(".btn-group").on('click', "a", function() {
                $(this).siblings().removeClass("active").end().addClass("active");
            });
            
            // Focus state for append/prepend inputs
            $('.input-group').on('focus', '.form-control', function () {
                $(this).closest('.input-group, .form-group').addClass('focus');
            }).on('blur', '.form-control', function () {
                $(this).closest('.input-group, .form-group').removeClass('focus');
            });
             // Table: Toggle all checkboxes
            $('.table .toggle-all').on('click', function() {
                var ch = $(this).find(':checkbox').prop('checked');
                $(this).closest('.table').find('tbody :checkbox').checkbox(!ch ? 'check' : 'uncheck');
            });
            // Table: Add class row selected
            $('.table tbody :checkbox').on('check uncheck toggle', function (e) {
                var $this = $(this)
                , check = $this.prop('checked')
                , toggle = e.type === 'toggle'
                , checkboxes = $('.table tbody :checkbox')
                , checkAll = checkboxes.length === checkboxes.filter(':checked').length;
                $this.closest('tr')[check ? 'addClass' : 'removeClass']('selected-row');
                if (toggle) $this.closest('.table').find('.toggle-all :checkbox').checkbox(checkAll ? 'check' : 'uncheck');
            });
            
            // Switch
            $("[data-toggle='switch']").wrap('<div class="switch" />').parent().bootstrapSwitch();
            appUI.secondMenuTriggerContainers.on('click', 'a:not(.btn)', appUI.secondMenuAnimation);
        },
        
        secondMenuAnimation: function(){
        
            $('#menu #main a').removeClass('active');
            $(this).addClass('active');
            //show only the right elements
            $('#menu #second ul li').hide();
            $('#menu #second ul li.'+$(this).attr('id')).show();
            if( $(this).attr('id') === 'all' ) {
                $('#menu #second ul#elements li').show();

            }
            $('.menu .second').css('display', 'block').stop().animate({
                width: appUI.secondMenuWidth
            }, 500); 
            
        }
    };
    
    //initiate the UI
    appUI.setup();
    //**** EXPORTS
    module.exports.appUI = appUI;
    
}());
},{}],10:[function(require,module,exports){
(function () {
    "use strict";
    
    exports.getRandomArbitrary = function(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    };
    
}());
},{}],11:[function(require,module,exports){
/*!
 * publisher.js - (c) Ryan Florence 2011
 * github.com/rpflorence/publisher.js
 * MIT License
*/

// UMD Boilerplate \o/ && D:
(function (root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory(); // node
  } else if (typeof define === 'function' && define.amd) {
    define(factory); // amd
  } else {
    // window with noConflict
    var _publisher = root.publisher;
    var publisher = root.publisher = factory();
    root.publisher.noConflict = function () {
      root.publisher = _publisher;
      return publisher;
    }
  }
}(this, function () {

  var publisher = function (obj) {
    var topics = {};
    obj = obj || {};

    obj.publish = function (topic/*, messages...*/) {
      if (!topics[topic]) return obj;
      var messages = [].slice.call(arguments, 1);
      for (var i = 0, l = topics[topic].length; i < l; i++) {
        topics[topic][i].handler.apply(topics[topic][i].context, messages);
      }
      return obj;
    };

    obj.subscribe = function (topicOrSubscriber, handlerOrTopics) {
      var firstType = typeof topicOrSubscriber;

      if (firstType === 'string') {
        return subscribe.apply(null, arguments);
      }

      if (firstType === 'object' && !handlerOrTopics) {
        return subscribeMultiple.apply(null, arguments);
      }

      if (typeof handlerOrTopics === 'string') {
        return hitch.apply(null, arguments);
      }

      return hitchMultiple.apply(null, arguments);
    };

    function subscribe (topic, handler, context) {
      var reference = { handler: handler, context: context || obj };
      topic = topics[topic] || (topics[topic] = []);
      topic.push(reference);
      return {
        attach: function () {
          topic.push(reference);
          return this;
        },
        detach: function () {
          erase(topic, reference);
          return this;
        }
      };
    };

    function subscribeMultiple (pairs) {
      var subscriptions = {};
      for (var topic in pairs) {
        if (!pairs.hasOwnProperty(topic)) continue;
        subscriptions[topic] = subscribe(topic, pairs[topic]);
      }
      return subscriptions;
    };

    function hitch (subscriber, topic) {
      return subscribe(topic, subscriber[topic], subscriber);
    };

    function hitchMultiple (subscriber, topics) {
      var subscriptions = [];
      for (var i = 0, l = topics.length; i < l; i++) {
        subscriptions.push( hitch(subscriber, topics[i]) );
      }
      return subscriptions;
    };

    function erase (arr, victim) {
      for (var i = 0, l = arr.length; i < l; i++){
        if (arr[i] === victim) arr.splice(i, 1);
      }
    }

    return obj;
  };

  // publisher is a publisher, so meta ...
  return publisher(publisher);
}));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9idWlsZGVyLmpzIiwianMvbW9kdWxlcy9idWlsZGVyLmpzIiwianMvbW9kdWxlcy9jYW52YXNFbGVtZW50LmpzIiwianMvbW9kdWxlcy9jb25maWcuanMiLCJqcy9tb2R1bGVzL2NvbnRlbnQuanMiLCJqcy9tb2R1bGVzL2V4cG9ydC5qcyIsImpzL21vZHVsZXMvcHJldmlldy5qcyIsImpzL21vZHVsZXMvc3R5bGVlZGl0b3IuanMiLCJqcy9tb2R1bGVzL3VpLmpzIiwianMvbW9kdWxlcy91dGlscy5qcyIsImpzL3ZlbmRvci9wdWJsaXNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDajFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0bUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcdFxuXG5cdHJlcXVpcmUoJy4vbW9kdWxlcy9jb25maWcuanMnKTtcblx0cmVxdWlyZSgnLi9tb2R1bGVzL3VpLmpzJyk7XG5cdHJlcXVpcmUoJy4vbW9kdWxlcy9idWlsZGVyLmpzJyk7XG5cdHJlcXVpcmUoJy4vbW9kdWxlcy91dGlscy5qcycpO1xuXHRyZXF1aXJlKCcuL21vZHVsZXMvY2FudmFzRWxlbWVudC5qcycpO1xuXHRyZXF1aXJlKCcuL21vZHVsZXMvc3R5bGVlZGl0b3IuanMnKTtcblx0cmVxdWlyZSgnLi9tb2R1bGVzL2NvbnRlbnQuanMnKTtcblx0cmVxdWlyZSgnLi9tb2R1bGVzL2V4cG9ydC5qcycpO1xuXHRyZXF1aXJlKCcuL21vZHVsZXMvcHJldmlldy5qcycpO1xuXG59KCkpOyIsIihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIHNpdGVCdWlsZGVyVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG4gICAgdmFyIGJDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy5qcycpO1xuICAgIHZhciBhcHBVSSA9IHJlcXVpcmUoJy4vdWkuanMnKS5hcHBVSTtcblxuXG5cdCAvKlxuICAgICAgICBCYXNpYyBCdWlsZGVyIFVJIGluaXRpYWxpc2F0aW9uXG4gICAgKi9cbiAgICB2YXIgYnVpbGRlclVJID0ge1xuICAgICAgICBcbiAgICAgICAgYWxsQmxvY2tzOiB7fSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9ob2xkcyBhbGwgYmxvY2tzIGxvYWRlZCBmcm9tIHRoZSBzZXJ2ZXJcbiAgICAgICAgbWVudVdyYXBwZXI6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51JyksXG4gICAgICAgIHByaW1hcnlTaWRlTWVudVdyYXBwZXI6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluJyksXG4gICAgICAgIGJ1dHRvbkJhY2s6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYWNrQnV0dG9uJyksXG4gICAgICAgIGJ1dHRvbkJhY2tDb25maXJtOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGVhdmVQYWdlQnV0dG9uJyksXG4gICAgICAgIFxuICAgICAgICBzaXRlQnVpbGRlck1vZGVzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2l0ZUJ1aWxkZXJNb2RlcycpLFxuICAgICAgICBhY2VFZGl0b3JzOiB7fSxcbiAgICAgICAgZnJhbWVDb250ZW50czogJycsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2hvbGRzIGZyYW1lIGNvbnRlbnRzXG4gICAgICAgIHRlbXBsYXRlSUQ6IDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9ob2xkcyB0aGUgdGVtcGxhdGUgSUQgZm9yIGEgcGFnZSAoPz8/KVxuICAgICAgICByYWRpb0Jsb2NrTW9kZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGVCbG9jaycpLFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBtb2RhbERlbGV0ZUJsb2NrOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVsZXRlQmxvY2snKSxcbiAgICAgICAgbW9kYWxSZXNldEJsb2NrOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzZXRCbG9jaycpLFxuICAgICAgICBtb2RhbERlbGV0ZVBhZ2U6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWxldGVQYWdlJyksXG4gICAgICAgIGJ1dHRvbkRlbGV0ZVBhZ2VDb25maXJtOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVsZXRlUGFnZUNvbmZpcm0nKSxcbiAgICAgICAgXG4gICAgICAgIGRyb3Bkb3duUGFnZUxpbmtzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW50ZXJuYWxMaW5rc0Ryb3Bkb3duJyksXG4gICAgICAgIFxuICAgICAgICB0ZW1wRnJhbWU6IHt9LFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpbml0OiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2xvYWQgYmxvY2tzXG4gICAgICAgICAgICAkLmdldEpTT04oJ2VsZW1lbnRzLmpzb24/dj0xMjM0NTY3OCcsIGZ1bmN0aW9uKGRhdGEpeyBidWlsZGVyVUkuYWxsQmxvY2tzID0gZGF0YTsgYnVpbGRlclVJLmltcGxlbWVudEJsb2NrcygpOyB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9zaXRlYmFyIGhvdmVyIGFuaW1hdGlvbiBhY3Rpb25cbiAgICAgICAgICAgICQodGhpcy5tZW51V3JhcHBlcikub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICQodGhpcykuc3RvcCgpLmFuaW1hdGUoeydsZWZ0JzogJzBweCd9LCA1MDApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICQodGhpcykuc3RvcCgpLmFuaW1hdGUoeydsZWZ0JzogJy0xOTBweCd9LCA1MDApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICQoJyNtZW51ICNtYWluIGEnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgJCgnLm1lbnUgLnNlY29uZCcpLnN0b3AoKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDBcbiAgICAgICAgICAgICAgICB9LCA1MDAsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICQoJyNtZW51ICNzZWNvbmQnKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9KS5hbmltYXRlKHsnbGVmdCc6ICctMTkwcHgnfSwgNTAwKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9wcmV2ZW50IGNsaWNrIGV2ZW50IG9uIGFuY29ycyBpbiB0aGUgYmxvY2sgc2VjdGlvbiBvZiB0aGUgc2lkZWJhclxuICAgICAgICAgICAgJCh0aGlzLnByaW1hcnlTaWRlTWVudVdyYXBwZXIpLm9uKCdjbGljaycsICdhOm5vdCguYWN0aW9uQnV0dG9ucyknLCBmdW5jdGlvbihlKXtlLnByZXZlbnREZWZhdWx0KCk7fSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQodGhpcy5idXR0b25CYWNrKS5vbignY2xpY2snLCB0aGlzLmJhY2tCdXR0b24pO1xuICAgICAgICAgICAgJCh0aGlzLmJ1dHRvbkJhY2tDb25maXJtKS5vbignY2xpY2snLCB0aGlzLmJhY2tCdXR0b25Db25maXJtKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9ub3RpZnkgdGhlIHVzZXIgb2YgcGVuZGluZyBjaG5hZ2VzIHdoZW4gY2xpY2tpbmcgdGhlIGJhY2sgYnV0dG9uXG4gICAgICAgICAgICAkKHdpbmRvdykuYmluZCgnYmVmb3JldW5sb2FkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBpZiggc2l0ZS5wZW5kaW5nQ2hhbmdlcyA9PT0gdHJ1ZSApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdZb3VyIHNpdGUgY29udGFpbnMgY2hhbmdlZCB3aGljaCBoYXZlblxcJ3QgYmVlbiBzYXZlZCB5ZXQuIEFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBsZWF2ZT8nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL21ha2Ugc3VyZSB3ZSBzdGFydCBpbiBibG9jayBtb2RlXG4gICAgICAgICAgICAkKHRoaXMucmFkaW9CbG9ja01vZGUpLnJhZGlvY2hlY2soJ2NoZWNrJykub24oJ2NsaWNrJywgdGhpcy5hY3RpdmF0ZUJsb2NrTW9kZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgYnVpbGRzIHRoZSBibG9ja3MgaW50byB0aGUgc2l0ZSBiYXJcbiAgICAgICAgKi9cbiAgICAgICAgaW1wbGVtZW50QmxvY2tzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyIG5ld0l0ZW0sIGxvYWRlckZ1bmN0aW9uO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IoIHZhciBrZXkgaW4gdGhpcy5hbGxCbG9ja3MuZWxlbWVudHMgKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIG5pY2VLZXkgPSBrZXkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKFwiIFwiLCBcIl9cIik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgJCgnPGxpPjxhIGhyZWY9XCJcIiBpZD1cIicrbmljZUtleSsnXCI+JytrZXkrJzwvYT48L2xpPicpLmFwcGVuZFRvKCcjbWVudSAjbWFpbiB1bCNlbGVtZW50Q2F0cycpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciggdmFyIHggPSAwOyB4IDwgdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XS5sZW5ndGg7IHgrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmKCB0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLnRodW1ibmFpbCA9PT0gbnVsbCApIHsvL3dlJ2xsIG5lZWQgYW4gaWZyYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYnVpbGQgdXMgc29tZSBpZnJhbWVzIVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS5zYW5kYm94ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCB0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLmxvYWRlckZ1bmN0aW9uICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZXJGdW5jdGlvbiA9ICdkYXRhLWxvYWRlcmZ1bmN0aW9uPVwiJyt0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLmxvYWRlckZ1bmN0aW9uKydcIic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0gPSAkKCc8bGkgY2xhc3M9XCJlbGVtZW50ICcrbmljZUtleSsnXCI+PGlmcmFtZSBzcmM9XCInK3RoaXMuYWxsQmxvY2tzLmVsZW1lbnRzW2tleV1beF0udXJsKydcIiBzY3JvbGxpbmc9XCJub1wiIHNhbmRib3g9XCJhbGxvdy1zYW1lLW9yaWdpblwiPjwvaWZyYW1lPjwvbGk+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SXRlbSA9ICQoJzxsaSBjbGFzcz1cImVsZW1lbnQgJytuaWNlS2V5KydcIj48aWZyYW1lIHNyYz1cImFib3V0OmJsYW5rXCIgc2Nyb2xsaW5nPVwibm9cIj48L2lmcmFtZT48L2xpPicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0uZmluZCgnaWZyYW1lJykudW5pcXVlSWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0uZmluZCgnaWZyYW1lJykuYXR0cignc3JjJywgdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS51cmwpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsvL3dlJ3ZlIGdvdCBhIHRodW1ibmFpbFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS5zYW5kYm94ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCB0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLmxvYWRlckZ1bmN0aW9uICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZXJGdW5jdGlvbiA9ICdkYXRhLWxvYWRlcmZ1bmN0aW9uPVwiJyt0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLmxvYWRlckZ1bmN0aW9uKydcIic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0gPSAkKCc8bGkgY2xhc3M9XCJlbGVtZW50ICcrbmljZUtleSsnXCI+PGltZyBzcmM9XCInK3RoaXMuYWxsQmxvY2tzLmVsZW1lbnRzW2tleV1beF0udGh1bWJuYWlsKydcIiBkYXRhLXNyY2M9XCInK3RoaXMuYWxsQmxvY2tzLmVsZW1lbnRzW2tleV1beF0udXJsKydcIiBkYXRhLWhlaWdodD1cIicrdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS5oZWlnaHQrJ1wiIGRhdGEtc2FuZGJveD1cIlwiICcrbG9hZGVyRnVuY3Rpb24rJz48L2xpPicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3SXRlbSA9ICQoJzxsaSBjbGFzcz1cImVsZW1lbnQgJytuaWNlS2V5KydcIj48aW1nIHNyYz1cIicrdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS50aHVtYm5haWwrJ1wiIGRhdGEtc3JjYz1cIicrdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS51cmwrJ1wiIGRhdGEtaGVpZ2h0PVwiJyt0aGlzLmFsbEJsb2Nrcy5lbGVtZW50c1trZXldW3hdLmhlaWdodCsnXCI+PC9saT4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG5ld0l0ZW0uYXBwZW5kVG8oJyNtZW51ICNzZWNvbmQgdWwjZWxlbWVudHMnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvL3pvb21lciB3b3Jrc1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGVIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiggdGhpcy5hbGxCbG9ja3MuZWxlbWVudHNba2V5XVt4XS5oZWlnaHQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZUhlaWdodCA9IHRoaXMuYWxsQmxvY2tzLmVsZW1lbnRzW2tleV1beF0uaGVpZ2h0KjAuMjU7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVIZWlnaHQgPSAnYXV0byc7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbmV3SXRlbS5maW5kKCdpZnJhbWUnKS56b29tZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgem9vbTogMC4yNSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAyNzAsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoZUhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiRHJhZyZEcm9wIE1lIVwiXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2RyYWdnYWJsZXNcbiAgICAgICAgICAgIGJ1aWxkZXJVSS5tYWtlRHJhZ2dhYmxlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBldmVudCBoYW5kbGVyIGZvciB3aGVuIHRoZSBiYWNrIGxpbmsgaXMgY2xpY2tlZFxuICAgICAgICAqL1xuICAgICAgICBiYWNrQnV0dG9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYoIHNpdGUucGVuZGluZ0NoYW5nZXMgPT09IHRydWUgKSB7XG4gICAgICAgICAgICAgICAgJCgnI2JhY2tNb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIGJ1dHRvbiBmb3IgY29uZmlybWluZyBsZWF2aW5nIHRoZSBwYWdlXG4gICAgICAgICovXG4gICAgICAgIGJhY2tCdXR0b25Db25maXJtOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2l0ZS5wZW5kaW5nQ2hhbmdlcyA9IGZhbHNlOy8vcHJldmVudCB0aGUgSlMgYWxlcnQgYWZ0ZXIgY29uZmlybWluZyB1c2VyIHdhbnRzIHRvIGxlYXZlXG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgYWN0aXZhdGVzIGJsb2NrIG1vZGVcbiAgICAgICAgKi9cbiAgICAgICAgYWN0aXZhdGVCbG9ja01vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBzaXRlLmFjdGl2ZVBhZ2UudG9nZ2xlRnJhbWVDb3ZlcnMoJ09uJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vdHJpZ2dlciBjdXN0b20gZXZlbnRcbiAgICAgICAgICAgICQoJ2JvZHknKS50cmlnZ2VyKCdtb2RlQmxvY2tzJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBtYWtlcyB0aGUgYmxvY2tzIGFuZCB0ZW1wbGF0ZXMgaW4gdGhlIHNpZGViYXIgZHJhZ2dhYmxlIG9udG8gdGhlIGNhbnZhc1xuICAgICAgICAqL1xuICAgICAgICBtYWtlRHJhZ2dhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgJCgnI2VsZW1lbnRzIGxpLCAjdGVtcGxhdGVzIGxpJykuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5kcmFnZ2FibGUoe1xuICAgICAgICAgICAgICAgICAgICBoZWxwZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6IDEwMHB4OyB3aWR0aDogMzAwcHg7IGJhY2tncm91bmQ6ICNGOUZBRkE7IGJveC1zaGFkb3c6IDVweCA1cHggMXB4IHJnYmEoMCwwLDAsMC4xKTsgdGV4dC1hbGlnbjogY2VudGVyOyBsaW5lLWhlaWdodDogMTAwcHg7IGZvbnQtc2l6ZTogMjhweDsgY29sb3I6ICMxNkEwODVcIj48c3BhbiBjbGFzcz1cImZ1aS1saXN0XCI+PC9zcGFuPjwvZGl2PicpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXZlcnQ6ICdpbnZhbGlkJyxcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kVG86ICdib2R5JyxcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdFRvU29ydGFibGU6ICcjcGFnZUxpc3QgPiB1bCcsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3N3aXRjaCB0byBibG9jayBtb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCdpbnB1dDpyYWRpb1tuYW1lPW1vZGVdJykucGFyZW50KCkuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCdpbnB1dDpyYWRpb1tuYW1lPW1vZGVdI21vZGVCbG9jaycpLnJhZGlvY2hlY2soJ2NoZWNrJyk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSk7IFxuICAgICAgICAgICAgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJCgnI2VsZW1lbnRzIGxpIGEnKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgJCh0aGlzKS51bmJpbmQoJ2NsaWNrJykuYmluZCgnY2xpY2snLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBJbXBsZW1lbnRzIHRoZSBzaXRlIG9uIHRoZSBjYW52YXMsIGNhbGxlZCBmcm9tIHRoZSBTaXRlIG9iamVjdCB3aGVuIHRoZSBzaXRlRGF0YSBoYXMgY29tcGxldGVkIGxvYWRpbmdcbiAgICAgICAgKi9cbiAgICAgICAgcG9wdWxhdGVDYW52YXM6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9pZiB3ZSBoYXZlIGFueSBibG9ja3MgYXQgYWxsLCBhY3RpdmF0ZSB0aGUgbW9kZXNcbiAgICAgICAgICAgIGlmKCBPYmplY3Qua2V5cyhzaXRlLnBhZ2VzKS5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgICAgIHZhciBtb2RlcyA9IGJ1aWxkZXJVSS5zaXRlQnVpbGRlck1vZGVzLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0W3R5cGU9XCJyYWRpb1wiXScpO1xuICAgICAgICAgICAgICAgIGZvciggaSA9IDA7IGkgPCBtb2Rlcy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kZXNbaV0ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpOyBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjb3VudGVyID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9sb29wIHRocm91Z2ggdGhlIHBhZ2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciggaSBpbiBzaXRlLnBhZ2VzICkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBuZXdQYWdlID0gbmV3IFBhZ2UoaSwgc2l0ZS5wYWdlc1tpXSwgY291bnRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvdW50ZXIrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vYWN0aXZhdGUgdGhlIGZpcnN0IHBhZ2VcbiAgICAgICAgICAgIGlmKHNpdGUuc2l0ZVBhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBzaXRlLnNpdGVQYWdlc1swXS5zZWxlY3RQYWdlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNpdGUuaXNFbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfTtcblxuXG4gICAgLypcbiAgICAgICAgUGFnZSBjb25zdHJ1Y3RvclxuICAgICovXG4gICAgZnVuY3Rpb24gUGFnZSAocGFnZU5hbWUsIHBhZ2UsIGNvdW50ZXIpIHtcbiAgICBcbiAgICAgICAgdGhpcy5uYW1lID0gcGFnZU5hbWUgfHwgXCJcIjtcbiAgICAgICAgdGhpcy5wYWdlSUQgPSBwYWdlLnBhZ2VzX2lkIHx8IDA7XG4gICAgICAgIHRoaXMuYmxvY2tzID0gW107XG4gICAgICAgIHRoaXMucGFyZW50VUwgPSB7fTsgLy9wYXJlbnQgVUwgb24gdGhlIGNhbnZhc1xuICAgICAgICB0aGlzLnN0YXR1cyA9ICcnOy8vJycsICduZXcnIG9yICdjaGFuZ2VkJ1xuICAgICAgICB0aGlzLnNjcmlwdHMgPSBbXTsvL3RyYWNrcyBzY3JpcHQgVVJMcyB1c2VkIG9uIHRoaXMgcGFnZVxuICAgICAgICBcbiAgICAgICAgdGhpcy5wYWdlU2V0dGluZ3MgPSB7XG4gICAgICAgICAgICB0aXRsZTogcGFnZS5wYWdlc190aXRsZSB8fCAnJyxcbiAgICAgICAgICAgIG1ldGFfZGVzY3JpcHRpb246IHBhZ2UubWV0YV9kZXNjcmlwdGlvbiB8fCAnJyxcbiAgICAgICAgICAgIG1ldGFfa2V5d29yZHM6IHBhZ2UubWV0YV9rZXl3b3JkcyB8fCAnJyxcbiAgICAgICAgICAgIGhlYWRlcl9pbmNsdWRlczogcGFnZS5oZWFkZXJfaW5jbHVkZXMgfHwgJycsXG4gICAgICAgICAgICBwYWdlX2NzczogcGFnZS5wYWdlX2NzcyB8fCAnJ1xuICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICB0aGlzLnBhZ2VNZW51VGVtcGxhdGUgPSAnPGEgaHJlZj1cIlwiIGNsYXNzPVwibWVudUl0ZW1MaW5rXCI+cGFnZTwvYT48c3BhbiBjbGFzcz1cInBhZ2VCdXR0b25zXCI+PGEgaHJlZj1cIlwiIGNsYXNzPVwiZmlsZUVkaXQgZnVpLW5ld1wiPjwvYT48YSBocmVmPVwiXCIgY2xhc3M9XCJmaWxlRGVsIGZ1aS1jcm9zc1wiPjxhIGNsYXNzPVwiYnRuIGJ0bi14cyBidG4tcHJpbWFyeSBidG4tZW1ib3NzZWQgZmlsZVNhdmUgZnVpLWNoZWNrXCIgaHJlZj1cIiNcIj48L2E+PC9zcGFuPjwvYT48L3NwYW4+JztcbiAgICAgICAgXG4gICAgICAgIHRoaXMubWVudUl0ZW0gPSB7fTsvL3JlZmVyZW5jZSB0byB0aGUgcGFnZXMgbWVudSBpdGVtIGZvciB0aGlzIHBhZ2UgaW5zdGFuY2VcbiAgICAgICAgdGhpcy5saW5rc0Ryb3Bkb3duSXRlbSA9IHt9Oy8vcmVmZXJlbmNlIHRvIHRoZSBsaW5rcyBkcm9wZG93biBpdGVtIGZvciB0aGlzIHBhZ2UgaW5zdGFuY2VcbiAgICAgICAgXG4gICAgICAgIHRoaXMucGFyZW50VUwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdVTCcpO1xuICAgICAgICB0aGlzLnBhcmVudFVMLnNldEF0dHJpYnV0ZSgnaWQnLCBcInBhZ2VcIitjb3VudGVyKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIG1ha2VzIHRoZSBjbGlja2VkIHBhZ2UgYWN0aXZlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc2VsZWN0UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzZWxlY3Q6Jyk7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMucGFnZVNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9tYXJrIHRoZSBtZW51IGl0ZW0gYXMgYWN0aXZlXG4gICAgICAgICAgICBzaXRlLmRlQWN0aXZhdGVBbGwoKTtcbiAgICAgICAgICAgICQodGhpcy5tZW51SXRlbSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2xldCBTaXRlIGtub3cgd2hpY2ggcGFnZSBpcyBjdXJyZW50bHkgYWN0aXZlXG4gICAgICAgICAgICBzaXRlLnNldEFjdGl2ZSh0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9kaXNwbGF5IHRoZSBuYW1lIG9mIHRoZSBhY3RpdmUgcGFnZSBvbiB0aGUgY2FudmFzXG4gICAgICAgICAgICBzaXRlLnBhZ2VUaXRsZS5pbm5lckhUTUwgPSB0aGlzLm5hbWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vbG9hZCB0aGUgcGFnZSBzZXR0aW5ncyBpbnRvIHRoZSBwYWdlIHNldHRpbmdzIG1vZGFsXG4gICAgICAgICAgICAvKnNpdGUuaW5wdXRQYWdlU2V0dGluZ3NUaXRsZS52YWx1ZSA9IHRoaXMucGFnZVNldHRpbmdzLnRpdGxlO1xuICAgICAgICAgICAgc2l0ZS5pbnB1dFBhZ2VTZXR0aW5nc01ldGFEZXNjcmlwdGlvbi52YWx1ZSA9IHRoaXMucGFnZVNldHRpbmdzLm1ldGFfZGVzY3JpcHRpb247XG4gICAgICAgICAgICBzaXRlLmlucHV0UGFnZVNldHRpbmdzTWV0YUtleXdvcmRzLnZhbHVlID0gdGhpcy5wYWdlU2V0dGluZ3MubWV0YV9rZXl3b3JkcztcbiAgICAgICAgICAgIHNpdGUuaW5wdXRQYWdlU2V0dGluZ3NJbmNsdWRlcy52YWx1ZSA9IHRoaXMucGFnZVNldHRpbmdzLmhlYWRlcl9pbmNsdWRlcztcbiAgICAgICAgICAgIHNpdGUuaW5wdXRQYWdlU2V0dGluZ3NQYWdlQ3NzLnZhbHVlID0gdGhpcy5wYWdlU2V0dGluZ3MucGFnZV9jc3M7Ki8gXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLy90cmlnZ2VyIGN1c3RvbSBldmVudFxuICAgICAgICAgICAgJCgnYm9keScpLnRyaWdnZXIoJ2NoYW5nZVBhZ2UnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9yZXNldCB0aGUgaGVpZ2h0cyBmb3IgdGhlIGJsb2NrcyBvbiB0aGUgY3VycmVudCBwYWdlXG4gICAgICAgICAgICBmb3IoIHZhciBpIGluIHRoaXMuYmxvY2tzICkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmKCBPYmplY3Qua2V5cyh0aGlzLmJsb2Nrc1tpXS5mcmFtZURvY3VtZW50KS5sZW5ndGggPiAwICl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmxvY2tzW2ldLmhlaWdodEFkanVzdG1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9zaG93IHRoZSBlbXB0eSBtZXNzYWdlP1xuICAgICAgICAgICAgdGhpcy5pc0VtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBjaGFuZ2VkIHRoZSBsb2NhdGlvbi9vcmRlciBvZiBhIGJsb2NrIHdpdGhpbiBhIHBhZ2VcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKGZyYW1lSUQsIG5ld1Bvcykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL3dlJ2xsIG5lZWQgdGhlIGJsb2NrIG9iamVjdCBjb25uZWN0ZWQgdG8gaWZyYW1lIHdpdGggZnJhbWVJRFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IodmFyIGkgaW4gdGhpcy5ibG9ja3MpIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiggdGhpcy5ibG9ja3NbaV0uZnJhbWUuZ2V0QXR0cmlidXRlKCdpZCcpID09PSBmcmFtZUlEICkge1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9jaGFuZ2UgdGhlIHBvc2l0aW9uIG9mIHRoaXMgYmxvY2sgaW4gdGhlIGJsb2NrcyBhcnJheVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJsb2Nrcy5zcGxpY2UobmV3UG9zLCAwLCB0aGlzLmJsb2Nrcy5zcGxpY2UoaSwgMSlbMF0pO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBkZWxldGUgYmxvY2sgZnJvbSBibG9ja3MgYXJyYXlcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZWxldGVCbG9jayA9IGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vcmVtb3ZlIGZyb20gYmxvY2tzIGFycmF5XG4gICAgICAgICAgICBmb3IoIHZhciBpIGluIHRoaXMuYmxvY2tzICkge1xuICAgICAgICAgICAgICAgIGlmKCB0aGlzLmJsb2Nrc1tpXSA9PT0gYmxvY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vZm91bmQgaXQsIHJlbW92ZSBmcm9tIGJsb2NrcyBhcnJheVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJsb2Nrcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuICAgICAgICAgICAgXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgdG9nZ2xlcyBhbGwgYmxvY2sgZnJhbWVDb3ZlcnMgb24gdGhpcyBwYWdlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMudG9nZ2xlRnJhbWVDb3ZlcnMgPSBmdW5jdGlvbihvbk9yT2ZmKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciggdmFyIGkgaW4gdGhpcy5ibG9ja3MgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2Nrc1tpXS50b2dnbGVDb3Zlcihvbk9yT2ZmKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIHNldHVwIGZvciBlZGl0aW5nIGEgcGFnZSBuYW1lXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuZWRpdFBhZ2VOYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKCAhdGhpcy5tZW51SXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXQnKSApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vaGlkZSB0aGUgbGlua1xuICAgICAgICAgICAgICAgIHRoaXMubWVudUl0ZW0ucXVlcnlTZWxlY3RvcignYS5tZW51SXRlbUxpbmsnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9pbnNlcnQgdGhlIGlucHV0IGZpZWxkXG4gICAgICAgICAgICAgICAgdmFyIG5ld0lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBuZXdJbnB1dC50eXBlID0gJ3RleHQnO1xuICAgICAgICAgICAgICAgIG5ld0lucHV0LnNldEF0dHJpYnV0ZSgnbmFtZScsICdwYWdlJyk7XG4gICAgICAgICAgICAgICAgbmV3SW5wdXQuc2V0QXR0cmlidXRlKCd2YWx1ZScsIHRoaXMubmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5tZW51SXRlbS5pbnNlcnRCZWZvcmUobmV3SW5wdXQsIHRoaXMubWVudUl0ZW0uZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5ld0lucHV0LmZvY3VzKCk7XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciB0bXBTdHIgPSBuZXdJbnB1dC5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XG4gICAgICAgICAgICAgICAgbmV3SW5wdXQuc2V0QXR0cmlidXRlKCd2YWx1ZScsICcnKTtcbiAgICAgICAgICAgICAgICBuZXdJbnB1dC5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdG1wU3RyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLm1lbnVJdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXQnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgVXBkYXRlcyB0aGlzIHBhZ2UncyBuYW1lIChldmVudCBoYW5kbGVyIGZvciB0aGUgc2F2ZSBidXR0b24pXG4gICAgICAgICovXG4gICAgICAgIHRoaXMudXBkYXRlUGFnZU5hbWVFdmVudCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKCB0aGlzLm1lbnVJdGVtLmNsYXNzTGlzdC5jb250YWlucygnZWRpdCcpICkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9lbCBpcyB0aGUgY2xpY2tlZCBidXR0b24sIHdlJ2xsIG5lZWQgYWNjZXNzIHRvIHRoZSBpbnB1dFxuICAgICAgICAgICAgICAgIHZhciB0aGVJbnB1dCA9IHRoaXMubWVudUl0ZW0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInBhZ2VcIl0nKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvL21ha2Ugc3VyZSB0aGUgcGFnZSdzIG5hbWUgaXMgT0tcbiAgICAgICAgICAgICAgICBpZiggc2l0ZS5jaGVja1BhZ2VOYW1lKHRoZUlucHV0LnZhbHVlKSApIHtcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lID0gc2l0ZS5wcmVwUGFnZU5hbWUoIHRoZUlucHV0LnZhbHVlICk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZW51SXRlbS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwicGFnZVwiXScpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lbnVJdGVtLnF1ZXJ5U2VsZWN0b3IoJ2EubWVudUl0ZW1MaW5rJykuaW5uZXJIVE1MID0gdGhpcy5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lbnVJdGVtLnF1ZXJ5U2VsZWN0b3IoJ2EubWVudUl0ZW1MaW5rJykuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZW51SXRlbS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0Jyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vdXBkYXRlIHRoZSBsaW5rcyBkcm9wZG93biBpdGVtXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlua3NEcm9wZG93bkl0ZW0udGV4dCA9IHRoaXMubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5rc0Ryb3Bkb3duSXRlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdGhpcy5uYW1lK1wiLmh0bWxcIik7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvL3VwZGF0ZSB0aGUgcGFnZSBuYW1lIG9uIHRoZSBjYW52YXNcbiAgICAgICAgICAgICAgICAgICAgc2l0ZS5wYWdlVGl0bGUuaW5uZXJIVE1MID0gdGhpcy5uYW1lO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vY2hhbmdlZCBwYWdlIHRpdGxlLCB3ZSd2ZSBnb3QgcGVuZGluZyBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgICAgIHNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KHNpdGUucGFnZU5hbWVFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIGRlbGV0ZXMgdGhpcyBlbnRpcmUgcGFnZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2RlbGV0ZSBmcm9tIHRoZSBTaXRlXG4gICAgICAgICAgICBmb3IoIHZhciBpIGluIHNpdGUuc2l0ZVBhZ2VzICkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmKCBzaXRlLnNpdGVQYWdlc1tpXSA9PT0gdGhpcyApIHsvL2dvdCBhIG1hdGNoIVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9kZWxldGUgZnJvbSBzaXRlLnNpdGVQYWdlc1xuICAgICAgICAgICAgICAgICAgICBzaXRlLnNpdGVQYWdlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvL2RlbGV0ZSBmcm9tIGNhbnZhc1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudFVMLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9hZGQgdG8gZGVsZXRlZCBwYWdlc1xuICAgICAgICAgICAgICAgICAgICBzaXRlLnBhZ2VzVG9EZWxldGUucHVzaCh0aGlzLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9kZWxldGUgdGhlIHBhZ2UncyBtZW51IGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZW51SXRlbS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vZGVsZXQgdGhlIHBhZ2VzIGxpbmsgZHJvcGRvd24gaXRlbVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmtzRHJvcGRvd25JdGVtLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9hY3RpdmF0ZSB0aGUgZmlyc3QgcGFnZVxuICAgICAgICAgICAgICAgICAgICBzaXRlLnNpdGVQYWdlc1swXS5zZWxlY3RQYWdlKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvL3BhZ2Ugd2FzIGRlbGV0ZWQsIHNvIHdlJ3ZlIGdvdCBwZW5kaW5nIGNoYW5nZXNcbiAgICAgICAgICAgICAgICAgICAgc2l0ZS5zZXRQZW5kaW5nQ2hhbmdlcyh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgY2hlY2tzIGlmIHRoZSBwYWdlIGlzIGVtcHR5LCBpZiBzbyBzaG93IHRoZSAnZW1wdHknIG1lc3NhZ2VcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5pc0VtcHR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKCB0aGlzLmJsb2Nrcy5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2l0ZS5tZXNzYWdlU3RhcnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICAgICAgc2l0ZS5kaXZGcmFtZVdyYXBwZXIuY2xhc3NMaXN0LmFkZCgnZW1wdHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHNpdGUubWVzc2FnZVN0YXJ0LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgc2l0ZS5kaXZGcmFtZVdyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSgnZW1wdHknKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBwcmVwcy9zdHJpcHMgdGhpcyBwYWdlIGRhdGEgZm9yIGEgcGVuZGluZyBhamF4IHJlcXVlc3RcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcmVwRm9yU2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgcGFnZSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHBhZ2UuYmxvY2tzID0gW107XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9wcm9jZXNzIHRoZSBibG9ja3NcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IoIHZhciB4ID0gMDsgeCA8IHRoaXMuYmxvY2tzLmxlbmd0aDsgeCsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGJsb2NrID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiggdGhpcy5ibG9ja3NbeF0uc2FuZGJveCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZnJhbWVzX2NvbnRlbnQgPSBcIjxodG1sPlwiKyQoJyNzYW5kYm94ZXMgIycrdGhpcy5ibG9ja3NbeF0uc2FuZGJveCkuY29udGVudHMoKS5maW5kKCdodG1sJykuaHRtbCgpK1wiPC9odG1sPlwiO1xuICAgICAgICAgICAgICAgICAgICBibG9jay5mcmFtZXNfc2FuZGJveCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmZyYW1lc19sb2FkZXJGdW5jdGlvbiA9IHRoaXMuYmxvY2tzW3hdLnNhbmRib3hfbG9hZGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBibG9jay5mcmFtZXNfY29udGVudCA9IHRoaXMuYmxvY2tzW3hdLmZyYW1lRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoICcjcGFnZScgKS5vdXRlckhUTUw7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmZyYW1lc19zYW5kYm94ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmZyYW1lc19sb2FkZXJGdW5jdGlvbiA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJsb2NrLmZyYW1lc19oZWlnaHQgPSB0aGlzLmJsb2Nrc1t4XS5mcmFtZUhlaWdodDtcbiAgICAgICAgICAgICAgICBibG9jay5mcmFtZXNfb3JpZ2luYWxfdXJsID0gdGhpcy5ibG9ja3NbeF0ub3JpZ2luYWxVcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcGFnZS5ibG9ja3MucHVzaChibG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHBhZ2U7XG4gICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgZ2VuZXJhdGVzIHRoZSBmdWxsIHBhZ2UsIHVzaW5nIHNrZWxldG9uLmh0bWxcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5mdWxsUGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgcGFnZSA9IHRoaXM7Ly9yZWZlcmVuY2UgdG8gc2VsZiBmb3IgbGF0ZXJcbiAgICAgICAgICAgIHBhZ2Uuc2NyaXB0cyA9IFtdOy8vbWFrZSBzdXJlIGl0J3MgZW1wdHksIHdlJ2xsIHN0b3JlIHNjcmlwdCBVUkxzIGluIHRoZXJlIGxhdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBuZXdEb2NNYWluUGFyZW50ID0gJCgnaWZyYW1lI3NrZWxldG9uJykuY29udGVudHMoKS5maW5kKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9lbXB0eSBvdXQgdGhlIHNrZWxldG9uIGZpcnN0XG4gICAgICAgICAgICAkKCdpZnJhbWUjc2tlbGV0b24nKS5jb250ZW50cygpLmZpbmQoIGJDb25maWcucGFnZUNvbnRhaW5lciApLmh0bWwoJycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL3JlbW92ZSBvbGQgc2NyaXB0IHRhZ3NcbiAgICAgICAgICAgICQoJ2lmcmFtZSNza2VsZXRvbicpLmNvbnRlbnRzKCkuZmluZCggJ3NjcmlwdCcgKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgdGhlQ29udGVudHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciggdmFyIGkgaW4gdGhpcy5ibG9ja3MgKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9ncmFiIHRoZSBibG9jayBjb250ZW50XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYmxvY2tzW2ldLnNhbmRib3ggIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGVDb250ZW50cyA9ICQoJyNzYW5kYm94ZXMgIycrdGhpcy5ibG9ja3NbaV0uc2FuZGJveCkuY29udGVudHMoKS5maW5kKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGVDb250ZW50cyA9ICQodGhpcy5ibG9ja3NbaV0uZnJhbWVEb2N1bWVudC5ib2R5KS5maW5kKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9yZW1vdmUgdmlkZW8gZnJhbWVDb3ZlcnNcbiAgICAgICAgICAgICAgICB0aGVDb250ZW50cy5maW5kKCcuZnJhbWVDb3ZlcicpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vcmVtb3ZlIHZpZGVvIGZyYW1lV3JhcHBlcnNcbiAgICAgICAgICAgICAgICB0aGVDb250ZW50cy5maW5kKCcudmlkZW9XcmFwcGVyJykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNudCA9ICQodGhpcykuY29udGVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZXBsYWNlV2l0aChjbnQpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvL3JlbW92ZSBzdHlsZSBsZWZ0b3ZlcnMgZnJvbSB0aGUgc3R5bGUgZWRpdG9yXG4gICAgICAgICAgICAgICAgZm9yKCB2YXIga2V5IGluIGJDb25maWcuZWRpdGFibGVJdGVtcyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhlQ29udGVudHMuZmluZCgga2V5ICkuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUF0dHIoJ2RhdGEtc2VsZWN0b3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoJ291dGxpbmUnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcygnb3V0bGluZS1vZmZzZXQnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcygnY3Vyc29yJywgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS5hdHRyKCdzdHlsZScpID09PSAnJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvL3JlbW92ZSBzdHlsZSBsZWZ0b3ZlcnMgZnJvbSB0aGUgY29udGVudCBlZGl0b3JcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgeCA9IDA7IHggPCBiQ29uZmlnLmVkaXRhYmxlQ29udGVudC5sZW5ndGg7ICsreCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhlQ29udGVudHMuZmluZCggYkNvbmZpZy5lZGl0YWJsZUNvbnRlbnRbeF0gKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQXR0cignZGF0YS1zZWxlY3RvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vYXBwZW5kIHRvIERPTSBpbiB0aGUgc2tlbGV0b25cbiAgICAgICAgICAgICAgICBuZXdEb2NNYWluUGFyZW50LmFwcGVuZCggJCh0aGVDb250ZW50cy5odG1sKCkpICk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9kbyB3ZSBuZWVkIHRvIGluamVjdCBhbnkgc2NyaXB0cz9cbiAgICAgICAgICAgICAgICB2YXIgc2NyaXB0cyA9ICQodGhpcy5ibG9ja3NbaV0uZnJhbWVEb2N1bWVudC5ib2R5KS5maW5kKCdzY3JpcHQnKTtcbiAgICAgICAgICAgICAgICB2YXIgdGhlSWZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJza2VsZXRvblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYoIHNjcmlwdHMuc2l6ZSgpID4gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdHMuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NyaXB0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS50ZXh0KCkgIT09ICcnICkgey8vc2NyaXB0IHRhZ3Mgd2l0aCBjb250ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0ID0gdGhlSWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC5pbm5lckhUTUwgPSAkKHRoaXMpLnRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVJZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggJCh0aGlzKS5hdHRyKCdzcmMnKSAhPT0gbnVsbCAmJiBwYWdlLnNjcmlwdHMuaW5kZXhPZigkKHRoaXMpLmF0dHIoJ3NyYycpKSA9PT0gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy91c2UgaW5kZXhPZiB0byBtYWtlIHN1cmUgZWFjaCBzY3JpcHQgb25seSBhcHBlYXJzIG9uIHRoZSBwcm9kdWNlZCBwYWdlIG9uY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHQgPSB0aGVJZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0LnNyYyA9ICQodGhpcykuYXR0cignc3JjJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlSWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2Uuc2NyaXB0cy5wdXNoKCQodGhpcykuYXR0cignc3JjJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5zY3JpcHRzKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBjbGVhciBvdXQgdGhpcyBwYWdlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGJsb2NrID0gdGhpcy5ibG9ja3MucG9wKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoaWxlKCBibG9jayAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJsb2NrLmRlbGV0ZSgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJsb2NrID0gdGhpcy5ibG9ja3MucG9wKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy9sb29wIHRocm91Z2ggdGhlIGZyYW1lcy9ibG9ja3NcbiAgICAgICAgXG4gICAgICAgIGlmKCBwYWdlLmhhc093blByb3BlcnR5KCdibG9ja3MnKSApIHtcbiAgICAgICAgXG4gICAgICAgICAgICBmb3IoIHZhciB4ID0gMDsgeCA8IHBhZ2UuYmxvY2tzLmxlbmd0aDsgeCsrICkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9jcmVhdGUgbmV3IEJsb2NrXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgbmV3QmxvY2sgPSBuZXcgQmxvY2soKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHBhZ2UuYmxvY2tzW3hdLnNyYyA9IHBhZ2UuYmxvY2tzW3hdLmZyYW1lc19vcmlnaW5hbF91cmw7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9zYW5kYm94ZWQgYmxvY2s/XG4gICAgICAgICAgICAgICAgaWYoIHBhZ2UuYmxvY2tzW3hdLmZyYW1lc19zYW5kYm94ID09PSAnMScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbmV3QmxvY2suc2FuZGJveCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIG5ld0Jsb2NrLnNhbmRib3hfbG9hZGVyID0gcGFnZS5ibG9ja3NbeF0uZnJhbWVzX2xvYWRlcmZ1bmN0aW9uO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5ld0Jsb2NrLmZyYW1lSUQgPSBwYWdlLmJsb2Nrc1t4XS5mcmFtZXNfaWQ7XG4gICAgICAgICAgICAgICAgbmV3QmxvY2suY3JlYXRlUGFyZW50TEkocGFnZS5ibG9ja3NbeF0uZnJhbWVzX2hlaWdodCk7XG4gICAgICAgICAgICAgICAgbmV3QmxvY2suY3JlYXRlRnJhbWUocGFnZS5ibG9ja3NbeF0pO1xuICAgICAgICAgICAgICAgIG5ld0Jsb2NrLmNyZWF0ZUZyYW1lQ292ZXIoKTtcbiAgICAgICAgICAgICAgICBuZXdCbG9jay5pbnNlcnRCbG9ja0ludG9Eb20odGhpcy5wYXJlbnRVTCk7XG4gICAgICAgICAgICAgICAgbmV3QmxvY2suY29udGVudEFmdGVyTG9hZCA9IHBhZ2UuYmxvY2tzW3hdLmZyYW1lc19jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvL2FkZCB0aGUgYmxvY2sgdG8gdGhlIG5ldyBwYWdlXG4gICAgICAgICAgICAgICAgdGhpcy5ibG9ja3MucHVzaChuZXdCbG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy9hZGQgdGhpcyBwYWdlIHRvIHRoZSBzaXRlIG9iamVjdFxuICAgICAgICBzaXRlLnNpdGVQYWdlcy5wdXNoKCB0aGlzICk7XG4gICAgICAgIFxuICAgICAgICAvL3BsYW50IHRoZSBuZXcgVUwgaW4gdGhlIERPTSAob24gdGhlIGNhbnZhcylcbiAgICAgICAgc2l0ZS5kaXZDYW52YXMuYXBwZW5kQ2hpbGQodGhpcy5wYXJlbnRVTCk7XG4gICAgICAgIFxuICAgICAgICAvL21ha2UgdGhlIGJsb2Nrcy9mcmFtZXMgaW4gZWFjaCBwYWdlIHNvcnRhYmxlXG4gICAgICAgIFxuICAgICAgICB2YXIgdGhlUGFnZSA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAkKHRoaXMucGFyZW50VUwpLnNvcnRhYmxlKHtcbiAgICAgICAgICAgIHJldmVydDogdHJ1ZSxcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyOiBcImRyb3AtaG92ZXJcIixcbiAgICAgICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJlZm9yZVN0b3A6IGZ1bmN0aW9uKGV2ZW50LCB1aSl7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy90ZW1wbGF0ZSBvciByZWd1bGFyIGJsb2NrP1xuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gdWkuaXRlbS5hdHRyKCdkYXRhLWZyYW1lcycpO1xuXG4gICAgICAgICAgICAgICAgdmFyIG5ld0Jsb2NrO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF0dHIgIT09IHR5cGVvZiB1bmRlZmluZWQgJiYgYXR0ciAhPT0gZmFsc2UpIHsvL3RlbXBsYXRlLCBidWlsZCBpdFxuICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJCgnI3N0YXJ0JykuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvL2NsZWFyIG91dCBhbGwgYmxvY2tzIG9uIHRoaXMgcGFnZSAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhlUGFnZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9jcmVhdGUgdGhlIG5ldyBmcmFtZXNcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZyYW1lSURzID0gdWkuaXRlbS5hdHRyKCdkYXRhLWZyYW1lcycpLnNwbGl0KCctJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoZWlnaHRzID0gdWkuaXRlbS5hdHRyKCdkYXRhLWhlaWdodHMnKS5zcGxpdCgnLScpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXJscyA9IHVpLml0ZW0uYXR0cignZGF0YS1vcmlnaW5hbHVybHMnKS5zcGxpdCgnLScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciggdmFyIHggPSAwOyB4IDwgZnJhbWVJRHMubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3QmxvY2sgPSBuZXcgQmxvY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Jsb2NrLmNyZWF0ZVBhcmVudExJKGhlaWdodHNbeF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnJhbWVEYXRhID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lRGF0YS5zcmMgPSAnc2l0ZXMvZ2V0ZnJhbWUvJytmcmFtZUlEc1t4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lRGF0YS5mcmFtZXNfb3JpZ2luYWxfdXJsID0gJ3NpdGVzL2dldGZyYW1lLycrZnJhbWVJRHNbeF07XG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFtZURhdGEuZnJhbWVzX2hlaWdodCA9IGhlaWdodHNbeF07XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Jsb2NrLmNyZWF0ZUZyYW1lKCBmcmFtZURhdGEgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Jsb2NrLmNyZWF0ZUZyYW1lQ292ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Jsb2NrLmluc2VydEJsb2NrSW50b0RvbSh0aGVQYWdlLnBhcmVudFVMKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy9hZGQgdGhlIGJsb2NrIHRvIHRoZSBuZXcgcGFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhlUGFnZS5ibG9ja3MucHVzaChuZXdCbG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZHJvcHBlZCBlbGVtZW50LCBzbyB3ZSd2ZSBnb3QgcGVuZGluZyBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vc2V0IHRoZSB0ZW1wYXRlSURcbiAgICAgICAgICAgICAgICAgICAgYnVpbGRlclVJLnRlbXBsYXRlSUQgPSB1aS5pdGVtLmF0dHIoJ2RhdGEtcGFnZWlkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9tYWtlIHN1cmUgbm90aGluZyBnZXRzIGRyb3BwZWQgaW4gdGhlIGxzaXRcbiAgICAgICAgICAgICAgICAgICAgdWkuaXRlbS5odG1sKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vZGVsZXRlIGRyYWcgcGxhY2UgaG9sZGVyXG4gICAgICAgICAgICAgICAgICAgICQoJ2JvZHkgLnVpLXNvcnRhYmxlLWhlbHBlcicpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2Ugey8vcmVndWxhciBibG9ja1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvL2FyZSB3ZSBkZWFsaW5nIHdpdGggYSBuZXcgYmxvY2sgYmVpbmcgZHJvcHBlZCBvbnRvIHRoZSBjYW52YXMsIG9yIGEgcmVvcmRlcmluZyBvZyBibG9ja3MgYWxyZWFkeSBvbiB0aGUgY2FudmFzP1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiggdWkuaXRlbS5maW5kKCcuZnJhbWVDb3ZlciA+IGJ1dHRvbicpLnNpemUoKSA+IDAgKSB7Ly9yZS1vcmRlcmluZyBvZiBibG9ja3Mgb24gY2FudmFzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy9ubyBuZWVkIHRvIGNyZWF0ZSBhIG5ldyBibG9jayBvYmplY3QsIHdlIHNpbXBseSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGUgcG9zaXRpb24gb2YgdGhlIGV4aXN0aW5nIGJsb2NrIGluIHRoZSBTaXRlIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgLy9pcyBjaGFuZ2VkIHRvIHJlZmxlY3QgdGhlIG5ldyBwb3NpdGlvbiBvZiB0aGUgYmxvY2sgb24gdGggY2FudmFzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZyYW1lSUQgPSB1aS5pdGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ2lkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3UG9zID0gdWkuaXRlbS5pbmRleCgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpdGUuYWN0aXZlUGFnZS5zZXRQb3NpdGlvbihmcmFtZUlELCBuZXdQb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Ugey8vbmV3IGJsb2NrIG9uIGNhbnZhc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvL25ldyBibG9jayAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdCbG9jayA9IG5ldyBCbG9jaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Jsb2NrLnBsYWNlT25DYW52YXModWkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbihldmVudCwgdWkpe1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiggdWkuaXRlbS5maW5kKCcuZnJhbWVDb3ZlcicpLnNpemUoKSAhPT0gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgYnVpbGRlclVJLmZyYW1lQ29udGVudHMgPSB1aS5pdGVtLmZpbmQoJ2lmcmFtZScpLmNvbnRlbnRzKCkuZmluZCggYkNvbmZpZy5wYWdlQ29udGFpbmVyICkuaHRtbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG92ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICQoJyNzdGFydCcpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvL2FkZCB0byB0aGUgcGFnZXMgbWVudVxuICAgICAgICB0aGlzLm1lbnVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnTEknKTtcbiAgICAgICAgdGhpcy5tZW51SXRlbS5pbm5lckhUTUwgPSB0aGlzLnBhZ2VNZW51VGVtcGxhdGU7XG4gICAgICAgIFxuICAgICAgICAkKHRoaXMubWVudUl0ZW0pLmZpbmQoJ2E6Zmlyc3QnKS50ZXh0KHBhZ2VOYW1lKS5hdHRyKCdocmVmJywgJyNwYWdlJytjb3VudGVyKTtcbiAgICAgICAgXG4gICAgICAgIHZhciB0aGVMaW5rID0gJCh0aGlzLm1lbnVJdGVtKS5maW5kKCdhOmZpcnN0JykuZ2V0KDApO1xuICAgICAgICBcbiAgICAgICAgLy9iaW5kIHNvbWUgZXZlbnRzXG4gICAgICAgIHRoaXMubWVudUl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLm1lbnVJdGVtLnF1ZXJ5U2VsZWN0b3IoJ2EuZmlsZUVkaXQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5tZW51SXRlbS5xdWVyeVNlbGVjdG9yKCdhLmZpbGVTYXZlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgIHRoaXMubWVudUl0ZW0ucXVlcnlTZWxlY3RvcignYS5maWxlRGVsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLCBmYWxzZSk7XG5cbiAgICAgICAgLy9ubyBkZWwgYnV0dG9uIGZvciB0aGUgaW5kZXggcGFnZVxuICAgICAgICBpZiggY291bnRlciA9PT0gMSApIHRoaXMubWVudUl0ZW0ucXVlcnlTZWxlY3RvcignYS5maWxlRGVsJykucmVtb3ZlKCk7XG4gICAgICAgIFxuICAgICAgICAvL2FkZCB0byB0aGUgcGFnZSBsaW5rIGRyb3Bkb3duXG4gICAgICAgIHRoaXMubGlua3NEcm9wZG93bkl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdPUFRJT04nKTtcbiAgICAgICAgdGhpcy5saW5rc0Ryb3Bkb3duSXRlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgcGFnZU5hbWUrXCIuaHRtbFwiKTtcbiAgICAgICAgdGhpcy5saW5rc0Ryb3Bkb3duSXRlbS50ZXh0ID0gcGFnZU5hbWU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGJ1aWxkZXJVSS5kcm9wZG93blBhZ2VMaW5rcy5hcHBlbmRDaGlsZCggdGhpcy5saW5rc0Ryb3Bkb3duSXRlbSApO1xuICAgICAgICBcbiAgICAgICAgc2l0ZS5wYWdlc01lbnUuYXBwZW5kQ2hpbGQodGhpcy5tZW51SXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBQYWdlLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHN3aXRjaCAoZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcImNsaWNrXCI6IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiggZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnZmlsZUVkaXQnKSApIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0UGFnZU5hbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKCBldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdmaWxlU2F2ZScpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVBhZ2VOYW1lRXZlbnQoZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbGVEZWwnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGVQYWdlID0gdGhpcztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJChidWlsZGVyVUkubW9kYWxEZWxldGVQYWdlKS5tb2RhbCgnc2hvdycpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJChidWlsZGVyVUkubW9kYWxEZWxldGVQYWdlKS5vZmYoJ2NsaWNrJywgJyNkZWxldGVQYWdlQ29uZmlybScpLm9uKCdjbGljaycsICcjZGVsZXRlUGFnZUNvbmZpcm0nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhlUGFnZS5kZWxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgJChidWlsZGVyVUkubW9kYWxEZWxldGVQYWdlKS5tb2RhbCgnaGlkZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdFBhZ2UoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvKlxuICAgICAgICBCbG9jayBjb25zdHJ1Y3RvclxuICAgICovXG4gICAgZnVuY3Rpb24gQmxvY2sgKCkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5mcmFtZUlEID0gMDtcbiAgICAgICAgdGhpcy5zYW5kYm94ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2FuZGJveF9sb2FkZXIgPSAnJztcbiAgICAgICAgdGhpcy5zdGF0dXMgPSAnJzsvLycnLCAnY2hhbmdlZCcgb3IgJ25ldydcbiAgICAgICAgdGhpcy5vcmlnaW5hbFVybCA9ICcnO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5wYXJlbnRMSSA9IHt9O1xuICAgICAgICB0aGlzLmZyYW1lQ292ZXIgPSB7fTtcbiAgICAgICAgdGhpcy5mcmFtZSA9IHt9O1xuICAgICAgICB0aGlzLmZyYW1lRG9jdW1lbnQgPSB7fTtcbiAgICAgICAgdGhpcy5mcmFtZUhlaWdodCA9IDA7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmFubm90ID0ge307XG4gICAgICAgIHRoaXMuYW5ub3RUaW1lb3V0ID0ge307XG5cbiAgICAgICAgdGhpcy5jb250ZW50QWZ0ZXJMb2FkID0gJyc7XG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgY3JlYXRlcyB0aGUgcGFyZW50IGNvbnRhaW5lciAoTEkpXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY3JlYXRlUGFyZW50TEkgPSBmdW5jdGlvbihoZWlnaHQpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5wYXJlbnRMSSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0xJJyk7XG4gICAgICAgICAgICB0aGlzLnBhcmVudExJLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZWxlbWVudCcpO1xuICAgICAgICAgICAgLy90aGlzLnBhcmVudExJLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnaGVpZ2h0OiAnK2hlaWdodCsncHgnKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIGNyZWF0ZXMgdGhlIGlmcmFtZSBvbiB0aGUgY2FudmFzXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuY3JlYXRlRnJhbWUgPSBmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnSUZSQU1FJyk7XG4gICAgICAgICAgICB0aGlzLmZyYW1lLnNldEF0dHJpYnV0ZSgnZnJhbWVib3JkZXInLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZnJhbWUuc2V0QXR0cmlidXRlKCdzY3JvbGxpbmcnLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZnJhbWUuc2V0QXR0cmlidXRlKCdzcmMnLCBmcmFtZS5zcmMpO1xuICAgICAgICAgICAgdGhpcy5mcmFtZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3JpZ2luYWx1cmwnLCBmcmFtZS5mcmFtZXNfb3JpZ2luYWxfdXJsKTtcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxVcmwgPSBmcmFtZS5mcmFtZXNfb3JpZ2luYWxfdXJsO1xuICAgICAgICAgICAgLy90aGlzLmZyYW1lLnNldEF0dHJpYnV0ZSgnZGF0YS1oZWlnaHQnLCBmcmFtZS5mcmFtZXNfaGVpZ2h0KTtcbiAgICAgICAgICAgIC8vdGhpcy5mcmFtZUhlaWdodCA9IGZyYW1lLmZyYW1lc19oZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLmZyYW1lLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnYmFja2dyb3VuZDogJytcIiNmZmZmZmYgdXJsKCdpbWFnZXMvbG9hZGluZy5naWYnKSA1MCUgNTAlIG5vLXJlcGVhdFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgJCh0aGlzLmZyYW1lKS51bmlxdWVJZCgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL3NhbmRib3g/XG4gICAgICAgICAgICBpZiggdGhpcy5zYW5kYm94ICE9PSBmYWxzZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmZyYW1lLnNldEF0dHJpYnV0ZSgnZGF0YS1sb2FkZXJmdW5jdGlvbicsIHRoaXMuc2FuZGJveF9sb2FkZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuZnJhbWUuc2V0QXR0cmlidXRlKCdkYXRhLXNhbmRib3gnLCB0aGlzLnNhbmRib3gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vcmVjcmVhdGUgdGhlIHNhbmRib3hlZCBpZnJhbWUgZWxzZXdoZXJlXG4gICAgICAgICAgICAgICAgdmFyIHNhbmRib3hlZEZyYW1lID0gJCgnPGlmcmFtZSBzcmM9XCInK2ZyYW1lLnNyYysnXCIgaWQ9XCInK3RoaXMuc2FuZGJveCsnXCIgc2FuZGJveD1cImFsbG93LXNhbWUtb3JpZ2luXCI+PC9pZnJhbWU+Jyk7XG4gICAgICAgICAgICAgICAgJCgnI3NhbmRib3hlcycpLmFwcGVuZCggc2FuZGJveGVkRnJhbWUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBpbnNlcnQgdGhlIGlmcmFtZSBpbnRvIHRoZSBET00gb24gdGhlIGNhbnZhc1xuICAgICAgICAqL1xuICAgICAgICB0aGlzLmluc2VydEJsb2NrSW50b0RvbSA9IGZ1bmN0aW9uKHRoZVVMKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMucGFyZW50TEkuYXBwZW5kQ2hpbGQodGhpcy5mcmFtZSk7XG4gICAgICAgICAgICB0aGVVTC5hcHBlbmRDaGlsZCggdGhpcy5wYXJlbnRMSSApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmZyYW1lLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgc2V0cyB0aGUgZnJhbWUgZG9jdW1lbnQgZm9yIHRoZSBibG9jaydzIGlmcmFtZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnNldEZyYW1lRG9jdW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9zZXQgdGhlIGZyYW1lIGRvY3VtZW50IGFzIHdlbGxcbiAgICAgICAgICAgIGlmKCB0aGlzLmZyYW1lLmNvbnRlbnREb2N1bWVudCApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyYW1lRG9jdW1lbnQgPSB0aGlzLmZyYW1lLmNvbnRlbnREb2N1bWVudDsgICBcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mcmFtZURvY3VtZW50ID0gdGhpcy5mcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL3RoaXMuaGVpZ2h0QWRqdXN0bWVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgY3JlYXRlcyB0aGUgZnJhbWUgY292ZXIgYW5kIGJsb2NrIGFjdGlvbiBidXR0b25cbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jcmVhdGVGcmFtZUNvdmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vYnVpbGQgdGhlIGZyYW1lIGNvdmVyIGFuZCBibG9jayBhY3Rpb24gYnV0dG9uc1xuICAgICAgICAgICAgdGhpcy5mcmFtZUNvdmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnRElWJyk7XG4gICAgICAgICAgICB0aGlzLmZyYW1lQ292ZXIuY2xhc3NMaXN0LmFkZCgnZnJhbWVDb3ZlcicpO1xuICAgICAgICAgICAgdGhpcy5mcmFtZUNvdmVyLmNsYXNzTGlzdC5hZGQoJ2ZyZXNoJyk7XG4gICAgICAgICAgICB0aGlzLmZyYW1lQ292ZXIuc3R5bGUuaGVpZ2h0ID0gdGhpcy5mcmFtZUhlaWdodCtcInB4XCI7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGRlbEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0JVVFRPTicpO1xuICAgICAgICAgICAgZGVsQnV0dG9uLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnYnRuIGJ0bi1kYW5nZXIgZGVsZXRlQmxvY2snKTtcbiAgICAgICAgICAgIGRlbEJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnYnV0dG9uJyk7XG4gICAgICAgICAgICBkZWxCdXR0b24uaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPVwiZnVpLXRyYXNoXCI+PC9zcGFuPiByZW1vdmUnO1xuICAgICAgICAgICAgZGVsQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciByZXNldEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0JVVFRPTicpO1xuICAgICAgICAgICAgcmVzZXRCdXR0b24uc2V0QXR0cmlidXRlKCdjbGFzcycsICdidG4gYnRuLXdhcm5pbmcgcmVzZXRCbG9jaycpO1xuICAgICAgICAgICAgcmVzZXRCdXR0b24uc2V0QXR0cmlidXRlKCd0eXBlJywgJ2J1dHRvbicpO1xuICAgICAgICAgICAgcmVzZXRCdXR0b24uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmEgZmEtcmVmcmVzaFwiPjwvaT4gcmVzZXQnO1xuICAgICAgICAgICAgcmVzZXRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGh0bWxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdCVVRUT04nKTtcbiAgICAgICAgICAgIGh0bWxCdXR0b24uc2V0QXR0cmlidXRlKCdjbGFzcycsICdidG4gYnRuLWludmVyc2UgaHRtbEJsb2NrJyk7XG4gICAgICAgICAgICBodG1sQnV0dG9uLnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgICAgICAgICAgIGh0bWxCdXR0b24uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmEgZmEtY29kZVwiPjwvaT4gc291cmNlJztcbiAgICAgICAgICAgIGh0bWxCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5mcmFtZUNvdmVyLmFwcGVuZENoaWxkKGRlbEJ1dHRvbik7XG4gICAgICAgICAgICB0aGlzLmZyYW1lQ292ZXIuYXBwZW5kQ2hpbGQocmVzZXRCdXR0b24pO1xuICAgICAgICAgICAgdGhpcy5mcmFtZUNvdmVyLmFwcGVuZENoaWxkKGh0bWxCdXR0b24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5wYXJlbnRMSS5hcHBlbmRDaGlsZCh0aGlzLmZyYW1lQ292ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgYXV0b21hdGljYWxseSBjb3JyZWN0cyB0aGUgaGVpZ2h0IG9mIHRoZSBibG9jaydzIGlmcmFtZSBkZXBlbmRpbmcgb24gaXRzIGNvbnRlbnRcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5oZWlnaHRBZGp1c3RtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwYWdlQ29udGFpbmVyID0gdGhpcy5mcmFtZURvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gcGFnZUNvbnRhaW5lci5zY3JvbGxIZWlnaHQ7XG5cbiAgICAgICAgICAgIHRoaXMuZnJhbWUuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0K1wicHhcIjtcbiAgICAgICAgICAgIHRoaXMucGFyZW50TEkuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0K1wicHhcIjtcbiAgICAgICAgICAgIHRoaXMuZnJhbWVDb3Zlci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQrXCJweFwiO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmZyYW1lSGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIGRlbGV0ZXMgYSBibG9ja1xuICAgICAgICAqL1xuICAgICAgICB0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL3JlbW92ZSBmcm9tIERPTS9jYW52YXMgd2l0aCBhIG5pY2UgYW5pbWF0aW9uXG4gICAgICAgICAgICAkKHRoaXMuZnJhbWUucGFyZW50Tm9kZSkuZmFkZU91dCg1MDAsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHNpdGUuYWN0aXZlUGFnZS5pc0VtcHR5KCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9yZW1vdmUgZnJvbSBibG9ja3MgYXJyYXkgaW4gdGhlIGFjdGl2ZSBwYWdlXG4gICAgICAgICAgICBzaXRlLmFjdGl2ZVBhZ2UuZGVsZXRlQmxvY2sodGhpcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vc2FuYm94XG4gICAgICAgICAgICBpZiggdGhpcy5zYW5iZG94ICkge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCB0aGlzLnNhbmRib3ggKS5yZW1vdmUoKTsgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9lbGVtZW50IHdhcyBkZWxldGVkLCBzbyB3ZSd2ZSBnb3QgcGVuZGluZyBjaGFuZ2VcbiAgICAgICAgICAgIHNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgcmVzZXRzIGEgYmxvY2sgdG8gaXQncyBvcmlnbmFsIHN0YXRlXG4gICAgICAgICovXG4gICAgICAgIHRoaXMucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9yZXNldCBmcmFtZSBieSByZWxvYWRpbmcgaXRcbiAgICAgICAgICAgIHRoaXMuZnJhbWUuY29udGVudFdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9zYW5kYm94P1xuICAgICAgICAgICAgaWYoIHRoaXMuc2FuZGJveCApIHtcbiAgICAgICAgICAgICAgICB2YXIgc2FuZGJveEZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5zYW5kYm94KS5jb250ZW50V2luZG93LmxvY2F0aW9uLnJlbG9hZCgpOyAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vZWxlbWVudCB3YXMgZGVsZXRlZCwgc28gd2UndmUgZ290IHBlbmRpbmcgY2hhbmdlc1xuICAgICAgICAgICAgc2l0ZS5zZXRQZW5kaW5nQ2hhbmdlcyh0cnVlKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBsYXVuY2hlcyB0aGUgc291cmNlIGNvZGUgZWRpdG9yXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc291cmNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vaGlkZSB0aGUgaWZyYW1lXG4gICAgICAgICAgICB0aGlzLmZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vZGlzYWJsZSBzb3J0YWJsZSBvbiB0aGUgcGFyZW50TElcbiAgICAgICAgICAgICQodGhpcy5wYXJlbnRMSS5wYXJlbnROb2RlKS5zb3J0YWJsZSgnZGlzYWJsZScpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2J1aWx0IGVkaXRvciBlbGVtZW50XG4gICAgICAgICAgICB2YXIgdGhlRWRpdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnRElWJyk7XG4gICAgICAgICAgICB0aGVFZGl0b3IuY2xhc3NMaXN0LmFkZCgnYWNlRWRpdG9yJyk7XG4gICAgICAgICAgICAkKHRoZUVkaXRvcikudW5pcXVlSWQoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5wYXJlbnRMSS5hcHBlbmRDaGlsZCh0aGVFZGl0b3IpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2J1aWxkIGFuZCBhcHBlbmQgZXJyb3IgZHJhd2VyXG4gICAgICAgICAgICB2YXIgbmV3TEkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdMSScpO1xuICAgICAgICAgICAgdmFyIGVycm9yRHJhd2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnRElWJyk7XG4gICAgICAgICAgICBlcnJvckRyYXdlci5jbGFzc0xpc3QuYWRkKCdlcnJvckRyYXdlcicpO1xuICAgICAgICAgICAgZXJyb3JEcmF3ZXIuc2V0QXR0cmlidXRlKCdpZCcsICdkaXZfZXJyb3JEcmF3ZXInKTtcbiAgICAgICAgICAgIGVycm9yRHJhd2VyLmlubmVySFRNTCA9ICc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4teHMgYnRuLWVtYm9zc2VkIGJ0bi1kZWZhdWx0IGJ1dHRvbl9jbGVhckVycm9yRHJhd2VyXCIgaWQ9XCJidXR0b25fY2xlYXJFcnJvckRyYXdlclwiPkNMRUFSPC9idXR0b24+JztcbiAgICAgICAgICAgIG5ld0xJLmFwcGVuZENoaWxkKGVycm9yRHJhd2VyKTtcbiAgICAgICAgICAgIGVycm9yRHJhd2VyLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcywgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5wYXJlbnRMSS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShuZXdMSSwgdGhpcy5wYXJlbnRMSS5uZXh0U2libGluZyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHRoZUlkID0gdGhlRWRpdG9yLmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgICAgICAgIHZhciBlZGl0b3IgPSBhY2UuZWRpdCggdGhlSWQgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHBhZ2VDb250YWluZXIgPSB0aGlzLmZyYW1lRG9jdW1lbnQucXVlcnlTZWxlY3RvciggYkNvbmZpZy5wYWdlQ29udGFpbmVyICk7XG4gICAgICAgICAgICB2YXIgdGhlSFRNTCA9IHBhZ2VDb250YWluZXIuaW5uZXJIVE1MO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBlZGl0b3Iuc2V0VmFsdWUoIHRoZUhUTUwgKTtcbiAgICAgICAgICAgIGVkaXRvci5zZXRUaGVtZShcImFjZS90aGVtZS90d2lsaWdodFwiKTtcbiAgICAgICAgICAgIGVkaXRvci5nZXRTZXNzaW9uKCkuc2V0TW9kZShcImFjZS9tb2RlL2h0bWxcIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBibG9jayA9IHRoaXM7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZWRpdG9yLmdldFNlc3Npb24oKS5vbihcImNoYW5nZUFubm90YXRpb25cIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBibG9jay5hbm5vdCA9IGVkaXRvci5nZXRTZXNzaW9uKCkuZ2V0QW5ub3RhdGlvbnMoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoYmxvY2suYW5ub3RUaW1lb3V0KTtcblxuICAgICAgICAgICAgICAgIHZhciB0aW1lb3V0Q291bnQ7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYoICQoJyNkaXZfZXJyb3JEcmF3ZXIgcCcpLnNpemUoKSA9PT0gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dENvdW50ID0gYkNvbmZpZy5zb3VyY2VDb2RlRWRpdFN5bnRheERlbGF5O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXRDb3VudCA9IDEwMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgYmxvY2suYW5ub3RUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBibG9jay5hbm5vdCl7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJsb2NrLmFubm90Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCBibG9jay5hbm5vdFtrZXldLnRleHQgIT09IFwiU3RhcnQgdGFnIHNlZW4gd2l0aG91dCBzZWVpbmcgYSBkb2N0eXBlIGZpcnN0LiBFeHBlY3RlZCBlLmcuIDwhRE9DVFlQRSBodG1sPi5cIiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0xpbmUgPSAkKCc8cD48L3A+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdLZXkgPSAkKCc8Yj4nK2Jsb2NrLmFubm90W2tleV0udHlwZSsnOiA8L2I+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdJbmZvID0gJCgnPHNwYW4+ICcrYmxvY2suYW5ub3Rba2V5XS50ZXh0ICsgXCJvbiBsaW5lIFwiICsgXCIgPGI+XCIgKyBibG9jay5hbm5vdFtrZXldLnJvdysnPC9iPjwvc3Bhbj4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3TGluZS5hcHBlbmQoIG5ld0tleSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdMaW5lLmFwcGVuZCggbmV3SW5mbyApO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2Rpdl9lcnJvckRyYXdlcicpLmFwcGVuZCggbmV3TGluZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiggJCgnI2Rpdl9lcnJvckRyYXdlcicpLmNzcygnZGlzcGxheScpID09PSAnbm9uZScgJiYgJCgnI2Rpdl9lcnJvckRyYXdlcicpLmZpbmQoJ3AnKS5zaXplKCkgPiAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2Rpdl9lcnJvckRyYXdlcicpLnNsaWRlRG93bigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9LCB0aW1lb3V0Q291bnQpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9idXR0b25zXG4gICAgICAgICAgICB2YXIgY2FuY2VsQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnQlVUVE9OJyk7XG4gICAgICAgICAgICBjYW5jZWxCdXR0b24uc2V0QXR0cmlidXRlKCd0eXBlJywgJ2J1dHRvbicpO1xuICAgICAgICAgICAgY2FuY2VsQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2J0bicpO1xuICAgICAgICAgICAgY2FuY2VsQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2J0bi1kYW5nZXInKTtcbiAgICAgICAgICAgIGNhbmNlbEJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdlZGl0Q2FuY2VsQnV0dG9uJyk7XG4gICAgICAgICAgICBjYW5jZWxCdXR0b24uY2xhc3NMaXN0LmFkZCgnYnRuLXdpZGUnKTtcbiAgICAgICAgICAgIGNhbmNlbEJ1dHRvbi5pbm5lckhUTUwgPSAnPHNwYW4gY2xhc3M9XCJmdWktY3Jvc3NcIj48L3NwYW4+IENhbmNlbCc7XG4gICAgICAgICAgICBjYW5jZWxCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLCBmYWxzZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBzYXZlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnQlVUVE9OJyk7XG4gICAgICAgICAgICBzYXZlQnV0dG9uLnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgICAgICAgICAgIHNhdmVCdXR0b24uY2xhc3NMaXN0LmFkZCgnYnRuJyk7XG4gICAgICAgICAgICBzYXZlQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2J0bi1wcmltYXJ5Jyk7XG4gICAgICAgICAgICBzYXZlQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2VkaXRTYXZlQnV0dG9uJyk7XG4gICAgICAgICAgICBzYXZlQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2J0bi13aWRlJyk7XG4gICAgICAgICAgICBzYXZlQnV0dG9uLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz1cImZ1aS1jaGVja1wiPjwvc3Bhbj4gU2F2ZSc7XG4gICAgICAgICAgICBzYXZlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcywgZmFsc2UpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgYnV0dG9uV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ0RJVicpO1xuICAgICAgICAgICAgYnV0dG9uV3JhcHBlci5jbGFzc0xpc3QuYWRkKCdlZGl0b3JCdXR0b25zJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGJ1dHRvbldyYXBwZXIuYXBwZW5kQ2hpbGQoIGNhbmNlbEJ1dHRvbiApO1xuICAgICAgICAgICAgYnV0dG9uV3JhcHBlci5hcHBlbmRDaGlsZCggc2F2ZUJ1dHRvbiApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnBhcmVudExJLmFwcGVuZENoaWxkKCBidXR0b25XcmFwcGVyICk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGJ1aWxkZXJVSS5hY2VFZGl0b3JzWyB0aGVJZCBdID0gZWRpdG9yO1xuICAgICAgICAgICAgXG4gICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIGNhbmNlbHMgdGhlIGJsb2NrIHNvdXJjZSBjb2RlIGVkaXRvclxuICAgICAgICAqL1xuICAgICAgICB0aGlzLmNhbmNlbFNvdXJjZUJsb2NrID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vZW5hYmxlIGRyYWdnYWJsZSBvbiB0aGUgTElcbiAgICAgICAgICAgICQodGhpcy5wYXJlbnRMSS5wYXJlbnROb2RlKS5zb3J0YWJsZSgnZW5hYmxlJyk7XG5cdFx0XG4gICAgICAgICAgICAvL2RlbGV0ZSB0aGUgZXJyb3JEcmF3ZXJcbiAgICAgICAgICAgICQodGhpcy5wYXJlbnRMSS5uZXh0U2libGluZykucmVtb3ZlKCk7XG4gICAgICAgIFxuICAgICAgICAgICAgLy9kZWxldGUgdGhlIGVkaXRvclxuICAgICAgICAgICAgdGhpcy5wYXJlbnRMSS5xdWVyeVNlbGVjdG9yKCcuYWNlRWRpdG9yJykucmVtb3ZlKCk7XG4gICAgICAgICAgICAkKHRoaXMuZnJhbWUpLmZhZGVJbig1MDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAkKHRoaXMucGFyZW50TEkucXVlcnlTZWxlY3RvcignLmVkaXRvckJ1dHRvbnMnKSkuZmFkZU91dCg1MDAsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIHVwZGF0ZXMgdGhlIGJsb2NrcyBzb3VyY2UgY29kZVxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnNhdmVTb3VyY2VCbG9jayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2VuYWJsZSBkcmFnZ2FibGUgb24gdGhlIExJXG4gICAgICAgICAgICAkKHRoaXMucGFyZW50TEkucGFyZW50Tm9kZSkuc29ydGFibGUoJ2VuYWJsZScpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgdGhlSWQgPSB0aGlzLnBhcmVudExJLnF1ZXJ5U2VsZWN0b3IoJy5hY2VFZGl0b3InKS5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgICAgICAgICB2YXIgdGhlQ29udGVudCA9IGJ1aWxkZXJVSS5hY2VFZGl0b3JzW3RoZUlkXS5nZXRWYWx1ZSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2RlbGV0ZSB0aGUgZXJyb3JEcmF3ZXJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkaXZfZXJyb3JEcmF3ZXInKS5wYXJlbnROb2RlLnJlbW92ZSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2RlbGV0ZSB0aGUgZWRpdG9yXG4gICAgICAgICAgICB0aGlzLnBhcmVudExJLnF1ZXJ5U2VsZWN0b3IoJy5hY2VFZGl0b3InKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy91cGRhdGUgdGhlIGZyYW1lJ3MgY29udGVudFxuICAgICAgICAgICAgdGhpcy5mcmFtZURvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIGJDb25maWcucGFnZUNvbnRhaW5lciApLmlubmVySFRNTCA9IHRoZUNvbnRlbnQ7XG4gICAgICAgICAgICB0aGlzLmZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL3NhbmRib3hlZD9cbiAgICAgICAgICAgIGlmKCB0aGlzLnNhbmRib3ggKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHNhbmRib3hGcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCB0aGlzLnNhbmRib3ggKTtcbiAgICAgICAgICAgICAgICB2YXIgc2FuZGJveEZyYW1lRG9jdW1lbnQgPSBzYW5kYm94RnJhbWUuY29udGVudERvY3VtZW50IHx8IHNhbmRib3hGcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJ1aWxkZXJVSS50ZW1wRnJhbWUgPSBzYW5kYm94RnJhbWU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2FuZGJveEZyYW1lRG9jdW1lbnQucXVlcnlTZWxlY3RvciggYkNvbmZpZy5wYWdlQ29udGFpbmVyICkuaW5uZXJIVE1MID0gdGhlQ29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9kbyB3ZSBuZWVkIHRvIGV4ZWN1dGUgYSBsb2FkZXIgZnVuY3Rpb24/XG4gICAgICAgICAgICAgICAgaWYoIHRoaXMuc2FuZGJveF9sb2FkZXIgIT09ICcnICkge1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGVUb0V4ZWN1dGUgPSBcInNhbmRib3hGcmFtZS5jb250ZW50V2luZG93LlwiK3RoaXMuc2FuZGJveF9sb2FkZXIrXCIoKVwiO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG1wRnVuYyA9IG5ldyBGdW5jdGlvbihjb2RlVG9FeGVjdXRlKTtcbiAgICAgICAgICAgICAgICAgICAgdG1wRnVuYygpO1xuICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQodGhpcy5wYXJlbnRMSS5xdWVyeVNlbGVjdG9yKCcuZWRpdG9yQnV0dG9ucycpKS5mYWRlT3V0KDUwMCwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vYWRqdXN0IGhlaWdodCBvZiB0aGUgZnJhbWVcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0QWRqdXN0bWVudCgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL25ldyBwYWdlIGFkZGVkLCB3ZSd2ZSBnb3QgcGVuZGluZyBjaGFuZ2VzXG4gICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2Jsb2NrIGhhcyBjaGFuZ2VkXG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9ICdjaGFuZ2VkJztcblxuICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBjbGVhcnMgb3V0IHRoZSBlcnJvciBkcmF3ZXJcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jbGVhckVycm9yRHJhd2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwcyA9IHRoaXMucGFyZW50TEkubmV4dFNpYmxpbmcucXVlcnlTZWxlY3RvckFsbCgncCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHBzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgIHBzW2ldLnJlbW92ZSgpOyAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgdG9nZ2xlcyB0aGUgdmlzaWJpbGl0eSBvZiB0aGlzIGJsb2NrJ3MgZnJhbWVDb3ZlclxuICAgICAgICAqL1xuICAgICAgICB0aGlzLnRvZ2dsZUNvdmVyID0gZnVuY3Rpb24ob25Pck9mZikge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiggb25Pck9mZiA9PT0gJ09uJyApIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudExJLnF1ZXJ5U2VsZWN0b3IoJy5mcmFtZUNvdmVyJykuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9IGVsc2UgaWYoIG9uT3JPZmYgPT09ICdPZmYnICkge1xuICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50TEkucXVlcnlTZWxlY3RvcignLmZyYW1lQ292ZXInKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIHJldHVybnMgdGhlIGZ1bGwgc291cmNlIGNvZGUgb2YgdGhlIGJsb2NrJ3MgZnJhbWVcbiAgICAgICAgKi9cbiAgICAgICAgdGhpcy5nZXRTb3VyY2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IFwiPGh0bWw+XCI7XG4gICAgICAgICAgICBzb3VyY2UgKz0gdGhpcy5mcmFtZURvY3VtZW50LmhlYWQub3V0ZXJIVE1MO1xuICAgICAgICAgICAgc291cmNlICs9IHRoaXMuZnJhbWVEb2N1bWVudC5ib2R5Lm91dGVySFRNTDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZTtcbiAgICAgICAgICAgIFxuICAgICAgICB9O1xuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBzZXRzIHRoZSBzb3VyY2UgY29kZSBmb3IgdGhpcyBibG9jaydzIGZyYW1lXG4gICAgICAgICovXG4gICAgICAgIHRoaXMuc2V0U291cmNlID0gZnVuY3Rpb24gKGNvbnRlbnQpIHtcblxuICAgICAgICAgICAgJCh0aGlzLmZyYW1lKS5jb250ZW50cygpLmZpbmQoJ2JvZHknKS5odG1sKGNvbnRlbnQpO1xuXG4gICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIHBsYWNlcyBhIGRyYWdnZWQvZHJvcHBlZCBibG9jayBmcm9tIHRoZSBsZWZ0IHNpZGViYXIgb250byB0aGUgY2FudmFzXG4gICAgICAgICovXG4gICAgICAgIHRoaXMucGxhY2VPbkNhbnZhcyA9IGZ1bmN0aW9uKHVpKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vZnJhbWUgZGF0YSwgd2UnbGwgbmVlZCB0aGlzIGJlZm9yZSBtZXNzaW5nIHdpdGggdGhlIGl0ZW0ncyBjb250ZW50IEhUTUxcbiAgICAgICAgICAgIHZhciBmcmFtZURhdGEgPSB7fSwgYXR0cjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKCB1aS5pdGVtLmZpbmQoJ2lmcmFtZScpLnNpemUoKSA+IDAgKSB7Ly9pZnJhbWUgdGh1bWJuYWlsXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZyYW1lRGF0YS5zcmMgPSB1aS5pdGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3NyYycpO1xuICAgICAgICAgICAgICAgIGZyYW1lRGF0YS5mcmFtZXNfb3JpZ2luYWxfdXJsID0gdWkuaXRlbS5maW5kKCdpZnJhbWUnKS5hdHRyKCdzcmMnKTtcbiAgICAgICAgICAgICAgICBmcmFtZURhdGEuZnJhbWVzX2hlaWdodCA9IHVpLml0ZW0uaGVpZ2h0KCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vc2FuZGJveGVkIGJsb2NrP1xuICAgICAgICAgICAgICAgIGF0dHIgPSB1aS5pdGVtLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3NhbmRib3gnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhdHRyICE9PSB0eXBlb2YgdW5kZWZpbmVkICYmIGF0dHIgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2FuZGJveCA9IHNpdGVCdWlsZGVyVXRpbHMuZ2V0UmFuZG9tQXJiaXRyYXJ5KDEwMDAwLCAxMDAwMDAwMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYW5kYm94X2xvYWRlciA9IHVpLml0ZW0uZmluZCgnaWZyYW1lJykuYXR0cignZGF0YS1sb2FkZXJmdW5jdGlvbicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gZWxzZSB7Ly9pbWFnZSB0aHVtYm5haWxcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZnJhbWVEYXRhLnNyYyA9IHVpLml0ZW0uZmluZCgnaW1nJykuYXR0cignZGF0YS1zcmNjJyk7XG4gICAgICAgICAgICAgICAgZnJhbWVEYXRhLmZyYW1lc19vcmlnaW5hbF91cmwgPSB1aS5pdGVtLmZpbmQoJ2ltZycpLmF0dHIoJ2RhdGEtc3JjYycpO1xuICAgICAgICAgICAgICAgIGZyYW1lRGF0YS5mcmFtZXNfaGVpZ2h0ID0gdWkuaXRlbS5maW5kKCdpbWcnKS5hdHRyKCdkYXRhLWhlaWdodCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy9zYW5kYm94ZWQgYmxvY2s/XG4gICAgICAgICAgICAgICAgYXR0ciA9IHVpLml0ZW0uZmluZCgnaW1nJykuYXR0cignZGF0YS1zYW5kYm94Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXR0ciAhPT0gdHlwZW9mIHVuZGVmaW5lZCAmJiBhdHRyICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNhbmRib3ggPSBzaXRlQnVpbGRlclV0aWxzLmdldFJhbmRvbUFyYml0cmFyeSgxMDAwMCwgMTAwMDAwMDAwMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2FuZGJveF9sb2FkZXIgPSB1aS5pdGVtLmZpbmQoJ2ltZycpLmF0dHIoJ2RhdGEtbG9hZGVyZnVuY3Rpb24nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2NyZWF0ZSB0aGUgbmV3IGJsb2NrIG9iamVjdFxuICAgICAgICAgICAgdGhpcy5mcmFtZUlEID0gMDtcbiAgICAgICAgICAgIHRoaXMucGFyZW50TEkgPSB1aS5pdGVtLmdldCgwKTtcbiAgICAgICAgICAgIHRoaXMucGFyZW50TEkuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9ICduZXcnO1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVGcmFtZShmcmFtZURhdGEpO1xuICAgICAgICAgICAgdGhpcy5wYXJlbnRMSS5zdHlsZS5oZWlnaHQgPSB0aGlzLmZyYW1lSGVpZ2h0K1wicHhcIjtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlRnJhbWVDb3ZlcigpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5mcmFtZS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgdGhpcyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2luc2VydCB0aGUgY3JlYXRlZCBpZnJhbWVcbiAgICAgICAgICAgIHVpLml0ZW0uYXBwZW5kKCQodGhpcy5mcmFtZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9hZGQgdGhlIGJsb2NrIHRvIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAgICAgICAgIHNpdGUuYWN0aXZlUGFnZS5ibG9ja3Muc3BsaWNlKHVpLml0ZW0uaW5kZXgoKSwgMCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2N1c3RvbSBldmVudFxuICAgICAgICAgICAgdWkuaXRlbS5maW5kKCdpZnJhbWUnKS50cmlnZ2VyKCdjYW52YXN1cGRhdGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9kcm9wcGVkIGVsZW1lbnQsIHNvIHdlJ3ZlIGdvdCBwZW5kaW5nIGNoYW5nZXNcbiAgICAgICAgICAgIHNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgQmxvY2sucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oZXZlbnQpIHtcblxuICAgICAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJsb2FkXCI6IFxuICAgICAgICAgICAgICAgIHRoaXMuc2V0RnJhbWVEb2N1bWVudCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0QWRqdXN0bWVudCgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmKCB0aGlzLmNvbnRlbnRBZnRlckxvYWQgIT09ICcnICkgdGhpcy5zZXRTb3VyY2UodGhpcy5jb250ZW50QWZ0ZXJMb2FkKTtcblxuICAgICAgICAgICAgICAgICQodGhpcy5mcmFtZUNvdmVyKS5yZW1vdmVDbGFzcygnZnJlc2gnLCA1MDApO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjYXNlIFwiY2xpY2tcIjpcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgdGhlQmxvY2sgPSB0aGlzO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vZmlndXJlIG91dCB3aGF0IHRvIGRvIG5leHRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiggZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnZGVsZXRlQmxvY2snKSApIHsvL2RlbGV0ZSB0aGlzIGJsb2NrXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAkKGJ1aWxkZXJVSS5tb2RhbERlbGV0ZUJsb2NrKS5tb2RhbCgnc2hvdycpOyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAkKGJ1aWxkZXJVSS5tb2RhbERlbGV0ZUJsb2NrKS5vZmYoJ2NsaWNrJywgJyNkZWxldGVCbG9ja0NvbmZpcm0nKS5vbignY2xpY2snLCAnI2RlbGV0ZUJsb2NrQ29uZmlybScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVCbG9jay5kZWxldGUoZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChidWlsZGVyVUkubW9kYWxEZWxldGVCbG9jaykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygncmVzZXRCbG9jaycpICkgey8vcmVzZXQgdGhlIGJsb2NrXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAkKGJ1aWxkZXJVSS5tb2RhbFJlc2V0QmxvY2spLm1vZGFsKCdzaG93Jyk7IFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJChidWlsZGVyVUkubW9kYWxSZXNldEJsb2NrKS5vZmYoJ2NsaWNrJywgJyNyZXNldEJsb2NrQ29uZmlybScpLm9uKCdjbGljaycsICcjcmVzZXRCbG9ja0NvbmZpcm0nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhlQmxvY2sucmVzZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoYnVpbGRlclVJLm1vZGFsUmVzZXRCbG9jaykubW9kYWwoJ2hpZGUnKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnaHRtbEJsb2NrJykgKSB7Ly9zb3VyY2UgY29kZSBlZGl0b3JcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoZUJsb2NrLnNvdXJjZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2VkaXRDYW5jZWxCdXR0b24nKSApIHsvL2NhbmNlbCBzb3VyY2UgY29kZSBlZGl0b3JcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoZUJsb2NrLmNhbmNlbFNvdXJjZUJsb2NrKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnZWRpdFNhdmVCdXR0b24nKSApIHsvL3NhdmUgc291cmNlIGNvZGVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoZUJsb2NrLnNhdmVTb3VyY2VCbG9jaygpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2J1dHRvbl9jbGVhckVycm9yRHJhd2VyJykgKSB7Ly9jbGVhciBlcnJvciBkcmF3ZXJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoZUJsb2NrLmNsZWFyRXJyb3JEcmF3ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICB9XG5cbiAgICB9O1xuXG5cbiAgICAvKlxuICAgICAgICBTaXRlIG9iamVjdCBsaXRlcmFsXG4gICAgKi9cbiAgICAvKmpzaGludCAtVzAwMyAqL1xuICAgIHZhciBzaXRlID0ge1xuICAgICAgICBcbiAgICAgICAgcGVuZGluZ0NoYW5nZXM6IGZhbHNlLCAgICAgIC8vcGVuZGluZyBjaGFuZ2VzIG9yIG5vP1xuICAgICAgICBwYWdlczoge30sICAgICAgICAgICAgICAgICAgLy9hcnJheSBjb250YWluaW5nIGFsbCBwYWdlcywgaW5jbHVkaW5nIHRoZSBjaGlsZCBmcmFtZXMsIGxvYWRlZCBmcm9tIHRoZSBzZXJ2ZXIgb24gcGFnZSBsb2FkXG4gICAgICAgIGlzX2FkbWluOiAwLCAgICAgICAgICAgICAgICAvLzAgZm9yIG5vbi1hZG1pbiwgMSBmb3IgYWRtaW5cbiAgICAgICAgZGF0YToge30sICAgICAgICAgICAgICAgICAgIC8vY29udGFpbmVyIGZvciBhamF4IGxvYWRlZCBzaXRlIGRhdGFcbiAgICAgICAgcGFnZXNUb0RlbGV0ZTogW10sICAgICAgICAgIC8vY29udGFpbnMgcGFnZXMgdG8gYmUgZGVsZXRlZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBzaXRlUGFnZXM6IFtdLCAgICAgICAgICAgICAgLy90aGlzIGlzIHRoZSBvbmx5IHZhciBjb250YWluaW5nIHRoZSByZWNlbnQgY2FudmFzIGNvbnRlbnRzXG4gICAgICAgIFxuICAgICAgICBzaXRlUGFnZXNSZWFkeUZvclNlcnZlcjoge30sICAgICAvL2NvbnRhaW5zIHRoZSBzaXRlIGRhdGEgcmVhZHkgdG8gYmUgc2VudCB0byB0aGUgc2VydmVyXG4gICAgICAgIFxuICAgICAgICBhY3RpdmVQYWdlOiB7fSwgICAgICAgICAgICAgLy9ob2xkcyBhIHJlZmVyZW5jZSB0byB0aGUgcGFnZSBjdXJyZW50bHkgb3BlbiBvbiB0aGUgY2FudmFzXG4gICAgICAgIFxuICAgICAgICBwYWdlVGl0bGU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlVGl0bGUnKSwvL2hvbGRzIHRoZSBwYWdlIHRpdGxlIG9mIHRoZSBjdXJyZW50IHBhZ2Ugb24gdGhlIGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgZGl2Q2FudmFzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZUxpc3QnKSwvL0RJViBjb250YWluaW5nIGFsbCBwYWdlcyBvbiB0aGUgY2FudmFzXG4gICAgICAgIFxuICAgICAgICBwYWdlc01lbnU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlcycpLCAvL1VMIGNvbnRhaW5pbmcgdGhlIHBhZ2VzIG1lbnUgaW4gdGhlIHNpZGViYXJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgYnV0dG9uTmV3UGFnZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZFBhZ2UnKSxcbiAgICAgICAgbGlOZXdQYWdlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV3UGFnZUxJJyksXG4gICAgICAgIFxuICAgICAgICBpbnB1dFBhZ2VTZXR0aW5nc1RpdGxlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZURhdGFfdGl0bGUnKSxcbiAgICAgICAgaW5wdXRQYWdlU2V0dGluZ3NNZXRhRGVzY3JpcHRpb246IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlRGF0YV9tZXRhRGVzY3JpcHRpb24nKSxcbiAgICAgICAgaW5wdXRQYWdlU2V0dGluZ3NNZXRhS2V5d29yZHM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlRGF0YV9tZXRhS2V5d29yZHMnKSxcbiAgICAgICAgaW5wdXRQYWdlU2V0dGluZ3NJbmNsdWRlczogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VEYXRhX2hlYWRlckluY2x1ZGVzJyksXG4gICAgICAgIGlucHV0UGFnZVNldHRpbmdzUGFnZUNzczogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VEYXRhX2hlYWRlckNzcycpLFxuICAgICAgICBcbiAgICAgICAgYnV0dG9uU3VibWl0UGFnZVNldHRpbmdzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZVNldHRpbmdzU3VibWl0dEJ1dHRvbicpLFxuICAgICAgICBcbiAgICAgICAgbW9kYWxQYWdlU2V0dGluZ3M6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlU2V0dGluZ3NNb2RhbCcpLFxuICAgICAgICBcbiAgICAgICAgYnV0dG9uU2F2ZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NhdmVQYWdlJyksXG4gICAgICAgIFxuICAgICAgICBtZXNzYWdlU3RhcnQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGFydCcpLFxuICAgICAgICBkaXZGcmFtZVdyYXBwZXI6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmcmFtZVdyYXBwZXInKSxcbiAgICAgICAgXG4gICAgICAgIHNrZWxldG9uOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2tlbGV0b24nKSxcblxuICAgICAgICBidXR0b25FbXB0eVBhZ2U6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjbGVhclNjcmVlbicpLFxuXG4gICAgICAgIGFjdGlvbkJ1dHRvbnM6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY3Rpb25CdXR0b25zJyksXG5cdFx0XG5cdFx0YXV0b1NhdmVUaW1lcjoge30sXG4gICAgICAgIFxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgJC5nZXRKU09OKFwic2l0ZS5qc29uXCIsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYoIGRhdGEucGFnZXMgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICAgICAgc2l0ZS5wYWdlcyA9IGRhdGEucGFnZXM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2l0ZS5wYWdlcyA9IHtpbmRleDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VfaWQ6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlc190aXRsZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRhX2Rlc2NyaXB0aW9uOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFfa2V5d29yZHM6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyX2luY2x1ZGVzOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VfY3NzOiAnJ1xuICAgICAgICAgICAgICAgICAgICB9fTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvL2ZpcmUgY3VzdG9tIGV2ZW50XG4gICAgICAgICAgICAgICAgJCgnYm9keScpLnRyaWdnZXIoJ3NpdGVEYXRhTG9hZGVkJyk7XG5cbiAgICAgICAgICAgICAgICBidWlsZGVyVUkucG9wdWxhdGVDYW52YXMoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQodGhpcy5idXR0b25OZXdQYWdlKS5vbignY2xpY2snLCBzaXRlLm5ld1BhZ2UpO1xuICAgICAgICAgICAgJCh0aGlzLm1vZGFsUGFnZVNldHRpbmdzKS5vbignc2hvdy5icy5tb2RhbCcsIHNpdGUubG9hZFBhZ2VTZXR0aW5ncyk7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uU3VibWl0UGFnZVNldHRpbmdzKS5vbignY2xpY2snLCBzaXRlLnVwZGF0ZVBhZ2VTZXR0aW5ncyk7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uU2F2ZSkub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtzaXRlLnNhdmUodHJ1ZSk7fSk7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uRW1wdHlQYWdlKS5vbignY2xpY2snLCBzaXRlLmVtcHR5UGFnZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vYXV0byBzYXZlIHRpbWUgXG4gICAgICAgICAgICB0aGlzLmF1dG9TYXZlVGltZXIgPSBzZXRUaW1lb3V0KHNpdGUuYXV0b1NhdmUsIGJDb25maWcuYXV0b1NhdmVUaW1lb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIGF1dG9TYXZlOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZihzaXRlLnBlbmRpbmdDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgc2l0ZS5zYXZlKGZhbHNlKTtcbiAgICAgICAgICAgIH1cblx0XHRcdFxuXHRcdFx0d2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5hdXRvU2F2ZVRpbWVyKTtcbiAgICAgICAgICAgIHRoaXMuYXV0b1NhdmVUaW1lciA9IHNldFRpbWVvdXQoc2l0ZS5hdXRvU2F2ZSwgYkNvbmZpZy5hdXRvU2F2ZVRpbWVvdXQpO1xuICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc2V0UGVuZGluZ0NoYW5nZXM6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ0NoYW5nZXMgPSB2YWx1ZTtcblxuICAgICAgICAgICAgdGhpcy5pc0VtcHR5KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKCB2YWx1ZSA9PT0gdHJ1ZSApIHtcblx0XHRcdFx0XG5cdFx0XHRcdC8vcmVzZXQgdGltZXJcblx0XHRcdFx0d2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5hdXRvU2F2ZVRpbWVyKTtcbiAgICAgICAgICAgIFx0dGhpcy5hdXRvU2F2ZVRpbWVyID0gc2V0VGltZW91dChzaXRlLmF1dG9TYXZlLCBiQ29uZmlnLmF1dG9TYXZlVGltZW91dCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgJCgnI3NhdmVQYWdlIC5iTGFiZWwnKS50ZXh0KFwiU2F2ZSBub3cgKCEpXCIpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmKCBzaXRlLmFjdGl2ZVBhZ2Uuc3RhdHVzICE9PSAnbmV3JyApIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgc2l0ZS5hY3RpdmVQYWdlLnN0YXR1cyA9ICdjaGFuZ2VkJztcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuXHRcdFx0XG4gICAgICAgICAgICB9IGVsc2Uge1xuXHRcbiAgICAgICAgICAgICAgICAkKCcjc2F2ZVBhZ2UgLmJMYWJlbCcpLnRleHQoXCJOb3RoaW5nIHRvIHNhdmVcIik7XG5cdFx0XHRcdFxuICAgICAgICAgICAgICAgIHNpdGUudXBkYXRlUGFnZVN0YXR1cygnJyk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBzYXZlOiBmdW5jdGlvbihzaG93Q29uZmlybU1vZGFsKSB7XG5cbiAgICAgICAgICAgIC8vZGlzYWJsZSBidXR0b25cbiAgICAgICAgICAgICQoXCJhI3NhdmVQYWdlXCIpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXG4gICAgICAgICAgICB2YXIgb3JpZ2luYWxUZXh0ID0gJCgnYSNzYXZlUGFnZScpLmZpbmQoJy5iTGFiZWwnKS50ZXh0KCk7XG4gICAgICAgICAgICB2YXIgYWx0VGV4dCA9ICQoJ2Ejc2F2ZVBhZ2UnKS5maW5kKCcuYkxhYmVsJykuYXR0cignZGF0YS1hbHQtdGV4dCcpO1xuXG4gICAgICAgICAgICAkKCdhI3NhdmVQYWdlJykuZmluZCgnLmJMYWJlbCcpLnRleHQoYWx0VGV4dCk7XG4gICAgICAgICAgICAkKCdhI3NhdmVQYWdlJykuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwYWdlcyA9IHt9LCB0aGVTaXRlO1xuXG4gICAgICAgICAgICBpZiggc2l0ZS5zaXRlUGFnZXNbMF0uYmxvY2tzLmxlbmd0aCAhPT0gMCApIHtcblxuICAgICAgICAgICAgICAgIGZvciggdmFyIHggPSAwOyB4IDwgc2l0ZS5zaXRlUGFnZXMubGVuZ3RoOyB4KysgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoIHNpdGUuc2l0ZVBhZ2VzW3hdLmJsb2Nrcy5sZW5ndGggIT09IDAgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VzW3NpdGUuc2l0ZVBhZ2VzW3hdLm5hbWVdID0gc2l0ZS5zaXRlUGFnZXNbeF0ucHJlcEZvclNhdmUoKTtcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlc1tzaXRlLnNpdGVQYWdlc1t4XS5uYW1lXSA9ICdlbXB0eSc7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhlU2l0ZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcGFnZXM6IHBhZ2VzXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHRoZVNpdGUgPSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZTogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9yZW1vdmUgb2xkIGFsZXJ0c1xuICAgICAgICAgICAgJCgnI2Vycm9yTW9kYWwgLm1vZGFsLWJvZHkgPiAqLCAjc3VjY2Vzc01vZGFsIC5tb2RhbC1ib2R5ID4gKicpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgdXJsOiAnX3NhdmUucGhwJyxcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBkYXRhOiB7ZGF0YTogdGhlU2l0ZX0sXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiXG4gICAgICAgICAgICB9KS5kb25lKGZ1bmN0aW9uIChyZXMpIHtcblxuICAgICAgICAgICAgICAgIC8vZW5hYmxlIGJ1dHRvblxuICAgICAgICAgICAgICAgICQoXCJhI3NhdmVQYWdlXCIpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXG4gICAgICAgICAgICAgICAgaWYoIHJlcy5yZXNwb25zZUNvZGUgPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiggc2hvd0NvbmZpcm1Nb2RhbCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyNlcnJvck1vZGFsIC5tb2RhbC1ib2R5JykuaHRtbCggcmVzLnJlc3BvbnNlSFRNTCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2Vycm9yTW9kYWwnKS5tb2RhbCgnc2hvdycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggcmVzLnJlc3BvbnNlQ29kZSA9PT0gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vbm8gbW9yZSBwZW5kaW5nIGNoYW5nZXNcbiAgICAgICAgICAgICAgICAgICAgc2l0ZS5zZXRQZW5kaW5nQ2hhbmdlcyhmYWxzZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJCgnYm9keScpLnRyaWdnZXIoJ2NoYW5nZVBhZ2UnKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIHByZXBzIHRoZSBzaXRlIGRhdGEgYmVmb3JlIHNlbmRpbmcgaXQgdG8gdGhlIHNlcnZlclxuICAgICAgICAqL1xuICAgICAgICBwcmVwRm9yU2F2ZTogZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5zaXRlUGFnZXNSZWFkeUZvclNlcnZlciA9IHt9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiggdGVtcGxhdGUgKSB7Ly9zYXZpbmcgdGVtcGxhdGUsIG9ubHkgdGhlIGFjdGl2ZVBhZ2UgaXMgbmVlZGVkXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5zaXRlUGFnZXNSZWFkeUZvclNlcnZlclt0aGlzLmFjdGl2ZVBhZ2UubmFtZV0gPSB0aGlzLmFjdGl2ZVBhZ2UucHJlcEZvclNhdmUoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZVBhZ2UuZnVsbFBhZ2UoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gZWxzZSB7Ly9yZWd1bGFyIHNhdmVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vZmluZCB0aGUgcGFnZXMgd2hpY2ggbmVlZCB0byBiZSBzZW5kIHRvIHRoZSBzZXJ2ZXJcbiAgICAgICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHRoaXMuc2l0ZVBhZ2VzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYoIHRoaXMuc2l0ZVBhZ2VzW2ldLnN0YXR1cyAhPT0gJycgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2l0ZVBhZ2VzUmVhZHlGb3JTZXJ2ZXJbdGhpcy5zaXRlUGFnZXNbaV0ubmFtZV0gPSB0aGlzLnNpdGVQYWdlc1tpXS5wcmVwRm9yU2F2ZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBzZXRzIGEgcGFnZSBhcyB0aGUgYWN0aXZlIG9uZVxuICAgICAgICAqL1xuICAgICAgICBzZXRBY3RpdmU6IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9yZWZlcmVuY2UgdG8gdGhlIGFjdGl2ZSBwYWdlXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVBhZ2UgPSBwYWdlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2hpZGUgb3RoZXIgcGFnZXNcbiAgICAgICAgICAgIGZvcih2YXIgaSBpbiB0aGlzLnNpdGVQYWdlcykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2l0ZVBhZ2VzW2ldLnBhcmVudFVMLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7ICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vZGlzcGxheSBhY3RpdmUgb25lXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVBhZ2UucGFyZW50VUwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgZGUtYWN0aXZlIGFsbCBwYWdlIG1lbnUgaXRlbXNcbiAgICAgICAgKi9cbiAgICAgICAgZGVBY3RpdmF0ZUFsbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwYWdlcyA9IHRoaXMucGFnZXNNZW51LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgcGFnZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgcGFnZXNbaV0uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgYWRkcyBhIG5ldyBwYWdlIHRvIHRoZSBzaXRlXG4gICAgICAgICovXG4gICAgICAgIG5ld1BhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzaXRlLmRlQWN0aXZhdGVBbGwoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9jcmVhdGUgdGhlIG5ldyBwYWdlIGluc3RhbmNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YSA9IFtdO1xuICAgICAgICAgICAgdmFyIHRlbXAgPSB7XG4gICAgICAgICAgICAgICAgcGFnZXNfaWQ6IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBwYWdlRGF0YVswXSA9IHRlbXA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBuZXdQYWdlTmFtZSA9ICdwYWdlJysoc2l0ZS5zaXRlUGFnZXMubGVuZ3RoKzEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgbmV3UGFnZSA9IG5ldyBQYWdlKG5ld1BhZ2VOYW1lLCBwYWdlRGF0YSwgc2l0ZS5zaXRlUGFnZXMubGVuZ3RoKzEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBuZXdQYWdlLnN0YXR1cyA9ICduZXcnO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBuZXdQYWdlLnNlbGVjdFBhZ2UoKTtcbiAgICAgICAgICAgIG5ld1BhZ2UuZWRpdFBhZ2VOYW1lKCk7XG4gICAgICAgIFxuICAgICAgICAgICAgbmV3UGFnZS5pc0VtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgY2hlY2tzIGlmIHRoZSBuYW1lIG9mIGEgcGFnZSBpcyBhbGxvd2VkXG4gICAgICAgICovXG4gICAgICAgIGNoZWNrUGFnZU5hbWU6IGZ1bmN0aW9uKHBhZ2VOYW1lKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vbWFrZSBzdXJlIHRoZSBuYW1lIGlzIHVuaXF1ZVxuICAgICAgICAgICAgZm9yKCB2YXIgaSBpbiB0aGlzLnNpdGVQYWdlcyApIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiggdGhpcy5zaXRlUGFnZXNbaV0ubmFtZSA9PT0gcGFnZU5hbWUgJiYgdGhpcy5hY3RpdmVQYWdlICE9PSB0aGlzLnNpdGVQYWdlc1tpXSApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYWdlTmFtZUVycm9yID0gXCJUaGUgcGFnZSBuYW1lIG11c3QgYmUgdW5pcXVlLlwiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICByZW1vdmVzIHVuYWxsb3dlZCBjaGFyYWN0ZXJzIGZyb20gdGhlIHBhZ2UgbmFtZVxuICAgICAgICAqL1xuICAgICAgICBwcmVwUGFnZU5hbWU6IGZ1bmN0aW9uKHBhZ2VOYW1lKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHBhZ2VOYW1lID0gcGFnZU5hbWUucmVwbGFjZSgnICcsICcnKTtcbiAgICAgICAgICAgIHBhZ2VOYW1lID0gcGFnZU5hbWUucmVwbGFjZSgvWz8qIS58JiM7JCVAXCI8PigpKyxdL2csIFwiXCIpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gcGFnZU5hbWU7XG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgc2F2ZSBwYWdlIHNldHRpbmdzIGZvciB0aGUgY3VycmVudCBwYWdlXG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZVBhZ2VTZXR0aW5nczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNpdGUuYWN0aXZlUGFnZS5wYWdlU2V0dGluZ3MudGl0bGUgPSBzaXRlLmlucHV0UGFnZVNldHRpbmdzVGl0bGUudmFsdWU7XG4gICAgICAgICAgICBzaXRlLmFjdGl2ZVBhZ2UucGFnZVNldHRpbmdzLm1ldGFfZGVzY3JpcHRpb24gPSBzaXRlLmlucHV0UGFnZVNldHRpbmdzTWV0YURlc2NyaXB0aW9uLnZhbHVlO1xuICAgICAgICAgICAgc2l0ZS5hY3RpdmVQYWdlLnBhZ2VTZXR0aW5ncy5tZXRhX2tleXdvcmRzID0gc2l0ZS5pbnB1dFBhZ2VTZXR0aW5nc01ldGFLZXl3b3Jkcy52YWx1ZTtcbiAgICAgICAgICAgIHNpdGUuYWN0aXZlUGFnZS5wYWdlU2V0dGluZ3MuaGVhZGVyX2luY2x1ZGVzID0gc2l0ZS5pbnB1dFBhZ2VTZXR0aW5nc0luY2x1ZGVzLnZhbHVlO1xuICAgICAgICAgICAgc2l0ZS5hY3RpdmVQYWdlLnBhZ2VTZXR0aW5ncy5wYWdlX2NzcyA9IHNpdGUuaW5wdXRQYWdlU2V0dGluZ3NQYWdlQ3NzLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBzaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkKHNpdGUubW9kYWxQYWdlU2V0dGluZ3MpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgdXBkYXRlIHBhZ2Ugc3RhdHVzZXNcbiAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlUGFnZVN0YXR1czogZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciggdmFyIGkgaW4gdGhpcy5zaXRlUGFnZXMgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaXRlUGFnZXNbaV0uc3RhdHVzID0gc3RhdHVzOyAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgQ2xlYXJzIGFsbCB0aGUgYmxvY2tzIG9uIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAgICAgKi9cbiAgICAgICAgZW1wdHlQYWdlOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIHNpdGUuYWN0aXZlUGFnZS5jbGVhcigpO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgQ2hlY2tzIGlmIHRoZSBlbnRpcmUgcGFnZSBpcyBlbXB0eSwgaWYgc28sIGRpc2FibGUgYWN0aW9uIGJ1dHRvbnNcbiAgICAgICAgKi9cbiAgICAgICAgaXNFbXB0eTogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICB2YXIgeCA9IDA7XG5cbiAgICAgICAgICAgIGlmKHRoaXMuc2l0ZVBhZ2VzLmxlbmd0aCA9PT0gMSAmJiB0aGlzLmFjdGl2ZVBhZ2UuYmxvY2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZvciggeCA9IDA7IHggPCB0aGlzLmFjdGlvbkJ1dHRvbnMubGVuZ3RoOyB4KysgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uQnV0dG9uc1t4XS5jbGFzc0xpc3QuYWRkKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yKCB4ID0gMDsgeCA8IHRoaXMuYWN0aW9uQnV0dG9ucy5sZW5ndGg7IHgrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25CdXR0b25zW3hdLmNsYXNzTGlzdC5yZW1vdmUoJ2Rpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICBcbiAgICB9O1xuXG4gICAgYnVpbGRlclVJLmluaXQoKTsgc2l0ZS5pbml0KCk7XG5cbiAgICBcbiAgICAvLyoqKiogRVhQT1JUU1xuICAgIG1vZHVsZS5leHBvcnRzLnNpdGUgPSBzaXRlO1xuICAgIG1vZHVsZS5leHBvcnRzLmJ1aWxkZXJVSSA9IGJ1aWxkZXJVSTtcblxufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIHNpdGVCdWlsZGVyID0gcmVxdWlyZSgnLi9idWlsZGVyLmpzJyk7XG5cbiAgICAvKlxuICAgICAgICBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgRWxlbWVudFxuICAgICovXG4gICAgbW9kdWxlLmV4cG9ydHMuRWxlbWVudCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbDtcbiAgICAgICAgdGhpcy5zYW5kYm94ID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGFyZW50RnJhbWUgPSB7fTtcbiAgICAgICAgdGhpcy5wYXJlbnRCbG9jayA9IHt9Oy8vcmVmZXJlbmNlIHRvIHRoZSBwYXJlbnQgYmxvY2sgZWxlbWVudFxuICAgICAgICBcbiAgICAgICAgLy9tYWtlIGN1cnJlbnQgZWxlbWVudCBhY3RpdmUvb3BlbiAoYmVpbmcgd29ya2VkIG9uKVxuICAgICAgICB0aGlzLnNldE9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJCh0aGlzLmVsZW1lbnQpLm9mZignbW91c2VlbnRlciBtb3VzZWxlYXZlIGNsaWNrJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKCAkKHRoaXMuZWxlbWVudCkuY2xvc2VzdCgnYm9keScpLndpZHRoKCkgIT09ICQodGhpcy5lbGVtZW50KS53aWR0aCgpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAkKHRoaXMuZWxlbWVudCkuY3NzKHsnb3V0bGluZSc6ICczcHggZGFzaGVkIHJlZCcsICdjdXJzb3InOiAncG9pbnRlcid9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAkKHRoaXMuZWxlbWVudCkuY3NzKHsnb3V0bGluZSc6ICczcHggZGFzaGVkIHJlZCcsICdvdXRsaW5lLW9mZnNldCc6Jy0zcHgnLCAgJ2N1cnNvcic6ICdwb2ludGVyJ30pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8vc2V0cyB1cCBob3ZlciBhbmQgY2xpY2sgZXZlbnRzLCBtYWtpbmcgdGhlIGVsZW1lbnQgYWN0aXZlIG9uIHRoZSBjYW52YXNcbiAgICAgICAgdGhpcy5hY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXM7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQodGhpcy5lbGVtZW50KS5jc3MoeydvdXRsaW5lJzogJ25vbmUnLCAnY3Vyc29yJzogJ2luaGVyaXQnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICQodGhpcy5lbGVtZW50KS5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmKCAkKHRoaXMpLmNsb3Nlc3QoJ2JvZHknKS53aWR0aCgpICE9PSAkKHRoaXMpLndpZHRoKCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyh7J291dGxpbmUnOiAnM3B4IGRhc2hlZCByZWQnLCAnY3Vyc29yJzogJ3BvaW50ZXInfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKHsnb3V0bGluZSc6ICczcHggZGFzaGVkIHJlZCcsICdvdXRsaW5lLW9mZnNldCc6ICctM3B4JywgJ2N1cnNvcic6ICdwb2ludGVyJ30pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyh7J291dGxpbmUnOiAnJywgJ2N1cnNvcic6ICcnLCAnb3V0bGluZS1vZmZzZXQnOiAnJ30pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB9KS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZWxlbWVudC5jbGlja0hhbmRsZXIodGhpcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB0aGlzLmRlYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJCh0aGlzLmVsZW1lbnQpLm9mZignbW91c2VlbnRlciBtb3VzZWxlYXZlIGNsaWNrJyk7XG4gICAgICAgICAgICAkKHRoaXMuZWxlbWVudCkuY3NzKHsnb3V0bGluZSc6ICdub25lJywgJ2N1cnNvcic6ICdpbmhlcml0J30pO1xuXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvL3JlbW92ZXMgdGhlIGVsZW1lbnRzIG91dGxpbmVcbiAgICAgICAgdGhpcy5yZW1vdmVPdXRsaW5lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQodGhpcy5lbGVtZW50KS5jc3MoeydvdXRsaW5lJzogJ25vbmUnLCAnY3Vyc29yJzogJ2luaGVyaXQnfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8vc2V0cyB0aGUgcGFyZW50IGlmcmFtZVxuICAgICAgICB0aGlzLnNldFBhcmVudEZyYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBkb2MgPSB0aGlzLmVsZW1lbnQub3duZXJEb2N1bWVudDtcbiAgICAgICAgICAgIHZhciB3ID0gZG9jLmRlZmF1bHRWaWV3IHx8IGRvYy5wYXJlbnRXaW5kb3c7XG4gICAgICAgICAgICB2YXIgZnJhbWVzID0gdy5wYXJlbnQuZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKHZhciBpPSBmcmFtZXMubGVuZ3RoOyBpLS0+MDspIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgZnJhbWU9IGZyYW1lc1tpXTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZD0gZnJhbWUuY29udGVudERvY3VtZW50IHx8IGZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkPT09ZG9jKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRGcmFtZSA9IGZyYW1lO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy9zZXRzIHRoaXMgZWxlbWVudCdzIHBhcmVudCBibG9jayByZWZlcmVuY2VcbiAgICAgICAgdGhpcy5zZXRQYXJlbnRCbG9jayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2xvb3AgdGhyb3VnaCBhbGwgdGhlIGJsb2NrcyBvbiB0aGUgY2FudmFzXG4gICAgICAgICAgICBmb3IoIHZhciBpID0gMDsgaSA8IHNpdGVCdWlsZGVyLnNpdGUuc2l0ZVBhZ2VzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IoIHZhciB4ID0gMDsgeCA8IHNpdGVCdWlsZGVyLnNpdGUuc2l0ZVBhZ2VzW2ldLmJsb2Nrcy5sZW5ndGg7IHgrKyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9pZiB0aGUgYmxvY2sncyBmcmFtZSBtYXRjaGVzIHRoaXMgZWxlbWVudCdzIHBhcmVudCBmcmFtZVxuICAgICAgICAgICAgICAgICAgICBpZiggc2l0ZUJ1aWxkZXIuc2l0ZS5zaXRlUGFnZXNbaV0uYmxvY2tzW3hdLmZyYW1lID09PSB0aGlzLnBhcmVudEZyYW1lICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jcmVhdGUgYSByZWZlcmVuY2UgdG8gdGhhdCBibG9jayBhbmQgc3RvcmUgaXQgaW4gdGhpcy5wYXJlbnRCbG9ja1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRCbG9jayA9IHNpdGVCdWlsZGVyLnNpdGUuc2l0ZVBhZ2VzW2ldLmJsb2Nrc1t4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIHRoaXMuc2V0UGFyZW50RnJhbWUoKTtcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBpcyB0aGlzIGJsb2NrIHNhbmRib3hlZD9cbiAgICAgICAgKi9cbiAgICAgICAgXG4gICAgICAgIGlmKCB0aGlzLnBhcmVudEZyYW1lLmdldEF0dHJpYnV0ZSgnZGF0YS1zYW5kYm94JykgKSB7XG4gICAgICAgICAgICB0aGlzLnNhbmRib3ggPSB0aGlzLnBhcmVudEZyYW1lLmdldEF0dHJpYnV0ZSgnZGF0YS1zYW5kYm94Jyk7ICAgXG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICB9O1xuXG59KCkpOyIsIihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuICAgICAgICBcbiAgICBtb2R1bGUuZXhwb3J0cy5wYWdlQ29udGFpbmVyID0gXCIjcGFnZVwiO1xuICAgIFxuICAgIG1vZHVsZS5leHBvcnRzLmVkaXRhYmxlSXRlbXMgPSB7XG4gICAgICAgICdzcGFuLmZhJzogWydjb2xvcicsICdmb250LXNpemUnXSxcbiAgICAgICAgJy5iZy5iZzEnOiBbJ2JhY2tncm91bmQtY29sb3InXSxcbiAgICAgICAgJ25hdiBhLCBhLmVkaXQnOiBbJ2NvbG9yJywgJ2ZvbnQtd2VpZ2h0JywgJ3RleHQtdHJhbnNmb3JtJ10sXG4gICAgICAgICdoMSwgaDIsIGgzLCBoNCwgaDUsIHAnOiBbJ2NvbG9yJywgJ2ZvbnQtc2l6ZScsICdiYWNrZ3JvdW5kLWNvbG9yJywgJ2ZvbnQtZmFtaWx5J10sXG4gICAgICAgICdhLmJ0biwgYnV0dG9uLmJ0bic6IFsnYm9yZGVyLXJhZGl1cycsICdmb250LXNpemUnLCAnYmFja2dyb3VuZC1jb2xvciddLFxuXG4gICAgICAgICdpbWcnOiBbJ2JvcmRlci10b3AtbGVmdC1yYWRpdXMnLCAnYm9yZGVyLXRvcC1yaWdodC1yYWRpdXMnLCAnYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1cycsICdib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1cycsICdib3JkZXItY29sb3InLCAnYm9yZGVyLXN0eWxlJywgJ2JvcmRlci13aWR0aCddLFxuICAgICAgICAnaHIuZGFzaGVkJzogWydib3JkZXItY29sb3InLCAnYm9yZGVyLXdpZHRoJ10sXG4gICAgICAgICcuZGl2aWRlciA+IHNwYW4nOiBbJ2NvbG9yJywgJ2ZvbnQtc2l6ZSddLFxuICAgICAgICAnaHIuc2hhZG93RG93bic6IFsnbWFyZ2luLXRvcCcsICdtYXJnaW4tYm90dG9tJ10sXG4gICAgICAgICcuZm9vdGVyIGEnOiBbJ2NvbG9yJ10sXG4gICAgICAgICcuYmcuYmcxLCAuYmcuYmcyLCAuaGVhZGVyMTAsIC5oZWFkZXIxMSc6IFsnYmFja2dyb3VuZC1pbWFnZScsICdiYWNrZ3JvdW5kLWNvbG9yJ10sXG4gICAgICAgICcuZnJhbWVDb3Zlcic6IFtdXG4gICAgfTtcbiAgICBcbiAgICBtb2R1bGUuZXhwb3J0cy5lZGl0YWJsZUl0ZW1PcHRpb25zID0ge1xuICAgICAgICAnbmF2IGEgOiBmb250LXdlaWdodCc6IFsnNDAwJywgJzcwMCddLFxuICAgICAgICAnYS5idG4gOiBib3JkZXItcmFkaXVzJzogWycwcHgnLCAnNHB4JywgJzEwcHgnXSxcbiAgICAgICAgJ2ltZyA6IGJvcmRlci1zdHlsZSc6IFsnbm9uZScsICdkb3R0ZWQnLCAnZGFzaGVkJywgJ3NvbGlkJ10sXG4gICAgICAgICdpbWcgOiBib3JkZXItd2lkdGgnOiBbJzFweCcsICcycHgnLCAnM3B4JywgJzRweCddLFxuICAgICAgICAnaDEsIGgyLCBoMywgaDQsIGg1LCBwIDogZm9udC1mYW1pbHknOiBbJ2RlZmF1bHQnLCAnTGF0bycsICdIZWx2ZXRpY2EnLCAnQXJpYWwnLCAnVGltZXMgTmV3IFJvbWFuJ10sXG4gICAgICAgICdoMiA6IGZvbnQtZmFtaWx5JzogWydkZWZhdWx0JywgJ0xhdG8nLCAnSGVsdmV0aWNhJywgJ0FyaWFsJywgJ1RpbWVzIE5ldyBSb21hbiddLFxuICAgICAgICAnaDMgOiBmb250LWZhbWlseSc6IFsnZGVmYXVsdCcsICdMYXRvJywgJ0hlbHZldGljYScsICdBcmlhbCcsICdUaW1lcyBOZXcgUm9tYW4nXSxcbiAgICAgICAgJ3AgOiBmb250LWZhbWlseSc6IFsnZGVmYXVsdCcsICdMYXRvJywgJ0hlbHZldGljYScsICdBcmlhbCcsICdUaW1lcyBOZXcgUm9tYW4nXVxuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cy5lZGl0YWJsZUNvbnRlbnQgPSBbJy5lZGl0Q29udGVudCcsICcubmF2YmFyIGEnLCAnYnV0dG9uJywgJ2EuYnRuJywgJy5mb290ZXIgYTpub3QoLmZhKScsICcudGFibGVXcmFwcGVyJywgJ2gxJ107XG5cbiAgICBtb2R1bGUuZXhwb3J0cy5hdXRvU2F2ZVRpbWVvdXQgPSA2MDAwMDtcbiAgICBcbiAgICBtb2R1bGUuZXhwb3J0cy5zb3VyY2VDb2RlRWRpdFN5bnRheERlbGF5ID0gMTAwMDA7XG4gICAgICAgICAgICAgICAgICAgIFxufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgY2FudmFzRWxlbWVudCA9IHJlcXVpcmUoJy4vY2FudmFzRWxlbWVudC5qcycpLkVsZW1lbnQ7XG5cdHZhciBiQ29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcblx0dmFyIHNpdGVCdWlsZGVyID0gcmVxdWlyZSgnLi9idWlsZGVyLmpzJyk7XG5cblx0dmFyIGNvbnRlbnRlZGl0b3IgPSB7XG4gICAgICAgIFxuICAgICAgICBsYWJlbENvbnRlbnRNb2RlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kZUNvbnRlbnRMYWJlbCcpLFxuICAgICAgICByYWRpb0NvbnRlbnQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RlQ29udGVudCcpLFxuICAgICAgICBidXR0b25VcGRhdGVDb250ZW50OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXBkYXRlQ29udGVudEluRnJhbWVTdWJtaXQnKSxcbiAgICAgICAgYWN0aXZlRWxlbWVudDoge30sXG4gICAgICAgIGFsbENvbnRlbnRJdGVtc09uQ2FudmFzOiBbXSxcbiAgICAgICAgbW9kYWxFZGl0Q29udGVudDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VkaXRDb250ZW50TW9kYWwnKSxcbiAgICBcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vZGlzcGxheSBjb250ZW50IG1vZGUgbGFiZWxcbiAgICAgICAgICAgICQodGhpcy5sYWJlbENvbnRlbnRNb2RlKS5zaG93KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQodGhpcy5yYWRpb0NvbnRlbnQpLm9uKCdjbGljaycsIHRoaXMuYWN0aXZhdGVDb250ZW50TW9kZSk7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uVXBkYXRlQ29udGVudCkub24oJ2NsaWNrJywgdGhpcy51cGRhdGVFbGVtZW50Q29udGVudCk7XG4gICAgICAgICAgICAkKHRoaXMubW9kYWxFZGl0Q29udGVudCkub24oJ2hpZGRlbi5icy5tb2RhbCcsIHRoaXMuZWRpdENvbnRlbnRNb2RhbENsb3NlRXZlbnQpO1xuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ21vZGVEZXRhaWxzIG1vZGVCbG9ja3MnLCAnYm9keScsIHRoaXMuZGVBY3RpdmF0ZU1vZGUpO1xuXHRcdFx0XG5cdFx0XHQvL2xpc3RlbiBmb3IgdGhlIGJlZm9yZVNhdmUgZXZlbnQsIHJlbW92ZXMgb3V0bGluZXMgYmVmb3JlIHNhdmluZ1xuICAgICAgICAgICAgJCgnYm9keScpLm9uKCdiZWZvcmVTYXZlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcblx0XHRcdFx0aWYoIE9iamVjdC5rZXlzKCBjb250ZW50ZWRpdG9yLmFjdGl2ZUVsZW1lbnQgKS5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgICAgIFx0Y29udGVudGVkaXRvci5hY3RpdmVFbGVtZW50LnJlbW92ZU91dGxpbmUoKTtcbiAgICAgICAgICAgIFx0fVxuXHRcdFx0XHRcblx0XHRcdH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIEFjdGl2YXRlcyBjb250ZW50IG1vZGVcbiAgICAgICAgKi9cbiAgICAgICAgYWN0aXZhdGVDb250ZW50TW9kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vRWxlbWVudCBvYmplY3QgZXh0ZW50aW9uXG4gICAgICAgICAgICBjYW52YXNFbGVtZW50LnByb3RvdHlwZS5jbGlja0hhbmRsZXIgPSBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRlZGl0b3IuY29udGVudENsaWNrKGVsKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vdHJpZ2dlciBjdXN0b20gZXZlbnRcbiAgICAgICAgICAgICQoJ2JvZHknKS50cmlnZ2VyKCdtb2RlQ29udGVudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2Rpc2FibGUgZnJhbWVDb3ZlcnNcbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgc2l0ZUJ1aWxkZXIuc2l0ZS5zaXRlUGFnZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgc2l0ZUJ1aWxkZXIuc2l0ZS5zaXRlUGFnZXNbaV0udG9nZ2xlRnJhbWVDb3ZlcnMoJ09mZicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2NyZWF0ZSBhbiBvYmplY3QgZm9yIGV2ZXJ5IGVkaXRhYmxlIGVsZW1lbnQgb24gdGhlIGNhbnZhcyBhbmQgc2V0dXAgaXQncyBldmVudHNcbiAgICAgICAgICAgICQoJyNwYWdlTGlzdCB1bCBsaSBpZnJhbWUnKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciggdmFyIGtleSBpbiBiQ29uZmlnLmVkaXRhYmxlQ29udGVudCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jb250ZW50cygpLmZpbmQoIGJDb25maWcucGFnZUNvbnRhaW5lciArICcgJysgYkNvbmZpZy5lZGl0YWJsZUNvbnRlbnRba2V5XSApLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RWxlbWVudCA9IG5ldyBjYW52YXNFbGVtZW50KHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdFbGVtZW50LmFjdGl2YXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vc3RvcmUgaW4gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRlZGl0b3IuYWxsQ29udGVudEl0ZW1zT25DYW52YXMucHVzaCggbmV3RWxlbWVudCApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XHRcdFx0XHRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIE9wZW5zIHVwIHRoZSBjb250ZW50IGVkaXRvclxuICAgICAgICAqL1xuICAgICAgICBjb250ZW50Q2xpY2s6IGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIC8vaWYgd2UgaGF2ZSBhbiBhY3RpdmUgZWxlbWVudCwgbWFrZSBpdCB1bmFjdGl2ZVxuICAgICAgICAgICAgaWYoIE9iamVjdC5rZXlzKHRoaXMuYWN0aXZlRWxlbWVudCkubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVFbGVtZW50LmFjdGl2YXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vc2V0IHRoZSBhY3RpdmUgZWxlbWVudFxuICAgICAgICAgICAgdmFyIGFjdGl2ZUVsZW1lbnQgPSBuZXcgY2FudmFzRWxlbWVudChlbCk7XG4gICAgICAgICAgICBhY3RpdmVFbGVtZW50LnNldFBhcmVudEJsb2NrKCk7XG4gICAgICAgICAgICBjb250ZW50ZWRpdG9yLmFjdGl2ZUVsZW1lbnQgPSBhY3RpdmVFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL3VuYmluZCBob3ZlciBhbmQgY2xpY2sgZXZlbnRzIGFuZCBtYWtlIHRoaXMgaXRlbSBhY3RpdmVcbiAgICAgICAgICAgIGNvbnRlbnRlZGl0b3IuYWN0aXZlRWxlbWVudC5zZXRPcGVuKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICQoJyNlZGl0Q29udGVudE1vZGFsJykubW9kYWwoJ3Nob3cnKTtcblx0XHRcdCAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9mb3IgdGhlIGVsZW1lbnRzIGJlbG93LCB3ZSdsbCB1c2UgYSBzaW1wbHlmaWVkIGVkaXRvciwgb25seSBkaXJlY3QgdGV4dCBjYW4gYmUgZG9uZSB0aHJvdWdoIHRoaXMgb25lXG4gICAgICAgICAgICBpZiggZWwudGFnTmFtZSA9PT0gJ1NNQUxMJyB8fCBlbC50YWdOYW1lID09PSAnQScgfHwgZWwudGFnTmFtZSA9PT0gJ0xJJyB8fCBlbC50YWdOYW1lID09PSAnU1BBTicgfHwgZWwudGFnTmFtZSA9PT0gJ0InIHx8IGVsLnRhZ05hbWUgPT09ICdJJyB8fCBlbC50YWdOYW1lID09PSAnVFQnIHx8IGVsLnRhZ2VOYW1lID09PSAnQ09ERScgfHwgZWwudGFnTmFtZSA9PT0gJ0VNJyB8fCBlbC50YWdOYW1lID09PSAnU1RST05HJyB8fCBlbC50YWdOYW1lID09PSAnU1VCJyB8fCBlbC50YWdOYW1lID09PSAnQlVUVE9OJyB8fCBlbC50YWdOYW1lID09PSAnTEFCRUwnIHx8IGVsLnRhZ05hbWUgPT09ICdQJyB8fCBlbC50YWdOYW1lID09PSAnSDEnIHx8IGVsLnRhZ05hbWUgPT09ICdIMicgfHwgZWwudGFnTmFtZSA9PT0gJ0gyJyB8fCBlbC50YWdOYW1lID09PSAnSDMnIHx8IGVsLnRhZ05hbWUgPT09ICdINCcgfHwgZWwudGFnTmFtZSA9PT0gJ0g1JyB8fCBlbC50YWdOYW1lID09PSAnSDYnICkge1xuXHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHQkKCcjY29udGVudFRvRWRpdCcpLnN1bW1lcm5vdGUoe1xuXHRcdFx0XHRcdHRvb2xiYXI6IFtcblx0XHRcdFx0XHQvLyBbZ3JvdXBOYW1lLCBbbGlzdCBvZiBidXR0b25dXVxuXHRcdFx0XHRcdFsnY29kZXZpZXcnLCBbJ2NvZGV2aWV3J11dLFxuXHRcdFx0XHRcdFsnZm9udHN0eWxlJywgWydib2xkJywgJ2l0YWxpYycsICd1bmRlcmxpbmUnLCAnc3RyaWtldGhyb3VnaCcsICdjbGVhciddXSxcblx0XHRcdFx0XHRbJ2hlbHAnLCBbJ3VuZG8nLCAncmVkbyddXVxuXHRcdFx0XHQgIF1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdCAgICAgICAgICAgIFxuICAgICAgICAgICAgfSBlbHNlIGlmKCBlbC50YWdOYW1lID09PSAnRElWJyAmJiAkKGVsKS5oYXNDbGFzcygndGFibGVXcmFwcGVyJykgKSB7XG5cdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdCQoJyNjb250ZW50VG9FZGl0Jykuc3VtbWVybm90ZSh7XG5cdFx0XHRcdFx0dG9vbGJhcjogW1xuXHRcdFx0XHRcdFsnY29kZXZpZXcnLCBbJ2NvZGV2aWV3J11dLFxuXHRcdFx0XHRcdFsnc3R5bGVzZWxlY3QnLCBbJ3N0eWxlJ11dLFxuXHRcdFx0XHRcdFsnZm9udHN0eWxlJywgWydib2xkJywgJ2l0YWxpYycsICd1bmRlcmxpbmUnLCAnc3RyaWtldGhyb3VnaCcsICdjbGVhciddXSxcblx0XHRcdFx0XHRbJ3RhYmxlJywgWyd0YWJsZSddXSxcblx0XHRcdFx0XHRbJ2xpbmsnLCBbJ2xpbmsnLCAndW5saW5rJ11dLFxuXHRcdFx0XHRcdFsnaGVscCcsIFsndW5kbycsICdyZWRvJ11dXG5cdFx0XHRcdCAgXVxuXHRcdFx0XHR9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdCQoJyNjb250ZW50VG9FZGl0Jykuc3VtbWVybm90ZSh7XG5cdFx0XHRcdFx0dG9vbGJhcjogW1xuXHRcdFx0XHRcdFsnY29kZXZpZXcnLCBbJ2NvZGV2aWV3J11dLFxuXHRcdFx0XHRcdFsnc3R5bGVzZWxlY3QnLCBbJ3N0eWxlJ11dLFxuXHRcdFx0XHRcdFsnZm9udHN0eWxlJywgWydib2xkJywgJ2l0YWxpYycsICd1bmRlcmxpbmUnLCAnc3RyaWtldGhyb3VnaCcsICdjbGVhciddXSxcblx0XHRcdFx0XHRbJ2xpc3RzJywgWydvbCcsICd1bCddXSxcblx0XHRcdFx0XHRbJ2xpbmsnLCBbJ2xpbmsnLCAndW5saW5rJ11dLFxuXHRcdFx0XHRcdFsnaGVscCcsIFsndW5kbycsICdyZWRvJ11dXG5cdFx0XHRcdCAgXVxuXHRcdFx0XHR9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cblx0XHRcdFxuXHRcdFx0JCgnI2NvbnRlbnRUb0VkaXQnKS5zdW1tZXJub3RlKCdjb2RlJywgJChlbCkuaHRtbCgpKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICB1cGRhdGVzIHRoZSBjb250ZW50IG9mIGFuIGVsZW1lbnRcbiAgICAgICAgKi9cbiAgICAgICAgdXBkYXRlRWxlbWVudENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkKGNvbnRlbnRlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5odG1sKCAkKCcjZWRpdENvbnRlbnRNb2RhbCAjY29udGVudFRvRWRpdCcpLnN1bW1lcm5vdGUoJ2NvZGUnKSApLmNzcyh7J291dGxpbmUnOiAnJywgJ2N1cnNvcic6Jyd9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLyogU0FOREJPWCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiggY29udGVudGVkaXRvci5hY3RpdmVFbGVtZW50LnNhbmRib3ggKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRJRCA9ICQoY29udGVudGVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmF0dHIoJ2lkJyk7XG4gICAgICAgICAgICAgICAgJCgnIycrY29udGVudGVkaXRvci5hY3RpdmVFbGVtZW50LnNhbmRib3gpLmNvbnRlbnRzKCkuZmluZCgnIycrZWxlbWVudElEKS5odG1sKCAkKCcjZWRpdENvbnRlbnRNb2RhbCAjY29udGVudFRvRWRpdCcpLnN1bW1lcm5vdGUoJ2NvZGUnKSApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8qIEVORCBTQU5EQk9YICovXG4gICAgICAgICAgICBcblx0XHRcdCQoJyNlZGl0Q29udGVudE1vZGFsICNjb250ZW50VG9FZGl0Jykuc3VtbWVybm90ZSgnY29kZScsICcnKTtcblx0XHRcdCQoJyNlZGl0Q29udGVudE1vZGFsICNjb250ZW50VG9FZGl0Jykuc3VtbWVybm90ZSgnZGVzdHJveScpOyAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAkKCcjZWRpdENvbnRlbnRNb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQodGhpcykuY2xvc2VzdCgnYm9keScpLnJlbW92ZUNsYXNzKCdtb2RhbC1vcGVuJykuYXR0cignc3R5bGUnLCAnJyk7XG5cbiAgICAgICAgICAgIC8vcmVzZXQgaWZyYW1lIGhlaWdodFxuICAgICAgICAgICAgY29udGVudGVkaXRvci5hY3RpdmVFbGVtZW50LnBhcmVudEJsb2NrLmhlaWdodEFkanVzdG1lbnQoKTtcblx0XHRcbiAgICAgICAgICAgIC8vY29udGVudCB3YXMgdXBkYXRlZCwgc28gd2UndmUgZ290IHBlbmRpbmcgY2hhbmdlXG4gICAgICAgICAgICBzaXRlQnVpbGRlci5zaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvL3JlYWN0aXZhdGUgZWxlbWVudFxuICAgICAgICAgICAgY29udGVudGVkaXRvci5hY3RpdmVFbGVtZW50LmFjdGl2YXRlKCk7XG4gICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBldmVudCBoYW5kbGVyIGZvciB3aGVuIHRoZSBlZGl0IGNvbnRlbnQgbW9kYWwgaXMgY2xvc2VkXG4gICAgICAgICovXG4gICAgICAgIGVkaXRDb250ZW50TW9kYWxDbG9zZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgJCgnI2VkaXRDb250ZW50TW9kYWwgI2NvbnRlbnRUb0VkaXQnKS5zdW1tZXJub3RlKCdkZXN0cm95Jyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vcmUtYWN0aXZhdGUgZWxlbWVudFxuICAgICAgICAgICAgY29udGVudGVkaXRvci5hY3RpdmVFbGVtZW50LmFjdGl2YXRlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvKlxuICAgICAgICAgICAgRXZlbnQgaGFuZGxlciBmb3Igd2hlbiBtb2RlIGdldHMgZGVhY3RpdmF0ZWRcbiAgICAgICAgKi9cbiAgICAgICAgZGVBY3RpdmF0ZU1vZGU6IGZ1bmN0aW9uKCkgeyAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYoIE9iamVjdC5rZXlzKCBjb250ZW50ZWRpdG9yLmFjdGl2ZUVsZW1lbnQgKS5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRlZGl0b3IuYWN0aXZlRWxlbWVudC5yZW1vdmVPdXRsaW5lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vZGVhY3RpdmF0ZSBhbGwgY29udGVudCBibG9ja3NcbiAgICAgICAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgY29udGVudGVkaXRvci5hbGxDb250ZW50SXRlbXNPbkNhbnZhcy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgICAgICBjb250ZW50ZWRpdG9yLmFsbENvbnRlbnRJdGVtc09uQ2FudmFzW2ldLmRlYWN0aXZhdGUoKTsgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH07XG4gICAgXG4gICAgY29udGVudGVkaXRvci5pbml0KCk7XG5cbn0oKSk7IiwiKGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIGJDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy5qcycpO1xuICAgIHZhciBwdWJsaXNoZXIgPSByZXF1aXJlKCcuLi92ZW5kb3IvcHVibGlzaGVyJyk7XG5cblx0dmFyIGJleHBvcnQgPSB7XG4gICAgICAgIFxuICAgICAgICBtb2RhbEV4cG9ydDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V4cG9ydE1vZGFsJyksXG4gICAgICAgIGJ1dHRvbkV4cG9ydDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V4cG9ydFBhZ2UnKSxcbiAgICAgICAgXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkKHRoaXMubW9kYWxFeHBvcnQpLm9uKCdzaG93LmJzLm1vZGFsJywgdGhpcy5kb0V4cG9ydE1vZGFsKTtcbiAgICAgICAgICAgICQodGhpcy5tb2RhbEV4cG9ydCkub24oJ3Nob3duLmJzLm1vZGFsJywgdGhpcy5wcmVwRXhwb3J0KTtcbiAgICAgICAgICAgICQodGhpcy5tb2RhbEV4cG9ydCkuZmluZCgnZm9ybScpLm9uKCdzdWJtaXQnLCB0aGlzLmV4cG9ydEZvcm1TdWJtaXQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL3JldmVhbCBleHBvcnQgYnV0dG9uXG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uRXhwb3J0KS5zaG93KCk7XG4gICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgZG9FeHBvcnRNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICQoJyNleHBvcnRNb2RhbCA+IGZvcm0gI2V4cG9ydFN1Ym1pdCcpLnNob3coJycpO1xuICAgICAgICAgICAgJCgnI2V4cG9ydE1vZGFsID4gZm9ybSAjZXhwb3J0Q2FuY2VsJykudGV4dCgnQ2FuY2VsICYgQ2xvc2UnKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8qXG4gICAgICAgICAgICBwcmVwYXJlcyB0aGUgZXhwb3J0IGRhdGFcbiAgICAgICAgKi9cbiAgICAgICAgcHJlcEV4cG9ydDogZnVuY3Rpb24oZSkge1xuXG4gICAgICAgICAgICBwdWJsaXNoZXIucHVibGlzaCgnY2xvc2VTdHlsZUVkaXRvcicpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL2RlbGV0ZSBvbGRlciBoaWRkZW4gZmllbGRzXG4gICAgICAgICAgICAkKCcjZXhwb3J0TW9kYWwgZm9ybSBpbnB1dFt0eXBlPVwiaGlkZGVuXCJdLnBhZ2VzJykucmVtb3ZlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vbG9vcCB0aHJvdWdoIGFsbCBwYWdlc1xuICAgICAgICAgICAgJCgnI3BhZ2VMaXN0ID4gdWwnKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICB2YXIgdGhlQ29udGVudHM7XG5cdFx0XHRcdFxuICAgICAgICAgICAgICAgIC8vZ3JhYiB0aGUgc2tlbGV0b24gbWFya3VwXG4gICAgICAgICAgICAgICAgdmFyIG5ld0RvY01haW5QYXJlbnQgPSAkKCdpZnJhbWUjc2tlbGV0b24nKS5jb250ZW50cygpLmZpbmQoIGJDb25maWcucGFnZUNvbnRhaW5lciApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vZW1wdHkgb3V0IHRoZSBza2VsZXRvXG4gICAgICAgICAgICAgICAgbmV3RG9jTWFpblBhcmVudC5maW5kKCcqJykucmVtb3ZlKCk7XG5cdFx0XHRcbiAgICAgICAgICAgICAgICAvL2xvb3AgdGhyb3VnaCBwYWdlIGlmcmFtZXMgYW5kIGdyYWIgdGhlIGJvZHkgc3R1ZmZcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmZpbmQoJ2lmcmFtZScpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtc2FuZGJveCcpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhdHRyICE9PSB0eXBlb2YgdW5kZWZpbmVkICYmIGF0dHIgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVDb250ZW50cyA9ICQoJyNzYW5kYm94ZXMgIycrYXR0cikuY29udGVudHMoKS5maW5kKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZUNvbnRlbnRzID0gJCh0aGlzKS5jb250ZW50cygpLmZpbmQoIGJDb25maWcucGFnZUNvbnRhaW5lciApLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoZUNvbnRlbnRzLmZpbmQoJy5mcmFtZUNvdmVyJykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy9yZW1vdmUgaW5saW5lIHN0eWxpbmcgbGVmdG92ZXJzXG4gICAgICAgICAgICAgICAgICAgIGZvciggdmFyIGtleSBpbiBiQ29uZmlnLmVkaXRhYmxlSXRlbXMgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoZUNvbnRlbnRzLmZpbmQoIGtleSApLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUF0dHIoJ2RhdGEtc2VsZWN0b3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS5hdHRyKCdzdHlsZScpID09PSAnJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBiQ29uZmlnLmVkaXRhYmxlQ29udGVudC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVDb250ZW50cy5maW5kKCBiQ29uZmlnLmVkaXRhYmxlQ29udGVudFtpXSApLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUF0dHIoJ2RhdGEtc2VsZWN0b3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cblx0XHRcdFxuICAgICAgICAgICAgICAgICAgICB2YXIgdG9BZGQgPSB0aGVDb250ZW50cy5odG1sKCk7XG5cdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICAvL2dyYWIgc2NyaXB0c1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2NyaXB0cyA9ICQodGhpcykuY29udGVudHMoKS5maW5kKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKS5maW5kKCdzY3JpcHQnKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmKCBzY3JpcHRzLnNpemUoKSA+IDAgKSB7XG5cdFx0XHRcdFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZUlmcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2tlbGV0b25cIiksIHNjcmlwdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0cy5lYWNoKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoICQodGhpcykudGV4dCgpICE9PSAnJyApIHsvL3NjcmlwdCB0YWdzIHdpdGggY29udGVudFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdCA9IHRoZUlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC5pbm5lckhUTUwgPSAkKHRoaXMpLnRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlSWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIGJDb25maWcucGFnZUNvbnRhaW5lci5zdWJzdHJpbmcoMSkgKS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggJCh0aGlzKS5hdHRyKCdzcmMnKSAhPT0gbnVsbCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdCA9IHRoZUlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdC5zcmMgPSAkKHRoaXMpLmF0dHIoJ3NyYycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVJZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCggYkNvbmZpZy5wYWdlQ29udGFpbmVyLnN1YnN0cmluZygxKSApLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG5ld0RvY01haW5QYXJlbnQuYXBwZW5kKCAkKHRvQWRkKSApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBuZXdJbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cInBhZ2VzWycrJCgnI3BhZ2VzIGxpOmVxKCcrKCQodGhpcykuaW5kZXgoKSsxKSsnKSBhOmZpcnN0JykudGV4dCgpKyddXCIgY2xhc3M9XCJwYWdlc1wiIHZhbHVlPVwiXCI+Jyk7XG4gICAgICAgICAgICAgICAgJCgnI2V4cG9ydE1vZGFsIGZvcm0nKS5wcmVwZW5kKCBuZXdJbnB1dCApO1xuICAgICAgICAgICAgICAgIG5ld0lucHV0LnZhbCggXCI8aHRtbD5cIiskKCdpZnJhbWUjc2tlbGV0b24nKS5jb250ZW50cygpLmZpbmQoJ2h0bWwnKS5odG1sKCkrXCI8L2h0bWw+XCIgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLypcbiAgICAgICAgICAgIGV2ZW50IGhhbmRsZXIgZm9yIHRoZSBleHBvcnQgZnJvbSBzdWJtaXRcbiAgICAgICAgKi9cbiAgICAgICAgZXhwb3J0Rm9ybVN1Ym1pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICQoJyNleHBvcnRNb2RhbCA+IGZvcm0gI2V4cG9ydFN1Ym1pdCcpLmhpZGUoJycpO1xuICAgICAgICAgICAgJCgnI2V4cG9ydE1vZGFsID4gZm9ybSAjZXhwb3J0Q2FuY2VsJykudGV4dCgnQ2xvc2UgV2luZG93Jyk7XG4gICAgICAgIFxuICAgICAgICB9XG4gICAgXG4gICAgfTtcbiAgICAgICAgXG4gICAgYmV4cG9ydC5pbml0KCk7XG5cbn0oKSk7IiwiKGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIGJDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy5qcycpO1xuXHR2YXIgc2l0ZUJ1aWxkZXIgPSByZXF1aXJlKCcuL2J1aWxkZXIuanMnKTtcblxuXHR2YXIgcHJldmlldyA9IHtcblxuICAgICAgICBtb2RhbFByZXZpZXc6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcmV2aWV3TW9kYWwnKSxcbiAgICAgICAgYnV0dG9uUHJldmlldzogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J1dHRvblByZXZpZXcnKSxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgLy9ldmVudHNcbiAgICAgICAgICAgICQodGhpcy5tb2RhbFByZXZpZXcpLm9uKCdzaG93bi5icy5tb2RhbCcsIHRoaXMucHJlcFByZXZpZXcpO1xuICAgICAgICAgICAgJCh0aGlzLm1vZGFsUHJldmlldykub24oJ3Nob3cuYnMubW9kYWwnLCB0aGlzLnByZXBQcmV2aWV3TGluayk7XG5cbiAgICAgICAgICAgIC8vcmV2ZWFsIHByZXZpZXcgYnV0dG9uXG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uUHJldmlldykuc2hvdygpO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgcHJlcGFyZXMgdGhlIHByZXZpZXcgZGF0YVxuICAgICAgICAqL1xuICAgICAgICBwcmVwUHJldmlldzogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICQoJyNwcmV2aWV3TW9kYWwgZm9ybSBpbnB1dFt0eXBlPVwiaGlkZGVuXCJdJykucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIC8vYnVpbGQgdGhlIHBhZ2VcbiAgICAgICAgICAgIHNpdGVCdWlsZGVyLnNpdGUuYWN0aXZlUGFnZS5mdWxsUGFnZSgpO1xuXG4gICAgICAgICAgICB2YXIgbmV3SW5wdXQ7XG5cbiAgICAgICAgICAgIC8vbWFya3VwXG4gICAgICAgICAgICBuZXdJbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cInBhZ2VcIiB2YWx1ZT1cIlwiPicpO1xuICAgICAgICAgICAgJCgnI3ByZXZpZXdNb2RhbCBmb3JtJykucHJlcGVuZCggbmV3SW5wdXQgKTtcbiAgICAgICAgICAgIG5ld0lucHV0LnZhbCggXCI8aHRtbD5cIiskKCdpZnJhbWUjc2tlbGV0b24nKS5jb250ZW50cygpLmZpbmQoJ2h0bWwnKS5odG1sKCkrXCI8L2h0bWw+XCIgKTtcblxuICAgICAgICAgICAgLy9wYWdlIHRpdGxlXG4gICAgICAgICAgICBuZXdJbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIm1ldGFfdGl0bGVcIiB2YWx1ZT1cIlwiPicpO1xuICAgICAgICAgICAgJCgnI3ByZXZpZXdNb2RhbCBmb3JtJykucHJlcGVuZCggbmV3SW5wdXQgKTtcbiAgICAgICAgICAgIG5ld0lucHV0LnZhbCggc2l0ZUJ1aWxkZXIuc2l0ZS5hY3RpdmVQYWdlLnBhZ2VTZXR0aW5ncy50aXRsZSApO1xuICAgICAgICAgICAgLy9hbGVydChKU09OLnN0cmluZ2lmeShzaXRlQnVpbGRlci5zaXRlLmFjdGl2ZVBhZ2UucGFnZVNldHRpbmdzKSk7XG5cbiAgICAgICAgICAgIC8vcGFnZSBtZXRhIGRlc2NyaXB0aW9uXG4gICAgICAgICAgICBuZXdJbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIm1ldGFfZGVzY3JpcHRpb25cIiB2YWx1ZT1cIlwiPicpO1xuICAgICAgICAgICAgJCgnI3ByZXZpZXdNb2RhbCBmb3JtJykucHJlcGVuZCggbmV3SW5wdXQgKTtcbiAgICAgICAgICAgIG5ld0lucHV0LnZhbCggc2l0ZUJ1aWxkZXIuc2l0ZS5hY3RpdmVQYWdlLnBhZ2VTZXR0aW5ncy5tZXRhX2Rlc2NyaXB0aW9uICk7XG5cbiAgICAgICAgICAgIC8vcGFnZSBtZXRhIGtleXdvcmRzXG4gICAgICAgICAgICBuZXdJbnB1dCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIm1ldGFfa2V5d29yZHNcIiB2YWx1ZT1cIlwiPicpO1xuICAgICAgICAgICAgJCgnI3ByZXZpZXdNb2RhbCBmb3JtJykucHJlcGVuZCggbmV3SW5wdXQgKTtcbiAgICAgICAgICAgIG5ld0lucHV0LnZhbCggc2l0ZUJ1aWxkZXIuc2l0ZS5hY3RpdmVQYWdlLnBhZ2VTZXR0aW5ncy5tZXRhX2tleXdvcmRzICk7XG5cbiAgICAgICAgICAgIC8vcGFnZSBoZWFkZXIgaW5jbHVkZXNcbiAgICAgICAgICAgIG5ld0lucHV0ID0gJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwiaGVhZGVyX2luY2x1ZGVzXCIgdmFsdWU9XCJcIj4nKTtcbiAgICAgICAgICAgICQoJyNwcmV2aWV3TW9kYWwgZm9ybScpLnByZXBlbmQoIG5ld0lucHV0ICk7XG4gICAgICAgICAgICBuZXdJbnB1dC52YWwoIHNpdGVCdWlsZGVyLnNpdGUuYWN0aXZlUGFnZS5wYWdlU2V0dGluZ3MuaGVhZGVyX2luY2x1ZGVzICk7XG5cbiAgICAgICAgICAgIC8vcGFnZSBjc3NcbiAgICAgICAgICAgIG5ld0lucHV0ID0gJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwicGFnZV9jc3NcIiB2YWx1ZT1cIlwiPicpO1xuICAgICAgICAgICAgJCgnI3ByZXZpZXdNb2RhbCBmb3JtJykucHJlcGVuZCggbmV3SW5wdXQgKTtcbiAgICAgICAgICAgIG5ld0lucHV0LnZhbCggc2l0ZUJ1aWxkZXIuc2l0ZS5hY3RpdmVQYWdlLnBhZ2VTZXR0aW5ncy5wYWdlX2NzcyApO1xuXG4gICAgICAgICAgICAvL3NpdGUgSURcbiAgICAgICAgICAgIG5ld0lucHV0ID0gJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwic2l0ZUlEXCIgdmFsdWU9XCJcIj4nKTtcbiAgICAgICAgICAgICQoJyNwcmV2aWV3TW9kYWwgZm9ybScpLnByZXBlbmQoIG5ld0lucHV0ICk7XG4gICAgICAgICAgICBuZXdJbnB1dC52YWwoIHNpdGVCdWlsZGVyLnNpdGUuZGF0YS5zaXRlc19pZCApO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgcHJlcGFyZXMgdGhlIGFjdHVhbCBwcmV2aWV3IGxpbmtcbiAgICAgICAgKi9cbiAgICAgICAgcHJlcFByZXZpZXdMaW5rOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgJCgnI3BhZ2VQcmV2aWV3TGluaycpLmF0dHIoICdocmVmJywgJCgnI3BhZ2VQcmV2aWV3TGluaycpLmF0dHIoJ2RhdGEtZGVmdXJsJykrJCgnI3BhZ2VzIGxpLmFjdGl2ZSBhJykudGV4dCgpICk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIHByZXZpZXcuaW5pdCgpO1xuXG59KCkpOyIsIihmdW5jdGlvbiAoKXtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIGNhbnZhc0VsZW1lbnQgPSByZXF1aXJlKCcuL2NhbnZhc0VsZW1lbnQuanMnKS5FbGVtZW50O1xuXHR2YXIgYkNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnLmpzJyk7XG5cdHZhciBzaXRlQnVpbGRlciA9IHJlcXVpcmUoJy4vYnVpbGRlci5qcycpO1xuICAgIHZhciBwdWJsaXNoZXIgPSByZXF1aXJlKCcuLi92ZW5kb3IvcHVibGlzaGVyJyk7XG5cbiAgICB2YXIgc3R5bGVlZGl0b3IgPSB7XG5cbiAgICAgICAgcmFkaW9TdHlsZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGVTdHlsZScpLFxuICAgICAgICBsYWJlbFN0eWxlTW9kZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGVTdHlsZUxhYmVsJyksXG4gICAgICAgIGJ1dHRvblNhdmVDaGFuZ2VzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2F2ZVN0eWxpbmcnKSxcbiAgICAgICAgYWN0aXZlRWxlbWVudDoge30sIC8vaG9sZHMgdGhlIGVsZW1lbnQgY3VycmVudHkgYmVpbmcgZWRpdGVkXG4gICAgICAgIGFsbFN0eWxlSXRlbXNPbkNhbnZhczogW10sXG4gICAgICAgIF9vbGRJY29uOiBbXSxcbiAgICAgICAgc3R5bGVFZGl0b3I6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdHlsZUVkaXRvcicpLFxuICAgICAgICBmb3JtU3R5bGU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdHlsaW5nRm9ybScpLFxuICAgICAgICBidXR0b25SZW1vdmVFbGVtZW50OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVsZXRlRWxlbWVudENvbmZpcm0nKSxcbiAgICAgICAgYnV0dG9uQ2xvbmVFbGVtZW50OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2xvbmVFbGVtZW50QnV0dG9uJyksXG4gICAgICAgIGJ1dHRvblJlc2V0RWxlbWVudDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc2V0U3R5bGVCdXR0b24nKSxcbiAgICAgICAgc2VsZWN0TGlua3NJbmVybmFsOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW50ZXJuYWxMaW5rc0Ryb3Bkb3duJyksXG4gICAgICAgIHNlbGVjdExpbmtzUGFnZXM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlTGlua3NEcm9wZG93bicpLFxuICAgICAgICB2aWRlb0lucHV0WW91dHViZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3lvdXR1YmVJRCcpLFxuICAgICAgICB2aWRlb0lucHV0VmltZW86IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aW1lb0lEJyksXG4gICAgICAgIGlucHV0Q3VzdG9tTGluazogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ludGVybmFsTGlua3NDdXN0b20nKSxcbiAgICAgICAgc2VsZWN0SWNvbnM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpY29ucycpLFxuICAgICAgICBidXR0b25EZXRhaWxzQXBwbGllZEhpZGU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXRhaWxzQXBwbGllZE1lc3NhZ2VIaWRlJyksXG4gICAgICAgIGJ1dHRvbkNsb3NlU3R5bGVFZGl0b3I6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdHlsZUVkaXRvciA+IGEuY2xvc2UnKSxcbiAgICAgICAgdWxQYWdlTGlzdDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2VMaXN0JyksXG5cbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHB1Ymxpc2hlci5zdWJzY3JpYmUoJ2Nsb3NlU3R5bGVFZGl0b3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc3R5bGVlZGl0b3IuY2xvc2VTdHlsZUVkaXRvcigpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vZXZlbnRzXG4gICAgICAgICAgICAkKHRoaXMucmFkaW9TdHlsZSkub24oJ2NsaWNrJywgdGhpcy5hY3RpdmF0ZVN0eWxlTW9kZSk7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uU2F2ZUNoYW5nZXMpLm9uKCdjbGljaycsIHRoaXMudXBkYXRlU3R5bGluZyk7XG4gICAgICAgICAgICAkKHRoaXMuZm9ybVN0eWxlKS5vbignZm9jdXMnLCAnaW5wdXQnLCB0aGlzLmFuaW1hdGVTdHlsZUlucHV0SW4pLm9uKCdibHVyJywgJ2lucHV0JywgdGhpcy5hbmltYXRlU3R5bGVJbnB1dE91dCk7XG4gICAgICAgICAgICAkKHRoaXMuYnV0dG9uUmVtb3ZlRWxlbWVudCkub24oJ2NsaWNrJywgdGhpcy5kZWxldGVFbGVtZW50KTtcbiAgICAgICAgICAgICQodGhpcy5idXR0b25DbG9uZUVsZW1lbnQpLm9uKCdjbGljaycsIHRoaXMuY2xvbmVFbGVtZW50KTtcbiAgICAgICAgICAgICQodGhpcy5idXR0b25SZXNldEVsZW1lbnQpLm9uKCdjbGljaycsIHRoaXMucmVzZXRFbGVtZW50KTtcbiAgICAgICAgICAgICQodGhpcy5zZWxlY3RMaW5rc0luZXJuYWwpLm9uKCdjaGFuZ2UnLCB0aGlzLnJlc2V0U2VsZWN0TGlua3NJbnRlcm5hbCk7XG4gICAgICAgICAgICAkKHRoaXMuc2VsZWN0TGlua3NQYWdlcykub24oJ2NoYW5nZScsIHRoaXMucmVzZXRTZWxlY3RMaW5rc1BhZ2VzKTtcbiAgICAgICAgICAgICQodGhpcy52aWRlb0lucHV0WW91dHViZSkub24oJ2ZvY3VzJywgZnVuY3Rpb24oKXsgJChzdHlsZWVkaXRvci52aWRlb0lucHV0VmltZW8pLnZhbCgnJyk7IH0pO1xuICAgICAgICAgICAgJCh0aGlzLnZpZGVvSW5wdXRWaW1lbykub24oJ2ZvY3VzJywgZnVuY3Rpb24oKXsgJChzdHlsZWVkaXRvci52aWRlb0lucHV0WW91dHViZSkudmFsKCcnKTsgfSk7XG4gICAgICAgICAgICAkKHRoaXMuaW5wdXRDdXN0b21MaW5rKS5vbignZm9jdXMnLCB0aGlzLnJlc2V0U2VsZWN0QWxsTGlua3MpO1xuICAgICAgICAgICAgJCh0aGlzLmJ1dHRvbkRldGFpbHNBcHBsaWVkSGlkZSkub24oJ2NsaWNrJywgZnVuY3Rpb24oKXskKHRoaXMpLnBhcmVudCgpLmZhZGVPdXQoNTAwKTt9KTtcbiAgICAgICAgICAgICQodGhpcy5idXR0b25DbG9zZVN0eWxlRWRpdG9yKS5vbignY2xpY2snLCB0aGlzLmNsb3NlU3R5bGVFZGl0b3IpO1xuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ21vZGVDb250ZW50IG1vZGVCbG9ja3MnLCAnYm9keScsIHRoaXMuZGVBY3RpdmF0ZU1vZGUpO1xuXG4gICAgICAgICAgICAvL2Nob3NlbiBmb250LWF3ZXNvbWUgZHJvcGRvd25cbiAgICAgICAgICAgICQodGhpcy5zZWxlY3RJY29ucykuY2hvc2VuKHsnc2VhcmNoX2NvbnRhaW5zJzogdHJ1ZX0pO1xuXG4gICAgICAgICAgICAvL2NoZWNrIGlmIGZvcm1EYXRhIGlzIHN1cHBvcnRlZFxuICAgICAgICAgICAgaWYgKCF3aW5kb3cuRm9ybURhdGEpe1xuICAgICAgICAgICAgICAgIHRoaXMuaGlkZUZpbGVVcGxvYWRzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vc2hvdyB0aGUgc3R5bGUgbW9kZSByYWRpbyBidXR0b25cbiAgICAgICAgICAgICQodGhpcy5sYWJlbFN0eWxlTW9kZSkuc2hvdygpO1xuXG4gICAgICAgICAgICAvL2xpc3RlbiBmb3IgdGhlIGJlZm9yZVNhdmUgZXZlbnRcbiAgICAgICAgICAgICQoJ2JvZHknKS5vbignYmVmb3JlU2F2ZScsIHRoaXMuY2xvc2VTdHlsZUVkaXRvcik7XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBBY3RpdmF0ZXMgc3R5bGUgZWRpdG9yIG1vZGVcbiAgICAgICAgKi9cbiAgICAgICAgYWN0aXZhdGVTdHlsZU1vZGU6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgaTtcblxuICAgICAgICAgICAgLy9FbGVtZW50IG9iamVjdCBleHRlbnRpb25cbiAgICAgICAgICAgIGNhbnZhc0VsZW1lbnQucHJvdG90eXBlLmNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgICAgc3R5bGVlZGl0b3Iuc3R5bGVDbGljayhlbCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBSZW1vdmUgb3ZlcmxheSBzcGFuIGZyb20gcG9ydGZvbGlvXG4gICAgICAgICAgICBmb3IoaSA9IDE7IGkgPD0gJChcInVsI3BhZ2UxIGxpXCIpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgaWQgPSBcIiN1aS1pZC1cIiArIGk7XG4gICAgICAgICAgICAgICAgJChpZCkuY29udGVudHMoKS5maW5kKFwiLm92ZXJsYXlcIikucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgLy90cmlnZ2VyIGN1c3RvbSBldmVudFxuICAgICAgICAgICAgJCgnYm9keScpLnRyaWdnZXIoJ21vZGVEZXRhaWxzJyk7XG5cbiAgICAgICAgICAgIC8vZGlzYWJsZSBmcmFtZUNvdmVyc1xuICAgICAgICAgICAgZm9yKCBpID0gMDsgaSA8IHNpdGVCdWlsZGVyLnNpdGUuc2l0ZVBhZ2VzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgIHNpdGVCdWlsZGVyLnNpdGUuc2l0ZVBhZ2VzW2ldLnRvZ2dsZUZyYW1lQ292ZXJzKCdPZmYnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9jcmVhdGUgYW4gb2JqZWN0IGZvciBldmVyeSBlZGl0YWJsZSBlbGVtZW50IG9uIHRoZSBjYW52YXMgYW5kIHNldHVwIGl0J3MgZXZlbnRzXG5cbiAgICAgICAgICAgIGZvciggaSA9IDA7IGkgPCBzaXRlQnVpbGRlci5zaXRlLnNpdGVQYWdlcy5sZW5ndGg7IGkrKyApIHtcblxuICAgICAgICAgICAgICAgIGZvciggdmFyIHggPSAwOyB4IDwgc2l0ZUJ1aWxkZXIuc2l0ZS5zaXRlUGFnZXNbaV0uYmxvY2tzLmxlbmd0aDsgeCsrICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciggdmFyIGtleSBpbiBiQ29uZmlnLmVkaXRhYmxlSXRlbXMgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICQoc2l0ZUJ1aWxkZXIuc2l0ZS5zaXRlUGFnZXNbaV0uYmxvY2tzW3hdLmZyYW1lKS5jb250ZW50cygpLmZpbmQoIGJDb25maWcucGFnZUNvbnRhaW5lciArICcgJysga2V5ICkuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0VsZW1lbnQgPSBuZXcgY2FudmFzRWxlbWVudCh0aGlzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0VsZW1lbnQuYWN0aXZhdGUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlZWRpdG9yLmFsbFN0eWxlSXRlbXNPbkNhbnZhcy5wdXNoKCBuZXdFbGVtZW50ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmF0dHIoJ2RhdGEtc2VsZWN0b3InLCBrZXkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyokKCcjcGFnZUxpc3QgdWwgbGkgaWZyYW1lJykuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgZm9yKCB2YXIga2V5IGluIGJDb25maWcuZWRpdGFibGVJdGVtcyApIHtcblxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNvbnRlbnRzKCkuZmluZCggYkNvbmZpZy5wYWdlQ29udGFpbmVyICsgJyAnKyBrZXkgKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdFbGVtZW50ID0gbmV3IGNhbnZhc0VsZW1lbnQodGhpcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0VsZW1lbnQuYWN0aXZhdGUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVlZGl0b3IuYWxsU3R5bGVJdGVtc09uQ2FudmFzLnB1c2goIG5ld0VsZW1lbnQgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hdHRyKCdkYXRhLXNlbGVjdG9yJywga2V5KTtcblxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSk7Ki9cblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIEV2ZW50IGhhbmRsZXIgZm9yIHdoZW4gdGhlIHN0eWxlIGVkaXRvciBpcyBlbnZva2VkIG9uIGFuIGl0ZW1cbiAgICAgICAgKi9cbiAgICAgICAgc3R5bGVDbGljazogZnVuY3Rpb24oZWwpIHtcblxuICAgICAgICAgICAgLy9pZiB3ZSBoYXZlIGFuIGFjdGl2ZSBlbGVtZW50LCBtYWtlIGl0IHVuYWN0aXZlXG4gICAgICAgICAgICBpZiggT2JqZWN0LmtleXModGhpcy5hY3RpdmVFbGVtZW50KS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUVsZW1lbnQuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9zZXQgdGhlIGFjdGl2ZSBlbGVtZW50XG4gICAgICAgICAgICB2YXIgYWN0aXZlRWxlbWVudCA9IG5ldyBjYW52YXNFbGVtZW50KGVsKTtcbiAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQuc2V0UGFyZW50QmxvY2soKTtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlRWxlbWVudCA9IGFjdGl2ZUVsZW1lbnQ7XG5cbiAgICAgICAgICAgIC8vdW5iaW5kIGhvdmVyIGFuZCBjbGljayBldmVudHMgYW5kIG1ha2UgdGhpcyBpdGVtIGFjdGl2ZVxuICAgICAgICAgICAgdGhpcy5hY3RpdmVFbGVtZW50LnNldE9wZW4oKTtcblxuICAgICAgICAgICAgdmFyIHRoZVNlbGVjdG9yID0gJCh0aGlzLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuYXR0cignZGF0YS1zZWxlY3RvcicpO1xuXG4gICAgICAgICAgICAkKCcjZWRpdGluZ0VsZW1lbnQnKS50ZXh0KCB0aGVTZWxlY3RvciApO1xuXG4gICAgICAgICAgICAvL2FjdGl2YXRlIGZpcnN0IHRhYlxuICAgICAgICAgICAgJCgnI2RldGFpbFRhYnMgYTpmaXJzdCcpLmNsaWNrKCk7XG5cbiAgICAgICAgICAgIC8vaGlkZSBhbGwgYnkgZGVmYXVsdFxuICAgICAgICAgICAgJCgndWwjZGV0YWlsVGFicyBsaTpndCgwKScpLmhpZGUoKTtcblxuICAgICAgICAgICAgLy93aGF0IGFyZSB3ZSBkZWFsaW5nIHdpdGg/XG4gICAgICAgICAgICBpZiggJCh0aGlzLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucHJvcCgndGFnTmFtZScpID09PSAnQScgfHwgJCh0aGlzLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucGFyZW50KCkucHJvcCgndGFnTmFtZScpID09PSAnQScgKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRMaW5rKHRoaXMuYWN0aXZlRWxlbWVudC5lbGVtZW50KTtcblxuICAgICAgICAgICAgfVxuXG5cdFx0XHRpZiggJCh0aGlzLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucHJvcCgndGFnTmFtZScpID09PSAnSU1HJyApe1xuXG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0SW1hZ2UodGhpcy5hY3RpdmVFbGVtZW50LmVsZW1lbnQpO1xuXG4gICAgICAgICAgICB9XG5cblx0XHRcdGlmKCAkKHRoaXMuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5hdHRyKCdkYXRhLXR5cGUnKSA9PT0gJ3ZpZGVvJyApIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuZWRpdFZpZGVvKHRoaXMuYWN0aXZlRWxlbWVudC5lbGVtZW50KTtcblxuICAgICAgICAgICAgfVxuXG5cdFx0XHRpZiggJCh0aGlzLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuaGFzQ2xhc3MoJ2ZhJykgKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRJY29uKHRoaXMuYWN0aXZlRWxlbWVudC5lbGVtZW50KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL2xvYWQgdGhlIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgIHRoaXMuYnVpbGRlU3R5bGVFbGVtZW50cyh0aGVTZWxlY3Rvcik7XG5cbiAgICAgICAgICAgIC8vb3BlbiBzaWRlIHBhbmVsXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZVNpZGVQYW5lbCgnb3BlbicpO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGR5bmFtaWNhbGx5IGdlbmVyYXRlcyB0aGUgZm9ybSBmaWVsZHMgZm9yIGVkaXRpbmcgYW4gZWxlbWVudHMgc3R5bGUgYXR0cmlidXRlc1xuICAgICAgICAqL1xuICAgICAgICBidWlsZGVTdHlsZUVsZW1lbnRzOiBmdW5jdGlvbih0aGVTZWxlY3Rvcikge1xuXG4gICAgICAgICAgICAvL2RlbGV0ZSB0aGUgb2xkIG9uZXMgZmlyc3RcbiAgICAgICAgICAgICQoJyNzdHlsZUVsZW1lbnRzID4gKjpub3QoI3N0eWxlRWxUZW1wbGF0ZSknKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZm9yKCB2YXIgeD0wOyB4PGJDb25maWcuZWRpdGFibGVJdGVtc1t0aGVTZWxlY3Rvcl0ubGVuZ3RoOyB4KysgKSB7XG5cbiAgICAgICAgICAgICAgICAvL2NyZWF0ZSBzdHlsZSBlbGVtZW50c1xuICAgICAgICAgICAgICAgIHZhciBuZXdTdHlsZUVsID0gJCgnI3N0eWxlRWxUZW1wbGF0ZScpLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgbmV3U3R5bGVFbC5hdHRyKCdpZCcsICcnKTtcbiAgICAgICAgICAgICAgICBuZXdTdHlsZUVsLmZpbmQoJy5jb250cm9sLWxhYmVsJykudGV4dCggYkNvbmZpZy5lZGl0YWJsZUl0ZW1zW3RoZVNlbGVjdG9yXVt4XStcIjpcIiApO1xuXG4gICAgICAgICAgICAgICAgaWYoIHRoZVNlbGVjdG9yICsgXCIgOiBcIiArIGJDb25maWcuZWRpdGFibGVJdGVtc1t0aGVTZWxlY3Rvcl1beF0gaW4gYkNvbmZpZy5lZGl0YWJsZUl0ZW1PcHRpb25zKSB7Ly93ZSd2ZSBnb3QgYSBkcm9wZG93biBpbnN0ZWFkIG9mIG9wZW4gdGV4dCBpbnB1dFxuXG4gICAgICAgICAgICAgICAgICAgIG5ld1N0eWxlRWwuZmluZCgnaW5wdXQnKS5yZW1vdmUoKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RHJvcERvd24gPSAkKCc8c2VsZWN0IGNsYXNzPVwiZm9ybS1jb250cm9sIHNlbGVjdCBzZWxlY3QtcHJpbWFyeSBidG4tYmxvY2sgc2VsZWN0LXNtXCI+PC9zZWxlY3Q+Jyk7XG4gICAgICAgICAgICAgICAgICAgIG5ld0Ryb3BEb3duLmF0dHIoJ25hbWUnLCBiQ29uZmlnLmVkaXRhYmxlSXRlbXNbdGhlU2VsZWN0b3JdW3hdKTtcblxuXG4gICAgICAgICAgICAgICAgICAgIGZvciggdmFyIHo9MDsgejxiQ29uZmlnLmVkaXRhYmxlSXRlbU9wdGlvbnNbIHRoZVNlbGVjdG9yK1wiIDogXCIrYkNvbmZpZy5lZGl0YWJsZUl0ZW1zW3RoZVNlbGVjdG9yXVt4XSBdLmxlbmd0aDsgeisrICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3T3B0aW9uID0gJCgnPG9wdGlvbiB2YWx1ZT1cIicrYkNvbmZpZy5lZGl0YWJsZUl0ZW1PcHRpb25zW3RoZVNlbGVjdG9yK1wiIDogXCIrYkNvbmZpZy5lZGl0YWJsZUl0ZW1zW3RoZVNlbGVjdG9yXVt4XV1bel0rJ1wiPicrYkNvbmZpZy5lZGl0YWJsZUl0ZW1PcHRpb25zW3RoZVNlbGVjdG9yK1wiIDogXCIrYkNvbmZpZy5lZGl0YWJsZUl0ZW1zW3RoZVNlbGVjdG9yXVt4XV1bel0rJzwvb3B0aW9uPicpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCBiQ29uZmlnLmVkaXRhYmxlSXRlbU9wdGlvbnNbdGhlU2VsZWN0b3IrXCIgOiBcIitiQ29uZmlnLmVkaXRhYmxlSXRlbXNbdGhlU2VsZWN0b3JdW3hdXVt6XSA9PT0gJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmNzcyggYkNvbmZpZy5lZGl0YWJsZUl0ZW1zW3RoZVNlbGVjdG9yXVt4XSApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY3VycmVudCB2YWx1ZSwgbWFya2VkIGFzIHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3T3B0aW9uLmF0dHIoJ3NlbGVjdGVkJywgJ3RydWUnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdEcm9wRG93bi5hcHBlbmQoIG5ld09wdGlvbiApO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBuZXdTdHlsZUVsLmFwcGVuZCggbmV3RHJvcERvd24gKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3RHJvcERvd24uc2VsZWN0MigpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBuZXdTdHlsZUVsLmZpbmQoJ2lucHV0JykudmFsKCAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuY3NzKCBiQ29uZmlnLmVkaXRhYmxlSXRlbXNbdGhlU2VsZWN0b3JdW3hdICkgKS5hdHRyKCduYW1lJywgYkNvbmZpZy5lZGl0YWJsZUl0ZW1zW3RoZVNlbGVjdG9yXVt4XSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoIGJDb25maWcuZWRpdGFibGVJdGVtc1t0aGVTZWxlY3Rvcl1beF0gPT09ICdiYWNrZ3JvdW5kLWltYWdlJyApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3U3R5bGVFbC5maW5kKCdpbnB1dCcpLmJpbmQoJ2ZvY3VzJywgZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGVJbnB1dCA9ICQodGhpcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcjaW1hZ2VNb2RhbCcpLm1vZGFsKCdzaG93Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnI2ltYWdlTW9kYWwgLmltYWdlIGJ1dHRvbi51c2VJbWFnZScpLnVuYmluZCgnY2xpY2snKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcjaW1hZ2VNb2RhbCcpLm9uKCdjbGljaycsICcuaW1hZ2UgYnV0dG9uLnVzZUltYWdlJywgZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuY3NzKCdiYWNrZ3JvdW5kLWltYWdlJywgICd1cmwoXCInKyQodGhpcykuYXR0cignZGF0YS11cmwnKSsnXCIpJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy91cGRhdGUgbGl2ZSBpbWFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVJbnB1dC52YWwoICd1cmwoXCInKyQodGhpcykuYXR0cignZGF0YS11cmwnKSsnXCIpJyApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vaGlkZSBtb2RhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcjaW1hZ2VNb2RhbCcpLm1vZGFsKCdoaWRlJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy93ZSd2ZSBnb3QgcGVuZGluZyBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpdGVCdWlsZGVyLnNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKCBiQ29uZmlnLmVkaXRhYmxlSXRlbXNbdGhlU2VsZWN0b3JdW3hdLmluZGV4T2YoXCJjb2xvclwiKSA+IC0xICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmNzcyggYkNvbmZpZy5lZGl0YWJsZUl0ZW1zW3RoZVNlbGVjdG9yXVt4XSApICE9PSAndHJhbnNwYXJlbnQnICYmICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5jc3MoIGJDb25maWcuZWRpdGFibGVJdGVtc1t0aGVTZWxlY3Rvcl1beF0gKSAhPT0gJ25vbmUnICYmICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5jc3MoIGJDb25maWcuZWRpdGFibGVJdGVtc1t0aGVTZWxlY3Rvcl1beF0gKSAhPT0gJycgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdTdHlsZUVsLnZhbCggJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmNzcyggYkNvbmZpZy5lZGl0YWJsZUl0ZW1zW3RoZVNlbGVjdG9yXVt4XSApICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3U3R5bGVFbC5maW5kKCdpbnB1dCcpLnNwZWN0cnVtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmZXJyZWRGb3JtYXQ6IFwiaGV4XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1BhbGV0dGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFsZXR0ZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXCIjMDAwXCIsXCIjNDQ0XCIsXCIjNjY2XCIsXCIjOTk5XCIsXCIjY2NjXCIsXCIjZWVlXCIsXCIjZjNmM2YzXCIsXCIjZmZmXCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXCIjZjAwXCIsXCIjZjkwXCIsXCIjZmYwXCIsXCIjMGYwXCIsXCIjMGZmXCIsXCIjMDBmXCIsXCIjOTBmXCIsXCIjZjBmXCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXCIjZjRjY2NjXCIsXCIjZmNlNWNkXCIsXCIjZmZmMmNjXCIsXCIjZDllYWQzXCIsXCIjZDBlMGUzXCIsXCIjY2ZlMmYzXCIsXCIjZDlkMmU5XCIsXCIjZWFkMWRjXCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXCIjZWE5OTk5XCIsXCIjZjljYjljXCIsXCIjZmZlNTk5XCIsXCIjYjZkN2E4XCIsXCIjYTJjNGM5XCIsXCIjOWZjNWU4XCIsXCIjYjRhN2Q2XCIsXCIjZDVhNmJkXCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXCIjZTA2NjY2XCIsXCIjZjZiMjZiXCIsXCIjZmZkOTY2XCIsXCIjOTNjNDdkXCIsXCIjNzZhNWFmXCIsXCIjNmZhOGRjXCIsXCIjOGU3Y2MzXCIsXCIjYzI3YmEwXCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXCIjYzAwXCIsXCIjZTY5MTM4XCIsXCIjZjFjMjMyXCIsXCIjNmFhODRmXCIsXCIjNDU4MThlXCIsXCIjM2Q4NWM2XCIsXCIjNjc0ZWE3XCIsXCIjYTY0ZDc5XCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXCIjOTAwXCIsXCIjYjQ1ZjA2XCIsXCIjYmY5MDAwXCIsXCIjMzg3NjFkXCIsXCIjMTM0ZjVjXCIsXCIjMGI1Mzk0XCIsXCIjMzUxYzc1XCIsXCIjNzQxYjQ3XCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXCIjNjAwXCIsXCIjNzgzZjA0XCIsXCIjN2Y2MDAwXCIsXCIjMjc0ZTEzXCIsXCIjMGMzNDNkXCIsXCIjMDczNzYzXCIsXCIjMjAxMjRkXCIsXCIjNGMxMTMwXCJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbmV3U3R5bGVFbC5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKTtcblxuICAgICAgICAgICAgICAgICQoJyNzdHlsZUVsZW1lbnRzJykuYXBwZW5kKCBuZXdTdHlsZUVsICk7XG5cbiAgICAgICAgICAgICAgICAkKCcjc3R5bGVFZGl0b3IgZm9ybSNzdHlsaW5nRm9ybScpLmhlaWdodCgnYXV0bycpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBBcHBsaWVzIHVwZGF0ZWQgc3R5bGluZyB0byB0aGUgY2FudmFzXG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZVN0eWxpbmc6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgZWxlbWVudElEO1xuXG4gICAgICAgICAgICAkKCcjc3R5bGVFZGl0b3IgI3RhYjEgLmZvcm0tZ3JvdXA6bm90KCNzdHlsZUVsVGVtcGxhdGUpIGlucHV0LCAjc3R5bGVFZGl0b3IgI3RhYjEgLmZvcm0tZ3JvdXA6bm90KCNzdHlsZUVsVGVtcGxhdGUpIHNlbGVjdCcpLmVhY2goZnVuY3Rpb24oKXtcblxuXHRcdFx0XHRpZiggJCh0aGlzKS5hdHRyKCduYW1lJykgIT09IHVuZGVmaW5lZCApIHtcblxuICAgICAgICAgICAgICAgIFx0JChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmNzcyggJCh0aGlzKS5hdHRyKCduYW1lJyksICAkKHRoaXMpLnZhbCgpKTtcblxuXHRcdFx0XHR9XG5cbiAgICAgICAgICAgICAgICAvKiBTQU5EQk9YICovXG5cbiAgICAgICAgICAgICAgICBpZiggc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5zYW5kYm94ICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRJRCA9ICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5hdHRyKCdpZCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICQoJyMnK3N0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuc2FuZGJveCkuY29udGVudHMoKS5maW5kKCcjJytlbGVtZW50SUQpLmNzcyggJCh0aGlzKS5hdHRyKCduYW1lJyksICAkKHRoaXMpLnZhbCgpICk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBFTkQgU0FOREJPWCAqL1xuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy9saW5rc1xuICAgICAgICAgICAgaWYoICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5wcm9wKCd0YWdOYW1lJykgPT09ICdBJyApIHtcblxuICAgICAgICAgICAgICAgIC8vY2hhbmdlIHRoZSBocmVmIHByb3A/XG4gICAgICAgICAgICAgICAgaWYoICQoJ3NlbGVjdCNpbnRlcm5hbExpbmtzRHJvcGRvd24nKS52YWwoKSAhPT0gJyMnICkge1xuXG4gICAgICAgICAgICAgICAgICAgICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5hdHRyKCdocmVmJywgJCgnc2VsZWN0I2ludGVybmFsTGlua3NEcm9wZG93bicpLnZhbCgpKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggJCgnc2VsZWN0I3BhZ2VMaW5rc0Ryb3Bkb3duJykudmFsKCkgIT09ICcjJyApIHtcblxuICAgICAgICAgICAgICAgICAgICAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuYXR0cignaHJlZicsICQoJ3NlbGVjdCNwYWdlTGlua3NEcm9wZG93bicpLnZhbCgpICk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoICQoJ2lucHV0I2ludGVybmFsTGlua3NDdXN0b20nKS52YWwoKSAhPT0gJycgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmF0dHIoJ2hyZWYnLCAkKCdpbnB1dCNpbnRlcm5hbExpbmtzQ3VzdG9tJykudmFsKCkpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogU0FOREJPWCAqL1xuXG4gICAgICAgICAgICAgICAgaWYoIHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuc2FuZGJveCApIHtcblxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50SUQgPSAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuYXR0cignaWQnKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiggJCgnc2VsZWN0I2ludGVybmFsTGlua3NEcm9wZG93bicpLnZhbCgpICE9PSAnIycgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyMnK3N0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuc2FuZGJveCkuY29udGVudHMoKS5maW5kKCcjJytlbGVtZW50SUQpLmF0dHIoJ2hyZWYnLCAkKCdzZWxlY3QjaW50ZXJuYWxMaW5rc0Ryb3Bkb3duJykudmFsKCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggJCgnc2VsZWN0I3BhZ2VMaW5rc0Ryb3Bkb3duJykudmFsKCkgIT09ICcjJyApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnIycrc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5zYW5kYm94KS5jb250ZW50cygpLmZpbmQoJyMnK2VsZW1lbnRJRCkuYXR0cignaHJlZicsICQoJ3NlbGVjdCNwYWdlTGlua3NEcm9wZG93bicpLnZhbCgpICk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKCAkKCdpbnB1dCNpbnRlcm5hbExpbmtzQ3VzdG9tJykudmFsKCkgIT09ICcnICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjJytzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnNhbmRib3gpLmNvbnRlbnRzKCkuZmluZCgnIycrZWxlbWVudElEKS5hdHRyKCdocmVmJywgJCgnaW5wdXQjaW50ZXJuYWxMaW5rc0N1c3RvbScpLnZhbCgpKTtcblxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBFTkQgU0FOREJPWCAqL1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucGFyZW50KCkucHJvcCgndGFnTmFtZScpID09PSAnQScgKSB7XG5cbiAgICAgICAgICAgICAgICAvL2NoYW5nZSB0aGUgaHJlZiBwcm9wP1xuXHRcdFx0XHRpZiggJCgnc2VsZWN0I2ludGVybmFsTGlua3NEcm9wZG93bicpLnZhbCgpICE9PSAnIycgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLnBhcmVudCgpLmF0dHIoJ2hyZWYnLCAkKCdzZWxlY3QjaW50ZXJuYWxMaW5rc0Ryb3Bkb3duJykudmFsKCkpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKCAkKCdzZWxlY3QjcGFnZUxpbmtzRHJvcGRvd24nKS52YWwoKSAhPT0gJyMnICkge1xuXG4gICAgICAgICAgICAgICAgICAgICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5wYXJlbnQoKS5hdHRyKCdocmVmJywgJCgnc2VsZWN0I3BhZ2VMaW5rc0Ryb3Bkb3duJykudmFsKCkgKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggJCgnaW5wdXQjaW50ZXJuYWxMaW5rc0N1c3RvbScpLnZhbCgpICE9PSAnJyApIHtcblxuICAgICAgICAgICAgICAgICAgICAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucGFyZW50KCkuYXR0cignaHJlZicsICQoJ2lucHV0I2ludGVybmFsTGlua3NDdXN0b20nKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBTQU5EQk9YICovXG5cbiAgICAgICAgICAgICAgICBpZiggc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5zYW5kYm94ICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRJRCA9ICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5hdHRyKCdpZCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKCAkKCdzZWxlY3QjaW50ZXJuYWxMaW5rc0Ryb3Bkb3duJykudmFsKCkgIT09ICcjJyApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnIycrc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5zYW5kYm94KS5jb250ZW50cygpLmZpbmQoJyMnK2VsZW1lbnRJRCkucGFyZW50KCkuYXR0cignaHJlZicsICQoJ3NlbGVjdCNpbnRlcm5hbExpbmtzRHJvcGRvd24nKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKCAkKCdzZWxlY3QjcGFnZUxpbmtzRHJvcGRvd24nKS52YWwoKSAhPT0gJyMnICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjJytzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnNhbmRib3gpLmNvbnRlbnRzKCkuZmluZCgnIycrZWxlbWVudElEKS5wYXJlbnQoKS5hdHRyKCdocmVmJywgJCgnc2VsZWN0I3BhZ2VMaW5rc0Ryb3Bkb3duJykudmFsKCkgKTtcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoICQoJ2lucHV0I2ludGVybmFsTGlua3NDdXN0b20nKS52YWwoKSAhPT0gJycgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyMnK3N0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuc2FuZGJveCkuY29udGVudHMoKS5maW5kKCcjJytlbGVtZW50SUQpLnBhcmVudCgpLmF0dHIoJ2hyZWYnLCAkKCdpbnB1dCNpbnRlcm5hbExpbmtzQ3VzdG9tJykudmFsKCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIEVORCBTQU5EQk9YICovXG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9kbyB3ZSBuZWVkIHRvIHVwbG9hZCBhbiBpbWFnZT9cbiAgICAgICAgICAgIGlmKCAkKCdhI2ltZ19MaW5rJykuY3NzKCdkaXNwbGF5JykgPT09ICdibG9jaycgJiYgJCgnaW5wdXQjaW1hZ2VGaWxlRmllbGQnKS52YWwoKSAhPT0gJycgKSB7XG4gICAgICAgICAgICAvL2lmKCAkKCdhI2ltZ19MaW5rJykuY3NzKCdkaXNwbGF5JykgPT09ICdibG9jaycgKSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBmb3JtID0gJCgnZm9ybSNpbWFnZVVwbG9hZEZvcm0nKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgZm9ybWRhdGEgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAod2luZG93LkZvcm1EYXRhKXtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ25hdXMnKTtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWRhdGEgPSBuZXcgRm9ybURhdGEoZm9ybVswXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBmb3JtQWN0aW9uID0gZm9ybS5hdHRyKCdhY3Rpb24nKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICB1cmwgOiBmb3JtQWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICBkYXRhIDogZm9ybWRhdGEgPyBmb3JtZGF0YSA6IGZvcm0uc2VyaWFsaXplKCksXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NEYXRhIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmKCByZXNwb25zZS5jb2RlID09PSAxICkgey8vc3VjY2Vzc1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJ2lucHV0I2ltYWdlVVJMJykudmFsKCByZXNwb25zZS5yZXNwb25zZSApO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5hdHRyKCdzcmMnLCByZXNwb25zZS5yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vcmVzZXQgdGhlIGZpbGUgdXBsb2FkXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcuaW1hZ2VGaWxlVGFiJykuZmluZCgnYS5maWxlaW5wdXQtZXhpc3RzJykuY2xpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLyogU0FOREJPWCAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCBzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnNhbmRib3ggKSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50SUQgPSAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuYXR0cignaWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJyMnK3N0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuc2FuZGJveCkuY29udGVudHMoKS5maW5kKCcjJytlbGVtZW50SUQpLmF0dHIoJ3NyYycsIHJlc3BvbnNlLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBFTkQgU0FOREJPWCAqL1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKCByZXNwb25zZS5jb2RlID09PSAwICkgey8vZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnU29tZXRoaW5nIHdlbnQgd3Jvbmc6ICcrcmVzcG9uc2UucmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9IGVsc2UgaWYoICQoJ2EjaW1nX0xpbmsnKS5jc3MoJ2Rpc3BsYXknKSA9PT0gJ2Jsb2NrJyApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vbm8gaW1hZ2UgdG8gdXBsb2FkLCBqdXN0IGEgU1JDIGNoYW5nZVxuICAgICAgICAgICAgICAgIGlmKCAkKCdpbnB1dCNpbWFnZVVSTCcpLnZhbCgpICE9PSAnJyAmJiAkKCdpbnB1dCNpbWFnZVVSTCcpLnZhbCgpICE9PSAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuYXR0cignc3JjJykgKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5hdHRyKCdzcmMnLCAkKCdpbnB1dCNpbWFnZVVSTCcpLnZhbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8qIFNBTkRCT1ggKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiggc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5zYW5kYm94ICkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudElEID0gJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmF0dHIoJ2lkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnIycrc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5zYW5kYm94KS5jb250ZW50cygpLmZpbmQoJyMnK2VsZW1lbnRJRCkuYXR0cignc3JjJywgJCgnaW5wdXQjaW1hZ2VVUkwnKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvKiBFTkQgU0FOREJPWCAqL1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL2ljb25zXG4gICAgICAgICAgICBpZiggJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmhhc0NsYXNzKCdmYScpICkge1xuXG4gICAgICAgICAgICAgICAgLy9vdXQgd2l0aCB0aGUgb2xkLCBpbiB3aXRoIHRoZSBuZXcgOilcbiAgICAgICAgICAgICAgICAvL2dldCBpY29uIGNsYXNzIG5hbWUsIHN0YXJ0aW5nIHdpdGggZmEtXG4gICAgICAgICAgICAgICAgdmFyIGdldCA9ICQuZ3JlcChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQuY2xhc3NOYW1lLnNwbGl0KFwiIFwiKSwgZnVuY3Rpb24odiwgaSl7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHYuaW5kZXhPZignZmEtJykgPT09IDA7XG5cbiAgICAgICAgICAgICAgICB9KS5qb2luKCk7XG5cbiAgICAgICAgICAgICAgICAvL2lmIHRoZSBpY29ucyBpcyBiZWluZyBjaGFuZ2VkLCBzYXZlIHRoZSBvbGQgb25lIHNvIHdlIGNhbiByZXNldCBpdCBpZiBuZWVkZWRcblxuICAgICAgICAgICAgICAgIGlmKCBnZXQgIT09ICQoJ3NlbGVjdCNpY29ucycpLnZhbCgpICkge1xuXG4gICAgICAgICAgICAgICAgICAgICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS51bmlxdWVJZCgpO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZWVkaXRvci5fb2xkSWNvblskKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuYXR0cignaWQnKV0gPSBnZXQ7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucmVtb3ZlQ2xhc3MoIGdldCApLmFkZENsYXNzKCAkKCdzZWxlY3QjaWNvbnMnKS52YWwoKSApO1xuXG5cbiAgICAgICAgICAgICAgICAvKiBTQU5EQk9YICovXG5cbiAgICAgICAgICAgICAgICBpZiggc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5zYW5kYm94ICkge1xuXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRJRCA9ICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5hdHRyKCdpZCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcjJytzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnNhbmRib3gpLmNvbnRlbnRzKCkuZmluZCgnIycrZWxlbWVudElEKS5yZW1vdmVDbGFzcyggZ2V0ICkuYWRkQ2xhc3MoICQoJ3NlbGVjdCNpY29ucycpLnZhbCgpICk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvKiBFTkQgU0FOREJPWCAqL1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vdmlkZW8gVVJMXG4gICAgICAgICAgICBpZiggJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmF0dHIoJ2RhdGEtdHlwZScpID09PSAndmlkZW8nICkge1xuXG4gICAgICAgICAgICAgICAgaWYoICQoJ2lucHV0I3lvdXR1YmVJRCcpLnZhbCgpICE9PSAnJyApIHtcblxuICAgICAgICAgICAgICAgICAgICAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucHJldigpLmF0dHIoJ3NyYycsIFwiLy93d3cueW91dHViZS5jb20vZW1iZWQvXCIrJCgnI3ZpZGVvX1RhYiBpbnB1dCN5b3V0dWJlSUQnKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoICQoJ2lucHV0I3ZpbWVvSUQnKS52YWwoKSAhPT0gJycgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLnByZXYoKS5hdHRyKCdzcmMnLCBcIi8vcGxheWVyLnZpbWVvLmNvbS92aWRlby9cIiskKCcjdmlkZW9fVGFiIGlucHV0I3ZpbWVvSUQnKS52YWwoKStcIj90aXRsZT0wJmFtcDtieWxpbmU9MCZhbXA7cG9ydHJhaXQ9MFwiKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8qIFNBTkRCT1ggKi9cblxuICAgICAgICAgICAgICAgIGlmKCBzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnNhbmRib3ggKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudElEID0gJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmF0dHIoJ2lkJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoICQoJ2lucHV0I3lvdXR1YmVJRCcpLnZhbCgpICE9PSAnJyApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnIycrc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5zYW5kYm94KS5jb250ZW50cygpLmZpbmQoJyMnK2VsZW1lbnRJRCkucHJldigpLmF0dHIoJ3NyYycsIFwiLy93d3cueW91dHViZS5jb20vZW1iZWQvXCIrJCgnI3ZpZGVvX1RhYiBpbnB1dCN5b3V0dWJlSUQnKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKCAkKCdpbnB1dCN2aW1lb0lEJykudmFsKCkgIT09ICcnICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjJytzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnNhbmRib3gpLmNvbnRlbnRzKCkuZmluZCgnIycrZWxlbWVudElEKS5wcmV2KCkuYXR0cignc3JjJywgXCIvL3BsYXllci52aW1lby5jb20vdmlkZW8vXCIrJCgnI3ZpZGVvX1RhYiBpbnB1dCN2aW1lb0lEJykudmFsKCkrXCI/dGl0bGU9MCZhbXA7YnlsaW5lPTAmYW1wO3BvcnRyYWl0PTBcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyogRU5EIFNBTkRCT1ggKi9cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkKCcjZGV0YWlsc0FwcGxpZWRNZXNzYWdlJykuZmFkZUluKDYwMCwgZnVuY3Rpb24oKXtcblxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgJCgnI2RldGFpbHNBcHBsaWVkTWVzc2FnZScpLmZhZGVPdXQoMTAwMCk7IH0sIDMwMDApO1xuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy9hZGp1c3QgZnJhbWUgaGVpZ2h0XG4gICAgICAgICAgICBzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnBhcmVudEJsb2NrLmhlaWdodEFkanVzdG1lbnQoKTtcblxuXG4gICAgICAgICAgICAvL3dlJ3ZlIGdvdCBwZW5kaW5nIGNoYW5nZXNcbiAgICAgICAgICAgIHNpdGVCdWlsZGVyLnNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBvbiBmb2N1cywgd2UnbGwgbWFrZSB0aGUgaW5wdXQgZmllbGRzIHdpZGVyXG4gICAgICAgICovXG4gICAgICAgIGFuaW1hdGVTdHlsZUlucHV0SW46IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAkKHRoaXMpLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcbiAgICAgICAgICAgICQodGhpcykuY3NzKCdyaWdodCcsICcwcHgnKTtcbiAgICAgICAgICAgICQodGhpcykuYW5pbWF0ZSh7J3dpZHRoJzogJzEwMCUnfSwgNTAwKTtcbiAgICAgICAgICAgICQodGhpcykuZm9jdXMoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdCgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBvbiBibHVyLCB3ZSdsbCByZXZlcnQgdGhlIGlucHV0IGZpZWxkcyB0byB0aGVpciBvcmlnaW5hbCBzaXplXG4gICAgICAgICovXG4gICAgICAgIGFuaW1hdGVTdHlsZUlucHV0T3V0OiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgJCh0aGlzKS5hbmltYXRlKHsnd2lkdGgnOiAnNDIlJ30sIDUwMCwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcygncmlnaHQnLCAnYXV0bycpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICB3aGVuIHRoZSBjbGlja2VkIGVsZW1lbnQgaXMgYW4gYW5jaG9yIHRhZyAob3IgaGFzIGEgcGFyZW50IGFuY2hvciB0YWcpXG4gICAgICAgICovXG4gICAgICAgIGVkaXRMaW5rOiBmdW5jdGlvbihlbCkge1xuXG4gICAgICAgICAgICAkKCdhI2xpbmtfTGluaycpLnBhcmVudCgpLnNob3coKTtcblxuICAgICAgICAgICAgdmFyIHRoZUhyZWY7XG5cbiAgICAgICAgICAgIGlmKCAkKGVsKS5wcm9wKCd0YWdOYW1lJykgPT09ICdBJyApIHtcblxuICAgICAgICAgICAgICAgIHRoZUhyZWYgPSAkKGVsKS5hdHRyKCdocmVmJyk7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiggJChlbCkucGFyZW50KCkucHJvcCgndGFnTmFtZScpID09PSAnQScgKSB7XG5cbiAgICAgICAgICAgICAgICB0aGVIcmVmID0gJChlbCkucGFyZW50KCkuYXR0cignaHJlZicpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB6SW5kZXggPSAwO1xuXG4gICAgICAgICAgICB2YXIgcGFnZUxpbmsgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy90aGUgYWN0dWFsIHNlbGVjdFxuXG4gICAgICAgICAgICAkKCdzZWxlY3QjaW50ZXJuYWxMaW5rc0Ryb3Bkb3duJykucHJvcCgnc2VsZWN0ZWRJbmRleCcsIDApO1xuXG4gICAgICAgICAgICAvL3NldCB0aGUgY29ycmVjdCBpdGVtIHRvIFwic2VsZWN0ZWRcIlxuICAgICAgICAgICAgJCgnc2VsZWN0I2ludGVybmFsTGlua3NEcm9wZG93biBvcHRpb24nKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS5hdHRyKCd2YWx1ZScpID09PSB0aGVIcmVmICkge1xuXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYXR0cignc2VsZWN0ZWQnLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICB6SW5kZXggPSAkKHRoaXMpLmluZGV4KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZUxpbmsgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICAvL3RoZSBwcmV0dHkgZHJvcGRvd25cbiAgICAgICAgICAgICQoJy5saW5rX1RhYiAuYnRuLWdyb3VwLnNlbGVjdCAuZHJvcGRvd24tbWVudSBsaScpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xuICAgICAgICAgICAgJCgnLmxpbmtfVGFiIC5idG4tZ3JvdXAuc2VsZWN0IC5kcm9wZG93bi1tZW51IGxpOmVxKCcrekluZGV4KycpJykuYWRkQ2xhc3MoJ3NlbGVjdGVkJyk7XG4gICAgICAgICAgICAkKCcubGlua19UYWIgLmJ0bi1ncm91cC5zZWxlY3Q6ZXEoMCkgLmZpbHRlci1vcHRpb24nKS50ZXh0KCAkKCdzZWxlY3QjaW50ZXJuYWxMaW5rc0Ryb3Bkb3duIG9wdGlvbjpzZWxlY3RlZCcpLnRleHQoKSApO1xuICAgICAgICAgICAgJCgnLmxpbmtfVGFiIC5idG4tZ3JvdXAuc2VsZWN0OmVxKDEpIC5maWx0ZXItb3B0aW9uJykudGV4dCggJCgnc2VsZWN0I3BhZ2VMaW5rc0Ryb3Bkb3duIG9wdGlvbjpzZWxlY3RlZCcpLnRleHQoKSApO1xuXG4gICAgICAgICAgICBpZiggcGFnZUxpbmsgPT09IHRydWUgKSB7XG5cbiAgICAgICAgICAgICAgICAkKCdpbnB1dCNpbnRlcm5hbExpbmtzQ3VzdG9tJykudmFsKCcnKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIGlmKCAkKGVsKS5wcm9wKCd0YWdOYW1lJykgPT09ICdBJyApIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiggJChlbCkuYXR0cignaHJlZicpWzBdICE9PSAnIycgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCdpbnB1dCNpbnRlcm5hbExpbmtzQ3VzdG9tJykudmFsKCAkKGVsKS5hdHRyKCdocmVmJykgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJ2lucHV0I2ludGVybmFsTGlua3NDdXN0b20nKS52YWwoICcnICk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggJChlbCkucGFyZW50KCkucHJvcCgndGFnTmFtZScpID09PSAnQScgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoICQoZWwpLnBhcmVudCgpLmF0dHIoJ2hyZWYnKVswXSAhPT0gJyMnICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnaW5wdXQjaW50ZXJuYWxMaW5rc0N1c3RvbScpLnZhbCggJChlbCkucGFyZW50KCkuYXR0cignaHJlZicpICk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCdpbnB1dCNpbnRlcm5hbExpbmtzQ3VzdG9tJykudmFsKCAnJyApO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9saXN0IGF2YWlsYWJsZSBibG9ja3Mgb24gdGhpcyBwYWdlLCByZW1vdmUgb2xkIG9uZXMgZmlyc3RcblxuICAgICAgICAgICAgJCgnc2VsZWN0I3BhZ2VMaW5rc0Ryb3Bkb3duIG9wdGlvbjpub3QoOmZpcnN0KScpLnJlbW92ZSgpO1xuICAgICAgICAgICAgJCgnI3BhZ2VMaXN0IHVsOnZpc2libGUgaWZyYW1lJykuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgaWYoICQodGhpcykuY29udGVudHMoKS5maW5kKCBiQ29uZmlnLnBhZ2VDb250YWluZXIgKyBcIiA+ICo6Zmlyc3RcIiApLmF0dHIoJ2lkJykgIT09IHVuZGVmaW5lZCApIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3T3B0aW9uO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKCAkKGVsKS5hdHRyKCdocmVmJykgPT09ICcjJyskKHRoaXMpLmNvbnRlbnRzKCkuZmluZCggYkNvbmZpZy5wYWdlQ29udGFpbmVyICsgXCIgPiAqOmZpcnN0XCIgKS5hdHRyKCdpZCcpICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdPcHRpb24gPSAnPG9wdGlvbiBzZWxlY3RlZCB2YWx1ZT0jJyskKHRoaXMpLmNvbnRlbnRzKCkuZmluZCggYkNvbmZpZy5wYWdlQ29udGFpbmVyICsgXCIgPiAqOmZpcnN0XCIgKS5hdHRyKCdpZCcpKyc+IycrJCh0aGlzKS5jb250ZW50cygpLmZpbmQoIGJDb25maWcucGFnZUNvbnRhaW5lciArIFwiID4gKjpmaXJzdFwiICkuYXR0cignaWQnKSsnPC9vcHRpb24+JztcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdPcHRpb24gPSAnPG9wdGlvbiB2YWx1ZT0jJyskKHRoaXMpLmNvbnRlbnRzKCkuZmluZCggYkNvbmZpZy5wYWdlQ29udGFpbmVyICsgXCIgPiAqOmZpcnN0XCIgKS5hdHRyKCdpZCcpKyc+IycrJCh0aGlzKS5jb250ZW50cygpLmZpbmQoIGJDb25maWcucGFnZUNvbnRhaW5lciArIFwiID4gKjpmaXJzdFwiICkuYXR0cignaWQnKSsnPC9vcHRpb24+JztcblxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgJCgnc2VsZWN0I3BhZ2VMaW5rc0Ryb3Bkb3duJykuYXBwZW5kKCBuZXdPcHRpb24gKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vaWYgdGhlcmUgYXJlbid0IGFueSBibG9ja3MgdG8gbGlzdCwgaGlkZSB0aGUgZHJvcGRvd25cblxuICAgICAgICAgICAgaWYoICQoJ3NlbGVjdCNwYWdlTGlua3NEcm9wZG93biBvcHRpb24nKS5zaXplKCkgPT09IDEgKSB7XG5cbiAgICAgICAgICAgICAgICAkKCdzZWxlY3QjcGFnZUxpbmtzRHJvcGRvd24nKS5uZXh0KCkuaGlkZSgpO1xuICAgICAgICAgICAgICAgICQoJ3NlbGVjdCNwYWdlTGlua3NEcm9wZG93bicpLm5leHQoKS5uZXh0KCkuaGlkZSgpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgJCgnc2VsZWN0I3BhZ2VMaW5rc0Ryb3Bkb3duJykubmV4dCgpLnNob3coKTtcbiAgICAgICAgICAgICAgICAkKCdzZWxlY3QjcGFnZUxpbmtzRHJvcGRvd24nKS5uZXh0KCkubmV4dCgpLnNob3coKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgd2hlbiB0aGUgY2xpY2tlZCBlbGVtZW50IGlzIGFuIGltYWdlXG4gICAgICAgICovXG4gICAgICAgIGVkaXRJbWFnZTogZnVuY3Rpb24oZWwpIHtcblxuICAgICAgICAgICAgJCgnYSNpbWdfTGluaycpLnBhcmVudCgpLnNob3coKTtcblxuICAgICAgICAgICAgLy9zZXQgdGhlIGN1cnJlbnQgU1JDXG4gICAgICAgICAgICAkKCcuaW1hZ2VGaWxlVGFiJykuZmluZCgnaW5wdXQjaW1hZ2VVUkwnKS52YWwoICQoZWwpLmF0dHIoJ3NyYycpICk7XG5cbiAgICAgICAgICAgIC8vcmVzZXQgdGhlIGZpbGUgdXBsb2FkXG4gICAgICAgICAgICAkKCcuaW1hZ2VGaWxlVGFiJykuZmluZCgnYS5maWxlaW5wdXQtZXhpc3RzJykuY2xpY2soKTtcblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIHdoZW4gdGhlIGNsaWNrZWQgZWxlbWVudCBpcyBhIHZpZGVvIGVsZW1lbnRcbiAgICAgICAgKi9cbiAgICAgICAgZWRpdFZpZGVvOiBmdW5jdGlvbihlbCkge1xuXG4gICAgICAgICAgICB2YXIgbWF0Y2hSZXN1bHRzO1xuXG4gICAgICAgICAgICAkKCdhI3ZpZGVvX0xpbmsnKS5wYXJlbnQoKS5zaG93KCk7XG4gICAgICAgICAgICAkKCdhI3ZpZGVvX0xpbmsnKS5jbGljaygpO1xuXG4gICAgICAgICAgICAvL2luamVjdCBjdXJyZW50IHZpZGVvIElELGNoZWNrIGlmIHdlJ3JlIGRlYWxpbmcgd2l0aCBZb3V0dWJlIG9yIFZpbWVvXG5cbiAgICAgICAgICAgIGlmKCAkKGVsKS5wcmV2KCkuYXR0cignc3JjJykuaW5kZXhPZihcInZpbWVvLmNvbVwiKSA+IC0xICkgey8vdmltZW9cblxuICAgICAgICAgICAgICAgIG1hdGNoUmVzdWx0cyA9ICQoZWwpLnByZXYoKS5hdHRyKCdzcmMnKS5tYXRjaCgvcGxheWVyXFwudmltZW9cXC5jb21cXC92aWRlb1xcLyhbMC05XSopLyk7XG5cbiAgICAgICAgICAgICAgICAkKCcjdmlkZW9fVGFiIGlucHV0I3ZpbWVvSUQnKS52YWwoIG1hdGNoUmVzdWx0c1ttYXRjaFJlc3VsdHMubGVuZ3RoLTFdICk7XG4gICAgICAgICAgICAgICAgJCgnI3ZpZGVvX1RhYiBpbnB1dCN5b3V0dWJlSUQnKS52YWwoJycpO1xuXG4gICAgICAgICAgICB9IGVsc2Ugey8veW91dHViZVxuXG4gICAgICAgICAgICAgICAgLy90ZW1wID0gJChlbCkucHJldigpLmF0dHIoJ3NyYycpLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgdmFyIHJlZ0V4cCA9IC8uKig/OnlvdXR1LmJlXFwvfHZcXC98dVxcL1xcd1xcL3xlbWJlZFxcL3x3YXRjaFxcP3Y9KShbXiNcXCZcXD9dKikuKi87XG4gICAgICAgICAgICAgICAgbWF0Y2hSZXN1bHRzID0gJChlbCkucHJldigpLmF0dHIoJ3NyYycpLm1hdGNoKHJlZ0V4cCk7XG5cbiAgICAgICAgICAgICAgICAkKCcjdmlkZW9fVGFiIGlucHV0I3lvdXR1YmVJRCcpLnZhbCggbWF0Y2hSZXN1bHRzWzFdICk7XG4gICAgICAgICAgICAgICAgJCgnI3ZpZGVvX1RhYiBpbnB1dCN2aW1lb0lEJykudmFsKCcnKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgd2hlbiB0aGUgY2xpY2tlZCBlbGVtZW50IGlzIGFuIGZhIGljb25cbiAgICAgICAgKi9cbiAgICAgICAgZWRpdEljb246IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAkKCdhI2ljb25fTGluaycpLnBhcmVudCgpLnNob3coKTtcblxuICAgICAgICAgICAgLy9nZXQgaWNvbiBjbGFzcyBuYW1lLCBzdGFydGluZyB3aXRoIGZhLVxuICAgICAgICAgICAgdmFyIGdldCA9ICQuZ3JlcCh0aGlzLmFjdGl2ZUVsZW1lbnQuZWxlbWVudC5jbGFzc05hbWUuc3BsaXQoXCIgXCIpLCBmdW5jdGlvbih2LCBpKXtcblxuICAgICAgICAgICAgICAgIHJldHVybiB2LmluZGV4T2YoJ2ZhLScpID09PSAwO1xuXG4gICAgICAgICAgICB9KS5qb2luKCk7XG5cbiAgICAgICAgICAgICQoJ3NlbGVjdCNpY29ucyBvcHRpb24nKS5lYWNoKGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICBpZiggJCh0aGlzKS52YWwoKSA9PT0gZ2V0ICkge1xuXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYXR0cignc2VsZWN0ZWQnLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICAkKCcjaWNvbnMnKS50cmlnZ2VyKCdjaG9zZW46dXBkYXRlZCcpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGRlbGV0ZSBzZWxlY3RlZCBlbGVtZW50XG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZUVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgdG9EZWw7XG5cbiAgICAgICAgICAgIC8vZGV0ZXJtaW5lIHdoYXQgdG8gZGVsZXRlXG4gICAgICAgICAgICBpZiggJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLnByb3AoJ3RhZ05hbWUnKSA9PT0gJ0EnICkgey8vYW5jb3JcblxuICAgICAgICAgICAgICAgIGlmKCAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucGFyZW50KCkucHJvcCgndGFnTmFtZScpID09PSdMSScgKSB7Ly9jbG9uZSB0aGUgTElcblxuICAgICAgICAgICAgICAgICAgICB0b0RlbCA9ICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5wYXJlbnQoKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdG9EZWwgPSAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiggJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLnByb3AoJ3RhZ05hbWUnKSA9PT0gJ0lNRycgKSB7Ly9pbWFnZVxuXG4gICAgICAgICAgICAgICAgaWYoICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5wYXJlbnQoKS5wcm9wKCd0YWdOYW1lJykgPT09ICdBJyApIHsvL2Nsb25lIHRoZSBBXG5cbiAgICAgICAgICAgICAgICAgICAgdG9EZWwgPSAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucGFyZW50KCk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIHRvRGVsID0gJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Ugey8vZXZlcnl0aGluZyBlbHNlXG5cbiAgICAgICAgICAgICAgICB0b0RlbCA9ICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KTtcblxuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIHRvRGVsLmZhZGVPdXQoNTAwLCBmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbUVsID0gJCh0aGlzKS5jbG9zZXN0KCdib2R5JykuZmluZCgnKjpmaXJzdCcpO1xuXG4gICAgICAgICAgICAgICAgdG9EZWwucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgICAgICAvKiBTQU5EQk9YICovXG5cbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudElEID0gJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmF0dHIoJ2lkJyk7XG5cbiAgICAgICAgICAgICAgICAkKCcjJytzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnNhbmRib3gpLmNvbnRlbnRzKCkuZmluZCgnIycrZWxlbWVudElEKS5yZW1vdmUoKTtcblxuICAgICAgICAgICAgICAgIC8qIEVORCBTQU5EQk9YICovXG5cbiAgICAgICAgICAgICAgICBzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnBhcmVudEJsb2NrLmhlaWdodEFkanVzdG1lbnQoKTtcblxuICAgICAgICAgICAgICAgIC8vd2UndmUgZ290IHBlbmRpbmcgY2hhbmdlc1xuICAgICAgICAgICAgICAgIHNpdGVCdWlsZGVyLnNpdGUuc2V0UGVuZGluZ0NoYW5nZXModHJ1ZSk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkKCcjZGVsZXRlRWxlbWVudCcpLm1vZGFsKCdoaWRlJyk7XG5cbiAgICAgICAgICAgIHN0eWxlZWRpdG9yLmNsb3NlU3R5bGVFZGl0b3IoKTtcblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIGNsb25lcyB0aGUgc2VsZWN0ZWQgZWxlbWVudFxuICAgICAgICAqL1xuICAgICAgICBjbG9uZUVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgdGhlQ2xvbmUsIHRoZUNsb25lMiwgdGhlT25lLCBjbG9uZWQsIGNsb25lUGFyZW50LCBlbGVtZW50SUQ7XG5cbiAgICAgICAgICAgIGlmKCAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucGFyZW50KCkuaGFzQ2xhc3MoJ3Byb3BDbG9uZScpICkgey8vY2xvbmUgdGhlIHBhcmVudCBlbGVtZW50XG5cbiAgICAgICAgICAgICAgICB0aGVDbG9uZSA9ICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5wYXJlbnQoKS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIHRoZUNsb25lLmZpbmQoICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5wcm9wKCd0YWdOYW1lJykgKS5hdHRyKCdzdHlsZScsICcnKTtcblxuICAgICAgICAgICAgICAgIHRoZUNsb25lMiA9ICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5wYXJlbnQoKS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIHRoZUNsb25lMi5maW5kKCAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucHJvcCgndGFnTmFtZScpICkuYXR0cignc3R5bGUnLCAnJyk7XG5cbiAgICAgICAgICAgICAgICB0aGVPbmUgPSB0aGVDbG9uZS5maW5kKCAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucHJvcCgndGFnTmFtZScpICk7XG4gICAgICAgICAgICAgICAgY2xvbmVkID0gJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLnBhcmVudCgpO1xuXG4gICAgICAgICAgICAgICAgY2xvbmVQYXJlbnQgPSAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkucGFyZW50KCkucGFyZW50KCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7Ly9jbG9uZSB0aGUgZWxlbWVudCBpdHNlbGZcblxuICAgICAgICAgICAgICAgIHRoZUNsb25lID0gJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgICB0aGVDbG9uZS5hdHRyKCdzdHlsZScsICcnKTtcblxuICAgICAgICAgICAgICAgIC8qaWYoIHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuc2FuZGJveCApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhlQ2xvbmUuYXR0cignaWQnLCAnJykudW5pcXVlSWQoKTtcbiAgICAgICAgICAgICAgICB9Ki9cblxuICAgICAgICAgICAgICAgIHRoZUNsb25lMiA9ICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5jbG9uZSgpO1xuICAgICAgICAgICAgICAgIHRoZUNsb25lMi5hdHRyKCdzdHlsZScsICcnKTtcblxuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgaWYoIHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuc2FuZGJveCApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhlQ2xvbmUyLmF0dHIoJ2lkJywgdGhlQ2xvbmUuYXR0cignaWQnKSk7XG4gICAgICAgICAgICAgICAgfSovXG5cbiAgICAgICAgICAgICAgICB0aGVPbmUgPSB0aGVDbG9uZTtcbiAgICAgICAgICAgICAgICBjbG9uZWQgPSAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICBjbG9uZVBhcmVudCA9ICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5wYXJlbnQoKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjbG9uZWQuYWZ0ZXIoIHRoZUNsb25lICk7XG5cbiAgICAgICAgICAgIC8qIFNBTkRCT1ggKi9cblxuICAgICAgICAgICAgaWYoIHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuc2FuZGJveCApIHtcblxuICAgICAgICAgICAgICAgIGVsZW1lbnRJRCA9ICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5hdHRyKCdpZCcpO1xuICAgICAgICAgICAgICAgICQoJyMnK3N0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuc2FuZGJveCkuY29udGVudHMoKS5maW5kKCcjJytlbGVtZW50SUQpLmFmdGVyKCB0aGVDbG9uZTIgKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBFTkQgU0FOREJPWCAqL1xuXG4gICAgICAgICAgICAvL21ha2Ugc3VyZSB0aGUgbmV3IGVsZW1lbnQgZ2V0cyB0aGUgcHJvcGVyIGV2ZW50cyBzZXQgb24gaXRcbiAgICAgICAgICAgIHZhciBuZXdFbGVtZW50ID0gbmV3IGNhbnZhc0VsZW1lbnQodGhlT25lLmdldCgwKSk7XG4gICAgICAgICAgICBuZXdFbGVtZW50LmFjdGl2YXRlKCk7XG5cbiAgICAgICAgICAgIC8vcG9zc2libGUgaGVpZ2h0IGFkanVzdG1lbnRzXG4gICAgICAgICAgICBzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnBhcmVudEJsb2NrLmhlaWdodEFkanVzdG1lbnQoKTtcblxuICAgICAgICAgICAgLy93ZSd2ZSBnb3QgcGVuZGluZyBjaGFuZ2VzXG4gICAgICAgICAgICBzaXRlQnVpbGRlci5zaXRlLnNldFBlbmRpbmdDaGFuZ2VzKHRydWUpO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKlxuICAgICAgICAgICAgcmVzZXRzIHRoZSBhY3RpdmUgZWxlbWVudFxuICAgICAgICAqL1xuICAgICAgICByZXNldEVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBpZiggJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmNsb3Nlc3QoJ2JvZHknKS53aWR0aCgpICE9PSAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkud2lkdGgoKSApIHtcblxuICAgICAgICAgICAgICAgICQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5hdHRyKCdzdHlsZScsICcnKS5jc3MoeydvdXRsaW5lJzogJzNweCBkYXNoZWQgcmVkJywgJ2N1cnNvcic6ICdwb2ludGVyJ30pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmF0dHIoJ3N0eWxlJywgJycpLmNzcyh7J291dGxpbmUnOiAnM3B4IGRhc2hlZCByZWQnLCAnb3V0bGluZS1vZmZzZXQnOictM3B4JywgJ2N1cnNvcic6ICdwb2ludGVyJ30pO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qIFNBTkRCT1ggKi9cblxuICAgICAgICAgICAgaWYoIHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuc2FuZGJveCApIHtcblxuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50SUQgPSAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuYXR0cignaWQnKTtcbiAgICAgICAgICAgICAgICAkKCcjJytzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnNhbmRib3gpLmNvbnRlbnRzKCkuZmluZCgnIycrZWxlbWVudElEKS5hdHRyKCdzdHlsZScsICcnKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBFTkQgU0FOREJPWCAqL1xuXG4gICAgICAgICAgICAkKCcjc3R5bGVFZGl0b3IgZm9ybSNzdHlsaW5nRm9ybScpLmhlaWdodCggJCgnI3N0eWxlRWRpdG9yIGZvcm0jc3R5bGluZ0Zvcm0nKS5oZWlnaHQoKStcInB4XCIgKTtcblxuICAgICAgICAgICAgJCgnI3N0eWxlRWRpdG9yIGZvcm0jc3R5bGluZ0Zvcm0gLmZvcm0tZ3JvdXA6bm90KCNzdHlsZUVsVGVtcGxhdGUpJykuZmFkZU91dCg1MDAsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICAvL3Jlc2V0IGljb25cblxuICAgICAgICAgICAgaWYoIHN0eWxlZWRpdG9yLl9vbGRJY29uWyQoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50KS5hdHRyKCdpZCcpXSAhPT0gbnVsbCApIHtcblxuICAgICAgICAgICAgICAgIHZhciBnZXQgPSAkLmdyZXAoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudC5lbGVtZW50LmNsYXNzTmFtZS5zcGxpdChcIiBcIiksIGZ1bmN0aW9uKHYsIGkpe1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2LmluZGV4T2YoJ2ZhLScpID09PSAwO1xuXG4gICAgICAgICAgICAgICAgfSkuam9pbigpO1xuXG4gICAgICAgICAgICAgICAgJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLnJlbW92ZUNsYXNzKCBnZXQgKS5hZGRDbGFzcyggc3R5bGVlZGl0b3IuX29sZEljb25bJChzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmVsZW1lbnQpLmF0dHIoJ2lkJyldICk7XG5cbiAgICAgICAgICAgICAgICAkKCdzZWxlY3QjaWNvbnMgb3B0aW9uJykuZWFjaChmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKCAkKHRoaXMpLnZhbCgpID09PSBzdHlsZWVkaXRvci5fb2xkSWNvblskKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuYXR0cignaWQnKV0gKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuYXR0cignc2VsZWN0ZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyNpY29ucycpLnRyaWdnZXIoJ2Nob3Nlbjp1cGRhdGVkJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24oKXtzdHlsZWVkaXRvci5idWlsZGVTdHlsZUVsZW1lbnRzKCAkKHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQuZWxlbWVudCkuYXR0cignZGF0YS1zZWxlY3RvcicpICk7fSwgNTUwKTtcblxuICAgICAgICAgICAgc2l0ZUJ1aWxkZXIuc2l0ZS5zZXRQZW5kaW5nQ2hhbmdlcyh0cnVlKTtcblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgcmVzZXRTZWxlY3RMaW5rc1BhZ2VzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgJCgnI2ludGVybmFsTGlua3NEcm9wZG93bicpLnNlbGVjdDIoJ3ZhbCcsICcjJyk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICByZXNldFNlbGVjdExpbmtzSW50ZXJuYWw6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAkKCcjcGFnZUxpbmtzRHJvcGRvd24nKS5zZWxlY3QyKCd2YWwnLCAnIycpO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzZXRTZWxlY3RBbGxMaW5rczogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICQoJyNpbnRlcm5hbExpbmtzRHJvcGRvd24nKS5zZWxlY3QyKCd2YWwnLCAnIycpO1xuICAgICAgICAgICAgJCgnI3BhZ2VMaW5rc0Ryb3Bkb3duJykuc2VsZWN0MigndmFsJywgJyMnKTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0KCk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICAvKlxuICAgICAgICAgICAgaGlkZXMgZmlsZSB1cGxvYWQgZm9ybXNcbiAgICAgICAgKi9cbiAgICAgICAgaGlkZUZpbGVVcGxvYWRzOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgJCgnZm9ybSNpbWFnZVVwbG9hZEZvcm0nKS5oaWRlKCk7XG4gICAgICAgICAgICAkKCcjaW1hZ2VNb2RhbCAjdXBsb2FkVGFiTEknKS5oaWRlKCk7XG5cbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBjbG9zZXMgdGhlIHN0eWxlIGVkaXRvclxuICAgICAgICAqL1xuICAgICAgICBjbG9zZVN0eWxlRWRpdG9yOiBmdW5jdGlvbigpe1xuXG4gICAgICAgICAgICBpZiggT2JqZWN0LmtleXMoc3R5bGVlZGl0b3IuYWN0aXZlRWxlbWVudCkubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICAgICAgICBzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LnJlbW92ZU91dGxpbmUoKTtcbiAgICAgICAgICAgICAgICBzdHlsZWVkaXRvci5hY3RpdmVFbGVtZW50LmFjdGl2YXRlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCAkKCcjc3R5bGVFZGl0b3InKS5jc3MoJ2xlZnQnKSA9PT0gJzBweCcgKSB7XG5cbiAgICAgICAgICAgICAgICBzdHlsZWVkaXRvci50b2dnbGVTaWRlUGFuZWwoJ2Nsb3NlJyk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIHRvZ2dsZXMgdGhlIHNpZGUgcGFuZWxcbiAgICAgICAgKi9cbiAgICAgICAgdG9nZ2xlU2lkZVBhbmVsOiBmdW5jdGlvbih2YWwpIHtcblxuICAgICAgICAgICAgaWYoIHZhbCA9PT0gJ29wZW4nICYmICQoJyNzdHlsZUVkaXRvcicpLmNzcygnbGVmdCcpID09PSAnLTMwMHB4JyApIHtcbiAgICAgICAgICAgICAgICAkKCcjc3R5bGVFZGl0b3InKS5hbmltYXRlKHsnbGVmdCc6ICcwcHgnfSwgMjUwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiggdmFsID09PSAnY2xvc2UnICYmICQoJyNzdHlsZUVkaXRvcicpLmNzcygnbGVmdCcpID09PSAnMHB4JyApIHtcbiAgICAgICAgICAgICAgICAkKCcjc3R5bGVFZGl0b3InKS5hbmltYXRlKHsnbGVmdCc6ICctMzAwcHgnfSwgMjUwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LFxuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIEV2ZW50IGhhbmRsZXIgZm9yIHdoZW4gdGhpcyBtb2RlIGdldHMgZGVhY3RpdmF0ZWRcbiAgICAgICAgKi9cbiAgICAgICAgZGVBY3RpdmF0ZU1vZGU6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBpZiggT2JqZWN0LmtleXMoIHN0eWxlZWRpdG9yLmFjdGl2ZUVsZW1lbnQgKS5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgICAgIHN0eWxlZWRpdG9yLmNsb3NlU3R5bGVFZGl0b3IoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9kZWFjdGl2YXRlIGFsbCBzdHlsZSBpdGVtcyBvbiB0aGUgY2FudmFzXG4gICAgICAgICAgICBmb3IoIHZhciBpID0wOyBpIDwgc3R5bGVlZGl0b3IuYWxsU3R5bGVJdGVtc09uQ2FudmFzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgICAgIHN0eWxlZWRpdG9yLmFsbFN0eWxlSXRlbXNPbkNhbnZhc1tpXS5kZWFjdGl2YXRlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vQWRkIG92ZXJsYXkgYWdhaW5cbiAgICAgICAgICAgIC8vIGZvcih2YXIgaSA9IDE7IGkgPD0gJChcInVsI3BhZ2UxIGxpXCIpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIC8vICAgICB2YXIgaWQgPSBcIiN1aS1pZC1cIiArIGk7XG4gICAgICAgICAgICAvLyAgICAgYWxlcnQoaWQpO1xuICAgICAgICAgICAgLy8gICAgIC8vIG92ZXJsYXkgPSAkKCc8c3BhbiBjbGFzcz1cIm92ZXJsYXlcIj48c3BhbiBjbGFzcz1cImZ1aS1leWVcIj48L3NwYW4+PC9zcGFuPicpO1xuICAgICAgICAgICAgLy8gICAgIC8vICQoaWQpLmNvbnRlbnRzKCkuZmluZCgnYS5vdmVyJykuYXBwZW5kKCBvdmVybGF5ICk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIHN0eWxlZWRpdG9yLmluaXQoKTtcblxuICAgIGV4cG9ydHMuc3R5bGVlZGl0b3IgPSBzdHlsZWVkaXRvcjtcblxufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXG4vKiBnbG9iYWxzIHNpdGVVcmw6ZmFsc2UsIGJhc2VVcmw6ZmFsc2UgKi9cbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICAgICAgXG4gICAgdmFyIGFwcFVJID0ge1xuICAgICAgICBcbiAgICAgICAgZmlyc3RNZW51V2lkdGg6IDE5MCxcbiAgICAgICAgc2Vjb25kTWVudVdpZHRoOiAzMDAsXG4gICAgICAgIGxvYWRlckFuaW1hdGlvbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRlcicpLFxuICAgICAgICBzZWNvbmRNZW51VHJpZ2dlckNvbnRhaW5lcnM6ICQoJyNtZW51ICNtYWluICNlbGVtZW50Q2F0cywgI21lbnUgI21haW4gI3RlbXBsYXRlc1VsJyksXG4gICAgICAgIHNpdGVVcmw6IHNpdGVVcmwsXG4gICAgICAgIGJhc2VVcmw6IGJhc2VVcmwsXG4gICAgICAgIFxuICAgICAgICBzZXR1cDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRmFkZSB0aGUgbG9hZGVyIGFuaW1hdGlvblxuICAgICAgICAgICAgJChhcHBVSS5sb2FkZXJBbmltYXRpb24pLmZhZGVPdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkKCcjbWVudScpLmFuaW1hdGUoeydsZWZ0JzogLWFwcFVJLmZpcnN0TWVudVdpZHRofSwgMTAwMCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVGFic1xuICAgICAgICAgICAgJChcIi5uYXYtdGFicyBhXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICQodGhpcykudGFiKFwic2hvd1wiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkKFwic2VsZWN0LnNlbGVjdFwiKS5zZWxlY3QyKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQoJzpyYWRpbywgOmNoZWNrYm94JykucmFkaW9jaGVjaygpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBUb29sdGlwc1xuICAgICAgICAgICAgJChcIltkYXRhLXRvZ2dsZT10b29sdGlwXVwiKS50b29sdGlwKFwiaGlkZVwiKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVGFibGU6IFRvZ2dsZSBhbGwgY2hlY2tib3hlc1xuICAgICAgICAgICAgJCgnLnRhYmxlIC50b2dnbGUtYWxsIDpjaGVja2JveCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgIHZhciBjaCA9ICR0aGlzLnByb3AoJ2NoZWNrZWQnKTtcbiAgICAgICAgICAgICAgICAkdGhpcy5jbG9zZXN0KCcudGFibGUnKS5maW5kKCd0Ym9keSA6Y2hlY2tib3gnKS5yYWRpb2NoZWNrKCFjaCA/ICd1bmNoZWNrJyA6ICdjaGVjaycpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFkZCBzdHlsZSBjbGFzcyBuYW1lIHRvIGEgdG9vbHRpcHNcbiAgICAgICAgICAgICQoXCIudG9vbHRpcFwiKS5hZGRDbGFzcyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5wcmV2KCkuYXR0cihcImRhdGEtdG9vbHRpcC1zdHlsZVwiKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0b29sdGlwLVwiICsgJCh0aGlzKS5wcmV2KCkuYXR0cihcImRhdGEtdG9vbHRpcC1zdHlsZVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJChcIi5idG4tZ3JvdXBcIikub24oJ2NsaWNrJywgXCJhXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICQodGhpcykuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKS5lbmQoKS5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBGb2N1cyBzdGF0ZSBmb3IgYXBwZW5kL3ByZXBlbmQgaW5wdXRzXG4gICAgICAgICAgICAkKCcuaW5wdXQtZ3JvdXAnKS5vbignZm9jdXMnLCAnLmZvcm0tY29udHJvbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNsb3Nlc3QoJy5pbnB1dC1ncm91cCwgLmZvcm0tZ3JvdXAnKS5hZGRDbGFzcygnZm9jdXMnKTtcbiAgICAgICAgICAgIH0pLm9uKCdibHVyJywgJy5mb3JtLWNvbnRyb2wnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jbG9zZXN0KCcuaW5wdXQtZ3JvdXAsIC5mb3JtLWdyb3VwJykucmVtb3ZlQ2xhc3MoJ2ZvY3VzJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gVGFibGU6IFRvZ2dsZSBhbGwgY2hlY2tib3hlc1xuICAgICAgICAgICAgJCgnLnRhYmxlIC50b2dnbGUtYWxsJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoID0gJCh0aGlzKS5maW5kKCc6Y2hlY2tib3gnKS5wcm9wKCdjaGVja2VkJyk7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jbG9zZXN0KCcudGFibGUnKS5maW5kKCd0Ym9keSA6Y2hlY2tib3gnKS5jaGVja2JveCghY2ggPyAnY2hlY2snIDogJ3VuY2hlY2snKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBUYWJsZTogQWRkIGNsYXNzIHJvdyBzZWxlY3RlZFxuICAgICAgICAgICAgJCgnLnRhYmxlIHRib2R5IDpjaGVja2JveCcpLm9uKCdjaGVjayB1bmNoZWNrIHRvZ2dsZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKVxuICAgICAgICAgICAgICAgICwgY2hlY2sgPSAkdGhpcy5wcm9wKCdjaGVja2VkJylcbiAgICAgICAgICAgICAgICAsIHRvZ2dsZSA9IGUudHlwZSA9PT0gJ3RvZ2dsZSdcbiAgICAgICAgICAgICAgICAsIGNoZWNrYm94ZXMgPSAkKCcudGFibGUgdGJvZHkgOmNoZWNrYm94JylcbiAgICAgICAgICAgICAgICAsIGNoZWNrQWxsID0gY2hlY2tib3hlcy5sZW5ndGggPT09IGNoZWNrYm94ZXMuZmlsdGVyKCc6Y2hlY2tlZCcpLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgICR0aGlzLmNsb3Nlc3QoJ3RyJylbY2hlY2sgPyAnYWRkQ2xhc3MnIDogJ3JlbW92ZUNsYXNzJ10oJ3NlbGVjdGVkLXJvdycpO1xuICAgICAgICAgICAgICAgIGlmICh0b2dnbGUpICR0aGlzLmNsb3Nlc3QoJy50YWJsZScpLmZpbmQoJy50b2dnbGUtYWxsIDpjaGVja2JveCcpLmNoZWNrYm94KGNoZWNrQWxsID8gJ2NoZWNrJyA6ICd1bmNoZWNrJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gU3dpdGNoXG4gICAgICAgICAgICAkKFwiW2RhdGEtdG9nZ2xlPSdzd2l0Y2gnXVwiKS53cmFwKCc8ZGl2IGNsYXNzPVwic3dpdGNoXCIgLz4nKS5wYXJlbnQoKS5ib290c3RyYXBTd2l0Y2goKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgYXBwVUkuc2Vjb25kTWVudVRyaWdnZXJDb250YWluZXJzLm9uKCdjbGljaycsICdhOm5vdCguYnRuKScsIGFwcFVJLnNlY29uZE1lbnVBbmltYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBzZWNvbmRNZW51QW5pbWF0aW9uOiBmdW5jdGlvbigpe1xuICAgICAgICBcbiAgICAgICAgICAgICQoJyNtZW51ICNtYWluIGEnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdhY3RpdmUnKTtcblx0XG4gICAgICAgICAgICAvL3Nob3cgb25seSB0aGUgcmlnaHQgZWxlbWVudHNcbiAgICAgICAgICAgICQoJyNtZW51ICNzZWNvbmQgdWwgbGknKS5oaWRlKCk7XG4gICAgICAgICAgICAkKCcjbWVudSAjc2Vjb25kIHVsIGxpLicrJCh0aGlzKS5hdHRyKCdpZCcpKS5zaG93KCk7XG5cbiAgICAgICAgICAgIGlmKCAkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdhbGwnICkge1xuICAgICAgICAgICAgICAgICQoJyNtZW51ICNzZWNvbmQgdWwjZWxlbWVudHMgbGknKS5zaG93KCk7XHRcdFxuICAgICAgICAgICAgfVxuXHRcbiAgICAgICAgICAgICQoJy5tZW51IC5zZWNvbmQnKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKS5zdG9wKCkuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgd2lkdGg6IGFwcFVJLnNlY29uZE1lbnVXaWR0aFxuICAgICAgICAgICAgfSwgNTAwKTtcdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH07XG4gICAgXG4gICAgLy9pbml0aWF0ZSB0aGUgVUlcbiAgICBhcHBVSS5zZXR1cCgpO1xuXG5cbiAgICAvLyoqKiogRVhQT1JUU1xuICAgIG1vZHVsZS5leHBvcnRzLmFwcFVJID0gYXBwVUk7XG4gICAgXG59KCkpOyIsIihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuICAgIFxuICAgIGV4cG9ydHMuZ2V0UmFuZG9tQXJiaXRyYXJ5ID0gZnVuY3Rpb24obWluLCBtYXgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluKTtcbiAgICB9O1xuICAgIFxufSgpKTsiLCIvKiFcbiAqIHB1Ymxpc2hlci5qcyAtIChjKSBSeWFuIEZsb3JlbmNlIDIwMTFcbiAqIGdpdGh1Yi5jb20vcnBmbG9yZW5jZS9wdWJsaXNoZXIuanNcbiAqIE1JVCBMaWNlbnNlXG4qL1xuXG4vLyBVTUQgQm9pbGVycGxhdGUgXFxvLyAmJiBEOlxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTsgLy8gbm9kZVxuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmYWN0b3J5KTsgLy8gYW1kXG4gIH0gZWxzZSB7XG4gICAgLy8gd2luZG93IHdpdGggbm9Db25mbGljdFxuICAgIHZhciBfcHVibGlzaGVyID0gcm9vdC5wdWJsaXNoZXI7XG4gICAgdmFyIHB1Ymxpc2hlciA9IHJvb3QucHVibGlzaGVyID0gZmFjdG9yeSgpO1xuICAgIHJvb3QucHVibGlzaGVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByb290LnB1Ymxpc2hlciA9IF9wdWJsaXNoZXI7XG4gICAgICByZXR1cm4gcHVibGlzaGVyO1xuICAgIH1cbiAgfVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIHB1Ymxpc2hlciA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgdG9waWNzID0ge307XG4gICAgb2JqID0gb2JqIHx8IHt9O1xuXG4gICAgb2JqLnB1Ymxpc2ggPSBmdW5jdGlvbiAodG9waWMvKiwgbWVzc2FnZXMuLi4qLykge1xuICAgICAgaWYgKCF0b3BpY3NbdG9waWNdKSByZXR1cm4gb2JqO1xuICAgICAgdmFyIG1lc3NhZ2VzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0b3BpY3NbdG9waWNdLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0b3BpY3NbdG9waWNdW2ldLmhhbmRsZXIuYXBwbHkodG9waWNzW3RvcGljXVtpXS5jb250ZXh0LCBtZXNzYWdlcyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH07XG5cbiAgICBvYmouc3Vic2NyaWJlID0gZnVuY3Rpb24gKHRvcGljT3JTdWJzY3JpYmVyLCBoYW5kbGVyT3JUb3BpY3MpIHtcbiAgICAgIHZhciBmaXJzdFR5cGUgPSB0eXBlb2YgdG9waWNPclN1YnNjcmliZXI7XG5cbiAgICAgIGlmIChmaXJzdFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBzdWJzY3JpYmUuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZpcnN0VHlwZSA9PT0gJ29iamVjdCcgJiYgIWhhbmRsZXJPclRvcGljcykge1xuICAgICAgICByZXR1cm4gc3Vic2NyaWJlTXVsdGlwbGUuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyT3JUb3BpY3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBoaXRjaC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaGl0Y2hNdWx0aXBsZS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBzdWJzY3JpYmUgKHRvcGljLCBoYW5kbGVyLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmVmZXJlbmNlID0geyBoYW5kbGVyOiBoYW5kbGVyLCBjb250ZXh0OiBjb250ZXh0IHx8IG9iaiB9O1xuICAgICAgdG9waWMgPSB0b3BpY3NbdG9waWNdIHx8ICh0b3BpY3NbdG9waWNdID0gW10pO1xuICAgICAgdG9waWMucHVzaChyZWZlcmVuY2UpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXR0YWNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdG9waWMucHVzaChyZWZlcmVuY2UpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICBkZXRhY2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBlcmFzZSh0b3BpYywgcmVmZXJlbmNlKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc3Vic2NyaWJlTXVsdGlwbGUgKHBhaXJzKSB7XG4gICAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IHt9O1xuICAgICAgZm9yICh2YXIgdG9waWMgaW4gcGFpcnMpIHtcbiAgICAgICAgaWYgKCFwYWlycy5oYXNPd25Qcm9wZXJ0eSh0b3BpYykpIGNvbnRpbnVlO1xuICAgICAgICBzdWJzY3JpcHRpb25zW3RvcGljXSA9IHN1YnNjcmliZSh0b3BpYywgcGFpcnNbdG9waWNdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdWJzY3JpcHRpb25zO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBoaXRjaCAoc3Vic2NyaWJlciwgdG9waWMpIHtcbiAgICAgIHJldHVybiBzdWJzY3JpYmUodG9waWMsIHN1YnNjcmliZXJbdG9waWNdLCBzdWJzY3JpYmVyKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gaGl0Y2hNdWx0aXBsZSAoc3Vic2NyaWJlciwgdG9waWNzKSB7XG4gICAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0b3BpY3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaCggaGl0Y2goc3Vic2NyaWJlciwgdG9waWNzW2ldKSApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbnM7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGVyYXNlIChhcnIsIHZpY3RpbSkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcnIubGVuZ3RoOyBpIDwgbDsgaSsrKXtcbiAgICAgICAgaWYgKGFycltpXSA9PT0gdmljdGltKSBhcnIuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gcHVibGlzaGVyIGlzIGEgcHVibGlzaGVyLCBzbyBtZXRhIC4uLlxuICByZXR1cm4gcHVibGlzaGVyKHB1Ymxpc2hlcik7XG59KSk7XG4iXX0=
