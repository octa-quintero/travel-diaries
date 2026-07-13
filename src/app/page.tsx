'use client';

import { useCallback, useEffect, useState } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero';
import { TextRotate } from '@/components/ui/text-rotate';
import { TravelGallery, Lang, LANG_CYCLE } from '@/components/travel-gallery';

const heroVideos = [
  '/videos/IMG_6732.webm',
  '/videos/IMG_6857.webm',
  '/videos/IMG_9318.webm',
  '/videos/IMG_4167.webm',
];

const heroContent = {
  background: '/wallpapers/background.jpg',
  title: 'Diario de viaje',
  scrollToExpand: 'Desplazate para expandir',
};

// Pill background cycles through these on every word change. Full class
// strings so Tailwind keeps them in the build.
const pillColors = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-600',
  'bg-blue-600',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
];

// Closing headline per language. English carries the article in each word
// because "a/an" varies; Spanish/Portuguese keep the fixed "una/uma" prefix.
const closingLine: Record<Lang, { prefix: string; words: string[] }> = {
  es: {
    prefix: 'Cada viaje es una',
    words: ['aventura', 'historia', 'travesía', 'experiencia', 'memoria'],
  },
  en: {
    prefix: 'Every trip is',
    words: ['an adventure', 'a story', 'a journey', 'an experience', 'a memory'],
  },
  pt: {
    prefix: 'Cada viagem é uma',
    words: ['aventura', 'história', 'jornada', 'experiência', 'memória'],
  },
};

const contacts = [
  {
    label: '_lisandraa._',
    href: 'https://instagram.com/_lisandraa._',
    icon: '/icons/instagram.svg',
  },
  {
    label: '_dasilvamati',
    href: 'https://instagram.com/_dasilvamati',
    icon: '/icons/instagram.svg',
  },
  {
    label: '+54 3586 021006',
    href: 'https://wa.me/543586021006',
    icon: '/icons/whatssapp.svg',
    iconClass: 'h-6 w-6 mx-0.5',
  },
  {
    label: 'lisandraviaja@gmail.com',
    href: 'mailto:lisandraviaja@gmail.com',
    icon: '/icons/gmail.svg',
  },
];

export default function Home() {
  const [lang, setLang] = useState<Lang>('es');
  const [colorIndex, setColorIndex] = useState(0);

  const nextColor = useCallback(() => {
    setColorIndex((prev) => {
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * pillColors.length);
      }
      return next;
    });
  }, []);

  const cycleLang = useCallback(() => {
    setLang((prev) => {
      const nextIndex = (LANG_CYCLE.indexOf(prev) + 1) % LANG_CYCLE.length;
      return LANG_CYCLE[nextIndex];
    });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);

    const resetEvent = new Event('resetSection');
    window.dispatchEvent(resetEvent);
  }, []);

  return (
    <div className='min-h-screen'>
      {/* Rendered at page level (outside the hero's fading content wrapper)
          so it stays visible on every section, including the first */}
      <button
        type='button'
        onClick={cycleLang}
        className='fixed right-8 top-8 z-50 px-2 py-1 text-lg font-bold uppercase tracking-wide text-white mix-blend-difference transition-colors hover:text-neutral-400'
      >
        {lang}
      </button>
      <ScrollExpandMedia
        mediaType='video'
        mediaSrc={heroVideos}
        bgImageSrc={heroContent.background}
        title={heroContent.title}
        scrollToExpand={heroContent.scrollToExpand}
        textBlend
      >
        <div data-snap-section>
          <TravelGallery lang={lang} />
        </div>

        <div
          data-snap-section
          className='flex h-screen w-full flex-col items-center justify-center gap-12 px-8 md:flex-row md:gap-24'
        >
          <LayoutGroup>
            <motion.h2
              layout
              className='font-hand flex max-w-xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-4xl font-bold text-black md:text-6xl dark:text-white'
            >
              <motion.span
                layout
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              >
                {closingLine[lang].prefix}
              </motion.span>
              <TextRotate
                key={lang}
                texts={closingLine[lang].words}
                onNext={nextColor}
                mainClassName={`overflow-hidden justify-center rounded-lg ${pillColors[colorIndex]} px-3 py-1 text-white transition-colors duration-500`}
                staggerFrom='last'
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-120%' }}
                staggerDuration={0.025}
                splitLevelClassName='overflow-hidden pb-0.5'
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                rotationInterval={2500}
              />
            </motion.h2>
          </LayoutGroup>

          <div className='flex flex-col items-start gap-0.5'>
            {contacts.map(({ label, href, icon, iconClass }) => (
              <a
                key={label}
                href={href}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-base font-bold text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={icon}
                  alt=''
                  className={iconClass ?? 'h-7 w-7'}
                  aria-hidden
                />
                {label}
              </a>
            ))}
          </div>
        </div>
      </ScrollExpandMedia>
    </div>
  );
}
