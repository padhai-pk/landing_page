import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Download,
  Share2,
  Gift,
  ShieldCheck,
  PartyPopper,
  Sun,
  Moon,
  Loader2,
  Upload,
  Sparkles,
  Lock,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { drawShareCard, renderShareCardBlob } from '../lib/shareCard.js';
import {
  buildShareCaption,
  loadShareCaptions,
  openPlatformShare,
  tryNativeShare,
  isMobile,
} from '../lib/socialShare.js';
import { DEFAULT_SHARE_CAPTIONS } from '../lib/defaultShareCaptions.js';
import { useContent } from '../lib/content.jsx';
import { getFromBackend } from '../lib/backend.js';
import { submitShareScreenshot } from '../lib/waitlist.js';
import './SharePage.css';

const PLATFORMS = [
  { id: 'facebook', prefix: 'Post on', name: 'Facebook' },
  { id: 'instagram', prefix: 'Share story on', name: 'Instagram' },
  { id: 'linkedin', prefix: 'Post on', name: 'LinkedIn' },
];

function scrollToTop() {
  window.scrollTo(0, 0);
}

export default function SharePage() {
  const { state: routeState } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const content = useContent();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const screenshotInputRef = useRef(null);
  const avatarBoxRef = useRef(null);
  const [busyPlatform, setBusyPlatform] = useState('');
  const [note, setNote] = useState('');
  const [avatarImg, setAvatarImg] = useState(null);
  const [cardTheme, setCardTheme] = useState('dark');
  const [captionsConfig, setCaptionsConfig] = useState(null);
  const [remoteState, setRemoteState] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const [uploadNote, setUploadNote] = useState('');
  const [uploadNoteKind, setUploadNoteKind] = useState('');

  const state = routeState || remoteState;
  const shareCredentials = {
    collection: state?.collection || searchParams.get('collection') || '',
    id: state?.id || searchParams.get('id') || '',
    shareToken: state?.shareToken || searchParams.get('token') || '',
  };
  const sharePageCopy = captionsConfig?.sharePage || DEFAULT_SHARE_CAPTIONS.sharePage;
  const isTeacherRole = state?.role === 'teacher' || state?.role === 'badge';

  useEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    loadShareCaptions().then(setCaptionsConfig);
  }, []);

  useEffect(() => {
    if (state) scrollToTop();
  }, [state]);

  useEffect(() => {
    if (routeState) {
      setRemoteState(null);
      setLoadError('');
      return;
    }

    const collection = searchParams.get('collection');
    const id = searchParams.get('id');
    const token = searchParams.get('token');
    if (!collection || !id || !token) return;

    let cancelled = false;
    setLoadingCard(true);
    setLoadError('');

    const query = new URLSearchParams({ collection, id, token });
    getFromBackend(`/share-card?${query.toString()}`)
      .then((data) => {
        if (!cancelled) setRemoteState(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err?.message
            || 'We could not load your share card. Please try again later.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCard(false);
      });

    return () => { cancelled = true; };
  }, [routeState, searchParams]);

  const badgeSubjects = state?.badgeSubjects
    || (state?.subjectResults || []).filter((r) => r.status === 'seat_reserved').map((r) => r.subjectName);

  const cardArgs = state ? {
    name: state.name,
    role: state.role,
    waitlistId: state.id || '',
    subjects: state.subjects || [],
    badgeSubjects,
    avatarImage: avatarImg,
    cardTheme,
  } : null;

  useEffect(() => {
    if (!cardArgs) return;
    let cancelled = false;
    async function draw() {
      const result = await drawShareCard(canvasRef.current, { ...cardArgs, interactive: true });
      if (!cancelled) avatarBoxRef.current = result?.avatarBox || null;
      await document.fonts?.ready;
      if (cancelled) return;
      const result2 = await drawShareCard(canvasRef.current, { ...cardArgs, interactive: true });
      if (!cancelled) avatarBoxRef.current = result2?.avatarBox || null;
    }
    draw();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, avatarImg, cardTheme]);

  async function buildCaption(config) {
    return buildShareCaption({
      role: state.role,
      name: state.name,
      subjects: state.subjects || badgeSubjects,
      waitlistId: state.id,
    }, config);
  }

  if (loadingCard) {
    return (
      <>
        <Navbar />
        <main className="sharepage">
          <div className="container sharepage__empty">
            <Loader2 size={28} className="waitlist__spinner" aria-hidden />
            <h1>Loading your card…</h1>
            <p>Please wait a moment.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!state) {
    return (
      <>
        <Navbar />
        <main className="sharepage">
          <div className="container sharepage__empty">
            <h1>{loadError ? 'Could not load your card' : 'Nothing to show here yet'}</h1>
            <p>{loadError || 'Join the waitlist first to get your shareable card.'}</p>
            <Link to="/#waitlist" className="btn btn-primary btn-lg">Go to the waitlist</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  function handleAvatarPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNote("That doesn't look like an image — try a JPG or PNG.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setNote('Please choose a photo under 8MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setAvatarImg(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function handleCanvasClick(e) {
    const canvas = canvasRef.current;
    const box = avatarBoxRef.current;
    if (!canvas || !box) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    const dist = Math.hypot(x - box.cx, y - box.cy);
    if (dist <= box.r) fileInputRef.current?.click();
  }

  async function handleDownload() {
    const blob = await renderShareCardBlob(cardArgs);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'padhai-pk-card.png';
    a.click();
    URL.revokeObjectURL(url);
    setNote('Card downloaded to your device.');
  }

  async function handlePlatformShare(platform) {
    setBusyPlatform(platform);
    setNote('');

    const popup = !isMobile() ? window.open('about:blank', '_blank') : null;

    try {
      const config = captionsConfig || (await loadShareCaptions());
      const blob = await renderShareCardBlob(cardArgs);
      const caption = await buildCaption(config);

      const sharedNative = await tryNativeShare(blob, caption, config);
      if (sharedNative) {
        popup?.close();
        setNote(config.shareMessages?.nativeSuccess || 'Share sheet opened with your card and caption.');
        return;
      }

      const result = await openPlatformShare(platform, {
        blob,
        caption,
        social: content.social,
        config,
        popup,
      });
      setNote(result.message);
    } catch {
      popup?.close();
      setNote('Could not open the app. Try downloading the card and sharing manually.');
    } finally {
      setBusyPlatform('');
    }
  }

  async function handleScreenshotUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const { collection, id, shareToken } = shareCredentials;
    if (!shareToken || !collection || !id) {
      setUploadNoteKind('error');
      setUploadNote('Could not verify your waitlist entry. Open your share card from the email link and try again.');
      return;
    }

    setUploadingScreenshot(true);
    setUploadNote('');
    setUploadNoteKind('');

    try {
      const result = await submitShareScreenshot({
        collectionName: collection,
        id,
        shareToken,
        file,
      });

      setScreenshotUploaded(true);
      setUploadNoteKind('success');
      setUploadNote(result?.message || sharePageCopy.uploadSuccess);
    } catch (err) {
      setUploadNoteKind('error');
      setUploadNote(err?.message || 'Could not upload your screenshot. Please try again.');
    } finally {
      setUploadingScreenshot(false);
    }
  }

  function platformPrefix(platformId) {
    const fromCopy = sharePageCopy.platforms?.[platformId]
      || DEFAULT_SHARE_CAPTIONS.sharePage.platforms[platformId];
    const match = PLATFORMS.find((p) => p.id === platformId);
    if (!fromCopy || !match) return { prefix: match?.prefix || '', name: match?.name || platformId };
    const name = match.name;
    const prefix = fromCopy.replace(name, '').trim();
    return { prefix: prefix || match.prefix, name };
  }

  return (
    <>
      <Navbar />
      <main className="sharepage">
        <div className="container sharepage__inner">
          <div className="sharepage__head">
            <h1><PartyPopper size={22} className="sharepage__head-icon" /> You're on the list!</h1>
            <p>Share your card and mention @padhai.pk — our team will manually verify your post and apply the free 1-month Profile Boost.</p>
          </div>

          {state.role === 'badge' && state.subjectResults && (
            <div className="sharepage__badge-results">
              {state.subjectResults.filter((r) => r.status === 'seat_reserved').length > 0 && (
                <p><strong>Seats reserved:</strong> {state.subjectResults.filter((r) => r.status === 'seat_reserved').map((r) => r.subjectName).join(', ')}</p>
              )}
              {state.subjectResults.filter((r) => r.status === 'subject_full').length > 0 && (
                <p><strong>Already full (added to general waitlist):</strong> {state.subjectResults.filter((r) => r.status === 'subject_full').map((r) => r.subjectName).join(', ')}</p>
              )}
            </div>
          )}
        </div>

        <div className="sharepage__card-stage">
          <div className="sharepage__card-wrap">
            <div className="sharepage__card-theme" aria-label="Card color theme">
              <span className="sharepage__card-theme-label">Card theme</span>
              <div className="sharepage__theme-toggle" role="group" aria-label="Card color theme">
                <button
                  type="button"
                  className={`sharepage__theme-btn ${cardTheme === 'dark' ? 'is-active' : ''}`}
                  onClick={() => setCardTheme('dark')}
                  aria-pressed={cardTheme === 'dark'}
                >
                  <Moon size={14} /> Dark
                </button>
                <button
                  type="button"
                  className={`sharepage__theme-btn ${cardTheme === 'light' ? 'is-active' : ''}`}
                  onClick={() => setCardTheme('light')}
                  aria-pressed={cardTheme === 'light'}
                >
                  <Sun size={14} /> Light
                </button>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              className="sharepage__canvas"
              onClick={handleCanvasClick}
              role="button"
              aria-label="Tap your photo to upload"
            />
          </div>

          <p className="sharepage__promo-highlight">
            <Gift size={16} />
            <span>
              <strong>Share &amp; get 1 Month FREE Profile Boost</strong>
              <em>Mention @padhai.pk on Facebook, Instagram or LinkedIn</em>
            </span>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarPick}
          />
        </div>

        <div className="container sharepage__inner">
          <section className="sharepage__boost" aria-labelledby="share-boost-title">
            <div className="sharepage__boost-head">
              <Sparkles size={18} aria-hidden />
              <h2 id="share-boost-title">{sharePageCopy.boostTitle}</h2>
            </div>
            <p className="sharepage__boost-intro">
              {isTeacherRole ? sharePageCopy.teacherBoostIntro : sharePageCopy.studentBoostIntro}
            </p>
            <ul className="sharepage__boost-list">
              {(isTeacherRole ? sharePageCopy.teacherBoostPoints : sharePageCopy.studentBoostPoints).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>

          {note && <p className="sharepage__note">{note}</p>}

          <div className="sharepage__platform-list">
            {PLATFORMS.map(({ id }) => {
              const { prefix, name } = platformPrefix(id);
              return (
                <div key={id} className="sharepage__platform-row">
                  <p className="sharepage__platform-text">
                    {prefix}{' '}
                    <mark className="sharepage__platform-highlight">{name}</mark>
                  </p>
                  <button
                    type="button"
                    className="sharepage__share-btn"
                    disabled={busyPlatform === id}
                    onClick={() => handlePlatformShare(id)}
                  >
                    {busyPlatform === id
                      ? <Loader2 size={16} className="waitlist__spinner" aria-hidden />
                      : <Share2 size={16} />}
                    {sharePageCopy.shareButton}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="sharepage__actions sharepage__actions--utility">
            <button type="button" className="sharepage__utility-btn" onClick={handleDownload}>
              <Download size={16} /> Download card
            </button>
          </div>

          <section className="sharepage__private" aria-labelledby="share-private-title">
            <div className="sharepage__private-head">
              <Lock size={16} aria-hidden />
              <h3 id="share-private-title">{sharePageCopy.privateProfileTitle}</h3>
            </div>
            <p>{sharePageCopy.privateProfileBody}</p>
            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              hidden
              onChange={handleScreenshotUpload}
            />
            <button
              type="button"
              className="sharepage__upload-btn"
              disabled={uploadingScreenshot || screenshotUploaded}
              onClick={() => screenshotInputRef.current?.click()}
            >
              {uploadingScreenshot
                ? <Loader2 size={16} className="waitlist__spinner" aria-hidden />
                : <Upload size={16} />}
              {uploadingScreenshot
                ? sharePageCopy.uploadingScreenshot
                : screenshotUploaded
                  ? 'Screenshot uploaded'
                  : sharePageCopy.uploadScreenshot}
            </button>
            {uploadNote && (
              <p
                className={`sharepage__upload-note sharepage__upload-note--${uploadNoteKind || 'info'}`}
                role="status"
                aria-live="polite"
              >
                {uploadNote}
              </p>
            )}
          </section>

          <p className="sharepage__admin-note">
            <ShieldCheck size={14} /> Profile Boosts are not applied automatically — admins verify your public post (or screenshot) and waitlist ID before enabling your boost.
          </p>

          <button type="button" className="sharepage__skip" onClick={() => navigate('/')}>
            Skip for now
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
