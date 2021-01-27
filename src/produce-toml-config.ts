import {createWriteStream} from 'fs';
import {EOL} from 'os';
import {createConnection} from 'typeorm';
import {PdfPortion} from './entities/PdfPortion';

(async () => {
    const connection = await createConnection();
    const portionRepository = connection.getRepository(PdfPortion);
    const allPortions = await portionRepository.find();

    const writeStreamOptions = {
        encoding: 'utf8' as BufferEncoding,
        autoClose: true
    };

    const tomlFile = createWriteStream('mmi.toml', writeStreamOptions);
    const tomlFileContent = [
        '[input]',
        'files = [',
        allPortions.map(portion => portion.storkFileEntry).join(`,${EOL}`),
        ']',
        '[output]',
        'filename = "mmi.st"',
    ].join(EOL);
    tomlFile.write(tomlFileContent);
    tomlFile.end();
})();
