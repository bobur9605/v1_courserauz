-- One optional YouTube video per lesson (store canonical 11-char id).

ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "youtubeVideoId" TEXT;
