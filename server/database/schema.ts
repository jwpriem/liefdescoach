import { pgTable, text, timestamp, boolean, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const creditTypeEnum = pgEnum('credit_type', ['credit_1', 'credit_5', 'credit_10', 'credit_20'])
export const lessonTypeEnum = pgEnum('lesson_type', ['hatha yoga', 'guest lesson', 'peachy bum'])

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  isAdmin: boolean('is_admin').notNull().default(false),
  emailVerified: boolean('email_verified').notNull().default(false),
  dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('students_email_idx').on(table.email),
])

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_token_hash_idx').on(table.tokenHash),
])

export const lessons = pgTable('lessons', {
  id: text('id').primaryKey(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  type: lessonTypeEnum('type').notNull(),
  teacher: text('teacher'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  studentId: text('student_id').references(() => students.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('bookings_lesson_id_idx').on(table.lessonId),
  index('bookings_student_id_idx').on(table.studentId),
])

export const credits = pgTable('credits', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  bookingId: text('booking_id').references(() => bookings.id),
  type: creditTypeEnum('type').notNull(),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
  validTo: timestamp('valid_to', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
}, (table) => [
  index('credits_student_id_idx').on(table.studentId),
  index('credits_booking_id_idx').on(table.bookingId),
  index('credits_student_available_idx').on(table.studentId, table.bookingId, table.validTo),
])

export const health = pgTable('health', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  injury: text('injury'),
  pregnancy: boolean('pregnancy'),
  dueDate: timestamp('due_date', { withTimezone: true }),
}, (table) => [
  uniqueIndex('health_student_id_idx').on(table.studentId),
])

export const otpCodes = pgTable('otp_codes', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  userId: text('user_id').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => [
  index('otp_codes_email_idx').on(table.email),
])

export const userPrefs = pgTable('user_prefs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  prefs: jsonb('prefs').notNull().default({}),
}, (table) => [
  uniqueIndex('user_prefs_user_id_idx').on(table.userId),
])
