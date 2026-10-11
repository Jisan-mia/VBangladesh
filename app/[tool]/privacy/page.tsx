import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getToolContent } from '../../../lib/tool-content';
import { PageFrame } from '../../../shared/site-shell';
import { pageMetadata } from '../../../shared/seo';

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const site = getToolContent((await params).tool);
  if (!site) notFound();
  return pageMetadata(site, { title: `গোপনীয়তা | ${site.name}`, description: `${site.name} ব্যবহার করলে তোমার লেখা, ছবি আর বাছাই কোথায় থাকে, কে দেখতে পায়, সহজ ভাষায় জেনে নাও।`, path: '/privacy' });
}

export default async function PrivacyPage({ params }: { params: Promise<{ tool: string }> }) {
  const site = getToolContent((await params).tool);
  if (!site) notFound();
  const path = `/${site.slug}`;
  return <PageFrame site={site}><article className="container prose">
    <Link className="back-link" href={path}>← {site.name}-এ ফিরে যাও</Link>
    <p className="eyebrow">গোপনীয়তা</p><h1>{site.name}: তোমার তথ্য কোথায় থাকে</h1>
    {site.privacy.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    <h2>সার্ভারে কী থাকে</h2><p>এই সাইটে বিজ্ঞাপন বা ট্র্যাকিং নেই। যে সার্ভারে সাইটটা চলে, সেটা সাধারণ সংযোগের তথ্য (যেমন কখন কোন পাতা খোলা হলো) রাখতে পারে। ওপরে যা লেখা আছে, তার বাইরে তোমার লেখা বা বাছাই আমাদের সার্ভারে যায় না।</p>
    <p>আরও দেখো: <Link href={`${path}/guide`}>কীভাবে করবে</Link> আর <Link href="/privacy">পুরো একটুখানির গোপনীয়তা</Link>।</p>
    <Link className="button" href={`${path}#tool`}>{site.cta}</Link>
  </article></PageFrame>;
}
