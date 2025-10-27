import { Check } from 'lucide-react';
import React, { useState } from 'react';
import AppNavbar from '../components/AppNavbar';
import Footer from '../components/sections/Footer';

const Pricing: React.FC = () => {
  const [yearly, setYearly] = useState(false);

  const tiers = [
    {
      name: 'Free',
      monthly: '$0',
      yearly: '$0',
      tagline: 'Kickstart your story',
      highlight: false,
      features: [
        '1 comic (8 panels) / day',
        'Community styles',
        'Basic export (PNG/PDF)'
      ],
      cta: 'Start for free',
    },
    {
      name: 'Pro',
      monthly: '$10',
      yearly: '$96',
      tagline: 'For creators who publish',
      highlight: true,
      features: [
        'Unlimited comics & panels',
        'All styles + custom refs',
        'HD export',
        'Priority queue'
      ],
      cta: 'Go Pro',
    },
    {
      name: 'Team',
      monthly: '$29',
      yearly: '$278',
      tagline: 'Collaborate with your team',
      highlight: false,
      features: [
        'Everything in Pro',
        'Team library & sharing',
        'Brand kit & presets'
      ],
      cta: 'Start team',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-blue-50/50 to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <AppNavbar />
      <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 shadow-sm dark:bg-neutral-900/60 dark:text-white dark:border-neutral-800">
            <span>Pricing</span>
          </div>
          <h1 className="mt-6 text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight dark:text-white">Simple pricing</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-neutral-400">Choose a plan that fits your storytelling</p>
          {/* Billing toggle */}
          <BillingToggle yearly={yearly} setYearly={setYearly} />
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
          {tiers.map((t) => {
            const price = yearly ? t.yearly : t.monthly;
            const unit = yearly ? '/yr' : '/mo';
            const cardBase = t.highlight
              ? 'bg-white rounded-3xl border-2 border-indigo-500 shadow-2xl shadow-indigo-200/50 dark:bg-neutral-900 dark:border-indigo-600 dark:shadow-indigo-900/30'
              : 'bg-white rounded-3xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow dark:bg-neutral-900 dark:border-neutral-800';

            return (
              <div key={t.name} className={`${cardBase} p-8 ${t.highlight ? 'pt-12' : 'pt-8'} relative flex flex-col`}>
                {t.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full bg-indigo-600 text-white shadow-lg z-10">
                    Most popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">{t.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-neutral-400">{t.tagline}</p>
                </div>
                
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-extrabold text-gray-900 tracking-tight dark:text-white">{price}</span>
                  <span className="text-gray-600 dark:text-neutral-400 font-medium">{unit}</span>
                  {t.name !== 'Free' && yearly && (
                    <span className="ml-2 text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Save 20%</span>
                  )}
                </div>

                <ul className="space-y-4 text-gray-700 mb-8 flex-grow dark:text-neutral-300">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white flex-shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-[15px]">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (t.name === 'Team') {
                      window.location.href = 'mailto:support@comicgen.ai?subject=Team Plan Inquiry';
                    } else {
                      window.location.href = '/create';
                    }
                  }}
                  className={`${t.highlight
                    ? 'w-full py-3.5 rounded-full bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl cursor-pointer dark:from-white dark:to-gray-100 dark:text-black dark:hover:from-gray-100 dark:hover:to-gray-200'
                    : 'w-full py-3.5 rounded-full bg-white border-2 border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700'}`}
                >
                  {t.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

interface BillingToggleProps {
  yearly: boolean;
  setYearly: (val: boolean) => void;
}

function BillingToggle({ yearly, setYearly }: BillingToggleProps) {
  return (
    <div className="mt-8 inline-flex items-center rounded-full border border-gray-300 bg-white p-1.5 shadow-md dark:bg-neutral-900 dark:border-neutral-700">
      <button
        onClick={() => setYearly(false)}
        className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all ${!yearly ? 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-black' : 'text-gray-700 hover:text-gray-900 dark:text-neutral-300 dark:hover:text-white'}`}
      >
        Monthly
      </button>
      <button
        onClick={() => setYearly(true)}
        className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all ${yearly ? 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-black' : 'text-gray-700 hover:text-gray-900 dark:text-neutral-300 dark:hover:text-white'}`}
      >
        Yearly
      </button>
    </div>
  );
}

export default Pricing;


