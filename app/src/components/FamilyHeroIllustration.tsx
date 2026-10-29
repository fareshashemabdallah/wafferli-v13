/** Shared responsive image treatment for Dabberna's family hero banners.
 * The artwork participates in layout: it must never float outside a shallow
 * card or be cropped by fixed, absolutely positioned dimensions.
 */
export const FAMILY_HERO_LAYOUT =
 "relative isolate grid min-h-[158px] grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center gap-2 overflow-hidden rounded-[1.7rem] border px-4 py-3 sm:min-h-[184px] sm:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] sm:gap-5 sm:px-6 sm:py-4";
export const FAMILY_HERO_TEXT = "relative z-10 min-w-0";

export function FamilyHeroIllustration({alt="",decorative=false,lazy=false}:{
 alt?:string;decorative?:boolean;lazy?:boolean;
}){
 return <div className="relative flex min-w-0 items-center justify-end self-stretch">
  <img src={import.meta.env.BASE_URL+"landing-family-characters.avif"}
   alt={decorative?"":alt} aria-hidden={decorative?true:undefined}
   className="block h-auto max-h-[136px] w-full max-w-[340px] object-contain object-center sm:max-h-[164px] sm:max-w-[380px]"
   loading={lazy?"lazy":"eager"}/>
 </div>;
}
