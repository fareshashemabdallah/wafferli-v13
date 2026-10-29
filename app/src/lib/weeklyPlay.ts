import type {Member} from "./money";
import {realFamilyMembers} from "./familySetup";

/** Editorial activity suggestions, not developmental screening, medical advice or scores. */
export type PlayCategory="focus"|"movement"|"creative";
export type WeeklyGame={
 id:string;category:PlayCategory;minAge:number;maxAge:number;minutes:number;emoji:string;
 en:string;ar:string;descriptionEn:string;descriptionAr:string;
 stepsEn:readonly [string,string,string];stepsAr:readonly [string,string,string];
 adaptEn:string;adaptAr:string;
 helpsEn:string;helpsAr:string;whyEn:string;whyAr:string;
};
export const PLAY_CATEGORIES:readonly PlayCategory[]=["focus","movement","creative"];
export const PLAY_CATEGORY_LABELS:Record<PlayCategory,{en:string;ar:string}>={
 focus:{en:"Memory & focus",ar:"ذاكرة وتركيز"},
 movement:{en:"Movement & coordination",ar:"حركة وتناسق"},
 creative:{en:"Imagination & connection",ar:"خيال وتواصل"}
};
export const WEEKLY_GAMES:readonly WeeklyGame[]=[
 {id:"peekaboo",category:"focus",minAge:0,maxAge:2,minutes:3,emoji:"🙈",en:"Peekaboo Surprise",ar:"وينك يا حلو؟",
  descriptionEn:"A playful hide-and-reveal moment.",descriptionAr:"لعبة الاختباء والظهور المحبّبة.",
  helpsEn:"Shared attention & connection",helpsAr:"الانتباه والتواصل",
  whyEn:"Taking turns hiding and smiling invites anticipation, shared attention and connection with a caregiver.",whyAr:"تبادل الاختباء والابتسام يساعد الطفل يتوقّع ويتفاعل مع الشخص اللي بيلعب معه.",
  stepsEn:["Sit close to your child.","Hide your face behind your hands.","Reveal your smile and repeat slowly."],
  stepsAr:["اقعد قريب من طفلك.","غطّي وجهك بإيديك.","اظهر وابتسم وكرّر اللعبة بهدوء."],
  adaptEn:"Follow your baby's cues. Stop when they lose interest.",adaptAr:"راقب تفاعل الطفل وتوقّف عندما يفقد اهتمامه."},
 {id:"find-the-sound",category:"focus",minAge:1,maxAge:3,minutes:4,emoji:"🔔",en:"Where's the Sound?",ar:"من وين الصوت؟",
  descriptionEn:"Listen and look together.",descriptionAr:"نسمع وندور سوا.",
  helpsEn:"Listening & awareness",helpsAr:"الإصغاء والانتباه",
  whyEn:"Looking toward a gentle sound gives little ones a chance to practise listening and noticing where sounds come from.",whyAr:"البحث عن مصدر صوت لطيف يعطي الطفل فرصة للإصغاء والانتباه لمصدره.",
  stepsEn:["Choose a soft, familiar sound.","Make it from one side, within sight.","Invite your child to find where it came from."],
  stepsAr:["اختار صوتاً خفيفاً ومألوفاً.","أصدر الصوت من جهة واضحة للطفل.","شجّعه يعرف من وين إجى الصوت."],
  adaptEn:"Use only child-safe objects; an adult handles any small items.",adaptAr:"استعمل أدوات آمنة وخلي أي قطعة صغيرة بإيد شخص بالغ."},
 {id:"freeze",category:"focus",minAge:3,maxAge:9,minutes:5,emoji:"🎵",en:"Freeze Dance",ar:"رقصة التجمّد",
  descriptionEn:"Dance, listen, and stop!",descriptionAr:"ارقصوا واسمعوا ووقفوا!",
  helpsEn:"Listening & self-control",helpsAr:"الإصغاء وضبط الحركة",
  whyEn:"Stopping when the music pauses lets children practise attention, responding to cues and controlling movement.",whyAr:"التوقف عند انقطاع الموسيقى يدرّب الأطفال على الانتباه للإشارة والتحكم بالحركة.",
  stepsEn:["Play music and dance together.","Pause the music without warning.","Everyone freezes; then begin again."],
  stepsAr:["شغّلوا موسيقى وارقصوا سوا.","وقّف الموسيقى فجأة.","الكل يتجمّد، وبعدها كرّروا!"],
  adaptEn:"Younger children copy your pose; older children balance on one leg.",adaptAr:"الصغار يقلّدوا الحركة، والكبار يجرّبوا يوقفوا على رجل واحدة."},
 {id:"whats-missing",category:"focus",minAge:3,maxAge:10,minutes:5,emoji:"🧸",en:"What's Missing?",ar:"شو اختفى؟",
  descriptionEn:"Remember the toys, then spot the missing one.",descriptionAr:"تذكّروا الألعاب واعرفوا شو اختفى.",
  helpsEn:"Memory & observation",helpsAr:"الذاكرة والملاحظة",
  whyEn:"Remembering which toy disappeared is playful practice for visual attention and working memory.",whyAr:"تذكّر اللعبة التي اختفت يوفّر تدريباً مرحاً للانتباه البصري والذاكرة.",
  stepsEn:["Show three familiar toys.","Ask children to close their eyes.","Hide one and ask which is missing."],
  stepsAr:["فرجي الأطفال ثلاث ألعاب مألوفة.","اطلب منهم يغمّضوا عيونهم.","خبّي واحدة واسأل شو ناقص."],
  adaptEn:"Start with three large toys; add more for older children.",adaptAr:"ابدأ بثلاث ألعاب كبيرة، وزيد العدد للأكبر عمراً."},
 {id:"colour-hunt",category:"focus",minAge:3,maxAge:8,minutes:5,emoji:"🌈",en:"Colour Detective",ar:"محقق الألوان",
  descriptionEn:"Look for colours all around the room.",descriptionAr:"دوّروا على الألوان من حولكم.",
  helpsEn:"Visual attention & sorting",helpsAr:"الملاحظة وتمييز الألوان",
  whyEn:"Searching for matching colours encourages careful observation and recognising similarities.",whyAr:"البحث عن الألوان المتشابهة يشجّع على الملاحظة الدقيقة والتمييز بينها.",
  stepsEn:["Name a colour.","Find two things in the room with that colour.","Switch roles and try a new colour."],
  stepsAr:["قول اسم لون.","لاقوا غرضين بنفس اللون بالغرفة.","بدّلوا الأدوار واختاروا لون جديد."],
  adaptEn:"Use simple colours for younger children; add colour patterns for older ones.",adaptAr:"الصغار يختاروا ألوان بسيطة، والكبار يكوّنوا أنماط ألوان."},
 {id:"backwards-clues",category:"focus",minAge:7,maxAge:17,minutes:7,emoji:"🔄",en:"Reverse the Rule",ar:"اعكس القاعدة",
  descriptionEn:"A funny challenge to think before acting.",descriptionAr:"تحدّي ممتع للتفكير قبل الحركة.",
  helpsEn:"Flexible thinking & self-control",helpsAr:"مرونة التفكير وضبط النفس",
  whyEn:"Following a reversed rule lets children practise shifting attention instead of reacting automatically.",whyAr:"اتباع قاعدة معاكسة يساعد الطفل يغيّر طريقة تفكيره بدل ما يستجيب بشكل تلقائي.",
  stepsEn:["Agree that 'up' means crouch and 'down' means stand.","Call out a direction.","Try to follow the opposite rule together."],
  stepsAr:["اتفقوا إن «فوق» يعني انحناء و«تحت» يعني وقوف.","نادِ باتجاه.","حاولوا تتبعوا القاعدة المعاكسة سوا."],
  adaptEn:"Start slowly and switch the rule when everyone is ready.",adaptAr:"ابدأ ببطء وغيّر القاعدة لما يكون الجميع جاهز."},
 {id:"memory-route",category:"focus",minAge:8,maxAge:17,minutes:8,emoji:"🧭",en:"Memory Route",ar:"طريق الذاكرة",
  descriptionEn:"Remember a route through the house.",descriptionAr:"تذكّروا مساراً داخل البيت.",
  helpsEn:"Sequence memory & planning",helpsAr:"ذاكرة التسلسل والتخطيط",
  whyEn:"Remembering a route in order gives children a playful way to practise holding and following a sequence.",whyAr:"تذكّر مسار بالترتيب يساعد الأطفال يتمرّنوا على حفظ سلسلة خطوات وتنفيذها.",
  stepsEn:["Name three safe places in the room.","Repeat the sequence out loud.","Walk the route in that order."],
  stepsAr:["سمّوا ثلاث نقاط آمنة بالغرفة.","كرّروا الترتيب بصوت عالٍ.","امشوا بالترتيب نفسه."],
  adaptEn:"Add an extra stop or reverse the order for a new challenge.",adaptAr:"زيدوا نقطة أو اعكسوا الترتيب لتحدٍّ جديد."},
 {id:"soft-scarf",category:"movement",minAge:0,maxAge:2,minutes:3,emoji:"🪶",en:"Follow the Scarf",ar:"تابع الوشاح",
  descriptionEn:"Gentle tracking and reaching with a parent.",descriptionAr:"متابعة وحركة لطيفة مع الأهل.",
  helpsEn:"Visual tracking & attention",helpsAr:"المتابعة البصرية والانتباه",
  whyEn:"Watching a slowly moving scarf invites visual attention and, when ready, gentle reaching.",whyAr:"متابعة الوشاح المتحرّك ببطء تشجّع الانتباه بالنظر ومحاولة الوصول إليه عند الاستعداد.",
  stepsEn:["Sit with your baby securely supported.","Move a soft scarf slowly within view.","Let them watch or reach at their own pace."],
  stepsAr:["اجلس مع دعم الطفل بشكل آمن.","حرّك وشاحاً ناعماً وببطء أمامه.","اتركه يتابع أو يحاول الوصول حسب قدرته."],
  adaptEn:"Adult holds the scarf throughout; never leave loose fabric with a baby.",adaptAr:"خلي الوشاح بإيد الشخص البالغ دائماً ولا تترك قماشاً فضفاضاً مع الرضيع."},
 {id:"gentle-reach",category:"movement",minAge:0,maxAge:2,minutes:4,emoji:"👐",en:"Reach & Smile",ar:"وصّل وابتسم",
  descriptionEn:"Gentle movement in a safe play space.",descriptionAr:"حركة هادئة بمكان لعب آمن.",
  helpsEn:"Reaching & coordination",helpsAr:"الوصول والتناسق الحركي",
  whyEn:"Reaching toward a nearby toy offers gentle practice coordinating looking and moving.",whyAr:"محاولة الوصول إلى لعبة قريبة تتيح للطفل التدرّب بلطف على التنسيق بين النظر والحركة.",
  stepsEn:["Settle your child in an age-appropriate safe position.","Hold a soft toy within easy reach.","Invite a reach, then smile and celebrate."],
  stepsAr:["ضع الطفل بوضعية آمنة ومناسبة لعمره.","امسك لعبة ناعمة بمكان قريب.","شجّعه يحاول يوصل وابتسم له."],
  adaptEn:"Never force a movement or leave the child unattended.",adaptAr:"لا تجبر الطفل على الحركة ولا تتركه دون مراقبة."},
 {id:"animal-parade",category:"movement",minAge:3,maxAge:9,minutes:6,emoji:"🐻",en:"Animal Parade",ar:"موكب الحيوانات",
  descriptionEn:"Hop, stretch and stomp like animals.",descriptionAr:"اقفزوا وتمطّوا وامشوا مثل الحيوانات.",
  helpsEn:"Movement & imagination",helpsAr:"الحركة والخيال",
  whyEn:"Pretending to move like animals invites balance, coordination and imaginative play.",whyAr:"تقليد حركة الحيوانات يشجّع التوازن والتناسق واللعب التخيلي.",
  stepsEn:["Choose an animal together.","Take turns moving like that animal.","Guess the next animal and switch roles."],
  stepsAr:["اختاروا حيوان سوا.","قلّدوا حركته بالدور.","خمّنوا الحيوان التالي وبدّلوا الأدوار."],
  adaptEn:"Try simple walks for little ones and short sequences for older kids.",adaptAr:"للصغار مشي بسيط، وللكبار سلسلة من الحركات."},
 {id:"mirror-moves",category:"movement",minAge:3,maxAge:12,minutes:5,emoji:"🪞",en:"Mirror Me",ar:"قلّد حركتي",
  descriptionEn:"Take turns being the leader.",descriptionAr:"كل واحد يصير القائد بالدور.",
  helpsEn:"Body awareness & attention",helpsAr:"وعي الجسم والانتباه",
  whyEn:"Copying each other's movements encourages observation, coordination and taking turns leading.",whyAr:"تقليد الحركات يساعد على الملاحظة والتناسق وتبادل دور القيادة.",
  stepsEn:["Stand facing each other.","Move your arms slowly while the other copies.","Swap who leads and try new moves."],
  stepsAr:["وقفوا مقابل بعض.","حرّك إيديك ببطء والثاني يقلّد.","بدّلوا القائد وجربوا حركات جديدة."],
  adaptEn:"Small movements for younger kids; multi-step poses for older kids.",adaptAr:"حركات بسيطة للصغار، وحركات متتالية للكبار."},
 {id:"floor-path",category:"movement",minAge:3,maxAge:9,minutes:6,emoji:"👣",en:"Follow the Path",ar:"امشي عالطريق",
  descriptionEn:"Make a safe pretend trail on the floor.",descriptionAr:"اعملوا مسار خيالي آمن بالأرض.",
  helpsEn:"Balance & spatial awareness",helpsAr:"التوازن وإدراك المكان",
  whyEn:"Following an imaginary path offers practice controlling movement and noticing space.",whyAr:"اتباع طريق خيالي يعطي فرصة للتحكم بالحركة والانتباه للمساحة المحيطة.",
  stepsEn:["Choose a clear, obstacle-free floor space.","Imagine a winding path together.","Walk slowly along it, one at a time."],
  stepsAr:["اختاروا أرض فاضية وآمنة.","تخيّلوا طريقاً متعرّجاً سوا.","امشوا عليه ببطء واحداً واحداً."],
  adaptEn:"Add gentle turns or pauses; avoid raised surfaces.",adaptAr:"زيدوا لفّات أو توقفات بسيطة، بلا أماكن مرتفعة."},
 {id:"rhythm-relay",category:"movement",minAge:6,maxAge:17,minutes:7,emoji:"🥁",en:"Rhythm Relay",ar:"سباق الإيقاع",
  descriptionEn:"Copy and create clapping rhythms.",descriptionAr:"قلّدوا وابتكروا إيقاعات بالتصفيق.",
  helpsEn:"Listening & patterns",helpsAr:"الإصغاء وتذكّر الإيقاع",
  whyEn:"Repeating clapping patterns invites listening, sequencing and memory practice.",whyAr:"تكرار إيقاعات التصفيق يشجّع الإصغاء وتذكّر الترتيب.",
  stepsEn:["Clap a short pattern.","Others copy it back.","Take turns inventing the next pattern."],
  stepsAr:["صفّق نمطاً قصيراً.","الباقي يقلّدوه.","تبادلوا الأدوار بابتكار نمط جديد."],
  adaptEn:"Start with two claps; lengthen the pattern as a challenge.",adaptAr:"ابدأ بتصفيقتين وزيد الإيقاع تدريجياً."},
 {id:"movement-code",category:"movement",minAge:9,maxAge:17,minutes:8,emoji:"🔡",en:"Movement Code",ar:"شفرة الحركات",
  descriptionEn:"Turn words into actions.",descriptionAr:"حوّلوا الكلمات لحركات.",
  helpsEn:"Attention & working memory",helpsAr:"الانتباه والذاكرة العاملة",
  whyEn:"Remembering which movement matches a word provides playful practice with attention and rules.",whyAr:"ربط كلمة بحركة وتذكّرها يدرّب على الانتباه واتباع القواعد.",
  stepsEn:["Assign a safe move to three words.","Tell a short story using those words.","Perform the move every time a word appears."],
  stepsAr:["اربطوا ثلاث كلمات بحركات آمنة.","احكوا قصة قصيرة فيها هالكلمات.","اعملوا الحركة كل ما تسمعوا الكلمة."],
  adaptEn:"Let children invent and switch the code.",adaptAr:"خلّوا الأولاد يخترعوا الشفرة ويغيّروها."},
 {id:"funny-faces",category:"creative",minAge:0,maxAge:2,minutes:3,emoji:"😊",en:"Funny Faces",ar:"وجوه مضحكة",
  descriptionEn:"An expressive face-to-face moment.",descriptionAr:"لحظة تعابير وضحك بين الطفل والأهل.",
  helpsEn:"Expression & connection",helpsAr:"التعبير والتواصل",
  whyEn:"Exchanging faces and smiles encourages responsive social play and noticing expressions.",whyAr:"تبادل الوجوه والابتسامات يشجّع التفاعل مع الآخرين وملاحظة تعابيرهم.",
  stepsEn:["Sit close where your baby can see your face.","Smile and make a gentle expression.","Pause and notice how your baby responds."],
  stepsAr:["اقعد قريب حتى يشوف الطفل وجهك.","ابتسم واعمل تعبيراً لطيفاً.","توقّف وشوف كيف بيتفاعل."],
  adaptEn:"Follow your child's comfort and signals.",adaptAr:"اتبع راحة طفلك وإشاراته."},
 {id:"sound-story",category:"creative",minAge:1,maxAge:5,minutes:5,emoji:"🐦",en:"Little Sound Story",ar:"قصة الأصوات",
  descriptionEn:"Make up a story with easy animal sounds.",descriptionAr:"اخترعوا قصة بأصوات الحيوانات.",
  helpsEn:"Early language & listening",helpsAr:"اللغة المبكرة والإصغاء",
  whyEn:"Taking turns making animal sounds invites listening and back-and-forth communication.",whyAr:"تبادل تقليد أصوات الحيوانات يشجّع الإصغاء والتواصل ذهاباً وإياباً.",
  stepsEn:["Start a tiny story about an animal.","Make the animal's sound together.","Add another animal and repeat."],
  stepsAr:["ابدأ بقصة صغيرة عن حيوان.","قلّدوا صوته سوا.","ضيفوا حيواناً ثانياً وكرّروا."],
  adaptEn:"Little ones can copy a sound; older children add a sentence.",adaptAr:"الصغير يقلّد صوتاً، والكبير يضيف جملة."},
 {id:"story-chain",category:"creative",minAge:3,maxAge:12,minutes:7,emoji:"📖",en:"Silly Story Chain",ar:"قصة من خيالنا",
  descriptionEn:"Build a funny story together.",descriptionAr:"ألّفوا قصة مضحكة سوا.",
  helpsEn:"Language & imagination",helpsAr:"اللغة والخيال",
  whyEn:"Adding ideas to a shared story gives children opportunities to express themselves and imagine.",whyAr:"إضافة الأفكار إلى قصة مشتركة تعطي الأطفال فرصة للتعبير واستخدام الخيال.",
  stepsEn:["Begin with 'Once there was a dancing elephant…'","Each person adds one idea.","Let everyone choose a funny ending."],
  stepsAr:["ابدأ: «كان في فيل بيرقص…».","كل واحد بيضيف فكرة.","خلّوا الكل يختار نهاية مضحكة."],
  adaptEn:"Younger children can pick characters; older ones add a whole sentence.",adaptAr:"الصغار يختاروا الشخصيات، والكبار يضيفوا جملة كاملة."},
 {id:"emotion-statues",category:"creative",minAge:3,maxAge:10,minutes:5,emoji:"❤️",en:"Feeling Statues",ar:"تماثيل المشاعر",
  descriptionEn:"Make faces and talk about feelings.",descriptionAr:"عبّروا بالوجه واحكوا عن المشاعر.",
  helpsEn:"Feelings & expression",helpsAr:"فهم المشاعر والتعبير",
  whyEn:"Acting out feelings opens a gentle conversation about expressions and emotions.",whyAr:"تمثيل المشاعر يفتح حواراً لطيفاً عن تعابير الوجه والإحساس.",
  stepsEn:["Name a feeling like happy or surprised.","Make a statue showing that feeling.","Guess the feeling, then swap roles."],
  stepsAr:["قول شعوراً مثل الفرح أو المفاجأة.","اعمل تمثالاً بعبّر عنه.","خمّنوا الشعور وبدّلوا الأدوار."],
  adaptEn:"All feelings are welcome; no right or wrong answers.",adaptAr:"كل المشاعر مقبولة، وما في جواب صح أو غلط."},
 {id:"toy-theatre",category:"creative",minAge:3,maxAge:9,minutes:7,emoji:"🎭",en:"Toy Theatre",ar:"مسرح الألعاب",
  descriptionEn:"Give favourite toys a little adventure.",descriptionAr:"اعطوا الألعاب مغامرة صغيرة.",
  helpsEn:"Storytelling & cooperation",helpsAr:"القصص والتعاون",
  whyEn:"Making a toy story together encourages taking turns, imagining solutions and communicating.",whyAr:"صنع قصة بالألعاب سوا يشجّع تبادل الأدوار والتواصل وتخيّل الحلول.",
  stepsEn:["Choose two familiar toys.","Invent a problem they can solve together.","Act out a happy or surprising ending."],
  stepsAr:["اختاروا لعبتين مألوفتين.","اخترعوا مشكلة بيحلّوها سوا.","مثّلوا نهاية سعيدة أو مفاجئة."],
  adaptEn:"A parent can narrate while younger children move the toys.",adaptAr:"الأهل بيحكوا القصة والصغار بيحرّكوا الألعاب."},
 {id:"kindness-charades",category:"creative",minAge:6,maxAge:17,minutes:7,emoji:"🤝",en:"Kindness Charades",ar:"تمثيل المساعدة",
  descriptionEn:"Act out small acts of kindness.",descriptionAr:"مثّلوا طرقاً بسيطة للمساعدة.",
  helpsEn:"Empathy & communication",helpsAr:"التعاطف والتواصل",
  whyEn:"Acting out caring actions helps children think about how their choices may affect others.",whyAr:"تمثيل أفعال لطيفة يساعد الأطفال يفكّروا كيف ممكن أفعالهم تأثّر على غيرهم.",
  stepsEn:["Think of one kind action without saying it.","Act it out silently.","Guess, then talk about when it could help."],
  stepsAr:["فكّر بعمل لطيف بلا ما تقوله.","مثّله بصمت.","خمّنوا واحكوا إمتى بيفيد."],
  adaptEn:"Make it cooperative, not a competition.",adaptAr:"خلّوها لعبة تعاون، مش منافسة."},
 {id:"invent-a-world",category:"creative",minAge:8,maxAge:17,minutes:8,emoji:"🪐",en:"Invent a World",ar:"اخترع عالماً",
  descriptionEn:"Imagine a new planet together.",descriptionAr:"تخيّلوا كوكباً جديداً سوا.",
  helpsEn:"Creativity & problem-solving",helpsAr:"الإبداع وحل المشكلات",
  whyEn:"Creating an imaginary world invites new ideas, collaboration and thinking through rules.",whyAr:"ابتكار عالم خيالي يشجّع الأفكار الجديدة والتعاون والتفكير في القواعد.",
  stepsEn:["Give your imaginary place a name.","Invent its creatures and one unusual rule.","Take turns telling a day in that world."],
  stepsAr:["سمّوا المكان الخيالي.","اخترعوا مخلوقاته وقاعدة غريبة.","احكوا بالدور كيف بيمرّ يوم فيه."],
  adaptEn:"Draw it if you feel like it; drawing is optional.",adaptAr:"ارسموه إذا حبيتو، والرسم اختياري."}
];

/** ISO-style Monday weeks, based on local calendar date (not UTC clock hour).
 * No localStorage or server clock: the same week's games never reshuffle. */
export function playWeekIndex(now:Date):number{
 const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
 monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
 const utc=Date.UTC(monday.getFullYear(),monday.getMonth(),monday.getDate());
 return Math.floor((utc-Date.UTC(1970,0,5))/(7*86400000));
}
export function knownChildAges(members:readonly Member[]):number[]{
 return realFamilyMembers(members).filter(m=>m.role==="child"&&
  typeof m.ageYears==="number"&&Number.isInteger(m.ageYears)&&m.ageYears>=0&&m.ageYears<=17
 ).map(m=>m.ageYears!);
}
/** Three choices: exactly one per developmental category. Prefer games suitable
 * for every known child, otherwise choose those for at least one child's age.
 * No ages known => show a generic preschool/school-age starter selection, not
 * a claim that example profiles are the user's children. */
export function weeklyPlaySelection(members:readonly Member[],now=new Date()):WeeklyGame[]{
 const ages=knownChildAges(members),week=playWeekIndex(now);
 return PLAY_CATEGORIES.map((category,i)=>{
  const catalog=WEEKLY_GAMES.filter(g=>g.category===category);
  const everybody=catalog.filter(g=>ages.length>0&&ages.every(a=>a>=g.minAge&&a<=g.maxAge));
  const some=catalog.filter(g=>ages.some(a=>a>=g.minAge&&a<=g.maxAge));
  const starter=catalog.filter(g=>g.minAge<=3&&g.maxAge>=6);
  const pool=everybody.length?everybody:some.length?some:starter;
  return pool[((week+i)%pool.length+pool.length)%pool.length]!;
 });
}
