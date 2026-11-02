import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Data and attributions",
  description: "The open data sources Strollz is planned to use and how each will be credited.",
  alternates: { canonical: "/attributions" },
};

export default function AttributionsPage() {
  return (
    <ProsePage
      title="Data and attributions"
      intro="Strollz is being built on open data. This page lists the sources we plan to use and how they will be credited in the app. This website itself uses no third-party map data: the maps on the home page are hand-drawn illustrations."
    >
      <section>
        <h2>Planned data sources</h2>
        <ul>
          <li>
            Streets, paths and walking routes: <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>,
            available under the Open Database License (ODbL).
          </li>
          <li>
            Places: <a href="https://overturemaps.org/">Overture Maps Foundation</a> Places data, under the
            Community Data License Agreement (CDLA Permissive 2.0) and the attributions it lists.
          </li>
          <li>
            Notes about places: <a href="https://www.wikipedia.org/">Wikipedia</a> (CC BY-SA) and{" "}
            <a href="https://www.wikidata.org/">Wikidata</a> (CC0). Each note links to the article or record it came from.
          </li>
          <li>Map display: open vector tiles built from OpenStreetMap, credited on every map view.</li>
        </ul>
      </section>
      <section>
        <h2>Fonts</h2>
        <p>Inter and Fraunces, both under the SIL Open Font License, served with the site.</p>
      </section>
    </ProsePage>
  );
}
