export const SHOPPING_WISHLIST_PREFERENCES_KEY="shoppingWishlistPreferences";

export type ShoppingWishlistPreferences={name:string;accent:string};

export const defaultShoppingWishlistPreferences:ShoppingWishlistPreferences={
 name:"",accent:"#EE4E8B"
};

export const shoppingWishlistSwatches=[
 {id:"pink",en:"Pink",ar:"وردي",hex:"#EE4E8B"},
 {id:"blue",en:"Blue",ar:"أزرق",hex:"#3479E6"},
 {id:"white",en:"White",ar:"أبيض",hex:"#FFFFFF"},
 {id:"purple",en:"Purple",ar:"بنفسجي",hex:"#9063D9"},
 {id:"green",en:"Green",ar:"أخضر",hex:"#39A878"},
 {id:"yellow",en:"Yellow",ar:"أصفر",hex:"#F4B536"},
 {id:"orange",en:"Orange",ar:"برتقالي",hex:"#EF883F"},
 {id:"red",en:"Red",ar:"أحمر",hex:"#D94E62"},
 {id:"teal",en:"Teal",ar:"فيروزي",hex:"#289DA5"},
 {id:"navy",en:"Navy",ar:"كحلي",hex:"#394B92"},
 {id:"lavender",en:"Lavender",ar:"لافندر",hex:"#BD8BE5"},
 {id:"black",en:"Black",ar:"أسود",hex:"#27303D"}
] as const;

export function safeWishlistAccent(raw:unknown):string{
 return typeof raw==="string"&&/^#[0-9a-fA-F]{6}$/.test(raw)?raw:defaultShoppingWishlistPreferences.accent;
}

export function wishlistTint(raw:string,opacity=0.15):string{
 const hex=safeWishlistAccent(raw);
 const c=hex.slice(1);
 const a=Math.max(0,Math.min(1,opacity));
 return `rgba(${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)},${a})`;
}

export function cleanWishlistOwner(name:string):string{
 return name.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,36);
}

export function ownerMatches(item:{recipientLabel?:string},name:string):boolean{
 const label=cleanWishlistOwner(item.recipientLabel??"").toLocaleLowerCase();
 const owner=cleanWishlistOwner(name).toLocaleLowerCase();
 // Items saved without an owner are family-wide; changing the displayed
 // child's name must never hide or rewrite existing shared shopping records.
 return label===""||label===owner;
}
