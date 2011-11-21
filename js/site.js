// Application bootstrap.
$(window).load(function() {
    $('<div class="demo"></div>').prependTo('div.live').html($('div.live').text()).map(function(elem) {
        eval($('script', elem).text());
    });

    $('a.code').click(function (e) {
        e.preventDefault();
        if ($(this).hasClass('active')) {
            $('.highlight').removeClass('active');
            $(this).removeClass('active');
        } else {
            $('.highlight').addClass('active');
            $(this).addClass('active');
        }
    });
});