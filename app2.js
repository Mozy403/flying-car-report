/* ===========================================================================
   app2.js — 04–09 层渲染
   =========================================================================== */
(function(){
'use strict';
const { el, esc, ref, svg } = window.__u;

/* =====================================================================
   04 解法层
   ===================================================================== */
function renderDecouple(){
  const host = el('decouple'); if(!host) return;
  host.innerHTML = `
    <div class="grid" style="grid-template-columns:auto 1fr 1fr">
      <div style="background:var(--paper2)"><span class="lbl">约束</span></div>
      <div style="background:var(--paper2)"><span class="lbl">分体式的绕法</span></div>
      <div style="background:var(--paper2)"><span class="lbl">代价转移到了哪里</span></div>
      ${DECOUPLE.map(d => `
        <div style="white-space:nowrap">
          <span class="n" style="margin:0">${esc(d.n)}</span>
          <strong style="font-size:var(--step-0)">${esc(d.c)}</strong>
        </div>
        <div style="font-size:var(--step--1);line-height:1.65;color:var(--ink2)">${esc(d.how)}</div>
        <div style="font-size:var(--step--1);line-height:1.65;color:var(--ink)">${esc(d.cost)}</div>`).join('')}
    </div>`;
}

function renderAlloc(){
  const host = el('alloc'); if(!host) return;
  const rows = [
    ['长距离位移', '陆行体', '续航 1000 km+'],
    ['补能', '陆行体', '支持 5–6 次飞行'],
    ['运载与收纳', '陆行体', '尾舱，折叠后占地 12%'],
    ['合法路权', '陆行体', 'C 照即可'],
    ['跨越障碍', '飞行体', '20 min / 20 km'],
    ['驾驶资质', '两者分离', '另需航空器资质'],
    ['商业载客', '不具备', '审定基础明确禁止'],
  ];
  host.innerHTML = `<div class="kv">${rows.map(([k,who,v]) => `
    <div>
      <span class="k">${esc(k)}</span>
      <span class="v">
        <span class="st ${who==='不具备'?'st-warn':''}" style="margin-right:var(--sp-2)">${esc(who)}</span>
        <span style="color:var(--ink2)">${esc(v)}</span>
      </span>
    </div>`).join('')}</div>`;
}

/* FIG-05 约束 → 绕法 → 代价 转移路径 */
function renderTransfer(){
  const host = el('fig05'); if(!host) return;
  const W = 1000, H = 400, rowH = 76, top = 74;
  const cx = [150, 500, 850];

  const cols = ['约束','绕法','代价'].map((t,i) =>
    `<text x="${cx[i]}" y="44" class="tl" text-anchor="middle">${t}</text>
     <path class="ax" d="M${cx[i]-130} 54 H${cx[i]+130}"/>`).join('');

  const rows = DECOUPLE.map((d,i) => {
    const y = top + i*rowH;
    return `
      <g>
        <rect x="${cx[0]-130}" y="${y}" width="260" height="46" fill="var(--paper2)" stroke="var(--line2)"/>
        <text x="${cx[0]}" y="${y+21}" class="tl" text-anchor="middle">${esc(d.n)} · ${esc(d.c)}</text>
        <text x="${cx[0]}" y="${y+36}" class="pmeta" text-anchor="middle">一体式无法同时满足</text>

        <path d="M${cx[0]+132} ${y+23} H${cx[1]-134}" stroke="var(--ink3)" stroke-width="1"/>
        <path d="M${cx[1]-134} ${y+23} l-7 -3.5 l0 7 Z" fill="var(--ink3)"/>

        <rect x="${cx[1]-130}" y="${y}" width="260" height="46" fill="var(--paper)" stroke="var(--line2)"/>
        <text x="${cx[1]}" y="${y+21}" class="tl" text-anchor="middle">解耦到两个物体</text>
        <text x="${cx[1]}" y="${y+36}" class="pmeta" text-anchor="middle">各自只服务一个工况</text>

        <path d="M${cx[1]+132} ${y+23} H${cx[2]-134}" stroke="var(--acc)" stroke-width="1"/>
        <path d="M${cx[2]-134} ${y+23} l-7 -3.5 l0 7 Z" fill="var(--acc)"/>

        <rect x="${cx[2]-130}" y="${y}" width="260" height="46" fill="var(--paper)" stroke="var(--acc)"/>
        <text x="${cx[2]}" y="${y+21}" class="tl" text-anchor="middle" style="fill:var(--acc-deep)">${esc(['成本与重量冗余','航程压至 20 km','换乘体验断裂','不得商业载客'][i])}</text>
        <text x="${cx[2]}" y="${y+36}" class="pmeta" text-anchor="middle">约束未消除</text>
      </g>`;
  }).join('');

  host.innerHTML = svg(W, H, `
    <rect width="${W}" height="${H}" fill="var(--paper)"/>
    <g stroke="var(--line)" stroke-width="1">
      ${Array.from({length:14},(_,k)=>`<path d="M0 ${k*30} H${W}"/>`).join('')}
    </g>
    ${cols}${rows}
    <text x="${W/2}" y="${H-18}" class="tk" text-anchor="middle">功能解耦不消除约束，只改变约束作用的位置</text>`);
}

/* =====================================================================
   05 证据层
   ===================================================================== */
/* FIG-06 跳票时间线 */
function renderSlips(){
  const fig = el('fig06');
  if(fig){
    const W = 1000, H = 320, L = 180, R = 60, top = 72, rowH = 56;
    const y0 = 2017, y1 = 2029;
    const px = y => L + (y - y0)/(y1 - y0) * (W - L - R);

    const axis = `
      <path class="ax" d="M${L} ${top-24} H${W-R}"/>
      ${Array.from({length:13},(_,k)=>{
        const y = y0+k;
        return `<path class="axf" d="M${px(y)} ${top-24} V${top+4*rowH-10}"/>
                <text x="${px(y)}" y="${top-32}" class="tk" text-anchor="middle">${y}</text>`;
      }).join('')}`;

    const rows = SLIPS.map((s,i) => {
      const y = top + i*rowH;
      // 从每行取出可解析为年份的承诺点
      const nodes = s.rows.map(r => {
        const m = String(r.t).match(/^(\d{4})/);
        return m ? {yr:+m[1], v:r.v, now:r.now} : null;
      }).filter(Boolean);
      // 当前口径年份（可能在 t 或 v 里）
      const last = s.rows[s.rows.length-1];
      const lm = String(last.t).match(/^(\d{4})/);
      const endYr = lm ? +lm[1] : null;

      const line = nodes.length > 1
        ? `<path d="M${px(nodes[0].yr)} ${y} H${px(nodes[nodes.length-1].yr)}" stroke="var(--line2)" stroke-width="1" stroke-dasharray="3 3"/>`
        : '';
      const dots = nodes.map((n,k) => `
        <circle cx="${px(n.yr)}" cy="${y}" r="${n.now?5:3.5}"
                fill="${n.now?'var(--acc)':'var(--ink3)'}" stroke="var(--paper)" stroke-width="1.5"/>`).join('');

      return `
        <g>
          <text x="${L-16}" y="${y+4}" class="tl" text-anchor="end">${esc(s.name)}</text>
          <text x="${L-16}" y="${y+17}" class="pmeta" text-anchor="end">${esc(s.origin)}</text>
          ${line}${dots}
          ${endYr ? `<text x="${px(endYr)+12}" y="${y+4}" class="pmeta" style="fill:var(--acc-deep)">当前口径</text>` : ''}
        </g>`;
    }).join('');

    fig.innerHTML = svg(W, H, `
      <rect width="${W}" height="${H}" fill="var(--paper)"/>
      ${axis}${rows}
      <text x="${L}" y="${H-24}" class="tk">实心朱点 ＝ 当前最新口径　空心灰点 ＝ 已失效的历史承诺</text>
      <text x="${W-R}" y="${H-24}" class="tk" text-anchor="end">数据截止 2026-11-22</text>`);
  }

  const host = el('slips'); if(!host) return;
  host.innerHTML = `<div class="grid g2">${SLIPS.map((s,i) => `
    <div ${i===3?'class="span2"':''}>
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:var(--sp-2)">
        <strong style="font-size:var(--step-0)">${esc(s.name)}</strong>
        <span class="lbl">${esc(s.origin)}</span>
      </div>
      <ul class="pts" style="margin:var(--sp-2) 0 0;max-width:none">${s.rows.map(r => `
        <li><em>${esc(r.t)}</em><span${r.now?' style="color:var(--acc-deep);font-weight:600"':''}>${esc(r.v)}</span></li>`).join('')}</ul>
      <p style="font-size:11px;font-family:var(--mono);color:var(--ink3);margin:var(--sp-2) 0 0;max-width:none">来源${ref(s.src)}</p>
    </div>`).join('')}</div>`;
}

function renderOrders(){
  const host = el('orders'); if(!host) return;
  host.innerHTML = `
    <table>
      <thead><tr>
        <th>产品</th><th>宣称订单</th><th>定金门槛</th><th>信号强度判读</th>
      </tr></thead>
      <tbody>${ORDER_QUALITY.map(o => `
        <tr>
          <td><strong>${esc(o.name)}</strong></td>
          <td class="num">${esc(o.claim)}</td>
          <td>${esc(o.deposit)}</td>
          <td style="color:var(--ink2)">${esc(o.read)}</td>
        </tr>`).join('')}</tbody>
    </table>`;
}

function renderCertCompare(){
  const host = el('cert-compare'); if(!host) return;
  const rows = [
    ['亿航 EH216-S', '纯 eVTOL', 'TC·AC·PC·OC 四证齐备', 'ok'],
    ['小鹏汇天 X3-F', '分体式', 'TC / PC 审定中', 'warn'],
    ['Alef Model A', '一体式', '实验类特殊适航证', 'warn'],
    ['Klein AirCar', '一体式', '实验类适航证（斯洛伐克）', 'warn'],
    ['Tesla Roadster', '不在定义域', '不适用', 'warn'],
  ];
  host.innerHTML = `<div class="kv">${rows.map(([n,k,v,st]) => `
    <div>
      <span class="k">${esc(n)}<br><span class="lbl">${esc(k)}</span></span>
      <span class="v"><span class="st ${st==='ok'?'st-ok':'st-warn'}">${esc(v)}</span></span>
    </div>`).join('')}</div>`;
}

/* PL-02 四款产品真实照片序列（整页唯一 .reveal，整组一起还原） */
function renderPlate(){
  const host = el('plate02'); if(!host) return;
  const seq = [
    { k:'aerocar',    st:'1949 · 仅造 6 架',  note:'有路权 · 曾取得 TC' },
    { k:'palv',       st:'待取证',            note:'有路权 · 一体式旋翼机' },
    { k:'volocopter', st:'取证中',            note:'无路权 · 纯 eVTOL' },
    { k:'ehangSide',  st:'四证齐备 · 已载客',  note:'无路权 · 纯 eVTOL' },
  ];
  host.innerHTML = `
    <div class="reveal">
      <div class="media3" style="grid-template-columns:repeat(4,1fr)">
        ${seq.map((s,i) => {
          const p = PHOTOS[s.k];
          return `<figure>
            <span class="tag">PL 02·${i+1}</span>
            <span class="verdict">${esc(s.st)}</span>
            <img src="${CM + encodeURIComponent(p.file)}?width=640" alt="${esc(p.name)}"
                 loading="lazy" width="640" height="427" referrerpolicy="no-referrer"
                 style="aspect-ratio:3/2;object-fit:cover">
            <figcaption>
              <span><b>${esc(p.name)}</b></span>
              <span>${esc(s.note)}</span>
            </figcaption>
          </figure>`;
        }).join('')}
      </div>
    </div>
    <p style="font:11px/1.6 var(--mono);color:var(--ink3);margin:var(--sp-2) 0 0">
      按适航进度排列 · 悬停还原色彩（整页唯一交互图组）· 图片来源与许可见页脚
    </p>`;
}


/* =====================================================================
   06 场景层
   ===================================================================== */
/* FIG-07 航程对照（对数刻度） */
function renderRanges(){
  const host = el('fig07'); if(!host) return;
  const W = 1000, H = 300, L = 230, R = 70, top = 58, rowH = 40;
  const lo = 10, hi = 1200;
  const px = v => L + (Math.log10(v)-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*(W-L-R);

  const ticks = [10,20,50,100,200,500,1000].map(v => `
    <path class="axf" d="M${px(v)} ${top-18} V${top+RANGE_BARS.length*rowH-14}"/>
    <text x="${px(v)}" y="${top-26}" class="tk" text-anchor="middle">${v}</text>`).join('');

  const kindFill = { fact:'var(--acc)', claim:'var(--ink3)', bar:'var(--ink)', need:'var(--ink2)', ground:'var(--line2)' };

  const bars = RANGE_BARS.map((b,i) => {
    const y = top + i*rowH;
    const w = px(b.v) - L;
    const isBar = b.kind === 'bar';
    return `
      <g>
        <text x="${L-16}" y="${y+5}" class="tl" text-anchor="end">${esc(b.label)}</text>
        <text x="${L-16}" y="${y+18}" class="pmeta" text-anchor="end">${esc(b.note)}</text>
        ${isBar
          ? `<path d="M${px(b.v)} ${top-18} V${top+RANGE_BARS.length*rowH-14}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="6 3"/>
             <rect x="${L}" y="${y-2}" width="${w}" height="12" fill="none" stroke="var(--ink)" stroke-width="1" stroke-dasharray="3 2"/>`
          : `<rect x="${L}" y="${y-2}" width="${w}" height="12" fill="${kindFill[b.kind]}"/>`}
        <text x="${px(b.v)+10}" y="${y+8}" class="pmeta num" style="fill:var(--ink2)">${b.v} km</text>
      </g>`;
  }).join('');

  host.innerHTML = svg(W, H, `
    <rect width="${W}" height="${H}" fill="var(--paper)"/>
    ${ticks}
    <path class="ax" d="M${L} ${top-18} V${top+RANGE_BARS.length*rowH-14}"/>
    ${bars}
    <text x="${L}" y="${H-22}" class="tk">对数刻度 · 单位公里</text>
    <text x="${W-R}" y="${H-22}" class="tk" text-anchor="end">虚线 ＝ 实用化门槛（载荷 ≥100 kg / 航程 ≥100 km）</text>`);
}

/* FIG-08 场景 × 形态矩阵 */
function renderScenarios(){
  const host = el('fig08'); if(!host) return;
  const W = 1000, H = 330, L = 210, top = 86, cw = 182, rowH = 38;

  const heads = SCEN_COLS.map((c,i) => `
    <text x="${L+i*cw+cw/2}" y="${top-34}" class="tl" text-anchor="middle">${esc(c.label)}</text>`).join('');

  const cells = SCENARIOS.map((s,r) => {
    const y = top + r*rowH;
    const row = SCEN_COLS.map((c,i) => {
      const v = s[c.key];
      const x = L + i*cw;
      // 五级标尺：用等宽方块数量表示，不用色阶
      const blocks = Array.from({length:5},(_,k) => `
        <rect x="${x+cw/2-42+k*17}" y="${y-6}" width="13" height="13"
              fill="${k<v ? (v>=4?'var(--acc)':'var(--ink2)') : 'var(--paper)'}"
              stroke="${k<v?'none':'var(--line2)'}" stroke-width="1"/>`).join('');
      return blocks;
    }).join('');
    return `
      <g class="scen" data-i="${r}" style="cursor:pointer">
        <rect x="0" y="${y-14}" width="${W}" height="${rowH-6}" fill="transparent"/>
        <text x="${L-18}" y="${y+5}" class="tl" text-anchor="end">${esc(s.name)}</text>
        ${row}
      </g>`;
  }).join('');

  host.innerHTML = svg(W, H, `
    <rect width="${W}" height="${H}" fill="var(--paper)"/>
    ${SCEN_COLS.map((c,i)=>i%2?`<rect x="${L+i*cw}" y="${top-52}" width="${cw}" height="${SCENARIOS.length*rowH+34}" fill="var(--paper2)"/>`:'').join('')}
    ${heads}
    <path class="ax" d="M${L-6} ${top-24} H${L+SCEN_COLS.length*cw}"/>
    ${cells}
    <path class="ax" d="M${L-6} ${top+SCENARIOS.length*rowH-16} H${L+SCEN_COLS.length*cw}"/>
    <text x="${L-18}" y="${H-24}" class="tk" text-anchor="end">适配度</text>
    <text x="${L}" y="${H-24}" class="tk">■■■■■ 五级标尺　朱色 ＝ 4 级及以上　点击行查看判定理由</text>`);

  host.querySelectorAll('.scen').forEach(g =>
    g.addEventListener('click', () => showScen(+g.dataset.i)));
  showScen(5);
}

function showScen(i){
  const s = SCENARIOS[i]; if(!s) return;
  const host = el('scen-detail'); if(!host) return;
  const best = SCEN_COLS.reduce((a,c) => s[c.key] > s[a.key] ? c : a, SCEN_COLS[0]);
  host.innerHTML = `
    <div class="ctrl" style="margin-top:var(--sp-3)">
      <div class="ctrl-hd">
        <span><strong style="font-size:var(--step-0)">${esc(s.name)}</strong></span>
        <span class="st st-ok">最适配：${esc(best.label)}</span>
      </div>
      <div class="ctrl-bd">
        <p style="font-size:var(--step--1);margin:0;max-width:none">${esc(s.why)}</p>
      </div>
    </div>`;
}

/* =====================================================================
   07 身份层
   ===================================================================== */
function renderTerms(){
  const host = el('terms'); if(!host) return;
  host.innerHTML = `<div class="grid g3">${TERMS.map((t,i) => `
    <div${i===2?' style="background:var(--paper2)"':''}>
      <span class="lbl">${esc(t.term)}</span>
      <h4 style="margin:var(--sp-2) 0">${esc(t.zh)}</h4>
      <p style="font-size:var(--step--1);color:var(--ink2);margin:0 0 var(--sp-3);max-width:none">${esc(t.def)}</p>
      <p style="font-size:var(--step--1);margin:0 0 var(--sp-2);max-width:none;color:${i===2?'var(--acc-deep)':'var(--ink)'}"><strong>${esc(t.judge)}</strong></p>
      <p style="font:11px/1.6 var(--mono);color:var(--ink3);margin:0;max-width:none">${esc(t.eg)}</p>
    </div>`).join('')}</div>`;
}

/* FIG-09 词义漂移时间线 */
function renderDrift(){
  const host = el('fig09'); if(!host) return;
  const W = 1000, H = 250, L = 70, R = 70, y = 128;
  const n = DRIFT.length;
  const px = i => L + i/(n-1)*(W-L-R);

  const nodes = DRIFT.map((d,i) => {
    const up = i % 2 === 0;
    const ty = up ? y-26 : y+34;
    return `
      <g class="drift" data-i="${i}" style="cursor:pointer">
        <rect x="${px(i)-46}" y="${up?y-74:y+6}" width="92" height="72" fill="transparent"/>
        <path d="M${px(i)} ${y} V${up?y-18:y+18}" stroke="var(--line2)" stroke-width="1"/>
        <circle cx="${px(i)}" cy="${y}" r="${d.quote?6:4.5}"
                fill="${d.quote?'var(--acc)':'var(--ink)'}" stroke="var(--paper)" stroke-width="2"/>
        <text x="${px(i)}" y="${ty}" class="tl" text-anchor="middle">${esc(d.y)}</text>
        <text x="${px(i)}" y="${ty + (up?-14:14)}" class="pmeta" text-anchor="middle">${d.quote?'有原话':''}</text>
      </g>`;
  }).join('');

  host.innerHTML = svg(W, H, `
    <rect width="${W}" height="${H}" fill="var(--paper)"/>
    <path class="ax" d="M${L-30} ${y} H${W-R+30}"/>
    ${nodes}
    <text x="${L-30}" y="${H-18}" class="tk">朱点 ＝ 有可引用的原话　点击节点展开</text>
    <text x="${W-R+30}" y="${H-18}" class="tk" text-anchor="end">FIG-09</text>`);

  host.querySelectorAll('.drift').forEach(g =>
    g.addEventListener('click', () => showDrift(+g.dataset.i)));
  showDrift(4);
}

function showDrift(i){
  const d = DRIFT[i]; if(!d) return;
  const host = el('drift-detail'); if(!host) return;
  host.innerHTML = `
    <div class="ctrl" style="margin-top:var(--sp-3)">
      <div class="ctrl-hd"><span class="lbl">${esc(d.y)}</span></div>
      <div class="ctrl-bd">
        <p style="font-size:var(--step--1);margin:0;max-width:none">${esc(d.v)}${ref(d.src)}</p>
        ${d.quote ? `<blockquote style="margin:var(--sp-3) 0 0;font-size:var(--step-1)">${esc(d.quote)}</blockquote>` : ''}
      </div>
    </div>`;
}

function renderZYJ(){
  const host = el('zyj'); if(!host) return;
  const z = ZYJ;
  host.innerHTML = `
    <div class="ctrl">
      <div class="ctrl-hd">
        <span class="lbl">定义体系</span>
        <span class="lbl">${esc(z.who)}</span>
      </div>
      <div class="ctrl-bd">
        <p style="font-size:11px;font-family:var(--mono);color:var(--ink3);margin:0 0 var(--sp-4);max-width:none">${esc(z.basis)}${ref(z.src)}</p>
        <div class="grid g2" style="margin-bottom:var(--sp-4)">
          ${[z.narrow, z.broad].map((d,i) => `
            <div${i===1?' style="background:var(--paper2)"':''}>
              <span class="lbl">${esc(d.label)}</span>
              <h4 style="margin:var(--sp-2) 0;font-size:var(--step-1)">＝ ${esc(d.eq)}</h4>
              <p style="font-size:var(--step--1);color:var(--ink2);margin:0;max-width:none">${esc(d.def)}</p>
            </div>`).join('')}
        </div>

        <p style="font:400 var(--step-2)/1.45 var(--serif);margin:0 0 var(--sp-3);max-width:32em">
          <span class="hl">${esc(z.key)}</span>
        </p>
        <p style="font-size:var(--step--1);margin:0 0 var(--sp-4);max-width:var(--measure)">${esc(z.aerocar)}</p>

        <div class="flag" style="margin:0 0 var(--sp-4)">
          <span class="lbl">实用化门槛</span>${esc(z.threshold)}
        </div>

        <span class="lbl" style="display:block;margin-bottom:var(--sp-2)">阶段划分</span>
        <div class="kv">${z.stages.map(s => `
          <div>
            <span class="k">${esc(s.s)}　${esc(s.t)}</span>
            <span class="v"${s.hi?' style="color:var(--acc-deep);font-weight:600"':''}>${esc(s.v)}</span>
          </div>`).join('')}</div>
        <p style="font-size:var(--step--1);color:var(--ink);margin:var(--sp-3) 0 var(--sp-4);max-width:var(--measure)"><strong>${esc(z.stageNote)}</strong></p>

        <span class="lbl" style="display:block;margin-bottom:var(--sp-2)">三条技术发展路径</span>
        <div class="kv">${z.paths.map(p => `
          <div>
            <span class="k">${esc(p.v)}</span>
            <span class="v">${esc(p.eg)}${p.note?`<br><span style="color:var(--acc-deep);font-size:11px;font-family:var(--mono)">${esc(p.note)}</span>`:''}</span>
          </div>`).join('')}</div>
      </div>
    </div>`;
}

function renderAxes(){
  const host = el('axes'); if(!host) return;
  host.innerHTML = `
    <div class="grid g2">
      <div>
        <span class="n" style="margin-bottom:var(--sp-2)">轴 A</span>
        <h4 style="margin:0 0 var(--sp-2)">路权</h4>
        <p style="font-size:var(--step--1);color:var(--ink2);margin:0 0 var(--sp-3);max-width:none">物理上能否在地面公路合法行驶。</p>
        <span class="st st-warn">行业放弃了这一轴</span>
        <p style="font-size:var(--step--1);margin:var(--sp-3) 0 0;max-width:none">因为它意味着车规加适航的双重合规，而这两套法规的交集近乎为空。FAA 自 2009 年起探索一体式商业许可，至今只批准过飞行功能。</p>
      </div>
      <div style="background:var(--paper2)">
        <span class="n" style="margin-bottom:var(--sp-2)">轴 B</span>
        <h4 style="margin:0 0 var(--sp-2)">汽车属性</h4>
        <p style="font-size:var(--step--1);color:var(--ink2);margin:0 0 var(--sp-3);max-width:none">是否私人拥有、普通人可操作、量产消费品、由汽车供应链造出来。</p>
        <span class="st st-ok">行业保留并强化了这一轴</span>
        <p style="font-size:var(--step--1);margin:var(--sp-3) 0 0;max-width:none">因为这是万亿级市场想象的来源，也是「大众化」这个定义落脚点的全部内容。</p>
      </div>
    </div>`;
}

function renderCarness(){
  const host = el('carness'); if(!host) return;
  host.innerHTML = CARNESS.map(c => `
    <div style="padding:var(--sp-2) 0;border-bottom:1px solid var(--line)">
      <span class="n" style="margin-bottom:var(--sp-1)">${esc(c.n)} / ${esc(c.k)}</span>
      <p style="font-size:var(--step--1);margin:0 0 var(--sp-2);max-width:none">${esc(c.v)}</p>
      <p style="font:11px/1.6 var(--mono);color:var(--acc-deep);margin:0;max-width:none">${esc(c.pin)}</p>
    </div>`).join('') + `
    <p style="font-size:var(--step--1);color:var(--ink);margin:var(--sp-3) 0 0;max-width:none">
      <strong>三重含义里，没有一重是物理形态。</strong></p>`;
}

/* FIG-10 复用率条形 */
function renderReuse(){
  const fig = el('fig10');
  if(fig){
    const W = 1000, H = 290, L = 250, R = 110, top = 56, rowH = 52;
    const px = v => L + v/100*(W-L-R);
    const ticks = [0,25,50,75,100].map(v => `
      <path class="axf" d="M${px(v)} ${top-16} V${top+REUSE.length*rowH-20}"/>
      <text x="${px(v)}" y="${top-24}" class="tk" text-anchor="middle">${v}%</text>`).join('');

    const bars = REUSE.map((r,i) => {
      const y = top + i*rowH;
      return `
        <g>
          <text x="${L-16}" y="${y+4}" class="tl" text-anchor="end">${esc(r.label)}</text>
          <text x="${L-16}" y="${y+18}" class="pmeta" text-anchor="end">${esc(r.who)}</text>
          <rect x="${L}" y="${y-6}" width="${px(r.v)-L}" height="17"
                fill="${r.hi?'var(--acc)':'var(--ink2)'}"/>
          <rect x="${L}" y="${y-6}" width="${W-R-L}" height="17" fill="none" stroke="var(--line2)" stroke-width="1"/>
          <text x="${px(r.v)+10}" y="${y+7}" class="tl num" style="fill:${r.hi?'var(--acc-deep)':'var(--ink)'}">${esc(r.range)}</text>
        </g>`;
    }).join('');

    // 缺口标注
    const gy = top + 3*rowH;
    fig.innerHTML = svg(W, H, `
      <rect width="${W}" height="${H}" fill="var(--paper)"/>
      ${ticks}
      <path class="ax" d="M${L} ${top-16} V${top+REUSE.length*rowH-20}"/>
      ${bars}
      <path d="M${px(35)} ${gy+14} V${gy+28} H${px(75)} V${top+14}"
            stroke="var(--acc)" stroke-width="1" fill="none" stroke-dasharray="3 3"/>
      <text x="${px(55)}" y="${gy+42}" class="pmeta" text-anchor="middle" style="fill:var(--acc-deep)">缺口 ≈ 40 个百分点：适航的额外要求</text>
      <text x="${L}" y="${H-16}" class="tk">朱色条 ＝ 三电成本占比，这是复用价值的来源</text>`);
  }

  const d = el('reuse-detail');
  if(d) d.innerHTML = `
    <table style="margin-top:var(--sp-3)">
      <thead><tr><th>口径</th><th class="r">数值</th><th>含义</th><th>来源</th></tr></thead>
      <tbody>${REUSE.map(r => `
        <tr>
          <td><strong>${esc(r.label)}</strong></td>
          <td class="num r"${r.hi?' style="color:var(--acc-deep)"':''}>${esc(r.range)}</td>
          <td style="color:var(--ink2)">${esc(r.note)}</td>
          <td style="color:var(--ink3)">${esc(r.who)}${ref(r.src)}</td>
        </tr>`).join('')}</tbody>
    </table>
    <p style="margin-top:var(--sp-3)">三电占成本一半以上，而这正是中国新能源汽车供应链最成熟、规模效应最强的环节。所以「复用汽车供应链」不是边角优化，<span class="hl">它直接作用在整机成本的大头上</span>。</p>`;

  const g = el('reuse-gap');
  if(g) g.innerHTML = `
    <p style="font-size:var(--step--1);margin:0 0 var(--sp-3);max-width:none"><strong>${esc(REUSE_GAP.headline)}</strong></p>
    <span class="lbl" style="display:block;margin-bottom:var(--sp-2)">${esc(REUSE_GAP.who)}</span>
    <ul class="pts" style="margin:0;max-width:none">${REUSE_GAP.barriers.map((b,i) => `
      <li><em>${String(i+1).padStart(2,'0')}</em><span>${esc(b)}</span></li>`).join('')}</ul>
    <p style="font-size:var(--step--1);color:var(--ink2);margin:var(--sp-3) 0 0;max-width:none">${esc(REUSE_GAP.limit)}${ref(REUSE_GAP.src)}</p>`;
}

function renderOEMs(){
  const host = el('oems'); if(!host) return;
  host.innerHTML = `
    <table>
      <thead><tr><th>车企</th><th>主体</th><th>做法</th></tr></thead>
      <tbody>${OEMS.map(o => `
        <tr>
          <td><strong>${esc(o.oem)}</strong></td>
          <td style="font-family:var(--mono);font-size:11px">${esc(o.sub)}</td>
          <td style="color:var(--ink2)">${esc(o.how)}
            ${o.flag?`<br><span class="st st-warn" style="margin-top:4px">${esc(o.flag)}</span>`:''}</td>
        </tr>`).join('')}</tbody>
    </table>`;
}

function renderParadigm(){
  const host = el('paradigm'); if(!host) return;
  host.innerHTML = `<div class="grid g2">${PARADIGM.map((p,i) => `
    <div${i===1?' style="background:var(--paper2)"':''}>
      <span class="lbl">${esc(p.label)}</span>
      <p style="font:11px/1.6 var(--mono);color:var(--ink3);margin:var(--sp-2) 0;max-width:none">${esc(p.who)}</p>
      <p style="font-size:var(--step--1);margin:0 0 var(--sp-3);max-width:none">${esc(p.v)}</p>
      <h4 style="margin:0 0 var(--sp-3);font-size:var(--step-1);color:${i===1?'var(--acc-deep)':'var(--ink)'}">${esc(p.verdict)}</h4>
      <p style="font-size:var(--step--1);color:var(--ink2);margin:0;max-width:none">${esc(p.pin)}</p>
    </div>`).join('')}</div>`;
}

function renderPart103(){
  const host = el('part103'); if(!host) return;
  const p = PART103;
  host.innerHTML = `
    <div class="ctrl">
      <div class="ctrl-hd">
        <span class="lbl">制度样本</span>
        <span class="lbl">支撑「无路权 + 有汽车属性」象限</span>
      </div>
      <div class="ctrl-bd">
        <h4 style="margin:0 0 var(--sp-3)">${esc(p.headline)}</h4>
        <ul class="pts" style="max-width:var(--measure)">${p.items.map((x,i) => `
          <li><em>${String(i+1).padStart(2,'0')}</em><span>${esc(x)}</span></li>`).join('')}</ul>
        <p style="font-size:var(--step--1);margin:var(--sp-3) 0 0"><strong>豁免范围：</strong>${esc(p.relief)}</p>
        <p style="font-size:var(--step--1);margin:var(--sp-2) 0 0;color:var(--ink2)"><strong>仍然适用：</strong>${esc(p.stillApply)}</p>
        <div class="flag" style="margin-top:var(--sp-3)">
          <span class="lbl">电池如何计重</span>${esc(p.battery)}${ref(p.src)}
        </div>

        <div class="grid g2" style="margin-top:var(--sp-4)">${p.cases.map(c => `
          <div>
            <strong style="font-size:var(--step-0);display:block;margin-bottom:var(--sp-2)">${esc(c.name)}</strong>
            <div class="kv">${c.rows.map(r => `
              <div><span class="k">${esc(r.k)}</span><span class="v">${esc(r.v)}</span></div>`).join('')}</div>
            <p style="font-size:var(--step--1);color:${c.flag?'var(--acc-deep)':'var(--ink2)'};margin:var(--sp-3) 0 0;max-width:none">
              ${c.flag?'<span class="lbl" style="display:block;margin-bottom:var(--sp-1);color:var(--acc-deep)">存疑</span>':''}${esc(c.note)}${ref(c.src)}</p>
          </div>`).join('')}</div>
      </div>
    </div>`;
}

/* 身份判别器 */
const QS = {};
function renderQuiz(){
  const intro = el('quiz-intro');
  if(intro) intro.textContent = CLASSIFIER.intro;
  const host = el('quiz'); if(!host) return;

  host.innerHTML = CLASSIFIER.qs.map((q,i) => `
    <div class="quiz-q">
      <span class="n">${String(i+1).padStart(2,'0')}</span>
      <p>${esc(q.q)}</p>
      <div class="opts" data-q="${q.id}">${q.opts.map(o => `
        <button type="button" data-v="${o.v}" aria-pressed="false">${esc(o.l)}</button>`).join('')}</div>
    </div>`).join('');

  host.addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    const wrap = b.parentNode, qid = wrap.dataset.q;
    QS[qid] = b.dataset.v;
    wrap.querySelectorAll('button').forEach(x =>
      x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    classify();
  });
  classify();
}

function classify(){
  const host = el('quiz-out'); if(!host) return;
  const answered = Object.keys(QS).length;
  if(answered < 3){
    host.innerHTML = `
      <div class="readout">
        <span class="lbl">判定结果</span>
        <span class="big" style="font-size:var(--step-2)">待输入</span>
        <p class="say">已回答 ${answered} / 5 题。至少回答前三题（路权、拥有方、驾驶资质）即可得出判定——<strong>注意「起降场所」和「产能」这两题不参与判定</strong>，它们只是用来说明：即便这两项差异巨大，也不改变法律身份。</p>
      </div>`;
    return;
  }

  // 判定只用三项：路权、拥有方、驾驶资质
  let key;
  if(QS.road === 'y'){
    key = (QS.own === 'p' && (QS.lic === 'none' || QS.lic === 'sport'))
      ? 'roadable_car' : 'roadable_plane';
  } else {
    key = (QS.own === 'o' || QS.lic === 'comm') ? 'civil_ac' : 'personal_av';
  }
  const v = CLASSIFIER.verdicts[key];

  host.innerHTML = `
    <div class="readout" style="border-top-color:var(--acc)">
      <span class="lbl">判定结果</span>
      <span class="big" style="font-size:var(--step-2);font-family:var(--serif);letter-spacing:0">${esc(v.title)}</span>
      <p style="font:11px/1.5 var(--mono);color:var(--ink3);margin:var(--sp-1) 0 var(--sp-3)">${esc(v.en)}</p>
      <p class="say" style="margin:0">${esc(v.v)}</p>
      <p class="say" style="border-top:1px solid var(--line2);padding-top:var(--sp-2);margin-top:var(--sp-2)">
        <strong>现实对应：</strong>${esc(v.real)}</p>
      <p class="say" style="border-top:1px solid var(--line2);padding-top:var(--sp-2);margin-top:var(--sp-2);color:var(--acc-deep)">
        注意：改变「起降场所」或「年产能」这两个答案，判定结果不会变。<strong>物理形态与制造规模不参与法律身份的判定。</strong></p>
    </div>`;
}

/* =====================================================================
   08 判断层
   ===================================================================== */
function renderWindows(){
  const host = el('windows'); if(!host) return;
  host.innerHTML = `<div class="grid g3">${WINDOWS.map((w,i) => `
    <div${i===0?' style="background:var(--paper2)"':''}>
      <span class="n" style="margin-bottom:var(--sp-2)">${esc(w.t)}　${esc(w.y)}</span>
      <h4 style="margin:0 0 var(--sp-3)">${esc(w.head)}</h4>
      <p style="font-size:var(--step--1);color:var(--ink2);margin:0 0 var(--sp-3);max-width:none">${esc(w.v)}</p>
      <p style="font:11px/1.6 var(--mono);color:var(--acc-deep);margin:0;max-width:none">${esc(w.watch)}</p>
    </div>`).join('')}</div>`;
}

function renderFalsify(){
  const host = el('falsify'); if(!host) return;
  host.innerHTML = `<div class="kv">${FALSIFY.map((f,i) => `
    <div>
      <span class="k"><span class="num" style="color:var(--acc-deep);font-weight:600">${String(i+1).padStart(2,'0')}</span></span>
      <span class="v">
        <strong style="display:block;margin-bottom:var(--sp-1)">${esc(f.v)}</strong>
        <span style="color:var(--ink2)">${esc(f.why)}</span>
      </span>
    </div>`).join('')}</div>`;
}

/* =====================================================================
   09 局限与反方
   ===================================================================== */
function renderCounter(){
  const host = el('counter'); if(!host) return;
  host.innerHTML = `<div class="grid g2">${COUNTER.map((c,i) => `
    <div${i===3?' class="span2"':''}>
      <span class="n" style="margin-bottom:var(--sp-2)">${String(i+1).padStart(2,'0')}</span>
      <h4 style="margin:0 0 var(--sp-2)">${esc(c.k)}</h4>
      <p style="font-size:var(--step--1);color:var(--ink2);margin:0;max-width:none">${esc(c.v)}</p>
    </div>`).join('')}</div>`;

  const l = el('limits');
  if(l) l.innerHTML = `<ul class="pts" style="margin:0;max-width:none">${LIMITS.map((x,i) => `
    <li><em>${String(i+1).padStart(2,'0')}</em><span>${esc(x)}</span></li>`).join('')}</ul>`;
}

/* =====================================================================
   页脚来源表
   ===================================================================== */
function renderSources(){
  const host = el('srcs'); if(!host) return;
  host.innerHTML = SOURCES.map((s,i) => `
    <li><b>${String(i+1).padStart(2,'0')}</b>${esc(s.label)}　<span style="color:var(--ink3)">${esc(s.date)}</span>${s.note?`　${esc(s.note)}`:''}</li>`).join('');
  const v = el('foot-ver');
  if(v) v.textContent = `数据截止 ${META.cutoff} · ${META.version}`;
}

/* --- 真实照片挂载 ----------------------------------------------------- */
function pic(key, tag, w, note){
  const p = PHOTOS[key]; if(!p) return '';
  return `
    <figure class="fig">
      <span class="tag">${esc(tag)}</span>
      <img src="${CM + encodeURIComponent(p.file)}?width=${w}" alt="${esc(p.name)}"
           loading="lazy" width="${w}" height="${Math.round(w*0.667)}"
           referrerpolicy="no-referrer" style="aspect-ratio:3/2;object-fit:cover">
      <figcaption>
        <span><b>${esc(p.name)}</b>${p.year?' · '+esc(p.year):''}</span>
        <span>${esc(p.param)}</span>
      </figcaption>
    </figure>
    ${note && p.note ? `<p style="font-size:var(--step--1);color:var(--ink2);margin:var(--sp-2) 0 0">${esc(p.note)}</p>` : ''}`;
}

function renderPhotos(){
  // 01 层：三种形态对照组（不等大网格：第一张跨两栏）
  const h1 = el('photos01');
  if(h1) h1.innerHTML = `
    <div class="grid" style="grid-template-columns:repeat(2,1fr)">
      <div class="span2" style="padding:0">
        ${pic('palv','PL 03', 1280)}
        <p style="font-size:var(--step--1);color:var(--ink2);margin:var(--sp-2) var(--sp-3) var(--sp-3)">
          <strong>有车轮、有车灯、有保险杠、有车牌架。</strong>${esc(PHOTOS.palv.note)}
          这些部件都是车辆法规的产物，它们的存在意味着这台机器必须走车规认证——这正是第 03 层「双重合规」约束的来源。</p>
      </div>
      <div style="padding:0">
        ${pic('ehang','PL 04', 720)}
        <p style="font-size:var(--step--1);color:var(--ink2);margin:var(--sp-2) var(--sp-3) var(--sp-3)">
          <strong>没有车轮、没有车灯、没有保险杠。</strong>${esc(PHOTOS.ehang.note)}</p>
      </div>
      <div style="padding:0">
        ${pic('volocopter','PL 05', 720)}
        <p style="font-size:var(--step--1);color:var(--ink2);margin:var(--sp-2) var(--sp-3) var(--sp-3)">
          <strong>同样没有任何车辆部件，却摆在国际车展上。</strong>${esc(PHOTOS.volocopter.note)}</p>
      </div>
    </div>`;

  const m = { 'photo-ehang':['ehangSide','PL 06',640,0],
              'photo-curtiss':['curtiss','PL 07',640,1],
              'photo-aerocar':['aerocar','PL 08',640,1],
              'photo-alef':['alef','PL 09',640,0] };
  Object.entries(m).forEach(([id,[k,tag,w,n]]) => {
    const h = el(id); if(h) h.innerHTML = pic(k, tag, w, n);
  });
}

/* 图片来源与许可表 */
function renderPhotoCredits(){
  const host = el('credits'); if(!host) return;
  const seen = new Set();
  const rows = Object.values(PHOTOS).filter(p => {
    if(seen.has(p.file)) return false; seen.add(p.file); return true;
  });
  host.innerHTML = `
    <table>
      <thead><tr><th>图片</th><th>作者</th><th>许可</th><th>来源</th></tr></thead>
      <tbody>${rows.map(p => `
        <tr>
          <td>${esc(p.name)}</td>
          <td style="color:var(--ink2)">${esc(p.by)}</td>
          <td style="font-family:var(--mono);font-size:11px">${esc(p.lic)}</td>
          <td><a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.file)}"
                 target="_blank" rel="noopener">Wikimedia Commons</a></td>
        </tr>`).join('')}</tbody>
    </table>
    <p style="font:11px/1.65 var(--mono);color:var(--ink3);margin:var(--sp-2) 0 0">
      CC BY-SA 许可的图片按原许可署名，未作修改。视频为 B 站官方播放器嵌入，版权归原 UP 主所有。
    </p>`;
}

/* =====================================================================
   启动
   ===================================================================== */
function boot2(){
  renderDecouple(); renderAlloc(); renderTransfer();
  renderSlips(); renderOrders(); renderCertCompare(); renderPlate();
  renderRanges(); renderScenarios();
  renderTerms(); renderDrift(); renderZYJ(); renderAxes(); renderCarness();
  renderReuse(); renderOEMs(); renderParadigm(); renderPart103(); renderQuiz();
  renderWindows(); renderFalsify();
  renderCounter(); renderSources();
  renderPhotos(); renderPhotoCredits();
}
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot2)
  : boot2();
})();
