import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, Award, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal.jsx';
import SubjectPicker from './SubjectPicker.jsx';
import CountryCitySelect from './CountryCitySelect.jsx';
import PhoneInput from './PhoneInput.jsx';
import { useContent } from '../lib/content.jsx';
import './WaitlistSection.css';
import { SUBJECTS, CATEGORIES } from '../lib/subjects.js';
import { joinStudentWaitlist, joinTeacherNormalWaitlist } from '../lib/waitlist.js';
import { getUserFacingError } from '../lib/apiErrors.js';
import { useNavigate } from 'react-router-dom';
import { isValidEmail, isValidExperience } from '../lib/validators.js';

const TABS = [
  { id: 'student', label: 'Join as student', icon: <Users size={16} /> },
  { id: 'teacher', label: 'Join as teacher', icon: <GraduationCap size={16} /> },
];

const emptyForm = { name: '', email: '', phone: '', country: '', city: '', experience: '' };
export default function WaitlistSection({ subjects, onResult, activeTab, onTabChange }) {
  const content = useContent();
  const navigate = useNavigate();
  const [tab, setTab] = useState(activeTab || 'student');
  const [form, setForm] = useState(emptyForm);
  const [chosenSubjects, setChosenSubjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneResetKey, setPhoneResetKey] = useState(0);
  const [emailTouched, setEmailTouched] = useState(false);

  const subjectList = subjects.length ? subjects : SUBJECTS.map((s) => ({ ...s, badgeSeatsFilled: 0, badgeSeatsMax: 2 }));
  const categoriesInList = [...new Set(subjectList.map((s) => s.category))].length
    ? [...new Set(subjectList.map((s) => s.category))]
    : CATEGORIES;

    useEffect(() => {
      if (activeTab && activeTab !== tab) {
        switchTab(activeTab);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);
  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function switchTab(id) {
    setTab(id);
    onTabChange?.(id);
    setError('');
    setForm(emptyForm);
    setChosenSubjects([]);
    setPhoneValid(false);
    setPhoneResetKey((k) => k + 1);
  }


  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please fill in your name, email, and phone number.');
      return;
    }
    if (!isValidEmail(form.email)) {
      setEmailTouched(true);
      setError('Please enter a valid email address.');
      return;
    }
    if (tab === 'teacher' && !isValidExperience(form.experience)) {
      setError('Experience must be a number (e.g. 2).');
      return;
    }
    if (!phoneValid) {
      setError('Please enter a valid phone number for the selected country.');
      return;
    }
    if (chosenSubjects.length === 0) {
      setError('Pick at least one subject.');
      return;
    }
    const subjectNames = subjectList.filter((s) => chosenSubjects.includes(s.id)).map((s) => s.name);

    setSubmitting(true);
    try {
      if (tab === 'student') {
        const { id, shareToken } = await joinStudentWaitlist({ ...form, subjects: chosenSubjects });
        navigate('/share', { state: { role: 'student', name: form.name, id, shareToken, collection: 'waitlistStudents', subjects: subjectNames } });
      } else {
        const { id, shareToken } = await joinTeacherNormalWaitlist({ ...form, subjects: chosenSubjects });
        navigate('/share', { state: { role: 'teacher', name: form.name, id, shareToken, collection: 'waitlistTeachersNormal', subjects: subjectNames } });
      }
    } catch (err) {
      console.error(err);
      setError(getUserFacingError(err, {
        action: tab === 'student' ? 'student-waitlist' : 'teacher-waitlist',
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="waitlist" className="section waitlist">
      <div className="container waitlist__inner">
        <Reveal>
          <div className="waitlist__head">
            <div className="eyebrow">Join the waitlist</div>
            <h2>Be first through the door.</h2>
            <p>Takes under a minute. No payment, no commitment — just first access.</p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="waitlist__card">
            <div className="waitlist__tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`waitlist__tab ${tab === t.id ? 'waitlist__tab--active' : ''}`}
                  onClick={() => switchTab(t.id)}
                  type="button"
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {tab === 'teacher' && (
              <div className="waitlist__badge-promo">
                <span className="waitlist__badge-promo-icon"><Award size={20} /></span>
                <div className="waitlist__badge-promo-text">
                  <strong>Verified Badges are free for the first teachers on each subject.</strong>
                  <p>{content.badgeProgram.body}</p>
                </div>
                <Link to="/badge-application" className="btn btn-secondary-outline btn-sm waitlist__badge-promo-btn">
                  Claim a free badge <ArrowRight size={15} />
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="waitlist__form">
              <div className="waitlist__row">
                <label>
                  Full name
                  <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Fatima Ahmed" required />
                </label>
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
                    <span className="waitlist__field-error">Enter a valid email address.</span>
                  )}
                </label>
              </div>
              <label className="waitlist__full">
                WhatsApp / phone
                <PhoneInput
                  key={phoneResetKey}
                  onChange={(full, valid) => { update('phone', full); setPhoneValid(valid); }}
                />
              </label>

              <div className="waitlist__row">
                <CountryCitySelect
                  country={form.country}
                  city={form.city}
                  onCountryChange={(v) => update('country', v)}
                  onCityChange={(v) => update('city', v)}
                />
              </div>

              <div className="waitlist__full">
                <span className="waitlist__label-text">
                  {tab === 'student' ? 'Subjects you want to learn' : 'Subjects you can teach'}
                </span>
                <SubjectPicker
                  subjects={subjectList}
                  value={chosenSubjects}
                  onChange={setChosenSubjects}
                  categories={categoriesInList}
                />
              </div>

              {tab === 'teacher' && (
                <label className="waitlist__full">
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
              )}

              {error && <p className="waitlist__error" role="alert">{error}</p>}

              <button type="submit" className="btn btn-primary btn-lg waitlist__submit" disabled={submitting}>
                {submitting && <Loader2 size={18} className="waitlist__spinner" />}
                {submitting ? 'Submitting…' : 'Join the waitlist'}
              </button>
            </form>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
