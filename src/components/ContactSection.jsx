import React from 'react';
import { Mail } from 'lucide-react';
import Reveal from './Reveal.jsx';
import { useContent } from '../lib/content.jsx';
import { whatsappUrl } from '../lib/contact.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import './ContactSection.css';

export default function ContactSection() {
  const { contact } = useContent();
  const whatsappLink = whatsappUrl(contact.whatsappNumber, contact.whatsappPrefill);

  return (
    <section id="contact" className="section contact">
      <div className="container contact__inner">
        <Reveal>
          <div className="contact__head">
            <div className="eyebrow">{contact.eyebrow}</div>
            <h2>{contact.heading}</h2>
            <p>{contact.subtext}</p>
          </div>
        </Reveal>

        <div className="contact__grid">
          <Reveal delay={80}>
            <a className="contact__card" href={`mailto:${contact.email}`}>
              <span className="contact__icon contact__icon--mail" aria-hidden="true">
                <Mail size={22} />
              </span>
              <span className="contact__label">Email</span>
              <span className="contact__value">{contact.email}</span>
            </a>
          </Reveal>

          {whatsappLink && (
            <Reveal delay={160}>
              <a
                className="contact__card contact__card--whatsapp"
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact__icon contact__icon--whatsapp" aria-hidden="true">
                  <WhatsAppIcon size={22} />
                </span>
                <span className="contact__label">WhatsApp</span>
                <span className="contact__value">{contact.whatsappDisplay}</span>
              </a>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
