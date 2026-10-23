# 巨噬细胞 · 生命内部 / Macrophage Cell Explorer

[下载 Windows 便携包 / Download the Windows portable demo](https://github.com/fyfyuzhouwudi-boop/macrophage-cell-explorer/releases/latest)

一个可旋转、剖切和逐层放大的三维教学演示。通过 **12 个细胞结构入口**和 **3 个示意模式**，观察巨噬细胞内部的空间关系与部分功能过程。

An interactive 3D teaching demo for rotating, sectioning, and exploring a macrophage. **12 structure entries** and **3 illustrative modes** show spatial relationships and selected cellular processes.

界面以简体中文为主；本说明提供中英双语。项目仍在完善，视觉和交互细节会继续调整。

The interface is primarily in Simplified Chinese; this README is bilingual. Visuals and interactions are still being refined.

## 膜、细胞器与融合过程 / Membranes, organelles and fusion

**12 个主要结构入口 + 6 个局部实例。** 主要结构包括细胞核、内质网、高尔基体、线粒体、溶酶体、内体、细胞膜、细胞骨架、核孔复合体、吞噬体、过氧化物酶体和核糖体。局部实例包括微管蛋白坐标、核糖体坐标、ER 膜褶皱、微绒毛与膜活动、SNARE 融合和流感 HA 融合。核孔与核糖体也计作结构入口，不把这 18 项统称为 18 种细胞器。

**12 main structure entries + 6 local examples.** The main entries cover the nucleus, ER, Golgi, mitochondria, lysosomes, endosomes, plasma membrane, cytoskeleton, nuclear pore complex, phagosome, peroxisomes and ribosome. Local examples cover tubulin coordinates, ribosome coordinates, an ER membrane fold, microvilli/membrane activity, SNARE fusion and influenza HA fusion. These entries are not a count of 18 distinct organelle types.

| 想观察什么 / Explore | 操作 / Action |
|---|---|
| 双层与贯膜蛋白 / Bilayer and membrane spans | 点击“细胞膜”，观察两叶图例，再切换表面、剖切或局部放大。 / Select the plasma membrane and use the surface, section and local views. |
| 粗面、光面与 ER 腔 / Rough ER, smooth ER and lumen | 点击“内质网”，使用“放大查看构造”；连接视图显示外核膜及核周隙的连续关系。 / Select ER and use its focus buttons; the connected view shows nuclear-envelope continuity. |
| cis—medial—trans—TGN | 点击“高尔基体”，逐区放大，或选择“进入中间囊腔”。 / Select Golgi and focus on a region or enter the medial cisterna. |
| 轻微胞质运动 / Subtle cytoplasmic motion | 在整胞视图播放，用“淡淡胞质微动”开关控制轨迹。 / Play the whole-cell view and use the cytoplasmic-motion toggle. |
| 蛋白如何促成融合 / How proteins promote fusion | 在摄取或病毒应答视图打开 SNARE 或 HA 案例；点选阶段、拖动进度、暂停或重播。 / Open a SNARE or HA example, select stages, scrub, pause or replay. |
| 水性融合孔 / Aqueous fusion pore | 到达开孔阶段后点击“沿融合孔向内看”，拖动环视。 / At an open-pore stage, use the pore-view button and drag to look around. |

蓝、玫瑰、琥珀色分别标示细胞膜胞外叶、胞质叶和疏水双尾，属于教学配色。粗面和光面 ER 共用连续腔；Golgi 各层与 TGN 的区室关系分别说明。胞质轨迹是受限局部扰动，不能解释为实测的整体环流。SNARE 案例与流感 HA 案例具有不同膜侧朝向和区室标签；HA 示例从内化后开始，依赖适当酸化条件，不预测巨噬细胞的生产性感染。

Blue, rose and amber encode the extracellular leaflet, cytoplasmic leaflet and hydrophobic tails for teaching. Rough and smooth ER share a continuous lumen; Golgi cisternae and TGN compartments are explained separately. Cytoplasmic trails illustrate confined fluctuations rather than measured bulk circulation. SNARE and HA examples have different compartment labels and sidedness. The HA example starts after uptake and assumes appropriate acid activation; it does not predict productive macrophage infection.

本次新增形体依据论文及电镜构象信息设计，比例、配色、显示数量和动画速度均作展示调整。既有公开坐标实例与这些教学形体分别标注。详细参考与适用范围见来源附录。

The new geometry is informed by published research and EM conformational information, with illustrative scale, colors, copy numbers and timing. Existing public-coordinate examples remain separately identified. See the source appendix for claim-specific evidence and limitations.


## 直接打开 / Open offline

1. 下载整个项目 ZIP，并完整解压。
2. Windows 用户双击 **`启动展示.cmd`**；也可以用 Edge 或 Chrome 直接打开同目录的 **`index.html`**。
3. 使用支持 **WebGL 2** 的桌面浏览器。浏览器安装程序不包含在项目中。

1. Download the project ZIP and extract it completely.
2. On Windows, double-click **`启动展示.cmd`**, or open **`index.html`** in Edge or Chrome.
3. Use a desktop browser with **WebGL 2** support. A browser installer is not included.

直接体验不需要 Node.js、Python、本地服务器或网络连接。程序、模型、纹理与图标已包含在 HTML 中；打开文献与资料链接需要联网。

The supplied HTML runs without Node.js, Python, a local server, or an internet connection. Its code, models, textures, and icons are embedded. Following source and literature links requires internet access.

## 怎么观察 / Controls

| 操作 / Action | 作用 / Result |
| --- | --- |
| 拖动 / Drag | 旋转视角 / Rotate the view |
| 滚轮 / Mouse wheel | 放大或缩小 / Zoom |
| 点击结构或右侧名称 / Select a structure or its sidebar entry | 进入放大观察 / Open a detailed view |
| 整体、剖面、内部构象 / Whole, section, internal configuration | 切换观察层级 / Change the observation level |
| 播放、速度、剖切滑块 / Play, speed, section slider | 控制已有的示意运动与切面 / Control the illustrative motion and section |
| 返回整胞 / Return to cell | 回到整胞观察 / Return to the whole-cell view |

部分结构另有局部观察按钮。画质可调；细节模型与整胞使用不同的展示尺度，不能按屏幕上的大小比较真实尺寸。

Some structures offer additional close-up views. Quality is adjustable. Detail models and the whole cell use different display scales, so their on-screen sizes do not indicate relative biological size.

## 展示内容 / What is included

| 结构入口 / Structure entries |
| --- |
| 细胞核 / Nucleus |
| 内质网 / Endoplasmic reticulum |
| 高尔基体 / Golgi apparatus |
| 线粒体 / Mitochondria |
| 溶酶体 / Lysosome |
| 内体 / Endosome |
| 细胞膜 / Plasma membrane |
| 细胞骨架 / Cytoskeleton |
| 核孔复合体 / Nuclear pore complex |
| 吞噬体 / Phagosome |
| 过氧化物酶体 / Peroxisome |
| 核糖体 / Ribosome |

另有 α/β 微管蛋白、人 80S 核糖体及膜局部等代表性放大入口。细胞膜详情包含 FcγRIIA–IgG 结合与 P2X7–ATP 门控的独立教学示例。

Additional representative views include α/β tubulin, a human 80S ribosome, and local membrane structures. Plasma-membrane details contain independent teaching examples of FcγRIIA–IgG binding and P2X7–ATP gating.

### 三个模式 / Three modes

- **细胞展示 / Cell view**：观察结构、区室与日常功能协作。关系线表示功能联系，不表示膜腔全部相通。 / Explore structures, compartments, and everyday functional cooperation. Relationship lines indicate functional links, not a continuous lumen connecting every organelle.
- **接受物质 / Material uptake**：以选定的大颗粒或可溶配体案例，区分包围、摄取、递送、回收和处理；部分中间态被简化。 / Selected particle and soluble-ligand examples distinguish enclosure, uptake, delivery, recycling, and processing; some intermediate states are simplified.
- **病毒响应 / Viral response**：展示一条有前提条件的宿主应答支路。颗粒摄取与“可识别 RNA 已在胞质”的识别条件分开呈现。 / Show a conditional host-response branch. Particle uptake is presented separately from the prerequisite that recognizable RNA is already in the cytosol.

这些示例不是同一细胞中实测的一条连续反应，也不把所有膜蛋白、所有病毒或所有摄取方式串成必经流程。受体结合、膜通道活动、抗原载体清除和胞质 RNA 应答各有自己的展示范围。

These examples are not one experimentally measured sequence in a single cell, nor a mandatory pathway shared by every membrane protein, virus, or uptake route. Receptor binding, channel activity, antigen-carrier clearance, and cytosolic RNA responses have distinct scopes.

## 本地开发 / Local development

需要 **Node.js 22 或更新版本**与 npm。首次安装依赖通常需要联网。

Use **Node.js 22 or newer** and npm. The initial dependency installation normally requires internet access.

```sh
npm install
npm run build
npm run dev
```

构建结果写入 **`dist/index.html`**。开发预览地址为 **`http://127.0.0.1:4194/`**；也可以直接打开构建后的 HTML。`npm run dev` 提供已构建文件，不会自动重新构建。修改源码后请再次执行 `npm run build`。

The build writes **`dist/index.html`**. The development preview is **`http://127.0.0.1:4194/`**; the generated HTML can also be opened directly. `npm run dev` serves the existing build and does not rebuild it automatically. Run `npm run build` again after source changes.

仓库根目录的 `index.html` 是随项目提供的成品。开发时请查看 `dist/index.html`；更新公开成品时，再用确认过的构建替换根目录文件。

The root `index.html` is the supplied ready-to-open build. During development, use `dist/index.html`; replace the root artifact with the reviewed build when preparing an updated public version.

## 模型身份与来源 / Model identity and sources

本项目是程序化教学模型，**不是某一颗巨噬细胞的电镜分割重建、分子动力学或全原子模拟**。颜色、数量、比例和速度经过展示调整；具名蛋白也可能采用按拓扑制作的简化包络。

This is a procedural teaching model, **not an electron-microscopy segmentation of one macrophage, a molecular-dynamics simulation, or an all-atom simulation**. Colors, counts, proportions, and speeds are adjusted for presentation. Named proteins may also use simplified topology-based envelopes.

1JFF 和 4UG0 两个入口使用公开结构坐标派生的粗化骨架；它们不代表这颗示意巨噬细胞的原位测量。文献、样品范围及坐标数据说明见 [SOURCES.md](SOURCES.md)；逐项结构说明与链接也保存在 [src/structure-guide.js](src/structure-guide.js) 中。

The 1JFF and 4UG0 entries use coarse traces derived from public structural coordinates; they are not in-situ measurements of the illustrated macrophage. See [SOURCES.md](SOURCES.md) for references, specimen scope, and coordinate provenance. Structure-specific descriptions and links are also kept in [src/structure-guide.js](src/structure-guide.js).

第三方软件许可及数据使用说明见 [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt)。本仓库未另附原创代码与艺术资产的许可证。

Third-party software notices and data-use information are in [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt). No separate license for the original project code and artwork is included.
