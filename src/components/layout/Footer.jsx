import React from "react";
import { Link } from "react-router";
import { FaEnvelope, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";

const QUICK_LINKS = [
  { to: "/scholarships", label: "Scholarships" },
  { to: "/assessment", label: "Fit assessment" },
  { to: "/whatsapp", label: "WhatsApp community" },
  { to: "/contact", label: "Contact us" },
];

const SERVICES = [
  { to: "/consulting", label: "Application & scholarship consulting (coming soon)" },
  { to: "/academy", label: "myScholy Academy (coming soon)" },
  { to: "/#faq", label: "FAQ" },
];

export default function Footer() {
  return (
    <footer className="bg-brand-wash text-white">
      <div className="container py-14">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h2 className="mb-4 text-base font-bold uppercase tracking-wide">Quick links</h2>
            <ul className="space-y-2 text-sm text-white/85">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="rounded transition-colors hover:text-gold-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-base font-bold uppercase tracking-wide">
              Services
            </h2>
            <ul className="space-y-2 text-sm text-white/85">
              {SERVICES.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="rounded transition-colors hover:text-gold-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-base font-bold uppercase tracking-wide">Get in touch</h2>
            <ul className="space-y-3 text-sm text-white/85">
              <li className="flex items-center gap-2">
                <FaEnvelope className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a href="mailto:myscholy@gmail.com" className="rounded hover:text-gold-200">
                  myscholy@gmail.com
                </a>
              </li>
              <li>
                <Link to="/contact" className="rounded underline-offset-4 hover:text-gold-200">
                  Send us a message
                </Link>
              </li>
            </ul>
            <div className="mt-4 flex gap-4">
              {[
                { href: "https://www.facebook.com/", Icon: FaFacebook, label: "Facebook" },
                { href: "https://www.instagram.com/", Icon: FaInstagram, label: "Instagram" },
                { href: "https://www.linkedin.com/", Icon: FaLinkedin, label: "LinkedIn" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="rounded transition-colors hover:text-gold-200"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="container py-6 text-center text-sm text-white/80">
          &copy; {new Date().getFullYear()} MyScholy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
