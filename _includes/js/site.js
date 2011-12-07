$(document).ready(function () {
    // Evaluate example code and run
    $('<div class="demo"></div>').prependTo('div.live').html($('div.live').text()).each(function(elem) {
        eval($('script', elem).text());
    });
});