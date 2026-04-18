import { pgTable, text, timestamp, boolean, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const creditTypeEnum = pgEnum('credit_type', ['credit_1', 'credit_5', 'credit_10', 'credit_20'])
export const lessonTypeEnum = pgEnum('lesson_type', ['hatha yoga', 'guest lesson', 'peachy bum'])
export const bookingSourceEnum = pgEnum('booking_source', ['regular', 'classpass'])

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  passwordHash: text('password_hash'),
  isAdmin: boolean('is_admin').notNull().default(false),
  emailVerified: boolean('email_verified').notNull().default(false),
  dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
  phone: text('phone'),
  archived: boolean('archived').notNull().default(false),
  reminders: boolean('reminders').notNull().default(true),
  pushNotifications: boolean('push_notifications').notNull().default(false),
  phoneRequested: boolean('phone_requested').notNull().default(false),
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
}, (table) => [
  index('lessons_date_idx').on(table.date),
])

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  studentId: text('student_id').references(() => students.id, { onDelete: 'set null' }),
  source: bookingSourceEnum('source').notNull().default('regular'),
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
  // Covers credit history queries: WHERE studentId = ? ORDER BY createdAt DESC LIMIT 500
  index('credits_student_created_idx').on(table.studentId, table.createdAt),
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

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('push_subscriptions_student_id_idx').on(table.studentId),
  uniqueIndex('push_subscriptions_endpoint_idx').on(table.endpoint),
])

export const loginHistory = pgTable('login_history', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('login_history_student_id_idx').on(table.studentId),
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

