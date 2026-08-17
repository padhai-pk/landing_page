import React from 'react';
import { useContent } from '../lib/content.jsx';
import { whatsappUrl } from '../lib/contact.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import './WhatsAppFloat.css';

export default function WhatsAppFloat() {
  const { contact } = useContent();
  const url = whatsappUrl(contact.whatsappNumber, contact.whatsappPrefill);

  if (!url) return null;

  return (
    <a
      href={url}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={contact.floatLabel}
      title={contact.floatLabel}
    >
      <span className="whatsapp-float__icon">
        <WhatsAppIcon size={28} />
      </span>
      <span className="whatsapp-float__label">{contact.floatLabel}</span>
    </a>
  );
}
