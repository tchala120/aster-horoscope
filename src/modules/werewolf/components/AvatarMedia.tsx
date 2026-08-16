import Image from "next/image";
import { avatarVideoFor } from "../avatar-media";

export function AvatarMedia({
  avatar,
  sizes,
  className = "object-cover object-top",
  alt = "",
}: {
  avatar: string;
  sizes: string;
  className?: string;
  alt?: string;
}) {
  const video = avatarVideoFor(avatar);
  if (video) {
    return (
      <video
        key={video}
        src={video}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    );
  }

  return <Image src={avatar} alt={alt} fill sizes={sizes} className={className} />;
}
