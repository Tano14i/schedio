"use client";

import { useState } from "react";
import {
  Menu,
  X,
  Package,
  PlayCircle,
  Star,
  Gift,
  Truck,
  ChevronDown,
  ChevronRight,
  MapPin,
  Video,
  CheckCircle,
  Leaf,
  Award,
  ShoppingCart,
  Users,
  Heart
} from "lucide-react";

// ─── Cobblestone Logo Icon ────────────────────────────────────────────────────
function CobblestoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="9" height="9" rx="1.5" />
      <rect x="13" y="2" width="9" height="9" rx="1.5" />
      <rect x="2" y="13" width="9" height="9" rx="1.5" />
      <rect x="13" y="13" width="9" height="9" rx="1.5" />
    </svg>
  );
}

function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const textColor =
    variant === "light" ? "text-[#FAF3E8]" : "text-[#1A0A04]";
  const accentColor =
    variant === "light" ? "text-amber-400" : "text-amber-600";
  return (
    <div className={`flex items-center gap-2.5 ${textColor}`}>
      <CobblestoneIcon className={`w-7 h-7 ${accentColor}`} />
      <span className="font-[family-name:var(--font-playfair)] text-xl font-bold tracking-wide">
        Sampietrino
      </span>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A0A04]/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Logo variant="light" />

        <div className="hidden md:flex items-center gap-8 text-sm text-[#C4B09A]">
          <a
            href="#how-it-works"
            className="hover:text-white transition-colors cursor-pointer"
          >
            How It Works
          </a>
          <a
            href="#boxes"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Our Boxes
          </a>
          <a
            href="#gift"
            className="hover:text-white transition-colors cursor-pointer"
          >
            Gift
          </a>
        </div>

        <a
          href="#boxes"
          className="hidden md:inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-200 cursor-pointer"
        >
          Order Now
        </a>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white p-2 cursor-pointer"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#1A0A04] border-t border-white/10 px-4 py-4 flex flex-col gap-3">
          <a
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="text-[#C4B09A] hover:text-white py-2.5 cursor-pointer transition-colors"
          >
            How It Works
          </a>
          <a
            href="#boxes"
            onClick={() => setOpen(false)}
            className="text-[#C4B09A] hover:text-white py-2.5 cursor-pointer transition-colors"
          >
            Our Boxes
          </a>
          <a
            href="#gift"
            onClick={() => setOpen(false)}
            className="text-[#C4B09A] hover:text-white py-2.5 cursor-pointer transition-colors"
          >
            Gift
          </a>
          <a
            href="#boxes"
            className="bg-amber-500 text-white text-sm font-semibold px-5 py-3 rounded-full text-center cursor-pointer mt-2"
          >
            Order Now
          </a>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#1A0A04] overflow-hidden pt-16">
      {/* Cobblestone grid texture */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,255,255,1) 29px, rgba(255,255,255,1) 30px),
            repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(255,255,255,1) 29px, rgba(255,255,255,1) 30px)
          `
        }}
      />
      {/* Warm radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(180,80,20,0.22) 0%, transparent 70%)"
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
          <MapPin className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          <span className="text-xs text-amber-300 font-semibold tracking-widest uppercase">
            Roma · Nederland
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-7xl font-bold text-[#FAF3E8] leading-[1.1] mb-6">
          A Piece of Rome,
          <br />
          <span className="italic text-amber-400">Delivered to Your Door.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-[#C4B09A] text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
          Premium pasta boxes with authentic Italian DOP ingredients and a
          step-by-step video guide. Cook like a true Roman, right in your
          kitchen.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#boxes"
            className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-8 py-4 rounded-full text-base transition-all duration-200 cursor-pointer shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2"
          >
            Discover Our Boxes
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href="#how-it-works"
            className="border border-white/30 hover:border-white/60 text-[#FAF3E8] hover:bg-white/5 font-semibold px-8 py-4 rounded-full text-base transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-4 h-4" aria-hidden="true" />
            How It Works
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
        <ChevronDown className="w-5 h-5 text-white/30" aria-hidden="true" />
      </div>
    </section>
  );
}

// ─── Trust Strip ──────────────────────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { Icon: Leaf, label: "DOP Certified Ingredients" },
    { Icon: Video, label: "Video Cooking Guide Included" },
    { Icon: Truck, label: "Delivery Across Netherlands" },
    { Icon: Gift, label: "Perfect as a Gift" }
  ];

  return (
    <div className="bg-[#2C1408] border-y border-[#3D2010]">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
        {items.map(({ Icon, label }) => (
          <div
            key={label}
            className="flex items-center justify-center gap-2.5 py-4 px-4"
          >
            <Icon
              className="w-4 h-4 text-amber-400 shrink-0"
              aria-hidden="true"
            />
            <span className="text-[#D4C0A8] text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
const BOXES = [
  {
    id: "carbonara",
    name: "La Carbonara",
    tagline: "The Roman Classic",
    description:
      "The undisputed king of Roman pasta. Creamy, rich, and built on only four ingredients — each one irreplaceable.",
    badge: "Most Popular",
    price: "€24.95",
    accent: "#B53D20",
    contents: [
      "Guanciale artigianale — artisanal cured cheek",
      "Pecorino Romano DOP — aged sheep cheese",
      "Uova di fattoria — fresh farm eggs",
      "Rigatoni di Gragnano IGP",
      "Step-by-step video guide (QR code inside)"
    ]
  },
  {
    id: "amatriciana",
    name: "L'Amatriciana",
    tagline: "The Vivid Roman",
    description:
      "Born in the hills of Amatrice, perfected on Rome's streets. Bold, tomato-rich, with the deep smokiness of cured guanciale.",
    badge: null,
    price: "€24.95",
    accent: "#8B2215",
    contents: [
      "Guanciale affumicato — smoked cured cheek",
      "Pomodori San Marzano DOP — prized tomatoes",
      "Pecorino Romano DOP",
      "Bucatini di Gragnano IGP",
      "Step-by-step video guide (QR code inside)"
    ]
  },
  {
    id: "cacio-e-pepe",
    name: "Cacio e Pepe",
    tagline: "The Minimalist",
    description:
      "Three ingredients. Infinite complexity. The master test of any Roman cook — cheese, pepper, and perfectly cooked pasta.",
    badge: null,
    price: "€22.95",
    accent: "#6B4A2A",
    contents: [
      "Pecorino Romano DOP invecchiato — aged reserve",
      "Parmigiano Reggiano DOP",
      "Pepe nero macinato a pietra — stone-ground pepper",
      "Tonnarelli artigianali",
      "Step-by-step video guide (QR code inside)"
    ]
  }
];

function Products() {
  return (
    <section id="boxes" className="bg-[#FAF3E8] py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-amber-600 text-sm font-semibold tracking-widest uppercase mb-3">
            Our Boxes
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-[#1A0A04] mb-4">
            Three Roman Icons
          </h2>
          <p className="text-[#7A5040] text-lg max-w-xl mx-auto leading-relaxed">
            Each box is a complete culinary journey — from Rome&apos;s kitchens
            directly to yours.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {BOXES.map((box) => (
            <div
              key={box.id}
              className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#E8D8C4] group cursor-pointer"
            >
              {/* Colour accent bar */}
              <div className="h-1.5" style={{ backgroundColor: box.accent }} />

              {/* Badge */}
              {box.badge && (
                <div className="absolute top-6 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  {box.badge}
                </div>
              )}

              <div className="p-6">
                <p className="text-[#9A7060] text-xs font-semibold tracking-widest uppercase mb-1">
                  {box.tagline}
                </p>
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#1A0A04] mb-3">
                  {box.name}
                </h3>
                <p className="text-[#6B4A3E] text-sm leading-relaxed mb-5">
                  {box.description}
                </p>

                {/* Contents */}
                <div className="bg-[#FAF3E8] rounded-xl p-4 mb-5">
                  <p className="text-xs font-bold text-[#2C1408] mb-3 tracking-wide uppercase">
                    What&apos;s Inside
                  </p>
                  <ul className="space-y-2">
                    {box.contents.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle
                          className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-[#6B4A3E] text-xs leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Serves */}
                <div className="flex items-center gap-1.5 mb-5">
                  <Users
                    className="w-4 h-4 text-[#9A7060]"
                    aria-hidden="true"
                  />
                  <span className="text-[#9A7060] text-sm">Serves 2</span>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#1A0A04]">
                    {box.price}
                  </span>
                  <button className="bg-[#1A0A04] group-hover:bg-amber-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-200 cursor-pointer flex items-center gap-2">
                    Add to Cart
                    <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      number: "01",
      Icon: Package,
      title: "Choose Your Box",
      description:
        "Pick your Roman pasta experience — Carbonara, Amatriciana, or Cacio e Pepe. Mix and match for the full Roman trilogy."
    },
    {
      number: "02",
      Icon: Truck,
      title: "We Deliver to Your Door",
      description:
        "Your box arrives beautifully packed with authentic DOP Italian ingredients, fresh and ready to cook."
    },
    {
      number: "03",
      Icon: Video,
      title: "Cook with the Video Guide",
      description:
        "Scan the QR code inside. Watch a step-by-step chef video and cook the real thing — exactly like a Roman would."
    }
  ];

  return (
    <section id="how-it-works" className="bg-[#F0E6D2] py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-amber-600 text-sm font-semibold tracking-widest uppercase mb-3">
            The Experience
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-[#1A0A04] mb-4">
            How It Works
          </h2>
          <p className="text-[#7A5040] text-lg max-w-lg mx-auto">
            From our box to your plate in three simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-[#D4B898]" />

          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#1A0A04] flex items-center justify-center mb-6 relative z-10 shadow-lg">
                <step.Icon
                  className="w-8 h-8 text-amber-400"
                  aria-hidden="true"
                />
              </div>
              <p className="text-amber-600 text-xs font-bold tracking-widest mb-2">
                {step.number}
              </p>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#1A0A04] mb-3">
                {step.title}
              </h3>
              <p className="text-[#7A5040] leading-relaxed text-sm max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Video Guide Feature ──────────────────────────────────────────────────────
function VideoGuide() {
  return (
    <section className="bg-[#1A0A04] py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4">
              The Sampietrino Method
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-[#FAF3E8] leading-[1.15] mb-6">
              Your Personal
              <br />
              <span className="italic text-amber-400">Roman Chef,</span>
              <br />
              On Video.
            </h2>
            <p className="text-[#B09880] leading-relaxed mb-8 text-base">
              Inside every Sampietrino box you&apos;ll find a QR code that unlocks
              an exclusive video guide. A real Roman chef walks you through
              every step — the technique, the timing, the secrets that Romans
              have passed down for generations.
            </p>
            <ul className="space-y-4">
              {[
                "Native Roman chefs, authentic techniques",
                "Filmed in Rome's historic kitchens",
                "Full HD video, available on any device",
                "Pause, rewind, cook at your pace"
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle
                    className="w-5 h-5 text-amber-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-[#C4B09A] text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Video card */}
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-[#3D1505] to-[#2C1008] rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 40%, rgba(180,80,20,0.6), transparent 60%), radial-gradient(circle at 70% 60%, rgba(120,50,10,0.4), transparent 50%)"
                }}
              />
              <button
                className="relative z-10 w-20 h-20 rounded-full bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center cursor-pointer shadow-2xl"
                aria-label="Watch preview video"
              >
                <PlayCircle className="w-10 h-10 text-white" />
              </button>
              <p className="absolute bottom-4 left-4 text-white/40 text-xs">
                Watch a preview
              </p>
            </div>

            {/* QR callout */}
            <div className="absolute -bottom-4 -right-4 bg-amber-500 text-white rounded-xl p-4 shadow-xl">
              <p className="text-xs font-bold">QR Code in every box</p>
              <p className="text-xs opacity-80 mt-0.5">Scan → Watch → Cook</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Quality ──────────────────────────────────────────────────────────────────
function Quality() {
  const items = [
    {
      Icon: Award,
      title: "DOP Certified",
      desc: "Every ingredient carries Italy's highest quality certification. Sourced directly from the producers who've been making them for centuries."
    },
    {
      Icon: MapPin,
      title: "From Rome's Markets",
      desc: "We handpick from the same suppliers that feed Rome's best trattorias — the places tourists never find but Romans eat every day."
    },
    {
      Icon: Leaf,
      title: "No Shortcuts",
      desc: "Real guanciale. Real Pecorino. Real San Marzano. No substitutes, no compromises, no supermarket stand-ins."
    },
    {
      Icon: Heart,
      title: "Made with Heart",
      desc: "Sampietrino was born from homesickness. Romans living abroad who missed the real thing — and decided to share it with you."
    }
  ];

  return (
    <section className="bg-[#FAF3E8] py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-amber-600 text-sm font-semibold tracking-widest uppercase mb-3">
            Our Promise
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-[#1A0A04] mb-4">
            Only the Real Thing
          </h2>
          <p className="text-[#7A5040] text-lg max-w-xl mx-auto">
            Sampietrino exists because we believe shortcuts have no place in
            Roman cooking.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 border border-[#E8D8C4] hover:shadow-lg transition-shadow duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FAF3E8] border border-[#E8D8C4] flex items-center justify-center mb-4">
                <Icon
                  className="w-6 h-6 text-amber-600"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-[family-name:var(--font-playfair)] font-bold text-[#1A0A04] text-lg mb-2">
                {title}
              </h3>
              <p className="text-[#7A5040] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gift Section ─────────────────────────────────────────────────────────────
function GiftSection() {
  return (
    <section id="gift" className="bg-[#2C1408] py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Gift visual */}
          <div className="order-2 md:order-1">
            <div className="aspect-square max-w-sm mx-auto bg-gradient-to-br from-[#3D1A0A] to-[#1A0A04] rounded-3xl border border-[#5A3020] flex flex-col items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px)"
                }}
              />
              <Gift
                className="w-28 h-28 text-amber-400/50 mb-4"
                aria-hidden="true"
              />
              <p className="text-amber-400 text-sm font-semibold relative z-10">
                Gift wrapping available
              </p>
              <p className="text-white/40 text-xs mt-1 relative z-10">
                With personalised note
              </p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4">
              The Perfect Gift
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-[#FAF3E8] leading-[1.15] mb-6">
              Give the Taste
              <br />
              <span className="italic text-amber-400">of Rome.</span>
            </h2>
            <p className="text-[#B09880] leading-relaxed mb-6 text-base">
              Sampietrino boxes make extraordinary gifts for food lovers, curious
              cooks, and anyone who has ever dreamed of eating in a Roman trattoria.
              Premium packaging, authentic ingredients, and an unforgettable
              experience — all in one beautiful box.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Beautiful premium packaging, ready to gift",
                "Add a personal handwritten note",
                "Send directly to the recipient",
                "Perfect for birthdays, housewarming & anniversaries"
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle
                    className="w-4 h-4 text-amber-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-[#C4B09A] text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="#boxes"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-7 py-3.5 rounded-full transition-colors duration-200 cursor-pointer"
            >
              Send as a Gift
              <Gift className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Sophie van den Berg",
    city: "Amsterdam",
    rating: 5,
    text: "I ordered the Carbonara box for date night and we were absolutely blown away. The guanciale is unlike anything I've tasted outside of Rome. The video made it so easy!"
  },
  {
    name: "Marco Janssen",
    city: "Rotterdam",
    rating: 5,
    text: "Bought the Amatriciana box as a gift for my wife. She cried. That's how good it was. We'll definitely be ordering again — the experience is truly unique."
  },
  {
    name: "Lisa de Vries",
    city: "Utrecht",
    rating: 5,
    text: "Finally something that actually tastes like my holiday in Rome. The Cacio e Pepe is deceptively simple but so perfect. The chef in the video is wonderful!"
  }
];

function Testimonials() {
  return (
    <section className="bg-[#F0E6D2] py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-amber-600 text-sm font-semibold tracking-widest uppercase mb-3">
            Reviews
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-[#1A0A04]">
            What Our Customers Say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, city, rating, text }) => (
            <div
              key={name}
              className="bg-white rounded-2xl p-6 border border-[#E8D8C4] flex flex-col"
            >
              <div className="flex gap-1 mb-4" aria-label={`${rating} out of 5 stars`}>
                {Array.from({ length: rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="text-[#3D2010] text-sm leading-relaxed mb-6 italic flex-1">
                &ldquo;{text}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-[#1A0A04] text-sm">{name}</p>
                <p className="text-[#9A7060] text-xs">{city}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Where do the ingredients come from?",
    a: "All our ingredients are sourced directly from certified Italian producers. Our guanciale comes from small artisanal producers in Lazio, our Pecorino Romano is DOP certified from Sardinia, and our pasta is made in Gragnano — the pasta capital of Italy."
  },
  {
    q: "How long do the ingredients keep?",
    a: "Our boxes are designed for cooking within 5–7 days of delivery. Cured meats like guanciale stay fresh for longer when refrigerated. Dry pasta has a shelf life of several months."
  },
  {
    q: "Is the video guide available in Dutch?",
    a: "Yes! Our video guides are available in both English and Dutch, with Italian subtitles for the full Roman atmosphere."
  },
  {
    q: "Can I order multiple boxes or mix them?",
    a: "Absolutely. You can mix and match — order one of each for a full Roman experience, or stock up on your favourite. We offer a discount on orders of 3 or more boxes."
  }
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[#FAF3E8] py-24">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-amber-600 text-sm font-semibold tracking-widest uppercase mb-3">
            Questions
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-[#1A0A04]">
            Good to Know
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E8D8C4] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
                aria-expanded={openIndex === i}
              >
                <span className="font-[family-name:var(--font-playfair)] font-semibold text-[#1A0A04] text-base group-hover:text-amber-700 transition-colors pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-amber-600 shrink-0 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5">
                  <p className="text-[#6B4A3E] leading-relaxed text-sm">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="bg-[#1A0A04] py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(180,80,20,0.2) 0%, transparent 70%)"
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,255,255,1) 29px, rgba(255,255,255,1) 30px),
            repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(255,255,255,1) 29px, rgba(255,255,255,1) 30px)
          `
        }}
      />
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4">
          Ready?
        </p>
        <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-6xl font-bold text-[#FAF3E8] mb-6 leading-[1.1]">
          Bring Rome to
          <br />
          <span className="italic text-amber-400">Your Table Tonight.</span>
        </h2>
        <p className="text-[#B09880] text-lg mb-10 leading-relaxed max-w-xl mx-auto">
          Choose your box, receive authentic Italian ingredients, and cook like
          a true Roman — guided every step of the way.
        </p>
        <a
          href="#boxes"
          className="inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-white font-bold px-10 py-5 rounded-full text-lg transition-all duration-200 cursor-pointer shadow-2xl shadow-amber-900/40"
        >
          Order Your Roman Experience
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#140802] border-t border-white/5 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
          <div className="max-w-xs">
            <Logo variant="light" />
            <p className="text-[#8A6A58] text-sm mt-3 leading-relaxed">
              A piece of Rome in the Netherlands. Authentic food experiences,
              delivered to your door.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div>
              <p className="text-[#FAF3E8] font-semibold mb-4">Shop</p>
              <ul className="space-y-2.5 text-[#8A6A58]">
                <li>
                  <a
                    href="#boxes"
                    className="hover:text-[#FAF3E8] transition-colors cursor-pointer"
                  >
                    Carbonara Box
                  </a>
                </li>
                <li>
                  <a
                    href="#boxes"
                    className="hover:text-[#FAF3E8] transition-colors cursor-pointer"
                  >
                    Amatriciana Box
                  </a>
                </li>
                <li>
                  <a
                    href="#boxes"
                    className="hover:text-[#FAF3E8] transition-colors cursor-pointer"
                  >
                    Cacio e Pepe Box
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[#FAF3E8] font-semibold mb-4">Company</p>
              <ul className="space-y-2.5 text-[#8A6A58]">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FAF3E8] transition-colors cursor-pointer"
                  >
                    Our Story
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FAF3E8] transition-colors cursor-pointer"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FAF3E8] transition-colors cursor-pointer"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[#5A3020] text-xs">
            © 2025 Sampietrino. All rights reserved.
          </p>
          <p className="text-[#5A3020] text-xs">
            Made with love in the Netherlands, with the soul of Rome.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SampietrinoPage() {
  return (
    <main className="bg-[#FAF3E8] min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustStrip />
      <Products />
      <HowItWorks />
      <VideoGuide />
      <Quality />
      <GiftSection />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
