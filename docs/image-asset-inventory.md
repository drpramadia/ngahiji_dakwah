# NGAHIJI Image Asset Inventory

Date: 2026-09-11
Scope: repository image references only. `.env.local` was not read.

The public UI/design is locked. This inventory only tracks image content and data/CMS mapping.

## Existing Images Found

| Current Asset | Location | Component | Section | Aspect Ratio / Container | Replacement |
| --- | --- | --- | --- | --- | --- |
| `/NGAHIJI_LOGO.png` | `public/` | Header/footer/admin logo | Brand | contain inside fixed logo box | Keep existing official logo |
| Unsplash avatar 1 | `src/components/NgahijiApp.tsx` | `NgahijiApp` | Hero social proof | 1:1 avatar | `public/assets/ngahiji/community/community-youth-circle.svg` |
| Unsplash avatar 2 | `src/components/NgahijiApp.tsx` | `NgahijiApp` | Hero social proof | 1:1 avatar | `public/assets/ngahiji/community/community-family-circle.svg` |
| Unsplash avatar 3 | `src/components/NgahijiApp.tsx` | `NgahijiApp` | Hero social proof | 1:1 avatar | `public/assets/ngahiji/community/community-volunteer-circle.svg` |
| Unsplash hero main | `src/components/NgahijiApp.tsx` | `NgahijiApp` | Hero main editorial image | portrait crop in rotated card | `public/assets/ngahiji/hero/hero-kajian.svg` |
| Unsplash hero secondary | `src/components/NgahijiApp.tsx` | `NgahijiApp` | Hero secondary card | landscape/square crop in rotated card | `public/assets/ngahiji/hero/hero-community.svg` |
| Event image: Youth Day | `src/data/demo/catalog.ts`, Supabase `events.image_url` | Event cards/detail | Featured Events | card cover, detail hero cover | `public/assets/ngahiji/events/event-youth-kajian.svg` |
| Event image: Family Gathering | `src/data/demo/catalog.ts`, Supabase `events.image_url` | Event cards/detail | Featured Events | card cover, detail hero cover | `public/assets/ngahiji/events/event-family-learning.svg` |
| Event image: Entrepreneur Forum | `src/data/demo/catalog.ts`, Supabase `events.image_url` | Event cards/detail | Featured Events | card cover, detail hero cover | `public/assets/ngahiji/events/event-entrepreneur-forum.svg` |
| Unsplash live stage | `src/components/NgahijiApp.tsx` | `NgahijiApp` | NGAHIJI Live player/modal | 16:9-ish cover | `public/assets/ngahiji/live/live-kajian-stage.svg` |
| Story image: youth growth | `src/data/demo/catalog.ts`, Supabase `media_items.image_url` | Media cards/detail | Stories | card cover, detail hero cover | `public/assets/ngahiji/media/story-quran-study.svg` |
| Story image: movement/community | `src/data/demo/catalog.ts`, Supabase `media_items.image_url` | Media cards/detail | Stories | card cover, detail hero cover | `public/assets/ngahiji/media/story-community-discussion.svg` |
| Story image: calm/lifestyle | `src/data/demo/catalog.ts`, Supabase `media_items.image_url` | Media cards/detail | Stories | card cover, detail hero cover | `public/assets/ngahiji/media/story-family-learning.svg` |
| Story image: small impact | `src/data/demo/catalog.ts`, Supabase `media_items.image_url` | Media cards/detail | Stories | card cover, detail hero cover | `public/assets/ngahiji/media/story-volunteer-impact.svg` |
| Moment image 1 | `src/components/NgahijiApp.tsx` | `NgahijiApp` | Moments | card cover | `public/assets/ngahiji/community/community-youth-circle.svg` |
| Moment image 2 | `src/components/NgahijiApp.tsx` | `NgahijiApp` | Moments | card cover | `public/assets/ngahiji/community/community-family-circle.svg` |
| Moment image 3 | `src/components/NgahijiApp.tsx` | `NgahijiApp` | Moments | card cover | `public/assets/ngahiji/community/community-volunteer-circle.svg` |

## CMS Mapping Target

| CMS Surface | Current Data Field | Target Asset |
| --- | --- | --- |
| Homepage Hero Main | component-level hardcoded image | `hero-kajian` |
| Homepage Hero Secondary | component-level hardcoded image | `hero-community` |
| Featured Event: Youth Day | `events.image_url` | `event-youth-kajian` |
| Featured Event: Family Gathering | `events.image_url` | `event-family-learning` |
| Featured Event: Entrepreneur Forum | `events.image_url` | `event-entrepreneur-forum` |
| NGAHIJI Live | component-level hardcoded image | `live-kajian-stage` |
| Stories | `media_items.image_url` | `story-*` assets |
| Community/Moments | component-level hardcoded image | `community-*` assets |

## Notes

- The previous images were generic lifestyle/concert/dinner/editorial references.
- Replacement assets must remain individually addressable. No composite asset is used as the source for multiple sections.
- Current implementation uses local public assets first, while keeping `media_assets` and `resolveMedia()` ready for Supabase Storage-backed CMS media.
- Some hero/live/moment images still originate from component-level content; this task will move those references into a typed asset manifest consumed by the UI.
