import React, { useRef } from 'react';

interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
}

export const Card3DTilt: React.FC<Card3DTiltProps> = ({
  children,
  className = '',
  maxTilt = 8,
  scale = 1.015,
  glare = true,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate normalized offset from center (-1 to 1)
    const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
    const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);

    const rotateX = -mouseY * maxTilt;
    const rotateY = mouseX * maxTilt;

    const glareX = ((e.clientX - rect.left) / width) * 100;
    const glareY = ((e.clientY - rect.top) / height) * 100;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Direct DOM manipulation - 0 React re-renders for buttery 60fps performance
    animationFrameRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
        cardRef.current.style.transition = 'transform 0.08s ease-out';
      }

      if (glareRef.current && glare) {
        glareRef.current.style.background = `radial-gradient(circle at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 65%)`;
        glareRef.current.style.opacity = '1';
      }
    });
  };

  const handleMouseLeave = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      cardRef.current.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }

    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden will-change-transform ${className}`}
      style={{
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {children}

      {/* Glossy Reflection Overlay */}
      {glare && (
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 rounded-[inherit] opacity-0"
        />
      )}
    </div>
  );
};
