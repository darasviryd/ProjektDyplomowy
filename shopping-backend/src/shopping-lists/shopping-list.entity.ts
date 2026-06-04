import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    OneToMany,
    UpdateDateColumn,
    JoinColumn,
  } from 'typeorm';
  import { User } from '../users/user.entity';
  import { ShoppingItem } from '../shopping-items/shopping-item.entity';
  
  @Entity()
  export class ShoppingList {
    @PrimaryColumn()
    id!: string;
  
    @Column()
    name!: string;
  
    @Column('float', { default: 0 })
    budgetLimit!: number;

    @Column({ default: 'PLN' })
    currency!: string;
  
    @Column()
    userId!: number; 
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user!: User;
  
    @OneToMany(() => ShoppingItem, (item) => item.list)
    items!: ShoppingItem[];
  
    @UpdateDateColumn()
    updatedAt!: Date;
  }
