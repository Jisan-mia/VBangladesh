'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="container prose"><h1>কিছু একটা গড়বড় হয়ে গেছে</h1><p>নিচের বোতাম চেপে আবার চেষ্টা করো। তাও না হলে একটু পরে ফিরে এসো।</p><button className="button" onClick={reset}>আবার চেষ্টা করি</button></main>;
}
