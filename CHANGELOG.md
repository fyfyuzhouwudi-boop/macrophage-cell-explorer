# 蛋白结构与流畅度更新 / Protein detail and performance update

2026-10-30 · 演示构建 / Demo build `1665139a`

## 中文

本版细化课堂场景中的代表性蛋白结构，并减少播放时的重复计算：

- 细化细胞膜 FcγRIIA 的两个胞外结构域，以及 IgG 的 Fc 和 Fab 结构域，保留膜侧关系与既有结合动作。
- 改进核糖体大小亚基与 Sec61 通道的示意，区分 Sec61α 的跨膜螺旋、中央通路和侧向门；细化 kinesin 马达头部的核苷酸口袋与微管结合面。
- 改进组织蛋白酶 B 型双叶、底物沟槽和遮挡环的教学形体，并在摄取处理场景复用；合并 V-ATPase 的部分静态部件。
- 减少蛋白剖切面和封闭吞噬体膜的重复几何计算，缓存图上标注的尺寸测量；保留原有 HA 融合动作。

验收包括 17 项自动测试，以及摄取、病毒响应和日常协作共 137 项浏览器交互检查。对此前的 1f3f8e92 候选版，在相同画质和 1440×900 分辨率下，同一台电脑每场约 8 秒的对比中，膜蛋白场景的 CPU 脚本耗时由 7.529 降至 5.450 毫秒/帧（约 27.6%），摄取酶处理由 6.644 降至 3.256 毫秒/帧（约 51.0%）。这些结果仅反映该机与选定场景，不能保证所有设备的帧率或完全消除卡顿。

蛋白形体是参考论文与结构资料设计的粗化教学模型，未按原子坐标重建；颜色、尺度和运动速度经过教学调整。所附《项目展示与课堂讲解书》仍为 **2026-10-25** 版本，尚未针对本次外观细节修订。

## English

This release refines representative protein structures in classroom scenes and reduces repeated computation during playback:

- Refines the two extracellular domains of FcγRIIA and the Fc and Fab domains of IgG, retaining membrane sidedness and the existing binding motion.
- Clarifies the large and small ribosomal subunits and the Sec61 channel, including Sec61α transmembrane helices, its central path, and lateral gate. The kinesin motor head now distinguishes the nucleotide pocket from the microtubule-binding face.
- Refines a cathepsin B–type two-lobe enzyme, substrate cleft, and occluding-loop cue, also used in the uptake-processing lesson; some static V-ATPase components are merged.
- Avoids repeated calculation of protein cross-sections and closed-phagosome membrane geometry, and caches on-screen label measurements. The existing HA fusion sequence is retained.

Validation includes 17 automated tests and 137 browser interaction checks across uptake, viral response, and daily cooperation. For the earlier 1f3f8e92 candidate, same-machine, same-quality tests at 1440×900 with approximately eight seconds sampled per scene showed that CPU script time fell from 7.529 to 5.450 ms/frame for the membrane-protein scene (about 27.6%) and from 6.644 to 3.256 ms/frame for uptake-enzyme processing (about 51.0%). These selected measurements do not guarantee frame rates across devices or eliminate every stutter.

The protein shapes are coarse teaching models informed by research and structural references, not atomic-coordinate reconstructions. Colors, scale, and timing are adjusted for teaching. The included **2026-10-25** classroom guide has not yet been revised for this release's visual details.

---

# 6.1.0 · 课堂演示更新 / Classroom presentation update

日期 / Date: 2026-10-25

标签 / Tag: `classroom-2026-10-25`
演示构建 / Demonstration build: `cf673162`

## 中文

相较原仓库10月23日版本，本版围绕“看清结构、辨认角色、读懂动作”整理课堂演示：

- 调整整胞构图、胞质与膜材质，减少过度透明；细胞结构和细胞器归入统一图谱入口。
- 区分内体、吞噬体、溶酶体与过氧化物酶体的内容身份和作用，统一吞噬体整胞与近景外形。
- 日常协作细分为合成与分选、能量与运输、回收与降解，每课五步，补充货物、膜和蛋白的动作联系。
- 完善大颗粒吞噬、可溶配体摄取、病毒相关抗原清除三种教学，加入立体膜形变、角色说明与分解过程。
- 保留已认可的HA构象动作，为病毒包膜与内体膜增加弧度；宿主抗病毒应答完整细分19节，改善剖切、取景与图上解释。
- 新增教师讲解书PDF与Markdown，覆盖操作、暂停点、照讲稿、课堂提问和科学边界。

验证涵盖选定场景的CPU与浏览器检查，共414项（54＋83＋277），保存50张截图，未记录JavaScript错误；这不是414项浏览器测试，也不覆盖任意操作和电脑性能。

本项目是有文献依据的教学模型，并非原位电镜重建或动力学测量；色彩、尺度和时间经过展示调整，不宣称达到参考图电影级效果或保证稳定帧率。

## English

Compared with the repository's October 23 version, this release makes classroom demonstrations easier to read through clearer structures, identifiable actors, and connected actions:

- Refined the whole-cell composition, cytoplasmic and membrane materials, reducing excessive transparency. Cell structures and organelles now share one atlas entry.
- Clarified the contents and roles of endosomes, phagosomes, lysosomes, and peroxisomes, and aligned the whole-cell and close-up phagosome shapes.
- Expanded three everyday cooperation lessons—synthesis and sorting, energy and transport, and recycling and degradation—into five steps each, connecting cargo, membrane, and protein actions.
- Improved three uptake lessons: large-particle phagocytosis, soluble-ligand uptake, and viral-antigen clearance, with volumetric membrane deformation, actor explanations, and breakdown sequences.
- Preserved the accepted HA conformational actions while curving the viral envelope and endosomal membrane. The host antiviral-response lesson now provides 19 substeps with clearer cutaways, framing, and on-model explanations.
- Added a teacher's guide in PDF and Markdown, covering controls, pause points, spoken scripts, questions, and scientific limits.

Validation covers selected scenarios through 414 combined CPU and browser checks (54 + 83 + 277), with 50 screenshots and no recorded JavaScript errors. These are not 414 browser tests, nor do they cover every interaction or computer's performance.

This is a literature-informed teaching model, not an in-situ electron-microscopy reconstruction or a measurement of molecular dynamics. Colors, scales, and timing are adjusted for presentation. No cinematic match to the reference image or guaranteed stable frame rate is claimed.

---

# 微观结构与膜融合更新 · 2026-10-23

本次更新把膜的两侧、细胞器内腔与融合步骤分开显示，方便从整颗细胞逐层进入局部构造。包含 **12 个主要结构入口和 6 个局部实例**。

- **磷脂双层与嵌膜蛋白**：蓝色标示胞外叶，玫瑰色标示胞质叶，琥珀色标示相向的疏水双尾。可查看 FcγRIIA 的单跨膜区，以及 P2X7 三亚基、每亚基两个跨膜区和通道开闭。
- **粗面与光面 ER**：新增粗面片层、光面管网和腔内观察按钮；说明核糖体的胞质侧位置、两域的共同腔，以及核周隙—ER 连接。
- **Golgi 分区**：整胞与细节视图统一为七层教学膜囊及 TGN 管囊网络。可分别靠近 cis、medial、trans、TGN，并进入中间囊腔。
- **轻微胞质运动**：播放时显示受限的局部缓慢运动和淡轨迹；可独立关闭。它表达局部扰动，不表示整颗巨噬细胞存在统一环流。
- **两个融合案例**：宿主晚期内体—溶酶体的 SNARE 配对，以及已内化流感样颗粒在适当低 pH 条件下的 HA 构象变化。阶段按钮和进度条可逐步查看蛋白动作、半融合及水性孔开放；开放孔具有实际几何通路。

全部解压 Windows 便携包后，双击 **启动展示.cmd**。点击结构进入详情，拖动旋转，滚轮缩放。进入“内质网”或“高尔基体”后使用“放大查看构造”；在“摄取”或“病毒应答”中选择融合案例，点击阶段或拖动反应进度，并使用“沿融合孔向内看”观察孔道。

颜色、比例、速度及构象之间的过渡用于教学。新模型由原始论文中的膜拓扑和构象信息约束，不是某个巨噬细胞的电镜分割或原子动力学重建。吞噬包裹、宿主膜融合和病毒包膜融合是不同过程；HA 融合不等于成功复制。来源与适用范围见 [SOURCES.md](SOURCES.md)。

---

# Microstructure and membrane fusion update · 2026-10-23

This update makes membrane sidedness, organelle lumens and fusion steps easier to explore, from the whole cell to local structures. It includes **12 main structure entries and 6 local examples**.

- **Bilayer and embedded proteins:** blue extracellular leaflet, rose cytoplasmic leaflet and amber opposing hydrophobic tails. Inspect the single membrane span of FcγRIIA and the three P2X7 subunits, each with two membrane spans, during channel gating.
- **Rough and smooth ER:** dedicated views of ribosome-bearing sheets, ribosome-free tubules and the shared lumen, with explanations of cytosolic ribosomes and nuclear-envelope continuity.
- **Golgi regions:** matching whole-cell and detail models with seven illustrative cisternae and a continuous TGN tubulocisternal network. Focus on cis, medial, trans or TGN, or enter a medial cisterna.
- **Subtle cytoplasmic motion:** confined local movement with faint recent-position trails during playback; independently switchable. These illustrate local fluctuations, not a uniform whole-cell circulation.
- **Two fusion examples:** host late-endosome/lysosome SNARE assembly and conditional low-pH influenza HA rearrangement after uptake. Stage buttons and a scrubber expose protein movement, hemifusion and a geometrically open aqueous pore.

Extract the entire Windows package and double-click **启动展示.cmd**. Select a structure, drag to rotate and scroll to zoom. Use the structure-focus buttons in ER or Golgi details. Open a fusion example from the uptake or viral-response view, select a stage or scrub the timeline, then choose **沿融合孔向内看** to look through the pore.

Colors, scale, timing and transitions are designed for teaching. Primary research informs topology and conformational motifs; the new models are not measured macrophage EM segmentations or atomic simulations. Engulfment, host membrane fusion and viral envelope fusion are distinct events. HA-mediated fusion does not establish productive infection. See [SOURCES.md](SOURCES.md) for evidence and scope.
