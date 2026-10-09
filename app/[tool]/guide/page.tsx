import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getToolContent } from '../../../lib/tool-content';
import { PageFrame } from '../../../shared/site-shell';
import { pageMetadata } from '../../../shared/seo';

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const site = getToolContent((await params).tool);
  if (!site) notFound();
  return pageMetadata(site, { title: `${site.guideTitle} | ${site.name}`, description: site.guideIntro, path: '/guide' });
}

export default async function GuidePage({ params }: { params: Promise<{ tool: string }> }) {
  const site = getToolContent((await params).tool);
  if (!site) notFound();
  const path = `/${site.slug}`;
  return <PageFrame site={site}><article className="container prose">
    <Link className="back-link" href={path}>{site.name}-এ ফিরুন</Link>
    <p className="eyebrow">ব্যবহারের নিয়ম</p><h1>{site.guideTitle}</h1><p>{site.guideIntro}</p>
    <ol>{site.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <p>আপনার তথ্য কোথায় থাকে, জানতে <Link href={`${path}/privacy`}>গোপনীয়তার পাতা</Link> পড়ুন। কোনো প্রশ্ন থাকলে <Link href={`${path}#questions`}>প্রশ্নোত্তর</Link> দেখুন।</p>
    <Link className="button" href={`${path}#tool`}>{site.cta}<span aria-hidden="true">←</span></Link>
  </article></PageFrame>;
}
