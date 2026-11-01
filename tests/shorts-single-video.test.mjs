import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, FPS } from '../worker/planner.mjs';
import { shortsSchema } from '../lib/automation/config.ts';
import { tiktokDownloadOptions } from '../worker/tiktok-download.mjs';

for (const duration of [61, 180, 245]) {
  test(`${duration}s source stays complete in one video, including intro and outro`, () => {
    // Saved settings and older clients may still send autoSplit:true.
    const settings = shortsSchema.parse({ autoSplit: true, maxDuration: 60 });
    assert.equal(settings.autoSplit, false);
    const plan = buildPlan([{ title: '긴 영상', blocks: [{ type: 'video', id: 'v' }],
      media: [{ id: 'v', type: 'video/mp4', src: 'video.mp4', duration, hasAudio: true }], comments: [] }], settings);
    assert.equal(plan.partCount, 1);
    assert.equal(plan.requiresSplit, false);
    assert.equal(plan.durationFrames, plan.fullDurationFrames);
    const original = plan.scenes.find(scene => scene.type === 'video_play' && !scene.payload.teaser);
    assert.equal(original.frames, duration * FPS);
    assert.equal(original.payload.startFrame, 0);
    assert.equal(plan.scenes.at(-1).type, 'outro');
    assert.equal(plan.scenes.at(-1).from + plan.scenes.at(-1).frames, plan.durationFrames);
  });
}

test('long text is not accelerated to fit the former 60 second limit', () => {
  const posts = [{ title: '긴 글', blocks: [{ type: 'text', text: '가'.repeat(2500) }], media: [], comments: [] }];
  const short = buildPlan(posts, shortsSchema.parse({ maxDuration: 60 }));
  const long = buildPlan(posts, shortsSchema.parse({ maxDuration: 180 }));
  assert.equal(short.durationFrames, long.durationFrames);
  assert.equal(short.partCount, 1);
});

test('TikTok acquisition accepts videos over 180 seconds while retaining other guards', () => {
  const args = tiktokDownloadOptions('https://www.tiktok.com/@creator/video/123', 'out.mp4');
  assert.equal(args[args.indexOf('--match-filter') + 1], '!is_live');
  assert.equal(args[args.indexOf('--max-filesize') + 1], '100M');
  assert(args.includes('--no-playlist'));
});
