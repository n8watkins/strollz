import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Placeholder terms for the Strollz website while the app is in development.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ProsePage
      title="Terms"
      intro="A short placeholder while Strollz is in development. Full terms of service will be published before anyone can create an account or pay for anything."
    >
      <section>
        <h2>This website</h2>
        <ul>
          <li>This site describes a product that is planned, not available. Features, pricing and timing may change or never ship.</li>
          <li>Comparisons with other products are based on their public pages at the date shown and may be out of date. Product names belong to their owners.</li>
          <li>Map illustrations show a fictional neighborhood. Sample notes are examples, not facts about a real place.</li>
        </ul>
      </section>
      <section>
        <h2>Walking safely</h2>
        <p>
          When the app exists, routes will be suggestions built from open map data, which can be incomplete or wrong.
          You are responsible for your own safety: follow local laws, respect private property, and use your judgement about
          streets, traffic, weather and time of day.
        </p>
      </section>
    </ProsePage>
  );
}
