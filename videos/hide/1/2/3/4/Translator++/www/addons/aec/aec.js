const thisAddon 	= this;
const nwPath        = require("path");
const glob          = require("glob");



thisAddon.binPath = nwPath.join(thisAddon.getPathRelativeToRoot(), "bin/GARbro-cli");
thisAddon.extractFile = async function(file, destination) {
    console.log("Extracting", file, "into", destination);
    await common.aSpawn("GARbro.Console.exe", ["x", "-y", "-o", `"${destination}"`, `"${file}"`], {
        cwd: nwPath.join(thisAddon.getLocation(), "bin/GARbro-cli"),
        shell:true,
        onData: function(data) {
            ui.log(data.toString());
        }
    })
}

thisAddon.getAllFiles = async function(directory, globFilter) {
    return new Promise((resolve, reject) => {
        var found = glob(globFilter, {cwd:directory}, function(err, matches) {
            if (err) return reject(new Error(err))
            resolve(matches);
        });
    })
}

thisAddon.extractAll = async function(directory, globFilter, destination) {
    if (!globFilter) return console.warn("No filter defined. Please define a filter such as **/*.dat");
    destination = destination || directory;

    var files = await this.getAllFiles(directory, globFilter);

    if (!files) return;
    if (files.length == 0) return;

    for (var i=0; i<files.length; i++) {
        var destination = nwPath.join(directory, nwPath.dirname(files[i]), nwPath.basename(files[i], nwPath.extname(files[i])));
        console.log("Extracting to", destination);
        await this.extractFile(nwPath.join(directory, files[i]), destination)
    }
}