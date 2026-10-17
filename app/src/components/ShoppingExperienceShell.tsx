import type {ReactNode} from "react";
import {UnifiedFamilyShell} from "./UnifiedFamilyShell";

/** Shopping is part of Dabberna, not an independent application.
 * Keep its existing public component name and all the underlying shopping data.
 */
export function ShoppingExperienceShell({children}:{children:ReactNode}){
 return <UnifiedFamilyShell shopping>{children}</UnifiedFamilyShell>;
}
