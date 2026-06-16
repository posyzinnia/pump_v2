// State management
let state = {
  pumpType: "borehole",
  verticalHead: 0,
  pipeHead: 0,
  deliveryHead: 0,
  deliveryType: "",
};

// Switch pump type function
function switchPump(type, btn) {
  document
    .querySelectorAll(".pump-content")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".pump-tab")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById("pump-" + type).classList.add("active");
  btn.classList.add("active");
}

// Select pump type for calculator
function selectPumpType(type) {
  state.pumpType = type;

  // Update button states
  if (type === "borehole") {
    document.getElementById("btn-borehole").classList.add("btn-primary");
    document.getElementById("btn-borehole").classList.remove("btn-secondary");
    document.getElementById("btn-centrifugal").classList.remove("btn-primary");
    document.getElementById("btn-centrifugal").classList.add("btn-secondary");
    document.getElementById("calc-borehole").classList.add("active");
    document.getElementById("calc-centrifugal").classList.remove("active");
  } else {
    document.getElementById("btn-centrifugal").classList.add("btn-primary");
    document
      .getElementById("btn-centrifugal")
      .classList.remove("btn-secondary");
    document.getElementById("btn-borehole").classList.remove("btn-primary");
    document.getElementById("btn-borehole").classList.add("btn-secondary");
    document.getElementById("calc-centrifugal").classList.add("active");
    document.getElementById("calc-borehole").classList.remove("active");
  }
}

// Calculate borehole head
function calculateBorehead() {
  const depth = parseFloat(document.getElementById("bore-depth").value) || 0;
  const waterLevel =
    parseFloat(document.getElementById("bore-water-level").value) || 0;
  const deliveryHeight =
    parseFloat(document.getElementById("bore-delivery-height").value) || 0;

  const head = depth + waterLevel + deliveryHeight;
  state.verticalHead = head;

  document.getElementById("bore-result").style.display = "block";
  document.getElementById("bore-result-value").textContent = head.toFixed(2);
  document.getElementById("bore-calc-show").innerHTML =
    `<span class="fval">${depth}</span> + <span class="fval">${waterLevel}</span> + <span class="fval">${deliveryHeight}</span> = <span class="fval result">${head.toFixed(2)} ม.</span>`;

  scrollToElement("bore-result");
}

// Calculate centrifugal head
function calculateCenthead() {
  const suctionDepth =
    parseFloat(document.getElementById("cent-suction-depth").value) || 0;
  const deliveryHeight =
    parseFloat(document.getElementById("cent-delivery-height").value) || 0;

  const head = suctionDepth + deliveryHeight;
  state.verticalHead = head;

  document.getElementById("cent-result").style.display = "block";
  document.getElementById("cent-result-value").textContent = head.toFixed(2);
  document.getElementById("cent-calc-show").innerHTML =
    `<span class="fval">${suctionDepth}</span> + <span class="fval">${deliveryHeight}</span> = <span class="fval result">${head.toFixed(2)} ม.</span>`;

  scrollToElement("cent-result");
}

// Calculate pipe head
function calculatePipeHead() {
  const length = parseFloat(document.getElementById("pipe-length").value) || 0;
  const size = document.getElementById("pipe-size").value;

  if (!size) {
    alert("⚠️ โปรดเลือกขนาดท่อก่อน");
    return;
  }

  const divisors = { 1.5: 15, 2: 20, 3: 30, 4: 40 };
  const divisor = divisors[size];
  const head = length / divisor;
  state.pipeHead = head;

  document.getElementById("pipe-result").style.display = "block";
  document.getElementById("pipe-result-value").textContent = head.toFixed(2);
  document.getElementById("pipe-calc-show").innerHTML =
    `<span class="fval orange">${length}</span> ÷ <span class="fval orange">${divisor}</span> = <span class="fval result orange">${head.toFixed(2)} ม.</span>`;

  scrollToElement("pipe-result");
}

// Update delivery head input visibility
function updateDeliveryHead() {
  const type = document.getElementById("delivery-type").value;
  const input = document.getElementById("pressure-input");
  const result = document.getElementById("delivery-result");

  state.deliveryType = type;

  if (type === "0") {
    state.deliveryHead = 0;
    input.style.display = "none";
    result.style.display = "none";
  } else if (type === "manual" || type === "sprinkler") {
    input.style.display = "block";
    result.style.display = "none";
  }
}

// Calculate delivery head
function calculateDeliveryHead() {
  const pressure =
    parseFloat(document.getElementById("delivery-pressure").value) || 0;
  const head = pressure * 10;
  state.deliveryHead = head;

  document.getElementById("delivery-result").style.display = "block";
  document.getElementById("delivery-result-value").textContent =
    head.toFixed(2);
  document.getElementById("delivery-calc-show").innerHTML =
    `<span class="fval purple">${pressure}</span> บาร์ × <span class="fval purple">10</span> = <span class="fval result purple">${head.toFixed(2)} ม.</span>`;

  scrollToElement("delivery-result");
}

// Calculate total head
function calculateTotalHead() {
  const vertical = state.verticalHead || 0;
  const pipe = state.pipeHead || 0;
  const delivery = state.deliveryHead || 0;
  const total = vertical + pipe + delivery;
  const recommended = (total * 1.43).toFixed(2); // 70% rule

  document.getElementById("total-result").style.display = "block";
  document.getElementById("summary-vertical").textContent =
    vertical.toFixed(2) + " ม.";
  document.getElementById("summary-pipe").textContent = pipe.toFixed(2) + " ม.";
  document.getElementById("summary-delivery").textContent =
    delivery.toFixed(2) + " ม.";
  document.getElementById("summary-total").textContent = total.toFixed(2);
  document.getElementById("recommended-head").textContent = recommended;

  renderPumpCards(total);
  document.getElementById("pump-select-card").style.display = "block";
  scrollToElement("total-result");
}

// Render pump selection cards — only show pumps matching the selected type AND whose Head Max >= totalHead
function renderPumpCards(totalHead) {
  const grid = document.getElementById("pump-cards-grid");
  grid.innerHTML = "";

  // Hide chart and result until a card is picked
  document.getElementById("pump-curve-canvas-wrapper").style.display = "none";
  document.getElementById("pump-flow-result").style.display = "none";
  document.getElementById("pump-info-panel").style.display = "none";
  if (pumpChart) {
    pumpChart.destroy();
    pumpChart = null;
  }
  state.selectedPump = null;

  const activeType = state.pumpType; // 'borehole' or 'centrifugal'
  const typeLabel =
    activeType === "borehole" ? "🔩 ปั๊มบาดาล" : "⚙️ ปั๊มหอยโข่ง";

  // Section label
  const label = document.createElement("p");
  label.style.cssText =
    "font-size:15px;font-weight:700;color:var(--green-dark);margin-bottom:12px;";
  label.textContent = `${typeLabel} ที่รองรับ Head ≥ ${totalHead.toFixed(1)} ม.`;
  grid.appendChild(label);

  let count = 0;
  Object.entries(PUMP_DATA).forEach(([name, data]) => {
    if (data.type !== activeType) return; // wrong pump type — skip
    const maxHead = Math.max(...data.head);
    if (maxHead < totalHead) return; // can't handle the head — skip

    const maxFlow = Math.max(...data.flow);
    const estimatedFlow = getFlowAtHead(name, totalHead);
    const price = data.price;
    const power = data.power;
    const po = data.po;
    count++;

    const card = document.createElement("div");
    card.className = "pump-model-card";
    card.dataset.pump = name;
    card.innerHTML = `
                    <div class="pump-card-name">${name}</div>
                    <div class="pump-card-stats">
                        <div class="pump-card-stat">
                            <span>รหัส</span>
                            <strong>${power}</strong>
                        </div>
                        <div class="pump-card-stat">
                            <span>รูปแบบท่อ</span>
                            <strong>${po}</strong>
                        </div>
                    </div>
                    <div class="pump-card-flow-badge">
                        ≈ ${estimatedFlow !== null ? estimatedFlow.toFixed(2) + " ม³(คิว)/ชม" : "-"}
                    </div>
                    <div class="pump-card-flow-badge-orange">
                        ${Number(price).toLocaleString('en-US')} บาท
                    </div>
                `;
    card.addEventListener("click", () => selectPumpCard(name, card));
    grid.appendChild(card);
  });

  if (count === 0) {
    const warn = document.createElement("p");
    warn.style.cssText =
      "color:var(--orange);font-weight:700;font-size:14px;grid-column:1/-1;";
    warn.textContent = `⚠️ ไม่มีปั๊ม${typeLabel}ในรายการที่รองรับ Head ${totalHead.toFixed(1)} เมตรได้`;
    grid.appendChild(warn);
  }
}

// Scroll helper
function scrollToElement(id) {
  setTimeout(() => {
    document
      .getElementById(id)
      .scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
}

// Sticky nav highlighting
window.addEventListener("scroll", () => {
  const sections = ["part1", "part2", "part3", "calculator"];
  let currentSection = sections[0];

  sections.forEach((section) => {
    const elem = document.getElementById(section);
    if (elem && window.scrollY >= elem.offsetTop - 200) {
      currentSection = section;
    }
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
    if (link.dataset.section === currentSection) {
      link.classList.add("active");
    }
  });
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  selectPumpType("borehole");
});

// ── PUMP CURVE LOGIC ──
let pumpChart = null;

// Linear interpolation between two points
function interpolate(x0, y0, x1, y1, x) {
  if (x1 === x0) return y0;
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

// Given a head value, find the corresponding flow on the pump curve
function getFlowAtHead(pumpName, targetHead) {
  const data = PUMP_DATA[pumpName];
  if (!data) return null;
  const heads = data.head;
  const flows = data.flow;
  const maxHead = Math.max(...heads);
  if (targetHead > maxHead) return null;
  if (targetHead <= 0) return Math.max(...flows);
  for (let i = 0; i < heads.length - 1; i++) {
    const h0 = heads[i],
      h1 = heads[i + 1];
    if (targetHead <= h0 && targetHead >= h1) {
      return interpolate(h0, flows[i], h1, flows[i + 1], targetHead);
    }
  }
  return null;
}

// Generate smooth curve points
function generateCurvePoints(pumpName, steps) {
  const data = PUMP_DATA[pumpName];
  const flows = data.flow,
    heads = data.head;
  const maxFlow = Math.max(...flows);
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const f = (maxFlow / steps) * i;
    for (let j = 0; j < flows.length - 1; j++) {
      if (f >= flows[j] && f <= flows[j + 1]) {
        const h = interpolate(
          flows[j],
          heads[j],
          flows[j + 1],
          heads[j + 1],
          f,
        );
        pts.push({ x: parseFloat(f.toFixed(3)), y: parseFloat(h.toFixed(2)) });
        break;
      }
    }
  }
  return pts;
}

// Handle card click — highlight selected card and draw chart
function selectPumpCard(pumpName, cardEl) {
  document
    .querySelectorAll(".pump-model-card")
    .forEach((c) => c.classList.remove("selected"));
  cardEl.classList.add("selected");
  state.selectedPump = pumpName;
  drawPumpCurve(pumpName);
  updatePumpInfoPanel(pumpName);
  setTimeout(() => {
    document
      .getElementById("pump-curve-canvas-wrapper")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  }, 150);
}

// Pump type descriptions and images
const PUMP_TYPE_INFO = {
  borehole: {
    label: "🔩 ปั๊มบาดาล",
    badgeClass: "borehole",
    images: [
      "./image/borehole/borehole_ex.png",
      "./image/borehole/borehole_ex2.png",
    ],
    desc: `ปั๊มบาดาลเป็นปั๊มแบบจุ่มน้ำ (Submersible Pump) ออกแบบมาสำหรับสูบน้ำจากบ่อบาดาลหรือบ่อลึก ทำงานใต้น้ำได้โดยตรง มีประสิทธิภาพสูงและทนทานต่อสภาวะใต้ดิน เหมาะสำหรับระบบน้ำเกษตร ประปาหมู่บ้าน และการส่งน้ำระยะไกลในแนวดิ่ง`,
  },
  centrifugal: {
    label: "⚙️ ปั๊มหอยโข่ง",
    badgeClass: "centrifugal",
    images: [
      "./image/centri/centri_ex.png",
      "./image/centri/centri_ex2.png",
    ],
    desc: `ปั๊มหอยโข่ง (Centrifugal Pump) ทำงานด้วยแรงหมุนเวียน เหมาะสำหรับแหล่งน้ำผิวดิน เช่น สระ คลอง หรือถังเก็บน้ำ ติดตั้งง่าย บำรุงรักษาสะดวก เหมาะกับงานส่งน้ำปริมาณมากในระยะทางไม่ไกลมาก`,
  },
};

// Update pump info panel
function updatePumpInfoPanel(pumpName) {
  const data = PUMP_DATA[pumpName];
  if (!data) return;

  const typeInfo = PUMP_TYPE_INFO[data.type];
  const maxHead = Math.max(...data.head).toFixed(0);
  const maxFlow = Math.max(...data.flow).toFixed(1);
  const totalHead = (
    (state.verticalHead || 0) +
    (state.pipeHead || 0) +
    (state.deliveryHead || 0)
  );
  const estimatedFlow = getFlowAtHead(pumpName, totalHead);

  // Choose image based on type
  const imgEl = document.getElementById("pump-info-img");
  imgEl.src = typeInfo.images[0];
  imgEl.alt = typeInfo.label;

  // Name
  document.getElementById("pump-info-name").textContent = pumpName;

  // Badge
  document.getElementById("pump-info-type-badge").innerHTML =
    `<span class="pump-info-badge ${typeInfo.badgeClass}">${typeInfo.label}</span>` +
    `<span class="pump-info-badge" style="background:#fff7e0;color:#b8860b;border:1.5px solid #e0c040;">฿${Number(data.price).toLocaleString("en-US")} บาท</span>`;

  // Table rows
  const rows = [
    ["รหัสสินค้า", data.power],
    ["รูปแบบท่อ", data.po],
    ["Head สูงสุด", `${maxHead} เมตร`],
    ["อัตราการไหลสูงสุด", `${maxFlow} ม³/ชม`],
    ["อัตราการไหล ณ Head ที่คำนวณ",
      estimatedFlow !== null
        ? `${estimatedFlow.toFixed(2)} ม³/ชม ≈ ${((estimatedFlow * 1000) / 60).toFixed(0)} ลิตร/นาที`
        : "เกิน Head Max"
    ],
  ];

  const tbody = document.getElementById("pump-info-table-body");
  tbody.innerHTML = rows
    .map(([label, val]) => `<tr><td>${label}</td><td>${val}</td></tr>`)
    .join("");

  // Description
  document.getElementById("pump-info-desc").textContent = typeInfo.desc;

  // Show panel
  const panel = document.getElementById("pump-info-panel");
  panel.style.display = "block";
  setTimeout(() => {
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 200);
}

function drawPumpCurve(pumpName) {
  if (!pumpName) return;
  const canvasWrapper = document.getElementById("pump-curve-canvas-wrapper");
  const flowResult = document.getElementById("pump-flow-result");
  const flowLabel = document.getElementById("pump-flow-label");
  const flowValue = document.getElementById("pump-flow-value");
  const flowUnit = document.getElementById("pump-flow-unit");

  const totalHead =
    (state.verticalHead || 0) +
    (state.pipeHead || 0) +
    (state.deliveryHead || 0);
  const data = PUMP_DATA[pumpName];
  const maxHead = Math.max(...data.head);
  const maxFlow = Math.max(...data.flow);

  const curvePoints = generateCurvePoints(pumpName, 120);
  const headLinePoints = [
    { x: 0, y: totalHead },
    { x: maxFlow, y: totalHead },
  ];
  const estimatedFlow = getFlowAtHead(pumpName, totalHead);
  const intersectionDataset =
    estimatedFlow !== null
      ? [
          {
            x: parseFloat(estimatedFlow.toFixed(2)),
            y: parseFloat(totalHead.toFixed(2)),
          },
        ]
      : [];

  canvasWrapper.style.display = "block";
  if (pumpChart) {
    pumpChart.destroy();
    pumpChart = null;
  }

  const ctx = document.getElementById("pumpCurveChart").getContext("2d");
  pumpChart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "เส้นโค้งประสิทธิภาพปั๊ม",
          data: curvePoints,
          type: "line",
          borderColor: "#1B4D35",
          backgroundColor: "rgba(27,77,53,0.08)",
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          order: 3,
        },
        {
          label: "Head ที่ต้องการ (" + totalHead.toFixed(1) + " ม.)",
          data: headLinePoints,
          type: "line",
          borderColor: "#E07A2F",
          borderWidth: 2,
          borderDash: [8, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 2,
        },
        {
          label: "จุดทำงาน",
          data: intersectionDataset,
          type: "scatter",
          backgroundColor: "#F5C842",
          borderColor: "#1B4D35",
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 10,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `อัตราการไหล: ${ctx.parsed.x.toFixed(2)} ม³/ชม.  |  Head: ${ctx.parsed.y.toFixed(1)} ม.`,
          },
        },
        title: {
          display: true,
          text: "กราฟประสิทธิภาพ: " + pumpName,
          font: { family: "Sarabun", size: 14, weight: "700" },
          color: "#1B4D35",
          padding: { bottom: 12 },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "อัตราการไหล (ม³/ชั่วโมง)",
            font: { family: "Sarabun", size: 13 },
            color: "#5A6A5E",
          },
          min: 0,
          grid: { color: "rgba(0,0,0,0.05)" },
        },
        y: {
          title: {
            display: true,
            text: "หัวน้ำ / Head (เมตร)",
            font: { family: "Sarabun", size: 13 },
            color: "#5A6A5E",
          },
          min: 0,
          grid: { color: "rgba(0,0,0,0.05)" },
        },
      },
    },
  });

  flowResult.style.display = "block";
  if (estimatedFlow !== null) {
    flowResult.className = "pump-flow-result ok";
    flowLabel.textContent =
      "✅ อัตราการไหลที่ Head " + totalHead.toFixed(1) + " เมตร รูปแบบการจ่ายน้ำ ปากท่อ PVC";
    flowValue.textContent = estimatedFlow.toFixed(2) + " ม³/ชม.";
    flowUnit.textContent =
      "≈ " + ((estimatedFlow * 1000) / 60).toFixed(0) + " ลิตร/นาที";
    // Show zone calculator and seed the flow value
    state.pumpFlow = estimatedFlow;
    showZoneCalc();
  } else {
    flowResult.className = "pump-flow-result warn";
    flowLabel.textContent = "⚠️ Head สูงเกินขีดจำกัดของปั๊มรุ่นนี้";
    flowValue.textContent = "Head Max: " + maxHead.toFixed(0) + " ม.";
    flowUnit.textContent = "กรุณาเลือกปั๊มรุ่นอื่น";
    document.getElementById("zone-calc-section").classList.remove("active");
  }
}
// ── ZONE / DISTRIBUTION CALCULATOR ──

function showZoneCalc() {
  const section = document.getElementById("zone-calc-section");
  section.classList.add("active");
  calcDripperZone();
  calcSprinklerZone();
}

function switchZoneTab(tab, btn) {
  document
    .querySelectorAll(".zone-tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".zone-tab-content")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("zone-tab-" + tab).classList.add("active");
}

function calcDripperZone() {
  const flow = state.pumpFlow || 0;
  const raiPerPump = flow / 6;

  const raiRes = document.getElementById("dripper-rai-result");
  raiRes.style.display = "block";
  raiRes.innerHTML = `ปั๊มนี้รองรับได้ประมาณ <strong>${raiPerPump.toFixed(2)} ไร่</strong> ต่อการทำงาน 1 รอบ`;

  const totalRai = parseFloat(
    document.getElementById("dripper-total-rai").value,
  );
  const zoneBox = document.getElementById("dripper-zone-result");
  const zoneVal = document.getElementById("dripper-zone-value");
  const zoneNote = document.getElementById("dripper-zone-note");

  if (!totalRai || totalRai <= 0 || raiPerPump <= 0) {
    zoneBox.style.display = "none";
    return;
  }

  const zonesRounded = Math.ceil(totalRai / raiPerPump);
  zoneBox.style.display = "block";
  zoneVal.textContent = zonesRounded;
  if (zonesRounded <= 1) {
    zoneNote.textContent = `✅ ปั๊มรองรับพื้นที่ทั้งหมดได้ในรอบเดียว (${totalRai} ไร่ ≤ ${raiPerPump.toFixed(2)} ไร่/รอบ)`;
  } else {
    zoneNote.textContent = `แบ่งเป็น ${zonesRounded} โซน — รดน้ำโซนละ ${(totalRai / zonesRounded).toFixed(2)} ไร่ต่อรอบ เพื่อประสิทธิภาพสูงสุด`;
  }
}

function calcSprinklerZone() {
  const flow = state.pumpFlow || 0;
  const lph = parseFloat(document.getElementById("sprinkler-lph").value);

  const cmsRes = document.getElementById("sprinkler-cms-result");
  const headsRes = document.getElementById("sprinkler-heads-result");
  const zoneBox = document.getElementById("sprinkler-zone-result");

  if (!lph || lph <= 0) {
    cmsRes.style.display = "none";
    headsRes.style.display = "none";
    zoneBox.style.display = "none";
    return;
  }

  const flowPerHead = lph / 1000;
  cmsRes.style.display = "block";
  cmsRes.innerHTML = `${lph} L/H = <strong>${flowPerHead.toFixed(4)} คิว/ชม</strong> ต่อหัว`;

  const headsPerPump = flowPerHead > 0 ? Math.floor(flow / flowPerHead) : 0;
  headsRes.style.display = "block";
  headsRes.innerHTML = `ปั๊มนี้รองรับได้ประมาณ <strong>${headsPerPump} หัว</strong> ต่อการทำงาน 1 รอบ`;

  const totalHeads = parseFloat(
    document.getElementById("sprinkler-total-heads").value,
  );
  if (!totalHeads || totalHeads <= 0 || headsPerPump <= 0) {
    zoneBox.style.display = "none";
    return;
  }

  const zonesRounded = Math.ceil(totalHeads / headsPerPump);
  const zoneVal = document.getElementById("sprinkler-zone-value");
  const zoneNote = document.getElementById("sprinkler-zone-note");

  zoneBox.style.display = "block";
  zoneVal.textContent = zonesRounded;
  if (zonesRounded <= 1) {
    zoneNote.textContent = `✅ ปั๊มรองรับหัวสปริงเกอร์ทั้งหมดได้ในรอบเดียว (${totalHeads} หัว ≤ ${headsPerPump} หัว/รอบ)`;
  } else {
    zoneNote.textContent = `แบ่งเป็น ${zonesRounded} โซน — โซนละ ~${Math.ceil(totalHeads / zonesRounded)} หัวต่อรอบ เพื่อประสิทธิภาพสูงสุด`;
  }
}
