/// <reference types="vite/client" />

declare module "flubber" {
  type MorphFn = (t: number) => string;

  interface Flubber {
    interpolate: (
      from: string,
      to: string,
      options?: { maxSegmentLength?: number },
    ) => MorphFn;
  }

  const flubber: Flubber;
  export default flubber;
}
