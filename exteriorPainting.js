function renderExteriorPaintingPlanTable() {
  const mainTable = document.getElementById("main-table");
  mainTable.innerHTML = "";
  mainTable.classList.remove("hidden");
  
  // Clean border classes
  mainTable.classList.remove("border-collapse", "border-separate", "border-spacing-0");
  mainTable.classList.add("border-collapse");
  
  const reportHeader = document.getElementById("report-header");
  if (reportHeader) reportHeader.classList.remove("hidden");
  
  if (!projectData.exteriorPainting) projectData.exteriorPainting = {};
  
  const tasks = [
    { key: "joint", name: "ขัดแต่งรอยต่อ" },
    { key: "primer", name: "ทาสีรองพื้น" },
    { key: "waterTest", name: "เทสน้ำ" },
    { key: "topcoat", name: "ทาสีจริง" }
  ];
  
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr class="bg-sky-100">
      <th class="border border-slate-400 p-2 text-slate-800 font-bold w-20 sticky left-0 z-10 bg-sky-100">NO.</th>
      ${tasks.map(t => `<th class="border border-slate-400 p-2 text-slate-800 font-bold">${t.name}</th>`).join('')}
    </tr>
  `;
  mainTable.appendChild(thead);
  
  const tbody = document.createElement("tbody");
  for (let i = 1; i <= 37; i++) {
    const row = document.createElement("tr");
    row.className = "hover:bg-slate-50 transition-colors";
    
    // NO. Column
    row.innerHTML = `<td class="border border-slate-300 p-2 text-center font-bold text-slate-700 bg-white sticky left-0 shadow-[1px_0_0_0_#cbd5e1]">${i}</td>`;
    
    // Task Columns
    tasks.forEach(t => {
      const data = projectData.exteriorPainting[i]?.[t.key];
      let text = data?.date || "";
      let classList = "border border-slate-300 p-2 text-center cursor-pointer min-w-[120px] table-cell";
      
      if (data?.isCompleted) {
         classList += " bg-emerald-100 text-emerald-700 font-bold";
         text = "แล้วเสร็จ";
      } else if (text) {
         classList += " font-medium text-slate-600";
      }
      
      row.innerHTML += `<td class="${classList}" data-ep-no="${i}" data-ep-task="${t.key}" data-ep-taskname="${t.name}">${text}</td>`;
    });
    tbody.appendChild(row);
  }
  
  mainTable.appendChild(tbody);
}

window.openExteriorPaintingModalForMultiSelect = function(selectedCells) {
  let modal = document.getElementById("ep-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "ep-modal";
    modal.className = "modal fixed inset-0 w-full h-full items-center justify-center z-[70] flex backdrop-blur-sm";
    modal.style.display = "none";
    modal.innerHTML = `
      <div class="modal-overlay absolute inset-0 bg-slate-900/60" onclick="closeExteriorPaintingModal()"></div>
      <div class="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 relative z-10 flex flex-col p-6 overflow-hidden">
        <h3 id="ep-modal-title" class="text-xl font-bold mb-4 text-slate-800">อัพเดทข้อมูล</h3>
        
        <div class="mb-4">
           <label class="block text-sm font-semibold text-slate-700 mb-2">วันที่เสร็จสิ้น</label>
           <input type="date" id="ep-modal-date" class="w-full border border-slate-300 rounded-xl p-3 text-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        
        <div class="mb-6 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
           <input type="checkbox" id="ep-modal-completed" class="w-6 h-6 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
           <label for="ep-modal-completed" class="text-base font-bold text-slate-700 cursor-pointer select-none flex-1">แล้วเสร็จ 100%</label>
        </div>
        
        <div class="flex justify-between items-center mt-2">
           <button class="px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-lg transition-colors" onclick="clearExteriorPaintingData()">ล้างข้อมูล</button>
           <div class="flex gap-2">
             <button class="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors" onclick="closeExteriorPaintingModal()">ยกเลิก</button>
             <button class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95" onclick="saveExteriorPainting()">บันทึก</button>
           </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  const count = selectedCells.size;
  if (count === 1) {
    const td = selectedCells.values().next().value;
    const no = td.dataset.epNo;
    const taskName = td.dataset.epTaskname;
    document.getElementById("ep-modal-title").textContent = `NO.${no} - ${taskName}`;
    const taskKey = td.dataset.epTask;
    const currentData = projectData.exteriorPainting?.[no]?.[taskKey] || {};
    document.getElementById("ep-modal-date").value = currentData.rawDate || "";
    document.getElementById("ep-modal-completed").checked = currentData.isCompleted || false;
  } else {
    document.getElementById("ep-modal-title").textContent = `อัพเดทข้อมูล ${count} รายการ`;
    document.getElementById("ep-modal-date").value = "";
    document.getElementById("ep-modal-completed").checked = false;
  }
  
  modal.style.display = "flex";
  document.body.classList.add("modal-open");
}

window.closeExteriorPaintingModal = function() {
  const modal = document.getElementById("ep-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  }
  if (typeof clearSelection === 'function') {
    clearSelection();
  }
}

window.saveExteriorPainting = function() {
  const rawDate = document.getElementById("ep-modal-date").value;
  const isCompleted = document.getElementById("ep-modal-completed").checked;
  
  let formattedDate = "";
  if (rawDate) {
    const d = new Date(rawDate);
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const shortYear = String(d.getFullYear() + 543).slice(-2);
    formattedDate = `${d.getDate()} ${thaiMonths[d.getMonth()]} ${shortYear}`;
  }
  
  if (!projectData.exteriorPainting) projectData.exteriorPainting = {};
  
  selectedCells.forEach(td => {
    const no = td.dataset.epNo;
    const taskKey = td.dataset.epTask;
    
    if (!projectData.exteriorPainting[no]) projectData.exteriorPainting[no] = {};
    
    projectData.exteriorPainting[no][taskKey] = {
      rawDate: rawDate,
      date: formattedDate,
      isCompleted: isCompleted
    };
  });
  
  saveProjectDataToDB();
  closeExteriorPaintingModal();
  renderExteriorPaintingPlanTable();
}

window.clearExteriorPaintingData = function() {
  selectedCells.forEach(td => {
    const no = td.dataset.epNo;
    const taskKey = td.dataset.epTask;
    
    if (projectData.exteriorPainting && projectData.exteriorPainting[no]) {
      delete projectData.exteriorPainting[no][taskKey];
    }
  });
  
  saveProjectDataToDB();
  closeExteriorPaintingModal();
  renderExteriorPaintingPlanTable();
}
