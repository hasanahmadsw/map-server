import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StaffRole } from '../enums/staff-role.enums';
import { StaffTranslationEntity } from './staff-translation.entity';
import * as bcrypt from 'bcryptjs';

@Entity('staff')
export class StaffEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'image', nullable: true })
  image: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: StaffRole,
  })
  role: StaffRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamp', name: 'password_changed_at' })
  passwordChangedAt: Date;

  @OneToMany(() => StaffTranslationEntity, (translation) => translation.staff)
  translations: StaffTranslationEntity[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password || this.password.startsWith('$2b$')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
  }
}
