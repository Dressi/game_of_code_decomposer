let gd = require('node-gd');

class Decompositer {
    consturtor() {

    }
}

var imgFile = gd.openJpeg('./img.jpg');

getImageColor(imgFile);

function getImageColor(img) {
    var pix = gd.createTrueColorSync(1,1);
    img.copyResampled(pix, 0, 0, 0, 0, 1, 1, img.width, img.height);
    var color = pix.imageColorAt(0,0);
    console.log(color.toString(16), img.width, img.height);
    var rate = 8;
    var smallimg = gd.createTrueColorSync(Math.ceil(img.width/rate), Math.ceil(img.height/rate));
    img.copyResampled(smallimg, 0, 0, 0, 0, smallimg.width, smallimg.height, img.width, img.height);
    //smallimg.sharpen(100);
    smallimg.trueColorToPalette(0, 64);
    smallimg.saveJpeg('./smallimg.jpg');
    var map = getImagePixelMap(smallimg, 255*255*255);
    var decomp = decomposition(map, smallimg.width, smallimg.height);
    //console.log(decomp[0]);
    var decompimage = gd.createTrueColorSync(smallimg.width*rate,smallimg.height*rate);
    decompimage = createImage(decompimage, decomp, smallimg.width, smallimg.height, rate);
    img.copyMerge(decompimage, 0, 0, 0, 0, img.width, img.height, 20);
    decompimage.saveJpeg('./decomp.jpg');
}

function getImagePixelMap(pix, depth) {
    var c = Math.round(255*255*255 / depth);

    var map = [],
        width = pix.width;
    for(var j=0; j<pix.height; j++) {
        for(var i=0; i<pix.width; i++) {
            map[getPosition(i,j,width)] = Math.ceil(pix.getTrueColorPixel(i,j)/c)*c;
        }
    }
    return map;
}

function createImage(pix, decomp, w, h, rate) {
    //var color = 0;
    //var step = 111*19*231;
    //var c = 255*255*255;
    for(var j=0; j<h; j++) {
        for(var i=0; i<w; i++) {
            var piece = decomp[getPosition(i,j,w)];
            if (piece !== undefined) {
                var level = Math.pow(2, getLevel(decomp, i,j,w));
                var color = getValue(decomp, i,j,w);
                pix.rectangle(i*rate,j*rate, (i+level)*rate, (j+level)*rate, color);
            }
        }
    }
    return pix;
}

//function decomposition(p, w, h) {
// var decomp = [];
// var rep = [];
// var k = 1;
// for(var j=0; j<h; j++) {
//    for(var i=0; i<w; i++) {
//       if (rep[getPosition(i,j,w)]) {
//          continue;
//       }
//       var maxLevel = getMaxLevel(p, rep, i, j, w, h);
//       decomp[getPosition(i,j,w)] = {l: maxLevel, c: p[getPosition(i,j,w)]};
//       rep = fill(rep, i, j, w, maxLevel, k++);
//    }
// }
// return decomp;
//}

function getValue(data, x, y, width) {
    let value = data[getPosition(x, y, width)];
    if (typeof value === 'object') {
        return value.value;
    }
    return value;
}

function getLevel(data, x, y, width) {
    let value = data[getPosition(x, y, width)];
    if (typeof value === 'object') {
        return value.level;
    }
    return 0;
}

function decomposition(data, width, height) {
    let level = 1,
        decompositoned;
    while(data = levelDecompositon(data, width, height, level++)) {
        decompositoned = data;
    }
    return decompositoned;
}

function levelDecompositon(data, width, height, level) {
    var decompositonHappened = false,
        loopStep = Math.pow(2, level),
        step = Math.pow(2,level - 1);
    for (let y = 0; y < height; y += loopStep) {
        for (let x = 0; x < width; x += loopStep) {
            let value = getValue(data, x, y, width);
            if (x + step >= width || y + step >= height) {
                continue;
            }
            let decompositionPoints = [
                [x, y+step],
                [x+step, y],
                [x+step, y+step]
            ];
            if (!decompositionPoints.some(point => getValue(data, point[0], point[1],width) !== value || getLevel(data, point[0], point[1], width) !== level-1)) {
                decompositonHappened = true;
                data[getPosition(x,y, width)] = {
                    level,
                    value
                };
                decompositionPoints.forEach(point => {
                    data[getPosition(point[0], point[1], width)] = undefined;
            });
        }
    }
}
if (decompositonHappened) {
    return data;
}
return false;
}

function getPosition(x,y, width) {
    return x+y*width;
}

//function getMaxLevel(data, rep, x, y, w, h) {
// var value = data[getPosition(x,y,w)];
// var l = 1;
// while(++l) {
//    if (l>100) {
//       return 100;
//    }
//    if (x + l >= w || y + l >= h) {
//       return l-1;
//    }
//    for(var i = 0; i<=l; i++) {
//       if (
//          rep[getPosition(x+l, y+i,w)] || rep[getPosition(x+i, y+l,w)] ||
//          data[getPosition(x+l, y+i, w)] !== value || data[getPosition(x+i, y+l, w)] !== value
//       ) {
//          return l-1;
//       }
//    }
// }
//}

//function fill(data, x, y, w, level, value) {
// for (var l = 0; l <= level; l++) {
//    for (var i = 0; i<= l; i++) {
//       data[getPosition(x+l, y+i, w)] = data[getPosition(x+i, y+l, w)] = value;
//    }
// }
// return data;
//}

function prettyPrint(data, w, h) {
    for(var j = 0; j<h; j++) {
        var line = [];
        for(var i = 0; i < w; i++) {
            line.push(data[getPosition(i,j,w)]);
        }
        console.log(line.join(','));
    }
}