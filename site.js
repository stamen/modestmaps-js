window.onload = function() {
  var pres = document.getElementsByTagName('pre');
  for (var i = 0; i < pres.length; i++) {
    if (pres[i].className === 'prettyprint') {
      eval(pres[i].innerHTML);
    }
  }
  prettyPrint();
};
