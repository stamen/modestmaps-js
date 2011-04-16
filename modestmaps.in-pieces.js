if(!com)
{
    var com = {};
    if(!com.modestmaps)
    {
        com.modestmaps = {};
    }
}

var scripts = document.getElementsByTagName('script'),
    script = scripts[scripts.length - 1],
    base = script.src.replace(/\bmodestmaps\.in-pieces\.js$/, 'src/');

var pieces = 'utils point coordinate location transformation projection provider interaction callbacks requests map'.split(' ');

var MM = com.modestmaps;

for(var i in pieces)
{
    var script_src = base + pieces[i] + '.js';
    document.write('<script src="'+script_src+'" type="text/javascript"></script>');
}
