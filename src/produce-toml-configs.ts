import {createWriteStream} from 'fs';
import {EOL} from 'os';
import { join } from 'path';
import {createConnection} from 'typeorm';
import {PdfPortion} from './entities/PdfPortion';

const args = process.argv.slice(2);

(async () => {
    if (args.length < 1) {
        console.error("Missing 1 argument: <output folder> [combinations of chapters...]");
        process.exit(1);
    }
    const [ outFolder, ...combinations ] = args;
    //
    // if (combinations.length === 0) {
    //     console.warn("No combinations given, therefore, merge them all together");
    //     combinations.push('1-2-3-4-5-6');
    // }

    const connection = await createConnection();
    const portionRepository = connection.getRepository(PdfPortion);
    const allPortions = await portionRepository.find();

    const writeStreamOptions = {
        encoding: 'utf8' as BufferEncoding,
        autoClose: true
    };

    const portionsByChapter = groupByChapter(allPortions);

    const filterOutGodel = ({ title }) => ! title.includes("4.3. Gödel's incompleteness theorems");
    const portionsCombinations = {
        'all': allPortions,
        '1': portionsByChapter.get(1),
        '2': portionsByChapter.get(2),
        '3': portionsByChapter.get(3),
        '4': portionsByChapter.get(4),
        '4-no-godel': portionsByChapter.get(4).filter(filterOutGodel),
        '3-4': portionsByChapter.get(3).concat(portionsByChapter.get(4)),
        '3-4-no-godel': portionsByChapter.get(3).concat(portionsByChapter.get(4)).filter(filterOutGodel),
        '1-2-3-4': portionsByChapter.get(1).concat(portionsByChapter.get(2)).concat(portionsByChapter.get(3)).concat(portionsByChapter.get(4)),
        '5': portionsByChapter.get(5),
        '1-5': portionsByChapter.get(1).concat(portionsByChapter.get(5)),
        '6': portionsByChapter.get(6),
        '5-6': portionsByChapter.get(5).concat(portionsByChapter.get(6)),
    }

    const indexes = {};
    for (const [key, portions] of Object.entries(portionsCombinations)) {
        const tomlFile = createWriteStream(join(outFolder, `mmi-${key}.toml`), writeStreamOptions);
        const storkEntryMap = key.length === 1
            ? portion => portion.shortStorkFileEntry
            : portion => portion.storkFileEntry;
        const indexFilename = join(outFolder, `mmi-${key}.st`);
        const tomlFileContent = [
            '[input]',
            'title_boost = "Ridiculous"',
            'files = [',
            portions.map(storkEntryMap).join(`,${EOL}`),
            ']',
            '[output]',
            `filename = "${indexFilename}"`,
        ].join(EOL);
        tomlFile.write(tomlFileContent);
        tomlFile.end();
        indexes[key] = indexFilename;
    }

    const tomlFile = createWriteStream(join(outFolder, 'indexes.json'), writeStreamOptions);
    tomlFile.write(JSON.stringify(indexes));
    tomlFile.end();
})();

function groupByChapter (portions: Array<PdfPortion>): Map<number, Array<PdfPortion>> {
    const groups = new Map<number, Array<PdfPortion>>();

    for (const portion of portions) {
        const { chapterNumber } = portion;
        if ( ! groups.has(chapterNumber)) {
            groups.set(chapterNumber, new Array<PdfPortion>());
        }
        groups.get(chapterNumber).push(portion);
    }

    return groups;
}
