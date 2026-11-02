import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Strollz treats your data today (this site uses only cookieless visit counts) and the privacy rules the app is being built around.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ProsePage
      title="Privacy"
      intro="A short placeholder until the app exists. It covers this website today and the rules the app is being designed to follow. A full policy will be published before anyone can create an account."
    >
      <section>
        <h2>This website today</h2>
        <ul>
          <li>This site sets no cookies and runs no advertising trackers.</li>
          <li>This site uses Cloudflare Web Analytics, which is cookieless and counts visits without tracking you. It records page views, referrers and browser, device and country information, does not store IP addresses and does not fingerprint visitors.</li>
          <li>It has no forms and stores no personal data. The waitlist lives on n8builds.dev, which handles your email under its own privacy notice and uses it only to tell you when the pilot or beta opens.</li>
          <li>Our hosting provider may keep standard server logs (such as IP address and pages requested) for security.</li>
        </ul>
      </section>
      <section>
        <h2>Who processes this data</h2>
        <ul>
          <li>Cloudflare hosts this website and provides Cloudflare Web Analytics.</li>
        </ul>
      </section>
      <section>
        <h2>Rules the app is being built around</h2>
        <ul>
          <li>Location is used to plan loops and, only when you start one, to record a walk.</li>
          <li>Your walk history is private by default and visible only to you.</li>
          <li>Shared loops blur the start point by a few hundred meters so they do not reveal your home.</li>
          <li>You can export your walk history and delete it, or your whole account, at any time.</li>
          <li>Location data is never sold, never used for advertising and never shared with data brokers.</li>
          <li>Data imported from other services (for example a GPX file) stays private to you and is never used to train or prompt AI models.</li>
          <li>Notes about places are generated from public sources about the places, never from your personal data.</li>
        </ul>
      </section>
      <section>
        <h2>Questions</h2>
        <p>Strollz is a side project in development. A contact address will be listed here before the pilot opens.</p>
      </section>
    </ProsePage>
  );
}
