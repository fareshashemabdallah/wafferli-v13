import type {PlayCategory} from "@/lib/weeklyPlay";

/** Lightweight, local SVG illustrations: one recognizable scene for each game,
 * no image downloads, tracking pixels, third-party assets or new dependencies. */
function Child({x,y,shirt="#F19D82",pose="wave",small=false}:{
 x:number;y:number;shirt?:string;pose?:"wave"|"dance"|"stand"|"clap"|"reach";small?:boolean
}){
 const arms=pose==="dance"?"M-12 43L-29 25M12 43L28 27":
  pose==="clap"?"M-12 43L-2 30M12 43L2 30":
  pose==="reach"?"M-12 43L-27 32M12 43L26 20":
  pose==="stand"?"M-12 43L-19 65M12 43L19 65":"M-12 43L-23 55M12 43L27 24";
 const legs=pose==="dance"?"M-7 68L-22 87M7 68L21 84":"M-7 68L-10 90M7 68L13 90";
 return <g transform={"translate("+x+" "+y+")"+(small?" scale(.74)":"")}>
  <path d={legs} stroke="#546B79" strokeWidth="8" strokeLinecap="round"/>
  <path d={arms} stroke="#E9A578" strokeWidth="8" strokeLinecap="round"/>
  <path d="M-14 42Q0 32 14 42L17 68Q0 73-17 68Z" fill={shirt}/>
  <circle cx="0" cy="19" r="17" fill="#F4C59D"/>
  <path d="M-17 18Q-16-2 0 2Q19 2 17 18Q9 7 1 10Q-8 17-17 18" fill="#594D51"/>
  <circle cx="-6" cy="20" r="1.8" fill="#4B4948"/><circle cx="6" cy="20" r="1.8" fill="#4B4948"/>
  <path d="M-4 27Q0 31 5 27" fill="none" stroke="#9E6160" strokeWidth="1.9" strokeLinecap="round"/>
 </g>;
}
function Toy({x,y,color="#EBA574",shape="bear"}:{x:number;y:number;color?:string;shape?:"bear"|"cube"|"ball"}){
 return <g transform={"translate("+x+" "+y+")"}>
  {shape==="bear"?<><circle cx="-9" cy="-8" r="7" fill={color}/><circle cx="9" cy="-8" r="7" fill={color}/>
   <circle cy="2" r="17" fill={color}/><circle cx="-6" cy="0" r="1.8" fill="#4C4D4C"/><circle cx="6" cy="0" r="1.8" fill="#4C4D4C"/>
   <path d="M-3 8Q0 11 3 8" stroke="#765B57" strokeWidth="2" fill="none"/></>:
   shape==="ball"?<><circle r="16" fill={color}/><path d="M-13-6Q0 3 12 9M0-15Q-7 1 4 15" stroke="#FFF8EF" strokeWidth="3" fill="none"/></>:
   <><rect x="-15" y="-15" width="30" height="30" rx="5" fill={color}/><path d="M-15-3L0 5 15-3M0 5V15" stroke="#FFF9F0" strokeWidth="2" fill="none"/></>}
 </g>;
}
function Book({x=90,y=84}:{x?:number;y?:number}){
 return <g transform={"translate("+x+" "+y+")"}>
  <path d="M-61-31Q-27-45 0-25Q27-45 61-31V29Q24 16 0 36Q-24 16-61 29Z" fill="#FFFFFF" stroke="#B9A1CC" strokeWidth="4" strokeLinejoin="round"/>
  <path d="M0-24V35M-46-12Q-24-18-9-8M-46 1Q-27-6-9 5M14-11Q33-17 46-9M14 4Q34-1 47 5" stroke="#D2C3DD" strokeWidth="3" strokeLinecap="round" fill="none"/>
 </g>;
}
function SoundWaves({x,y}:{x:number;y:number}){
 return <g transform={"translate("+x+" "+y+")"} fill="none" stroke="#976ABE" strokeWidth="4" strokeLinecap="round">
  <path d="M0-11Q13 0 0 11M8-20Q30 0 8 20"/>
 </g>;
}
function Scene({id}:{id:string}){
 switch(id){
 case "peekaboo": return <><Child x={83} y={40} shirt="#B8A3DC" pose="clap"/><Child x={162} y={72} shirt="#8CCDB5" small pose="wave"/><path d="M120 46Q136 35 150 44" stroke="#E6A75E" strokeWidth="4" fill="none"/><circle cx="149" cy="40" r="4" fill="#E6A75E"/></>;
 case "find-the-sound": return <><Child x={75} y={50} shirt="#9AD9C1" small pose="reach"/><path d="M151 42L162 63H132Z" fill="#F9C86C" stroke="#C49B4D" strokeWidth="3" strokeLinejoin="round"/><circle cx="146" cy="67" r="5" fill="#DDAE57"/><SoundWaves x={165} y={52}/></>;
 case "freeze": return <><Child x={80} y={45} shirt="#E9A0A4" pose="dance"/><Child x={161} y={48} shirt="#A2CFA8" pose="dance"/><path d="M115 36V13L129 9V30" stroke="#8E77B8" strokeWidth="4" fill="none"/><circle cx="112" cy="36" r="6" fill="#8E77B8"/><circle cx="126" cy="30" r="6" fill="#8E77B8"/></>;
 case "whats-missing": return <><rect x="30" y="96" width="180" height="32" rx="12" fill="#DFCFB3"/><Toy x={66} y={93} shape="bear" color="#DDA589"/><Toy x={120} y={93} shape="cube" color="#8DCBBF"/><path d="M155 76Q181 66 194 83L183 114H155Z" fill="#C6B1DF"/><text x="172" y="99" textAnchor="middle" fill="#FFF" fontSize="25" fontWeight="bold">?</text></>;
 case "colour-hunt": return <><rect x="37" y="53" width="42" height="44" rx="8" fill="#E6A2A9"/><rect x="85" y="47" width="42" height="50" rx="8" fill="#F1C371"/><rect x="133" y="58" width="42" height="39" rx="8" fill="#9BC9B6"/><circle cx="148" cy="70" r="32" stroke="#8172AC" strokeWidth="8" fill="#FFF" fillOpacity=".26"/><path d="M170 91L194 116" stroke="#8172AC" strokeWidth="10" strokeLinecap="round"/></>;
 case "backwards-clues": return <><Child x={120} y={48} shirt="#B5A1DD" pose="wave"/><path d="M40 59H80M68 46L80 59 68 72M200 90H158M171 77L158 90 171 102" stroke="#E49B78" fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/></>;
 case "memory-route": return <><path d="M49 118Q54 43 109 78T193 34" stroke="#9E84C1" strokeDasharray="5 9" strokeWidth="7" strokeLinecap="round" fill="none"/><circle cx="49" cy="116" r="16" fill="#E5A5A8"/><circle cx="109" cy="78" r="13" fill="#98CBB6"/><circle cx="193" cy="34" r="15" fill="#EEC36E"/><path d="M42 116H57M102 78H116M186 34H200" stroke="#FFF" strokeWidth="3"/></>;
 case "soft-scarf": return <><Child x={85} y={66} shirt="#B6D7C4" small pose="reach"/><path d="M123 52Q148 13 167 41T206 34Q187 88 162 66T123 52" fill="#E6ACBE" stroke="#C987A8" strokeWidth="3"/></>;
 case "gentle-reach": return <><Child x={86} y={64} shirt="#F2B8A0" small pose="reach"/><Toy x={172} y={57} shape="bear" color="#DAB890"/><path d="M128 65L142 60" stroke="#9EBD9F" strokeWidth="3" strokeDasharray="4 5"/></>;
 case "animal-parade": return <><Child x={80} y={54} shirt="#95C8AC" pose="dance"/><Toy x={172} y={82} color="#CAAD88" shape="bear"/><path d="M144 126Q132 117 139 111Q146 108 149 115Q159 107 166 116Q173 127 161 131Z" fill="#B796BD"/></>;
 case "mirror-moves": return <><Child x={69} y={46} shirt="#E9A2A1" pose="dance"/><Child x={171} y={46} shirt="#8FCBB2" pose="dance"/><path d="M120 36V130" stroke="#B6A7C2" strokeWidth="4" strokeDasharray="7 7"/><path d="M106 37L120 24 134 37" fill="none" stroke="#B6A7C2" strokeWidth="3"/></>;
 case "floor-path": return <><path d="M34 109Q75 27 119 96T207 63" stroke="#9CC5AE" strokeWidth="25" strokeLinecap="round" fill="none"/><path d="M34 109Q75 27 119 96T207 63" stroke="#FFF" strokeDasharray="5 9" strokeWidth="4" strokeLinecap="round" fill="none"/><circle cx="35" cy="109" r="8" fill="#D98F92"/><circle cx="206" cy="63" r="8" fill="#D98F92"/></>;
 case "rhythm-relay": return <><Child x={78} y={52} shirt="#C5A9DC" pose="clap"/><Child x={166} y={52} shirt="#9ACDB3" pose="clap"/><path d="M112 35V15L126 10V31" stroke="#C58194" strokeWidth="4" fill="none"/><circle cx="109" cy="35" r="5" fill="#C58194"/><circle cx="123" cy="31" r="5" fill="#C58194"/></>;
 case "movement-code": return <><Child x={86} y={54} shirt="#E4B3A5" pose="dance"/><rect x="131" y="36" width="78" height="61" rx="17" fill="#FFF" stroke="#D0B5D9" strokeWidth="3"/><path d="M147 60H183M147 75H171M184 72L193 81 202 68" stroke="#B08BC8" strokeWidth="5" strokeLinecap="round" fill="none"/></>;
 case "funny-faces": return <><circle cx="82" cy="79" r="39" fill="#F5CAA3"/><circle cx="164" cy="79" r="39" fill="#EBC6A6"/><circle cx="68" cy="69" r="4" fill="#4F5554"/><circle cx="97" cy="69" r="4" fill="#4F5554"/><path d="M64 84Q83 110 101 83" stroke="#AB7772" strokeWidth="5" strokeLinecap="round" fill="none"/><path d="M151 66L159 71 166 65M178 66L185 71 192 65" stroke="#6A6567" strokeWidth="4" strokeLinecap="round" fill="none"/><ellipse cx="169" cy="94" rx="12" ry="16" fill="#AF716D"/></>;
 case "sound-story": return <><Book x={92} y={105}/><path d="M155 57Q179 37 195 54Q201 76 180 83Q164 82 155 57" fill="#9FCDBB"/><circle cx="181" cy="60" r="3" fill="#51615B"/><path d="M195 64L211 70 193 76" fill="#F2BA7C"/><SoundWaves x={209} y={49}/></>;
 case "story-chain": return <><Book x={115} y={100}/><circle cx="167" cy="33" r="19" fill="#B9A3D3"/><path d="M151 27Q137 40 148 50Q154 54 157 48" stroke="#B9A3D3" strokeWidth="13" strokeLinecap="round" fill="none"/><circle cx="172" cy="30" r="2.5" fill="#4D4E5D"/><path d="M67 41L74 29 81 41 93 43 83 51 86 64 74 57 63 64 65 51 56 43Z" fill="#EDC16F"/></>;
 case "emotion-statues": return <><circle cx="75" cy="75" r="36" fill="#F1C8A3"/><circle cx="166" cy="75" r="36" fill="#D5BADB"/><circle cx="65" cy="69" r="3" fill="#635B5B"/><circle cx="86" cy="69" r="3" fill="#635B5B"/><path d="M61 85Q75 104 90 85" stroke="#956D69" strokeWidth="4" fill="none"/><circle cx="156" cy="69" r="3" fill="#635B5B"/><circle cx="175" cy="69" r="3" fill="#635B5B"/><ellipse cx="165" cy="91" rx="9" ry="13" fill="#885D7D"/><path d="M117 45Q120 35 128 43Q135 33 143 44Q144 53 128 62Q112 53 117 45" fill="#EAA0A5"/></>;
 case "toy-theatre": return <><rect x="30" y="28" width="180" height="102" rx="13" fill="#F8EAD1"/><path d="M32 29H89Q75 68 60 104Q33 83 32 29M208 29H152Q165 72 181 104Q204 79 208 29" fill="#DE94A5"/><Toy x={101} y={89} shape="bear" color="#D5A87E"/><Toy x={149} y={97} shape="ball" color="#98CBB2"/><path d="M33 132H209" stroke="#AE8AA1" strokeWidth="9" strokeLinecap="round"/></>;
 case "kindness-charades": return <><Child x={72} y={50} shirt="#9FCFBC" pose="reach"/><Child x={176} y={50} shirt="#EAA8A9" pose="reach"/><path d="M110 42Q120 31 132 42Q145 29 154 41Q155 56 132 72Q107 54 110 42" fill="#E89FAB"/></>;
 case "invent-a-world": return <><circle cx="118" cy="77" r="51" fill="#B7C4E5"/><path d="M85 48Q116 37 127 64Q112 75 125 93Q100 107 84 89Z" fill="#94CDB5"/><path d="M144 54Q170 68 152 94L139 84Q153 65 144 54" fill="#8CC3BA"/><ellipse cx="119" cy="78" rx="79" ry="22" transform="rotate(-21 119 78)" stroke="#D9A6C8" strokeWidth="7" fill="none"/><circle cx="54" cy="32" r="5" fill="#EDC574"/><circle cx="184" cy="120" r="5" fill="#EDC574"/></>;
 default:return <><Book x={116} y={101}/><circle cx="174" cy="38" r="9" fill="#EEC272"/></>;
 }
}
export function WeeklyGameArt({gameId,category,className=""}:{gameId:string;category:PlayCategory;className?:string}){
 const background=category==="focus"?"#F2EAF9":category==="movement"?"#EAF5EF":"#FFF0E4";
 return <svg aria-hidden="true" focusable="false" data-testid={"weekly-game-art-"+gameId}
   className={className} viewBox="0 0 240 154" xmlns="http://www.w3.org/2000/svg">
  <rect width="240" height="154" rx="20" fill={background}/>
  <circle cx="208" cy="26" r="31" fill="#FFF" opacity=".36"/>
  <circle cx="32" cy="33" r="18" fill="#FFF" opacity=".28"/>
  <ellipse cx="122" cy="138" rx="91" ry="9" fill="#7B9B86" opacity=".11"/>
  <Scene id={gameId}/>
 </svg>;
}
