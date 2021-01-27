import * as pMap from 'p-map';
import {execDetex} from './utils/spawn';
import {createConnection} from 'typeorm';
import {PdfPortion} from './entities/PdfPortion';


(async () => {
    const connection = await createConnection();
    const portionRepository = connection.getRepository(PdfPortion);
    const allPortions = await portionRepository.find();

    // 1. produce txt file from tex
    await pMap(allPortions, produceTxt, {
        concurrency: 6
    });
})();

function produceTxt({ texPath, txtFilePath }: PdfPortion): Promise<void> {
    return execDetex(texPath, txtFilePath);
}

