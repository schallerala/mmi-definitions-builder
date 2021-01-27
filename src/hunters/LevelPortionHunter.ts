import {ILineHunter} from './ILineHunter';
import {createWriteStream, WriteStream} from 'fs';
import {Chapter, PdfLevel, Section, SubSection} from '../entities/PdfLevel';
import {PdfPortion, PortionType} from '../entities/PdfPortion';
import {EOL} from 'os';
import {join} from 'path';
import {MathEnvironment} from './math/MathEnvironment';

export class LevelPortionHunter implements ILineHunter {

    static readonly labelRegExp = /\\label{([^}]+)}/;
    static readonly refRegExp = /\\ref{([^}]+)}/;

    private readonly levelHunter = new LevelCounter();

    private portionId: number = 0;

    private currentPortionLines = new Array<string>();

    private currentMathEnv?: MathEnvironment;
    private mathEnvs = [
        MathEnvironment.createDefinitionEnv(),
        MathEnvironment.createTheoremEnv(),
        MathEnvironment.createLemmaEnv(),
        MathEnvironment.createCorollaryEnv(),
        MathEnvironment.createExampleEnv(),
        MathEnvironment.createRemarkEnv(),
        MathEnvironment.createExerciseEnv()
    ];

    private definitionCounter = 0;

    readonly levels = new Array<PdfLevel>();
    readonly pdfPortions = new Array<PdfPortion>();

    private currentOpenPortion?: PdfPortion;

    constructor(
        readonly outputFolderPath: string,
        readonly outputRelativePreamblePath: string,
        readonly continuousMultiStandaloneStream: WriteStream,
        readonly writeStreamOptions?: {
            flags?: string;
            encoding?: BufferEncoding;
            fd?: number;
            mode?: number;
            autoClose?: boolean;
            emitClose?: boolean;
            start?: number;
            highWaterMark?: number;
        },
    ) {
    }

    get levelPath(): string {
        return `${this.portionId}--${this.levelHunter.chapterCounter}-${this.levelHunter.sectionCounter}-${this.levelHunter.subSectionCounter}`;
    }

    get currentLevel(): PdfLevel {
        return this.levels[this.levels.length - 1];
    }

    read(line: string): ILineHunter {
        const newLevel = this.levelHunter.read(line);
        if (newLevel) {
            this.levels.push(newLevel);
            this.commitPortion();
            if (newLevel instanceof Section)
                this.definitionCounter = 0;
        }

        if (!this.currentMathEnv) {
            this.currentMathEnv = this.mathEnvs.find(env => env.testOpening(line));
            if (this.currentMathEnv) {
                this.commitPortion();
                this.startNewPortion(this.currentMathEnv.type);
                this.definitionCounter++;
            }
        } else {
            if (this.currentMathEnv.testClosing(line)) {
                this.writeLine(line);
                this.commitPortion();
                this.currentMathEnv = undefined;
                return this;
            }
        }

        this.writeLine(line);

        return this;
    }

    writeLine (line: string) {
        this.currentPortionLines.push(line);
        let match;
        if ((match = line.match(LevelPortionHunter.labelRegExp))) {
            this.currentOpenPortion.addLabel(match[1]);
        }
        if ((match = line.match(LevelPortionHunter.refRegExp))) {
            this.currentOpenPortion.addReference(match[1]);
        }
    }

    startNewPortion(type: PortionType) {
        this.portionId++;
        const texFilePath = join(this.outputFolderPath, `${this.levelPath}-${type}.tex`);
        this.currentOpenPortion = new PdfPortion(type, this.currentLevel, texFilePath);
        this.pdfPortions.push(this.currentOpenPortion);
        this.currentPortionLines = new Array<string>();
    }

    commitPortion() {
        const content = this.currentPortionLines.join(EOL);

        if (content.trim().length) {
            const texStream = createWriteStream(this.currentOpenPortion.texPath, this.writeStreamOptions);

            const singleContent = [
                `\\input{${this.outputRelativePreamblePath}}`,
                `\\begin{document}`,
                // `\\setcounter{chapter}{${this.levelHunter.chapterCounter}}`,
                `\\setcounter{section}{${this.levelHunter.sectionCounter}}`,
                `\\setcounter{subsection}{${this.levelHunter.subSectionCounter}}`,
                `\\setcounter{dfn}{${this.definitionCounter}}`,
                '',
                content,
                '',
                `\\end{document}`,
            ].join(EOL);

            texStream.write(singleContent);
            texStream.end();

            const standalonePage = [
                '',
                `%%%%%%%%%% ${this.currentOpenPortion.texPath}`,
                '\\begin{page}',
                `\\setcounter{section}{${this.levelHunter.sectionCounter}}`,
                `\\setcounter{subsection}{${this.levelHunter.subSectionCounter}}`,
                `\\setcounter{dfn}{${this.definitionCounter}}`,
                `\\label{portion:${this.portionId}}`,
                '',
                content,
                '',
                '\\end{page}',
                ''
            ].join(EOL);

            this.continuousMultiStandaloneStream.write(standalonePage);
        }

        // tmp create an "other" portion
        this.startNewPortion("other");
    }
}

export class LevelCounter {

    static readonly chapterLevel = /\\chapter{(.+)}/;
    static readonly sectionLevel = /\\section{(.+)}/;
    static readonly subSectionLevel = /\\subsection{(.+)}/;

    private _chapterCounter = 0;
    private _sectionCounter = 0;
    private _subSectionCounter = 0;

    private currentChapter: Chapter;
    private currentSection: Section;
    private currentSubsection: SubSection;

    // private repository: Repository<PdfLevel>;

    constructor(
        readonly listener?: LevelsChangeListener
    ) {
        // this.repository = getRepository(PdfLevel);
    }

    get chapterCounter(): number {
        return this._chapterCounter;
    }

    get sectionCounter(): number {
        return this._sectionCounter;
    }

    get subSectionCounter(): number {
        return this._subSectionCounter;
    }

    read(line: string): PdfLevel | undefined {
        let match;
        if ((match = line.match(LevelCounter.subSectionLevel))) {
            this._subSectionCounter++;
            this.currentSubsection = new SubSection(this.currentSection, this._subSectionCounter, match[1]);
            if (this.listener?.onNewSubSection)
                this.listener.onNewSubSection([this._chapterCounter, this._sectionCounter, this._subSectionCounter], this.currentSubsection);

            return this.currentSubsection;
        } else if ((match = line.match(LevelCounter.sectionLevel))) {
            this._sectionCounter++;
            this._subSectionCounter = 0;
            this.currentSubsection = undefined;
            this.currentSection = new Section(this.currentChapter, this._subSectionCounter, match[1]);
            if (this.listener?.onNewSection)
                this.listener.onNewSection([this._chapterCounter, this._sectionCounter], this.currentSection);

            return this.currentSection;
        } else if ((match = line.match(LevelCounter.chapterLevel))) {
            this._chapterCounter++;
            this._sectionCounter = 0;
            this._subSectionCounter = 0;
            this.currentSection = undefined;
            this.currentSubsection = undefined;
            this.currentChapter = new Chapter(this._chapterCounter, match[1]);
            if (this.listener?.onNewChapter)
                this.listener.onNewChapter([this._chapterCounter], this.currentChapter);

            return this.currentChapter;
        }

        return undefined;
    }
}

export interface LevelsChangeListener {
    onNewChapter?(levels: [number], chapter: Chapter);

    onNewSection?(levels: [number, number], chapter: Section);

    onNewSubSection?(levels: [number, number, number], chapter: SubSection);
}
