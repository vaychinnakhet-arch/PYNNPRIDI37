function openExteriorPaintingModal(no, task) {
  let modal = document.getElementById("exterior-painting-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "exterior-painting-modal";
    modal.className = "modal fixed inset-0 w-full h-full items-center justify-center z-50 flex backdrop-blur-sm";
    modal.style.display = "none";
    modal.innerHTML = `
      <div class="modal-overlay absolute inset-0 bg-slate-900/60" onclick="closeExteriorPaintingModal()"></div>
      <div class="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 relative z-10 flex flex-col overflow-hidden p-6">
        <h3 id="ep-modal-title" class="text-xl font-bold mb-4">อัพเดทข้อมูล</h3>
        <div class="mb-4">
           <label class="block text-sm font-semibold text-slate-700 mb-1">วันที่เสร็จสิ้น</label>
           <input type="date" id="ep-modal-date" class="w-full border border-slate-300 rounded-lg p-2" />
        </div>
        <div class="mb-6 flex items-center gap-2">
           <input type="checkbox" id="ep-modal-completed" class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
           <label for="ep-modal-completed" class="text-sm font-medium text-slate-700">อัพเดทเป็น "แล้วเสร็จ" 100%</label>
        </div>
        <div class="flex gap-2 justify-end">
           <button class="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-bold" onclick="closeExteriorPaintingModal()">ยกเลิก</button>
           <button class="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold" onclick="saveExteriorPainting()">บันทึก</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  document.getElementById("ep-modal-title").textContent = `อัพเดท NO.${no} - ${task}`;
  
  const currentData = projectData.exteriorPainting[no]?.[task] || {};
  
  // Format date if it exists and looks like "10 ต.ค. 68" -> Wait, HTML date input needs YYYY-MM-DD.
  // The user expects to input a date. If we use `<input type="date">`, it gives YYYY-MM-DD. We can format it to Thai text when rendering.
  document.getElementById("ep-modal-date").value = currentData.rawDate || "";
  document.getElementById("ep-modal-completed").checked = currentData.isCompleted || false;
  
  modal.dataset.no = no;
  modal.dataset.task = task;
  
  modal.style.display = "flex";
  document.body.classList.add("modal-open");
}

function closeExteriorPaintingModal() {
  const modal = document.getElementById("exterior-painting-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  }
}

function saveExteriorPainting() {
  const modal = document.getElementById("exterior-painting-modal");
  const no = modal.dataset.no;
  const task = modal.dataset.task;
  
  const rawDate = document.getElementById("ep-modal-date").value;
  const isCompleted = document.getElementById("ep-modal-completed").checked;
  
  let formattedDate = "";
  if (rawDate) {
    const d = new Date(rawDate);
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    formattedDate = `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
    // User requested "68" for year, 543 diff is Thai year. 
    // Wait, 2025 + 543 = 2568 -> "68". 
    const shortYear = String(d.getFullYear() + 543).slice(-2);
    formattedDate = `${d.getDate()} ${thaiMonths[d.getMonth()]} ${shortYear}`;
  }
  
  if (!projectData.exteriorPainting[no]) projectData.exteriorPainting[no] = {};
  projectData.exteriorPainting[no][task] = {
    rawDate: rawDate,
    date: formattedDate,
    isCompleted: isCompleted
  };
  
  // Save to Firebase
  updateFirebaseExteriorPainting(no, task, projectData.exteriorPainting[no][task]);
  
  closeExteriorPaintingModal();
  renderExteriorPaintingPlanTable();
}

function updateFirebaseExteriorPainting(no, task, data) {
  if (typeof db !== "undefined" && typeof doc !== "undefined" && typeof setDoc !== "undefined") {
    // In real app, we need the project ID. Use existing helper if available.
    // Let's assume we can use currentProjectId
    const projectRef = doc(db, "projects", currentProjectId);
    
    // We will update just the exteriorPainting field.
    // Firestore allows dot notation for nested fields.
    const updatePath = `exteriorPainting.${no}.${task}`;
    // Actually setDoc with merge:true or updateDoc
    import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js").then((firestore) => {
        firestore.setDoc(projectRef, {
            exteriorPainting: {
                [no]: {
                    [task]: data
                }
            }
        }, { merge: true }).catch(err => console.error("Error saving to Firebase:", err));
    });
  }
}
