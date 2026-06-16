import type { SVGProps } from 'react';

const Svg = (props: SVGProps<SVGSVGElement>) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props} />
);

export const ChevronDownIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
  </Svg>
);

export const ChevronRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M6.22 3.22a.749.749 0 0 1 1.06 0l4.25 4.25a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 1 1-1.06-1.06L9.939 8 6.22 4.28a.749.749 0 0 1 0-1.06Z" />
  </Svg>
);

export const GripIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M10 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM6 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
  </Svg>
);

export const SyncIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
  </Svg>
);

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
  </Svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
  </Svg>
);

export const XIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
  </Svg>
);

export const DotIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M8 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
  </Svg>
);

export const KebabIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
  </Svg>
);
