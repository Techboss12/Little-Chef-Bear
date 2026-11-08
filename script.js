/* Little Chef Bear — no frameworks, no build tools, accessible interactions. */
'use strict';

const navToggle = document.querySelector('#nav-toggle');
const navLinks = document.querySelector('#nav-links');
const form = document.querySelector('#contact-form');
const statusMessage = document.querySelector('#form-status');
const submitButton = document.querySelector('#submit-button');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Keep the site navigation keyboard-friendly and close it on navigation.
function closeNavigation() {
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open navigation');
  navLinks.classList.remove('open');
  document.body.classList.remove('nav-open');
}

navToggle.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  navLinks.classList.toggle('open', !isOpen);
  document.body.classList.toggle('nav-open', !isOpen);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeNavigation);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navLinks.classList.contains('open')) {
    closeNavigation();
    navToggle.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 850) closeNavigation();
});

// Filter menu highlights, keeping all cards in the document for accessibility.
const filters = document.querySelectorAll('.filter');
const foodCards = document.querySelectorAll('.food-card');
filters.forEach(button => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    filters.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    foodCards.forEach(card => {
      card.hidden = selected !== 'all' && card.dataset.category !== selected;
    });
  });
});

// Animate only when visible and only when motion preferences permit it.
const animatedElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px 40px 0px' });
  animatedElements.forEach(element => observer.observe(element));
} else {
  animatedElements.forEach(element => element.classList.add('visible'));
}

// Keep the copyright year current.
document.querySelector('#year').textContent = new Date().getFullYear();

// Contact form: front end and Worker share the same origin and /api/contact path.
function showFormStatus(message, type = '') {
  statusMessage.textContent = message;
  statusMessage.className = `form-status ${type}`.trim();
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  showFormStatus('');

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const payload = {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    subject: String(formData.get('subject') || '').trim(),
    message: String(formData.get('message') || '').trim(),
    consent: formData.get('consent') === 'on',
    website: String(formData.get('website') || '').trim(),
  };

  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || 'We could not send your message. Please try again.');
    }

    showFormStatus('Thank you! Your message has been received. We’ll respond as soon as we can.', 'success');
    form.reset();
  } catch (error) {
    showFormStatus(error.message || 'Network error. Please call the restaurant instead.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Send Your Message <span aria-hidden="true">↗</span>';
  }
});
