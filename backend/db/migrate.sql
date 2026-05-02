-- Migration: Add priority and due_date columns to tasks table
-- This migration adds support for task priority and due date tracking

ALTER TABLE IF EXISTS tasks
ADD COLUMN IF NOT EXISTS priority VARCHAR(30) NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- If the table doesn't exist, this migration does nothing (init.sql will create it with the new columns)
