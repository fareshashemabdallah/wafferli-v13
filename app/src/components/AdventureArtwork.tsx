import {useId} from "react";

export type AdventurePlace="home"|"market"|"park"|"moments";
export function RobotBuddy({className="",label="Dabberna adventure guide"}:{className?:string;label?:string}){
 const id=useId().replace(/:/g,"");
 return <svg viewBox="0 0 160 175" role="img" aria-label={label} className={className} xmlns="http://www.w3.org/2000/svg">
  <defs>
   <linearGradient id={id+"shell"} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFFFFF"/><stop offset=".7" stopColor="#E9F4ED"/><stop offset="1" stopColor="#9FC5AE"/></linearGradient>
   <linearGradient id={id+"screen"} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#253E40"/><stop offset="1" stopColor="#06252D"/></linearGradient>
   <filter id={id+"shadow"} x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#174F45" floodOpacity=".22"/></filter>
  </defs>
  <g filter={`url(#${id}shadow)`}>
   <path d="M53 124Q30 122 27 141Q27 166 53 165H111Q135 164 133 144Q131 124 107 124Z" fill={`url(#${id}shell)`} stroke="#B8D9C5" strokeWidth="3"/>
   <path d="M49 129Q28 132 22 143" fill="none" stroke="#F9FFF9" strokeWidth="17" strokeLinecap="round"/>
   <path d="M110 128Q128 128 137 113" fill="none" stroke="#EAF7ED" strokeWidth="17" strokeLinecap="round"/>
   <circle cx="139" cy="111" r="10" fill="#FCFFFA" stroke="#B8D9C5" strokeWidth="2"/>
   <ellipse cx="81" cy="145" rx="15" ry="13" fill="#67C69D"/><circle cx="81" cy="145" r="7" fill="#D5FFF0"/>
   <rect x="9" y="43" width="25" height="56" rx="12" fill="#56B78D" stroke="#D9F8E8" strokeWidth="4"/>
   <rect x="127" y="43" width="25" height="56" rx="12" fill="#56B78D" stroke="#D9F8E8" strokeWidth="4"/>
   <rect x="23" y="30" width="115" height="96" rx="38" fill={`url(#${id}shell)`} stroke="#C7E1D2" strokeWidth="3"/>
   <rect x="38" y="43" width="86" height="66" rx="26" fill={`url(#${id}screen)`}/>
   <path d="M58 68Q64 58 70 68M92 68Q98 58 104 68" stroke="#93FFE0" strokeWidth="6" fill="none" strokeLinecap="round"/>
   <path d="M66 85Q80 100 96 85" stroke="#93FFE0" strokeWidth="5" fill="none" strokeLinecap="round"/>
   <circle cx="81" cy="19" r="8" fill="#61D39C" stroke="#F3FFF1" strokeWidth="3"/>
   <path d="M81 29V35" stroke="#7FBCA0" strokeWidth="6" strokeLinecap="round"/>
   <circle cx="22" cy="142" r="10" fill="#EDFBF0"/><circle cx="138" cy="111" r="5" fill="#66CCA2"/>
  </g>
 </svg>;
}

export function WorldScene({place,className=""}:{place:AdventurePlace;className?:string}){
 const id=useId().replace(/:/g,"");
 const roof=place==="market"?"#F09163":"#F08A53";
 return <svg viewBox="0 0 440 248" className={className} role="img"
  aria-label={{home:"Sunny illustrated family neighborhood",market:"Illustrated produce market stall",park:"Sunny illustrated adventure playground",moments:"Illustrated cake, presents and celebration"}[place]} xmlns="http://www.w3.org/2000/svg">
  <defs>
   <linearGradient id={id+"sky"} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#ACDBF4"/><stop offset="1" stopColor="#FFF2CB"/></linearGradient>
   <linearGradient id={id+"grass"} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#BFE5A4"/><stop offset="1" stopColor="#80B970"/></linearGradient>
   <filter id={id+"soft"} x="-20%" y="-25%" width="150%" height="170%"><feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#405B32" floodOpacity=".18"/></filter>
  </defs>
  <rect width="440" height="248" rx="18" fill={`url(#${id}sky)`}/>
  <circle cx="364" cy="43" r="27" fill="#FFF3B1" opacity=".9"/>
  <path d="M12 55Q39 19 78 47Q110 22 144 56H12Z" fill="#FFFFFF" opacity=".75"/>
  <path d="M300 79Q333 35 362 65Q391 41 430 75H300Z" fill="#FFFFFF" opacity=".7"/>
  <path d="M0 147Q110 83 204 149Q306 74 440 143V248H0Z" fill="#B5D79D"/>
  <path d="M0 183Q95 137 184 186Q300 115 440 183V248H0Z" fill={`url(#${id}grass)`}/>
  <path d="M0 222Q121 191 241 229Q341 189 440 217V248H0Z" fill="#69AE69" opacity=".6"/>
  <g fill="#417E50"><path d="M31 175V135" stroke="#806443" strokeWidth="7"/><circle cx="31" cy="126" r="23"/><circle cx="17" cy="135" r="17"/><circle cx="48" cy="139" r="17"/><path d="M401 178V127" stroke="#806443" strokeWidth="7"/><circle cx="401" cy="125" r="23"/><circle cx="388" cy="134" r="17"/><circle cx="417" cy="132" r="17"/></g>
  {place==="home"&&<g filter={`url(#${id}soft)`}>
   <rect x="129" y="91" width="183" height="128" rx="13" fill="#FFF3D6" stroke="#F6D6AC" strokeWidth="4"/>
   <path d="M112 108L219 31L330 108Q330 118 320 119H123Q110 118 112 108Z" fill={roof} stroke="#CC7042" strokeWidth="5" strokeLinejoin="round"/>
   <path d="M151 87L219 38L287 87" fill="none" stroke="#FFB786" strokeWidth="8" opacity=".7"/>
   <rect x="190" y="148" width="58" height="71" rx="20" fill="#BE7951"/><circle cx="237" cy="188" r="5" fill="#FFE4A5"/>
   <rect x="146" y="128" width="34" height="37" rx="7" fill="#90D7D9" stroke="#FFF9E8" strokeWidth="6"/>
   <rect x="264" y="128" width="34" height="37" rx="7" fill="#90D7D9" stroke="#FFF9E8" strokeWidth="6"/>
   <path d="M208 178H231" stroke="#E8B690" strokeWidth="3"/>
   <path d="M194 222Q221 232 250 221" stroke="#EFC893" strokeWidth="9" strokeLinecap="round"/>
   <circle cx="122" cy="214" r="14" fill="#F8A648"/><circle cx="308" cy="216" r="13" fill="#EEC657"/>
  </g>}
  {place==="market"&&<g filter={`url(#${id}soft)`}>
   <rect x="109" y="113" width="227" height="109" rx="9" fill="#BD8256"/>
   <rect x="98" y="104" width="246" height="30" rx="6" fill="#F9F1D9"/>
   {Array.from({length:6},(_,i)=><path key={i} d={`M${103+i*40} 104h40v20q-20 26-40 0Z`} fill={i%2?"#FFE5C3":"#E77D57"}/>)}
   <path d="M103 103L126 67H317L340 103Z" fill="#FFF0D1" stroke="#B87452" strokeWidth="4"/>
   <rect x="124" y="147" width="66" height="42" rx="9" fill="#D99654"/>
   <rect x="191" y="145" width="66" height="44" rx="9" fill="#DDA363"/>
   <rect x="262" y="147" width="62" height="42" rx="9" fill="#D99654"/>
   {Array.from({length:8},(_,i)=><circle key={i} cx={133+(i%4)*17} cy={150+Math.floor(i/4)*16} r="10" fill={i%2?"#DE533A":"#E9AC39"}/>)}
   {Array.from({length:7},(_,i)=><circle key={i} cx={208+(i%4)*13} cy={152+Math.floor(i/4)*17} r="11" fill={i%3===0?"#71B65A":"#8BD16D"}/>)}
   {Array.from({length:6},(_,i)=><ellipse key={i} cx={275+(i%3)*16} cy={151+Math.floor(i/3)*17} rx="10" ry="13" fill={i%2?"#F1B341":"#E75E42"}/>)}
   <path d="M145 187V221M298 187V221" stroke="#8F5E43" strokeWidth="7"/>
  </g>}
  {place==="park"&&<g filter={`url(#${id}soft)`}>
   <path d="M112 219V86M112 87Q181 63 208 101V215" stroke="#CE8D56" strokeWidth="11" strokeLinecap="round" fill="none"/>
   <rect x="166" y="118" width="53" height="11" rx="5" fill="#FFF6CD"/>
   <path d="M193 121L258 216H193Z" fill="#F3AF48" stroke="#E58C46" strokeWidth="3"/>
   <path d="M160 121L157 170" stroke="#E0C9A3" strokeWidth="4"/><path d="M207 121L209 170" stroke="#E0C9A3" strokeWidth="4"/>
   <rect x="143" y="172" width="78" height="9" rx="4" fill="#F28772"/>
   <path d="M91 210L119 137L147 210" stroke="#54A4B7" strokeWidth="8" fill="none" strokeLinecap="round"/>
   <path d="M275 214V135M333 214V135" stroke="#E8A15F" strokeWidth="10"/>
   <path d="M260 139Q303 80 346 139" stroke="#F1CA57" strokeWidth="13" fill="none" strokeLinecap="round"/>
   <path d="M280 150V183M327 150V183" stroke="#E9DCC4" strokeWidth="4"/>
   <rect x="272" y="181" width="64" height="11" rx="5" fill="#F38D6B"/>
   <circle cx="82" cy="211" r="11" fill="#EDC35B"/><circle cx="365" cy="210" r="10" fill="#EB906B"/>
  </g>}
  {place==="moments"&&<g filter={`url(#${id}soft)`}>
   <rect x="143" y="162" width="150" height="56" rx="20" fill="#F5AD9B" stroke="#E4877D" strokeWidth="5"/>
   <path d="M143 170Q162 153 179 170Q193 182 208 170Q225 157 242 170Q266 181 293 169" stroke="#FFF9E9" strokeWidth="12" fill="none" strokeLinecap="round"/>
   <rect x="170" y="118" width="99" height="49" rx="16" fill="#FFE2A3" stroke="#EDC576" strokeWidth="4"/>
   <path d="M173 130Q190 147 207 130Q228 148 267 130" stroke="#FFF9EB" strokeWidth="11" fill="none" strokeLinecap="round"/>
   <rect x="215" y="82" width="10" height="33" rx="3" fill="#6DC3BE"/>
   <path d="M220 83Q209 67 220 57Q232 71 220 83Z" fill="#F9B954"/>
   <rect x="75" y="176" width="62" height="49" rx="7" fill="#9FD6CF"/><path d="M105 176V224M76 197H135" stroke="#F9F3D8" strokeWidth="9"/>
   <path d="M105 176Q64 158 83 150Q102 147 105 176ZM105 176Q132 151 120 148Q102 147 105 176Z" fill="#FA92A5"/>
   <rect x="306" y="177" width="63" height="48" rx="7" fill="#E6BA6A"/><path d="M338 177V225M308 194H366" stroke="#F6E1C8" strokeWidth="9"/>
   <path d="M338 177Q309 152 318 150Q341 151 338 177ZM338 177Q364 151 357 148Q337 149 338 177Z" fill="#E57768"/>
   <circle cx="95" cy="90" r="9" fill="#ED8173"/><circle cx="330" cy="89" r="9" fill="#77C3A1"/>
   <path d="M49 56L57 72M380 67L389 48M76 99L69 115" stroke="#EFBD53" strokeWidth="6" strokeLinecap="round"/>
  </g>}
 </svg>;
}
