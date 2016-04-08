let commandLineArgs = require('command-line-args'),
    cli = commandLineArgs([
        {name: 'input', defaultOption: true},
        {name: 'color', type: Number},
        {name: 'compress', type: Number},
        {name: 'output'}
    ]),
    Decompositer = require('./libs/decompositer');

let options = cli.parse(),
    decompositer = new Decompositer(options.input, options.color, options.compress);
decompositer.getDecompositedImage(options.output);