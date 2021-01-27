import {Column, Entity, ManyToMany, ManyToOne, JoinTable, PrimaryGeneratedColumn} from 'typeorm';
import {PdfLevel} from './PdfLevel';

@Entity()
export class PdfPortion {
    @PrimaryGeneratedColumn()
    readonly id: number;

    @Column()
    readonly type: PortionType;

    @ManyToOne(() => PdfLevel)
    readonly partOf: PdfLevel;

    @Column()
    readonly texPath: string;

    @ManyToMany(() => PdfPortion)
    @JoinTable()
    readonly referencing: Array<PdfPortion>;

    constructor(type: PortionType, partOf: PdfLevel, texPath: string) {
        this.type = type;
        this.partOf = partOf;
        this.texPath = texPath;
    }
}

export type PortionType = "definition" | "theorem" | "lemma" | "corollary" | "example" | "remark" | "exercise" | "other";
