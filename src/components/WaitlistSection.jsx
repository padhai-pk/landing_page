import React, { useState } from 'react';
import { GraduationCap, Users, Award, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal.jsx';
import SubjectPicker from './SubjectPicker.jsx';
import CountryCitySelect from './CountryCitySelect.jsx';
import { useContent } from '../lib/content.jsx';
import './WaitlistSection.css';
import { SUBJECTS, CATEGORIES } from '../lib/subjects.js';
import { joinStudentWaitlist, joinTeacherNormalWaitlist } from '../lib/waitlist.js';

const TABS = [
  { id: 'student', label: 'Join as student', icon: <Users size={16} /> },
  { id: 'teacher', label: 'Join as teacher', icon: <GraduationCap size={16} /> },
];

const emptyForm = { name: '', email: '', phone: '', country: '', city: '', experience: '' };

export default function WaitlistSection({ subjects, onResult }) {
  const content = useContent();
  const [tab, setTab] = useState('student');
  const [form, setForm] = useState(emptyForm);
  const [chosenSubjects, setChosenSubjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subjectList = subjects.length ? subjects : SUBJECTS.map((s) => ({ ...s, badgeSeatsFilled: 0, badgeSeatsMax: 2 }));
  const categoriesInList = [...new Set(subjectList.map((s) => s.category))].length
    ? [...new Set(subjectList.map((s) => s.category))]
    : CATEGORIES;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function switchTab(id) {
    setTab(id);
    setError('');
    setForm(emptyForm);
    setChosenSubjects([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please fill in your name, email, and phone number.');
      return;
    }
    if (chosenSubjects.length === 0) {
      setError('Pick at least one subject.');
      return;
    }

    setSubmitting(true);
    try {
      if (tab === 'student') {
        await joinStudentWaitlist({ ...form, subjects: chosenSubjects });
        onResult({ type: 'success', title: "You're on the list!", body: "We'll email you the moment Padhai.pk goes live for you." });
      } else {
        await joinTeacherNormalWaitlist({ ...form, subjects: chosenSubjects });
        onResult({ type: 'success', title: "You're on the list!", body: 'Look out for an invite to onboard as one of our first verified teachers.' });
      }
      setForm(emptyForm);
      setChosenSubjects([]);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Something went wrong on our end — please try again in a moment.');
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
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@email.com" required />
                </label>
              </div>

              <label className="waitlist__full">
                WhatsApp / phone
                <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+92 3XX-XXXXXXX" required />
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
                  <input value={form.experience} onChange={(e) => update('experience', e.target.value)} placeholder="e.g. 3 years, or 'first time'" />
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
