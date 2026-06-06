import {
       Entity,
       PrimaryColumn,
       Column,
       ManyToOne,
       UpdateDateColumn,
     } from 'typeorm';
     import { ShoppingList } from '../shopping-lists/shopping-list.entity';
     
     @Entity()
     export class ShoppingItem {
       @PrimaryColumn()
       id!: string;
     
       @Column()
       name!: string;
     
       @Column('float')
       price!: number;

       @Column({ default: 'PLN' })
       currency!: string;

       @Column('float', { default: 1 })
       quantity!: number;

       @Column({ nullable: true })
       description?: string;

       @Column({ nullable: true })
       url?: string;

       @Column({ nullable: true })
       imageUrl?: string;

       @Column({ default: 'normal' })
       priority!: string;
     
       @Column({ default: false })
       bought!: boolean;
     
       @ManyToOne(() => ShoppingList, list => list.items, { onDelete: 'CASCADE' })
       list!: ShoppingList;
     
       @UpdateDateColumn()
       updatedAt!: Date;
     }
