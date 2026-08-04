import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";

import { Page } from "../components/layout/SiteLayout.jsx";
import { Button, Card, CardBody } from "../components/ui/index.js";
import { useSession } from "../lib/auth.js";

const WHATSAPP_LINK = "https://chat.whatsapp.com/BTZ8P8BZFzuByy9MKD40r7";

export default function WhatsAppInvitePage() {
  const { isAuthenticated } = useSession();

  return (
    <Page width="narrow">
      <Card>
        <CardBody className="py-12 text-center sm:px-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#25D366]/10 text-[#25D366]">
            <FaWhatsapp className="h-8 w-8" aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-3xl font-bold text-ink-900">
            Join the MyScholy community
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-600">
            Real-time scholarship alerts, application tips and a group of students going
            through exactly the same process. Ask questions, share deadlines, and never
            miss an opportunity because you heard about it too late.
          </p>

          <div className="mt-9">
            {isAuthenticated ? (
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-[#25D366] px-8 text-base font-semibold text-white shadow-card transition-colors hover:bg-[#1DA851]"
              >
                <FaWhatsapp className="h-5 w-5" aria-hidden="true" />
                Join the WhatsApp group
              </a>
            ) : (
              /* Gate on the real session instead of the Supabase session that
                 was never populated - this page used to bounce everyone. */
              <div className="mx-auto max-w-sm rounded-xl border border-gold-200 bg-gold-50 px-5 py-6">
                <p className="text-sm text-gold-800">
                  Create a free account to get the invite link.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button to="/signup">Sign up</Button>
                  <Button to="/login" variant="outline">
                    Log in
                  </Button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-8 text-xs text-ink-400">
            By joining you agree to our{" "}
            <Link to="/contact" className="rounded underline hover:text-ink-600">
              community guidelines
            </Link>
            .
          </p>
        </CardBody>
      </Card>
    </Page>
  );
}
