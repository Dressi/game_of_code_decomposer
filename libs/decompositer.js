let gd = require('node-gd'),
    fs = require('fs');

class Decompositer {
    constructor(imagePath, palette, compression, imagesPath) {
        this.compression = compression || 1;
        this.imagesPath = imagesPath;
        this.image = this._openImage(imagePath);
        this.palette = this._openPalette(palette);
        this.palette.trueColorToPalette(0);
        this.sourceIndexes = [];
    }

    getDecompositedImage(output) {
        let compressionX = Math.floor(this.image.width / this.compression),
            compressionY = Math.floor(this.image.height / this.compression),
            compressedImage = this._resizeImage(this.image, compressionX, compressionY);

        compressedImage.saveJpeg('small.jpg');
        let compressedImagePixelMap = this._getImagePixelMap(compressedImage),
            decomposedImagePixelMap = this._decomposePixelMap(compressedImagePixelMap),
            decomposedImage = this._createCanvas(compressedImage.width * this.compression, compressedImage.height * this.compression);
        this._drawImage(decomposedImage, decomposedImagePixelMap, this.compression);
        decomposedImage.saveJpeg(output);
    }

    _openImage(path, type) {
        return gd.openJpeg(path);
    }

    _openPalette(path) {
        return gd.openPng(path);
    }

    _createCanvas(x, y) {
        return gd.createTrueColorSync(x, y);
    }

    _resizeImage(image, x, y) {
        let compressedImage = this._createCanvas(x, y);
        image.copyResampled(compressedImage, 0, 0, 0, 0, x, y, image.width, image.height);
        return compressedImage;
    }

    _getImagePixelMap(image) {
        let map = [];
        for (var y = 0; y < image.height; y++) {
            map[y] = [];
            for (var x = 0; x < image.width; x++) {
                let color = image.getTrueColorPixel(x, y),
                    r = (color >> 16) & 0xFF,
                    g = (color >> 8) & 0xFF,
                    b = color & 0xFF;
                let paletteColor = this.palette.colorClosest(r,g,b);
                map[y][x] = {
                    color: paletteColor,
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
                        color = map[y][x].color,
                        dx1 = x * decompressRate,
                        dy1 = y * decompressRate,
                        replaceImage = this._getImage(color);
                    if (replaceImage) {
                        replaceImage.copyResampled(image, dx1, dy1, 0, 0, level, level, 256, 256);
                    }
                    else {
                        image.filledRectangle(dx1, dy1, (x + level) * decompressRate, (y + level) * decompressRate, color);
                    }
                }
            }
        }
        return image;
    }

    _getImage(index) {
        try {
            let sourceIndex = this.sourceIndexes[index] || 0,
                imagePath = `${this.imagesPath}/${index}/${sourceIndex}.jpg`;
            fs.accessSync(imagePath);
            let image = this._openImage(imagePath);
            this.sourceIndexes[index] = this.sourceIndexes[index] === undefined ? 1 : this.sourceIndexes[index]++;
            return image;
        }
        catch(e) {
            if (this.sourceIndexes[index]) {
                this.sourceIndexes[index] = 0;
                return this._getImage(index);
            }
            return false;
        }
    }
}

module.exports = Decompositer;