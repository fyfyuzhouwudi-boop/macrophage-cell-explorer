# 来源与模型身份

本表说明教学展览的结构依据、公开坐标与样本范围。当前课堂重点改动见 `qa/classroom-priorities-notes-20261025.md`；本轮构建身份、浏览器画面和性能结论待主任务补齐，旧构建报告不自动适用于新增结构。原始研究与来源记录保存在 `science/`、`assets/molecular-sources/`、`qa/source-cache/` 及结构说明中。程序模型不是论文电镜图像的分割重建。

## 2026-10-25 膜形态、渲染与设计资料

- [Visualizing Membrane Ruffle Formation using Scanning Electron Microscopy](https://pmc.ncbi.nlm.nih.gov/articles/PMC9059639/)与[Membrane Ruffles Capture C3bi-opsonized Particles in Activated Macrophages](https://pmc.ncbi.nlm.nih.gov/articles/PMC2575151/)提供特定实验条件下的巨噬细胞表面褶皱语境。本轮据此缩短原来夸大的圆头突起，收细真实剖切交线；未使用论文图片作为模型贴图，也未声称所有巨噬细胞具有同一形态。
- [jrc_macrophage-2，THP-1 各向同性三维电镜数据](https://doi.org/10.25378/janelia.13114343.v2)是查实的原始体积数据路线，CC BY 4.0。本版未下载、分割或采用该数据，不能把教学膜网格称为这一数据集的重建结果。
- [cellPACK](https://github.com/mesoscope/cellpack)的区室边界与摆位思路、[Mol*](https://github.com/molstar/molstar)的选择与尺度分层用作工程参考。未导入其代码；cellPACK 根许可和所查文件的许可标头存在差异，未据此复制实现。
- [Three.js 的次表面散射示例](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/SubsurfaceScatteringShader.js)用作柔和照明的原理参考。整胞膜保持不透明，胞质背衬使用受限的深度色调和曲率明暗；这不是实测脂双层光学，也不是流体或完整体积散射求解。
- 按用户要求通过 find-skills 检索并采用[官方 frontend-design 技能](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)的界面原则：明确的展览方向、单列分组、简化层级和次要内容按需展开。未安装额外技能包。

## 细胞结构与协作

| 内容 | 来源 | 在作品中的使用 |
| --- | --- | --- |
| 外核膜与 ER、核周隙与 ER 腔 | [Bragulat-Teixidor 等，EMBO Reports 2024](https://link.springer.com/article/10.1038/s44319-024-00175-w)；[Cooper：核膜与核质交换](https://www.ncbi.nlm.nih.gov/books/NBK9927/) | 膜连续性与不同区室的关系；程序膜网格不是论文分割数据 |
| 核孔与孔膜 | [Otsuka 等，eLife 2016](https://elifesciences.org/articles/19071)；[Schuller 等，Nature 2021](https://www.nature.com/articles/s41586-021-03985-3) | 孔膜、支架及核质—胞质通道；未求解 FG 屏障的选择性运输 |
| 线粒体内膜、嵴颈与区室 | [Perkins 等，1997](https://pubmed.ncbi.nlm.nih.gov/9245766/)；[Alberts：线粒体](https://www.ncbi.nlm.nih.gov/books/NBK26894/) | 基质、内膜、嵴及膜间隙的归属；形状与比例为教学设置 |
| ER—高尔基—内体—溶酶体 | [ER 与高尔基运输](https://www.ncbi.nlm.nih.gov/books/NBK26941/)；[内吞](https://www.ncbi.nlm.nih.gov/books/NBK26870/)；[溶酶体](https://www.ncbi.nlm.nih.gov/books/NBK9953/) | 合成、分选、回收、处理的功能协作；普通关系线不表示膜腔连续 |

## 三类骨架

| 来源 | 支持范围 |
| --- | --- |
| [Blocker 等，J Cell Biol 1997](https://pmc.ncbi.nlm.nih.gov/articles/PMC2139871/) · DOI 10.1083/jcb.137.1.113 | 微管/马达参与吞噬体双向运动。画面载体与轨迹为少量教学代表，不沿用实测速率。 |
| [Jaumouillé 等，Developmental Cell 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4083245/) · DOI 10.1016/j.devcel.2014.04.031 | 肌动蛋白与 FcγR 活动、聚集的关系。局部 actin 和受体不是实测空间图。 |
| [Hartwig & Shevlin，J Cell Biol 1986](https://pmc.ncbi.nlm.nih.gov/articles/PMC2114287/) · DOI 10.1083/jcb.103.3.1007 | 肺巨噬细胞提取骨架 EM 中的外周互联、分支与交叉，为不均匀皮质网络提供关系依据。铺展、提取和干燥后的标本不是活细胞三维地图，不能把全部交叉都指认为 Arp2/3 分支。 |
| [Barger 等，Mol Biol Cell 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9727803/) · DOI 10.1091/mbc.E22-06-0210 | C57BL/6 小鼠原代 BMDM 摄取 IgG 包被可变形靶物，并与 RAW264.7 比较；支持 F-actin 组织随细胞背景、靶物力学及 myosin 条件变化。所选局部分支域不是所有巨噬细胞的固定布局，不模拟吞噬力。 |
| [Polarized microtubule remodeling transforms the morphology of reactive microglia and drives cytokine release，Nat Commun 2023](https://www.nature.com/articles/s41467-023-41891-6) · DOI 10.1038/s41467-023-41891-6 | 原代小鼠小胶质细胞的外周微管弯曲及 LPS 反应中更明显的径向排列，说明网络组织依赖状态；不是本巨噬细胞的特定激活状态或原位重建。 |
| [Patteson 等，J Cell Biol 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6891099/) · DOI 10.1083/jcb.201902046 | 小鼠胚胎成纤维细胞中 vimentin 核周网络、外周延展与核力学保护的关系。核周中间丝为形态支撑示意，不移植其丝数、路径或力为人巨噬细胞测量。 |
| [Zimmet 等，Sci Adv 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7274804/) · DOI 10.1126/sciadv.aaz7651 | 人 Arp2/3 结构及生化研究提供所选约 70° 母—子丝分支的机制背景。NPF 结合结构不等于完整原位分支连接的分割，本网络未导入其原子坐标或模拟成核动力学。 |

骨架入口观察与整胞相同的微管、F-actin 和中间丝网络：微管保持相对刚直和状态相关的组织，actin 以不均匀皮质丝及选定局部相接分支表达，IF 为不闭合核周延展。去除显示算法的等距弧线与经纬笼，不表示以随机线团代替生物网络。数量、位置和显示直径是教学选择；详情与几何检查范围见 `qa/cytoskeleton-naturalism-20261025.md`。

The cytoskeleton entry observes the same whole-cell networks. Relatively stiff microtubules, uneven cortical actin with selected connected branches, and open perinuclear intermediate filaments replace regular display patterns. Geometry is not an in-situ segmentation; counts, paths and displayed diameters remain illustrative.

## 膜双层与代表局部

- [Cooper：质膜结构](https://www.ncbi.nlm.nih.gov/books/NBK9898/)支持脂双层、跨膜朝向与侧向运动的基本关系；[Freeman 等，2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5929997/)支持膜骨架关联组分对受体活动的限制。自由样/暂受限后释放的轨迹、围栏与释放时间是教学参数。
- [Sako 与 Kusumi，1994](https://pubmed.ncbi.nlm.nih.gov/8207056/)研究 NRK 细胞膜区室化扩散；不将其扩散参数移用于本巨噬细胞。
- [Cell Image Library 13091](https://www.cellimagelibrary.org/images/13091)为固定小鼠巨噬细胞表面形态语境；[Verdys 等，2024](https://link.springer.com/article/10.1038/s44318-024-00173-7)为 ERM/皮层组织语境。原图像像素未嵌入或改编；局部微绒毛不泛化为整胞所有突起。

## 摄取案例与条件性病毒响应

| 内容 | 主要来源与范围 |
| --- | --- |
| IgG/FcγR 大颗粒摄取及限定抗原载体 | [Anderson，1990](https://pubmed.ncbi.nlm.nih.gov/2139103/)；[Allen 与 Aderem，1996](https://pubmed.ncbi.nlm.nih.gov/8760816/)；上述 Jaumouillé 研究。膜杯与瞬时裂分为程序化几何；抗原载体不表示感染性病毒，也不自动接入胞质 RNA 支路。 |
| MR/CD206 摄取、回收与配体递送 | [Stahl 等，1980](https://pubmed.ncbi.nlm.nih.gov/6766809/)；[Wileman 等，1984](https://pubmed.ncbi.nlm.nih.gov/6087792/)；[Shepherd 等，1982](https://pubmed.ncbi.nlm.nih.gov/6298410/)。限定具有相应受体活性的细胞，MR 不等于甘露糖-6-磷酸受体。 |
| 胞质 RNA—MAVS—IRF3 | [Xia 等，2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4569712/)；[Seth 等，2005](https://pubmed.ncbi.nlm.nih.gov/16125763/)。选定的条件支路，不是所有病毒的通用进入路径。 |
| IFNAR 组装、反馈及下游 | [Wilmes 等，2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4442803/)；[Zhou 等，2010](https://pmc.ncbi.nlm.nih.gov/articles/PMC2957079/)；[Wood 等，2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3703304/)。跨实验模型支持的机制节点，不是同一细胞实测全链路；IFN-β 为宿主分泌蛋白。新增 ER、Golgi 和开放胞吐孔剖面使用教学比例；区室间载体出芽、早期对接及部分融合步骤仍省略。 |
| 摄取与感染结局的区分 | [Martínez-Colón 等，2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9529056/)。病毒成分阳性不自动等于产生感染性子代；作品不判定感染结局。 |

## 公开坐标实例 / Public-coordinate examples

| 实例 | 样品与显示边界 |
| --- | --- |
| [PDB 1JFF](https://www.rcsb.org/structure/1JFF) | 牛 α/β 微管蛋白；电子晶体学 3.5 Å，锌诱导、紫杉醇稳定片层中的结构。显示 Cα 派生轨迹，不是人巨噬细胞原位微管或原子表面。 |
| [PDB 4UG0](https://www.rcsb.org/structure/4UG0) / [EMD-2938](https://www.ebi.ac.uk/emdb/EMD-2938) | 人 80S 核糖体，冷冻电镜 3.6 Å。显示蛋白 Cα 与 RNA P 派生粗化骨架，不补原记录缺失区段。 |
| [PDB 1DGF](https://www.rcsb.org/structure/1DGF)；[Putnam 等，J Mol Biol 2000](https://pubmed.ncbi.nlm.nih.gov/10656833/)，DOI 10.1006/jmbi.1999.3458 | 人红细胞来源 CAT 晶体结构、1.50 Å、四聚体 A4。过氧化物酶体内展示其观测 Cα 骨架，非巨噬细胞原位蛋白识别；血红素、NADPH 等辅因子不显示，不能据此讲解已建出的活性位点化学。 / Human erythrocyte catalase tetramer; observed Cα trace, not an in-situ macrophage enzyme or an atomic surface. Cofactors are omitted. |
| [PDB 7Q86](https://www.rcsb.org/structure/7Q86)；[Sonani 等，Int J Biol Macromol 2022](https://doi.org/10.1016/j.ijbiomac.2022.02.008) | 人 ACOX1a、FAD 结合态晶体结构、2.09 Å、同源二聚体 A2。保留已观测修饰残基 CSO 的 Cα；未观测连接不补造。模型省略 FAD，不能称为完整活性位点或原子表面。 / Human FAD-bound ACOX1a homodimer; modified polymer Cα nodes are retained. Displayed backbone omits FAD and does not reproduce a complete active site. |

1DGF 与 7Q86 由公开生物装配体坐标导出，源文件、SHA-256、量化与缩放信息保留在 `src/peroxisomal-enzyme-data.js` 及 `qa/source-cache/`；导入工具为 `tools/bake-peroxisomal-enzyme-traces.mjs`。两种酶独立放大，位置、数量、相对屏幕大小不是原位测量；其余细点仅概括未逐个鉴定的酶性基质。核查见 `qa/content-identification-science-20261025.md`。

CAT and ACOX1 examples retain biological-assembly provenance, source hashes and display transforms. They are independently enlarged; placement, abundance and relative on-screen size are not in-situ measurements. Other matrix dots are unresolved illustrative content.

PDB 归档数据采用 [CC0](https://www.wwpdb.org/about/usage-policies)，保留结构 ID、原作者与论文引用；该许可不覆盖论文排版图或网页截图。程序艺术纹理与用户参考图用于艺术方向，不是实测电镜密度。第三方软件授权见 `THIRD_PARTY_LICENSES.txt`。


## Microstructure update — 2026-10-23

# 本次更新的原始研究依据 / Primary research for this update

以下资料约束模型的结构关系、膜侧朝向和阶段说明。论文中的实验系统与本展示的巨噬细胞场景并不完全相同；没有将其尺寸、速度或发生概率直接移植为巨噬细胞测量值。

These sources inform structural relationships, membrane sidedness and stage descriptions. Their experimental systems differ from this illustrative macrophage scene; measured dimensions, rates and probabilities are not imported as macrophage-specific parameters.

| 来源 / Source | 对应内容及范围 / Use and scope |
|---|---|
| [Lorent et al., 2020 — Plasma membranes are asymmetric in lipid unsaturation, packing and protein shape](https://doi.org/10.1038/s41589-020-0529-6) | 两叶物性与组成不对称的依据；配色及代表性弯折双尾不声称复制巨噬细胞脂质组。 / Supports leaflet asymmetry; colors and bent-tail silhouettes do not reproduce a measured macrophage lipidome. |
| [Maxwell et al., 1999 — Human FcγRIIA extracellular structure](https://doi.org/10.1038/8241), [PDB 1FCG](https://www.rcsb.org/structure/1FCG) | 两个胞外 Ig 域。1FCG 为胞外部分的 X 射线结构，不是全长冷冻电镜；跨膜与胞质域拓扑另参考 [UniProt P12318](https://www.uniprot.org/uniprotkb/P12318/entry)。 / Two extracellular Ig domains; the X-ray structure does not resolve the full receptor. Membrane and cytoplasmic topology also uses UniProt. |
| [McCarthy et al., 2019 — Full-length P2X7 structures](https://doi.org/10.1016/j.cell.2019.09.017), [6U9V](https://www.rcsb.org/structure/6U9V), [6U9W](https://www.rcsb.org/structure/6U9W) | 大鼠 P2X7 冷冻电镜的三聚体、每亚基两个跨膜区与开闭构象；当前通道为教学包络，未渲染这些原子坐标。 / Rat P2X7 trimer, two membrane spans per subunit and gating states; the displayed envelope is schematic, not these atomic coordinates. |
| [Janks et al., J Immunol 2019 — ATP-Gated P2X7 Receptors Require Chloride Channels To Promote Inflammation in Human Macrophages](https://pubmed.ncbi.nlm.nih.gov/30598517/), DOI 10.4049/jimmunol.1801101 | 人单核细胞来源巨噬细胞的 P2X7 功能背景；不将该通道自动接到所有病毒应答支路，也不声称本示意门控过程是实验原子轨迹。 / Human macrophage functional context, without imposing P2X7 on every viral-response branch or claiming an experimentally measured atomic gating trajectory. |
| [Shibata et al., 2010 — Mechanisms determining peripheral ER morphology](https://pubmed.ncbi.nlm.nih.gov/21111237/) | 粗面片层、附着多核糖体和光面管状域的区分。 / ER sheets, bound polysomes and tubular domains. DOI: 10.1016/j.cell.2010.11.007. |
| [Terasaki et al., 2013 — Stacked ER sheets connected by helicoidal motifs](https://pmc.ncbi.nlm.nih.gov/articles/PMC3767119/) | 连续 ER 膜网络的三维电镜依据；采样细胞的特定片层和螺旋形态不作为所有巨噬细胞的固定构造。 / 3D EM evidence for connected ER sheets; the sampled arrangements are not universal macrophage anatomy. DOI: 10.1016/j.cell.2013.06.031. |
| [Voorhees et al., 2014 — Mammalian ribosome–Sec61 complex](https://pmc.ncbi.nlm.nih.gov/articles/PMC4081569/) | 哺乳动物核糖体–Sec61 冷冻电镜支持胞质侧翻译、膜内转位及 ER 腔的空间关系；宿主应答新增的转位孔和肽链为比例调整的局部教学几何，未导入原子结构或 IFN 专属轨迹。 / Mammalian cryo-EM informs ribosome/translocon sidedness. The host-response section uses a schematic channel and peptide, not atomic coordinates or an IFN-specific trajectory. DOI: 10.1016/j.cell.2014.05.024. |
| [Ladinsky et al., 1999 — Golgi structure in three dimensions](https://pmc.ncbi.nlm.nih.gov/articles/PMC2150572/) | 正常大鼠肾细胞的双轴电镜断层；指导独立膜囊、顺面 ERGIC 与反面管状延伸。七层及色彩是教学选择。 / NRK-cell tomography informs cisternae, cis-side ERGIC and trans tubules; seven layers and colors are illustrative. DOI: 10.1083/jcb.144.6.1135. |
| [Ladinsky et al., 1994 — HVEM tomography of the TGN](https://pmc.ncbi.nlm.nih.gov/articles/PMC2120188/) | 反面管囊结构与出芽域；当前 TGN 的分支数和位置为教学设计。 / TGN tubulocisternal structure and budding domains; branch counts and positions are designed. DOI: 10.1083/jcb.127.1.29. |
| [Guo et al., 2014 — Probing the stochastic, motor-driven properties of the cytoplasm](https://pmc.ncbi.nlm.nih.gov/articles/PMC4183065/) | 主动胞质扰动的背景依据；不支持宣称本模型展示实测宏观环流。 / Supports active cytoplasmic fluctuations, not a measured bulk circulation in this model. DOI: 10.1016/j.cell.2014.06.051. |
| [Ward et al., 2000 — STX7/VAMP7 in alveolar macrophage fusion](https://pmc.ncbi.nlm.nih.gov/articles/PMC14922/) | 肺泡巨噬细胞体外融合实验中的蛋白作用；不是四螺旋装配动作的直接测量。 / Functional roles in alveolar-macrophage fusion assays, not a directly measured zippering trajectory. DOI: 10.1091/mbc.11.7.2327. |
| [Pryor et al., 2004 — Combinatorial late-endocytic SNARE complexes](https://pmc.ncbi.nlm.nih.gov/articles/PMC1299070/) | STX7、VTI1B、STX8 与 VAMP7 的晚期内体—溶酶体配对示例；与 VAMP8 相关融合事件区分。 / Supports the selected STX7/VTI1B/STX8/VAMP7 combination, distinguished from VAMP8-associated events. DOI: 10.1038/sj.embor.7400150. |
| [Sharma & Lindau, 2018 — SNARE-driven fusion-pore formation](https://pmc.ncbi.nlm.nih.gov/articles/PMC6294955/) | 神经元 SNARE 的粗粒度模拟为通用孔形成讨论提供参考，不能称为本巨噬细胞蛋白组合的实验轨迹。 / Neuronal SNARE simulation informs generic pore mechanisms, not an observed macrophage-complex trajectory. DOI: 10.1073/pnas.1816495115. |
| [Benton et al., 2020 — HA transitions at membrane-fusion pH](https://www.nature.com/articles/s41586-020-2333-6), [PDB 6Y5H](https://www.rcsb.org/structure/6Y5H) | 低 pH HA 构象与 HA2 伸展的冷冻电镜依据；6Y5H 作为可核查结构参考，未下载并插值其坐标。 / Cryo-EM informs low-pH HA architecture; 6Y5H is a reference, not a rendered coordinate interpolation. DOI: 10.1038/s41586-020-2333-6. |
| [Calder & Rosenthal, 2016 — Structural snapshots of influenza membrane fusion](https://pmc.ncbi.nlm.nih.gov/articles/PMC6485592/) | 病毒—靶膜相互作用与融合中间态；当前膜表面和阶段间过渡为教学构造。 / Cryomicroscopy informs membrane interactions and intermediates; surfaces and transitions remain illustrative. DOI: 10.1038/nsmb.3271. |

通用细胞器功能说明另参考 Alberts 的 [ER 章节](https://www.ncbi.nlm.nih.gov/books/NBK26841/)及 [ER—Golgi 运输章节](https://www.ncbi.nlm.nih.gov/books/NBK26941/)；它们是教材综述，不列为原始实验。

General functional explanations also use the Alberts [ER chapter](https://www.ncbi.nlm.nih.gov/books/NBK26841/) and [ER-to-Golgi transport chapter](https://www.ncbi.nlm.nih.gov/books/NBK26941/), identified as textbook syntheses rather than original experiments.

本次新增膜、ER/Golgi 和融合形体没有复制论文图片或电镜像素。蛋白外形、阶段间插值、显示数量、配色及速度经过教学处理；既有公开坐标实例仍按各自来源单独说明。本附录记录科学依据，不改变项目或第三方材料的许可条款。

The new membrane, ER/Golgi and fusion geometry does not copy paper figures or electron-micrograph pixels. Protein silhouettes, interpolation, copy numbers, colors and timing are designed for teaching; existing public-coordinate examples retain their separate source descriptions. This appendix documents scientific evidence and does not change project or third-party licensing terms.

## 内体、吞噬体、溶酶体与过氧化物酶体 / Endosomes, phagosomes, lysosomes, and peroxisomes

本轮将四类区室的几何与内容物分别设计：早期分选内体采用主囊与相连小管；吞噬体突出大块货物及其周围膜腔；所选内体溶酶体显示异质残余和不完整膜性内容；过氧化物酶体采用单膜与酶基质，并提供两种独立放大的具名人酶坐标实例。“单膜”指由一层磷脂双分子层构成的膜。色彩、小管数量、颗粒密度和显示尺度为教学选择，不能作为真实样本的鉴定标准。图中功能标签取自实际模型锚点，残片与基质背景不逐点冒认为已鉴定分子。

Four models distinguish a sorting endosome, a cargo-containing phagosome, a selected heterogeneous endolysosome, and a matrix-containing peroxisome with two enlarged human enzyme examples. A single membrane consists of one phospholipid bilayer. Functional labels use actual model anchors; residual and background shapes are not individually identified molecules. Colors, counts and display scales are illustrative.

| 原始研究 / Primary research | 结构依据与适用边界 / Evidence and scope |
| --- | --- |
| [Franke et al., 2019 — Endosome nanoscale domains](https://pmc.ncbi.nlm.nih.gov/articles/PMC6771687/), DOI [10.1111/tra.12671](https://doi.org/10.1111/tra.12671) | HeLa 细胞相关光镜与电子断层关联内体的球状、小管及货物分选域；指导早期分选内体，不将所有内体画成同一多囊泡体。 / Correlative microscopy and tomography in HeLa cells inform distinct globular, tubular, and cargo-sorting domains; this early-endosome example does not represent every endosome subtype. |
| [Ramachandra et al., 1998 — Flow analysis of isolated phagosomes](https://pubmed.ncbi.nlm.nih.gov/9671125/), DOI [10.1016/S0022-1759(98)00017-9](https://doi.org/10.1016/S0022-1759(98)00017-9) | 小鼠腹腔巨噬细胞摄取乳胶珠后的吞噬体电镜显示膜与货物可紧贴，也可留有较宽腔隙；支持货物相关形态，不将乳胶珠或固定腔隙视为所有吞噬体共有构件。 / EM of latex-bead phagosomes from mouse peritoneal macrophages shows both closely apposed and roomier membranes; bead shape and lumen spacing are not universal phagosome features. |
| [Levin-Konigsberg et al., 2019 — Phagolysosome resolution](https://pmc.ncbi.nlm.nih.gov/articles/PMC8340083/), DOI [10.1038/s41556-019-0394-2](https://doi.org/10.1038/s41556-019-0394-2) | RAW264.7 巨噬细胞摄取 IgG 包被羊红细胞后的 TEM/SEM；Fig. 1 展示完整货物、降解与区室碎片化，其阶段均属于溶酶体融合后的晚期过程。 / TEM/SEM of RAW264.7 macrophages after uptake of IgG-coated sheep erythrocytes informs cargo degradation and compartment remodeling; the Fig. 1 stages occur after lysosomal fusion. |
| [McVeigh et al., 2025 — Visualization of lysosomal membrane proteins by cryo electron tomography](https://pubmed.ncbi.nlm.nih.gov/41107240/), DOI [10.1038/s41467-025-64314-0](https://doi.org/10.1038/s41467-025-64314-0) | HEK293 标记区室免疫富集 cryoET 与原位对照支持异质腔内容、内部膜涡卷及不均匀膜复合体分布。原位图包含溶酶体/自噬溶酶体，不能将其视为人巨噬细胞原位重建或所有溶酶体均有固定膜卷；未将腔内普通颗粒直接鉴定为某种游离水解酶。 / CryoET of immunoenriched HEK293 endolysosomal compartments and in-situ controls informs heterogeneous contents, internal membrane whorls and uneven membrane-complex distributions. In-situ examples include lysosomes/autolysosomes; neither universal whorls nor human macrophage measurements are implied. Unresolved luminal particles are not identified as specific soluble hydrolases. |
| [Bright et al., 2016 — Endolysosomes Are the Principal Intracellular Sites of Acid Hydrolase Activity](https://pubmed.ncbi.nlm.nih.gov/27498570/), DOI [10.1016/j.cub.2016.06.046](https://doi.org/10.1016/j.cub.2016.06.046) | 以 NRK 细胞为主要成像体系并扩展细胞系的活性、酸度与 EM 研究支持活跃内体溶酶体和末端储存溶酶体的区别及再形成周期；不由电镜致密程度推断本模型酶活性或光学不透明度。 / Functional probes and EM, principally in NRK cells with additional cell-line experiments, distinguish active endolysosomes from terminal storage lysosomes in a regeneration cycle. Electron density does not set this model's enzyme activity or optical opacity. |
| [Swanson et al., 1987 — Tubular lysosome morphology and distribution within macrophages](https://pubmed.ncbi.nlm.nih.gov/3550801/), DOI [10.1073/pnas.84.7.1921](https://doi.org/10.1073/pnas.84.7.1921); [Tubular lysosomes accompany stimulated pinocytosis](https://pubmed.ncbi.nlm.nih.gov/3571329/), DOI [10.1083/jcb.104.5.1217](https://doi.org/10.1083/jcb.104.5.1217) | J774.2 小鼠巨噬细胞系、研究中的小鼠腹腔巨噬细胞与培养人单核细胞支持管状溶酶体存在及状态依赖性；不将所有静息人巨噬细胞的溶酶体统一画成长管。 / These studies demonstrate state-dependent tubular lysosomes in J774.2 cells, mouse peritoneal macrophages and cultured human monocytes in the examined conditions, without prescribing long tubules for every lysosome in a resting human macrophage. |
| [Usuda et al., 1988 — Tissue and species differences in peroxisomal urate oxidase](https://pubmed.ncbi.nlm.nih.gov/3336202/) | 免疫金电镜和生化比较显示尿酸氧化酶晶核具有物种/组织限制；鼠等肝细胞的晶核不能直接用作人巨噬细胞通用模板。 / Immunogold EM and biochemical comparisons establish tissue/species limits; urate-oxidase cores in rodent and other mammalian liver cannot be assumed for human macrophages. |
| [Schrader et al., 1994 — Peroxisome heterogeneity in HepG2 cells](https://pubmed.ncbi.nlm.nih.gov/7813516/) | 人源 HepG2 细胞的超微结构研究支持球形、杆状及延长形等多样性；该肝母细胞瘤细胞系的具体尺寸、数量和分布不移植为巨噬细胞测量值。 / Ultrastructural work in human HepG2 cells supports spherical, rod-shaped, and elongated forms; dimensions, abundance, and distributions in this hepatoblastoma line are not treated as macrophage measurements. |
| [Geric et al., Immunology 2018 — Lipid homeostasis and inflammatory activation are disturbed in classically activated macrophages with peroxisomal β-oxidation deficiency](https://pubmed.ncbi.nlm.nih.gov/28940384/), DOI [10.1111/imm.12844](https://doi.org/10.1111/imm.12844) | 小鼠 BMDM 的 MFP2 缺陷及炎症激活研究支持过氧化物酶体 β 氧化的功能背景；不是 CAT / ACOX1 在人体巨噬细胞中的原位坐标证据。 / Mouse BMDM MFP2-deficiency experiments inform metabolic function, not CAT/ACOX1 geometry or in-situ identification in human macrophages. |

过氧化物酶体是膜性细胞器；内体和吞噬体也可称膜性细胞器或区室，后者随吞噬形成并成熟。侧栏以“细胞图谱 / 生命过程”为两个入口，图谱中按观察对象分为四组；这是浏览结构，不是互斥的生物分类。核孔属于核膜构造，粗面与光面内质网属于连续内质网的不同功能域。

Peroxisomes, endosomes, and phagosomes are membrane-bound organelles or compartments; phagosomes form during engulfment and mature. The Cell atlas / Life processes routes and four atlas groups organize observation rather than impose exclusive biological categories. Nuclear pores belong to the nuclear envelope; rough and smooth ER are domains of a continuous network.

以上均为原始研究，支持结构关系与形态范围。本模型没有导入这些研究的电镜分割体，也没有复制其论文图像；跨细胞类型的结构依据不等于人巨噬细胞原位重建。本节不更改既有项目或第三方材料的许可。

These primary studies support structural relationships and morphological diversity. The model imports neither segmented EM volumes nor paper images from these studies; evidence from different cell types does not constitute an in-situ human macrophage reconstruction. Existing project and third-party licensing terms remain unchanged.

降解型内体溶酶体的内部片层与致密残余域为代表性内容，不是通用晶体核心；外侧仍是一个限制膜。腔内小囊泡并非溶酶体特有的鉴定标志。颜色、可读的剖切厚度和材质对比属于展示设计，不以电镜灰度直接推算。详细设计边界见 `qa/compartment-depth-science-20261025.md`。

Internal lamellae and dense residual domains represent selected degradative endolysosomal contents rather than a universal crystalline core; the compartment retains one limiting membrane. Intraluminal vesicles are not unique lysosomal identifiers. Colour, readable section thickness and material contrast are presentation choices, not direct translations of EM grayscale. Design boundaries are documented in `qa/compartment-depth-science-20261025.md`.

## 2026-10-25 课堂讲解 / Classroom presentation

包膜病毒膜融合课程复用现有 HA 融合几何，并明确以流感病毒 HA 为例。一般融合原理与特定低 pH 触发分开；青绿色球表示水相连通，黄色短片表示 HA2 融合肽。宿主抗病毒应答是另一个条件性课程，不能从融合自动推出成功感染。ISG 近景用一个已有实例作代表符号，暂时裁去邻近实例以免遮挡；没有给该符号指定某种蛋白的原子结构。

The envelope-fusion lesson reuses the existing HA geometry and explicitly selects influenza HA as its example. Low-pH triggering is not presented as universal. Teal beads indicate aqueous continuity; yellow segments indicate HA2 fusion peptides. The separate host-response lesson is conditional. The ISG close-up uses one existing instance as a representative symbol and temporarily clips neighbouring instances without moving them or assigning an atomic protein identity.

- [Benton et al., 2020, Nature — Structural transitions in influenza haemagglutinin at membrane fusion pH](https://pubmed.ncbi.nlm.nih.gov/32461688/), DOI 10.1038/s41586-020-2333-6：支持 HA 重排的结构关系，不提供本演示的真实动力学。
- [Calder & Rosenthal, 2016 — Cryomicroscopy provides structural snapshots of influenza virus membrane fusion](https://pubmed.ncbi.nlm.nih.gov/27501535/), DOI 10.1038/nsmb.3271：病毒与脂质体的冷冻电镜快照，不能当作活体巨噬细胞逐分子录像。

详细的讲解口径与原始研究对应关系随源码保存在 `qa/classroom-science-20261025.md`；便携版的“本轮更新说明.md”包含课堂使用步骤和关键来源。

### 宿主应答的连续讲解 / Continuous host-response lesson

宿主课程保留六个主阶段，细分为 19 个教学子环节，补充 RIG-I CARD 暴露、MAVS 组装、TBK1/IRF3 状态变化、IFNB1 转录、宿主 mRNA 输出、ER 翻译转位、Golgi 腔内分选、载体运输、开放胞吐孔及 STAT/IRF9 核内调控。它们使用同一套输入、动作、结果、条件和位置说明，时间是课堂时间，不是实测反应速度。

The host lesson has six phases and 19 teaching substeps with shared input, action, outcome, condition, and location descriptions. Timing is pedagogical. Host mRNA stays on the cytosolic side of the ER; a nascent peptide crosses the translocon into the lumen. IFN-β is a host signal protein, not viral RNA or an antibody.

| 新增原始研究 / Additional primary research | 支持内容与样本范围 / Evidence and specimen scope |
| --- | --- |
| [Hou et al., Cell 2011 — MAVS forms functional prion-like aggregates to activate and propagate antiviral innate immune response](https://pubmed.ncbi.nlm.nih.gov/21782231/), DOI 10.1016/j.cell.2011.06.041 | 生化重构和细胞实验支持 MAVS 功能性组装及其下游信号；不把纯化纤维尺寸、拷贝数或组装速度移为活体巨噬细胞参数。 / Biochemical and cellular evidence for functional MAVS assemblies; no measured macrophage fiber dimensions or kinetics are reproduced. |
| [Wu et al., Mol Cell 2014 — Molecular imprinting as a signal-activation mechanism of the viral RNA sensor RIG-I](https://pubmed.ncbi.nlm.nih.gov/25018021/), DOI 10.1016/j.molcel.2014.06.010 | RIG-I 2CARD / MAVS CARD 的结构和功能研究支持区域暴露、组装及信号衔接背景；展示为简化区域，不移用实验亚基数或原子模型。 / Domain-level structural and functional evidence; displayed exposure and assembly are schematic. |
| [Liu et al., eLife 2013 — MAVS recruits multiple ubiquitin E3 ligases to activate antiviral signaling cascades](https://elifesciences.org/articles/00785), DOI 10.7554/eLife.00785 | HEK293T、HeLa 提取物、小鼠胚胎成纤维细胞和重构体系支持 TRAF、泛素、NEMO 与下游激酶网络。局部 TBK1/IRF3 图不代表 MAVS 直接结合 TBK1 或唯一激活地点。 / Reconstitution and cell models establish intermediary signaling networks, not a direct obligatory MAVS–TBK1 pair. |
| [Panne et al., EMBO J 2004 — Crystal structure of ATF-2/c-Jun and IRF-3 bound to the interferon-β enhancer](https://pubmed.ncbi.nlm.nih.gov/15510218/), DOI 10.1038/sj.emboj.7600453 | 蛋白–DNA 结构支持增强子上的协同调控，不能只画 IRF3 就宣称充分启动所有 IFNB1 表达。RNA Pol II、DNA 与因子在本作中为教学符号，不是基因实测定位。 / Protein–DNA structures inform cooperative regulation; the nuclear teaching diagram does not reproduce measured gene coordinates. |
| [Yang et al., Cell Mol Immunol 2021 — Differences in IFNβ secretion upon Rab1 inactivation in cells exposed to distinct innate immune stimuli](https://pmc.ncbi.nlm.nih.gov/articles/PMC8167132/), DOI 10.1038/s41423-021-00659-y | HEK293T 中 IFNβ 经传统 ER–Golgi 途径，Rab1 依赖随刺激不同。支持该选定分泌路线，但不证明巨噬细胞的载体、Rab 或 SNARE 身份完全相同。 / Stimulus-dependent secretion in HEK293T informs the selected route, not universal macrophage carrier identities. |
| [Heuser et al., J Cell Biol 1979 — Synaptic vesicle exocytosis captured by quick freezing and correlated with quantal transmitter release](https://pubmed.ncbi.nlm.nih.gov/38256/), DOI 10.1083/jcb.81.2.275 | 蛙神经肌肉接头的快速冷冻/断裂电镜支持开放胞吐孔的通用形态关系；不是巨噬细胞 IFN 载体大小、速度、早期对接或专属融合蛋白的证据。 / Frog neuromuscular-junction freeze-fracture morphology informs a generic open pore, not IFN-carrier mechanisms or dimensions. |
| [Platanitis et al., Nat Commun 2019 — A molecular switch from STAT2-IRF9 to ISGF3 underlies interferon-induced gene transcription](https://pubmed.ncbi.nlm.nih.gov/31266943/), DOI 10.1038/s41467-019-10970-y | 小鼠巨噬细胞的 STAT1/STAT2/IRF9 调控支持 DNA 上组装的模型。显示 STAT 入核和核内 IRF9，不声称所有 ISGF3 必须先在胞质完整装配。 / Mouse macrophage evidence supports DNA-associated assembly; a universal preassembled cytosolic ISGF3 route is not imposed. |

核糖体–Sec61 转位的原始结构依据见上表 Voorhees 等。上面的不同实验不能合并称为同一颗巨噬细胞的实测全流程。内体中被处理的颗粒与“可识别 RNA 已在胞质”的条件支路分开；膜融合不自动推出生产性感染。局部剖面不显示闭合载体穿过完整膜，部分出芽、对接和融合步骤仍以状态交接表示。磷酸化点是附着状态标记，信号脉冲表示反应顺序，不能讲成额外自由分子。

The cited experiments do not measure one complete pathway in one macrophage. Endosomal processing remains separate from a branch that assumes recognizable cytosolic RNA. Fusion does not imply productive infection. Some budding, docking and fusion events use state handoffs; no closed carrier is shown crossing an intact membrane. Phosphorylation markers and order pulses are explanatory symbols, not extra freely transported molecules.

宿主应答的实现范围见 `qa/antiviral-response-continuity-20261025.md`。不同版本的检查范围按对应交付记录保存，不把旧版性能数字当作新版测量。

### 日常协作、骨架组织与膜片表达 / Cooperation, cytoskeletal organization, and membrane presentation

| 原始研究 / Primary study | 本轮采用的关系与边界 / Use and limits |
| --- | --- |
| [Barlowe et al., Cell 1994 — COPII vesicle formation](https://pubmed.ncbi.nlm.nih.gov/8004676/) | ER 输出货物的膜性载体关系；不把教学载体当作实测 COPII 尺寸或完整出芽模拟。 / Membrane-carrier export from ER; no measured COPII dimensions or complete budding simulation. |
| [Schnitzer & Block, Nature 1997 — Kinesin hydrolyses one ATP per 8-nm step](https://www.nature.com/articles/41111) | ATP 周期与 kinesin 换步的耦联依据；屏幕大小与速度均非实测。 / ATP–stepping coupling; displayed scale and kinetics are pedagogical. |
| [Dunn, McGraw & Maxfield, JCB 1989 — Iterative fractionation of recycling receptors from lysosomally destined ligands](https://pubmed.ncbi.nlm.nih.gov/2600137/) | 可回收受体与降解方向配体的分选关系；不推广为所有受体的统一归宿。 / Selected receptor/cargo sorting; no universal receptor fate. |
| [Seta et al., IJMS 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC9866147/) | 巨噬细胞中星状、底部网状与周边束等组织并存；不复制图像或推断有限段端点均为成核位点。 / Mixed macrophage microtubule organizations, without assigning nucleation to displayed segment ends. |
| [Hartwig & Shevlin, JCB 1986](https://pmc.ncbi.nlm.nih.gov/articles/PMC2114287/) | 提取后巨噬细胞皮质网的电镜形态；交叉不一概标为 Arp2/3 分支。 / Extracted macrophage cortical architecture; intersections are not all Arp2/3 branches. |
| [Correia et al., JCB 1999](https://pmc.ncbi.nlm.nih.gov/articles/PMC2156141/) | 巨噬细胞肌动蛋白与 vimentin 组织依赖黏附状态。 / Adhesion-dependent actin/vimentin organization. |
| [Adrian et al., Nature Communications 2023](https://www.nature.com/articles/s41467-023-41891-6) | 原代小胶质细胞状态相关微管组织；只支持组织可变性，不当作本模型的同种细胞实测。 / State-dependent microglial organization supports variability, not identical macrophage measurements. |
| [Sun et al., Nature Communications 2025](https://www.nature.com/articles/s41467-025-56045-z) | HSC-3 / HEK293 揭膜 cryoET 的连续膜及异质关联结构；没有导入其分割体。 / Continuous membrane and heterogeneous associated structures in unroofed preparations; no segmentation imported. |
| [Heberle et al., PNAS 2020](https://doi.org/10.1073/pnas.2002200117) | 双层膜的 cryo-EM 轮廓；图像亮暗带不能解释成两张生物膜。 / Cryo-EM membrane profiles; contrast bands do not imply two separate membranes. |
| [Möckl et al., Developmental Cell 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6675415/) | 细胞外糖萼的异质组织；六个糖链示例不代表巨噬细胞完整糖萼或分子数量。 / Heterogeneous extracellular glycocalyx; six generic examples do not measure the full macrophage glycocalyx. |

对应关系、制样限制和省略分别记录在 `qa/steady-lessons-20261025.md`、`qa/skeleton-refinement-20261025.md`、`qa/membrane-presentation-20261025.md`。教学路径箭头不代表固定管道，骨架粗细不表示真实丰度，材质粗糙度与颜色不是电镜测量结果。

Detailed provenance, specimen limitations, and omissions are recorded in the three science notes above. Teaching arrows are not permanent conduits, fiber thickness is not abundance, and surface roughness/colors are illustration choices rather than EM measurements.

### 日常协作的构造与动作细化 / Detailed anatomy and motion

| 原始研究 / Primary study | 采用内容及范围 / Use and scope |
| --- | --- |
| [Pfeffer et al., 2015 — Native Sec61 channel](https://pmc.ncbi.nlm.nih.gov/articles/PMC4598622/) | 犬胰腺粗 ER 囊泡的核糖体–Sec61 关系；用于通道与亚基示意，不是巨噬细胞分割。 / Ribosome–Sec61 organization in rough-ER vesicles, not macrophage segmentation. |
| [Cryo-electron tomography reveals how COPII assembles on cargo-containing membranes, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11919764/) | 含货物膜上的内外衣被与可变装配；本图未复建完整 COPII 晶格或断颈分子机制。 / Inner/outer coat organization; the entire lattice and molecular scission mechanism are not reproduced. |
| [Gao et al., Science 2012 — Reconstituted neuronal SNARE zippering](https://pmc.ncbi.nlm.nih.gov/articles/PMC3677750/) | 通用逐步装配原理，不移用神经元特定组合或动力学。 / Generic zippering principle, without transferring neuronal identities or rates. |
| [Yildiz et al., Science 2004 — Kinesin walks hand-over-hand](https://pubmed.ncbi.nlm.nih.gov/14684828/) | 交替越步；动画保持一头固定、一头摆动，不按像素表示真实步长。 / Alternating heads; screen spacing is not a physical measurement. |
| [Davies et al., PNAS 2011 — ATP synthase and complex I in whole mitochondria](https://pubmed.ncbi.nlm.nih.gov/21836051/) | 冷冻断层的嵴缘 ATP 合酶组织；本模型为放大的双膜、嵴与催化侧关系。 / Crista-rim organization informs a coarse membrane/domain model. |
| [Traer et al., Nature Cell Biology 2007](https://doi.org/10.1038/ncb1656) | 管泡状内体的选择性膜受体分选；不推为所有受体的固定命运。 / Selective receptor sorting, not universal fate. |
| [Mullock et al., JCB 1998 — Late endosome–lysosome fusion](https://pmc.ncbi.nlm.nih.gov/articles/PMC2140175/) | 大鼠肝体系的融合与混合区室；教学显示接触膜开孔后内容混合，省略成熟/再形成的完整过程。 / Content mixing and hybrid compartments; full maturation/reformation is omitted. |
| [Visualization of lysosomal membrane proteins by cryo electron tomography, 2025](https://www.nature.com/articles/s41467-025-64314-0) | 内溶酶体内容异质性及 V1 胞质侧朝向；不宣称一套固定小球代表所有降解腔。 / Heterogeneous lumen and cytosolic V1 orientation, without imposing a uniform contents template. |
| [Human cathepsin B — wwPDB 1HUC](https://www.wwpdb.org/pdb?id=pdb_00001huc) | 双结构域及沟槽的粗粒度依据；未下载坐标重建、未作原子催化模拟。 / Domain-cleft inspiration only; no atomic-coordinate or catalytic simulation. |

当前动作范围和省略见 qa/steady-synthesis-detail-20261025.md、qa/steady-transport-detail-20261025.md、qa/steady-recycling-detail-20261025.md。放大链段是便于辨认断键的显示方式，不表示水解酶机械展开蛋白；阶段间调整局部大小是教学取景，不表示细胞器增长。
# 摄取外物与病毒局部呈现 · 2026-10-25

本轮保持已有生物学机制，改善膜的立体剖面、蛋白身份、图上动作讲解及取景。吞噬杯封闭、已获得酸化装置、腔内蛋白切解分别说明；V-ATPase及水解酶的递送/供体融合在局部仍省略。膜厚与曲率是教学构图参数，没有从原位电镜测量。

- Lowry et al., 1998, J Exp Med：Fc受体介导的结合、伪足延伸和内化实验。[原始研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC2212093/)
- Ramsland et al., 2011：FcγRIIa–IgG1 Fc实验结构。[RCSB 3RY6](https://www.rcsb.org/structure/3RY6)。本模型未导入其原子坐标。
- Desjardins et al., 1994, JCB：吞噬体与内吞系统的连续相互作用及成熟。[原始研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC2119957/)
- Maxson et al., 2022, JCB：V-ATPase的检测、量化及吞噬体酸化关联。[原始研究](https://rupress.org/jcb/article/221/3/e202107174/212963/Detection-and-quantification-of-the-vacuolar-H)
- Lancaster et al., 2021, JCB：吞噬溶酶体内货物降解及后续解析。[原始研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC8241537/)
- Benton et al., 2020, Nature：低pH流感HA构象中间态。[DOI 10.1038/s41586-020-2333-6](https://doi.org/10.1038/s41586-020-2333-6)
- Calder & Rosenthal, 2016, Nat Struct Mol Biol：病毒与靶脂质体的融合快照和膜变形。[DOI 10.1038/nsmb.3271](https://doi.org/10.1038/nsmb.3271)

The present version preserves the accepted HA trajectory and central fusion topology while curving the membrane periphery. Host uptake/endosomal processing uses dedicated solid cutaways. Cutaway openings are observation windows, not biological leaks. Uptake does not establish productive infection; the cytosolic RNA response remains an independent conditional branch. Geometry, scale and timing are pedagogical rather than measured in-situ EM or atomic dynamics.
