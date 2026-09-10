import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Loader2, ChevronDown, ArrowRight,
} from 'lucide-react';
import AmbassadorNavbar from '../components/AmbassadorNavbar.jsx';
import Footer from '../components/Footer.jsx';
import Reveal from '../components/Reveal.jsx';
import FloatingIcons from '../components/FloatingIcons.jsx';
import CountryCitySelect from '../components/CountryCitySelect.jsx';
import PhoneInput from '../components/PhoneInput.jsx';
import { useContent } from '../lib/content.jsx';
import { getIcon } from '../lib/icons.js';
import { joinAmbassadorWaitlist } from '../lib/waitlist.js';
import { getUserFacingError } from '../lib/apiErrors.js';
import { isValidEmail } from '../lib/validators.js';
import { HEARD_ABOUT_OPTIONS } from '../lib/heardAbout.js';
import './AmbassadorSignupPage.css';
import './BadgeApplicationPage.css';
import '../components/FAQSection.css';

const HERO_ICONS = [
  { icon: 'Users', top: '12%', left: '8%', size: 52, delay: 0, duration: 8, rotate: -8 },
  { icon: 'Gift', top: '18%', left: '82%', size: 46, delay: 0.6, duration: 9, rotate: 10 },
  { icon: 'Link', top: '70%', left: '12%', size: 44, delay: 1, duration: 7.5, rotate: 6 },
  { icon: 'Sparkles', top: '65%', left: '88%', size: 38, delay: 0.4, duration: 8, rotate: -6 },
];

const EDUCATION_LEVELS = [
  { value: 'school', label: 'School' },
  { value: 'o_level', label: 'O Level' },
  { value: 'a_level', label: 'A Level' },
  { value: 'college', label: 'College' },
  { value: 'university', label: 'University' },
];

const INSTITUTION_LABELS = {
  school: 'School name',
  o_level: 'School / institution name',
  a_level: 'School / institution name',
  college: 'College name',
  university: 'University name',
};

function educationLevelLabel(value) {
  return EDUCATION_LEVELS.find((item) => item.value === value)?.label || value;
}

function buildAmbassadorSubjects(form) {
  const chips = [];
  if (form.educationLevel) chips.push(educationLevelLabel(form.educationLevel));
  if (form.institution) chips.push(form.institution);
  if (form.city) chips.push(form.city);
  if (form.gradeValue) {
    if (form.gradeType === 'percentage') chips.push(`${form.gradeValue}%`);
    else if (form.gradeType === 'cgpa') chips.push(`CGPA ${form.gradeValue}`);
    else chips.push(form.gradeValue);
  }
  return chips;
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  country: 'Pakistan',
  city: '',
  educationLevel: '',
  institution: '',
  gradeType: '',
  gradeValue: '',
  instagramHandle: '',
  heardFrom: '',
  whyAmbassador: '',
  promotionPlan: '',
  reachEstimate: '',
};

export default function AmbassadorSignupPage() {
  const content = useContent();
  const program = content.ambassadorProgram;
  const { hero, benefits, howItWorks, form: formCopy, policies, faqs } = program;

  const [form, setForm] = useState(emptyForm);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
    if (!phoneValid) {
      setError('Please enter a valid phone number for the selected country.');
      return;
    }
    if (!form.city.trim()) {
      setError('Please select your city.');
      return;
    }
    if (!form.educationLevel) {
      setError('Please select your education level.');
      return;
    }
    if (!form.institution.trim()) {
      setError('Please enter your school, college, or university name.');
      return;
    }
    if (!form.gradeType) {
      setError('Please choose whether your grade is a percentage or CGPA.');
      return;
    }
    if (!form.gradeValue.trim()) {
      setError('Please enter your percentage or CGPA.');
      return;
    }
    if (form.gradeType === 'percentage') {
      const pct = Number(form.gradeValue);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        setError('Percentage must be a number between 0 and 100.');
        return;
      }
    }
    if (form.gradeType === 'cgpa') {
      const cgpa = Number(form.gradeValue);
      if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        setError('CGPA must be a number between 0 and 10.');
        return;
      }
    }
    if (!form.heardFrom) {
      setError('Please tell us how you heard about Padhai.');
      return;
    }
    if (!form.whyAmbassador.trim()) {
      setError('Tell us why you want to be a Student Ambassador.');
      return;
    }
    if (!form.promotionPlan.trim()) {
      setError('Tell us how you plan to bring students to Padhai.');
      return;
    }
    if (!form.reachEstimate.trim()) {
      setError('Please estimate how many students you could reach.');
      return;
    }
    if (!agreed) {
      setError('Please confirm you agree to the policies below before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const { id, shareToken } = await joinAmbassadorWaitlist({ ...form, policiesAccepted: true });
      const subjects = buildAmbassadorSubjects(form);
      navigate('/share', {
        state: {
          role: 'ambassador',
          name: form.name,
          id,
          shareToken,
          collection: 'waitlistAmbassadors',
          educationLevel: form.educationLevel,
          institution: form.institution,
          city: form.city,
          gradeType: form.gradeType,
          gradeValue: form.gradeValue,
          subjects,
        },
      });
    } catch (err) {
      console.error(err);
      setError(getUserFacingError(err, { action: 'ambassador-signup' }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AmbassadorNavbar />
      <main className="ambpage">
        <section id="top" className="ambpage__hero">
          <div className="ambpage__hero-glow" aria-hidden="true" />
          <FloatingIcons items={HERO_ICONS} />
          <div className="container ambpage__hero-inner">
            <Reveal>
              <div className="eyebrow ambpage__hero-eyebrow">
                <Users size={14} /> {hero.eyebrow}
              </div>
              <h1 className="ambpage__hero-headline">
                {hero.headlineLine1}<br />
                <span className="text-gradient">{hero.headlineLine2}</span>
              </h1>
              <p className="ambpage__hero-sub">{hero.subtext}</p>
              <a href="#signup" className="btn btn-primary btn-lg">
                Apply now <ArrowRight size={18} />
              </a>
            </Reveal>
          </div>
        </section>

        <section id="benefits" className="section ambpage__benefits">
          <div className="container">
            <Reveal>
              <div className="ambpage__section-head">
                <div className="eyebrow">{benefits.eyebrow}</div>
                <h2>{benefits.heading}</h2>
                <p>{benefits.subtext}</p>
              </div>
            </Reveal>
            <div className="ambpage__benefits-grid">
              {benefits.items.map((item, i) => {
                const Icon = getIcon(item.icon);
                return (
                  <Reveal key={item.title} delay={i * 60} as="div" className="ambpage__benefit card">
                    <span className="ambpage__benefit-icon"><Icon size={20} /></span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section ambpage__steps">
          <div className="container">
            <Reveal>
              <div className="ambpage__section-head">
                <div className="eyebrow">{howItWorks.eyebrow}</div>
                <h2>{howItWorks.heading}</h2>
              </div>
            </Reveal>
            <ol className="ambpage__steps-list">
              {howItWorks.steps.map((step, i) => {
                const Icon = getIcon(step.icon);
                return (
                  <Reveal key={step.title} delay={i * 80} as="li" className="ambpage__step card">
                    <span className="ambpage__step-num">{i + 1}</span>
                    <span className="ambpage__step-icon"><Icon size={18} /></span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </section>

        <section id="signup" className="section ambpage__signup">
          <div className="container badgepage__inner">
            <Reveal>
              <div className="badgepage__head ambpage__form-head">
                <span className="badgepage__head-icon"><Users size={22} /></span>
                <div>
                  <h2>{formCopy.heading}</h2>
                  <p>{formCopy.subtext}</p>
                </div>
              </div>
            </Reveal>

            <div className="badgepage__grid">
              <form onSubmit={handleSubmit} className="badgepage__form card">
                <h3>Your details</h3>
                <div className="badgepage__row">
                  <label>
                    Full name
                    <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" required />
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
                      <span className="badgepage__field-error">Enter a valid email address.</span>
                    )}
                  </label>
                </div>
                <div className="badgepage__row">
                  <label>
                    WhatsApp / phone
                    <PhoneInput
                      defaultCca2="PK"
                      lockCountryCode
                      onChange={(full, valid) => { update('phone', full); setPhoneValid(valid); }}
                    />
                  </label>
                  <label>
                    Instagram handle (optional)
                    <input
                      value={form.instagramHandle}
                      onChange={(e) => update('instagramHandle', e.target.value)}
                      placeholder="@yourusername"
                    />
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
                  <label>
                    Education level
                    <select
                      value={form.educationLevel}
                      onChange={(e) => update('educationLevel', e.target.value)}
                      required
                    >
                      <option value="">Select level</option>
                      {EDUCATION_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {INSTITUTION_LABELS[form.educationLevel] || 'School / college / university name'}
                    <input
                      value={form.institution}
                      onChange={(e) => update('institution', e.target.value)}
                      placeholder="e.g. Beaconhouse, LUMS, Punjab College"
                      required
                    />
                  </label>
                </div>
                <div className="badgepage__row">
                  <label>
                    Grade type
                    <select
                      value={form.gradeType}
                      onChange={(e) => update('gradeType', e.target.value)}
                      required
                    >
                      <option value="">Select type</option>
                      <option value="percentage">Percentage</option>
                      <option value="cgpa">CGPA</option>
                    </select>
                  </label>
                  <label>
                    {form.gradeType === 'cgpa' ? 'CGPA' : form.gradeType === 'percentage' ? 'Percentage' : 'Percentage or CGPA'}
                    <input
                      value={form.gradeValue}
                      onChange={(e) => update('gradeValue', e.target.value)}
                      placeholder={form.gradeType === 'cgpa' ? 'e.g. 3.7' : 'e.g. 85'}
                      inputMode="decimal"
                      required
                    />
                  </label>
                </div>

                <label className="badgepage__full">
                  How did you hear about us?
                  <select
                    value={form.heardFrom}
                    onChange={(e) => update('heardFrom', e.target.value)}
                    required
                  >
                    <option value="">Select an option</option>
                    {HEARD_ABOUT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>

                <h3>About you</h3>
                <label className="badgepage__full">
                  Why do you want to be a Student Ambassador?
                  <textarea
                    rows={3}
                    value={form.whyAmbassador}
                    onChange={(e) => update('whyAmbassador', e.target.value)}
                    placeholder="What excites you about Padhai, and why would you be a great ambassador?"
                    required
                  />
                </label>
                <label className="badgepage__full">
                  How will you bring students to Padhai?
                  <textarea
                    rows={3}
                    value={form.promotionPlan}
                    onChange={(e) => update('promotionPlan', e.target.value)}
                    placeholder="WhatsApp groups, campus events, social media, classmates — be specific."
                    required
                  />
                </label>
                <label className="badgepage__full">
                  Roughly how many students could you reach?
                  <input
                    value={form.reachEstimate}
                    onChange={(e) => update('reachEstimate', e.target.value)}
                    placeholder="e.g. 50 classmates in my batch"
                    required
                  />
                </label>

                <h3>Policies</h3>
                <ul className="badgepage__policies">
                  {policies.map((p) => <li key={p}>{p}</li>)}
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
                      Submitting…
                    </>
                  ) : 'Submit application'}
                </button>
              </form>

              <aside className="badgepage__sidebar">
                <div className="card badgepage__sidebar-card">
                  <h4>What happens next</h4>
                  <ol>
                    <li>We review your application (usually within a few days).</li>
                    <li>If selected, you get an email with your personal referral code.</li>
                    <li>Share your code — every student or teacher who joins with it is tracked to you.</li>
                    <li>Earn commission from their first-month sessions, plus hampers, bonuses, and social features.</li>
                  </ol>
                </div>
                <div className="card badgepage__sidebar-card ambpage__sidebar-note">
                  <h4>No fixed earnings cap</h4>
                  <p>Bring 50 classmates from your campus and you earn from all of their first-month classes and monthly sessions — not a limited headcount or a fixed ceiling. Hampers, lifelong Padhai perks, and extra bonuses stack on top.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="faq" className="section faq ambpage__faq">
          <div className="container faq__inner">
            <Reveal>
              <div className="faq__head">
                <div className="eyebrow">FAQ</div>
                <h2>Ambassador questions, answered.</h2>
              </div>
            </Reveal>
            <div className="faq__list">
              {faqs.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <Reveal key={item.q} delay={i * 50} as="div" className="faq__item-wrap">
                    <div className={`faq__item ${isOpen ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        className="faq__question"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaq(isOpen ? -1 : i)}
                      >
                        <span>{item.q}</span>
                        <ChevronDown size={18} className="faq__chevron" />
                      </button>
                      <div className="faq__answer" style={{ maxHeight: isOpen ? '280px' : '0px' }}>
                        <p>{item.a}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
