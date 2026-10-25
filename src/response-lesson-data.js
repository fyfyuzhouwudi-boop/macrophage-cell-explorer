// One timing table drives the response focus, on-model explanation and optional
// substep navigation. Intervals are pedagogical, not measured biological rates.
export const VIRAL_RESPONSE_SUBSTEPS=Object.freeze([
  {key:'particle',at:0,phase:0,title:'胞外颗粒与宿主膜',location:'胞外 → 已内化状态',input:'胞外包膜颗粒',action:'接近并被摄取；受体条件依颗粒与细胞而变',result:'颗粒被膜围住，与胞质隔开',condition:'摄取不等于成功感染；内陷和断颈用状态交接，未模拟。'},
  {key:'endosomal-processing',at:.16,phase:1,title:'内体腔内处理',location:'内体腔',input:'膜包围的颗粒',action:'内体运输与颗粒组分分解',result:'残余片段仍在膜内',condition:'内体不直接改称溶酶体；片段不会自动变为胞质病毒 RNA。'},
  {key:'cytosolic-recognition',at:.32,phase:2,title:'RIG-I 识别合适的 RNA',location:'胞质',input:'可识别 RNA 已在胞质',action:'RIG-I 结合 RNA，并露出信号相关 CARD 区域',result:'具备启动 MAVS 支路的条件',condition:'独立条件支路；不表示前段内体自动泄漏，也不是所有病毒的唯一传感器。'},
  {key:'MAVS',at:.38,phase:2,title:'MAVS 在外膜侧组装信号',location:'线粒体外膜的胞质侧',input:'RIG-I 相关信号',action:'MAVS 信号域组装，衔接下游因子',result:'向下游激酶网络传递活化',condition:'亚基数和大小为教学表达；不是线粒体内部的运输颗粒。'},
  {key:'TBK1-activation',at:.445,phase:2,title:'下游激酶活化 IRF3',location:'胞质侧信号局部图',input:'MAVS 下游信号网络',action:'以 TBK1 为例，显示 IRF3 磷酸化状态',result:'活化 IRF3 可参与核内基因调控',condition:'TRAF/NEMO 等中间反应省略；不表示 MAVS 直接结合 TBK1 或唯一活化地点。'},
  {key:'IRF3-transport',at:.49,phase:3,title:'活化 IRF3 经核孔入核',location:'胞质 → 核孔 → 核内',input:'活化的宿主 IRF3',action:'通过核孔，到达核内调控环境',result:'参与 IFNB1 表达调控',condition:'蛋白运动是教学路线，非实测轨迹；IRF3 不是病毒 RNA。'},
  {key:'nuclear-transcription',at:.616,phase:3,title:'宿主 IFNB1 基因转录',location:'细胞核内的局部放大图',input:'IRF3 与协同调控因子',action:'共同调控转录机器，生成宿主 RNA',result:'出现 IFNB1 转录本',condition:'核内 DNA 与蛋白为比例调整的教学图；IRF3 不是唯一必需因子。'},
  {key:'mRNA-to-ER',at:.65,phase:4,title:'宿主 mRNA 输出并接入翻译',location:'核孔 → 胞质侧内质网',input:'宿主 IFNB1 mRNA',action:'输出到胞质，接入内质网相关翻译',result:'为合成分泌蛋白提供模板',condition:'mRNA 留在胞质侧，不进入内质网腔；此路径不是病毒基因组运输。'},
  {key:'ER-translation',at:.668,phase:4,title:'在粗面内质网上合成 IFN-β',location:'上：胞质；下：内质网腔',input:'宿主 mRNA 与核糖体',action:'肽链经转位通道进入内质网腔',result:'形成腔内分泌蛋白 IFN-β',condition:'膜通道有真实几何开口；此为比例调整的局部图，非原子结构。'},
  {key:'Golgi-processing',at:.693,phase:4,title:'高尔基腔内处理与分选',location:'顺面 → 中间 → 反面高尔基腔',input:'分泌途径中的宿主 IFN-β',action:'用剖面显示腔内货物与后续分选',result:'进入面向细胞表面的分泌载体',condition:'各腔货物是顺序状态；区室间出芽和膜融合未逐分子重建，不画闭囊泡穿膜。'},
  {key:'secretory-carrier',at:.728,phase:4,title:'分泌载体在胞质中运输',location:'高尔基输出侧 → 细胞表面内侧',input:'载体腔内的 IFN-β',action:'闭合膜载体向细胞表面运输',result:'货物保持在载体腔内，准备胞吐',condition:'路线调整以便观察，不是实测距离或速度；IFN-β 不是病毒或抗体。'},
  {key:'exocytosis',at:.785,phase:4,title:'胞吐孔让腔内货物通向胞外',location:'外侧：胞外；凹腔：载体腔',input:'载体腔内的宿主 IFN-β',action:'开放胞吐孔中，腔内货物沿孔口释放',result:'IFN-β 出现在细胞外',condition:'显示连续 omega 膜与开放孔局部状态；早期对接/融合蛋白种类及动力学未重建。'},
  {key:'released-IFN',at:.815,phase:4,title:'胞外 IFN-β 传递宿主信号',location:'细胞外',input:'已释放的宿主 IFN-β',action:'在胞外扩散，可作用于自身或邻近细胞',result:'为 IFNAR 受体结合提供配体',condition:'小颗粒是信号蛋白；不是子代病毒，不表示病毒被直接杀死。'},
  {key:'approaching-IFN',at:.845,phase:5,title:'IFN-β 接近膜外受体',location:'细胞膜的胞外侧',input:'胞外宿主 IFN-β',action:'选定配体接近 IFNAR2 胞外区域',result:'准备组成受体信号复合体',condition:'这是宿主配体结合，不是病毒入侵，也不是膜融合。'},
  {key:'IFNAR-extracellular-assembly',at:.86,phase:5,title:'IFNAR1/2 在膜上组装',location:'细胞膜的胞外侧',input:'IFN-β 与受体亚基',action:'配体结合促进 IFNAR1/2 受体复合体形成',result:'胞外结合与胞质侧信号衔接',condition:'有限横向移动为教学表达，受体始终保持膜锚定。'},
  {key:'IFNAR-cytosolic-JAK',at:.885,phase:5,title:'胞质侧激酶改变 STAT 状态',location:'细胞膜的胞质侧',input:'已组装的 IFNAR 复合体',action:'JAK1/TYK2 相关信号使 STAT1/2 磷酸化',result:'STAT 核内响应所需状态改变',condition:'橙色小点是附着的磷酸化状态标记，不是自由运输颗粒。'},
  {key:'STAT-transport',at:.915,phase:5,title:'STAT1/2 经核孔入核',location:'胞质 → 核孔 → 核内',input:'活化的 STAT1/STAT2',action:'观察其入核教学路径',result:'与 IRF9 共同参与核内基因调控',condition:'不声称全部 ISGF3 都已在胞质装配完成；巨噬细胞也支持在 DNA 上组装的模型。'},
  {key:'ISG-transcription',at:.963,phase:5,title:'核内启动 ISG 表达',location:'细胞核内的局部放大图',input:'STAT1/STAT2 与 IRF9',action:'在调控 DNA 环境中共同促进宿主转录',result:'形成宿主 ISG 转录产物',condition:'ISRE/DNA 与蛋白为教学符号；不是特定基因的真实位置或测得构象。'},
  {key:'induced-products',at:.985,phase:5,title:'宿主应答产物增强防御',location:'胞质中的代表性教学窗口',input:'ISG 表达及后续翻译',action:'产生具有不同防御功能的宿主产物',result:'可限制病毒 RNA、翻译或复制等环节',condition:'此形状不指定一种蛋白；实际功能依产物与病毒而异，不保证清除所有病毒。'}
].map(step=>Object.freeze(step)));

export function responseTeachingState(value){
  const progress=Number.isFinite(value)?Math.min(1,Math.max(0,value)):0;
  let index=0;for(let i=1;i<VIRAL_RESPONSE_SUBSTEPS.length;i++)if(progress>=VIRAL_RESPONSE_SUBSTEPS[i].at)index=i;
  return {...VIRAL_RESPONSE_SUBSTEPS[index],index,total:VIRAL_RESPONSE_SUBSTEPS.length,progress,nextAt:VIRAL_RESPONSE_SUBSTEPS[index+1]?.at??1};
}
