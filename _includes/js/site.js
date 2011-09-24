// Application bootstrap.
$(window).load(function() {
    $('<div class="demo"></div>')
        .insertBefore('div.live')
        .html($('div.live').text())
        .map(function(elem) {
            eval($('script', elem).text());
        });
});
