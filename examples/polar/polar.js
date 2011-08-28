// THe following values were obtained http://nsidc.org/data/atlas/epsg_3411.html

// North
var la0=-45;			// Central
var phi1=90;			// Data from http://nsidc.org/data/atlas/epsg_3411.html
var phic=70;            // optional
var a=6378273.0; 		// Hughes ellipsoid required here http://nsidc.org/data/polar_stereo/ps_grids.html
var e=0.081816153; 	
var k0=1;				// Scale factor

function unproject(x, y) {
    var degRad=Math.PI / 180;
    var radDeg=180 / Math.PI;

    // Equation 14-15
    var m1=Math.cos(phi1 * degRad) / Math.pow((1 - Math.pow(e, 2) * Math.pow(Math.sin(phi1 * degRad), 2)), 1 / 2);

    // Equation 3-1
    var X1=2 * Math.atan(Math.tan((45 + phi1 / 2) * degRad) * Math.pow((1 - e * Math.sin(phi1 * degRad)) / (1 + e * Math.sin(phi1 * degRad)), e / 2)) - Math.PI / 2;

    // Equations 21-18 / 38
    var p=Math.pow(Math.pow(x, 2) + Math.pow(y, 2), 1 / 2);
    var ce=2 * Math.atan(p * Math.cos(X1) / (2 * a * k0 * m1));

    //Equation 21-37
    var X=Math.asin(Math.cos(ce) * Math.sin(X1) + (y * Math.sin(ce) * Math.cos(X1) / p));

    // Equation 3-4
    // Using X as the first trial for phi
    var phi=2 * Math.atan(Math.tan(Math.PI / 4 + X / 2) * Math.pow((1 + e * Math.sin(X)) / (1 - e * Math.sin(X)), e / 2)) - Math.PI / 2;
    // Using this new trial value for phi, not for X
    phi=2 * Math.atan(Math.tan(Math.PI / 4 + X / 2) * Math.pow((1 + e * Math.sin(phi)) / (1 - e * Math.sin(phi)), e / 2)) - Math.PI / 2;
    phi=(2 * Math.atan(Math.tan(Math.PI / 4 + X / 2) * Math.pow((1 + e * Math.sin(phi)) / (1 - e * Math.sin(phi)), e / 2)) - Math.PI / 2) * radDeg;

    // Equation 21-36
    // The next trial calculation produces the same phi to seven decimals. Therefore, this is phi.
    var la= la0 + Math.atan(x * Math.sin(ce) / (p * Math.cos(X1) * Math.cos(ce) - y * Math.sin(X1) * Math.sin(ce))) * radDeg;
    
    // If the denominator of the arctan argument is negative (reversed in Snyder), it is necessary to add or subtract 180, 
    // whicever will place final la between +180 and -180.
    var arctanDenominator = (p * Math.cos(X1) * Math.cos(ce) - y * Math.sin(X1) * Math.sin(ce));
    
    //Reverse coordinates
    if(arctanDenominator < 0)
    {
        if (la < 0) la += 180;
        else if(la > 0) la -= 180;
    }
    
    return { x: la, y: phi };
}

// la = lon; phi = lat
function project(phi, la) {

    var degRad=Math.PI / 180;
    var radDeg=180 / Math.PI

    // Equation 3-1
    var X1=2 * Math.atan(Math.tan((45 + phi1 / 2) * degRad) * Math.pow((1 - e * Math.sin(phi1 * degRad)) / (1 + e * Math.sin(phi1 * degRad)), e / 2)) - Math.PI / 2;
    var X=2 * Math.atan(Math.tan((45 + phi / 2) * degRad) * Math.pow((1 - e * Math.sin(phi * degRad)) / (1 + e * Math.sin(phi * degRad)), e / 2)) - Math.PI / 2;

    // Equation 14-15
    var m1=Math.cos(phi1 * degRad) / Math.pow((1 - Math.pow(e, 2) * Math.pow(Math.sin(phi1 * degRad), 2)), 1 / 2);
    var m=Math.cos(phi * degRad) / Math.pow((1 - Math.pow(e, 2) * Math.pow(Math.sin(phi * degRad), 2)), 1 / 2);

    if (phi1 == 90) {
            
        // Equation 15-9
        var t = Math.tan((45-phi/2)*degRad) / Math.pow( (1-e*Math.sin(phi*degRad))/(1+e*Math.sin(phi*degRad)), e/2);
    
        var p;
        if (phic) {
            var tc = Math.tan((45-phic/2)*degRad) / Math.pow( (1-e*Math.sin(phic*degRad))/(1+e*Math.sin(phic*degRad)), e/2);
            var mc = Math.cos(phic * degRad) / Math.pow((1 - Math.pow(e, 2) * Math.pow(Math.sin(phic * degRad), 2)), 1 / 2);
            p = a*mc*t/tc;
        }
        else {
            // Equation 21-33
            p = 2 * a * k0 * t / Math.pow( Math.pow(1+e,1+e)*Math.pow(1-e,1-e), 1/2 );
        }
    
        // Equations 21-30 / 31 / 32
        var x = p * Math.sin((la - la0) * degRad);
        var y = -p * Math.cos((la - la0) * degRad);
        var k = p / (a * m);
    
        return { x: x, y: y };
    }
    else {
        // Equation 21-27
        var A=2 * a * k0 * m1 / (Math.cos(X1) * (1 + Math.sin(X1) * Math.sin(X) + Math.cos(X1) * Math.cos(X) * Math.cos((la - la0) * degRad)));
    
        //console.log(A); // expecting 64501707.7
    
        // Equations 21-24 / 25 / 26
        var x=A * Math.cos(X) * Math.sin((la - la0) * degRad);
        var y=A * (Math.cos(X1) * Math.sin(X) - Math.sin(X1) * Math.cos(X) * Math.cos((la - la0) * degRad));
        var k=A * Math.cos(X) / (a * m);
    
        //console.log('x', x); // expecting 971630.8
        //console.log('y', y); // -1063049.3
        //console.log('k', k);
        
        return { x: x, y: y };    
    }
}
