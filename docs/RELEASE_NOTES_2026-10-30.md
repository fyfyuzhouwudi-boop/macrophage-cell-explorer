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
