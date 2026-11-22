/* ===========================================================================
   app.js — 渲染与交互
   所有内容从 data.js 读取。无框架，无外部依赖。
   =========================================================================== */
(function(){
'use strict';

/* --- 工具 -------------------------------------------------------------- */
const $  = s => document.querySelector(s);
const el = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SVGNS = 'http://www.w3.org/2000/svg';

/* 脚注编号：src id → 序号 */
const refIdx = {};
SOURCES.forEach((s,i) => refIdx[s.id] = i+1);
const ref = ids => !ids || !ids.length ? '' :
  '<sup class="ref">' + ids.map(i => refIdx[i]).filter(Boolean).join(',') + '</sup>';

/* 画 SVG：返回字符串，统一 viewBox + class="chart" */
function svg(w,h,body){
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

/* =====================================================================
   照片组件 — 素材来自 Wikimedia Commons，许可逐个核验
   Special:FilePath 直链，由 Commons 按需生成缩略图
   ===================================================================== */
function photo(key, tag, w, opt){
  const p = PHOTOS[key]; if(!p) return '';
  const o = opt || {};
  const src = CM + encodeURIComponent(p.file) + '?width=' + (w || 1280);
  return `
    <figure class="fig${o.reveal?' reveal':''}" style="${o.style||''}">
      <span class="tag">${esc(tag)}</span>
      <img src="${src}" alt="${esc(p.name)}"
           loading="${o.eager?'eager':'lazy'}" width="1280" height="854"
           referrerpolicy="no-referrer">
      <figcaption>
        <span><b>${esc(p.name)}</b>${p.year?' · '+esc(p.year):''}　${esc(p.cap)}</span>
        <span>${esc(p.param)}</span>
      </figcaption>
    </figure>
    ${o.note && p.note ? `<p style="font-size:var(--step--1);color:var(--ink2);margin:var(--sp-2) 0 0;max-width:var(--measure)">${esc(p.note)}</p>` : ''}`;
}

/* =====================================================================
   00 开场 — B 站嵌入三格
   iframe 懒加载：未滚到视口不请求；播放器 autoplay=0，不自动播放。
   ===================================================================== */
function renderBili(){
  const host = el('media3'); if(!host) return;
  host.innerHTML = BILI.map(m => `
    <figure>
      <span class="tag">${esc(m.id)}</span>
      <span class="verdict">${esc(m.verdict)}</span>
      <div class="vwrap">
        <iframe src="https://player.bilibili.com/player.html?bvid=${esc(m.bvid)}&page=1&autoplay=0&high_quality=1&danmaku=0"
                title="${esc(m.name)}" loading="lazy" allowfullscreen
                scrolling="no" frameborder="0"></iframe>
      </div>
      <figcaption>
        <span><b>${esc(m.name)}</b></span>
        <span>${esc(m.param)}</span>
      </figcaption>
    </figure>`).join('');

  const w = el('media-watch');
  if(w) w.innerHTML = BILI.map((m,i) => `
    <div style="padding:var(--sp-2) 0;border-bottom:1px solid var(--line)">
      <span class="n" style="margin-bottom:var(--sp-1)">${esc(m.id)}　${esc(m.name)}</span>
      <p style="font-size:var(--step--1);margin:0;max-width:none">${esc(m.watch)}</p>
    </div>`).join('');
}


/* =====================================================================
   01 定义层 — FIG-01 双轴散点
   ===================================================================== */
const Q_W = 860, Q_H = 580, Q_PAD = {t:58,r:52,b:62,l:80};

function renderQuadrant(){
  const host = el('fig01'); if(!host) return;
  const iw = Q_W - Q_PAD.l - Q_PAD.r, ih = Q_H - Q_PAD.t - Q_PAD.b;
  const px = v => Q_PAD.l + v/100*iw;
  const py = v => Q_PAD.t + (100-v)/100*ih;

  // 四象限底色：仅用 paper/paper2 明度差，无渐变
  const quads = `
    <rect x="${px(50)}" y="${py(100)}" width="${iw/2}" height="${ih/2}" fill="var(--paper2)"/>
    <rect x="${px(0)}"  y="${py(50)}"  width="${iw/2}" height="${ih/2}" fill="var(--paper2)"/>`;

  const gridLines = [0,25,50,75,100].map(v => `
    <path class="axf" d="M${px(v)} ${Q_PAD.t} V${Q_PAD.t+ih}"/>
    <path class="axf" d="M${Q_PAD.l} ${py(v)} H${Q_PAD.l+iw}"/>`).join('');

  const mid = `
    <path class="ax" d="M${px(50)} ${Q_PAD.t} V${Q_PAD.t+ih}" stroke-dasharray="5 4"/>
    <path class="ax" d="M${Q_PAD.l} ${py(50)} H${Q_PAD.l+iw}" stroke-dasharray="5 4"/>`;

  const qLabels = [
    {x:px(74), y:py(96), t:'有路权 · 有汽车属性', s:'名实相符'},
    {x:px(24), y:py(96), t:'无路权 · 有汽车属性', s:'不能上路的汽车'},
    {x:px(74), y:py(46), t:'有路权 · 无汽车属性', s:'能上路的飞机'},
    {x:px(24), y:py(46), t:'无路权 · 无汽车属性', s:'小型民航'},
  ].map(q => `
    <text x="${q.x}" y="${q.y}" class="tl" text-anchor="middle">${q.t}</text>
    <text x="${q.x}" y="${q.y+14}" class="pmeta" text-anchor="middle" style="fill:var(--acc-deep)">${q.s}</text>`).join('');

  // 标签偏移：手工避让，不自动布局。[dx, dy, anchor]
  const off = { alef:[14,4], aircar:[-14,18,'end'], helix:[14,-10],
                ehang:[14,20], x3f:[14,4], carrier:[-16,-18,'end'] };

  const pts = QUADRANT.map(d => {
    const [dx,dy,anc] = off[d.key] || [12,-12];
    const hi = d.key === 'carrier';
    return `<g class="qpt" data-key="${d.key}" style="cursor:pointer">
      <circle cx="${px(d.x)}" cy="${py(d.y)}" r="16" fill="transparent"/>
      <circle cx="${px(d.x)}" cy="${py(d.y)}" r="${hi?7:5.5}" class="${hi?'pt-acc':'pt'}"/>
      ${hi?`<circle cx="${px(d.x)}" cy="${py(d.y)}" r="13" fill="none" stroke="var(--acc)" stroke-width="1"/>`:''}
      <text x="${px(d.x)+dx}" y="${py(d.y)+dy}" class="pname" text-anchor="${anc||'start'}">${esc(d.name)}</text>
      <text x="${px(d.x)+dx}" y="${py(d.y)+dy+12}" class="pmeta" text-anchor="${anc||'start'}">${esc(d.kind)}</text>
    </g>`;
  }).join('');

  host.innerHTML = svg(Q_W, Q_H, `
    ${quads}${gridLines}${mid}
    <path class="ax" d="M${Q_PAD.l} ${Q_PAD.t} V${Q_PAD.t+ih} H${Q_PAD.l+iw}"/>
    ${qLabels}${pts}
    <text x="${Q_PAD.l+iw}" y="${Q_PAD.t+ih+34}" class="tl" text-anchor="end">路权 →</text>
    <text x="${Q_PAD.l-14}" y="${Q_PAD.t-18}" class="tl">↑ 汽车属性</text>
    <text x="${Q_PAD.l}" y="${Q_PAD.t+ih+34}" class="tk">无</text>
    <text x="${Q_PAD.l+iw}" y="${Q_PAD.t+ih+50}" class="tk" text-anchor="end">完整</text>
    <text x="${Q_PAD.l-14}" y="${Q_PAD.t+ih}" class="tk" text-anchor="end">低</text>
    <text x="${Q_PAD.l-14}" y="${Q_PAD.t+8}" class="tk" text-anchor="end">高</text>`);

  host.querySelectorAll('.qpt').forEach(g =>
    g.addEventListener('click', () => showQ(g.dataset.key)));
  showQ('carrier');
}

function showQ(key){
  const d = QUADRANT.find(x => x.key === key); if(!d) return;
  const host = el('q-detail'); if(!host) return;
  const traits = Object.entries(d.traits).map(([k,v]) => `
    <div style="display:flex;gap:var(--sp-3);align-items:center;padding:var(--sp-1) 0">
      <span style="flex:0 0 7em;font-size:var(--step--1);color:var(--ink2)">${esc(k)}</span>
      <span class="bar" style="flex:1"><i class="${v>=80?'acc':''}" style="width:${v}%"></i></span>
      <span class="num" style="flex:0 0 2.6em;text-align:right;font-size:11px;color:var(--ink3)">${v}</span>
    </div>`).join('');

  host.innerHTML = `
    <div class="ctrl" style="margin-top:var(--sp-3)">
      <div class="ctrl-hd">
        <span><strong style="font-size:var(--step-0)">${esc(d.name)}</strong>
        <span class="lbl" style="margin-left:var(--sp-2)">${esc(d.origin)} · ${esc(d.kind)}</span></span>
      </div>
      <div class="ctrl-bd">
        <p style="font-size:var(--step--1);margin:0 0 var(--sp-3);max-width:none">${esc(d.note)}${ref(d.src)}</p>
        <span class="lbl" style="display:block;margin-bottom:var(--sp-2)">汽车属性分项</span>
        ${traits}
        <div class="kv" style="margin-top:var(--sp-3)">
          <div><span class="k">适航身份</span><span class="v">${esc(d.cert)}</span></div>
        </div>
      </div>
    </div>`;
  document.querySelectorAll('.qpt circle:nth-child(2)').forEach(c => {
    const on = c.parentNode.dataset.key === key;
    c.setAttribute('class', on ? 'pt-acc' : 'pt');
    c.setAttribute('r', on ? 7 : 5.5);
  });
}

function renderOutlier(){
  const host = el('outlier'); if(!host) return;
  const o = OUTLIER;
  host.innerHTML = `
    <strong style="font-size:var(--step-0);display:block;margin-bottom:var(--sp-2)">${esc(o.name)}</strong>
    <p style="font-size:var(--step--1);margin:0 0 var(--sp-3);max-width:none">${esc(o.note)}${ref(o.src)}</p>
    <div class="kv">${o.mech.map(m => `
      <div><span class="k">${esc(m.k)}</span><span class="v">${esc(m.v)}</span></div>`).join('')}</div>
    <span class="lbl" style="display:block;margin:var(--sp-4) 0 var(--sp-2)">三个版本的实际状态</span>
    <div class="kv">${o.limits.map(m => `
      <div><span class="k">${esc(m.k)}</span><span class="v">${esc(m.v)}</span></div>`).join('')}</div>
    <blockquote style="font-size:var(--step-1);margin-bottom:0">${esc(o.quote)}
      <cite>${esc(o.quoteBy)}</cite></blockquote>`;
}

/* FIG-02 Roadster 机理剖面 */
function renderMech(){
  const host = el('fig02'); if(!host) return;
  const W = 1000, H = 300;
  host.innerHTML = svg(W, H, `
    <rect width="${W}" height="${H}" fill="var(--paper)"/>
    <g stroke="var(--line)" stroke-width="1">
      ${Array.from({length:10},(_,k)=>`<path d="M0 ${k*30} H${W}"/>`).join('')}
      ${Array.from({length:34},(_,k)=>`<path d="M${k*30} 0 V${H}"/>`).join('')}
    </g>

    <!-- 左：冷气推进 -->
    <text x="48" y="40" class="tl">A · 冷气推进器 — 腾空机构</text>
    <g transform="translate(48,70)">
      <path d="M36 92 L86 58 L250 58 L300 92 Z" fill="var(--ink2)"/>
      <rect x="20" y="92" width="296" height="40" fill="var(--ink)"/>
      <circle cx="74" cy="138" r="17" fill="none" stroke="var(--ink)" stroke-width="3.5"/>
      <circle cx="262" cy="138" r="17" fill="none" stroke="var(--ink)" stroke-width="3.5"/>
      <!-- 气罐 -->
      <rect x="120" y="66" width="46" height="24" rx="2" fill="var(--acc)"/>
      <rect x="172" y="66" width="46" height="24" rx="2" fill="var(--acc)"/>
      <text x="169" y="58" class="pmeta" text-anchor="middle">600 L / 250 kg 压缩空气</text>
      <!-- 10 个喷嘴 -->
      ${[30,76,122,168,214,260,306].map(x=>`
        <path d="M${x} 132 l-4 20 M${x} 132 l0 24 M${x} 132 l4 20" stroke="var(--acc)" stroke-width="2" fill="none"/>`).join('')}
      ${[40,300].map(x=>`<path d="M${x} 80 l-18 -4 M${x} 80 l-20 2" stroke="var(--acc)" stroke-width="2" fill="none"/>`).join('')}
      <text x="168" y="178" class="pmeta" text-anchor="middle">车身周边 10 个喷嘴 · 全电动执行器做姿态微调</text>
      <text x="168" y="192" class="pmeta" text-anchor="middle" style="fill:var(--acc-deep)">气罐占掉副驾座位 · 气量固定，只能短暂特技</text>
    </g>

    <path class="ax" d="M500 50 V250"/>

    <!-- 右：风扇负压吸附 -->
    <text x="548" y="40" class="tl">B · 风扇抽吸系统 — 倒挂机构</text>
    <g transform="translate(548,70)">
      <path d="M0 40 L400 40" stroke="var(--ink)" stroke-width="4"/>
      <text x="200" y="28" class="pmeta" text-anchor="middle">垂直/倒置表面</text>
      <rect x="60" y="48" width="280" height="36" fill="var(--ink)"/>
      <path d="M76 84 L120 112 L280 112 L324 84 Z" fill="var(--ink2)"/>
      <circle cx="118" cy="56" r="13" fill="none" stroke="var(--paper)" stroke-width="3"/>
      <circle cx="282" cy="56" r="13" fill="none" stroke="var(--paper)" stroke-width="3"/>
      <!-- 四个风扇 -->
      ${[146,186,226,266].map(x=>`
        <circle cx="${x}" cy="98" r="13" fill="none" stroke="var(--acc)" stroke-width="2"/>
        <path d="M${x-9} 98 H${x+9} M${x} 89 V107" stroke="var(--acc)" stroke-width="1.5"/>`).join('')}
      <!-- 抽吸箭头 -->
      ${[100,320].map(x=>`<path d="M${x} 112 l0 -18 M${x} 94 l-4 7 M${x} 94 l4 7" stroke="var(--acc)" stroke-width="1.5" fill="none"/>`).join('')}
      <text x="200" y="138" class="pmeta" text-anchor="middle">尾部 4 × 20 kW 风扇（热泵压缩机电机加大版）</text>
      <text x="200" y="152" class="pmeta" text-anchor="middle">抽走车底空气形成密封吸附 · 200 mph 时产生 2g 下压力</text>
      <text x="200" y="166" class="pmeta" text-anchor="middle" style="fill:var(--acc-deep)">需贴近表面才成立 · 不是悬浮</text>
    </g>

    <text x="${W-24}" y="${H-14}" class="tk" text-anchor="end">FIG-02 · 据公开拆解资料绘制，非厂方工程图</text>`);
}

/* =====================================================================
   02 主体层
   ===================================================================== */
function specList(arr){
  return `<div class="kv">${arr.map(s => `
    <div><span class="k">${esc(s.k)}</span><span class="v">${esc(s.v)}${ref(s.src)}</span></div>`).join('')}</div>`;
}

function renderX3F(){
  const g = el('sys-ground'), a = el('sys-air');
  if(g) g.innerHTML = `
    <span class="lbl">系统 A</span>
    <h4 style="margin:var(--sp-2) 0 var(--sp-1)">${esc(X3F.ground.label)}</h4>
    <p style="font-size:11px;font-family:var(--mono);color:var(--acc-deep);margin:0 0 var(--sp-3);max-width:none">${esc(X3F.ground.role)}</p>
    ${specList(X3F.ground.specs)}`;
  if(a) a.innerHTML = `
    <span class="lbl">系统 B</span>
    <h4 style="margin:var(--sp-2) 0 var(--sp-1)">${esc(X3F.air.label)}</h4>
    <p style="font-size:11px;font-family:var(--mono);color:var(--acc-deep);margin:0 0 var(--sp-3);max-width:none">${esc(X3F.air.role)}</p>
    ${specList(X3F.air.specs)}`;

  const env = el('envelope');
  if(env) env.innerHTML = `
    <div class="ctrl" style="border-top-width:2px;border-top-color:var(--acc)">
      <div class="ctrl-hd">
        <span class="lbl" style="color:var(--acc-deep)">一手监管文件 · 全文最关键的事实</span>
        <span class="st st-warn">审定基础</span>
      </div>
      <div class="ctrl-bd">
        <h4 style="margin:0 0 var(--sp-3)">${esc(X3F.envelope.headline)}</h4>
        <div class="kv">${X3F.envelope.items.map(i => `
          <div><span class="k">${esc(i.k)}</span><span class="v"><strong>${esc(i.v)}</strong></span></div>`).join('')}</div>
        <p style="font-size:var(--step--1);color:var(--ink2);margin:var(--sp-3) 0 0;max-width:none">
          这五行决定了后面所有分析。<span class="hl">「不用于商业载客」意味着它不能成为一项运输服务</span>，只能作为一件私人设备出售；「仅限昼间目视飞行」意味着它不能承担通勤这种刚性需求；「20 分钟 / 20 公里」则意味着它的飞行半径小于一次城市内通勤的单程。${ref(X3F.envelope.src)}</p>
      </div>
    </div>`;

  const c = el('cert-box');
  if(c) c.innerHTML = `
    <span class="lbl">适航取证状态</span>
    <div class="kv" style="margin-top:var(--sp-2)">${X3F.cert.map(x => `
      <div><span class="k">${esc(x.k)}</span><span class="v">${esc(x.v)}
        <span class="st ${x.state==='pending'?'st-warn':''}" style="margin-left:var(--sp-2)">${x.state==='pending'?'审定中':'未启动'}</span></span></div>`).join('')}</div>
    <p style="font-size:var(--step--1);color:var(--ink2);margin:var(--sp-3) 0 0;max-width:none">
      取证完成是规模化交付的前提。<strong>截至 2026 年 10 月，TC 与 PC 均未取得。</strong>${ref(['caac-x3f'])}</p>`;

  const f = el('factory-box');
  if(f) f.innerHTML = `
    <span class="lbl">量产工厂进度</span>
    <div class="kv" style="margin-top:var(--sp-2)">${X3F.factory.map(x => `
      <div><span class="k">${esc(x.k)}</span><span class="v">${esc(x.v)}</span></div>`).join('')}</div>`;

  const o = el('overseas');
  if(o) o.innerHTML = `
    <ul class="pts">${X3F.overseas.map(x => `
      <li><em>${esc(x.d)}</em><span>${esc(x.v)}${ref(x.src)}</span></li>`).join('')}</ul>`;

  const cm = el('commercial');
  if(cm) cm.innerHTML = `
    <div class="kv">
      <div><span class="k">预售价</span><span class="v">${esc(X3F.price)}</span></div>
      <div><span class="k">订单</span><span class="v">${esc(X3F.orders)}${ref(['ifeng'])}</span></div>
      <div><span class="k">意向金</span><span class="v">${esc(X3F.deposit)}</span></div>
      <div><span class="k">交付口径</span><span class="v">2027 年年中启动量产交付${ref(['ifeng'])}</span></div>
    </div>
    <p style="font-size:var(--step--1);color:var(--ink2);margin:var(--sp-3) 0 0;max-width:none">
      注意交付口径的三次后退：2025 年 11 月称「2026 年规模化交付」，2026 年 10 月称「2026 年底启动交付」，2026 年 11 月 6 日公司负责人改口「2027 年年中」。</p>`;
}

/* FIG-03 X3-F 双态尺寸图 */
function renderDims(){
  const host = el('fig03'); if(!host) return;
  const W = 1000, H = 330;
  // 展开 6834×6340 / 折叠 2934×1777，按同一比例尺绘制
  const S = 0.038;
  const ow = 6834*S, od = 6340*S, fw = 2934*S, fd = 1777*S;

  host.innerHTML = svg(W, H, `
    <rect width="${W}" height="${H}" fill="var(--paper)"/>
    <g stroke="var(--line)" stroke-width="1">
      ${Array.from({length:11},(_,k)=>`<path d="M0 ${k*30} H${W}"/>`).join('')}
      ${Array.from({length:34},(_,k)=>`<path d="M${k*30} 0 V${H}"/>`).join('')}
    </g>

    <!-- 展开态俯视 -->
    <text x="56" y="38" class="tl">展开态 · 俯视</text>
    <g transform="translate(56,58)">
      <rect x="0" y="0" width="${ow}" height="${od}" fill="none" stroke="var(--line2)" stroke-width="1" stroke-dasharray="4 4"/>
      <rect x="${ow/2-30}" y="${od/2-18}" width="60" height="36" fill="var(--ink)"/>
      <!-- 六旋翼 -->
      ${[[0.17,0.2],[0.5,0.11],[0.83,0.2],[0.17,0.8],[0.5,0.89],[0.83,0.8]].map(([fx,fy])=>`
        <path d="M${ow/2} ${od/2} L${ow*fx} ${od*fy}" stroke="var(--ink2)" stroke-width="3"/>
        <circle cx="${ow*fx}" cy="${od*fy}" r="26" fill="none" stroke="var(--acc)" stroke-width="1.5"/>
        <circle cx="${ow*fx}" cy="${od*fy}" r="4" fill="var(--ink2)"/>`).join('')}
      <!-- 双涵道标记 -->
      ${[[0.5,0.11],[0.5,0.89]].map(([fx,fy])=>`
        <circle cx="${ow*fx}" cy="${od*fy}" r="31" fill="none" stroke="var(--acc)" stroke-width="1" stroke-dasharray="3 3"/>`).join('')}
      <!-- 尺寸标注 -->
      <path class="ax" d="M0 ${od+16} H${ow}"/>
      <path class="ax" d="M0 ${od+11} V${od+21} M${ow} ${od+11} V${od+21}"/>
      <text x="${ow/2}" y="${od+34}" class="tk" text-anchor="middle">6834 mm</text>
      <path class="ax" d="M${ow+16} 0 V${od}"/>
      <path class="ax" d="M${ow+11} 0 H${ow+21} M${ow+11} ${od} H${ow+21}"/>
      <text x="${ow+28}" y="${od/2}" class="tk">6340 mm</text>
    </g>

    <path class="ax" d="M480 50 V290"/>

    <!-- 折叠态 -->
    <text x="540" y="38" class="tl">折叠态 · 俯视 · 同一比例尺</text>
    <g transform="translate(540,58)">
      <rect x="0" y="0" width="${fw}" height="${fd}" fill="var(--paper2)" stroke="var(--ink2)" stroke-width="1.5"/>
      <rect x="${fw/2-26}" y="${fd/2-14}" width="52" height="28" fill="var(--ink)"/>
      ${[0,1,2].map(k=>`
        <path d="M6 ${8+k*((fd-16)/2)} H${fw-6}" stroke="var(--ink2)" stroke-width="2.5"/>`).join('')}
      <path class="ax" d="M0 ${fd+16} H${fw}"/>
      <path class="ax" d="M0 ${fd+11} V${fd+21} M${fw} ${fd+11} V${fd+21}"/>
      <text x="${fw/2}" y="${fd+34}" class="tk" text-anchor="middle">2934 mm</text>
      <path class="ax" d="M${fw+16} 0 V${fd}"/>
      <path class="ax" d="M${fw+11} 0 H${fw+21} M${fw+11} ${fd} H${fw+21}"/>
      <text x="${fw+28}" y="${fd/2}" class="tk">1777 mm</text>
      <text x="0" y="${fd+58}" class="pmeta">桨叶与机臂折叠后可完全收入陆行体尾舱</text>
      <text x="0" y="${fd+74}" class="pmeta">占地面积降至展开态的 <tspan style="fill:var(--acc-deep)">约 12%</tspan></text>
    </g>
    <text x="${W-24}" y="${H-14}" class="tk" text-anchor="end">FIG-03 · 比例 1:26 · 据公开尺寸数据绘制</text>`);
}

/* =====================================================================
   03 约束层
   ===================================================================== */
function renderConstraints(){
  const host = el('constraints'); if(!host) return;
  const wide = i => i === 0 || i === 3;   // 首尾跨栏，中间两格并列
  host.innerHTML = `<div class="grid g2">${CONSTRAINTS.map((c,i) => `
    <div ${wide(i)?'class="span2"':''}>
      <span class="n" style="margin-bottom:var(--sp-2)">${esc(c.n)} / ${esc(c.title)}</span>
      <h4 style="margin:0 0 var(--sp-2)">${esc(c.core)}</h4>
      <p style="font-size:var(--step--1);color:var(--ink2);margin:0 0 var(--sp-3);max-width:${wide(i)?'52em':'none'}">${esc(c.detail)}</p>
      <div class="flag" style="margin:0">
        <span class="lbl">实证</span>
        ${esc(c.evidence)}${ref(c.src)}
      </div>
    </div>`).join('')}</div>`;
}

/* --- FIG-04 重量螺旋计算器 ------------------------------------------- */
const St = { cfg:'multi', ed:255, r:0, occ:2, range:20, preset:'x3f' };

function solve(s){
  const cfg = SPIRAL.configs.find(c => c.key === s.cfg);
  const payload = s.occ * SPIRAL.occMass;
  // a = f_air·(1+r) + f_sys + range·k/ed
  const a = SPIRAL.f_air*(1+s.r) + SPIRAL.f_sys + s.range*cfg.k/s.ed;
  const diverge = a >= 1;
  const mtow = diverge ? Infinity : payload/(1-a);
  return { a, diverge, mtow, payload, cfg,
           overCap: !diverge && mtow > SPIRAL.mtowCap };
}

function renderSpiral(){
  const seg = el('cfg-seg'), sl = el('sliders'), pre = el('presets');
  if(!seg) return;

  seg.innerHTML = SPIRAL.configs.map(c =>
    `<button type="button" data-cfg="${c.key}" aria-pressed="${c.key===St.cfg}">${esc(c.label)}</button>`).join('');
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    St.cfg = b.dataset.cfg; St.preset = null; syncSpiral();
  });

  const R = SPIRAL.ranges;
  sl.innerHTML = Object.entries(R).map(([k,r]) => `
    <div class="slider">
      <div class="slider-hd">
        <span>${esc(r.label)}</span>
        <output id="out-${k}"></output>
      </div>
      <input type="range" id="in-${k}" min="${r.min}" max="${r.max}" step="${r.step}"
             value="${St[k]}" aria-label="${esc(r.label)}">
    </div>`).join('');
  Object.keys(R).forEach(k => el('in-'+k).addEventListener('input', e => {
    St[k] = parseFloat(e.target.value); St.preset = null; syncSpiral();
  }));

  pre.innerHTML = SPIRAL.presets.map(p =>
    `<button type="button" data-p="${p.key}" aria-pressed="${p.key===St.preset}">
       <b>${esc(p.label)}</b>${esc(p.cfg === 'multi' ? '多旋翼' : p.cfg === 'tilt' ? '倾转旋翼' : '复合翼')}
       · ${p.ed} Wh/kg · 冗余 ${p.r} · ${p.range} km</button>`).join('');
  pre.addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    const p = SPIRAL.presets.find(x => x.key === b.dataset.p);
    Object.assign(St, {cfg:p.cfg, ed:p.ed, r:p.r, occ:p.occ, range:p.range, preset:p.key});
    Object.keys(SPIRAL.ranges).forEach(k => el('in-'+k).value = St[k]);
    el('cfg-seg').querySelectorAll('button').forEach(x =>
      x.setAttribute('aria-pressed', x.dataset.cfg === St.cfg));
    syncSpiral();
  });

  syncSpiral();
}

function syncSpiral(){
  const R = SPIRAL.ranges;
  el('out-ed').textContent    = St.ed + ' Wh/kg';
  el('out-r').textContent     = St.r.toFixed(2);
  el('out-occ').textContent   = St.occ + ' 人';
  el('out-range').textContent = St.range + ' km';

  const s = solve(St);
  el('cfg-note').textContent = s.cfg.note;

  const ro = el('readout');
  ro.innerHTML = `
    <div class="readout ${s.diverge?'diverge':''}">
      <span class="lbl">起飞重量解</span>
      <span class="big ${s.diverge?'diverge':''}">${s.diverge ? '发散' : Math.round(s.mtow) + ' kg'}</span>
      <div class="kv" style="margin-top:var(--sp-3)">
        <div><span class="k">载荷</span><span class="v num">${s.payload} kg</span></div>
        <div><span class="k">质量分数和 a</span><span class="v num">${s.a.toFixed(3)}${s.diverge?' ≥ 1':' &lt; 1'}</span></div>
        <div><span class="k">审定上限</span><span class="v num">${SPIRAL.mtowCap} kg</span></div>
      </div>
      <p class="say">${
        s.diverge
        ? '<strong style="color:var(--acc-deep)">方程无正解。</strong>结构、系统与电池三项质量分数之和已达到或超过 1，意味着飞机还没装载荷，自身重量就已经吃掉了全部起飞重量。这个设计在物理上不存在——不是「做起来很难」，是「做不出来」。'
        : s.overCap
          ? '方程闭合，但起飞重量<strong style="color:var(--acc-deep)">超过 ' + SPIRAL.mtowCap + ' kg 审定上限</strong>。需要重新选择审定类别，运行限制会随之变化。'
          : '方程闭合，且在审定上限之内。这是一个物理上存在的设计点。'
      }</p>
      ${St.preset ? '<p class="say" style="border-top:1px solid var(--line2);padding-top:var(--sp-2);margin-top:var(--sp-2)"><strong>预设说明：</strong>' + esc(SPIRAL.presets.find(p=>p.key===St.preset).say) + '</p>' : ''}
    </div>`;

  el('presets').querySelectorAll('button').forEach(b =>
    b.setAttribute('aria-pressed', b.dataset.p === St.preset));

  const mn = el('model-note');
  if(mn) mn.innerHTML = `
    <div class="flag">
      <span class="lbl">模型说明</span>
      采用质量分数法的简化闭合模型：令 <span class="num">a = f<sub>结构</sub>·(1+r) + f<sub>系统</sub> + 航程·k/能量密度</span>，
      则 <span class="num">起飞重量 = 载荷 / (1 − a)</span>。其中结构质量分数取 ${SPIRAL.f_air}、系统质量分数取 ${SPIRAL.f_sys}，
      按 X3-F 公开数据标定；<span class="num">r</span> 为车规碰撞结构冗余系数，<span class="num">k</span> 为构型能耗因子。
      <strong>当 a ≥ 1 时方程无正解，这就是重量螺旋发散。</strong>
      本模型用于演示约束之间的耦合关系与发散条件，不能替代真实的总体设计计算。
    </div>`;
}

/* =====================================================================
   启动
   ===================================================================== */
function boot(){
  renderBili();
  renderQuadrant();
  renderOutlier();
  renderMech();
  renderX3F();
  renderDims();
  renderConstraints();
  renderSpiral();
}
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();

window.__u = { $, el, esc, ref, svg, refIdx };
})();
