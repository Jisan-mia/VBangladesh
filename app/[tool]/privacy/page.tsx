import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getToolContent } from '../../../lib/tool-content';
import { PageFrame } from '../../../shared/site-shell';
import { pageMetadata } from '../../../shared/seo';

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const site = getToolContent((await params).tool);
  if (!site) notFound();
  return pageMetadata(site, { title: `গোপনীয়তা | ${site.name}`, description: `${site.name} ব্যবহার করলে আপনার তথ্য কোথায় থাকে এবং কীভাবে ব্যবহার হয়, জেনে নিন।`, path: '/privacy' });
}

export default async function PrivacyPage({ params }: { params: Promise<{ tool: string }> }) {
  const site = getToolContent((await params).tool);
  if (!site) notFound();
  const path = `/${site.slug}`;
  return <PageFrame site={site}><article className="container prose">
    <Link className="back-link" href={path}>{site.name}-এ ফিরুন</Link>
    <p className="eyebrow">গোপনীয়তা</p><h1>{site.name}: আপনার তথ্য কোথায় থাকে</h1>
    {site.privacy.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    <h2>হোস্টিং সেবা কী তথ্য রাখতে পারে</h2><p>এই সাইটে বিজ্ঞাপন বা ব্যবহার অনুসরণ করার ব্যবস্থা নেই। হোস্টিং সেবা সাধারণ সংযোগের তথ্য রাখতে পারে। ফর্মে আপনার লেখা সেই তথ্যের সঙ্গে পাঠানো হয় না।</p>
    <p><Link href={`${path}/guide`}>ব্যবহারের নিয়ম</Link> ও <Link href="/privacy">একটুখানির গোপনীয়তা নীতি</Link> পড়ুন।</p>
    <Link className="button" href={`${path}#tool`}>{site.cta}</Link>
  </article></PageFrame>;
}
