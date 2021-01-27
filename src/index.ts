import {createConnection} from 'typeorm';
import {createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, symlinkSync, writeFileSync} from 'fs';
import {dirname, join, resolve, basename} from 'path';
import * as pMap from 'p-map';
import {ILineHunter} from './hunters/ILineHunter';
import {PreambleHunter} from './hunters/PreambleHunter';
import {LevelPortionHunter} from './hunters/LevelPortionHunter';
import {execPandocToMd, execPdfLatex, execStorkBuild, promiseExec} from './spawn';
import {createInterface, promiseOnClose} from './readline';
import { EOL } from 'os';

const args = process.argv.slice(2);

const writeStreamOptions = {
    encoding: 'utf8' as BufferEncoding,
    autoClose: true
};

(async function () {
    if (args.length < 3) {
        console.error("Missing 3 arguments: <mmi.tex> <output folder> <stork index>");
        process.exit(1);
    }
    const [ mmiFile, outFolder, storkIndexFile ] = args;
    if ( ! existsSync(mmiFile)) {
        console.error("First argument must be a valid tex file");
        process.exit(1);
    }
    const preambleFilename = 'preamble.tex';

    mkdirSync(outFolder, { recursive: true });

    // const connection = await createConnection();

    // const readInterface = createInterface({
    //     input: createReadStream(mmiFile),
    // });
    //
    // const portionHunter = new LevelPortionHunter(outFolder, preambleFilename, writeStreamOptions);
    // const stream1 = createWriteStream(join(outFolder, preambleFilename), writeStreamOptions);
    // let currentHunter: ILineHunter = new PreambleHunter(
    //     stream1,
    //     portionHunter
    // );
    //
    // readInterface.on('line', function(line) {
    //     currentHunter = currentHunter.read(line);
    // });
    //
    // await promiseOnClose(readInterface);
    //
    // console.log("Preparing portions", portionHunter.levels);
    let [, ...portionFiles] = readdirSync(outFolder).filter(outputItem => outputItem.match(/.*\.tex$/ig) && outputItem !== preambleFilename);

    console.warn("Go through the first 50 only!");
    portionFiles = portionFiles.slice(0, 50);

    // const outputFigSymbolicLink = join(outFolder, 'Fig');
    // if ( ! existsSync(outputFigSymbolicLink)) {
    //     const originalTexDirectory = dirname(mmiFile);
    //     symlinkSync(resolve(join(originalTexDirectory, 'Fig')), outputFigSymbolicLink);
    // }

    await pMap(portionFiles, async portionFile => {
        portionFile = basename(portionFile);
        try {
            await Promise.all([
                execPandocToMd(portionFile, outFolder),
                execPdfLatex(portionFile, outFolder),
                execPdfLatex(portionFile, outFolder)
            ]);
        } catch (e) {
            console.error(`Error while compiling ${portionFile}`);
            throw e;
        }
    }, {
        concurrency: 5,
        stopOnError: false
    });

    const storkConfigFile = `${storkIndexFile}.toml`;
    writeFileSync(storkConfigFile,
`
[input]
base_directory = "${outFolder}/"
files = [
${portionFiles.map(portionFile => {
    let file = basename(portionFile);
    file = file.substring(0, file.length - 4);
    const mdFile = `${file}.md`;
    
    return `    {path = "${mdFile}", url = "#", title = "${file}", pdf = "${file}.pdf", type = "TODO" }`
}).join(`,${EOL}`)}
]

[output]
filename = "${storkIndexFile}"
`, 'utf8');

    await execStorkBuild(storkConfigFile);
})();




