import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Reveal from './Reveal.jsx';
import FloatingIcons from './FloatingIcons.jsx';
import { useContent } from '../lib/content.jsx';
import './FAQSection.css';

const BG_ICONS = [
  { icon: 'MessageCircleQuestion', top: '8%', left: '5%', size: 52, delay: 0.3, duration: 8, rotate: -8 },
  { icon: 'BookOpen', top: '75%', left: '88%', size: 42, delay: 0.9, duration: 7, rotate: 10 },
];

export default function FAQSection() {
  const content = useContent();
  const faqs = content.faqs;
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="section faq">
      <FloatingIcons items={BG_ICONS} />
      <div className="container faq__inner">
        <Reveal>
          <div className="faq__head">
            <div className="eyebrow">Help &amp; documentation</div>
            <h2>Questions, answered.</h2>
          </div>
        </Reveal>

        <div className="faq__list">
          {faqs.map((item, i) => {
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
