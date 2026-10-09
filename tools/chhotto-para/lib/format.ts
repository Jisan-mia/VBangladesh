export const sceneFormats = {
  post: { label: 'পোস্ট', ratio: '১:১', width: 1080, height: 1080, sceneY: 145, titleY: 86, settingY: 128, captionY: 1030 },
  story: { label: 'স্টোরি', ratio: '৯:১৬', width: 1080, height: 1920, sceneY: 510, titleY: 300, settingY: 362, captionY: 1545 },
} as const;

export type SceneFormat = keyof typeof sceneFormats;
export const sceneViewport = { width: 960, height: 760 } as const;

export function sceneFrame(format: SceneFormat) {
  const layout = sceneFormats[format];
  return { x: 0, y: layout.sceneY, width: layout.width, height: layout.width * sceneViewport.height / sceneViewport.width };
}
