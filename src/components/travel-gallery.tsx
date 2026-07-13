'use client';

import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import {
  Castle,
  Landmark,
  Mountain,
  Music,
  UtensilsCrossed,
  Waves,
} from 'lucide-react';

import { TextRotate, TextRotateRef } from '@/components/ui/text-rotate';

export type Lang = 'es' | 'en' | 'pt';

// Cycle order for the single toggle button: ES -> PT -> EN -> ES
export const LANG_CYCLE: Lang[] = ['es', 'pt', 'en'];

interface LabeledItem {
  label: string;
  text: string;
}

interface ProfileContent {
  title: string;
  meta: string;
  caption: string;
  sections: LabeledItem[];
}

interface GalleryContent {
  intro: { title: string; caption: string; p1: string; p2: string };
  matias: ProfileContent;
  lisandra: ProfileContent;
  experiences: {
    title: string;
    caption: string;
    intro: string;
    items: LabeledItem[];
  };
  hands: { title: string; caption: string; items: LabeledItem[] };
  interests: { title: string; caption: string; labels: string[] };
  preferences: {
    title: string;
    caption: string;
    columns: { name: string; items: string[] }[];
  };
  closing: { title: string; caption: string; text: string; cta: string };
}

const content: Record<Lang, GalleryContent> = {
  es: {
    intro: {
      title: 'Hola, somos Lisandra y Matías',
      caption: 'Porto de Galinhas',
      p1: 'Una profe de música argentina y un cocinero uruguayo dando vueltas por Brasil, con el mate siempre a mano.',
      p2: 'Él cocina, ella charla con todo el mundo, y entre los dos le encontramos la vuelta a cualquier cosa. Nos gusta llegar a un lugar nuevo y sentirnos como en casa.',
    },
    matias: {
      title: 'Matías',
      meta: 'Uruguayo · 29 años · Cocinero',
      caption: 'Río de Janeiro',
      sections: [
        {
          label: 'Sobre mí',
          text: 'Realicé mis estudios de gastronomía y me formé como cocinero y panadero en Uruguay. Viajé por Brasil conociendo varios estados y viví un año en Florianópolis.',
        },
        {
          label: 'Pasatiempos',
          text: 'Actualmente dedico mucho tiempo al surf y al deporte, también me gusta hacer música (actividad a la cual me dediqué varios años) y cocinar.',
        },
        {
          label: 'Habilidades',
          text: 'Considero que soy una persona disciplinada, comprometida, exigente y responsable en cualquier área en la que me vea involucrado.',
        },
        {
          label: 'Idiomas',
          text: 'Español nativo, portugués fluido, inglés principiante.',
        },
      ],
    },
    lisandra: {
      title: 'Lisandra',
      meta: 'Argentina · 26 años · Profesora de música',
      caption: 'Entre peces',
      sections: [
        {
          label: 'Sobre mí',
          text: 'Me formé como docente de música en Argentina y al finalizar mis estudios comencé a viajar por Brasil haciendo voluntariados. Hoy trabajo de manera remota dando clases de portugués online.',
        },
        {
          label: 'Pasatiempos',
          text: 'Mis pasatiempos favoritos son conocer lugares nuevos, aprender idiomas, sacar fotos y mirar series.',
        },
        {
          label: 'Habilidades',
          text: 'Destaco mi capacidad para conversar y relacionarme con las personas, es algo que me encanta y se me da de manera natural; también remarco mi nivel de organización y compromiso.',
        },
        {
          label: 'Idiomas',
          text: 'Español nativo, portugués fluido, inglés avanzado.',
        },
      ],
    },
    experiences: {
      title: 'Nuestras experiencias',
      caption: 'Maragogi',
      intro:
        'Pasamos por varios hostels de Brasil y nos llevamos experiencia de todas estas áreas:',
      items: [
        {
          label: 'Recepción y administración',
          text: 'recibimos y atendemos a los **huéspedes**, desde el **check-in** hasta la despedida.',
        },
        {
          label: 'Redes sociales',
          text: 'cuidamos las redes de los hostels, **creando contenido** y **respondiendo a los clientes**.',
        },
        {
          label: 'Desayunos',
          text: 'preparamos y servimos el **desayuno** para todos los huéspedes.',
        },
      ],
    },
    hands: {
      title: 'Manos a la obra',
      caption: 'Entre rocas',
      items: [
        {
          label: 'Limpieza',
          text: 'preparamos las camas y limpiamos las áreas comunes del hostel.',
        },
        {
          label: 'Construcción y mantenimiento',
          text: 'construimos escaleras, decks y decoraciones en madera.',
        },
        {
          label: 'Jardinería',
          text: 'cuidamos las plantas y los espacios exteriores.',
        },
      ],
    },
    interests: {
      title: 'Nuestros intereses',
      caption: 'Caminho de Moisés',
      labels: [
        'Playas y surf',
        'Senderismo',
        'Ciudades históricas',
        'Museos',
        'Música',
        'Gastronomía',
      ],
    },
    preferences: {
      title: 'Nuestras preferencias',
      caption: 'Piscinas naturales',
      columns: [
        {
          name: 'Matías',
          items: [
            'Preparación de desayunos',
            'Recepción nocturna',
            'Jardinería',
            'Limpieza',
          ],
        },
        {
          name: 'Lisandra',
          items: [
            'Recepción y administración',
            'Redes sociales',
            'Enseñanza de idiomas',
            'Limpieza',
          ],
        },
      ],
    },
    closing: {
      title: '¿Viajamos juntos?',
      caption: 'Con amigos',
      text: 'Gracias por conocernos un poco. Nos encanta vivir nuevas experiencias, sumar gente linda al camino y dar lo mejor de nosotros en cada lugar al que llegamos.',
      cta: 'Si buscás un equipo con ganas, escribinos. ¡Nos vemos pronto!',
    },
  },
  en: {
    intro: {
      title: "Hi, we're Lisandra and Matías",
      caption: 'Porto de Galinhas',
      p1: 'An Argentine music teacher and a Uruguayan cook wandering around Brazil, mate always at hand.',
      p2: 'He cooks, she chats with everyone, and between the two of us we can figure anything out. We love arriving somewhere new and feeling right at home.',
    },
    matias: {
      title: 'Matías',
      meta: 'Uruguayan · 29 years old · Cook',
      caption: 'Rio de Janeiro',
      sections: [
        {
          label: 'About me',
          text: 'I studied gastronomy and trained as a cook and baker in Uruguay. I traveled around Brazil getting to know several states and lived in Florianópolis for a year.',
        },
        {
          label: 'Hobbies',
          text: 'These days I spend a lot of time surfing and doing sports; I also enjoy making music (something I dedicated several years to) and cooking.',
        },
        {
          label: 'Skills',
          text: 'I consider myself disciplined, committed, demanding and responsible in any area I get involved in.',
        },
        {
          label: 'Languages',
          text: 'Native Spanish, fluent Portuguese, beginner English.',
        },
      ],
    },
    lisandra: {
      title: 'Lisandra',
      meta: 'Argentine · 26 years old · Music teacher',
      caption: 'Among the fish',
      sections: [
        {
          label: 'About me',
          text: 'I trained as a music teacher in Argentina, and after finishing my studies I started traveling around Brazil doing volunteer work. Today I work remotely teaching Portuguese online.',
        },
        {
          label: 'Hobbies',
          text: 'My favorite hobbies are discovering new places, learning languages, taking photos and watching series.',
        },
        {
          label: 'Skills',
          text: "I stand out for my ability to talk and connect with people — it's something I love and comes naturally to me; I'd also highlight my organization and commitment.",
        },
        {
          label: 'Languages',
          text: 'Native Spanish, fluent Portuguese, advanced English.',
        },
      ],
    },
    experiences: {
      title: 'Our experience',
      caption: 'Maragogi',
      intro:
        "We've worked at several hostels around Brazil and picked up experience in all of these areas:",
      items: [
        {
          label: 'Reception & admin',
          text: 'we welcome and look after **guests**, from **check-in** to farewell.',
        },
        {
          label: 'Social media',
          text: "we run the hostels' accounts, **creating content** and **replying to clients**.",
        },
        {
          label: 'Breakfast',
          text: 'we prepare and serve **breakfast** for all the guests.',
        },
      ],
    },
    hands: {
      title: 'Hands-on work',
      caption: 'Among the rocks',
      items: [
        {
          label: 'Cleaning',
          text: "we make the beds and clean the hostel's common areas.",
        },
        {
          label: 'Building & maintenance',
          text: 'we build stairs, decks and wooden decorations.',
        },
        {
          label: 'Gardening',
          text: 'we look after the plants and outdoor spaces.',
        },
      ],
    },
    interests: {
      title: 'Our interests',
      caption: 'Caminho de Moisés',
      labels: [
        'Beaches & surf',
        'Hiking',
        'Historic towns',
        'Museums',
        'Music',
        'Food',
      ],
    },
    preferences: {
      title: 'Our preferences',
      caption: 'Natural pools',
      columns: [
        {
          name: 'Matías',
          items: [
            'Breakfast preparation',
            'Night reception',
            'Gardening',
            'Cleaning',
          ],
        },
        {
          name: 'Lisandra',
          items: [
            'Reception & admin',
            'Social media',
            'Language teaching',
            'Cleaning',
          ],
        },
      ],
    },
    closing: {
      title: 'Shall we travel together?',
      caption: 'With friends',
      text: 'Thanks for getting to know us a little. We love living new experiences, meeting lovely people along the way, and giving our best wherever we go.',
      cta: "If you're looking for a team that truly cares, drop us a line. See you soon!",
    },
  },
  pt: {
    intro: {
      title: 'Oi, somos Lisandra e Matías',
      caption: 'Porto de Galinhas',
      p1: 'Uma professora de música argentina e um cozinheiro uruguaio rodando pelo Brasil, com o mate sempre à mão.',
      p2: 'Ele cozinha, ela conversa com todo mundo, e juntos damos um jeito em qualquer coisa. Adoramos chegar num lugar novo e nos sentir em casa.',
    },
    matias: {
      title: 'Matías',
      meta: 'Uruguaio · 29 anos · Cozinheiro',
      caption: 'Rio de Janeiro',
      sections: [
        {
          label: 'Sobre mim',
          text: 'Estudei gastronomia e me formei como cozinheiro e padeiro no Uruguai. Viajei pelo Brasil conhecendo vários estados e morei um ano em Florianópolis.',
        },
        {
          label: 'Passatempos',
          text: 'Hoje dedico muito tempo ao surfe e ao esporte; também gosto de fazer música (atividade à qual me dediquei vários anos) e cozinhar.',
        },
        {
          label: 'Habilidades',
          text: 'Me considero uma pessoa disciplinada, comprometida, exigente e responsável em qualquer área em que eu esteja envolvido.',
        },
        {
          label: 'Idiomas',
          text: 'Espanhol nativo, português fluente, inglês iniciante.',
        },
      ],
    },
    lisandra: {
      title: 'Lisandra',
      meta: 'Argentina · 26 anos · Professora de música',
      caption: 'Entre peixes',
      sections: [
        {
          label: 'Sobre mim',
          text: 'Me formei como professora de música na Argentina e, ao terminar os estudos, comecei a viajar pelo Brasil fazendo trabalhos voluntários. Hoje trabalho remotamente dando aulas de português online.',
        },
        {
          label: 'Passatempos',
          text: 'Meus passatempos favoritos são conhecer lugares novos, aprender idiomas, tirar fotos e assistir séries.',
        },
        {
          label: 'Habilidades',
          text: 'Destaco minha facilidade para conversar e me relacionar com as pessoas — é algo que adoro e me sai naturalmente; também ressalto minha organização e compromisso.',
        },
        {
          label: 'Idiomas',
          text: 'Espanhol nativo, português fluente, inglês avançado.',
        },
      ],
    },
    experiences: {
      title: 'Nossas experiências',
      caption: 'Maragogi',
      intro:
        'Passamos por vários hostels do Brasil e levamos experiência de todas essas áreas:',
      items: [
        {
          label: 'Recepção e administração',
          text: 'recebemos e atendemos os **hóspedes**, do **check-in** à despedida.',
        },
        {
          label: 'Redes sociais',
          text: 'cuidamos das redes dos hostels, **criando conteúdo** e **respondendo aos clientes**.',
        },
        {
          label: 'Cafés da manhã',
          text: 'preparamos e servimos o **café da manhã** para todos os hóspedes.',
        },
      ],
    },
    hands: {
      title: 'Mão na massa',
      caption: 'Entre as pedras',
      items: [
        {
          label: 'Limpeza',
          text: 'arrumamos as camas e limpamos as áreas comuns do hostel.',
        },
        {
          label: 'Construção e manutenção',
          text: 'construímos escadas, decks e decorações em madeira.',
        },
        {
          label: 'Jardinagem',
          text: 'cuidamos das plantas e dos espaços externos.',
        },
      ],
    },
    interests: {
      title: 'Nossos interesses',
      caption: 'Caminho de Moisés',
      labels: [
        'Praias e surfe',
        'Trilhas',
        'Cidades históricas',
        'Museus',
        'Música',
        'Gastronomia',
      ],
    },
    preferences: {
      title: 'Nossas preferências',
      caption: 'Piscinas naturais',
      columns: [
        {
          name: 'Matías',
          items: [
            'Preparo de cafés da manhã',
            'Recepção noturna',
            'Jardinagem',
            'Limpeza',
          ],
        },
        {
          name: 'Lisandra',
          items: [
            'Recepção e administração',
            'Redes sociais',
            'Ensino de idiomas',
            'Limpeza',
          ],
        },
      ],
    },
    closing: {
      title: 'Vamos juntos?',
      caption: 'Com amigos',
      text: 'Obrigado por nos conhecer um pouco. Adoramos viver novas experiências, conhecer gente bacana pelo caminho e dar o nosso melhor em cada lugar aonde chegamos.',
      cta: 'Se você procura uma equipe com vontade, escreva pra gente. Até logo!',
    },
  },
};

const chipStyles = [
  {
    Icon: Waves,
    className:
      'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  {
    Icon: Mountain,
    className:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  {
    Icon: Castle,
    className:
      'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  {
    Icon: Landmark,
    className:
      'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  },
  {
    Icon: Music,
    className:
      'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  {
    Icon: UtensilsCrossed,
    className:
      'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
];

// Renders **bold** segments inside translated strings
const renderBold = (text: string): ReactNode =>
  text.split('**').map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className='font-semibold'>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );

interface Slide {
  url: string;
  caption: string;
  title: string;
  body: ReactNode;
}

const profileBody = (profile: ProfileContent): ReactNode => (
  <div className='space-y-3'>
    <p className='text-center text-neutral-500 dark:text-neutral-400'>
      {profile.meta}
    </p>
    {profile.sections.map(({ label, text }) => (
      <p key={label}>
        <span className='font-semibold'>{label}: </span>
        {renderBold(text)}
      </p>
    ))}
  </div>
);

const labeledListBody = (items: LabeledItem[], intro?: string): ReactNode => (
  <div className='space-y-3'>
    {intro && <p>{intro}</p>}
    <ul className='space-y-2'>
      {items.map(({ label, text }) => (
        <li key={label}>
          <span className='font-semibold'>{label}: </span>
          {renderBold(text)}
        </li>
      ))}
    </ul>
  </div>
);

const buildSlides = (t: GalleryContent): Slide[] => [
  {
    url: '/galery/image%201.jpeg',
    caption: t.intro.caption,
    title: t.intro.title,
    body: (
      <div className='space-y-3 text-center'>
        <p>{t.intro.p1}</p>
        <p>{t.intro.p2}</p>
      </div>
    ),
  },
  {
    url: '/galery/image%204.jpeg',
    caption: t.matias.caption,
    title: t.matias.title,
    body: profileBody(t.matias),
  },
  {
    url: '/galery/image%206.jpeg',
    caption: t.lisandra.caption,
    title: t.lisandra.title,
    body: profileBody(t.lisandra),
  },
  {
    url: '/galery/image%203.jpeg',
    caption: t.experiences.caption,
    title: t.experiences.title,
    body: labeledListBody(t.experiences.items, t.experiences.intro),
  },
  {
    url: '/galery/image%207.jpeg',
    caption: t.hands.caption,
    title: t.hands.title,
    body: labeledListBody(t.hands.items),
  },
  {
    url: '/galery/image%205.jpeg',
    caption: t.interests.caption,
    title: t.interests.title,
    body: (
      <div className='flex flex-wrap justify-center gap-2.5'>
        {t.interests.labels.map((label, i) => {
          const { Icon, className } = chipStyles[i % chipStyles.length];
          return (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-medium shadow-sm ${className}`}
            >
              <Icon className='h-4 w-4' aria-hidden />
              {label}
            </span>
          );
        })}
      </div>
    ),
  },
  {
    url: '/galery/image%202.jpeg',
    caption: t.preferences.caption,
    title: t.preferences.title,
    body: (
      <div className='grid grid-cols-2 gap-6'>
        {t.preferences.columns.map(({ name, items }) => (
          <div key={name}>
            <h4 className='mb-2 text-center font-bold'>{name}</h4>
            <ul className='space-y-1 text-center'>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
  },
  {
    url: '/galery/image%208.jpeg',
    caption: t.closing.caption,
    title: t.closing.title,
    body: (
      <div className='space-y-5 text-center'>
        <p>{t.closing.text}</p>
        <p className='font-hand text-2xl leading-snug text-sky-600 sm:text-3xl dark:text-sky-400'>
          {t.closing.cta}
        </p>
        <p className='text-2xl' aria-hidden>
          ✈️ 🌎 💛
        </p>
      </div>
    ),
  },
];

function GalleryItem({
  index,
  image,
  caption,
  onInView,
}: {
  index: number;
  image: string;
  caption: string;
  onInView: (index: number, inView: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    margin: '-45% 0px -45% 0px',
  });

  useEffect(() => {
    onInView(index, isInView);
  }, [index, isInView, onInView]);

  return (
    <div
      ref={ref}
      className='h-full w-full md:w-1/2 flex justify-center items-start md:items-center snap-center'
    >
      {/* Mobile: photo sits at the bottom of the top 40%, close to the text.
          Desktop: photo centered in its left half. */}
      <div className='h-[40vh] md:h-auto flex items-end md:items-center justify-center pb-2 md:pb-0'>
        <div
          className={`bg-white p-2.5 sm:p-4 shadow-2xl rounded-sm ${
            index % 2 === 0 ? 'rotate-2' : '-rotate-2'
          }`}
        >
          <div className='w-56 h-56 sm:w-72 sm:h-72 md:w-[22rem] md:h-[22rem] lg:w-96 lg:h-96 overflow-hidden'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={`${caption} (${index + 1})`}
              className='w-full h-full object-cover'
            />
          </div>
          <p className='font-hand mt-2 mb-0.5 sm:mt-4 text-center text-neutral-700 text-base sm:text-2xl'>
            {caption}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TravelGallery({ lang }: { lang: Lang }) {
  const textRotateRef = useRef<TextRotateRef>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = useMemo(() => buildSlides(content[lang]), [lang]);

  const handleInView = useCallback((index: number, inView: boolean) => {
    if (inView) {
      textRotateRef.current?.jumpTo(index);
      setActiveIndex(index);
    }
  }, []);

  return (
    <div className='w-full h-screen flex'>
      <div className='w-full h-full relative'>
        <div className='sticky top-0 h-screen w-full flex items-end justify-center md:items-center md:justify-end text-black dark:text-white'>
          {/* Mobile: text fills the bottom 60%, starting near the photo.
              Desktop: text sits in the right half, centered. */}
          <div className='h-[60vh] md:h-auto w-full md:w-1/2 flex flex-col items-center justify-start md:justify-center pt-3 md:pt-0 px-6 md:px-10'>
            <TextRotate
              ref={textRotateRef}
              texts={slides.map((slide) => slide.title)}
              mainClassName='font-hand text-2xl sm:text-4xl md:text-5xl font-bold w-full justify-center flex pt-2'
              splitLevelClassName='overflow-hidden pb-2'
              staggerFrom={'first'}
              animatePresenceMode='wait'
              loop={false}
              auto={false}
              staggerDuration={0.005}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', duration: 0.6, bounce: 0 }}
            />
            <AnimatePresence mode='wait'>
              <motion.div
                key={`${lang}-${activeIndex}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
                className='mt-4 md:mt-6 w-full max-w-md text-xs sm:text-sm md:text-base text-neutral-700 dark:text-neutral-300'
              >
                {slides[activeIndex].body}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className='absolute inset-0 overflow-auto overscroll-contain snap-y snap-mandatory'>
          {slides.map((slide, index) => (
            <GalleryItem
              key={index}
              index={index}
              image={slide.url}
              caption={slide.caption}
              onInView={handleInView}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
