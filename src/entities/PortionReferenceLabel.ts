import {Entity, ManyToOne, PrimaryColumn, Repository} from 'typeorm';
import {PdfPortion} from './PdfPortion';

// @Entity()
// export class PortionReferenceLabel {
//
//     @PrimaryColumn()
//     readonly label: string;
//
//     @ManyToOne(() => PdfPortion, portion => portion.referenceList)
//     readonly insidePortion: PdfPortion;
//
//     static repository: Repository<PortionReferenceLabel>;
//
//     constructor(label: string, insidePortion: PdfPortion) {
//         this.label = label;
//         this.insidePortion = insidePortion;
//     }
// }
