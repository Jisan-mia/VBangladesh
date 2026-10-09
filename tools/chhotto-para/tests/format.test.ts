import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneFormats, sceneFrame, sceneViewport, type SceneFormat } from '../lib/format';

test('post and story exports have exact requested aspect ratios', () => {
  assert.equal(sceneFormats.post.width, sceneFormats.post.height);
  assert.equal(sceneFormats.story.width * 16, sceneFormats.story.height * 9);
});

test('both formats preserve the complete scene aspect ratio between the heading and caption', () => {
  for (const format of Object.keys(sceneFormats) as SceneFormat[]) {
    const layout = sceneFormats[format];
    const frame = sceneFrame(format);
    assert.equal(frame.width / frame.height, sceneViewport.width / sceneViewport.height);
    assert.ok(frame.x >= 0 && frame.x + frame.width <= layout.width);
    assert.ok(frame.y > layout.settingY);
    assert.ok(frame.y + frame.height <= layout.captionY);
    assert.ok(layout.captionY + 20 < layout.height);
  }
});
