'use client';

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
  TouchEvent,
  WheelEvent,
} from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  // A single source, or several videos to rotate through with a crossfade
  mediaSrc: string | string[];
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

// Accumulated wheel delta needed to move to the next/previous section
const WHEEL_THRESHOLD = 60;
// Swipe distance (px) needed to move to the next/previous section
const TOUCH_THRESHOLD = 40;
// Total duration of the expand/collapse animation
const EXPAND_DURATION_MS = 2600;
// Extra time after the animation before another section change is accepted
const TRANSITION_LOCK_EXTRA_MS = 200;
// Shorter lock for section changes that only scroll the page (no media tween)
const SCROLL_ONLY_LOCK_MS = 800;
// Pause between wheel events that counts as the start of a new gesture
const WHEEL_GESTURE_RESET_MS = 300;

// Slow start, steady middle, gentle stop
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// 0: collapsed media, 1: expanded media, 2+: content sections below.
// Content sections are the children marked with [data-snap-section]; if none
// are marked, the whole content block behaves as a single section (stage 2).
type Stage = number;

const ScrollExpandMedia = ({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [stage, setStage] = useState<Stage>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);
  const [videoIndex, setVideoIndex] = useState<number>(0);

  // Normalize to an array so we can rotate through several videos
  const mediaSources = Array.isArray(mediaSrc) ? mediaSrc : [mediaSrc];
  const firstSrc = mediaSources[0];
  const currentVideoSrc = mediaSources[videoIndex] ?? firstSrc;

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<Stage>(0);
  const progressRef = useRef<number>(0);
  const tweenRef = useRef<{ from: number; to: number; start: number } | null>(
    null
  );
  const touchStartYRef = useRef<number>(0);
  const wheelAccumRef = useRef<number>(0);
  const lastWheelTimeRef = useRef<number>(0);
  const lockRef = useRef<boolean>(false);
  // True while smooth-scrolling back to the top, so the scroll lock
  // doesn't jump-cut the page to 0 mid-glide
  const returningToTopRef = useRef<boolean>(false);

  useEffect(() => {
    stageRef.current = 0;
    progressRef.current = 0;
    tweenRef.current = null;
    wheelAccumRef.current = 0;
    setScrollProgress(0);
    setStage(0);
  }, [mediaType]);

  // Tween the rendered progress toward the target over a fixed duration
  useEffect(() => {
    let frameId: number;

    const animate = (now: number) => {
      const tween = tweenRef.current;
      if (tween) {
        const t = Math.min((now - tween.start) / EXPAND_DURATION_MS, 1);
        const value = tween.from + (tween.to - tween.from) * easeInOutCubic(t);
        progressRef.current = value;
        setScrollProgress(value);
        if (t >= 1) tweenRef.current = null;
      }
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const getSections = (): HTMLElement[] => {
      const found = contentRef.current?.querySelectorAll<HTMLElement>(
        '[data-snap-section]'
      );
      return found && found.length > 0 ? Array.from(found) : [];
    };

    const goToStage = (rawNext: Stage) => {
      const sections = getSections();
      const maxStage = 1 + Math.max(sections.length, 1);
      const next = Math.min(Math.max(rawNext, 0), maxStage);
      if (next === stageRef.current) return;

      stageRef.current = next;
      setStage(next);

      const target = next >= 1 ? 1 : 0;
      const willTween = target !== progressRef.current;
      if (willTween) {
        tweenRef.current = {
          from: progressRef.current,
          to: target,
          start: performance.now(),
        };
      }

      lockRef.current = true;
      wheelAccumRef.current = 0;

      if (next >= 2) {
        const sectionEl = sections[next - 2] ?? contentRef.current;
        sectionEl?.scrollIntoView({ behavior: 'smooth' });
      } else if (window.scrollY > 5) {
        // Coming back up from the content sections: glide to the top
        returningToTopRef.current = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      const lockMs = willTween
        ? EXPAND_DURATION_MS + TRANSITION_LOCK_EXTRA_MS
        : SCROLL_ONLY_LOCK_MS;

      window.setTimeout(() => {
        lockRef.current = false;
        if (returningToTopRef.current) {
          returningToTopRef.current = false;
          window.scrollTo(0, 0);
        }
      }, lockMs);
    };

    // True if the gesture happens inside an inner scrollable element (e.g. the
    // gallery) that can still scroll in that direction, so the section snap
    // must let the native scroll happen instead of stealing it. The edge
    // tolerance absorbs the fractional offsets scroll-snap leaves behind,
    // which would otherwise swallow the gesture at the very edge forever.
    const EDGE_EPSILON = 4;
    const canInnerScroll = (
      target: EventTarget | null,
      down: boolean
    ): boolean => {
      let el = target instanceof Element ? target : null;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.scrollHeight > el.clientHeight + EDGE_EPSILON) {
          if (
            down &&
            el.scrollTop + el.clientHeight < el.scrollHeight - EDGE_EPSILON
          ) {
            return true;
          }
          if (!down && el.scrollTop > EDGE_EPSILON) return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    // A pause or a direction change starts a fresh gesture, so leftover
    // momentum from the previous scroll can't mask the new intent
    const accumulateWheel = (deltaY: number): number => {
      const now = performance.now();
      if (
        now - lastWheelTimeRef.current > WHEEL_GESTURE_RESET_MS ||
        (deltaY > 0) !== (wheelAccumRef.current > 0)
      ) {
        wheelAccumRef.current = 0;
      }
      lastWheelTimeRef.current = now;
      wheelAccumRef.current += deltaY;
      return wheelAccumRef.current;
    };

    const handleWheel = (e: WheelEvent) => {
      const stage = stageRef.current;

      if (stage < 2) {
        e.preventDefault();
        if (lockRef.current) return;

        const accum = accumulateWheel(e.deltaY);
        if (accum > WHEEL_THRESHOLD) {
          goToStage(stage + 1);
        } else if (accum < -WHEEL_THRESHOLD && stage > 0) {
          goToStage(stage - 1);
        }
      } else {
        // Let an inner scrollable (the gallery) consume the gesture first
        if (canInnerScroll(e.target, e.deltaY > 0)) return;

        e.preventDefault();
        if (lockRef.current) return;

        const accum = accumulateWheel(e.deltaY);
        if (Math.abs(accum) > WHEEL_THRESHOLD) {
          goToStage(accum > 0 ? stage + 1 : stage - 1);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartYRef.current) return;

      const stage = stageRef.current;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - touchY;

      if (stage < 2) {
        e.preventDefault();
        if (lockRef.current) return;

        if (deltaY > TOUCH_THRESHOLD) {
          goToStage(stage + 1);
          touchStartYRef.current = touchY;
        } else if (deltaY < -TOUCH_THRESHOLD && stage > 0) {
          goToStage(stage - 1);
          touchStartYRef.current = touchY;
        }
      } else {
        if (canInnerScroll(e.target, deltaY > 0)) {
          touchStartYRef.current = touchY;
          return;
        }

        e.preventDefault();
        if (lockRef.current) return;

        if (Math.abs(deltaY) > TOUCH_THRESHOLD) {
          goToStage(deltaY > 0 ? stage + 1 : stage - 1);
          touchStartYRef.current = touchY;
        }
      }
    };

    const handleTouchEnd = (): void => {
      touchStartYRef.current = 0;
    };

    const handleScroll = (): void => {
      if (stageRef.current < 2) {
        if (returningToTopRef.current) {
          if (window.scrollY <= 2) returningToTopRef.current = false;
        } else {
          window.scrollTo(0, 0);
        }
      }
    };

    window.addEventListener('wheel', handleWheel as unknown as EventListener, {
      passive: false,
    });
    window.addEventListener('scroll', handleScroll as EventListener);
    window.addEventListener(
      'touchstart',
      handleTouchStart as unknown as EventListener,
      { passive: false }
    );
    window.addEventListener(
      'touchmove',
      handleTouchMove as unknown as EventListener,
      { passive: false }
    );
    window.addEventListener('touchend', handleTouchEnd as EventListener);

    return () => {
      window.removeEventListener(
        'wheel',
        handleWheel as unknown as EventListener
      );
      window.removeEventListener('scroll', handleScroll as EventListener);
      window.removeEventListener(
        'touchstart',
        handleTouchStart as unknown as EventListener
      );
      window.removeEventListener(
        'touchmove',
        handleTouchMove as unknown as EventListener
      );
      window.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, []);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const mediaWidth = 300 + scrollProgress * (isMobileState ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobileState ? 200 : 400);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <div
      ref={sectionRef}
      className='transition-colors duration-700 ease-in-out overflow-x-hidden'
    >
      <section className='relative flex flex-col items-center justify-start min-h-[100dvh]'>
        <div className='relative w-full flex flex-col items-center min-h-[100dvh]'>
          <motion.div
            className='absolute inset-0 z-0 h-full'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <Image
              src={bgImageSrc}
              alt='Background'
              width={1920}
              height={1080}
              className='w-screen h-screen'
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              priority
            />
            <div className='absolute inset-0 bg-black/10' />
          </motion.div>

          <div className='container mx-auto flex flex-col items-center justify-start relative z-10'>
            <div className='flex flex-col items-center justify-center w-full h-[100dvh] relative'>
              <div
                className='absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl'
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                  boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.3)',
                }}
              >
                {mediaType === 'video' ? (
                  firstSrc.includes('youtube.com') ? (
                    <div className='relative w-full h-full pointer-events-none'>
                      <iframe
                        width='100%'
                        height='100%'
                        src={
                          firstSrc.includes('embed')
                            ? firstSrc +
                              (firstSrc.includes('?') ? '&' : '?') +
                              'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                            : firstSrc.replace('watch?v=', 'embed/') +
                              '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                              firstSrc.split('v=')[1]
                        }
                        className='w-full h-full rounded-xl'
                        frameBorder='0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                      />
                      <div
                        className='absolute inset-0 z-10'
                        style={{ pointerEvents: 'none' }}
                      ></div>

                      <motion.div
                        className='absolute inset-0 bg-black/30 rounded-xl'
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  ) : (
                    <div className='relative w-full h-full pointer-events-none'>
                      <AnimatePresence>
                        <motion.video
                          key={videoIndex}
                          src={currentVideoSrc}
                          poster={posterSrc}
                          autoPlay
                          muted
                          loop={mediaSources.length === 1}
                          playsInline
                          preload='auto'
                          onEnded={() =>
                            setVideoIndex(
                              (i) => (i + 1) % mediaSources.length
                            )
                          }
                          className='absolute inset-0 w-full h-full object-cover rounded-xl'
                          controls={false}
                          disablePictureInPicture
                          disableRemotePlayback
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7 }}
                        />
                      </AnimatePresence>
                      <div
                        className='absolute inset-0 z-10'
                        style={{ pointerEvents: 'none' }}
                      ></div>

                      <motion.div
                        className='absolute inset-0 bg-black/30 rounded-xl'
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )
                ) : (
                  <div className='relative w-full h-full'>
                    <Image
                      src={firstSrc}
                      alt={title || 'Media content'}
                      width={1280}
                      height={720}
                      className='w-full h-full object-cover rounded-xl'
                    />

                    <motion.div
                      className='absolute inset-0 bg-black/50 rounded-xl'
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}

                <div className='flex flex-col items-center text-center relative z-10 mt-4 transition-none'>
                  {date && (
                    <p
                      className='font-hand text-3xl text-blue-200'
                      style={{ transform: `translateX(-${textTranslateX}vw)` }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className='font-sans text-lg text-blue-200 text-center'
                      style={{ transform: `translateX(${textTranslateX}vw)` }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                  {scrollToExpand && (
                    <motion.div
                      className='mt-2 text-blue-200'
                      animate={{ y: [0, 10, 0] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{ opacity: 1 - scrollProgress * 2 }}
                    >
                      <svg
                        width='30'
                        height='30'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        aria-hidden
                      >
                        <path d='M6 9l6 6 6-6' />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </div>

              <div
                className={`flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col ${
                  textBlend ? 'mix-blend-difference' : 'mix-blend-normal'
                }`}
              >
                <motion.h2
                  className='font-amsterdam text-5xl md:text-6xl lg:text-7xl text-blue-200 transition-none'
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </motion.h2>
                <motion.h2
                  className='font-amsterdam text-5xl md:text-6xl lg:text-7xl text-center text-blue-200 transition-none'
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </motion.h2>
              </div>
            </div>

            <motion.section
              ref={contentRef}
              className='flex flex-col w-full'
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 2 ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
