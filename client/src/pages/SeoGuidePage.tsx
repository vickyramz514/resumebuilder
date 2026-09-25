import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { ApiError } from '../services/api';
import { getSeoPage, parseSeoBody, type SeoPageRecord } from '../services/seoApi';
import { seoGuideLabel } from '../content/seoGuides';
import SeoHead from '../components/SeoHead';
import '../seo-guide.css';

const SITE = 'https://resume.datacaptain.in';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function SeoGuidePage() {
  const { slug = '' } = useParams();
  const validSlug = SLUG_PATTERN.test(slug);
  const [page, setPage] = useState<SeoPageRecord | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    if (!validSlug) {
      setPage(null);
      setStatus('missing');
      return;
    }
    let cancelled = false;
    setPage(null);
    setStatus('loading');
    getSeoPage(slug)
      .then((result) => {
        if (cancelled) return;
        setPage(result.page);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPage(null);
        setStatus(error instanceof ApiError && error.status === 404 ? 'missing' : 'error');
      });
    return () => { cancelled = true; };
  }, [slug, validSlug]);

  const body = useMemo(() => page ? parseSeoBody(page.content) : null, [page]);
  const canonical = page?.canonicalUrl || `${SITE}/resume-builder/${slug}`;
  const jsonLd = useMemo(() => {
    if (!page) return undefined;
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.h1,
      description: page.metaDescription,
      keywords: page.keywords.join(', '),
      mainEntityOfPage: canonical,
      author: { '@type': 'Organization', name: 'ResumeForge', url: SITE }
    });
  }, [page, canonical]);

  if (status === 'loading') {
    return (
      <Box className="seo-guide">
        <Container maxWidth="md" className="seo-guide-wrap">
          <Link to="/" className="seo-brand">ResumeForge</Link>
          <Typography>Loading guide…</Typography>
        </Container>
      </Box>
    );
  }

  if (status === 'missing') {
    return (
      <Box className="seo-guide">
        <SeoHead title="Guide not found — ResumeForge" description="This resume guide is not published." canonical={`${SITE}/`} noindex />
        <Container maxWidth="md" className="seo-guide-wrap">
          <Link to="/" className="seo-brand">ResumeForge</Link>
          <Typography variant="h1">This guide does not exist</Typography>
          <Typography>That address is not a published guide. Open the homepage to start a resume or pick another topic.</Typography>
          <Button variant="contained" component={Link} to="/" sx={{ mt: 2 }}>Back to ResumeForge</Button>
        </Container>
      </Box>
    );
  }

  if (status === 'error' || !page || !body) {
    return (
      <Box className="seo-guide">
        <SeoHead title="Guide unavailable — ResumeForge" description="This resume guide could not be loaded." canonical={`${SITE}/`} noindex />
        <Container maxWidth="md" className="seo-guide-wrap">
          <Link to="/" className="seo-brand">ResumeForge</Link>
          <Typography variant="h1">This guide could not be loaded</Typography>
          <Typography>Check the connection and try the page again.</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box className="seo-guide">
      <SeoHead title={page.title} description={page.metaDescription} canonical={canonical} jsonLd={jsonLd} />
      <Container maxWidth="md" className="seo-guide-wrap">
        <Link to="/" className="seo-brand">ResumeForge</Link>
        <Typography variant="h1">{page.h1}</Typography>
        <Typography className="seo-intro">{body.intro}</Typography>
        {body.sections.map((section) => (
          <Box component="section" key={section.heading}>
            <Typography variant="h2">{section.heading}</Typography>
            {section.paragraphs.map((paragraph) => <Typography key={paragraph}>{paragraph}</Typography>)}
            {section.bullets?.length ? (
              <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : null}
          </Box>
        ))}
        {body.related.length ? (
          <nav className="seo-related">
            <Typography variant="h2">Related guides</Typography>
            {body.related.map((related) => (
              <Link key={related} to={`/resume-builder/${related}`}>{seoGuideLabel(related)}</Link>
            ))}
          </nav>
        ) : null}
        <Button variant="contained" component={Link} to="/register" sx={{ mt: 3 }}>Start a resume</Button>
      </Container>
    </Box>
  );
}
