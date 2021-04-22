import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export default class Document {
  @PrimaryColumn()
  id: string;

  @Column("simple-json")
  data: object;
}
