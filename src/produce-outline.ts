import {createConnection} from 'typeorm';
import {PdfPortion} from './entities/PdfPortion';
import {PdfLevel} from './entities/PdfLevel';
import {createWriteStream} from 'fs';

const args = process.argv.slice(2);

(async () => {
    if (args.length < 1) {
        console.error("Missing 1 argument: <outline.json path>");
        process.exit(1);
    }
    const [ outlinePath ] = args;

    const connection = await createConnection();
    const levelRepository = connection.getRepository(PdfLevel);
    const portionRepository = connection.getRepository(PdfPortion);
    const allLevels = await levelRepository.find({ order: { id: 'ASC' }, relations: [ 'parent' ] });
    const allPortions = await portionRepository.find({ order: { id: 'ASC' }, relations: ['partOf'] });

    const rootStack = [];
    let outlineStack = rootStack;
    let j = 0;
    for (let i = 0; i < allPortions.length; i++) {
        const portion = allPortions[i];
        const page = portion.id;
        const { type } = portion;
        for (; j < portion.partOf.id; j++) {
            const level = allLevels[j];
            switch (level.type) {
                case 'chapter':
                    const chapterOutline = { text: level.text, type: level.type, page, children: [] };
                    rootStack.push(chapterOutline);
                    outlineStack = [chapterOutline];
                    break;
                case 'section':
                    while (outlineStack.length > 1) {
                        outlineStack.pop();
                    }
                case 'subsection':
                    while (outlineStack.length > 2) {
                        outlineStack.pop();
                    }
                    const lastOutlineStack = outlineStack[outlineStack.length - 1];
                    const sectionOutline = { text: level.text, type: level.type, page, children: [] };
                    lastOutlineStack.children.push(sectionOutline);
                    outlineStack.push(sectionOutline);
                    break;
                default:
                    throw new Error("Unknown type");
            }
        }
        if (type === 'level')
            continue;

        const lastOutlineStack = outlineStack[outlineStack.length - 1];
        const portionText = portion.title.includes(":")
            ? portion.title.substring(0, portion.title.indexOf(":"))
            : '...';
        lastOutlineStack.children.push({ text: portionText, type, page: portion.id });
    }

    const outlineStream = createWriteStream(outlinePath, {
        encoding: 'utf8' as BufferEncoding,
        autoClose: true
    });
    outlineStream.write(JSON.stringify(rootStack));
    outlineStream.end();
})();
