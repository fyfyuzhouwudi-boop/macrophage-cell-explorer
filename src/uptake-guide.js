// Case-specific educational scope. These are representative teaching cases, not universal macrophage routes.
export const UPTAKE_GUIDES=Object.freeze({
 'particle-phagocytosis':{
  summary:'本例使用预先带有IgG的可降解非病毒蛋白大颗粒，展示有吞噬活性的FcγR代表路径。Fab端朝向颗粒抗原，朝外的Fc端与膜上FcγR配对；形体是教学符号。',
  steps:[
   {title:'接触',desc:'已调理颗粒接近局部膜面。膜材料有胞质侧与胞外侧两个界面；有限局部的人工裁边只用于闭合展示范围，不代表生理封口。',location:'胞外颗粒与连续局部膜',partners:['颗粒上的IgG','局部FcγR']},
   {title:'受体侧移与包裹',desc:'FcγR在杯侧实际膜三角面上侧移至接触区，结合域朝杯腔/胞外、胞质尾朝胞质。连续膜杯逐渐包围颗粒，actin在胞质侧。',location:'连通的膜杯与接触区',partners:['FcγR与IgG','胞质侧actin','膜杯']},
   {title:'收颈',desc:'膜杯、颈和背景膜仍使用同一共享索引膜面。正半径的细颈逐渐收窄；裂分前杯腔仍通过开口连胞外，货物尚不属于封闭内腔。',location:'保持开放的杯颈',partners:['杯腔','胞外水相','连续母膜']},
   {title:'瞬时裂分与封闭运输',desc:'教学进度62%处，在有限薄颈处瞬时更换拓扑：形成封闭吞噬体和封口母膜，不以长淡出来遮住过程。货物与受体位置只作小于薄颈半径的有限位移，随后封闭载体向胞质侧运输。',location:'新封闭吞噬体与有限母膜',partners:['吞噬体膜','腔内颗粒及IgG','胞质侧受体尾']},
   {title:'处理与残余',desc:'大货物留在封闭处理腔内，缩小与残余表示定性处理；大颗粒不进入受体回收支路。整胞视角另保留已封闭后的安全运输及代表性共享融合颈。',location:'吞噬性处理区室的腔内',partners:['膜围成的处理腔','通用酶性内容物']}
  ],
  notes:['局部膜杯、细颈和背景膜为同一可变形共享索引膜；此有限代表局部未接回整胞质膜。整胞与局部不是逐顶点原位电镜追踪。','裂分是显式瞬时拓扑事件，不是零面积、非流形的零颈帧。裂分蛋白、脂双层叶级动力学与流体力学未模拟。后续酶递送/供体融合在局部仍作状态简化。','整胞从已封闭且位于完整外膜内的安全运输段开始；新局部62%闭合前整胞运输进度固定0.38，闭合后才推进既有整胞路线。','颜色、比例、48秒时长、受体符号与处理大小为教学调整，不代表实测速率、原子结合界面、全部清除或所有FcγR亚型的行为。'],
  sources:[{title:'FcγR与吞噬功能｜Anderson 1990',url:'https://pubmed.ncbi.nlm.nih.gov/2139103/'},{title:'Fc吞噬与骨架｜Allen & Aderem 1996',url:'https://pubmed.ncbi.nlm.nih.gov/8760816/'},{title:'FcγR侧向活动与聚集｜Jaumouillé 2014',url:'https://pubmed.ncbi.nlm.nih.gov/24914558/'},{title:'Fc受体信号与膜杯生长｜2010原始研究',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2984174/'},{title:'吞噬体成熟的多次相互作用｜Desjardins 1994',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2119957/'},{title:'IgG的Fab与Fc分工｜Molecular Biology of the Cell',url:'https://www.ncbi.nlm.nih.gov/books/NBK26884/'}]
 },
 'mannose-receptor-endocytosis':{
  summary:'本例限定具有甘露糖受体MR/MRC1（CD206）活性的巨噬细胞，展示末端带甘露糖的可溶糖蛋白摄取。MR不是甘露糖-6-磷酸受体；不代表所有细胞都表达同样的受体活性。',
  steps:[
   {title:'胞外结合与内化',desc:'小糖蛋白结合MR后，以已内化的膜载体关键帧表示摄取结果；没有大颗粒吞噬杯。',location:'质膜与内吞载体',partners:['膜上MR-01','可溶配体Ligand-01']},
   {title:'早期内体分选',desc:'MR仍嵌在限制膜上，结合域朝腔面、短尾朝胞质。配体与MR分开后留在体部腔内。',location:'早期分选内体',partners:['限制膜上的受体','腔内可溶配体']},
   {title:'受体随膜回收',desc:'体部与静态回收管共用连续的内外边界，MR沿实际膜面移动；不先进入腔内小泡再回收。后续以带同一受体身份的回收载体状态表示。',location:'内体限制膜、连通回收管及回收载体',partners:['MR-01','回收膜']},
   {title:'两个不同去向',desc:'MR返回细胞表面，结合域重新朝向胞外；配体留在处理区室腔内并定性改变。配体没有随受体回到表面。',location:'表面受体与独立处理腔',partners:['质膜','内吞—溶酶体处理途径']}
  ],
  notes:['出芽、裂分、载体与区室融合及最终回膜采用明确的前后关键帧交接；未构造的中间态不会被称作真实连续膜变形。','同一MR-01与Ligand-01标记保留身份和膜侧向；独立放大后的大小不用于比较真实分子尺寸。整胞界面仅作位置参照，播放需回到局部过程。','受体复用及配体递送依据代表性甘露糖缀合物研究。人源适用性限定于具相应受体活性的细胞来源和状态。颜色、速度与教学时长均不代表测量。'],
  sources:[{title:'甘露糖受体摄取与复用｜Stahl 1980',url:'https://pubmed.ncbi.nlm.nih.gov/6766809/'},{title:'受体回收与配体递送｜Wileman 1984',url:'https://pubmed.ncbi.nlm.nih.gov/6087792/'},{title:'特定人源巨噬细胞的受体活性｜Shepherd 1982',url:'https://pubmed.ncbi.nlm.nih.gov/6298410/'}]
 },
 'viral-antigen-clearance':{
  summary:'限定教学案例：预先由IgG调理的非感染性病毒相关抗原载体。FcγR识别的是IgG-Fc，并不直接把任意病毒表面识别为同一配体。本例不是通用病毒入侵、复制或感染模型。',
  steps:[
   {title:'调理载体接触',desc:'Fab朝向载体上的抗原，Fc朝外；载体在此已经具备多价IgG标记，抗体生成与调理过程不在本段。',location:'胞外与局部膜面',partners:['非感染性抗原载体','IgG','FcγR']},
   {title:'FcγR侧移配对与包裹',desc:'FcγR沿实际杯侧膜面侧移，结合域朝胞外/杯腔，胞质尾及actin保持胞质侧。共享索引杯膜逐渐包裹载体。',location:'连续局部膜杯',partners:['IgG-Fc与FcγR','胞质侧actin']},
   {title:'连通细颈收窄',desc:'杯与背景膜共索引，杯腔仍与胞外相通；抗原载体不穿过膜壁进入胞质。',location:'开放杯腔与细颈',partners:['杯膜','胞外水相']},
   {title:'瞬时裂分与封闭运输',desc:'进度62%处发生明确的有限颈拓扑交接，形成封闭吞噬体及封口母膜；载体、抗体和受体保持相邻关系。',location:'新封闭吞噬体',partners:['膜内载体','膜上FcγR']},
   {title:'腔内处理',desc:'载体留在腔内并定性缩小，允许残余；不显示感染、复制、膜逃逸或抗原自动进入胞质RNA支路。',location:'膜围成的处理腔',partners:['抗原载体','通用酶性内容物']}
  ],
  notes:['这是人为限定的非感染性抗原载体，不替换病毒应答图中的独立条件性胞质RNA。摄取不能自动推出感染或RNA已到胞质。','与A共用几何、48教学秒时钟、共享索引杯/颈/背景和有限颈瞬时裂分。未模拟裂分蛋白、叶级动力学、流体或局部酶递送全过程。','有限母膜的人工外缘不代表生理封口；局部膜片未接回整胞外膜。整胞只从已闭合后的安全旧运输段作位置示范。','颜色、数量、尺度与时间为教学设置。回到病毒应答由主程序显式切换，不通过本支路输送病毒颗粒或RNA。'],
  sources:[{title:'IgG/FcγR吞噬功能｜Anderson 1990',url:'https://pubmed.ncbi.nlm.nih.gov/2139103/'},{title:'Fc吞噬与胞质骨架｜Allen & Aderem 1996',url:'https://pubmed.ncbi.nlm.nih.gov/8760816/'},{title:'FcγR侧向活动与聚集｜Jaumouillé 2014',url:'https://pubmed.ncbi.nlm.nih.gov/24914558/'}]
 }
});
