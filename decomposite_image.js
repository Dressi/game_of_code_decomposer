let commandLineArgs = require('command-line-args'),
    cli = commandLineArgs([
        {name: 'input', defaultOption: true},
        {name: 'compress', type: Number},
        {name: 'palette'},
        {name: 'images'},
        {name: 'output'}
    ]),
    Decompositer = require('./libs/decompositer');

let options = cli.parse(),
    decompositer = new Decompositer(options.input, options.palette, options.compress, options.images);
decompositer.getDecompositedImage(options.output);