'use client';
import { useEffect, useState, type SVGProps } from 'react';

type FittedSvgTextProps = Omit<SVGProps<SVGTextElement>, 'children' | 'fontSize'> & {
  children: string;
  fontSize: number;
  maxWidth: number;
};

export function FittedSvgText({ children, fontSize, maxWidth, fontWeight = 400, ...attributes }: FittedSvgTextProps) {
  const [size, setSize] = useState(fontSize);
  useEffect(() => {
    let active = true;
    async function fit() {
      await document.fonts.ready;
      const context = document.createElement('canvas').getContext('2d');
      if (!active || !context) return;
      context.font = `${fontWeight} ${fontSize}px Bangla`;
      const width = context.measureText(children).width;
      setSize(width > maxWidth ? fontSize * maxWidth / width : fontSize);
    }
    void fit();
    return () => { active = false; };
  }, [children, fontSize, fontWeight, maxWidth]);
  return <text {...attributes} fontFamily="Bangla" fontSize={size} fontWeight={fontWeight}>{children}</text>;
}
