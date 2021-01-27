import * as pMap from 'p-map';
import {basename} from 'path';
import {execPandocToMd, execPdfLatex, execStorkBuild} from './utils/spawn';
import {writeFileSync} from 'fs';
import {EOL} from 'os';

// await pMap(portionFiles, async portionFile => {
//     portionFile = basename(portionFile);
//     try {
//         await Promise.all([
//             execPandocToMd(portionFile, outFolder),
//             execPdfLatex(portionFile, outFolder),
//             execPdfLatex(portionFile, outFolder)
//         ]);
//     } catch (e) {
//         console.error(`Error while compiling ${portionFile}`);
//         throw e;
//     }
// }, {
//     concurrency: 5,
//     stopOnError: false
// });
//
// const storkConfigFile = `${storkIndexFile}.toml`;
// writeFileSync(storkConfigFile,
//     `
// [input]
// base_directory = "${outFolder}/"
// files = [
// ${portionFiles.map(portionFile => {
//         let file = basename(portionFile);
//         file = file.substring(0, file.length - 4);
//         const mdFile = `${file}.md`;
//
//         return `    {path = "${mdFile}", url = "#", title = "${file}", pdf = "${file}.pdf", type = "TODO" }`
//     }).join(`,${EOL}`)}
// ]
//
// [output]
// filename = "${storkIndexFile}"
// `, 'utf8');
//
// await execStorkBuild(storkConfigFile);
