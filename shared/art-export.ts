const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

async function fontData(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) throw new Error('বাংলা ফন্ট আনা যায়নি। আবার চেষ্টা করুন।');
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function artworkSvgBlob(svg: SVGSVGElement): Promise<Blob> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const bounds = svg.viewBox.baseVal;
  if (!bounds.width || !bounds.height) throw new Error('ছবির মাপ পাওয়া যায়নি।');
  copy.setAttribute('xmlns', SVG_NAMESPACE);
  copy.setAttribute('width', String(bounds.width));
  copy.setAttribute('height', String(bounds.height));
  copy.removeAttribute('class');
  copy.removeAttribute('style');
  copy.querySelectorAll('[data-export-ignore]').forEach(element => element.remove());
  const [bangla, latin] = await Promise.all([fontData('/fonts/bangla.woff2'), fontData('/fonts/latin.woff2')]);
  const style = document.createElementNS(SVG_NAMESPACE, 'style');
  style.textContent = `@font-face{font-family:Bangla;src:url(data:font/woff2;base64,${bangla}) format('woff2');font-weight:100 900}@font-face{font-family:Bangla;src:url(data:font/woff2;base64,${latin}) format('woff2');font-weight:100 900;unicode-range:U+0000-00FF,U+2000-206F}text{font-family:Bangla,sans-serif}`;
  copy.prepend(style);
  return new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml;charset=utf-8' });
}

export async function svgPngBlob(svg: SVGSVGElement): Promise<Blob> {
  const source = URL.createObjectURL(await artworkSvgBlob(svg));
  try {
    const picture = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      // SVG decode() can resolve before its embedded fonts finish loading.
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('ছবি তৈরি করা যায়নি।'));
      image.src = source;
    });
    const canvas = document.createElement('canvas');
    const scale = Math.min(2, 2400 / Math.max(picture.width, picture.height));
    canvas.width = Math.round(picture.width * scale);
    canvas.height = Math.round(picture.height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('এই ব্রাউজারে ছবি তৈরি করা যাচ্ছে না।');
    context.drawImage(picture, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('ছবি তৈরি করা যায়নি।')), 'image/png'));
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function downloadArtwork(svg: SVGSVGElement, filename: string) {
  saveBlob(await svgPngBlob(svg), filename.endsWith('.png') ? filename : filename + '.png');
}
