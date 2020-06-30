const presets = [
    [
        "@babel/env", {    
            "useBuiltIns": "usage",
            "corejs": {
                "version": "3.6.5",
                "proposals": false
            },
            "targets": "> 0.25%, not dead"
        }
    ]
];

const plugins = [];

module.exports = { presets, plugins };