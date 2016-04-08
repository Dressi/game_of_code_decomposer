let gd = require('node-gd');

class Decompositer {
    constructor(imagePath, colorCount, compression) {
        this.colorCount = colorCount || 255;
        this.compression = compression || 1;
        this.image = this._openImage(imagePath);
    }

    getDecompositedImage(output) {
        let compressionX = Math.floor(this.image.width / this.compression),
            compressionY = Math.floor(this.image.height / this.compression),
            compressedImage = this._resizeImage(this.image, compressionX, compressionY);

        compressedImage.saveJpeg('small.jpg');
        this._reduceColorCount(compressedImage, this.colorCount);
        compressedImage.saveJpeg('reduced.jpg');
        let compressedImagePixelMap = this._getImagePixelMap(compressedImage),
            decomposedImagePixelMap = this._decomposePixelMap(compressedImagePixelMap),
            decomposedImage = this._createCanvas(compressedImage.width * this.compression, compressedImage.height * this.compression);
        this._drawImage(decomposedImage, decomposedImagePixelMap, this.compression);
        decomposedImage.saveJpeg(output);
    }

    _openImage(path) {
        return gd.openJpeg(path);
    }

    _createCanvas(x, y) {
        return gd.createTrueColorSync(x, y);
    }

    _resizeImage(image, x, y) {
        let compressedImage = this._createCanvas(x, y);
        image.copyResampled(compressedImage, 0, 0, 0, 0, x, y, image.width, image.height);
        return compressedImage;
    }

    _reduceColorCount(image, colorCount) {
        image.trueColorToPalette(0, colorCount);
    }

    _getImagePixelMap(image) {
        let map = [];
        for (var y = 0; y < image.height; y++) {
            map[y] = [];
            for (var x = 0; x < image.width; x++) {
                map[y][x] = {
                    color: image.getTrueColorPixel(x, y),
                    level: 0
                }
            }
        }
        return map;
    }

    _decomposePixelMap(map) {
        let level = 1,
            height = map.length,
            width = map[0].length,
            decompositonedMap = map;
        while (map = this._levelDecomposition(map, width, height, level++)) {
            decompositonedMap = map;
        }
        return decompositonedMap;
    }

    _levelDecomposition(map, width, height, level) {
        var decompositonHappened = false,
            loopStep = Math.pow(2, level),
            step = Math.pow(2, level - 1);
        for (let y = 0; y < height; y += loopStep) {
            for (let x = 0; x < width; x += loopStep) {
                if (x + step >= width || y + step >= height) {
                    continue;
                }
                let color = map[y][x].color,
                    decompositionPoints = [
                        [x, y + step],
                        [x + step, y],
                        [x + step, y + step]
                    ];
                if (!decompositionPoints.some(point => map[point[1]][point[0]].color !== color || map[point[1]][point[0]].level !== level - 1)) {
                    decompositonHappened = true;
                    map[y][x] = {
                        color,
                        level
                    };
                    decompositionPoints.forEach(point => {
                        map[point[1]][point[0]] = undefined;
                    });
                }
            }
        }
        if (decompositonHappened) {
            return map;
        }
        return false;
    }

    _drawImage(image, map, decompressRate) {
        let height = map.length,
            width = map[0].length;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var piece = map[y][x];
                if (piece !== undefined) {
                    let level = Math.pow(2, map[y][x].level),
                        color = map[y][x].color;
                    image.filledRectangle(x * decompressRate, y * decompressRate, (x + level) * decompressRate, (y + level) * decompressRate, color);
                }
            }
        }
        return image;
    }
}

module.exports = Decompositer;