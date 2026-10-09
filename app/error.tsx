'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="container prose"><h1>পাতাটি দেখানো যাচ্ছে না</h1><p>নিচের বোতাম চেপে আবার চেষ্টা করুন। কাজ না হলে কিছুক্ষণ পর ফিরে আসুন।</p><button className="button" onClick={reset}>আবার চেষ্টা করুন</button></main>;
}
