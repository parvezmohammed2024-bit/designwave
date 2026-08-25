"use client";

import MagneticButton from "./MagneticButton";
import { Rise, RevealWords } from "./Reveal";

const crafts = [
  { name: "ফয়েল স্ট্যাম্পিং", detail: "সোনালি-রুপালি ধাতব ছাপ" },
  { name: "এমবসিং", detail: "কাগজে ফুটে ওঠা নকশা" },
  { name: "ডাই-কাট", detail: "যেকোনো আকৃতিতে কাটা" },
  { name: "লেটারপ্রেস", detail: "কালির গভীর, স্পর্শযোগ্য ছাপ" },
];

/** Closing strip: the craft menu + final CTA. */
export default function CraftStrip() {
  return (
    <section className="bg-paper pb-14 pt-6" aria-labelledby="craft-title">
      <div className="mx-auto max-w-6xl px-5">
        <RevealWords
          as="h2"
          id="craft-title"
          text="হাতের কাজ, ছাপার জাদু"
          className="bangla-safe text-3xl font-bold md:text-4xl"
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {crafts.map((c, i) => (
            <Rise key={c.name} delay={i * 0.07}>
              <div className="group h-full rounded-2xl border border-ink/10 bg-paper p-6 transition-colors duration-300 hover:border-brand-700">
                <div
                  aria-hidden
                  className="mb-4 h-10 w-7 rounded-sm border-2 border-ink transition-transform duration-300 ease-paper group-hover:-rotate-6 group-hover:border-brand-700"
                />
                <h3 className="bangla-safe text-lg font-bold">{c.name}</h3>
                <p className="mt-1 text-sm leading-bangla text-ink/70">
                  {c.detail}
                </p>
              </div>
            </Rise>
          ))}
        </div>
        <Rise className="mt-10 text-center" delay={0.1}>
          <p className="bangla-safe text-2xl font-bold md:text-3xl">
            আপনার গল্পটা বলবেন কীভাবে?
          </p>
          <p className="mx-auto mt-3 max-w-md leading-bangla text-ink/70">
            আমাদের বলুন — বাকিটা কাগজ আর কালির কাজ।
          </p>
          <div className="mt-7">
            <MagneticButton href="/order">অর্ডার শুরু করুন</MagneticButton>
          </div>
        </Rise>
      </div>
    </section>
  );
}
