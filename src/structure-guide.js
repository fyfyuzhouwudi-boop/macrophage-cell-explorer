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
    "title": "内质网",
    "function": "粗面内质网接收分泌途径及膜蛋白的新生链，进行折叠和早期加工；ER 也参与脂质代谢与钙储存。",
    "location": "胞质内展开的膜性囊与网络；外核膜及核周隙分别延续到 ER 膜及 ER 腔。",
    "partners": [
      "核膜：膜与腔的连续",
      "附着核糖体：在膜的胞质侧翻译",
      "高尔基体：接收后续加工与分选的货物"
    ],
    "features": [
      {
        "name": "折叠膜囊与共同腔",
        "function": "围出独立于胞质的 ER 腔，为蛋白质折叠与加工提供环境。",
        "visible": true,
        "views": [
          "ordinary",
          "connection"
        ],
        "location": "囊膜内为 ER 腔，膜外为胞质；连接模式延伸至核周隙。",
        "partners": [
          "附着核糖体与腔内折叠系统",
          "高尔基体运输途径"
        ],
        "parts": [
          "er"
        ]
      },
      {
        "name": "胞质侧附着核糖体",
        "function": "翻译进入 ER 分泌途径的新生蛋白；核糖体主体在膜外胞质侧。",
        "visible": true,
        "views": [
          "ordinary",
          "connection"
        ],
        "location": "ER膜胞质侧，不在腔内。",
        "partners": [
          "mRNA、tRNA 与翻译因子",
          "ER 跨膜转运装置（未独立建模）"
        ],
        "parts": [
          "er",
          "ribosome"
        ]
      },
      {
        "name": "核周隙—ER 腔连接",
        "function": "显示外核膜延续及腔内连续；不是核质向 ER 开洞。",
        "visible": true,
        "views": [
          "connection"
        ],
        "location": "外核膜延伸至 ER 膜的接头内侧；连通核周隙和 ER 腔。",
        "partners": [
          "外核膜与 ER 膜",
          "核周隙与 ER 腔；核质不属于这条通路"
        ],
        "parts": [
          "er",
          "nucleus"
        ]
      },
      {
        "name": "腔内蛋白颗粒",
        "function": "示意新生蛋白及折叠相关内容物。",
        "visible": true,
        "note": "通用形体，不指认某一种伴侣蛋白的原子结构。",
        "views": [
          "ordinary"
        ],
        "location": "普通ER水腔内。",
        "partners": [
          "腔内折叠系统（以通用形体表示）",
          "后续送往高尔基体的运输载体"
        ],
        "parts": [
          "er"
        ]
      },
      {
        "name": "平滑内质网管网域",
        "function": "无附着核糖体的 ER 管网与粗面域共用连续膜腔；这类区域可参与脂质代谢与钙调控。",
        "visible": true,
        "note": "已建出相连的分支管网和共同腔；未逐一建立脂质代谢酶、钙泵或浓度场。",
        "views": [
          "ordinary",
          "connection"
        ],
        "location": "与粗面片层相连的无核糖体管网域；同属内质网。",
        "partners": [
          "脂质代谢酶",
          "其他 ER 区域"
        ]
      },
      {
        "name": "钙泵与钙释放通道",
        "function": "调节 ER 与胞质间的钙储存和信号。",
        "visible": false,
        "note": "功能背景，未建出相应分子装置或离子浓度场。",
        "views": [
          "ordinary",
          "connection"
        ],
        "location": "ER 膜及其两侧的胞质、ER 腔；本模型未建立专门装置。",
        "partners": [
          "钙结合蛋白",
          "胞质信号网络"
        ]
      }
    ],
    "sources": [
      {
        "title": "Alberts 等｜The Endoplasmic Reticulum",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26841/"
      },
      {
        "title": "Cooper｜The Endoplasmic Reticulum",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9889/"
      },
      {
        "title": "Cooper｜Glossary：outer nuclear membrane continuity",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9926/"
      }
    ],
    "note": "膜囊数量、连接颈布局及厚度服务于展示，不是某个巨噬细胞的电镜分割。腔内颗粒运动不代表细胞发生宏观液流。"
  },
  "golgi": {
    "title": "高尔基体",
    "function": "进一步修饰 ER 运来的蛋白质与脂质，并把货物分选到细胞表面、分泌或内体—溶酶体途径。",
    "location": "胞质中的扁平膜囊堆叠；与 ER 相邻但不是同一共同腔。",
    "partners": [
      "内质网：递送与回收货物",
      "运输载体：连接不同区室",
      "内体与细胞膜：接收分选货物"
    ],
    "features": [
      {
        "name": "分层扁平囊与囊腔",
        "function": "提供分区的加工环境；图中各囊腔彼此分开。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "胞质内层叠的扁平膜囊；本模型各囊腔分开。",
        "partners": [
          "ER 运来的货物",
          "分选与回收载体"
        ],
        "parts": [
          "golgi"
        ]
      },
      {
        "name": "囊腔内货物",
        "function": "示意正在加工、将被分选的内容物。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "扁囊腔内。",
        "partners": [
          "高尔基加工酶（未逐种建模）",
          "后续运输载体"
        ],
        "parts": [
          "golgi"
        ]
      },
      {
        "name": "周围运输泡",
        "function": "示意货物在高尔基体与其他区室间转运的载体。",
        "visible": true,
        "views": [
          "ordinary"
        ],
        "location": "Golgi周围，各有自身腔。",
        "partners": [
          "高尔基体与 ER",
          "细胞表面和内体途径"
        ],
        "parts": [
          "golgi",
          "transport-vesicles"
        ]
      },
      {
        "name": "包被与 SNARE 装置",
        "function": "参与载体形成、识别和膜融合。",
        "visible": false,
        "note": "背景机制；未建出 COP、网格蛋白或 SNARE 的专门分子结构。",
        "views": [
          "ordinary"
        ],
        "location": "相应载体和靶膜的胞质侧；背景机制，当前没有分子模型。",
        "partners": [
          "货物与分选受体",
          "供体膜和靶膜"
        ]
      }
    ],
    "sources": [
      {
        "title": "Alberts 等｜Transport from the ER through the Golgi Apparatus",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK26941/"
      },
      {
        "title": "Cooper｜The Golgi Apparatus",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9838/"
      },
      {
        "title": "Cooper｜The Mechanism of Vesicular Transport",
        "url": "https://www.ncbi.nlm.nih.gov/books/NBK9886/"
      }
    ],
    "note": "层叠外形与运输泡是教学示意；没有逐一标定每层的酶组成，也没有演示所有囊成熟或回收步骤。"
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
