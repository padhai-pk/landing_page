import React, { useState } from 'react';
import { GraduationCap, Users, Award, Loader2 } from 'lucide-react';
import Reveal from './Reveal.jsx';
import SubjectPicker from './SubjectPicker.jsx';
import './WaitlistSection.css';
import { SUBJECTS, CATEGORIES } from '../lib/subjects.js';
import { joinStudentWaitlist, joinTeacherNormalWaitlist, joinTeacherBadgeWaitlist } from '../lib/waitlist.js';

const TABS = [
  { id: 'student', label: 'Join as student', icon: <Users size={16} /> },
  { id: 'teacher', label: 'Join as teacher', icon: <GraduationCap size={16} /> },
  { id: 'badge', label: 'Claim a badge seat', icon: <Award size={16} /> },
];

const emptyForm = { name: '', email: '', phone: '', city: '', experience: '', qualification: '' };

export default function WaitlistSection({ subjects, onResult }) {
  const [tab, setTab] = useState('student');
  const [form, setForm] = useState(emptyForm);
  const [chosenSubjects, setChosenSubjects] = useState([]);
  const [badgeSubject, setBadgeSubject] = useState('');
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
    setBadgeSubject('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please fill in your name, email, and phone number.');
      return;
    }
    if (tab !== 'badge' && chosenSubjects.length === 0) {
      setError('Pick at least one subject.');
      return;
    }
    if (tab === 'badge' && !badgeSubject) {
      setError('Choose the subject you want to teach.');
      return;
    }

    setSubmitting(true);
    try {
      if (tab === 'student') {
        await joinStudentWaitlist({ ...form, subjects: chosenSubjects });
        onResult({ type: 'success', title: "You're on the list!", body: "We'll email you the moment Padhai.pk goes live for you." });
      } else if (tab === 'teacher') {
        await joinTeacherNormalWaitlist({ ...form, subjects: chosenSubjects });
        onResult({ type: 'success', title: "You're on the list!", body: 'Look out for an invite to onboard as one of our first verified teachers.' });
      } else {
        const result = await joinTeacherBadgeWaitlist({ ...form, subjectId: badgeSubject });
        if (result.status === 'seat_reserved') {
          onResult({
            type: 'success',
            title: 'Seat reserved!',
            body: `You've claimed a free Verified Badge seat for ${result.subjectName}. We'll email you next steps for the interview and document submission.`,
          });
        } else {
          onResult({
            type: 'info',
            title: 'Both seats are taken',
            body: `${result.subjectName} already has 2 verified teachers. You've been added to our general waitlist and we've emailed you the details.`,
          });
        }
      }
      setForm(emptyForm);
      setChosenSubjects([]);
      setBadgeSubject('');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Something went wrong on our end — please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  const groupedBadgeOptions = categoriesInList.map((cat) => ({
    category: cat,
    items: subjectList.filter((s) => s.category === cat),
  })).filter((g) => g.items.length);

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

            {tab === 'badge' && (
              <p className="waitlist__note">
                <Award size={15} /> Free CNIC + qualification verification, a short interview, and a badge
                worth Rs. 3,000 — limited to the first 2 teachers per subject.
              </p>
            )}

            <form onSubmit={handleSubmit} className="waitlist__form">
              <div className="waitlist__row">
                <label>
                  Full name
                  <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Fatima Ahmed" required />
                </label>
                <label>
                  City / country
                  <input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Karachi, Pakistan" />
                </label>
              </div>

              <div className="waitlist__row">
                <label>
                  Email
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@email.com" required />
                </label>
                <label>
                  WhatsApp / phone
                  <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+92 3XX-XXXXXXX" required />
                </label>
              </div>

              {tab === 'badge' ? (
                <>
                  <label className="waitlist__full">
                    Subject you want to teach
                    <select value={badgeSubject} onChange={(e) => setBadgeSubject(e.target.value)} required>
                      <option value="" disabled>Select a subject</option>
                      {groupedBadgeOptions.map((g) => (
                        <optgroup key={g.category} label={g.category}>
                          {g.items.map((s) => {
                            const full = (s.badgeSeatsFilled || 0) >= (s.badgeSeatsMax || 2);
                            return (
                              <option key={s.id} value={s.id} disabled={full}>
                                {s.name} {full ? '— Full' : `— ${(s.badgeSeatsMax || 2) - (s.badgeSeatsFilled || 0)} seat(s) open`}
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </select>
                  </label>

                  <div className="waitlist__row">
                    <label>
                      Highest qualification
                      <input value={form.qualification} onChange={(e) => update('qualification', e.target.value)} placeholder="BSc Computer Science" />
                    </label>
                    <label>
                      Years of teaching experience
                      <input value={form.experience} onChange={(e) => update('experience', e.target.value)} placeholder="2 years" />
                    </label>
                  </div>
                </>
              ) : (
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
              )}

              {tab === 'teacher' && (
                <label className="waitlist__full">
                  Years of teaching experience
                  <input value={form.experience} onChange={(e) => update('experience', e.target.value)} placeholder="e.g. 3 years, or 'first time'" />
                </label>
              )}

              {error && <p className="waitlist__error" role="alert">{error}</p>}

              <button type="submit" className="btn btn-primary btn-lg waitlist__submit" disabled={submitting}>
                {submitting && <Loader2 size={18} className="waitlist__spinner" />}
                {submitting ? 'Submitting…' : tab === 'badge' ? 'Apply for a free badge seat' : 'Join the waitlist'}
              </button>
            </form>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
