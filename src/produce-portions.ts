import {createConnection} from 'typeorm';
import {createReadStream, createWriteStream, existsSync, mkdirSync} from 'fs';
import { join, basename} from 'path';
import {ILineHunter} from './hunters/ILineHunter';
import {PreambleHunter} from './hunters/PreambleHunter';
import {LevelPortionHunter} from './hunters/LevelPortionHunter';
import {createInterface, waitEndReadLines} from './utils/readline';
import { EOL } from 'os';
import {PdfLevel} from './entities/PdfLevel';
import {PdfPortion} from './entities/PdfPortion';

const args = process.argv.slice(2);

const writeStreamOptions = {
    encoding: 'utf8' as BufferEncoding,
    autoClose: true
};

(async function () {
    if (args.length < 3) {
        console.error("Missing 3 arguments: <mmi.tex> <pathToPreambleFile> <output folder>");
        process.exit(1);
    }
    const [ mmiFile, preambleFile, outFolder ] = args;
    if ( ! existsSync(mmiFile)) {
        console.error("First argument must be a valid tex file");
        process.exit(1);
    }

    mkdirSync(outFolder, { recursive: true });

    const readInterface = createInterface({
        input: createReadStream(mmiFile),
    });

    const multiStandaloneStream = createWriteStream(join(outFolder, basename(mmiFile)), writeStreamOptions);
    multiStandaloneStream.write([
        `\\input{${preambleFile}}`,
        `\\begin{document}`,
        ''
    ].join(EOL));

    const portionHunter = new LevelPortionHunter(
        outFolder,
        multiStandaloneStream,
        writeStreamOptions
    );
    let currentHunter: ILineHunter = new PreambleHunter(
        portionHunter
    );

    readInterface.on('line', function(line) {
        if ( ! line.trim().startsWith('%'))
            currentHunter = currentHunter.read(line);
    });

    await waitEndReadLines(readInterface);

    multiStandaloneStream.write([
        ``,
        `\\end{document}`,
    ].join(EOL));
    multiStandaloneStream.end();

    const connection = await createConnection();
    const levelRepository = connection.getRepository(PdfLevel);
    const portionRepository = connection.getRepository(PdfPortion);

    await levelRepository.save(portionHunter.levels);
    await portionRepository.save(portionHunter.pdfPortions);
})();




