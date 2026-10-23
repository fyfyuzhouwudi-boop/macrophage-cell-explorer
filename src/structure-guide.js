const STRUCTURE_GUIDE ={
  "nucleus": {
    "title": "细胞核",
    "function": "保存核基因组，并进行 DNA 复制、RNA 转录与加工；核仁参与核糖体亚基形成。",
    "location": "核膜包围的核质内；核膜外侧接胞质，外核膜与内质网连续。",
    "partners": [
      "核孔：RNA 与蛋白质的受控交换",
      "内质网：外核膜及核周隙连续",
      "核糖体：核仁产生的亚基输出后参与翻译"
    ],
    "features": [
      {
        "name": "内、外核膜与核周隙",
        "function": "把核质与胞质分隔；两膜之间的核周隙与 ER 腔相通。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "内膜朝核质，外膜朝胞质；在两膜之间，区别于核质。",
        "partners": [
          "外膜连续ER，核孔处两膜相连",
          "连续ER腔，不直接通核质。"
        ],
        "parts": [
          "nucleus"
        ]
      },
      {
        "name": "贯通核孔",
        "function": "提供核质与胞质之间的运输通道，区别于通向 ER 腔的膜连接。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "跨核包膜，不是PNS—ER的出口。",
        "partners": [
          "真实选择性运输还需屏障和受体。"
        ],
        "parts": [
          "nucleus",
          "pore"
        ]
      },
      {
        "name": "染色质纤维与颗粒",
        "function": "示意 DNA 与相关蛋白的包装及基因表达底物。",
        "visible": true,
        "note": "纤维布局为教学构象，不是某条染色体或基因的实测坐标。",
        "views": [
          "ordinary"
        ],
        "location": "核质内，位于内核膜围住的空间。",
        "partners": [
          "组蛋白参与 DNA 包装",
          "转录和复制装置使用遗传信息（未逐个建模）"
        ],
        "parts": [
          "nucleus"
        ]
      },
      {
        "name": "核仁",
        "function": "参与 rRNA 加工及核糖体亚基组装；没有包围膜。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "核质内无膜区室。",
        "partners": [
          "与入核的核糖体蛋白协作，亚基随后输出。"
        ],
        "parts": [
          "nucleus"
        ]
      },
      {
        "name": "核纤层分子网络",
        "function": "在内核膜下提供结构支撑并参与染色质组织。",
        "visible": false,
        "note": "背景知识；当前没有独立的 lamin 分子网络。",
        "views": [
          "ordinary"
        ],
        "location": "内核膜朝向核质的一侧。",
        "partners": [
          "内核膜蛋白",
          "染色质与核孔"
        ]
      }
    ],
    "sources": [
      {
        "title": "Cooper｜Nuclear Envelope and Traffic between the Nucleus and Cytoplasm",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9927/"
      },
      {
        "title": "Cooper｜The Nucleolus",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9939/"
      },
      {
        "title": "Alberts 等｜From DNA to RNA",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26887/"
      },
      {
        "title": "Cooper｜Glossary：nuclear membranes / nucleosome",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9926/"
      }
    ],
    "note": "透明与剖切用于看清区室；核与 ER 连接视图采用同一连续膜网。可见亚结构是本入口的组成部分，不是额外点击入口。"
  },
  "er": {
    "title": "内质网 · 粗面与光面",
    "function": "内质网是连续的膜—腔系统：粗面域的胞质侧附着核糖体，参与分泌及膜蛋白的合成与加工；光面域不附着核糖体，形成分支管网，并参与脂质代谢与钙稳态。",
    "location": "位于胞质中；外核膜延续为 ER 膜，核周隙延续为 ER 腔。ER 腔、胞质、核质是不同区室。",
    "partners": [
      "外核膜与核周隙：膜、腔分别连续",
      "胞质侧核糖体：新生肽经转位装置进入 ER 或插入其膜",
      "ERGIC 与高尔基体：通过运输载体交换，彼此没有常开水管"
    ],
    "features": [
      {
        "id": "rough-er",
        "name": "粗面内质网 · 膜片层与核糖体",
        "function": "较扁的膜囊为膜结合核糖体提供表面。粉紫色核糖体附在胞质侧；囊内是 ER 水性腔。",
        "visible": true,
        "views": [
          "ordinary",
          "connection"
        ],
        "location": "蓝色膜片层外侧；核糖体不位于腔内。",
        "partners": [
          "核糖体与 Sec61 转位复合体",
          "腔内折叠与早期修饰系统"
        ],
        "parts": [
          "er",
          "ribosome"
        ],
        "note": "粗面与光面是同一网络的区域特征，真实边界可随状态变化；不能仅用一段管子的形状判定其是否粗面。",
        "focus": "rough-er",
        "sources": [
          {
            "title": "Shibata 等（2010）｜ER 片层与管状域的形成机制",
            "url": "https://pubmed.ncbi.nlm.nih.gov/21111237/"
          },
          {
            "title": "Voorhees 等（2014）｜核糖体—Sec61 冷冻电镜结构",
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4081569/"
          }
        ]
      },
      {
        "id": "smooth-er",
        "name": "光面内质网 · 分支管网",
        "function": "分支管道没有附着核糖体，连续围成与粗面域相通的 ER 腔；真实管网的形状由膜曲率相关蛋白及融合活动共同维持。",
        "visible": true,
        "views": [
          "ordinary",
          "connection"
        ],
        "location": "浅绿色管网，与蓝色粗面域经同一开口相连。",
        "partners": [
          "粗面域的连续膜与腔",
          "脂质代谢及钙调节相关蛋白"
        ],
        "parts": [
          "er"
        ],
        "note": "本模型保留共享网格接口、三向分支和环路；没有把两片相碰的封闭膜当作贯通。形状比例为教学设计。",
        "focus": "smooth-er",
        "sources": [
          {
            "title": "Shibata 等（2010）｜ER 片层与管状域的形成机制",
            "url": "https://pubmed.ncbi.nlm.nih.gov/21111237/"
          }
        ]
      },
      {
        "id": "er-lumen",
        "name": "ER 腔 · 膜内水相",
        "function": "为分泌蛋白折叠、二硫键形成与早期加工提供环境；剖面中的金色货物和绿色组团表示腔内成分。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "膜囊及管道的内部；与外侧胞质隔开。",
        "partners": [
          "新生肽链",
          "腔内伴侣与加工酶"
        ],
        "parts": [
          "er"
        ],
        "note": "形体不指认特定蛋白的原子结构。进入视图的相机位于 ER 腔，不在脂质双层的疏水核心中。",
        "focus": "er-lumen",
        "sources": [
          {
            "title": "Alberts 等｜The Endoplasmic Reticulum",
            "url": "https://www.ncbi.nlm.nih.gov/books/NBK26841/"
          }
        ]
      },
      {
        "id": "nuclear-er-connection",
        "name": "核周隙—ER 腔连续连接",
        "function": "外核膜与 ER 膜连续，二者围出的核周隙与 ER 腔也连续。核内膜维持核质的边界。",
        "visible": true,
        "views": [
          "connection"
        ],
        "location": "核外膜向粗面 ER 延伸的膜颈。",
        "partners": [
          "外核膜",
          "核周隙与 ER 腔"
        ],
        "parts": [
          "er",
          "nucleus"
        ],
        "note": "核孔连接核质与胞质；核孔不是 ER 腔的入口。模型连接颈及层数不是某一巨噬细胞的实测电镜分割。",
        "focus": "er-lumen",
        "sources": [
          {
            "title": "Terasaki 等（2013）｜连续 ER 片层的三维电镜重建",
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3767119/"
          },
          {
            "title": "Alberts 等｜The Endoplasmic Reticulum",
            "url": "https://www.ncbi.nlm.nih.gov/books/NBK26841/"
          }
        ]
      },
      {
        "id": "sec61",
        "name": "核糖体—Sec61 与膜蛋白插入",
        "function": "翻译中的核糖体将新生肽交给膜内 Sec61；可溶性分泌蛋白进入腔侧，跨膜区可从侧向开口进入脂质双层。",
        "visible": false,
        "views": [
          "ordinary",
          "connection"
        ],
        "location": "粗面 ER 膜的胞质侧及贯膜转位通道。",
        "partners": [
          "核糖体",
          "Sec61",
          "新生多肽"
        ],
        "note": "当前附着颗粒表示核糖体位置，Sec61 原子通道及完整翻译循环未在这个 ER 视图中单独重建。",
        "sources": [
          {
            "title": "Voorhees 等（2014）｜核糖体—Sec61 冷冻电镜结构",
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4081569/"
          }
        ]
      },
      {
        "id": "er-exit",
        "name": "ER 出口与 ERGIC",
        "function": "合格货物从 ER 出口装入运输载体，经 ERGIC 向高尔基体顺面递送；回收运输帮助保留 ER 常驻成分。",
        "visible": false,
        "views": [
          "ordinary",
          "connection"
        ],
        "location": "专门的 ER 出口区域与相邻胞质。",
        "partners": [
          "COPII 相关出芽系统",
          "ERGIC",
          "Golgi 顺面"
        ],
        "note": "本视图没有逐个建立出口位点、包被、货物选择与解包被过程。",
        "sources": [
          {
            "title": "Alberts 等｜Transport from the ER through the Golgi Apparatus",
            "url": "https://www.ncbi.nlm.nih.gov/books/NBK26941/"
          }
        ]
      },
      {
        "id": "er-calcium",
        "name": "脂质代谢与钙储存",
        "function": "ER 膜中的酶、泵和通道参与脂质合成及钙稳态；ER 腔中的钙结合成分也参与储存。",
        "visible": false,
        "views": [
          "ordinary",
          "connection"
        ],
        "location": "ER 膜及其腔侧、胞质侧。",
        "partners": [
          "脂质代谢酶",
          "钙泵与释放通道"
        ],
        "note": "模型没有给出实际离子浓度、特定代谢速率或药物反应。",
        "sources": [
          {
            "title": "Alberts 等｜The Endoplasmic Reticulum",
            "url": "https://www.ncbi.nlm.nih.gov/books/NBK26841/"
          }
        ]
      }
    ],
    "sources": [
      {
        "title": "Shibata 等（2010）｜ER 片层与管状域的形成机制",
        "url": "https://pubmed.ncbi.nlm.nih.gov/21111237/"
      },
      {
        "title": "Terasaki 等（2013）｜连续 ER 片层的三维电镜重建",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3767119/"
      },
      {
        "title": "Voorhees 等（2014）｜核糖体—Sec61 冷冻电镜结构",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4081569/"
      },
      {
        "title": "Alberts 等｜The Endoplasmic Reticulum",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26841/"
      }
    ],
    "note": "连续拓扑和膜两侧朝向依据细胞生物学及电镜研究；外形是程序化教学构象，未使用某一个巨噬细胞的实测分割。腔内或胞质中的轻微粒子运动不表示固定的宏观环流。"
  },
  "golgi": {
    "title": "高尔基体 · cis—medial—trans—TGN",
    "function": "接收 ER 运来的蛋白质及脂质，进行进一步修饰，并在反面管网 TGN 分选到细胞表面或内体等目的地。",
    "location": "胞质内的有极性膜囊堆叠。顺面为接收侧，反面及 TGN 为主要分选侧；各区域的膜腔与胞质隔开。",
    "partners": [
      "ER—ERGIC：递送及回收",
      "顺面、中间囊、反面：依次变化的加工环境",
      "TGN 与运输载体：分选到表面、分泌和内体途径"
    ],
    "features": [
      {
        "id": "golgi-cis",
        "name": "顺面 · cis 接收侧",
        "function": "接收经 ERGIC 运来的分泌途径货物，并参与早期 Golgi 加工及回收。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "堆叠较下方的两层浅珊瑚色膜囊；颜色仅用于定位。",
        "partners": [
          "ERGIC",
          "中间囊",
          "返回 ER 的载体"
        ],
        "parts": [
          "golgi"
        ],
        "focus": "cis",
        "note": "电镜所见顺面附近的 ERGIC 元件可彼此分开，不能画成一根把 ER 与整个 Golgi 常开连通的水管。",
        "sources": [
          {
            "title": "Ladinsky 等（1999）｜哺乳动物 Golgi 双轴电镜断层重建",
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2150572/"
          },
          {
            "title": "Alberts 等｜Transport from the ER through the Golgi Apparatus",
            "url": "https://www.ncbi.nlm.nih.gov/books/NBK26941/"
          }
        ]
      },
      {
        "id": "golgi-medial",
        "name": "中间囊 · medial 加工区",
        "function": "货物在不同加工环境中经历糖链等修饰。区域身份由驻留成分等决定，不只由几何层数决定。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "堆叠中部三层膜囊。",
        "partners": [
          "顺面及反面",
          "常驻加工酶",
          "囊泡与管状回收途径"
        ],
        "parts": [
          "golgi"
        ],
        "focus": "medial",
        "note": "层数、颜色及酶分布不用于表达每个巨噬细胞的固定配置；本模型没有逐种建立加工酶。",
        "sources": [
          {
            "title": "Alberts 等｜Transport from the ER through the Golgi Apparatus",
            "url": "https://www.ncbi.nlm.nih.gov/books/NBK26941/"
          }
        ]
      },
      {
        "id": "golgi-trans",
        "name": "反面 · trans 输出侧",
        "function": "承担较晚加工并与反面分选区相接。电镜显示多层反面膜囊都可能具有管状延伸。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "较上方两层深珊瑚色膜囊，邻近 TGN。",
        "partners": [
          "中间囊",
          "TGN",
          "返回较早区室的载体"
        ],
        "parts": [
          "golgi"
        ],
        "focus": "trans",
        "note": "真实 Golgi 囊间连接随状态而变；教学模型把堆叠囊腔分开，没有把所有高尔基囊永不连接作为生物学结论。",
        "sources": [
          {
            "title": "Ladinsky 等（1999）｜哺乳动物 Golgi 双轴电镜断层重建",
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2150572/"
          }
        ]
      },
      {
        "id": "golgi-tgn",
        "name": "TGN · 反面管囊分选区",
        "function": "分支管囊结构参与货物分选并形成输出载体。模型中扁囊、连接颈、分支及环路围成同一个连续腔。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "堆叠上方的深珊瑚色管囊网络。",
        "partners": [
          "反面货物",
          "通往细胞表面和内体的载体",
          "分选受体及包被相关系统"
        ],
        "parts": [
          "golgi"
        ],
        "focus": "tgn",
        "note": "所示单个网络是电镜形态约束下的教学代表；未重建全部分支、囊间连接或真实出芽装置。",
        "sources": [
          {
            "title": "Ladinsky 等（1994）｜TGN 管网与出芽的三维电镜",
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2120188/"
          },
          {
            "title": "Ladinsky 等（1999）｜哺乳动物 Golgi 双轴电镜断层重建",
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2150572/"
          }
        ]
      },
      {
        "id": "golgi-lumen",
        "name": "膜囊腔 · 膜内货物",
        "function": "每个扁囊的膜把腔内货物与胞质隔开。进入按钮定位到中间囊的水性腔，剖切可看见薄囊内部。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "扁囊两侧膜面之间；不是两个相邻囊之间的胞质间隙。",
        "partners": [
          "腔内货物",
          "膜及腔内加工成分"
        ],
        "parts": [
          "golgi"
        ],
        "focus": "golgi-lumen",
        "sources": [
          {
            "title": "Alberts 等｜Transport from the ER through the Golgi Apparatus",
            "url": "https://www.ncbi.nlm.nih.gov/books/NBK26941/"
          }
        ]
      },
      {
        "id": "golgi-carriers",
        "name": "周围运输载体",
        "function": "独立的小泡表示 Golgi 与其他区室间的膜及货物运输；不同真实载体具有不同分选及融合成分。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "堆叠周围，每个载体有自身膜和腔。",
        "partners": [
          "高尔基体",
          "ER、细胞表面及内体"
        ],
        "parts": [
          "golgi",
          "transport-vesicles"
        ],
        "note": "载体不是从一层囊腔直接穿过多层膜的颗粒；本局部不把静态位置称为实测运输轨迹。",
        "sources": [
          {
            "title": "Ladinsky 等（1999）｜哺乳动物 Golgi 双轴电镜断层重建",
            "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2150572/"
          }
        ]
      },
      {
        "id": "golgi-maturation",
        "name": "囊成熟与逆向回收",
        "function": "囊成熟及多种膜运输共同维持 Golgi 的极性；常驻成分可回收到较早区室。",
        "visible": false,
        "views": [
          "ordinary"
        ],
        "location": "顺面至反面的动态膜系统。",
        "partners": [
          "驻留酶",
          "运输载体",
          "系留及 SNARE 融合装置"
        ],
        "note": "本局部显示空间结构，未把同一个静态囊的换色冒充完整囊成熟实验。",
        "sources": [
          {
            "title": "Alberts 等｜Transport from the ER through the Golgi Apparatus",
            "url": "https://www.ncbi.nlm.nih.gov/books/NBK26941/"
          }
        ]
      }
    ],
    "sources": [
      {
        "title": "Ladinsky 等（1999）｜哺乳动物 Golgi 双轴电镜断层重建",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2150572/"
      },
      {
        "title": "Ladinsky 等（1994）｜TGN 管网与出芽的三维电镜",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2120188/"
      },
      {
        "title": "Alberts 等｜Transport from the ER through the Golgi Apparatus",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26941/"
      }
    ],
    "note": "取材于哺乳动物 Golgi 的电镜断层研究；参考研究包含大鼠肾细胞，不能作为此巨噬细胞的原位测量。七层膜囊、独立 TGN 网络及色彩是便于观察的教学设计。"
  },
  "mitochondria": {
    "title": "线粒体",
    "function": "把营养物氧化释放的能量转为可利用的 ATP；内膜维持电化学质子梯度并耦联 ATP 合成。",
    "location": "胞质中的双膜细胞器；内膜围住基质，内外膜之间为膜间隙。",
    "partners": [
      "胞质代谢：交换底物、ADP 与 ATP",
      "细胞核：提供多数线粒体蛋白的编码信息",
      "病毒应答剧情：外膜胞质侧的 MAVS 是所选信号支架"
    ],
    "features": [
      {
        "name": "外膜",
        "function": "界定线粒体与胞质之间的边界，参与代谢物及蛋白质交换。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "内膜之外，与胞质相邻。",
        "partners": [
          "内膜：共同划分区室",
          "胞质：交换相关物质"
        ],
        "parts": [
          "mitochondria"
        ]
      },
      {
        "name": "内边界膜（IBM）",
        "function": "内膜邻近外膜的部分，与嵴膜连续，分隔基质与膜间隙。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "内膜紧邻外膜的一段，位于基质与膜间隙之间。",
        "partners": [
          "嵴膜：同一连续内膜",
          "跨膜运输系统（未逐个建模）"
        ],
        "parts": [
          "mitochondria"
        ]
      },
      {
        "name": "嵴膜与嵴连接颈",
        "function": "扩展内膜面积；嵴腔经连接颈通向膜间隙。",
        "visible": true,
        "note": "展示连续内膜与连接颈；12 个嵴是模型构图数量。",
        "views": [
          "ordinary"
        ],
        "location": "内膜向基质内折形成嵴；嵴腔在内膜的非基质侧。",
        "partners": [
          "内边界膜：经嵴连接颈连续",
          "呼吸链和 ATP 合酶：在内膜上协作"
        ],
        "parts": [
          "mitochondria"
        ]
      },
      {
        "name": "基质",
        "function": "包含多种氧化代谢酶及线粒体遗传系统。",
        "visible": true,
        "note": "指剖切中能辨认的区室；通用颗粒不等于某种已鉴定酶。",
        "views": [
          "ordinary"
        ],
        "location": "内膜基质侧、嵴膜之间。",
        "partners": [
          "内膜能量转换系统",
          "线粒体 DNA 及相关表达系统"
        ],
        "parts": [
          "mitochondria"
        ]
      },
      {
        "name": "膜间隙与嵴腔",
        "function": "位于内膜的非基质侧，参与跨内膜质子梯度。",
        "visible": true,
        "note": "是膜围出的空间，不是另外一层膜，也不是基质。",
        "views": [
          "ordinary"
        ],
        "location": "外膜与内膜之间为膜间隙；嵴腔经颈部与之相通，均区别于基质。",
        "partners": [
          "内膜呼吸链建立的质子梯度",
          "ATP 合酶利用跨内膜梯度"
        ],
        "parts": [
          "mitochondria"
        ]
      },
      {
        "name": "ATP 合酶头部与柄",
        "function": "示意利用质子梯度合成 ATP；催化头朝向基质。",
        "visible": true,
        "note": "教学头部与柄；未完整重建跨膜转子、亚基或催化循环。",
        "views": [
          "ordinary"
        ],
        "location": "示意头部伸向内膜的基质侧，柄连接到膜面附近。",
        "partners": [
          "跨内膜质子梯度",
          "ADP 与无机磷酸；完整转子未建出"
        ],
        "parts": [
          "mitochondria"
        ]
      },
      {
        "name": "线粒体 DNA 环",
        "function": "示意线粒体自身遗传信息的载体。",
        "visible": true,
        "note": "位置和环数为展示安排，不是实测拷贝数或序列。",
        "views": [
          "ordinary"
        ],
        "location": "基质内。",
        "partners": [
          "线粒体基因表达系统",
          "由细胞核编码并导入的蛋白质"
        ],
        "parts": [
          "mitochondria"
        ]
      },
      {
        "name": "呼吸链各复合体",
        "function": "传递电子并建立驱动 ATP 合成的质子梯度。",
        "visible": false,
        "note": "功能背景；通用颗粒不指认为完整复合体 I–IV。",
        "views": [
          "ordinary"
        ],
        "location": "线粒体内膜上；当前没有逐种复合体模型。",
        "partners": [
          "电子供体和氧",
          "ATP 合酶"
        ]
      }
    ],
    "sources": [
      {
        "title": "Alberts 等｜The Mitochondrion",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26894/"
      },
      {
        "title": "Cooper｜Mitochondria",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9896/"
      },
      {
        "title": "Perkins 等（1997）｜Electron tomography of neuronal mitochondria",
        "url": "https://pubmed.ncbi.nlm.nih.gov/9245766/"
      },
      {
        "title": "Seth et al. (2005) | Identification and characterization of MAVS",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16125763/"
      }
    ],
    "note": "模型保留双膜与嵴腔归属；比例、数量与颜色经展示调整。嵴连接颈依据电镜研究中的结构原则设计，不是该论文或巨噬细胞样本的网格重建。"
  },
  "lysosome": {
    "title": "溶酶体",
    "function": "在酸性腔内用水解酶分解运来的大分子，回收其组成成分。",
    "location": "胞质中的单膜降解区室；腔内环境与胞质分隔。",
    "partners": [
      "内体：递送内吞货物",
      "吞噬体：成熟过程中交流并融合",
      "高尔基体：经分选途径供应多种溶酶体蛋白"
    ],
    "features": [
      {
        "name": "单层包围膜与腔",
        "function": "把酸性降解环境与胞质分隔。",
        "visible": true,
        "note": "膜的内、外表面共同表示一层脂质膜，不是两套包膜。",
        "views": [
          "ordinary"
        ],
        "location": "腔与胞质之间的一层脂质双层膜。",
        "partners": [
          "内体及吞噬体膜",
          "膜泵和转运系统（未独立建模）"
        ],
        "parts": [
          "lysosome"
        ]
      },
      {
        "name": "分叶状水解酶形体",
        "function": "示意参与分解的腔内水解酶。",
        "visible": true,
        "note": "教学形体，不对应某个已解析的酶原子结构。",
        "views": [
          "ordinary"
        ],
        "location": "腔内。",
        "partners": [
          "适宜的腔内酸性环境",
          "待降解大分子"
        ],
        "parts": [
          "lysosome"
        ]
      },
      {
        "name": "腔内颗粒与分解片屑",
        "function": "示意可溶性内容物及处理中货物。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "膜围成的腔内。",
        "partners": [
          "水解酶",
          "分解产物的膜转运系统（未独立建模）"
        ],
        "parts": [
          "lysosome"
        ]
      },
      {
        "name": "V-ATPase 质子泵",
        "function": "消耗 ATP 向腔内泵入质子，参与维持酸性。",
        "visible": false,
        "note": "功能背景；当前没有独立建出的酸泵，不能把腔内颗粒叫作泵。",
        "views": [
          "ordinary"
        ],
        "location": "溶酶体膜上，ATP 水解部分朝胞质、质子被泵入腔内；当前未建出。",
        "partners": [
          "ATP",
          "其他离子转运系统共同调节腔内环境"
        ]
      }
    ],
    "sources": [
      {
        "title": "Cooper｜Lysosomes",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9953/"
      },
      {
        "title": "Ohkuma 等（1982）｜Identification and characterization of a proton pump on lysosomes",
        "url": "https://pubmed.ncbi.nlm.nih.gov/6178109/"
      },
      {
        "title": "Wang 等（2020）｜Structures of a Complete Human V-ATPase",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7655608/"
      }
    ],
    "note": "颜色不表示实测 pH。降解并不保证清除所有微生物；某些病原体能干扰成熟或在细胞内存活。"
  },
  "endosome": {
    "title": "内体",
    "function": "分选内吞货物；一部分回收至细胞表面，另一部分进入降解途径。",
    "location": "胞质中的单膜内吞区室；本入口展示带腔内小泡的多泡内体示例。",
    "partners": [
      "细胞膜：提供内吞货物并接收回收货物",
      "溶酶体：接续降解途径",
      "微管与马达：参与定位和运输"
    ],
    "features": [
      {
        "name": "内体限制膜与主腔",
        "function": "界定内吞区室，把主腔与胞质分隔。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "界膜以内、ILV以外为主腔。",
        "partners": [
          "内吞载体",
          "回收与内体—溶酶体途径"
        ],
        "parts": [
          "endosome"
        ]
      },
      {
        "name": "腔内小泡（ILV）",
        "function": "把部分膜货物分选到内体主腔中的小泡，可随降解途径处理。",
        "visible": true,
        "note": "每个小泡是一层膜的两面表示；数量是示例，不代表所有内体。",
        "views": [
          "ordinary"
        ],
        "location": "位于主腔内，各有自身膜。",
        "partners": [
          "被分选的膜货物",
          "后续溶酶体降解途径"
        ],
        "parts": [
          "endosome"
        ]
      },
      {
        "name": "小泡货物与可溶颗粒",
        "function": "示意被分选和运送的内容物。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "部分小泡内有专门货物；其余颗粒示意可溶内容物，未逐分子标定分布。",
        "partners": [
          "内体分选系统",
          "后续降解途径"
        ],
        "parts": [
          "endosome"
        ]
      },
      {
        "name": "回收小管与 ESCRT 机器",
        "function": "分别参与回收分选和部分 ILV 的形成。",
        "visible": false,
        "note": "功能背景；当前没有完整回收小管或 ESCRT 分子装置。",
        "views": [
          "ordinary"
        ],
        "location": "回收小管从内体延伸；ESCRT 在相应膜的胞质侧工作；当前均未建出。",
        "partners": [
          "回收货物",
          "ILV 形成途径"
        ]
      }
    ],
    "sources": [
      {
        "title": "Alberts 等｜Transport into the Cell from the Plasma Membrane: Endocytosis",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26870/"
      },
      {
        "title": "Overview of Intracellular Compartments and Trafficking Pathways",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK7286/"
      }
    ],
    "note": "多泡形态只是内体系统的一种状态。内体、溶酶体和吞噬体有不同来源与功能；有颗粒进入内体不意味着其内容物已进入胞质。"
  },
  "membrane": {
    "title": "细胞膜",
    "function": "构成选择性边界；膜蛋白参与物质运输、识别及信号接收。",
    "location": "细胞外环境与胞质之间；膜的胞质侧邻近皮层骨架。",
    "partners": [
      "皮层肌动蛋白：协助形状与表面运动",
      "内吞和分泌载体：交换膜与货物",
      "膜受体：把胞外信号传给胞内系统"
    ],
    "features": [
      {
        "name": "磷脂双层亲水头与疏水尾",
        "function": "亲水头面向两侧水相，疏水尾相向，构成膜的基本屏障。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "头朝两水相，尾在双层内部。",
        "partners": [
          "膜蛋白",
          "膜两侧的水相环境"
        ],
        "parts": [
          "membrane"
        ]
      },
      {
        "name": "FcγRIIA：IgG 结合代表",
        "function": "两个胞外 Ig 域识别 IgG Fc，单次跨膜连接含自身 ITAM 的胞质尾。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "胞外 D1/D2、单跨膜区、胞质侧 ITAM 尾。",
        "note": "粗模演示 Fc 与靠膜 D2 的接近、结合和离开；未模拟多个受体交联、磷酸化或 Syk 激活。",
        "partners": [
          "IgG Fc",
          "脂质双层；下游信号在本局部未模拟"
        ],
        "parts": [
          "membrane",
          "membrane-proteins"
        ]
      },
      {
        "name": "P2X7：ATP 门控阳离子通道代表",
        "function": "三聚体的胞外亚基界面结合 ATP；每亚基两个跨膜区，TM2 围成中央门控孔。播放时示意 ATP 结合、开放、阳离子通行及离开后关闭。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "胞外 ATP 位点、六个跨膜区与胞质侧结构域。",
        "note": "参考大鼠 6U9V/6U9W 的拓扑；程序化包络和门控，不是人细胞原子重建。Na+ 向内、K+ 向外为典型电化学条件下的示意；不接为所有病毒必经反应，也不量化电流。",
        "partners": [
          "胞外 ATP",
          "Na+ 与 K+；仅开放期间显示通行"
        ],
        "parts": [
          "membrane",
          "membrane-proteins"
        ]
      },
      {
        "name": "细胞外侧糖链",
        "function": "细胞表面的糖组分参与保护和分子识别。",
        "visible": false,
        "note": "背景知识；当前膜详情未独立建立糖链模型。",
        "views": [
          "ordinary"
        ],
        "location": "朝胞外侧。",
        "partners": [
          "膜糖蛋白和糖脂",
          "细胞外环境"
        ],
        "parts": [
          "membrane"
        ]
      },
      {
        "name": "膜下皮层肌动蛋白网络",
        "function": "在胞质侧支撑膜并参与伪足、吞噬杯等表面形变。",
        "visible": false,
        "note": "背景知识；膜详情未独立建出该网络；整体周缘有示意细丝，肌动蛋白的局部模型在细胞骨架入口。",
        "views": [
          "ordinary"
        ],
        "location": "紧贴细胞膜内侧的胞质皮层；此详情没有独立网络模型。",
        "partners": [
          "膜连接与调节蛋白",
          "肌动蛋白重排系统"
        ]
      }
    ],
    "sources": [
      {
        "title": "Cooper｜Structure of the Plasma Membrane",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9898/"
      },
      {
        "title": "Cooper｜The Cytoskeleton and Cell Movement",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9893/"
      },
      {
        "title": "RCSB PDB 1FCG｜人 FcγRIIA 两个胞外 Ig 域",
        "url": "https://www.rcsb.org/structure/1FCG"
      },
      {
        "title": "UniProt P12318｜人 FCGR2A 膜拓扑",
        "url": "https://www.uniprot.org/uniprotkb/P12318/entry"
      },
      {
        "title": "Ben Mkaddem 等｜FcγRIIA 自身 ITAM 的实验研究",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4151227/"
      },
      {
        "title": "McCarthy 等（2019）｜P2X7 闭/开态结构",
        "url": "https://doi.org/10.1016/j.cell.2019.09.017"
      },
      {
        "title": "Janks 等（2019）｜人单核细胞来源巨噬细胞的 P2X7 功能",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6352910/"
      }
    ],
    "note": "脂质双层沿平面剖开；膜蛋白只在靠膜位置开局部窗口，远端结构保留完整。观察的是双层局部和通道，不是进入“膜内水腔”。普通胞质大分子及周缘拥挤颗粒不自动等同核糖体或皮层蛋白。"
  },
  "cytoskeleton": {
    "title": "细胞骨架",
    "function": "组织细胞形状与胞内位置，为马达驱动的货物运输提供轨道；肌动蛋白参与表面运动。",
    "location": "分布在胞质，并与细胞膜及细胞器相联；不同丝状系统有不同作用。",
    "partners": [
      "运输泡与细胞器：沿轨道定位",
      "马达蛋白：把化学能耦联到运动",
      "细胞膜：通过皮层与连接蛋白协作"
    ],
    "features": [
      {
        "name": "13 原纤维中空微管",
        "function": "由微管蛋白聚合形成管壁，作为运输和组织的骨架。",
        "visible": true,
        "note": "采用常见的 13 原纤维示例；不是所有细胞微管都只可能有 13 条。",
        "views": [
          "ordinary"
        ],
        "location": "中央空间是蛋白管内部，不是膜腔。",
        "partners": [
          "管外马达蛋白",
          "运输泡及相关细胞器"
        ],
        "parts": [
          "cytoskeleton",
          "microtubules"
        ]
      },
      {
        "name": "肌动蛋白螺旋聚合物",
        "function": "示意可重组的细丝，参与形状、皮层与表面运动。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "胞质/皮层网络的局部示意。",
        "partners": [
          "肌动蛋白调节及连接蛋白（未逐种建模）",
          "膜下皮层和表面运动系统"
        ],
        "parts": [
          "cytoskeleton",
          "actin"
        ]
      },
      {
        "name": "马达头部与柄",
        "function": "示意利用 ATP 驱动、沿骨架运输货物的分子马达。",
        "visible": true,
        "note": "未指定为某种 kinesin、dynein 或 myosin 的精确结构。",
        "views": [
          "ordinary"
        ],
        "location": "示意结合微管外侧。",
        "partners": [
          "微管轨道",
          "运输泡与 ATP"
        ],
        "parts": [
          "cytoskeleton",
          "microtubules"
        ]
      },
      {
        "name": "马达所连运输泡",
        "function": "示意被运输的膜性货物载体。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "微管外侧，不走中央空腔。",
        "partners": [
          "马达头部与柄",
          "微管轨道"
        ],
        "parts": [
          "cytoskeleton",
          "microtubules",
          "transport-vesicles"
        ]
      },
      {
        "name": "中间丝网络",
        "function": "为细胞提供另一类力学支撑。",
        "visible": false,
        "note": "背景知识；当前骨架详情没有独立建出完整中间丝网络。",
        "views": [
          "ordinary"
        ],
        "location": "胞质内的丝状支撑系统；当前没有独立网络模型。",
        "partners": [
          "细胞连接与其他骨架系统"
        ]
      }
    ],
    "sources": [
      {
        "title": "Alberts 等｜The Self-Assembly and Dynamic Structure of Cytoskeletal Filaments",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26862/"
      },
      {
        "title": "Alberts 等｜Molecular Motors",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26888/"
      },
      {
        "title": "Cooper｜Microtubule Motors and Movements",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9833/"
      },
      {
        "title": "Burton 等（1975）｜Microtubules with 12, 13, and 15 protofilaments",
        "url": "https://pubmed.ncbi.nlm.nih.gov/47861/"
      }
    ],
    "note": "进入微管中央腔是展示管壁排列的观察方式；正常沿微管运输的囊泡在管外，不在微管腔内漂流。"
  },
  "pore": {
    "title": "核孔复合体",
    "function": "介导核与胞质之间受控的双向物质交换，涉及蛋白质、RNA 及核糖体亚基运输。",
    "location": "嵌在内、外核膜会合处的贯通开口，连接的是核质与胞质。",
    "partners": [
      "核膜：支撑复合体并围住孔缘",
      "运输受体：识别与运输特定货物",
      "细胞核及胞质：通道两端的区室"
    ],
    "features": [
      {
        "name": "八重对称支架",
        "function": "围绕中央运输通道形成复合体的结构骨架。",
        "visible": true,
        "note": "重复分叶为教学结构域，不对应逐个核孔蛋白的原子模型。",
        "views": [
          "ordinary"
        ],
        "location": "围绕核质—胞质通道。",
        "partners": [
          "核膜孔缘",
          "中央通道及两侧纤维结构"
        ],
        "parts": [
          "pore"
        ]
      },
      {
        "name": "中央贯通通道",
        "function": "为核质与胞质交换提供空间通路。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "跨核包膜，不是PNS—ER的出口。",
        "partners": [
          "FG 选择性屏障与运输受体（未建模）",
          "核质和胞质中的货物"
        ],
        "parts": [
          "pore"
        ]
      },
      {
        "name": "胞质侧纤维与核篮",
        "function": "示意核孔两侧的结构延伸及运输相关界面。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "胞质纤维朝胞质，核篮朝核质；分列支架两端。",
        "partners": [
          "核孔支架",
          "相应核质—胞质运输系统"
        ],
        "parts": [
          "pore"
        ]
      },
      {
        "name": "FG 核孔蛋白选择性屏障",
        "function": "与运输受体协作，控制大分子通行。",
        "visible": false,
        "note": "背景机制；空心通道不代表所有分子都能自由通过，当前未模拟屏障聚合物。",
        "views": [
          "ordinary"
        ],
        "location": "核孔中央运输通道内；当前没有 FG 聚合物模型。",
        "partners": [
          "运输受体",
          "需要受控通行的大分子货物"
        ]
      }
    ],
    "sources": [
      {
        "title": "Cooper｜Nuclear Envelope and Traffic between the Nucleus and Cytoplasm",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9927/"
      },
      {
        "title": "Mosalaganti 等（2022）｜Integrative structural analysis of human nuclear pores",
        "url": "https://pubmed.ncbi.nlm.nih.gov/35679397/"
      }
    ],
    "note": "此入口放大观察单个核孔；八重对称与两侧方向关系是教学重点，不代表分子级运输动力学。"
  },
  "phagosome": {
    "title": "吞噬体",
    "function": "包围被吞入的大颗粒，并在成熟、酸化及与内体—溶酶体系统交流后参与降解。",
    "location": "由细胞表面吞噬过程形成的单膜胞内区室；其腔内货物尚未因此进入胞质。",
    "partners": [
      "细胞膜与肌动蛋白：形成吞噬杯",
      "微管与马达：参与运输和定位",
      "溶酶体：提供降解内容物并发生融合"
    ],
    "features": [
      {
        "name": "包围膜与腔内空间",
        "function": "将吞入颗粒包在独立区室中。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "膜内是腔，膜外是胞质。",
        "partners": [
          "内体—溶酶体系统",
          "腔内被吞噬货物"
        ],
        "parts": [
          "phagosome"
        ]
      },
      {
        "name": "粗糙货物核心及层片碎片",
        "function": "示意待清除颗粒和分解后的碎片。",
        "visible": true,
        "note": "通用货物，不指认具体病原体或成分。",
        "views": [
          "ordinary"
        ],
        "location": "吞噬体腔内。",
        "partners": [
          "腔内降解酶",
          "融合后形成的降解环境"
        ],
        "parts": [
          "phagosome"
        ]
      },
      {
        "name": "剧情中的停靠与融合颈",
        "function": "示意两区室从接触到共享膜及腔的过程。",
        "visible": true,
        "note": "在清除剧情显示；不是该静态入口每一帧都有的结构。",
        "views": [
          "clearance"
        ],
        "location": "清除剧情中吞噬体与停靠溶酶体的接触、融合区；静态入口没有该融合颈。",
        "partners": [
          "两区室膜",
          "水解酶与货物"
        ],
        "parts": [
          "phagosome",
          "lysosome"
        ]
      },
      {
        "name": "吞噬受体及融合机器分子",
        "function": "参与识别、成熟与膜融合调节。",
        "visible": false,
        "note": "背景机制；未逐一建立受体、Rab 或 SNARE 分子装置。",
        "views": [
          "ordinary"
        ],
        "location": "细胞表面或成熟区室的相应膜面；当前未逐种建出。",
        "partners": [
          "肌动蛋白重排系统",
          "成熟和膜融合调节系统"
        ]
      }
    ],
    "sources": [
      {
        "title": "Alberts 等｜Innate Immunity：Phagocytic Cells",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26846/"
      },
      {
        "title": "Cooper｜Lysosomes",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9953/"
      }
    ],
    "note": "吞噬体是有来源和成熟过程的区室，不与内体或溶酶体互换名称。清除剧情压缩了真实时间并省略许多调控步骤。"
  },
  "peroxisome": {
    "title": "过氧化物酶体",
    "function": "进行多种氧化代谢，包括部分脂肪酸处理；产生的过氧化氢可由过氧化氢酶等系统处理。",
    "location": "胞质中的单膜细胞器，内部含代谢酶；没有自己的基因组。",
    "partners": [
      "细胞质核糖体：提供许多待导入的酶",
      "内质网与线粒体：参与细胞的脂质代谢协作",
      "抗氧化系统：共同调节活性氧"
    ],
    "features": [
      {
        "name": "单层包围膜",
        "function": "围住酶促反应区室，并允许受控的物质交换。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "胞质与过氧化物酶体基质之间的一层脂质双层膜。",
        "partners": [
          "基质代谢酶",
          "蛋白导入和物质交换系统（未独立建模）"
        ],
        "parts": [
          "peroxisome"
        ]
      },
      {
        "name": "密集酶基质与酶聚团",
        "function": "示意氧化代谢及过氧化氢处理的酶内容物。",
        "visible": true,
        "note": "通用教学形体，不把每个颗粒指认为过氧化氢酶或某一种已解析的蛋白。",
        "views": [
          "ordinary"
        ],
        "location": "内部基质。",
        "partners": [
          "氧化代谢底物",
          "过氧化氢处理系统；通用颗粒不对应特定酶身份"
        ],
        "parts": [
          "peroxisome"
        ]
      },
      {
        "name": "特定晶体核心",
        "function": "某些物种、组织的过氧化物酶体可有酶晶体。",
        "visible": false,
        "note": "背景知识；非通用特征；本模型未把酶聚团称作巨噬细胞必有晶核。",
        "views": [
          "ordinary"
        ],
        "location": "某些组织或物种的过氧化物酶体内部；非当前模型的通用结构。",
        "partners": [
          "形成晶体的特定酶；本模型未作此身份指定"
        ]
      }
    ],
    "sources": [
      {
        "title": "Cooper｜Peroxisomes",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9930/"
      },
      {
        "title": "Alberts 等｜Peroxisomes",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26858/"
      }
    ],
    "note": "过氧化物酶体不等同于装有酸性水解酶的溶酶体，也不因形状相似而具有相同功能。"
  },
  "ribosome": {
    "title": "核糖体",
    "function": "按 mRNA 的信息合成多肽；由 rRNA 与蛋白质组成的大、小亚基共同完成翻译。",
    "location": "可位于胞质，也可在翻译特定蛋白时附着于 ER 的胞质侧；本入口放大观察亚基界面。",
    "partners": [
      "mRNA：提供编码信息",
      "tRNA：递送与密码子相配的氨基酸",
      "ER：接收进入分泌途径的新生链"
    ],
    "features": [
      {
        "name": "小亚基",
        "function": "参与 mRNA 与 tRNA 的配对、解码。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "与大亚基接合。",
        "partners": [
          "大亚基",
          "mRNA 与 tRNA；tRNA 未建出"
        ],
        "parts": [
          "ribosome"
        ]
      },
      {
        "name": "大亚基",
        "function": "提供形成肽键的催化中心及新生肽链通路。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "与小亚基接合。",
        "partners": [
          "小亚基",
          "tRNA 与翻译因子（未逐个建模）"
        ],
        "parts": [
          "ribosome"
        ]
      },
      {
        "name": "mRNA 与新生多肽",
        "function": "分别示意输入的编码模板及正在形成的产物。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "mRNA通过亚基接合区，肽链伸出。",
        "partners": [
          "两亚基",
          "新生链后续折叠与靶向系统（未逐种建模）"
        ],
        "parts": [
          "ribosome"
        ]
      },
      {
        "name": "rRNA 折叠与蛋白质域",
        "function": "示意核糖体的 RNA 骨架和蛋白质组成。",
        "visible": true,
        "note": "内部线圈与颗粒为教学构象，不是 PDB 原子坐标或确定序列。",
        "views": [
          "ordinary"
        ],
        "location": "亚基内部及表面。",
        "partners": [
          "亚基中的 rRNA 与蛋白质",
          "翻译装置"
        ],
        "parts": [
          "ribosome"
        ]
      },
      {
        "name": "tRNA 及 A/P/E 位点循环",
        "function": "把氨基酸加入延长中的多肽并随翻译循环转位。",
        "visible": false,
        "note": "功能背景；当前未建立完整 tRNA 和翻译周期。",
        "views": [
          "ordinary"
        ],
        "location": "真实核糖体的亚基接合区域；当前未建立完整 tRNA 或位点循环。",
        "partners": [
          "mRNA",
          "两亚基及翻译因子"
        ]
      }
    ],
    "sources": [
      {
        "title": "Cooper｜Translation of mRNA",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9849/"
      }
    ],
    "note": "核糖体没有包膜，也没有供相机进入的膜腔；局部观察展示两亚基之间的翻译界面。"
  }
};
const SCENARIO_GUIDE = {
  "clearance": {
    "summary": "跟随一颗通用货物，从吞噬包围、胞内成熟到与溶酶体融合后分解，观察区室边界如何变化。",
    "steps": [
      {
        "title": "吞噬",
        "desc": "细胞表面形成包围货物的杯状膜，闭合后形成吞噬体。真实细胞中肌动蛋白与受体参与这一过程；模型没有逐个展示其分子装置。"
      },
      {
        "title": "成熟",
        "desc": "吞噬体沿示意骨架路线向内运输，与溶酶体接近、停靠；两膜先保持分离，再从接触处建立连续融合颈。早期内体交换、酸化和调控步骤被压缩。"
      },
      {
        "title": "降解",
        "desc": "融合后区室共享腔内空间，示意水解酶进入及货物碎化、缩小。画面表现降解方向，不是实测反应速率或每种病原体的结局。"
      }
    ],
    "notes": [
      "吞噬体、内体与溶酶体分开命名；成熟需要区室间交流，不由球体换色自动定义。",
      "迁移路线和箭头用于叙事；骨架上的囊泡运输不等于胞质宏观液流，微管运输在管外。",
      "融合颈是经过设计的连续膜形变；没有重建每一层脂质、半融合中间态或全部分子机器。",
      "腔内酶及片屑为教学形体；比例、时间和显示数量经调整。"
    ],
    "sources": [
      {
        "title": "Alberts 等｜Innate Immunity：Phagocytic Cells",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26846/"
      },
      {
        "title": "Cooper｜Lysosomes",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9953/"
      },
      {
        "title": "Cooper｜Microtubule Motors and Movements",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9833/"
      }
    ]
  },
  "virus": {
    "summary": "通用包膜 RNA 颗粒摄取与一条有条件的抗病毒信号支路：胞质 RNA 识别后，经 MAVS、IRF3、IFN-β 及 IFNAR 应答。摄取与胞质识别分开呈现。",
    "steps": [
      {
        "title": "包膜颗粒接近与摄取",
        "desc": "放大通用包膜 RNA 颗粒摄取示意，局部膜内陷与断颈过程省略。摄取不等于有效感染；比例与时序经展示调整。"
      },
      {
        "title": "内体运输与组分分解",
        "desc": "颗粒在内体系统中运输与组分分解。内体不被直接改称溶酶体；本段不展示 RNA 向胞质漏出。"
      },
      {
        "title": "胞质 RNA 感知支路（选择性示意）",
        "desc": "切换独立条件支路：需可识别 RNA 已在胞质。RIG-I 是选定传感器示例，不代表每种 RNA 病毒或唯一识别通路。"
      },
      {
        "title": "IRF3 入核与 IFNB1 转录",
        "desc": "省略部分中间反应，示意 MAVS 下游激活 IRF3 并促其入核。IFNB1 转录还需其他协同因子；核内图形为局部教学投影，非基因实测坐标。"
      },
      {
        "title": "IFN-β 的加工与释放",
        "desc": "压缩示意翻译、ER/高尔基加工与胞外 IFN-β；省略分泌囊泡对接、膜融合孔与释放过程的局部形变。路线非实测轨迹。"
      },
      {
        "title": "IFNAR 与抗病毒基因应答",
        "desc": "胞外 IFN-β 结合表面 IFNAR，示意 JAK–STAT 及 STAT1/STAT2–IRF9 入核并诱导 ISG；不表示所有病毒均被清除。"
      }
    ],
    "notes": [
      "颗粒摄取不等于有效感染，也不证明能产生有感染性的子代；画面没有病毒完整复制周期。",
      "RIG-I 支路的前提是可识别 RNA 已在胞质；当前没有展示其如何穿过内体膜，不把前段分解自动连成 RNA 逃逸。",
      "MAVS 在真实线粒体外膜保留表面的胞质侧；IRF3 和 STAT 经实际核孔位置运输，路径仍为教学安排。",
      "核内 IFNB1 图形是转录教学投影；IRF3 之外的协同因子和多项中间反应没有逐一显示。",
      "IFN-β 的 ER—高尔基加工、胞外释放及 IFNAR 反馈是压缩示意；局部摄取断颈与分泌融合孔形变省略。",
      "本例选择自分泌支路：本细胞释放的 IFN-β 作用于同一细胞的 IFNAR。旁分泌作用于邻近细胞的支路未展开。",
      "IFNAR1/2 为嵌膜教学亚基：选择一个胞外 IFN-β 接合 IFNAR2，并显示两链有限侧移、稳定结合态及胞质 JAK 激活；原子结合界面、全部中间反应与真实动力学未重建。下游用 STAT1/STAT2–IRF9 与 ISG 表示应答，不表示病毒必被清除。",
      "发光、虚线与脉冲表示信号顺序，既不是实体管道，也不是实测分子轨迹或宏观水流。"
    ],
    "sources": [
      {
        "title": "Martínez-Colón 等（2022）｜Human macrophage infection outcomes",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9529056/"
      },
      {
        "title": "Xia 等（2015）｜RIG-I/MAVS、IRF3 与 Ifnb：小鼠 BMDM",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4569712/"
      },
      {
        "title": "Seth 等（2005）｜Identification and characterization of MAVS",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16125763/"
      },
      {
        "title": "Zhou、Zhao、Perlman（2010）｜Macrophage autocrine interferon priming",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2957079/"
      },
      {
        "title": "Wood 等（2013）｜Primary macrophage IFNAR/STAT1 and ISG responses",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3703304/"
      },
      {
        "title": "Wilmes 等（2015）｜IFNAR1/2 ligand-induced assembly",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4442803/"
      },
      {
        "title": "Platanitis et al. (2019) | A molecular switch from STAT2-IRF9 to ISGF3",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6606597/"
      }
    ]
  }
};
export {
  SCENARIO_GUIDE,
  STRUCTURE_GUIDE
};
