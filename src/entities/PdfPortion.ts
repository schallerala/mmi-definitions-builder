import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
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

    @Column({ nullable: true })
    readonly title: string;

    @Column("simple-array")
    readonly labelList = new Array<string>();

    @Column("simple-array")
    readonly referenceList = new Array<string>();

    // @ManyToMany(() => PortionReferenceLabel)
    // @JoinTable()
    // readonly referencingList: Array<PortionReferenceLabel> = [];
    //
    // @OneToMany(() => PortionReferenceLabel, ref => ref.insidePortion)
    // readonly referenceList: Array<PortionReferenceLabel>;

    constructor(type: PortionType, partOf: PdfLevel, texPath: string, title?: string) {
        this.type = type;
        this.partOf = partOf;
        this.texPath = texPath;
        this.title = title;
    }

    addLabel (label: string) {
        this.labelList.push(label);
    }

    addReference (label: string) {
        this.referenceList.push(label);
    }

    // addReferenceLabel (label: string) {
    //     this.referenceList.push(new PortionReferenceLabel(label, this));
    // }
    //
    // async addReferencing (label: string) {
    //     const referencing = await PortionReferenceLabel.repository.findOne(label);
    //     this.referencingList.push(referencing);
    // }
}

export type PortionType = "definition" | "theorem" | "lemma" | "corollary" | "example" | "remark" | "exercise" | "other";
