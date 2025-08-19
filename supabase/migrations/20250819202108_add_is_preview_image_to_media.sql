alter table "public"."media" add column "is_preview_image" boolean not null default false;

CREATE UNIQUE INDEX idx_media_service_preview_unique ON public.media USING btree (service_id) WHERE ((is_preview_image = true) AND (service_id IS NOT NULL));


