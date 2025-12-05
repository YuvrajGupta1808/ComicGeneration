-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT,
    "tone" TEXT,
    "story_context" TEXT,
    "page_count" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 832,
    "height" INTEGER NOT NULL DEFAULT 1248,
    "context_images" TEXT NOT NULL DEFAULT '[]',
    "image_url" TEXT,
    "leonardo_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "characters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "panels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "panel_id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "panel_number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "camera_angle" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 832,
    "height" INTEGER NOT NULL DEFAULT 1248,
    "context_images" TEXT NOT NULL DEFAULT '[]',
    "image_url" TEXT,
    "text_image_url" TEXT,
    "leonardo_id" TEXT,
    "title" TEXT,
    "narration" TEXT,
    "sound_effects" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "panels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dialogue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "panel_id" TEXT NOT NULL,
    "speaker_id" TEXT,
    "text" TEXT NOT NULL,
    "bubble_type" TEXT NOT NULL DEFAULT 'speech',
    "position" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dialogue_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "panels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "layouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "page_count" INTEGER NOT NULL,
    "panels_per_page" TEXT NOT NULL,
    "layout_data" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "generations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "leonardo_generation_id" TEXT,
    "prompt" TEXT NOT NULL,
    "seed" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "context_images" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "cloudinary_url" TEXT,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "execution_time_ms" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "generations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tool_name" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "params" TEXT,
    "result" TEXT,
    "error_message" TEXT,
    "execution_time_ms" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "usage_tracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "cost_usd" REAL,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");

-- CreateIndex
CREATE INDEX "characters_project_id_idx" ON "characters"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "characters_project_id_character_id_key" ON "characters"("project_id", "character_id");

-- CreateIndex
CREATE INDEX "panels_project_id_idx" ON "panels"("project_id");

-- CreateIndex
CREATE INDEX "panels_project_id_page_number_idx" ON "panels"("project_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "panels_project_id_panel_id_key" ON "panels"("project_id", "panel_id");

-- CreateIndex
CREATE INDEX "dialogue_panel_id_idx" ON "dialogue"("panel_id");

-- CreateIndex
CREATE UNIQUE INDEX "layouts_name_key" ON "layouts"("name");

-- CreateIndex
CREATE INDEX "layouts_page_count_idx" ON "layouts"("page_count");

-- CreateIndex
CREATE INDEX "generations_project_id_idx" ON "generations"("project_id");

-- CreateIndex
CREATE INDEX "generations_status_idx" ON "generations"("status");

-- CreateIndex
CREATE INDEX "generations_target_type_target_id_idx" ON "generations"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "generations_created_at_idx" ON "generations"("created_at");

-- CreateIndex
CREATE INDEX "agent_memory_tool_name_idx" ON "agent_memory"("tool_name");

-- CreateIndex
CREATE INDEX "agent_memory_operation_type_idx" ON "agent_memory"("operation_type");

-- CreateIndex
CREATE INDEX "agent_memory_created_at_idx" ON "agent_memory"("created_at");

-- CreateIndex
CREATE INDEX "usage_tracking_user_id_idx" ON "usage_tracking"("user_id");

-- CreateIndex
CREATE INDEX "usage_tracking_resource_type_idx" ON "usage_tracking"("resource_type");

-- CreateIndex
CREATE INDEX "usage_tracking_created_at_idx" ON "usage_tracking"("created_at");
