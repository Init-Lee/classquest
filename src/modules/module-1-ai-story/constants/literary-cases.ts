/**
 * 文件说明：模块 1 课时 2 课堂文学案例常量。
 * 职责：原样保存内容包三则课堂片段、出处、讲解与插图路径，供第 1/2 关阅读与自动填入参照。
 * 更新触发：课堂案例篇目、原文/教学译文、出处、讲解或插图路径变化时，需要同步更新本文件。
 */

export type Module1LiteraryCaseId = "shexi" | "chameleon" | "last_leaf"

export interface Module1LiteraryGlossaryItem {
  word: string
  meaning: string
}

export interface Module1LiteraryQuestion {
  question: string
  reference: string
  evidence: string[]
}

export interface Module1LiteraryWritingMove {
  name: string
  instruction: string
}

export interface Module1LiterarySource {
  url: string
  catalogUrl?: string
  stableUrl?: string
  title: string
  version: string
  editorialNote: string
  translationNote: string
  checkedOn: string
  publicDomainNote: string
}

export interface Module1LiteraryCase {
  id: Module1LiteraryCaseId
  cardTitle: string
  workTitle: string
  author: string
  focus: string
  teachingRole: string
  background: string
  excerptLabel: string
  excerpt: string
  glossary: Module1LiteraryGlossaryItem[]
  questions: Module1LiteraryQuestion[]
  writingMoves: Module1LiteraryWritingMove[]
  boundary: string
  boardSummary: string
  source: Module1LiterarySource
  illustrationSrc: string
  illustrationAlt: string
  classroomLocation: string
}

export const MODULE1_LITERARY_CASE_IMAGE_DIR = "/module-1/literary-cases"

export const MODULE1_LITERARY_CASES: Module1LiteraryCase[] = [
  {
    id: "shexi",
    cardTitle: "《社戏》：让景物带出人物的感受",
    workTitle: "社戏",
    author: "鲁迅",
    focus: "人物看见、听见、闻见的事物，怎样让读者感受到他的期待与沉醉。",
    teachingRole: "主讲案例",
    background: "“我”小时候随母亲住在外祖母家的平桥村，一心盼望去赵庄看戏。白天因为没有合用的船，原以为去不成了；晚饭后终于有了船，伙伴们便陪“我”连夜出发。下面写的是前往赵庄的途中。",
    excerptLabel: "原文节选（简体排印）",
    excerpt: "两岸的豆麦和河底的水草所发散出来的清香，夹杂在水气中扑面的吹来；月色便朦胧在这水气里。淡黑的起伏的连山，仿佛是踊跃的铁的兽脊似的，都远远地向船尾跑去了，但我却还以为船慢。他们换了四回手，渐望见依稀的赵庄，而且似乎听到歌吹了，还有几点火，料想便是戏台，但或者也许是渔火。\n\n那声音大概是横笛，宛转，悠扬，使我的心也沈静，然而又自失起来，觉得要和他濔散在含着豆麦蕴藻之香的夜气里。",
    glossary: [{"word":"踊跃","meaning":"这里形容起伏的山仿佛在跳动。"},{"word":"兽脊","meaning":"兽的脊背。"},{"word":"歌吹","meaning":"歌声和乐声。"},{"word":"沈静","meaning":"同“沉静”；本选段保留来源用字。"},{"word":"濔散","meaning":"弥漫、散开；本选段保留来源用字。"},{"word":"蕴藻","meaning":"水草。"}],
    questions: [{"question":"你读出了“我”怎样的感受？请找一处文字说明。","reference":"“但我却还以为船慢”写出急着赶到赵庄的期待；后面写横笛声使“我”的心沈静，又表现出对夜色和笛声的沉醉。两个感受可以先后出现，不必把整段只概括为一种情绪。","evidence":["但我却还以为船慢","使我的心也沈静，然而又自失起来"]},{"question":"山为什么像在向船尾跑？这和“我”仍觉得船慢有什么关系？","reference":"船在前进，船上的“我”看两岸的山，便觉得山在向后移动。“跑”让人感到船行较快；仍觉得慢，则写出“我”急切的主观感受。没有必要把山的比喻解释成恐惧。","evidence":["都远远地向船尾跑去了","但我却还以为船慢"]},{"question":"如果你的主角正在等一件很在乎的事，可以怎样借鉴这段写法？","reference":"先确定人物此刻在乎什么，再选择他会特别注意的声音、光线、气味或变化，让这些细节与他的感受发生联系。例如写等待时，选择人物反复注意到的声响或画面；无需照搬河流、月色、山和横笛。","evidence":["清香","月色","那声音大概是横笛"]}],
    writingMoves: [{"name":"从人物的感官选择细节","instruction":"写人物当时注意到的两三处细节，并让细节与他的感受有关；不必把各种感官全部写齐。"},{"name":"用感受与眼前事实的差别写心情","instruction":"当人物确有期待或担忧时，可以写明明发生得很快却仍觉得慢等主观感受，让读者理解他为什么在乎。"}],
    boundary: "借鉴景物与人物感受之间的关系，自己的故事仍使用自己的人物、地点和事件。",
    boardSummary: "文本细节：清香、月色、山向后跑、笛声 → 阅读感受：期待与沉醉 → 我的写法：挑选人物当时会注意到的细节。",
    source: {"url":"https://zh.wikisource.org/zh-hans/%E7%A4%BE%E6%88%B2","stableUrl":"https://zh.wikisource.org/w/index.php?title=%E7%A4%BE%E6%88%B2&oldid=2605390","title":"鲁迅《社戏》，收录于《呐喊》；维基文库文本","version":"采用维基文库页面 oldid=2605390 的主文，简体排印。选取“两岸的豆麦……”和“那声音大概是横笛……”两个连续段落。","editorialNote":"仅做简繁转换和排印；未将“扑面的”“宛转”“沈静”“他”“濔散”等改为现代常用写法。原网页在“朦胧”后附有校异注“一作‘蒙胧’”，本节选采用主文“朦胧”，不把校异注排入故事正文。","translationNote":"中文原作；非改写。","checkedOn":"2026-09-12","publicDomainNote":"来源页面标注本中文原作为公有领域作品。"},
    illustrationSrc: "/module-1/literary-cases/shexi.jpg",
    illustrationAlt: "《社戏》教学情境插画",
    classroomLocation: "乘船前往赵庄的夜航片段",
  },
  {
    id: "chameleon",
    cardTitle: "《变色龙》：从说法的变化看见人物",
    workTitle: "变色龙",
    author: "契诃夫",
    focus: "比较同一个人前后的话，追问变化由什么触发。",
    teachingRole: "主讲案例",
    background: "一名金匠举着受伤的手指，声称被小狗咬了，警官奥楚梅洛夫前来处理。警官起初要处罚狗主人，并命令处死狗。就在这时，人群里有人猜测，狗可能属于一位将军。",
    excerptLabel: "教学译文（据 Constance Garnett 英译本转译，非现行教材译文）",
    excerpt: "“叶尔德林！”警官向巡警喊道，“查清这是谁的狗，写一份报告！狗得勒死。马上！它准是疯了……我问，这是谁的狗？”\n\n“我想，是日加洛夫将军的。”人群里有人说。\n\n“日加洛夫将军的，嗯……叶尔德林，帮我脱下大衣……热得厉害！大概要下雨了……有件事我不明白，它怎么会咬着你呢？”奥楚梅洛夫转向赫留金，“它怎么够得着你的手指？它那么小，你却是个大块头！一定是你用钉子划破了手指，接着就想借这件事索赔。我们都知道……你这种人！我知道你们这些家伙！”",
    glossary: [{"word":"奥楚梅洛夫","meaning":"处理这件事的警官。"},{"word":"叶尔德林","meaning":"跟随警官的巡警。"},{"word":"赫留金","meaning":"声称被狗咬伤的金匠。"},{"word":"日加洛夫将军","meaning":"人群中有人猜测的狗主人，此时身份尚未核实。"},{"word":"索赔","meaning":"要求赔偿。"}],
    questions: [{"question":"听到将军的名字前后，警官分别把责任推给了谁？","reference":"前面直接认定狗疯了，要求处死；后面转而责怪受伤的赫留金，猜他想借伤口索赔。让学生对照具体说法，无需先背人物性格词语。","evidence":["它准是疯了","接着就想借这件事索赔"]},{"question":"这时出现了新的咬人证据吗？真正触发说法变化的是什么？","reference":"这几个段落没有增加咬人经过的新证据，只出现狗可能属于将军的猜测。警官的判断却随身份猜测改变，读者由此看见他对权势的顾忌与对普通人的轻慢。这里不能把“将军的狗”写成已确认事实。","evidence":["我想，是日加洛夫将军的","它怎么会咬着你呢"]},{"question":"自己的故事里，怎样让读者从说话看出人物在乎什么？","reference":"可以写同一人物在得知一条相关信息前后的说法，再让读者观察变化及其原因。人物也可以因获得可靠证据而合理改变判断；无需把每个人都写成见风使舵，也不必都使用讽刺。","evidence":["日加洛夫将军的，嗯","奥楚梅洛夫转向赫留金"]}],
    writingMoves: [{"name":"用前后对话形成对照","instruction":"让人物围绕同一件事说出前后不同的话，并交代是什么信息触发了变化。"},{"name":"让动作配合说话","instruction":"在对话间穿插与处境有关的小动作，让读者看见人物的反应；动作需要符合当时的情境。"}],
    boundary: "可以学习通过对话呈现人物的立场和顾虑；自己的故事不必安排警官、狗、将军，也不必照搬讽刺主题。",
    boardSummary: "文本细节：命令处死狗 → 听到将军姓名 → 责怪伤者；阅读判断：态度随身份猜测改变；我的写法：用有原因的对话变化呈现人物。",
    source: {"url":"https://www.gutenberg.org/cache/epub/13417/pg13417-images.html","catalogUrl":"https://www.gutenberg.org/ebooks/13417","title":"Anton Chekhov, “A Chameleon”, The Cook’s Wedding and Other Stories, The Tales of Chekhov, Vol. 12, translated by Constance Garnett；Project Gutenberg eBook #13417","version":"英译者已核对为 Constance Garnett。电子书注明最近更新于 2024-10-28。选段从“Yeldyrin,” cries the superintendent 开始，到“I know you devils!”结束，是三个连续段落。","editorialNote":"本课根据已核对英文本作中文教学转译；保留警官前后态度、身份尚属猜测以及原来的行动顺序。英文原段中的省略号是原文标点，不代表本课跳删句子。","translationNote":"教学译文（本课据 Constance Garnett 英译本转译，非现行教材译文）。","checkedOn":"2026-09-12","publicDomainNote":"Project Gutenberg 条目将本次采用的英文本标注为 Public domain in the USA；本课中文文字为据该底本制作的教学译文。"},
    illustrationSrc: "/module-1/literary-cases/chameleon.jpg",
    illustrationAlt: "《变色龙》教学情境插画",
    classroomLocation: "狗主人身份引发警官态度变化的片段",
  },
  {
    id: "last_leaf",
    cardTitle: "《最后一片叶子》：让一个细节牵住读者",
    workTitle: "最后一片叶子",
    author: "欧·亨利",
    focus: "具体事物与人物的担忧建立联系，读者便会关心它后面怎样变化。",
    teachingRole: "补充案例；页面和PPT完整保留，可视学情重点讲解",
    background: "年轻画家琼西生病卧床，朋友苏一边作画挣钱，一边照料她。窗外砖墙上有一株常春藤，叶子不断掉落。琼西盯着窗外数叶子，还把自己的生命与最后一片叶子联系起来。",
    excerptLabel: "教学译文（据欧·亨利英文原作翻译，非现行教材译文）",
    excerpt: "“怎么了，亲爱的？”苏问。\n\n“六，”琼西几乎是在耳语，“现在掉得更快了。三天前还有差不多一百片，数得我头疼。可现在容易多了。又掉了一片。现在只剩五片了。”\n\n“五片什么，亲爱的？告诉你的苏吧。”\n\n“叶子。常春藤上的叶子。最后一片掉下来的时候，我也得走了。这件事我三天前就知道了。医生没告诉你吗？”\n\n“哎，我从没听过这么荒唐的话，”苏带着十足的不屑抱怨道，“那些老常春藤叶子，跟你能不能好起来有什么关系？”",
    glossary: [{"word":"常春藤","meaning":"一种攀援植物。"},{"word":"耳语","meaning":"很轻地说话。"},{"word":"我也得走了","meaning":"这里是琼西对自己生命将结束的担忧与错误联想，不是叶子真的能决定她的生死。"},{"word":"苏／Sudie","meaning":"英文本中 Sudie 是 Sue 的昵称，本教学译文统一用“苏”。"}],
    questions: [{"question":"读完后，你开始关心窗外的什么变化？为什么？","reference":"读者会关心剩下的叶子还会不会掉、琼西接下来怎样。叶子的变化和人物对生命的担忧发生了联系，所以它不再只是背景中的植物。","evidence":["现在只剩五片了","最后一片掉下来的时候，我也得走了"]},{"question":"叶子真的能决定琼西的生死吗？苏的话起了什么作用？","reference":"不能。这是琼西在病中的错误联想。苏的追问表明另一个人物并不认同，也把两人的不同态度写了出来。讲解聚焦人物的担忧及朋友的回应，不把文学情节当作医学事实。","evidence":["那些老常春藤叶子，跟你能不能好起来有什么关系"]},{"question":"自己的故事里，什么具体事物值得让人物反复留意？","reference":"选择一个确实与人物需要有关的细节，并交代人物为什么在乎。例如睡不着的主角留意窗帘边是否仍漏光；细节的变化应与故事进展有关，无需加入叶子、疾病或生死倒计时。","evidence":["六","五片什么","叶子。常春藤上的叶子"]}],
    writingMoves: [{"name":"让一个具体细节与人物需要相连","instruction":"交代人物为什么在意某样东西，让读者知道它的变化对人物意味着什么。"},{"name":"安排细节有意义地再次出现","instruction":"当情节有变化时，让人物再次注意到这个细节，帮助读者比较前后；不必机械重复同一句话。"}],
    boundary: "借鉴细节与人物关切的联系，自己的故事不必有叶子、疾病、死亡威胁或意外反转。",
    boardSummary: "文本细节：数叶子、叶子减少 → 人物关切：担忧自己的生命 → 阅读效果：想知道叶子和人物接下来怎样；我的写法：给一个细节以明确的故事意义。",
    source: {"url":"https://www.gutenberg.org/files/3707/3707-h/3707-h.htm","catalogUrl":"https://www.gutenberg.org/ebooks/3707","title":"O. Henry, “The Last Leaf”, The Trimmed Lamp and Other Stories of the Four Million；Project Gutenberg eBook #3707","version":"据 Project Gutenberg 英文原作。“What is it, dear?” asked Sue 起，连续节选到苏问“What have old ivy leaves to do with your getting well?”。原作后续同一段中的其他话未收入；节选在完整句子处结束。","editorialNote":"本课根据已核对英文本作中文教学翻译，未使用未核实的现代中文译本。为独立阅读，在译文节选末尾补齐中文右引号；未改变连续句子的顺序。","translationNote":"教学译文（本课据欧·亨利英文原作翻译，非现行教材译文）。","checkedOn":"2026-09-12","publicDomainNote":"Project Gutenberg 条目将本次采用的英文本标注为 Public domain in the USA；本课中文文字为据该底本制作的教学译文。"},
    illustrationSrc: "/module-1/literary-cases/last_leaf.jpg",
    illustrationAlt: "《最后一片叶子》教学情境插画",
    classroomLocation: "琼西与苏关于数叶子的对话片段",
  },
]

export function getModule1LiteraryCaseById(caseId: string): Module1LiteraryCase | undefined {
  return MODULE1_LITERARY_CASES.find(item => item.id === caseId)
}

export function buildModule1ClassroomVersionNote(literaryCase: Module1LiteraryCase): string {
  return [literaryCase.source.translationNote, literaryCase.source.editorialNote]
    .filter(Boolean)
    .join("\n")
}

export function buildModule1ClassroomSourceNote(literaryCase: Module1LiteraryCase): string {
  return `课堂材料：${literaryCase.id}\n${literaryCase.source.url}`
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
