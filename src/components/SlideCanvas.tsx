"use client";

import { useEffect, useRef, useState } from "react";
import { RATIO_SIZE } from "@/lib/data";
import { loadImage } from "@/lib/images";
import { ensureFonts, renderSlide } from "@/lib/render";
import type { Brand, Ratio, Slide } from "@/lib/types";

type Props = {
  slide: Slide;
  brand: Brand;
  ratio: Ratio;
  index: number;
  total: number;
  showNumbers: boolean;
  showHandle: boolean;
  isCarousel: boolean;
  /** resolução de desenho em px de largura (a exibição segue o CSS) */
  quality?: number;
  className?: string;
};

export default function SlideCanvas({ slide, brand, ratio, index, total, showNumbers, showHandle, isCarousel, quality = 540, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fontsReady, setFontsReady] = useState(0);
  const [images, setImages] = useState<{ image: HTMLImageElement | null; logo: HTMLImageElement | null }>({ image: null, logo: null });
  const size = RATIO_SIZE[ratio];

  useEffect(() => {
    let alive = true;
    ensureFonts(brand).then(() => alive && setFontsReady(n => n + 1));
    return () => { alive = false; };
  }, [brand]);

  const imageId = slide.background === "imagem" ? slide.imageId : null;
  useEffect(() => {
    let alive = true;
    Promise.all([loadImage(imageId), loadImage(brand.logo)]).then(([image, logo]) => alive && setImages({ image, logo }));
    return () => { alive = false; };
  }, [imageId, brand.logo]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const scale = quality / size.w;
    canvas.width = Math.round(size.w * scale);
    canvas.height = Math.round(size.h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    renderSlide(ctx, size.w, size.h, slide, { brand, index, total, showNumbers, showHandle, isCarousel, image: images.image, logo: images.logo });
  }, [slide, brand, index, total, showNumbers, showHandle, isCarousel, quality, size.w, size.h, images, fontsReady]);

  return <canvas ref={ref} className={className} style={{ aspectRatio: `${size.w} / ${size.h}` }} aria-label={slide.title.replace(/\*/g, "") || `Slide ${index + 1}`} role="img" />;
}
