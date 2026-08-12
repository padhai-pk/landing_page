import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, UploadCloud, Loader2, FileText } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import CountryCitySelect from '../components/CountryCitySelect.jsx';
import PhoneInput from '../components/PhoneInput.jsx';
import SubjectPicker from '../components/SubjectPicker.jsx';
import { useContent } from '../lib/content.jsx';
import { SUBJECTS, CATEGORIES, BADGE_SEATS_PER_SUBJECT } from '../lib/subjects.js';
import { listenToSubjects, joinTeacherBadgeWaitlist } from '../lib/waitlist.js';
import './BadgeApplicationPage.css';
import { uploadFileToDrive } from '../lib/driveUpload.js';
import { getUserFacingError } from '../lib/apiErrors.js';
import { validateDocFile, ACCEPTED_DOC_INPUT_ATTR } from '../lib/fileValidation.js';
import { isValidEmail, isValidCnic, formatCnicInput,isValidExperience } from '../lib/validators.js';

const emptyForm = {
  name: '', email: '', phone: '', country: '', city: '', cnicNumber: '',
  qualification: '', institution: '', experience: '',
  bio: '', introVideoLink: '',
};

const MAX_BADGE_SUBJECTS = 10;

export default function BadgeApplicationPage() {
  const content = useContent();
  const navigate = useNavigate();
  const { badgeProgram } = content;

  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [chosenSubjectIds, setChosenSubjectIds] = useState([]);
  const [files, setFiles] = useState({ cnicFront: null, cnicBack: null, qualificationCert: null });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [cnicTouched, setCnicTouched] = useState(false);
  const [uploadStage, setUploadStage] = useState(''); // '' | 'cnicFront' | 'cnicBack' | 'qualificationCert' | 'saving'
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = listenToSubjects(setSubjects);
    return unsub;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const subjectList = subjects.length ? subjects : SUBJECTS.map((s) => ({ ...s, badgeSeatsFilled: 0, badgeSeatsMax: BADGE_SEATS_PER_SUBJECT }));
  const categoriesInList = [...new Set(subjectList.map((s) => s.category))].length
    ? [...new Set(subjectList.map((s) => s.category))]
    : CATEGORIES;

  // Only subjects with at least one open seat are selectable here.
  const availableSubjects = subjectList.filter(
    (s) => (s.badgeSeatsFilled || 0) < (s.badgeSeatsMax || BADGE_SEATS_PER_SUBJECT)
  );

  function handleSubjectsChange(nextIds) {
    if (nextIds.length > MAX_BADGE_SUBJECTS) return; // ignore attempts past the cap
    setChosenSubjectIds(nextIds);
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function updateFile(field, fileList) {
    const file = fileList?.[0] || null;
    if (!file) {
      setFiles((f) => ({ ...f, [field]: null }));
      return;
    }
    const check = validateDocFile(file);
    if (!check.valid) {
      setError(check.reason);
      setFiles((f) => ({ ...f, [field]: null }));
      return;
    }
    setError('');
    setFiles((f) => ({ ...f, [field]: file }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.cnicNumber.trim()) {
      setError('Please fill in your name, email, phone, and CNIC number.');
      return;
    }
    if (!isValidEmail(form.email)) {
      setEmailTouched(true);
      setError('Please enter a valid email address.');
      return;
    }
    if (!phoneValid) {
      setError('Please enter a valid phone number for the selected country.');
      return;
    }
    if (!isValidCnic(form.cnicNumber)) {
      setCnicTouched(true);
      setError('Please enter a valid 13-digit CNIC number.');
      return;
    }
    if (!isValidExperience(form.experience)) {
      setError('Experience must be a number (e.g. 2).');
      return;
    }
    if (chosenSubjectIds.length === 0) {
      setError('Choose at least one subject you want to teach.');
      return;
    }
    if (chosenSubjectIds.length > MAX_BADGE_SUBJECTS) {
      setError(`You can apply for up to ${MAX_BADGE_SUBJECTS} subjects at once.`);
      return;
    }
    if (!form.qualification.trim()) {
      setError('Please tell us your highest qualification.');
      return;
    }
    if (!files.cnicFront || !files.cnicBack || !files.qualificationCert) {
      setError('CNIC front, CNIC back, and your qualification certificate are all required.');
      return;
    }
    if (!agreed) {
      setError('Please confirm you agree to the policies below before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      setUploadStage('cnicFront');
      const cnicFront = await uploadFileToDrive(files.cnicFront);
      setUploadStage('cnicBack');
      const cnicBack = await uploadFileToDrive(files.cnicBack);
      setUploadStage('qualificationCert');
      const qualificationCert = await uploadFileToDrive(files.qualificationCert);

      setUploadStage('saving');
      const res = await joinTeacherBadgeWaitlist({
        ...form,
        subjectIds: chosenSubjectIds,
        policiesAccepted: true,
        documents: {
          cnicFront: cnicFront?.webViewLink || null,
          cnicBack: cnicBack?.webViewLink || null,
          qualificationCert: qualificationCert?.webViewLink || null,
        },
      });
      const subjectNames = subjectList
        .filter((s) => chosenSubjectIds.includes(s.id))
        .map((s) => s.name);
      const claimedSubjectNames = (res.results || [])
        .filter((r) => r.status === 'seat_reserved')
        .map((r) => r.subjectName);

      navigate('/share', {
        state: {
          role: 'badge',
          name: form.name,
          id: res.id,
          shareToken: res.shareToken,
          collection: 'waitlistTeachersBadge',
          subjectResults: res.results,
          subjects: subjectNames,
          badgeSubjects: claimedSubjectNames,
        },
      });
    } catch (err) {
      console.error(err);
      setError(getUserFacingError(err, {
        action: 'badge-application',
        uploadStage,
      }));
    } finally {
      setSubmitting(false);
      setUploadStage('');
    }
  }

 
  return (
    <>
      <Navbar />
      <main className="badgepage">
        <div className="container badgepage__inner">
          <Link to="/#badge-program" className="badgepage__back"><ArrowLeft size={16} /> Back</Link>

          <div className="badgepage__head">
            <span className="badgepage__head-icon"><Award size={22} /></span>
            <div>
              <h1>Apply for a free Verified Badge</h1>
              <p>Worth {badgeProgram.seatValueLabel} — limited to the first 2 teachers per subject.</p>
            </div>
          </div>

          <div className="badgepage__grid">
            <form onSubmit={handleSubmit} className="badgepage__form card">
              <h3>Your details</h3>
              <div className="badgepage__row">
                <label>Full name<input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Fatima Ahmed" required /></label>
                <label>
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="you@email.com"
                    required
                  />
                  {emailTouched && form.email && !isValidEmail(form.email) && (
                    <span className="badgepage__field-error">Enter a valid email address.</span>
                  )}
                </label> </div>
              <div className="badgepage__row">
              <label>
                  WhatsApp / phone
                  <PhoneInput onChange={(full, valid) => { update('phone', full); setPhoneValid(valid); }} />
                </label>
                <label>
                  CNIC number
                  <input
                    value={form.cnicNumber}
                    onChange={(e) => update('cnicNumber', formatCnicInput(e.target.value))}
                    onBlur={() => setCnicTouched(true)}
                    placeholder="XXXXX-XXXXXXX-X"
                    maxLength={15}
                    required
                  />
                  {cnicTouched && form.cnicNumber && !isValidCnic(form.cnicNumber) && (
                    <span className="badgepage__field-error">Enter a valid 13-digit CNIC number.</span>
                  )}
                </label>
                </div>
              <div className="badgepage__row">
                <CountryCitySelect
                  country={form.country}
                  city={form.city}
                  onCountryChange={(v) => update('country', v)}
                  onCityChange={(v) => update('city', v)}
                />
              </div>
              <div className="badgepage__row">
                <div className="badgepage__full">
                  <span className="badgepage__subjects-label">
                    Subjects you want to teach ({chosenSubjectIds.length}/{MAX_BADGE_SUBJECTS})
                  </span>
                  <SubjectPicker
                    subjects={availableSubjects}
                    value={chosenSubjectIds}
                    onChange={handleSubjectsChange}
                    categories={categoriesInList}
                  />
                  {chosenSubjectIds.length >= MAX_BADGE_SUBJECTS && (
                    <p className="badgepage__subjects-cap">Maximum of {MAX_BADGE_SUBJECTS} subjects reached.</p>
                  )}
                </div>
              </div>
              <h3>Qualifications</h3>
              <div className="badgepage__row">
                <label>Highest qualification<input value={form.qualification} onChange={(e) => update('qualification', e.target.value)} placeholder="BSc Computer Science" required /></label>
                <label>Institution<input value={form.institution} onChange={(e) => update('institution', e.target.value)} placeholder="e.g. FAST-NUCES" /></label>
              </div>
              <div className="badgepage__row">
              <label>
                    Years of teaching experience
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.experience}
                      onChange={(e) => update('experience', e.target.value)}
                      placeholder="e.g. 2 (enter 0 if you're just starting)"
                    />
                  </label>
                   <label>Intro video link (optional)<input value={form.introVideoLink} onChange={(e) => update('introVideoLink', e.target.value)} placeholder="YouTube (unlisted) or Drive link" /></label>
              </div>
              <label className="badgepage__full">
                Short bio / teaching philosophy
                <textarea rows={3} value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="What do you teach and how do you explain it?" />
              </label>

              <h3>Verification documents</h3>
              <p className="badgepage__doc-note">Clear photos or scans, under 8MB each.</p>
              <div className="badgepage__row">
                <FileField label="CNIC — front" file={files.cnicFront} onChange={(fl) => updateFile('cnicFront', fl)} />
                <FileField label="CNIC — back" file={files.cnicBack} onChange={(fl) => updateFile('cnicBack', fl)} />
              </div>
              <FileField label="Qualification certificate / degree" file={files.qualificationCert} onChange={(fl) => updateFile('qualificationCert', fl)} full />

              <h3>Policies</h3>
              <ul className="badgepage__policies">
                {badgeProgram.policies.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <label className="badgepage__agree">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                I have read and agree to all of the above.
              </label>

              {error && <p className="badgepage__error" role="alert">{error}</p>}

              <button type="submit" className="btn btn-primary btn-lg badgepage__submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="waitlist__spinner" />
                    {uploadStage === 'cnicFront' && 'Uploading CNIC front…'}
                    {uploadStage === 'cnicBack' && 'Uploading CNIC back…'}
                    {uploadStage === 'qualificationCert' && 'Uploading certificate…'}
                    {uploadStage === 'saving' && 'Submitting application…'}
                    {!uploadStage && 'Submitting…'}
                  </>
                ) : 'Submit application'}
              </button>
            </form>

            <aside className="badgepage__sidebar">
              <div className="card badgepage__sidebar-card">
                <h4>What you'll need</h4>
                <ul>
                  {badgeProgram.documentsRequired.map((d) => (
                    <li key={d}><FileText size={14} /> {d}</li>
                  ))}
                </ul>
              </div>
              <div className="card badgepage__sidebar-card">
                <h4>What happens next</h4>
                <ol>
                  <li>We review your documents (usually within 48 hours).</li>
                  <li>A short interview is scheduled by email or a quick call.</li>
                  <li>Once approved, your badge and featured profile go live at launch.</li>
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function FileField({ label, file, onChange, full }) {
  return (
    <label className={`badgepage__file ${full ? 'badgepage__full' : ''}`}>
      {label}
      <span className={`badgepage__file-drop ${file ? 'has-file' : ''}`}>
        <UploadCloud size={16} />
        <span className="badgepage__file-name">{file ? file.name : 'Choose file (JPG, PNG, WEBP, or PDF)'}</span>
        <input type="file" accept={ACCEPTED_DOC_INPUT_ATTR} onChange={(e) => onChange(e.target.files)} />
      </span>
    </label>
  );
}

