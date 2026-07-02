CREATE TABLE IF NOT EXISTS "migrations"(
  "id" integer primary key autoincrement not null,
  "migration" varchar not null,
  "batch" integer not null
);
CREATE TABLE IF NOT EXISTS "users"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "email" varchar not null,
  "email_verified_at" datetime,
  "password" varchar not null,
  "remember_token" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "two_factor_secret" text,
  "two_factor_recovery_codes" text,
  "two_factor_confirmed_at" datetime,
  "phone" varchar
);
CREATE UNIQUE INDEX "users_email_unique" on "users"("email");
CREATE TABLE IF NOT EXISTS "password_reset_tokens"(
  "email" varchar not null,
  "token" varchar not null,
  "created_at" datetime,
  primary key("email")
);
CREATE TABLE IF NOT EXISTS "sessions"(
  "id" varchar not null,
  "user_id" integer,
  "ip_address" varchar,
  "user_agent" text,
  "payload" text not null,
  "last_activity" integer not null,
  primary key("id")
);
CREATE INDEX "sessions_user_id_index" on "sessions"("user_id");
CREATE INDEX "sessions_last_activity_index" on "sessions"("last_activity");
CREATE TABLE IF NOT EXISTS "cache"(
  "key" varchar not null,
  "value" text not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE INDEX "cache_expiration_index" on "cache"("expiration");
CREATE TABLE IF NOT EXISTS "cache_locks"(
  "key" varchar not null,
  "owner" varchar not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE INDEX "cache_locks_expiration_index" on "cache_locks"("expiration");
CREATE TABLE IF NOT EXISTS "jobs"(
  "id" integer primary key autoincrement not null,
  "queue" varchar not null,
  "payload" text not null,
  "attempts" integer not null,
  "reserved_at" integer,
  "available_at" integer not null,
  "created_at" integer not null
);
CREATE INDEX "jobs_queue_index" on "jobs"("queue");
CREATE TABLE IF NOT EXISTS "job_batches"(
  "id" varchar not null,
  "name" varchar not null,
  "total_jobs" integer not null,
  "pending_jobs" integer not null,
  "failed_jobs" integer not null,
  "failed_job_ids" text not null,
  "options" text,
  "cancelled_at" integer,
  "created_at" integer not null,
  "finished_at" integer,
  primary key("id")
);
CREATE TABLE IF NOT EXISTS "failed_jobs"(
  "id" integer primary key autoincrement not null,
  "uuid" varchar not null,
  "connection" varchar not null,
  "queue" varchar not null,
  "payload" text not null,
  "exception" text not null,
  "failed_at" datetime not null default CURRENT_TIMESTAMP
);
CREATE INDEX "failed_jobs_connection_queue_failed_at_index" on "failed_jobs"(
  "connection",
  "queue",
  "failed_at"
);
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" on "failed_jobs"("uuid");
CREATE TABLE IF NOT EXISTS "passkeys"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "name" varchar not null,
  "credential_id" varchar not null,
  "credential" text not null,
  "last_used_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE INDEX "passkeys_user_id_index" on "passkeys"("user_id");
CREATE UNIQUE INDEX "passkeys_credential_id_unique" on "passkeys"(
  "credential_id"
);
CREATE TABLE IF NOT EXISTS "media"(
  "id" integer primary key autoincrement not null,
  "model_type" varchar not null,
  "model_id" integer not null,
  "uuid" varchar,
  "collection_name" varchar not null,
  "name" varchar not null,
  "file_name" varchar not null,
  "mime_type" varchar,
  "disk" varchar not null,
  "conversions_disk" varchar,
  "size" integer not null,
  "manipulations" text not null,
  "custom_properties" text not null,
  "generated_conversions" text not null,
  "responsive_images" text not null,
  "order_column" integer,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "media_model_type_model_id_index" on "media"(
  "model_type",
  "model_id"
);
CREATE UNIQUE INDEX "media_uuid_unique" on "media"("uuid");
CREATE INDEX "media_order_column_index" on "media"("order_column");
CREATE TABLE IF NOT EXISTS "media_items"(
  "id" integer primary key autoincrement not null,
  "user_id" integer,
  "name" varchar not null,
  "description" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete set null
);
CREATE TABLE IF NOT EXISTS "agent_conversations"(
  "id" varchar not null,
  "user_id" integer,
  "title" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  primary key("id")
);
CREATE INDEX "agent_conversations_user_id_updated_at_index" on "agent_conversations"(
  "user_id",
  "updated_at"
);
CREATE TABLE IF NOT EXISTS "agent_conversation_messages"(
  "id" varchar not null,
  "conversation_id" varchar not null,
  "user_id" integer,
  "agent" varchar not null,
  "role" varchar not null,
  "content" text not null,
  "attachments" text not null,
  "tool_calls" text not null,
  "tool_results" text not null,
  "usage" text not null,
  "meta" text not null,
  "created_at" datetime,
  "updated_at" datetime,
  primary key("id")
);
CREATE INDEX "conversation_index" on "agent_conversation_messages"(
  "conversation_id",
  "user_id",
  "updated_at"
);
CREATE INDEX "agent_conversation_messages_user_id_index" on "agent_conversation_messages"(
  "user_id"
);
CREATE INDEX "agent_conversation_messages_conversation_id_index" on "agent_conversation_messages"(
  "conversation_id"
);
CREATE TABLE IF NOT EXISTS "permissions"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "guard_name" varchar not null,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "permissions_name_guard_name_unique" on "permissions"(
  "name",
  "guard_name"
);
CREATE TABLE IF NOT EXISTS "roles"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "guard_name" varchar not null,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "roles_name_guard_name_unique" on "roles"(
  "name",
  "guard_name"
);
CREATE TABLE IF NOT EXISTS "model_has_permissions"(
  "permission_id" integer not null,
  "model_type" varchar not null,
  "model_id" integer not null,
  foreign key("permission_id") references "permissions"("id") on delete cascade,
  primary key("permission_id", "model_id", "model_type")
);
CREATE INDEX "model_has_permissions_model_id_model_type_index" on "model_has_permissions"(
  "model_id",
  "model_type"
);
CREATE TABLE IF NOT EXISTS "model_has_roles"(
  "role_id" integer not null,
  "model_type" varchar not null,
  "model_id" integer not null,
  foreign key("role_id") references "roles"("id") on delete cascade,
  primary key("role_id", "model_id", "model_type")
);
CREATE INDEX "model_has_roles_model_id_model_type_index" on "model_has_roles"(
  "model_id",
  "model_type"
);
CREATE TABLE IF NOT EXISTS "role_has_permissions"(
  "permission_id" integer not null,
  "role_id" integer not null,
  foreign key("permission_id") references "permissions"("id") on delete cascade,
  foreign key("role_id") references "roles"("id") on delete cascade,
  primary key("permission_id", "role_id")
);
CREATE TABLE IF NOT EXISTS "chat_messages"(
  "id" integer primary key autoincrement not null,
  "conversation_id" integer not null,
  "sender_type" varchar check("sender_type" in('visitor', 'admin')) not null default 'visitor',
  "sender_id" integer,
  "body" text not null,
  "read_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("conversation_id") references "conversations"("id") on delete cascade,
  foreign key("sender_id") references "users"("id") on delete set null
);
CREATE INDEX "chat_messages_conversation_id_created_at_index" on "chat_messages"(
  "conversation_id",
  "created_at"
);
CREATE TABLE IF NOT EXISTS "conversations"(
  "id" integer primary key autoincrement not null,
  "uuid" varchar not null,
  "visitor_name" varchar,
  "visitor_email" varchar,
  "status" varchar check("status" in('open', 'closed', 'archived')) not null default 'open',
  "last_message_at" datetime,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "conversations_status_index" on "conversations"("status");
CREATE INDEX "conversations_last_message_at_index" on "conversations"(
  "last_message_at"
);
CREATE UNIQUE INDEX "conversations_uuid_unique" on "conversations"("uuid");
CREATE TABLE IF NOT EXISTS "chat_settings"(
  "id" integer primary key autoincrement not null,
  "chat_enabled" tinyint(1) not null default '1',
  "position" varchar not null default 'bottom-right',
  "primary_color" varchar not null default '#6366f1',
  "welcome_message" varchar not null default 'Hola 👋 ¿en qué podemos ayudarte?',
  "offline_message" varchar not null default 'Estamos fuera de horario, te responderemos pronto.',
  "business_start" time not null default '09:00:00',
  "business_end" time not null default '18:00:00',
  "business_days" text,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "users_phone_unique" on "users"("phone");

INSERT INTO migrations VALUES(1,'0001_01_01_000000_create_users_table',1);
INSERT INTO migrations VALUES(2,'0001_01_01_000001_create_cache_table',1);
INSERT INTO migrations VALUES(3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO migrations VALUES(4,'2024_01_01_000000_create_passkeys_table',1);
INSERT INTO migrations VALUES(5,'2025_08_14_170933_add_two_factor_columns_to_users_table',1);
INSERT INTO migrations VALUES(6,'2026_06_17_012943_create_media_table',2);
INSERT INTO migrations VALUES(7,'2026_06_17_013229_create_media_items_table',2);
INSERT INTO migrations VALUES(8,'2026_06_17_014256_create_agent_conversations_table',3);
INSERT INTO migrations VALUES(9,'2026_06_17_023216_create_permission_tables',4);
INSERT INTO migrations VALUES(10,'2026_06_17_024725_create_chat_messages_table',5);
INSERT INTO migrations VALUES(11,'2026_06_17_024725_create_conversations_table',5);
INSERT INTO migrations VALUES(12,'2026_06_17_030505_create_chat_settings_table',6);
INSERT INTO migrations VALUES(13,'2026_06_17_031315_add_phone_to_users_table',7);
INSERT INTO migrations VALUES(14,'2026_06_17_031851_add_avatar_path_to_users_table',8);
