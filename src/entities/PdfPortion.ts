import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm';
import {PdfLevel} from './PdfLevel';

@Entity()
export class PdfPortion {
    @PrimaryColumn()
    readonly id: number;

    @Column()
    readonly type: PortionType;

    @Column()
    readonly chapterNumber: number;

    @ManyToOne(() => PdfLevel)
    readonly partOf: PdfLevel;

    @Column()
    readonly texPath: string;

    @Column()
    readonly title: string;

    @Column("simple-array")
    readonly labelList = new Array<string>();

    @Column("simple-array")
    readonly referenceList = new Array<string>();

    constructor(id: number, type: PortionType, partOf: PdfLevel, texPath: string, title: string) {
        this.id = id;
        this.type = type;
        this.partOf = partOf;
        this.chapterNumber = partOf?.rootChapter;
        this.texPath = texPath;
        this.title = title;
    }

    get txtFilePath (): string {
        return `${this.texPath.substring(0, this.texPath.length - 4)}.txt`;
    }

    get storkFileEntry (): string {
        return `    { path = "${this.txtFilePath}", url = "#", title = "${this.title}", portionId = "${this.id}", chapter = "${this.chapterNumber}", type = "${this.type}" }`;
    }

    addLabel (label: string) {
        this.labelList.push(label);
    }

    addReference (label: string) {
        this.referenceList.push(label);
    }
}

export type PortionType = "definition" | "theorem" | "lemma" | "corollary" | "example" | "remark" | "exercise" | "level" | "other";
