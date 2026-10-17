import {createFileRoute} from "@tanstack/react-router";
import {AppShell} from "@/components/AppShell";
import {ShoppingWishlistHome} from "@/components/ShoppingWishlistHome";

export const Route=createFileRoute("/explore/family-shop")({
 head:()=>({meta:[
  {title:"Shopping & Wishlist — Dabberna | المشتريات وقائمة الرغبات"},
  {name:"description",content:"Private family shopping lists, wishlist plans and parent-chosen color themes. No live prices or automatic purchases."}
 ]}),
 component:FamilyShoppingPage
});
function FamilyShoppingPage(){
 return <AppShell><ShoppingWishlistHome/></AppShell>;
}
