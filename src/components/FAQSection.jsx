import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Reveal from './Reveal.jsx';
import './FAQSection.css';

const FAQS = [
  {
    q: 'What exactly is Padhai.pk?',
    a: 'A tutor marketplace: students post what they want to learn, verified teachers send proposals, and paid sessions happen inside the app over video, with payment held safely until the session is confirmed complete.',
  },
  {
    q: 'Is the Verified Badge really free?',
    a: 'Yes. CNIC and qualification verification plus a short interview is completely free for the first two teachers per subject — a value of Rs. 3,000 — with a featured profile for 3 months. We monetise through optional profile boosts later, not through verification.',
  },
  {
    q: 'What happens after I join the waitlist?',
    a: "You'll get an email the moment your city and subjects are ready for launch, plus early access before we open sign-ups publicly. Badge applicants also get interview and document-submission instructions by email.",
  },
  {
    q: 'Do you only support Pakistan?',
    a: "Padhai.pk is built for Pakistani students and teachers — priced in PKR, verified by CNIC — but the waitlist is open to anyone, anywhere, including Pakistanis abroad and teachers who want to reach students back home.",
  },
  {
    q: "What if my subject's badge seats are already full?",
    a: "You're still added to our general teacher waitlist automatically, and we'll email you if a seat frees up or a new badge round opens. You can also apply again under a different subject.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="section faq">
      <div className="container faq__inner">
        <Reveal>
          <div className="faq__head">
            <div className="eyebrow">Help &amp; documentation</div>
            <h2>Questions, answered.</h2>
          </div>
        </Reveal>

        <div className="faq__list">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal key={item.q} delay={i * 60} as="div" className="faq__item-wrap">
                <div className={`faq__item ${isOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="faq__question"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown size={18} className="faq__chevron" />
                  </button>
                  <div className="faq__answer" style={{ maxHeight: isOpen ? '240px' : '0px' }}>
                    <p>{item.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}