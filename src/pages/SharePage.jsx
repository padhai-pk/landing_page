import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Download, Facebook, Instagram, Linkedin, Share2, Camera, X, Gift, ShieldCheck, PartyPopper, Sun, Moon } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { drawShareCard, renderShareCardBlob } from '../lib/shareCard.js';
import { buildShareCaption, loadShareCaptions, openPlatformShare, tryNativeShare } from '../lib/socialShare.js';
import { useContent } from '../lib/content.jsx';
import './SharePage.css';

export default function SharePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const content = useContent();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const avatarBoxRef = useRef(null);
  const [busyPlatform, setBusyPlatform] = useState('');
  const [note, setNote] = useState('');
  const [avatarImg, setAvatarImg] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [cardTheme, setCardTheme] = useState('dark');
  const [captionsConfig, setCaptionsConfig] = useState(null);

  useEffect(() => {
    loadShareCaptions().then(setCaptionsConfig);
  }, []);

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

  // Revoke the object URL when replaced/unmounted — the photo only ever
  // lives in this browser tab, it's never uploaded anywhere.
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  if (!state) {
    return (
      <>
        <Navbar />
        <main className="sharepage">
          <div className="container sharepage__empty">
            <h1>Nothing to show here yet</h1>
            <p>Join the waitlist first to get your shareable card.</p>
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
      setAvatarPreviewUrl(url);
    };
    img.src = url;
  }

  function removeAvatar() {
    setAvatarImg(null);
    setAvatarPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
  }

  async function handleNativeShare() {
    const config = captionsConfig || (await loadShareCaptions());
    const blob = await renderShareCardBlob(cardArgs);
    const caption = buildShareCaption({
      role: state.role,
      name: state.name,
      subjects: state.subjects || badgeSubjects,
      waitlistId: state.id,
    }, config);

    const shared = await tryNativeShare(blob, caption, config);
    if (shared) {
      setNote(config.shareMessages?.nativeSuccess || 'Share sheet opened with your card and caption.');
      return;
    }

    setNote(config.shareMessages?.nativeUnsupported || 'Native sharing isn\'t supported — use the buttons below.');
  }

  async function handlePlatformShare(platform) {
    setBusyPlatform(platform);
    setNote('');
    try {
      const config = captionsConfig || (await loadShareCaptions());
      const blob = await renderShareCardBlob(cardArgs);
      const caption = buildShareCaption({
        role: state.role,
        name: state.name,
        subjects: state.subjects || badgeSubjects,
        waitlistId: state.id,
      }, config);
      const result = await openPlatformShare(platform, {
        blob,
        caption,
        social: content.social,
        config,
      });
      setNote(result.message);
    } finally {
      setBusyPlatform('');
    }
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

          <div className="sharepage__card-shell">
            <div className="sharepage__card-toolbar">
              <div className="sharepage__avatar-control">
                <button type="button" className="sharepage__avatar-btn" onClick={() => fileInputRef.current?.click()}>
                  {avatarPreviewUrl ? (
                    <img src={avatarPreviewUrl} alt="Your photo" className="sharepage__avatar-thumb" />
                  ) : (
                    <Camera size={16} />
                  )}
                  {avatarPreviewUrl ? 'Change photo' : 'Add Photo'}
                </button>
                {avatarPreviewUrl && (
                  <button type="button" className="sharepage__avatar-remove" onClick={removeAvatar} aria-label="Remove photo">
                    <X size={14} />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarPick}
                />
              </div>

              <button type="button" className="btn btn-primary btn-sm sharepage__top-share" onClick={handleNativeShare}>
                <Share2 size={15} /> Share now
              </button>
            </div>
            <p className="sharepage__avatar-note">Your photo is only used to preview this card in your browser — it's never uploaded or sent to Padhai.pk.</p>

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
          </div>

          <p className="sharepage__boost-rules">
            <Gift size={14} /> Tap a platform below — your caption is ready with @padhai.pk handles. Post publicly, then our admin team will review and approve your Profile Boost manually.
          </p>

          {note && <p className="sharepage__note">{note}</p>}

          <div className="sharepage__actions">
            <button
              type="button"
              className="btn btn-secondary-outline btn-md"
              disabled={busyPlatform === 'facebook'}
              onClick={() => handlePlatformShare('facebook')}
            >
              <Facebook size={16} /> Facebook
            </button>
            <button
              type="button"
              className="btn btn-secondary-outline btn-md"
              disabled={busyPlatform === 'instagram'}
              onClick={() => handlePlatformShare('instagram')}
            >
              <Instagram size={16} /> Instagram
            </button>
            <button
              type="button"
              className="btn btn-secondary-outline btn-md"
              disabled={busyPlatform === 'linkedin'}
              onClick={() => handlePlatformShare('linkedin')}
            >
              <Linkedin size={16} /> LinkedIn
            </button>
            <button type="button" className="btn btn-ghost btn-md" onClick={handleDownload}>
              <Download size={16} /> Download only (Share myself)
            </button>
          </div>

          <p className="sharepage__admin-note">
            <ShieldCheck size={14} /> Profile Boosts are not applied automatically — admins verify your public post and waitlist ID before enabling your boost.
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
