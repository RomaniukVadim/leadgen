"use strict";

var $portfolio_filter, $grid_selectors, $blog, $port_filter;
var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};


/*==============================================================
 owl slider
 ==============================================================*/
$(document).ready(function () {

    var isMobile = false;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        isMobile = true;
    }

    $('.owl-slider-full').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        items: 3,
        paginationSpeed: 400,
        autoPlay: 5000,
        singleItem: true,
        navigationText: ['<i class="fa fa-long-arrow-left"></i>', '<i class="fa fa-long-arrow-right"></i>']
    });

    $('.owl-slider-style2').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        items: 2,
        itemsDesktop: [1200, 2],
        itemsTablet: [800, 2],
        itemsMobile: [700, 1],
        paginationSpeed: 400,
         navigationText: ['<i class="fa fa-long-arrow-left"></i>', '<i class="fa fa-long-arrow-right"></i>']
    });

    $('.owl-slider-style3').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        items: 3,
        itemsDesktop: [1200, 4],
        itemsTablet: [800, 2],
        itemsMobile: [700, 1],
        paginationSpeed: 400,
        navigationText: ['<i class="fa fa-long-arrow-left"></i>', '<i class="fa fa-long-arrow-right"></i>']
    });

    $('.owl-slider-style4').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        items: 4,
        itemsDesktop: [1200, 4],
        itemsTablet: [991, 3],
        itemsMobile: [767, 1],
        paginationSpeed: 400,
        navigationText: ['<i class="fa fa-long-arrow-left"></i>', '<i class="fa fa-long-arrow-right"></i>']
    });

    $('.testimonial-style3').owlCarousel({
        navigation: false,
        items: 3,
        itemsDesktop: [1200, 3],
        itemsTablet: [800, 2],
        itemsMobile: [700, 1]
    });

    $('.gallery-style4').owlCarousel({
        navigation: false,
        items: 4,
        itemsDesktop: [1200, 4],
        itemsTablet: [991, 3],
        itemsMobile: [767, 1]
    });

    $('.owl-slider-auto').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        items: 3,
        autoPlay: 5000,
        paginationSpeed: 400,
        singleItem: true,
        navigationText: ['<i class="fa fa-long-arrow-left"></i>', '<i class="fa fa-long-arrow-right"></i>']
    });


    $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
        disableOn: 700,
        type: 'iframe',
        mainClass: 'mfp-fade',
        removalDelay: 160,
        preloader: false,
        fixedContentPos: false
    });

    ////set equalize height
    $('.equalize').equalize();
    //fit videos
    $(".fit-videos").fitVids();

    /* ===================================
     counter number reset while scrolling
     ====================================== */

    $('.timer').appear();
    $(document.body).on('appear', '.timer', function (e) {
        // this code is executed for each appeared element
        if (!$(this).hasClass('appear')) {
            animatecounters();
            $(this).addClass('appear');
        }
    });

    /* ===================================
     masonry
     ====================================== */

    $blog = $('.masonry-items');
    $blog.imagesLoaded(function () {
        $blog.isotope({
            itemSelector: 'li',
            layoutMode: 'masonry'
        });
    });

    /*==============================================================*/
    //Lightbox gallery - START CODE
    /*==============================================================*/
    
     $('.lightbox-gallery').magnificPopup({
        delegate: 'a',
        type: 'image',
        closeOnContentClick: true,
        closeBtnInside: false,
        midClick: true,
        tLoading: 'Loading image #%curr%...',
        mainClass: 'mfp-fade',
        gallery: {
            enabled: true,
            navigateByImgClick: true,
            preload: [0, 1] // Will preload 0 - before current, and 1 after the current image
        },
        image: {
            tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
            titleSrc: function (item) {
                return item.el.attr('title');
            }
        },
        callbacks: {
                open: function () {
                    $.magnificPopup.instance.close = function() {
                        if (!isMobile){
                            $.magnificPopup.proto.close.call(this);
                        } else {
                            $(document).on('click', 'button.mfp-close', function (event) {
                                $.magnificPopup.proto.close.call(this);
                            });
                        }
                    }
                }
            }
    });

    /*===========================================================
     Contact Form 
     ============================================================ */
    $('.tz_submit').on('click', function (event) {
        event.preventDefault();
        var name_attr = [];
        var values = [];
        var tz_process = "";
        if($(this).closest("section").attr('id') !== undefined)
        {
            var section_id = $(this).closest("section").attr('id');
        }else{
            var section_id = $(this).closest("footer").attr('id');
        }
        var submit_loader = '<div class="loading text-deep-green display-inline-block margin-five no-margin-tb no-margin-right" id="loading">Loading...</div>';
        $('#' + section_id).find('form').find('button').after(submit_loader);
        $('#' + section_id).find('form input, form select,form textarea').each(
                function (index) {
                    
                    if ($(this).is('[data-email="required"]')) {
                        var required_val = $(this).val();
                        if (required_val != '') {
                            name_attr.push($(this).attr('name'));
                            values.push($(this).val());
                            tz_process = true;
                        } else {
                            $('#loading').remove();
                            $(this).addClass('tz_input_error');
                            tz_process = false;
                        }
                    }

                    if (!$(this).is('[data-email="required"]')) {
                        name_attr.push($(this).attr('name'));
                        values.push($(this).val());
                    }

                });
        
        var captcha_length = $('.g-recaptcha').length;
        if (captcha_length >= 1) {
            var response = grecaptcha.getResponse();
            //recaptcha failed validation
            if (response.length == 0) {
                $('#loading').remove();
                $('#google-recaptcha-error').remove();
                $('#' + section_id).find('.g-recaptcha').after('<span class="google-recaptcha-error" id="google-recaptcha-error">Invalid recaptcha</span>');
                tz_process = false;
            } else {
                $('#google-recaptcha-error').remove();
                $('#recaptcha-error').hide();
                tz_process = true;
            }
        }
        if (tz_process) 
        {
            localStorage.setItem('tz_section',section_id);
            $.post("tz_mail/contact.php", {
                data: { input_name: name_attr,values: values,section_id:section_id},
                type: "POST",
            }, function (data) {
                $('#loading').remove();
                var tz_form_output = '';
                if(data) 
                {
                    if(data.type == "tz_message") 
                    {
                       $('#error').remove(); 
                       $('#success').remove();
                       $('#google-recaptcha-error').remove(); 
                       var tz_form_output = '<div id="success" class="no-margin-lr alt-font">'+data.text+'</div>';
                    }else if (data.type == "tz_error") {
                        $('#success').remove();
                        $('#error').remove(); 
                        var tz_form_output = '<div id="error" class="no-margin-lr alt-font">'+data.text+'</div>';
                    }else{
                        var tz_form_output = '';
                    } 
                }

                if(tz_form_output != '')
                {
                    var section_id = localStorage.getItem('tz_section');
                    $('#'+section_id).find('form').before(tz_form_output);
                }
                $('#' + section_id).find('form input,form textarea').each(function (index) {
                    $(this).val('');
                });

                setTimeout(function(){
                    $('#success').fadeOut();
                    $('#success').remove();
                    $('#error').fadeOut();
                    $('#error').remove();
                    $(this).submit();
                 },5000);
                localStorage.removeItem('tz_section');
            }, 'json');
        }
        
        $('#' + section_id).find('form input,form textarea').each(function (index) {
            $(this).keypress(function () {
                $(this).removeClass('tz_input_error');
            });
        });

        $('#' + section_id).find('form input,form textarea').each(function (index) {
            if ($(this).is(":focus")) {
                $(this).removeClass('tz_input_error');
            }
        });

        $('#' + section_id).find('form select').each(function (index) {
            $(this).on("change", function () {
                var val = this.value;
                if (val == ''){
                    $(this).removeClass('tz_input_error');
                }
            });
        });
    });

});

function LoadLightboxGallery()
{
    $('.lightbox-gallery').magnificPopup({
        delegate: 'a',
        type: 'image',
        tLoading: 'Loading image #%curr%...',
        mainClass: 'mfp-fade',
        gallery: {
            enabled: true,
            navigateByImgClick: true,
            preload: [0, 1] // Will preload 0 - before current, and 1 after the current image
        },
        image: {
            tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
            titleSrc: function (item) {
                return item.el.attr('title');
            }
        }
    });
}

/*==============================================================
 portfolio-filter
 ==============================================================*/

$portfolio_filter = $('.grid');
$portfolio_filter.imagesLoaded(function () {
    $portfolio_filter.isotope({
        itemSelector: 'li',
        layoutMode: 'masonry'
    });
});

$grid_selectors = $('.portfolio-filter > li > a');
$grid_selectors.on('click', function () {

    $portfolio_filter = $('.grid');
    $('.portfolio-filter > li').removeClass('active');
    $(this).parent().addClass('active');

    var selector = $(this).attr('data-filter');
    $portfolio_filter.imagesLoaded(function () {
        $portfolio_filter.isotope({
            filter: selector,
            itemSelector: 'li',
            layoutMode: 'masonry'

        });
    });
    return false;
});

function LoadIsotope() {
    $port_filter = $('.grid');
    var $gridSelectors = $('.portfolio-filter > li.active');
    var filter_val = $gridSelectors.find('a').attr('data-filter');
    if ($port_filter.data('isotope')) {
        $port_filter.isotope('destroy');
    }
    $port_filter.imagesLoaded(function () {
        $port_filter.isotope({
            filter: filter_val,
            itemSelector: 'li',
            layoutMode: 'masonry',
        });
    });
}

/*==============================================================
 Owl Slider Function
 ==============================================================*/

function LoadOwlSlider() {

    $('.owl-slider-full').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        items: 3,
        paginationSpeed: 400,
        autoPlay: 5000,
        singleItem: true,
        navigationText: ['<i class="fa fa-long-arrow-left"></i>', '<i class="fa fa-long-arrow-right"></i>']
    });
    
    $('.owl-slider-style2').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        items: 2,
        itemsDesktop: [1200, 2],
        itemsTablet: [800, 2],
        itemsMobile: [700, 1],
        paginationSpeed: 400,
         navigationText: ['<i class="fa fa-long-arrow-left"></i>', '<i class="fa fa-long-arrow-right"></i>']
    });

    $('.owl-slider-style3').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        items: 3,
        itemsDesktop: [1200, 4],
        itemsTablet: [800, 2],
        itemsMobile: [700, 1],
        paginationSpeed: 400,
        navigationText: ['<i class="fa fa-long-arrow-left"></i>', '<i class="fa fa-long-arrow-right"></i>']
    });

    $('.owl-slider-style4').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        items: 4,
        itemsDesktop: [1200, 4],
        itemsTablet: [991, 3],
        itemsMobile: [767, 1],
        paginationSpeed: 400,
        navigationText: ['<i class="fa fa-long-arrow-left"></i>', '<i class="fa fa-long-arrow-right"></i>']
    });

    $('.testimonial-style3').owlCarousel({
        navigation: false,
        items: 3,
        itemsDesktop: [1200, 3],
        itemsTablet: [800, 2],
        itemsMobile: [700, 1]
    });

    $('.gallery-style4').owlCarousel({
        navigation: false,
        items: 4,
        itemsDesktop: [1200, 4],
        itemsTablet: [991, 3],
        itemsMobile: [767, 1]
    });

    $('.owl-slider-auto').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        items: 3,
        autoPlay: 5000,
        paginationSpeed: 400,
        singleItem: true,
        navigationText: ['<i class="fa fa-long-arrow-left"></i>', '<i class="fa fa-long-arrow-right"></i>']
    });

    $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
        disableOn: 700,
        type: 'iframe',
        mainClass: 'mfp-fade',
        removalDelay: 160,
        preloader: false,
        fixedContentPos: false
    });
}

/*==============================================================
 Equalize Function
 ==============================================================*/

function LoadEqualize()
{
    $('.equalize').equalize({reset: true});
}

/*==============================================================
 Counter Function
 ==============================================================*/

function LoadCounter()
{
    $('#counter-event').countdown($('#counter-event').attr("data-enddate")).on('update.countdown', function (event) {
        var $this = $(this).html(event.strftime('' + '<div class="counter-container"><div class="counter-box first"><div class="number">%-D</div><span>Day%!d</span></div>' + '<div class="counter-box"><div class="number">%H</div><span>Hours</span></div>' + '<div class="counter-box"><div class="number">%M</div><span>Minutes</span></div>' + '<div class="counter-box last"><div class="number">%S</div><span>Seconds</span></div></div>'))
    });
}

$(window).resize(function () {
    setTimeout(function () {
        $portfolio_filter.isotope('layout');
        //set equalize height
        if (!isMobile.any()) {
            $(window).unbind('equalize');
            $('.equalize').equalize({reset: true});
        }
    }, 500);
});

$(window).on("orientationchange", function () {
    if (isMobile.any()) {
        $(window).unbind('equalize');
        //$('.equalize > div').css('height', '');
        setTimeout(function () {
            $('.equalize').equalize();
        }, 500);
    }
});

//set equalize height
$(window).load(function () {
    $('.equalize').equalize();
});

/*==============================================================
 accordion
 ==============================================================*/
$('.accordion-style1 .collapse').on('show.bs.collapse', function () {
    var id = $(this).attr('id');
    $('a[href="#' + id + '"]').closest('.panel-heading').addClass('active-accordion');
    $('a[href="#' + id + '"] .panel-title').find('i').addClass('fa-angle-up').removeClass('fa-angle-down');
});
$('.accordion-style1 .collapse').on('hide.bs.collapse', function () {
    var id = $(this).attr('id');
    $('a[href="#' + id + '"]').closest('.panel-heading').removeClass('active-accordion');
    $('a[href="#' + id + '"] .panel-title').find('i').removeClass('fa-angle-up').addClass('fa-angle-down');
});

/*==============================================================
 countdown timer
 ==============================================================*/

$('#counter-event').countdown($('#counter-event').attr("data-enddate")).on('update.countdown', function (event) {
    var $this = $(this).html(event.strftime('' + '<div class="counter-container"><div class="counter-box first"><div class="number">%-D</div><span>Day%!d</span></div>' + '<div class="counter-box"><div class="number">%H</div><span>Hours</span></div>' + '<div class="counter-box"><div class="number">%M</div><span>Minutes</span></div>' + '<div class="counter-box last"><div class="number">%S</div><span>Seconds</span></div></div>'))
});

/*==============================================================
 counter
 ==============================================================*/

jQuery(function ($) {
    // start all the timers
    animatecounters();
});

function animatecounters() {
    $('.timer').each(count);
    function count(options) {
        var $this = $(this);
        options = $.extend({}, options || {}, $this.data('countToOptions') || {});
        $this.countTo(options);
    }
}
/* ===========================================================
 TWITTER FEED
 ============================================================== */
function handleTweets(tweets) {

    var x = tweets.length,
            n = 0,
            element = document.getElementById('twitter-feed'),
            html = '<div class="twitter-post-slides">';
    while (n < x) {
        html += '<div>' + tweets[n] + '</div>';
        n++;
    }
    html += '</div>';
    element.innerHTML = html;
    /* Twits attached to owl-carousel */
    $(".twitter-post-slides").owlCarousel({
        slideSpeed: 300,
        paginationSpeed: 400,
        autoPlay: true,
        pagination: false,
        transitionStyle: "fade",
        singleItem: true
    });
}

if ($('#twitter-feed').length)
{
    var widgetId = $('#twitter-feed').attr('data-widget-id');
    var tz_config_feed = {
        "id": widgetId,
        "domId": 'twitter-feed',
        "maxTweets": 5,
        "enableLinks": true,
        "showUser": false,
        "showTime": true,
        "dateFunction": '',
        "showRetweet": false,
        "customCallback": handleTweets,
        "showInteraction": false
    };
    twitterFetcher.fetch(tz_config_feed);
}

/*==============================================================
 wow animation - on scroll
 ==============================================================*/

var wow = new WOW({
    boxClass: 'wow',
    animateClass: 'animated',
    offset: 90,
    mobile: false,
    live: true
});
wow.init();