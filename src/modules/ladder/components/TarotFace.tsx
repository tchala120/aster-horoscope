"use client";

import Image from "next/image";

interface TarotFaceProps {
  rank: number;
  name: string;
  image: string;
}

/** A tarot card face: artwork, name, and its rank badge (0–21). Presentational. */
export function TarotFace({ rank, name, image }: TarotFaceProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-grey-900 ring-1 ring-white/16 shadow-xl">
      <Image src={image} alt={name} fill sizes="12rem" className="object-cover" />
      <span className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-grey-950/80 text-text-md font-bold text-aster-teal-300 ring-1 ring-white/20">
        {rank}
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-grey-950/95 to-transparent p-2 pt-7 text-center">
        <p className="truncate text-text-sm font-semibold text-grey-50">{name}</p>
      </div>
    </div>
  );
}
